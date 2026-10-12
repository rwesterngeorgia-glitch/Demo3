import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 950 },
});
const page = await context.newPage();
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
  await page.goto("http://127.0.0.1:5174" + path);
  console.log(
    path,
    await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll("main *")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.right > window.innerWidth + 1 &&
            getComputedStyle(e).position !== "fixed"
          );
        })
        .map((e) => ({
          tag: e.tagName,
          cls: e.className,
          right: e.getBoundingClientRect().right,
        }))
        .slice(0, 8),
    })),
  );
}
await page.setViewportSize({ width: 1440, height: 1000 });
for (const path of ["/app", "/"]) {
  await page.goto("http://127.0.0.1:5174" + path);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  console.log(
    path,
    JSON.stringify(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes
          .map((n) => ({ target: n.target, summary: n.failureSummary }))
          .slice(0, 30),
      })),
      null,
      2,
    ),
  );
}
await browser.close();
