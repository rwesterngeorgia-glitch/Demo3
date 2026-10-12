import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const origin = process.env.BASE_URL || "http://127.0.0.1:5174";
await fs.mkdir("marketing/screenshots", { recursive: true });
await fs.mkdir("public/screenshots", { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
for (const [name, path] of [
  ["dashboard", "/app"],
  ["inventory", "/app/inventory"],
  ["purchase-orders", "/app/orders"],
  ["recipes", "/app/recipes"],
  ["waste", "/app/waste"],
]) {
  await page.goto(origin + path);
  await page.locator("main h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `marketing/screenshots/${name}.png` });
  console.log("Captured", name);
}
await fs.copyFile(
  "marketing/screenshots/dashboard.png",
  "public/screenshots/dashboard.png",
);
await fs.copyFile(
  "marketing/screenshots/recipes.png",
  "public/screenshots/recipes.png",
);
await page.setViewportSize({ width: 834, height: 1112 });
await page.goto(origin + "/app");
await page.screenshot({ path: "marketing/screenshots/tablet.png" });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(origin + "/app/inventory");
await page.screenshot({ path: "marketing/screenshots/mobile.png" });
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(origin + "/");
await page.screenshot({
  path: "marketing/screenshots/landing.png",
  fullPage: true,
});
await context.close();
await browser.close();
