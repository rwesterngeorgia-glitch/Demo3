import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [1440, 390])
  test(`interactive tour keeps the workspace clear and completes real workflows at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/app");
    if (width === 390)
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Take a guided tour", exact: true })
      .click();
    const guide = page.getByRole("region", {
      name: "Interactive guided tour",
      exact: true,
    });
    await expect(guide).toContainText("GUIDED TOUR · 1 / 5");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".stats")).toHaveClass(/tour-focus/);
    expect(
      await page
        .locator(".app-main")
        .evaluate((e) => getComputedStyle(e).filter),
    ).toBe("none");
    await page
      .getByRole("button", { name: "Explore inventory", exact: true })
      .click();
    await expect(guide).toContainText("2 / 5");
    await page
      .getByRole("button", { name: "Open stock movement", exact: true })
      .click();
    await page.getByLabel("Quantity", { exact: true }).fill("1");
    await page
      .getByLabel("Adjustment reason", { exact: true })
      .fill("Interactive tour delivery");
    await page
      .getByRole("button", { name: "Save movement", exact: true })
      .click();
    await expect(guide).toContainText("3 / 5");
    await expect(page.locator("main h1")).toHaveText("Purchase orders");
    await page
      .getByRole("button", { name: "Try partial receiving", exact: true })
      .click();
    await page.getByLabel("Receive Blanco tequila", { exact: true }).fill("1");
    await page
      .getByRole("button", { name: "Confirm receipt", exact: true })
      .click();
    await expect(guide).toContainText("4 / 5");
    await page
      .getByRole("button", { name: "Open recipe breakdown", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Record production", exact: true })
      .click();
    await expect(guide).toContainText("5 / 5");
    await page
      .getByRole("button", { name: "Show movement report", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Movements", exact: true }),
    ).toHaveClass("active");
    await page
      .getByRole("button", { name: "Minimize tour", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Show movement report", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Expand tour", exact: true })
      .click();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(guide).toContainText("4 / 5");
    await page.getByRole("button", { name: "Next step", exact: true }).click();
    await page
      .getByRole("button", { name: "Finish tour", exact: true })
      .click();
    await expect(guide).toHaveCount(0);
    await expect(page.locator(".tour-focus")).toHaveCount(0);
  });
test("tour is accessible without blocking keyboard navigation", async ({
  page,
}) => {
  await page.goto("/app");
  await page
    .getByRole("button", { name: "Take a guided tour", exact: true })
    .click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "End tour", exact: true }).click();
});
