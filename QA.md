# StockPilot verification

Verified on October 12, 2026. Fictional demo data only.

## Automated checks

- ESLint: passed.
- TypeScript strict type checking: passed.
- Vite production build: passed.
- Dependency audit: 0 vulnerabilities after updating the test runner.
- Domain tests: **16 passed**.
- Chromium browser tests: **14 passed** locally.

## Domain coverage

Item creation and opening ledger/value; case/bottle/ml/kg/g/L conversions; incompatible dimensions; atomic location transfers preserving company totals; negative stock rejection; waste reduction and historical costs; zero-count reconciliation; signed adjustments; non-finite quantity rejection; partial receipt/completion; receipt replay rejection; over-receiving and atomic rollback; ingredient price recalculation without rewriting historic costs; production consumption/all-or-nothing failure; archiving with retained history; SKU uniqueness and fixed existing unit definitions; CSV quoting/formula protection; schema and deterministic reset balances.

## Browser coverage

Create item → transfer → waste → physical count → refresh → reset; partial and final delivery with rapid double submission; multi-line draft order → placement → cancellation; recipe recalculation after price edit and actual production consumption; negative-stock error with unchanged persisted ledger; filtered CSV headings/content; task completion and announcements; command search, themes, independent browser contexts; route refreshes, document overflow, and forms at **1440px desktop**, **834px tablet**, and **390px mobile**.

Interactive tour is tested at desktop and mobile sizes through actual saved stock movements, partial receipt, recipe production, movement reports, back/next, minimizing, completion, highlight cleanup, and no blocking dialog/background filter. Tour completion advances from actual state changes.

Automated axe-core WCAG A/AA/2.1 AA scans pass for the overview, a stock movement dialog, the public landing page, and the non-blocking guided tour. This is automated coverage, not a claim of complete accessibility certification.

## Visual verification

Actual browser screenshots for overview, inventory, purchase orders, recipes, waste, mobile, tablet, and the landing page are in `marketing/screenshots`. Six 4:5 carousel graphics are composed from these screenshots. Desktop/mobile layouts were checked for document overflow; wide data tables scroll within their panels. Text contrast was corrected from the initial browser test findings.

## Production verification

Production deployment and remote repository checks are recorded after publishing. The full browser suite can run against the public URL by setting `BASE_URL=https://stockpilot-demo.pages.dev`.

## Limits

Chromium only; Firefox/Safari and physical-device behavior are not certified. No backend/authentication, actual supplier delivery identification, multi-user transactions, real sales, email, payroll, or accounting integrations. Local demo roles are not permissions. Standard catalog costs differ from event invoice costs by design. Local browser changes are not durable business records, and concurrent tabs may overwrite changes. Time filters use browser-local calendar dates. Mobile tables intentionally scroll horizontally. The interactive tour changes demo records only when the visitor saves a real workflow action.
