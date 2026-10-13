import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { State } from "../../src/types";
const persisted = async (page: Page) => {
  await expect(page.locator('#root')).not.toHaveAttribute('aria-busy','true');
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("stockpilot-demo-v1")!),
  ) as Promise<State>;
};
const init = async (page: Page) => {
  await page.goto("/app/inventory");
  await page
    .getByRole("button", { name: "Edit Blanco tequila", exact: true })
    .click();
  await page.getByRole("button", { name: "Save item", exact: true }).click();
};
const total = (s: State, id: string) =>
  Object.values(s.stock[id]).reduce((a, b) => a + b, 0);
test("create, transfer, waste, count, persistence and reset", async ({
  page,
}) => {
  await page.goto("/app/inventory");
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Portfolio test tonic");
  await page.getByLabel("SKU", { exact: true }).fill("QA-001");
  await page
    .getByLabel("Base inventory unit", { exact: true })
    .selectOption("each");
  await page.getByLabel("Cost per each ($)", { exact: true }).fill("2");
  await page
    .getByLabel("Opening stock at Storage room", { exact: true })
    .fill("10");
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await expect(
    page.getByText("Portfolio test tonic", { exact: true }),
  ).toBeVisible();
  const s = await persisted(page),
    p = s.products.find((p) => p.sku === "QA-001")!;
  expect(total(s, p.id)).toBe(10);
  await page
    .getByRole("button", { name: "Move Portfolio test tonic", exact: true })
    .click();
  await page
    .getByLabel("Movement type", { exact: true })
    .selectOption("Transfer");
  await page
    .getByLabel("Source location", { exact: true })
    .selectOption("Storage room");
  await page
    .getByLabel("Destination location", { exact: true })
    .selectOption("Main bar");
  await page.getByLabel("Quantity", { exact: true }).fill("3");
  await page
    .getByLabel("Adjustment reason", { exact: true })
    .fill("QA transfer");
  await page
    .getByRole("button", { name: "Save movement", exact: true })
    .click();
  let next = await persisted(page);
  expect(next.stock[p.id]["Main bar"]).toBe(3);
  expect(total(next, p.id)).toBe(10);
  await page
    .getByRole("button", { name: "Move Portfolio test tonic", exact: true })
    .click();
  await page.getByLabel("Movement type", { exact: true }).selectOption("Waste");
  await page.getByLabel("Quantity", { exact: true }).fill("1");
  await page.getByLabel("Loss reason", { exact: true }).selectOption("Damaged");
  await page
    .getByRole("button", { name: "Save movement", exact: true })
    .click();
  next = await persisted(page);
  expect(total(next, p.id)).toBe(9);
  expect(next.movements[0].type).toBe("Waste");
  await page
    .getByRole("button", { name: "Move Portfolio test tonic", exact: true })
    .click();
  await page.getByLabel("Movement type", { exact: true }).selectOption("Count");
  await page.getByLabel("Physical quantity counted", { exact: true }).fill("1");
  await page
    .getByLabel("Adjustment reason", { exact: true })
    .fill("Physical count");
  await page
    .getByRole("button", { name: "Reconcile count", exact: true })
    .click();
  next = await persisted(page);
  expect(next.stock[p.id]["Main bar"]).toBe(1);
  expect(next.movements[0].delta).toBe(-1);
  await page.reload();
  await expect(
    page.getByText("Portfolio test tonic", { exact: true }),
  ).toBeVisible();
  expect((await persisted(page)).stock[p.id]["Main bar"]).toBe(1);
  await page
    .getByRole("button", { name: "Reset Demo Data", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(
    page.getByText("Portfolio test tonic", { exact: true }),
  ).toHaveCount(0);
  expect((await persisted(page)).products).toHaveLength(30);
});
test("partial receiving, completion and rapid duplicate submission", async ({
  page,
}) => {
  await init(page);
  const before = await persisted(page);
  await page.goto("/app/orders");
  await page
    .getByRole("row")
    .filter({ hasText: "PO-1042" })
    .getByRole("button", { name: "Receive", exact: true })
    .click();
  await page.getByLabel("Receive Blanco tequila", { exact: true }).fill("3");
  await page
    .getByRole("button", { name: "Confirm receipt", exact: true })
    .dblclick();
  await expect(
    page.getByRole("row").filter({ hasText: "PO-1042" }).locator(".badge"),
  ).toBeVisible();
  let s = await persisted(page);
  expect(total(s, "p1")).toBeCloseTo(total(before, "p1") + 3);
  expect(s.receipts).toHaveLength(1);
  await page
    .getByRole("row")
    .filter({ hasText: "PO-1042" })
    .getByRole("button", { name: "Receive", exact: true })
    .click();
  await expect(
    page.getByLabel("Receive Blanco tequila", { exact: true }),
  ).toHaveAttribute("max", "9");
  await page.getByLabel("Receive Blanco tequila", { exact: true }).fill("9");
  await page.getByLabel("Receive Soda water", { exact: true }).fill("48");
  await page
    .getByRole("button", { name: "Confirm receipt", exact: true })
    .click();
  s = await persisted(page);
  expect(total(s, "p1")).toBeCloseTo(total(before, "p1") + 12);
  expect(s.orders.find((o) => o.id === "PO-1042")!.status).toBe("Received");
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: "PO-1042" })
      .getByRole("button", { name: "Receive", exact: true }),
  ).toHaveCount(0);
});
test("multi-line purchase order, draft placement and cancel", async ({
  page,
}) => {
  await page.goto("/app/orders");
  await page
    .getByRole("button", { name: "New purchase order", exact: true })
    .click();
  await page.getByLabel("Item 1", { exact: true }).selectOption("p1");
  await page.getByLabel("Quantity (base units)", { exact: true }).fill("6");
  await page
    .getByRole("button", { name: "Add line item", exact: true })
    .click();
  await page.getByLabel("Item 2", { exact: true }).selectOption("p2");
  await page.getByLabel("Save as draft", { exact: true }).check();
  await page
    .getByRole("button", { name: "Save purchase order", exact: true })
    .click();
  let s = await persisted(page);
  const o = s.orders[0];
  expect(o.lines).toHaveLength(2);
  expect(o.status).toBe("Draft");
  await page
    .getByRole("row")
    .filter({ hasText: o.id })
    .getByRole("button", { name: "Place order", exact: true })
    .click();
  s = await persisted(page);
  expect(s.orders[0].status).toBe("Ordered");
  await page
    .getByRole("button", { name: `Cancel ${o.id}`, exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel order", exact: true }).click();
  expect((await persisted(page)).orders[0].status).toBe("Canceled");
});
test("ingredient edits recalculate recipes and production records consumption", async ({
  page,
}) => {
  await init(page);
  await page
    .getByRole("button", { name: "Edit Blanco tequila", exact: true })
    .click();
  await page.getByLabel("Cost per bottle ($)", { exact: true }).fill("48");
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await page.goto("/app/recipes");
  const margarita = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Classic Margarita",
      exact: true,
    }),
  });
  await expect(margarita).toContainText("$4.79");
  const old = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Old Fashioned", exact: true }),
  });
  await old
    .getByRole("button", { name: "View cost breakdown", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Record production", exact: true })
    .click();
  expect((await persisted(page)).movements[0].type).toBe("Recipe");
});
test("invalid negative stock shows an error and leaves the ledger unchanged", async ({
  page,
}) => {
  await init(page);
  const before = await persisted(page);
  await page
    .getByRole("button", { name: "Move Blanco tequila", exact: true })
    .click();
  await page.getByLabel("Movement type", { exact: true }).selectOption("Waste");
  await page.getByLabel("Quantity", { exact: true }).fill("999");
  await page
    .getByRole("button", { name: "Save movement", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Insufficient");
  expect((await persisted(page)).movements).toEqual(before.movements);
});
test("reports CSV includes filtered inventory headings and values", async ({
  page,
}) => {
  await page.goto("/app/reports");
  await page
    .getByLabel("Report category", { exact: true })
    .selectOption("Spirits");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export CSV", exact: true }).click(),
  ]);
  const stream = await download.createReadStream();
  let content = "";
  for await (const chunk of stream!) content += chunk.toString();
  expect(content).toContain('"Unit cost USD"');
  expect(content).toContain("Blanco tequila");
  expect(content).not.toContain("Chicken breast");
});
test("checklists, notes, search, tour, themes and isolated browsers", async ({
  page,
  browser,
}) => {
  await page.goto("/app/operations");
  await page.getByRole("button", { name: /Check bar par levels/ }).click();
  await expect(
    page.getByRole("button", { name: /Check bar par levels/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Announcements", exact: true })
    .click();
  await page
    .getByLabel("Operational note (fictional data only)", { exact: true })
    .fill("Demo service note");
  await page.getByRole("button", { name: "Post note", exact: true }).click();
  await expect(
    page.getByText("Demo service note", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await page.getByLabel("Search workspace", { exact: true }).fill("recipe");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Recipe costing", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Recipe costing", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Use dark theme", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Take a guided tour", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Interactive guided tour" }),
  ).toContainText("GUIDED TOUR");
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Interactive guided tour" }),
  ).toContainText("Make your first stock change");
  await page.getByRole("button", { name: "End tour", exact: true }).click();
  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto(new URL("/app/operations", page.url()).href);
  await expect(
    other.getByRole("button", { name: /Check bar par levels/ }),
  ).toHaveAttribute("aria-pressed", "false");
  await context.close();
});
for (const width of [1440, 834, 390])
  test(`responsive routes and mobile forms at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    for (const path of [
      "/app",
      "/app/inventory",
      "/app/orders",
      "/app/recipes",
      "/app/waste",
      "/app/reports",
      "/app/alerts",
      "/app/operations",
    ]) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.reload();
      await expect(page.locator("main h1")).toBeVisible();
    }
    if (width === 390) {
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
      await page
        .getByRole("navigation", { name: "Workspace navigation", exact: true })
        .getByRole("link", { name: "Inventory", exact: true })
        .click();
      await page.getByRole("button", { name: "Add item", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page
        .getByLabel("Product name", { exact: true })
        .fill("Mobile item");
      await page.getByLabel("SKU", { exact: true }).fill("MOB-01");
      await page
        .getByRole("button", { name: "Save item", exact: true })
        .click();
      await expect(
        page.getByText("Mobile item", { exact: true }),
      ).toBeVisible();
    }
  });
test("accessible workspace, landing and open dialog", async ({ page }) => {
  await page.goto("/app");
  let result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Record movement", exact: true })
    .click();
  result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.goto("/");
  result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
