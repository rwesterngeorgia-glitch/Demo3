# StockPilot portfolio kit

All assets describe StockPilot as a **concept/prototype developed for our agency portfolio**. Screenshots are actual captures from the completed application using fictional seed data. No social media posts have been published.

## Screenshots

| File | Content |
| --- | --- |
| `screenshots/dashboard.png` | Current inventory, category value, recorded consumption, stock alerts, deliveries |
| `screenshots/inventory.png` | Working product catalog with base units, quantities, valuation, controls |
| `screenshots/purchase-orders.png` | Purchase statuses, outstanding/received value, receiving actions |
| `screenshots/recipes.png` | Six recipes with calculated costs, theoretical margins, targets |
| `screenshots/waste.png` | Event-derived waste, loss value, category/time charts |
| `screenshots/mobile.png` | Mobile inventory workflow at 390px |
| `screenshots/tablet.png` | Tablet overview at 834px |
| `screenshots/landing.png` | Full public portfolio page |
| `screenshots/guided-tour.png` | Clear desktop workspace with interactive guide and highlight |
| `screenshots/mobile-tour.png` | Non-blocking guided tour on mobile |

## Instagram carousel

Six PNG slides in `instagram-carousel/`, each **1080 × 1350 (4:5)**. `contact-sheet.png` previews the set. The graphics use actual app screenshots, with a visible portfolio concept label and disclosure.

Suggested caption:

> Inventory software should help teams act, not just admire a dashboard. Meet StockPilot, a hospitality operations concept we developed for our agency portfolio. Track products across locations, receive partial deliveries, inspect recipe costs, log waste, and follow every movement through a real audit trail. Explore the working prototype at stockpilot-demo.pages.dev/app. Fictional data; each visitor’s changes stay in their browser. #CustomSoftware #HospitalityTechnology #WebDevelopment #InventoryManagement #AgencyPortfolio

The screenshots show a prototype, not a paying client or live business. Do not imply realized revenue, measured cost savings, or predictive AI capabilities.

- Reel: [reel-storyboard.md](reel-storyboard.md)
- Facebook draft: [facebook-post.md](facebook-post.md)
- Case study: [case-study.md](case-study.md)

Regenerate while the local application runs: `node scripts/capture.mjs` then `node scripts/marketing.mjs`. Set `BASE_URL` to capture the deployed app. The public landing page receives copies of the dashboard and recipe screenshots under `public/screenshots`.
