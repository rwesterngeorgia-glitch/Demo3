# StockPilot verification

Verified on October 12, 2026. Fictional demo data only.

## Automated checks

- ESLint: passed.
- TypeScript strict type checking: passed.
- Vite production build: passed.
- Dependency audit: 0 vulnerabilities after updating the test runner.
- Domain tests: **16 passed**.
- Chromium browser tests: **14 passed** in the full local run, with **4 focused checks passed** after the final CSV/location refinements; **all 15 passed on the final public deployment**.

## Domain coverage

Item creation and opening ledger/value; case/bottle/ml/kg/g/L conversions; incompatible dimensions; atomic location transfers preserving company totals; negative stock rejection; waste reduction and historical costs; zero-count reconciliation; signed adjustments; non-finite quantity rejection; partial receipt/completion; receipt replay rejection; over-receiving and atomic rollback; ingredient price recalculation without rewriting historic costs; production consumption/all-or-nothing failure; archiving with retained history; SKU uniqueness and fixed existing unit definitions; CSV quoting/formula protection; schema and deterministic reset balances.

## Browser coverage

Create item → transfer → waste → physical count → refresh → reset; partial and final delivery with rapid double submission; multi-line draft order → placement → cancellation; recipe recalculation after price edit and actual production consumption; negative-stock error with unchanged persisted ledger; filtered CSV headings/content; task completion and announcements; command search, themes, independent browser contexts; purchase order filters and default receiving location following the workspace selector; route refreshes, document overflow, and forms at **1440px desktop**, **834px tablet**, and **390px mobile**. CSV unit assertions also verify that negative numeric quantities stay numeric while untrusted formula-like text is escaped.

Interactive tour is tested at desktop and mobile sizes through actual saved stock movements, partial receipt, recipe production, movement reports, back/next, minimizing, completion, highlight cleanup, and no blocking dialog/background filter. Tour completion advances from actual state changes.

Automated axe-core WCAG A/AA/2.1 AA scans pass for the overview, a stock movement dialog, the public landing page, and the non-blocking guided tour. This is automated coverage, not a claim of complete accessibility certification.

## Visual verification

Actual browser screenshots for overview, inventory, purchase orders, recipes, waste, mobile, tablet, and the landing page are in `marketing/screenshots`. Six 4:5 carousel graphics are composed from these screenshots. Desktop/mobile layouts were checked for document overflow; wide data tables scroll within their panels. Text contrast was corrected from the initial browser test findings.

## Production verification

- Cloudflare Pages project: **stockpilot-demo**, direct upload, free hosting; unrelated projects were not modified.
- Canonical site: **https://stockpilot-demo.pages.dev/**.
- Application: **https://stockpilot-demo.pages.dev/app**.
- Final deployment: **https://9480a0c4.stockpilot-demo.pages.dev**.
- Deployed application source commit: **5928da41d4e1d38a47561ddffc23502dea754f61**.
- Homepage, `/app`, and `/app/recipes` returned **HTTP 200** with configured security headers.
- **15 / 15 Chromium tests passed against the canonical public origin in 18.0 seconds**, including complete interactive tour workflows at 1440px and 390px, accessibility, production route refreshes, and all major stock/purchasing workflows.
- Git push succeeded to **https://github.com/rwesterngeorgia-glitch/Demo3**; remote `main` was verified with `git ls-remote`.
- No credential patterns were found in the tracked source/artifacts. Both full dependency audit and production dependency audit returned **0 vulnerabilities**.

The generated local HTML report is `playwright-report/index.html` (ignored by Git). Run the full browser suite against the public URL by setting `BASE_URL=https://stockpilot-demo.pages.dev`. Tests use isolated browser contexts and never create shared business records.

## Limits

Chromium only; Firefox/Safari and physical-device behavior are not certified. No backend/authentication, actual supplier delivery identification, multi-user transactions, real sales, email, payroll, or accounting integrations. Local demo roles are not permissions. Standard catalog costs differ from event invoice costs by design. Local browser changes are not durable business records, and concurrent tabs may overwrite changes. Time filters use browser-local calendar dates. Mobile tables intentionally scroll horizontally. The interactive tour changes demo records only when the visitor saves a real workflow action.
