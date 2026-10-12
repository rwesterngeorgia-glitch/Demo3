import { describe, it, expect } from "vitest";
import {
  applyAction,
  convert,
  csv,
  quantity,
  recipeCost,
  round,
  uid,
} from "../src/domain";
import { seed } from "../src/seed";
import type { Action } from "../src/types";
const move = (
  patch: Partial<Extract<Action, { type: "move" }>> = {},
): Extract<Action, { type: "move" }> => ({
  type: "move",
  kind: "Incoming",
  product: "p1",
  location: "Main bar",
  quantity: 1,
  unit: "bottle",
  reason: "Test reconciliation",
  actor: "Test · Manager",
  ...patch,
});
describe("inventory transaction rules", () => {
  it("creates an item, opening ledger and correct valuation", () => {
    const s = seed(),
      p = { ...s.products[0], id: "new", name: "New spirit", sku: "NEW" };
    const next = applyAction(s, {
      type: "product",
      product: p,
      quantity: 5,
      location: "Storage room",
      actor: "Test",
    });
    expect(quantity(next, "new")).toBe(5);
    expect(next.movements[0]).toMatchObject({ before: 0, after: 5, delta: 5 });
    expect(quantity(next, "new") * p.cost).toBe(120);
  });
  it("converts cases and fractional bottle measurements", () => {
    const p = seed().products[0];
    expect(convert(p, 2, "case")).toBe(12);
    expect(convert(p, 60, "ml")).toBe(0.08);
    expect(() => convert(p, 1, "kg")).toThrow("incompatible");
  });
  it("converts kilograms and liters only within compatible dimensions", () => {
    const s = seed();
    expect(
      convert(
        s.products.find((p) => p.id === "p20")!,
        180,
        "g",
      ),
    ).toBe(0.18);
    expect(
      convert(
        s.products.find((p) => p.id === "p14")!,
        30,
        "ml",
      ),
    ).toBe(0.03);
  });
  it("transfers atomically without changing company stock", () => {
    const s = seed(),
      total = quantity(s, "p1"),
      before = quantity(s, "p1", "Main bar");
    const next = applyAction(
      s,
      move({ kind: "Transfer", quantity: 2, destination: "Storage room" }),
    );
    expect(quantity(next, "p1")).toBeCloseTo(total, 6);
    expect(quantity(next, "p1", "Main bar")).toBe(round(before - 2));
    expect(next.movements.slice(0, 2).map((m) => m.group)).toEqual([
      next.movements[0].group,
      next.movements[0].group,
    ]);
  });
  it("rejects negative stock without changing the original state", () => {
    const s = seed(),
      copy = structuredClone(s);
    expect(() =>
      applyAction(s, move({ kind: "Waste", quantity: 900 })),
    ).toThrow("Insufficient");
    expect(s).toEqual(copy);
  });
  it("waste records historic unit cost and reduces stock", () => {
    const s = seed(),
      next = applyAction(s, move({ kind: "Waste", quantity: 1 }));
    expect(quantity(next, "p1")).toBeCloseTo(quantity(s, "p1") - 1);
    expect(next.movements[0].cost).toBe(24);
    expect(next.movements[0].type).toBe("Waste");
  });
  it("physical counts reconcile delta and allow zero", () => {
    const s = seed(),
      next = applyAction(s, move({ kind: "Count", quantity: 0 }));
    expect(quantity(next, "p1", "Main bar")).toBe(0);
    expect(next.movements[0].delta).toBe(-quantity(s, "p1", "Main bar"));
  });
  it("supports signed adjustments and rejects invalid numbers", () => {
    const s = seed();
    expect(
      applyAction(s, move({ kind: "Adjustment", quantity: -1 })).movements[0]
        .delta,
    ).toBe(-1);
    for (const n of [NaN, Infinity, -3, 0])
      expect(() => applyAction(s, move({ quantity: n }))).toThrow();
  });
  it("partial delivery updates balance once and rejects replay", () => {
    const s = seed(),
      before = quantity(s, "p1");
    const action: Action = {
      type: "receive",
      id: "PO-1042",
      quantities: [3, 0],
      receipt: "delivery-1",
      actor: "Test",
    };
    const next = applyAction(s, action);
    expect(quantity(next, "p1")).toBeCloseTo(before + 3);
    expect(next.orders.find((o) => o.id === "PO-1042")!.status).toBe(
      "Partially received",
    );
    expect(() => applyAction(next, action)).toThrow("already");
    const full = applyAction(next, {
      ...action,
      receipt: "delivery-2",
      quantities: [9, 48],
    });
    expect(full.orders.find((o) => o.id === "PO-1042")!.status).toBe(
      "Received",
    );
    expect(() =>
      applyAction(full, { ...action, receipt: "delivery-3" }),
    ).toThrow("not open");
  });
  it("over-receiving and invalid later lines are atomic", () => {
    const s = seed(),
      copy = structuredClone(s);
    expect(() =>
      applyAction(s, {
        type: "receive",
        id: "PO-1042",
        quantities: [3, 99],
        receipt: uid(),
        actor: "Test",
      }),
    ).toThrow("outstanding");
    expect(s).toEqual(copy);
  });
  it("recipe costing recalculates without rewriting historical events", () => {
    const s = seed(),
      r = s.recipes[0],
      before = recipeCost(s, r),
      p = s.products[0];
    const next = applyAction(s, {
      type: "product",
      product: { ...p, cost: 48 },
      quantity: 0,
      location: "Main bar",
      actor: "Test",
    });
    expect(recipeCost(next, r)).toBeCloseTo(before + 1.92);
    expect(next.movements).toEqual(s.movements);
  });
  it("production consumes each ingredient and fails atomically if any is unavailable", () => {
    const s = seed(),
      r = s.recipes.find((r) => r.id === "r3")!;
    const next = applyAction(s, {
      type: "consume",
      id: r.id,
      servings: 2,
      location: "Main bar",
      actor: "Test",
    });
    expect(next.movements.slice(0, 3).every((m) => m.type === "Recipe")).toBe(
      true,
    );
    expect(quantity(next, "p3")).toBeCloseTo(quantity(s, "p3") - 0.16);
    expect(() =>
      applyAction(s, {
        type: "consume",
        id: r.id,
        servings: 10000,
        location: "Main bar",
        actor: "Test",
      }),
    ).toThrow("Insufficient");
  });
  it("archives without losing stock or ledger", () => {
    const s = seed(),
      next = applyAction(s, { type: "archive", id: "p1" });
    expect(next.products[0].archived).toBe(true);
    expect(next.stock).toEqual(s.stock);
    expect(next.movements).toEqual(s.movements);
    expect(() => applyAction(next, move())).toThrow("active");
  });
  it("rejects duplicate SKUs and incompatible existing-unit edits", () => {
    const s = seed();
    expect(() =>
      applyAction(s, {
        type: "product",
        product: { ...s.products[1], sku: "SP-001" },
        quantity: 0,
        location: "Main bar",
        actor: "Test",
      }),
    ).toThrow("unique");
    expect(() =>
      applyAction(s, {
        type: "product",
        product: { ...s.products[0], volume: 1000 },
        quantity: 0,
        location: "Main bar",
        actor: "Test",
      }),
    ).toThrow("definitions");
  });
  it("CSV quotes headings, commas, multiline content and formula cells", () => {
    expect(csv([{ Name: "=cmd", Note: 'a,"b"\nc', Value: 2 }])).toContain(
      '"\'=cmd","a,""b""\nc","2"',
    );
    expect(csv([])).toBe("");
    expect(csv([{ Delta: -3, Cost: 2.5 }])).toContain('"-3","2.5"');
  });
  it("seed restores original sample balances and schema", () => {
    const a = seed(),
      b = seed();
    expect(a.stock).toEqual(b.stock);
    expect(a.products.length).toBe(30);
    expect(a.movements.length).toBe(56);
    expect(a.version).toBe(1);
    expect(
      Object.values(a.stock)
        .flatMap((x) => Object.values(x))
        .every((n) => n >= 0),
    ).toBe(true);
  });
});
