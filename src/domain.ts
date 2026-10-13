import type { Action, Movement, Product, Recipe, State } from "./types";
import { locations } from "./types";
import { validDate } from "./dates";
export const uid = () => crypto.randomUUID();
export const round = (n: number) => Math.round(n * 1e6) / 1e6;
export const eventDay = (value: string) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
export const quantity = (s: State, id: string, loc = "All locations") =>
  loc === "All locations"
    ? Object.values(s.stock[id] || {}).reduce((a, b) => a + b, 0)
    : s.stock[id]?.[loc] || 0;
export function convert(p: Product, n: number, unit: string): number {
  if (!Number.isFinite(n)) throw Error("Enter a finite quantity.");
  if (unit === p.unit) return n;
  if (unit === "case") return n * p.pack;
  if (p.unit === "bottle" && (unit === "ml" || unit === "L"))
    return (n * (unit === "L" ? 1000 : 1)) / p.volume;
  if (p.unit === "kg" && unit === "g") return n / 1000;
  if (p.unit === "L" && unit === "ml") return n / 1000;
  throw Error(`${unit} is incompatible with ${p.name} (${p.unit}).`);
}
export const recipeCost = (s: State, r: Recipe) =>
  r.ingredients.reduce((sum, i) => {
    const p = s.products.find((p) => p.id === i.product)!;
    return sum + convert(p, i.quantity, i.unit) * p.cost;
  }, 0);
export const status = (q: number, min: number) =>
  q === 0 ? "Out of stock" : q < min ? "Low stock" : "In stock";
const positive = (n: number, zero = false) => {
  if (!Number.isFinite(n) || n < 0 || (!zero && n === 0))
    throw Error(
      zero
        ? "Enter a nonnegative number."
        : "Enter a number greater than zero.",
    );
};
export function applyAction(state: State, a: Action): State {
  const s: State = structuredClone(state),
    at = new Date().toISOString(),
    group = uid();
  const product = (id: string) => {
    const p = s.products.find((p) => p.id === id);
    if (!p || p.archived) throw Error("Choose an active inventory item.");
    return p;
  };
  const move = (
    id: string,
    loc: string,
    delta: number,
    type: Movement["type"],
    reason: string,
    actor: string,
  ) => {
    if (!locations.includes(loc as (typeof locations)[number]))
      throw Error("Choose a valid location.");
    const p = product(id),
      before = quantity(s, id, loc),
      after = round(before + delta);
    if (!Number.isFinite(delta) || after < 0)
      throw Error(
        `Insufficient ${p.name} at ${loc}. Available: ${round(before)} ${p.unit}.`,
      );
    s.stock[id] ??= {};
    s.stock[id][loc] = after;
    s.movements.unshift({
      id: uid(),
      at,
      product: id,
      location: loc,
      type,
      delta: round(delta),
      before,
      after,
      cost: p.cost,
      reason,
      actor,
      group,
    });
  };
  switch (a.type) {
    case "product": {
      const p = a.product;
      positive(p.cost, true);
      positive(p.price, true);
      positive(p.min, true);
      positive(p.volume);
      positive(p.pack);
      positive(a.quantity, true);
      if (
        !p.name.trim() ||
        !p.sku.trim() ||
        !s.suppliers.some((x) => x.id === p.supplier)
      )
        throw Error("Name, SKU, and supplier are required.");
      if (
        s.products.some(
          (x) => x.id !== p.id && x.sku.toLowerCase() === p.sku.toLowerCase(),
        )
      )
        throw Error("SKU must be unique.");
      const old = s.products.find((x) => x.id === p.id);
      if (
        old &&
        (old.unit !== p.unit || old.volume !== p.volume || old.pack !== p.pack)
      )
        throw Error(
          "Existing unit definitions cannot change; create a new item instead.",
        );
      if (old) s.products = s.products.map((x) => (x.id === p.id ? p : x));
      else {
        s.products.push(p);
        s.stock[p.id] = {};
        move(
          p.id,
          a.location,
          a.quantity,
          "Incoming",
          "Opening stock",
          a.actor,
        );
      }
      break;
    }
    case "archive":
      product(a.id).archived = true;
      break;
    case "restore": { const p=s.products.find(p=>p.id===a.id);if(!p)throw Error("Inventory item not found.");p.archived=false;break; }
    case "move": {
      const p = product(a.product);
      if (!a.reason.trim()) throw Error("Add a reason for the audit trail.");
      if (a.kind === "Adjustment") {
        if (!Number.isFinite(a.quantity) || a.quantity === 0)
          throw Error("Adjustment must be a nonzero number.");
      } else positive(a.quantity, a.kind === "Count");
      const n = convert(p, a.quantity, a.unit);
      if (a.kind === "Transfer") {
        if (!a.destination || a.destination === a.location)
          throw Error("Select a different destination.");
        move(p.id, a.location, -n, "Transfer out", a.reason, a.actor);
        move(p.id, a.destination, n, "Transfer in", a.reason, a.actor);
      } else
        move(
          p.id,
          a.location,
          a.kind === "Count"
            ? round(n - quantity(s, p.id, a.location))
            : a.kind === "Waste"
              ? -n
              : n,
          a.kind,
          a.reason,
          a.actor,
        );
      break;
    }
    case "order": {
      const o = a.order;
      if (s.orders.some((x) => x.id === o.id))
        throw Error("Order already exists.");
      if (
        !s.suppliers.some((x) => x.id === o.supplier) ||
        !locations.includes(o.location as (typeof locations)[number]) ||
        !validDate(o.expected) ||
        !o.lines.length
      )
        throw Error(
          "Complete supplier, delivery date, location, and order lines.",
        );
      if (new Set(o.lines.map((x) => x.product)).size !== o.lines.length)
        throw Error("Combine duplicate items into one line.");
      o.lines.forEach((l) => {
        if (product(l.product).supplier !== o.supplier)
          throw Error("Order items must belong to the selected supplier.");
        positive(l.quantity);
        positive(l.cost, true);
        l.received = 0;
      });
      s.orders.unshift(o);
      break;
    }
    case "orderStatus": {
      const o = s.orders.find((x) => x.id === a.id);
      if (!o) throw Error("Order not found.");
      if (a.status === "Ordered" && o.status !== "Draft")
        throw Error("Only drafts can be ordered.");
      if (
        a.status === "Canceled" &&
        (o.status === "Received" || o.status === "Canceled")
      )
        throw Error("This order cannot be canceled.");
      o.status = a.status;
      break;
    }
    case "receive": {
      const o = s.orders.find((x) => x.id === a.id);
      if (!o || !["Ordered", "Partially received"].includes(o.status))
        throw Error("This order is not open for receiving.");
      if (s.receipts.includes(a.receipt))
        throw Error("This delivery has already been received.");
      if (a.quantities.length !== o.lines.length)
        throw Error("Invalid delivery lines.");
      if (!a.quantities.some((n) => n > 0))
        throw Error("Enter at least one received quantity.");
      a.quantities.forEach((n, i) => {
        positive(n, true);
        const l = o.lines[i];
        if (n > round(l.quantity - l.received))
          throw Error("Cannot receive more than the outstanding quantity.");
        if (n) {
          move(
            l.product,
            o.location,
            n,
            "Incoming",
            `PO ${o.id} delivery`,
            a.actor,
          );
          s.movements[0].cost = l.cost;
          l.received = round(l.received + n);
        }
      });
      o.status = o.lines.every((l) => l.received === l.quantity)
        ? "Received"
        : "Partially received";
      s.receipts.push(a.receipt);
      break;
    }
    case "recipe": {
      const r = a.recipe;
      if (!r.name.trim() || !r.ingredients.length)
        throw Error("Recipe name and ingredients are required.");
      positive(r.price);
      positive(r.target);
      if (r.target > 100) throw Error("Target cost must be at most 100%.");
      r.ingredients.forEach((i) => {
        positive(i.quantity);
        convert(product(i.product), i.quantity, i.unit);
      });
      s.recipes = s.recipes.filter((x) => x.id !== r.id);
      s.recipes.push(r);
      break;
    }
    case "consume": {
      const r = s.recipes.find((x) => x.id === a.id);
      if (!r) throw Error("Recipe not found.");
      positive(a.servings);
      r.ingredients.forEach((i) =>
        move(
          i.product,
          a.location,
          -convert(product(i.product), i.quantity * a.servings, i.unit),
          "Recipe",
          `${r.name} · ${a.servings} servings (demo production)`,
          a.actor,
        ),
      );
      break;
    }
    case "task": {
      const t = s.tasks.find((x) => x.id === a.id);
      if (t) t.done = !t.done;
      break;
    }
    case "note":
      if (!a.text.trim()) throw Error("Write a note first.");
      s.notes.unshift({ id: uid(), at, text: a.text.trim(), actor: a.actor });
      break;
  }
  return s;
}
export function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    let t = String(v ?? "");
    if (typeof v === "string" && /^[=+@\-\t\r]/.test(t)) t = "'" + t;
    return '"' + t.replaceAll('"', '""') + '"';
  };
  return (
    "\uFEFF" +
    [
      keys.map(escape).join(","),
      ...rows.map((r) => keys.map((k) => escape(r[k])).join(",")),
    ].join("\r\n")
  );
}
