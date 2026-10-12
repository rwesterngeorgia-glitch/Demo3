import sharp from "sharp";
import fs from "node:fs/promises";
await fs.mkdir("marketing/instagram-carousel", { recursive: true });
const slides = [
  [
    "dashboard",
    "Know your stock.",
    "Control your costs.",
    "01 / ONE CLEAR WORKSPACE",
    "Inventory values and alerts that change with your demo data.",
  ],
  [
    "inventory",
    "Every item.",
    "Every location.",
    "02 / THE STOCKROOM",
    "Canonical units, stock transfers, counts, and a real audit trail.",
  ],
  [
    "purchase-orders",
    "From ordered",
    "to accounted for.",
    "03 / PURCHASING",
    "Partial deliveries. Outstanding balances. Duplicate receipt protection.",
  ],
  [
    "recipes",
    "What does a",
    "serving cost?",
    "04 / RECIPE COSTING",
    "Ingredient-level costing and theoretical margins that recalculate.",
  ],
  [
    "waste",
    "See the loss.",
    "Find the reason.",
    "05 / WASTE & LOSS",
    "Record waste once. Inventory, ledger, and loss reports stay in sync.",
  ],
  [
    "mobile",
    "Built for the",
    "pace of service.",
    "06 / MOBILE WORKFLOWS",
    "A usable stockroom in your pocket. Try the interactive prototype.",
  ],
];
for (let i = 0; i < slides.length; i++) {
  const [shot, title, subtitle, kicker, note] = slides[i];
  const escape = (s) => s.replaceAll("&", "&amp;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="#f2f5ee"/><rect x="60" y="50" width="42" height="42" rx="9" fill="#0c694e"/><path d="m69 64 12-6 12 6-12 6zM69 73l12 6 12-6M69 82l12 6 12-6" stroke="white" stroke-width="2" fill="none"/><text x="117" y="83" font-family="Segoe UI,Arial" font-size="31" font-weight="700" fill="#233a2c">StockPilot.</text><text x="1020" y="79" text-anchor="end" font-family="Segoe UI,Arial" font-size="14" letter-spacing="2" fill="#48654c">PORTFOLIO CONCEPT / DEMO 03</text><line x1="60" y1="118" x2="1020" y2="118" stroke="#d5dfcf"/><text x="60" y="163" font-family="Segoe UI,Arial" font-size="16" letter-spacing="2" fill="#0c694e">${escape(kicker)}</text><text x="60" y="249" font-family="Segoe UI,Arial" font-size="68" font-weight="600" letter-spacing="-2" fill="#263b2c">${escape(title)}</text><text x="60" y="327" font-family="Segoe UI,Arial" font-size="68" font-weight="600" letter-spacing="-2" fill="#4b8058">${escape(subtitle)}</text><rect x="59" y="389" width="962" height="669" rx="5" fill="white" stroke="#cfdacb"/><text x="60" y="1110" font-family="Segoe UI,Arial" font-size="20" fill="#586b51">${escape(note)}</text><line x1="60" y1="1150" x2="1020" y2="1150" stroke="#d5dfcf"/><text x="60" y="1200" font-family="Segoe UI,Arial" font-size="25" font-weight="600" fill="#0c694e">Explore the working demo →</text><text x="60" y="1238" font-family="Segoe UI,Arial" font-size="19" fill="#586b51">stockpilot-demo.pages.dev/app</text><text x="60" y="1300" font-family="Segoe UI,Arial" font-size="14" fill="#586b51">Concept/prototype for our agency portfolio. Fictional data. Browser-local changes.</text><text x="1020" y="1300" text-anchor="end" font-family="Segoe UI,Arial" font-size="14" fill="#586b51">${i + 1} / 6</text></svg>`;
  const image = await sharp(`marketing/screenshots/${shot}.png`)
    .resize(960, 667, { fit: "contain", background: "#fff" })
    .png()
    .toBuffer();
  await sharp(Buffer.from(svg))
    .composite([{ input: image, left: 60, top: 390 }])
    .png()
    .toFile(
      `marketing/instagram-carousel/${String(i + 1).padStart(2, "0")}-${shot}.png`,
    );
}
const thumbs = await Promise.all(
  slides.map(async (_, i) => ({
    input: await sharp(
      `marketing/instagram-carousel/${String(i + 1).padStart(2, "0")}-${slides[i][0]}.png`,
    )
      .resize(270, 338)
      .png()
      .toBuffer(),
    left: (i % 3) * 270,
    top: Math.floor(i / 3) * 338,
  })),
);
await sharp({
  create: { width: 810, height: 676, channels: 4, background: "#f2f5ee" },
})
  .composite(thumbs)
  .png()
  .toFile("marketing/instagram-carousel/contact-sheet.png");
console.log(
  "Created 6 carousel graphics, 1080 × 1350 (4:5), and contact sheet.",
);
