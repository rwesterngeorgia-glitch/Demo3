import { test, expect } from "@playwright/test";
test("purchase filters and default receiving location follow the workspace selector", async ({
  page,
}) => {
  await page.goto("/app/orders");
  await page
    .getByLabel("Current location", { exact: true })
    .selectOption("Kitchen");
  await expect(
    page.getByRole("row").filter({ hasText: "PO-1043" }),
  ).toBeVisible();
  await expect(
    page.getByRole("row").filter({ hasText: "PO-1042" }),
  ).toHaveCount(0);
  await expect(page.locator(".small-stats article").first()).toContainText("1");
  await page
    .getByLabel("Current location", { exact: true })
    .selectOption("Main bar");
  await expect(
    page.getByRole("heading", { name: "No purchase orders", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "New purchase order", exact: true })
    .click();
  await expect(page.getByLabel("Receive at", { exact: true })).toHaveValue(
    "Main bar",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByLabel("Current location", { exact: true })
    .selectOption("All locations");
  await expect(
    page.getByRole("row").filter({ hasText: "PO-1042" }),
  ).toBeVisible();
});
