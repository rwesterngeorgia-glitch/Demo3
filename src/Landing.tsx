import { Link } from "react-router-dom";
import {
  Layers3,
  ArrowUpRight,
  ArrowRight,
  Check,
  Box,
  ChefHat,
  ArrowRightLeft,
  ClipboardCheck,
} from "lucide-react";
export const Brand = () => (
  <span className="brand">
    <span className="brandmark">
      <Layers3 size={22} />
    </span>
    StockPilot<span className="brand-period">.</span>
  </span>
);
export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" aria-label="StockPilot home">
          <Brand />
        </Link>
        <nav>
          <a href="#platform">The platform</a>
          <a href="#hospitality">Built for hospitality</a>
          <span className="portfolio-label">PORTFOLIO DEMO / 03</span>
        </nav>
        <Link className="button primary" to="/app">
          Launch demo <ArrowUpRight size={16} />
        </Link>
      </header>
      <main>
        <section className="hero">
          <div className="hero-text">
            <div className="hero-kicker">
              <span className="dot" />
              Hospitality operations, made clear
            </div>
            <h1>
              Know your stock.
              <br />
              <span>Control your costs.</span>
            </h1>
            <p>
              From the first delivery to the last pour. Bring inventory,
              purchasing, and recipe costing into one workspace built for the
              pace of hospitality.
            </p>
            <div className="hero-actions">
              <Link to="/app" className="button primary large">
                Launch Interactive Demo <ArrowUpRight size={18} />
              </Link>
              <a href="#platform" className="text-button">
                Explore the platform <ArrowRight size={16} />
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <Check size={14} />
                No account needed
              </span>
              <span>
                <Check size={14} />
                Your own browser-local workspace
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-label">
              <span className="dot" />
              LIVE WORKSPACE PREVIEW <span>STOCKPILOT / 01</span>
            </div>
            <Link
              to="/app"
              className="preview-frame"
              aria-label="Launch StockPilot overview"
            >
              <img
                src="/screenshots/dashboard.png"
                alt="StockPilot dashboard showing real demo inventory values, recorded consumption, and actionable stock alerts"
              />
              <span className="preview-overlay">
                Open the interactive workspace <ArrowUpRight size={17} />
              </span>
            </Link>
            <div className="hero-caption">
              One operation. Every item accounted for.
              <span>Built for a better service.</span>
            </div>
          </div>
        </section>
        <div className="usecase-strip" id="hospitality">
          <span>AT HOME IN HOSPITALITY</span>
          <strong>Bars & lounges</strong>
          <span className="slash">/</span>
          <strong>Restaurants</strong>
          <span className="slash">/</span>
          <strong>Cafés</strong>
          <span className="slash">/</span>
          <strong>Multi-location teams</strong>
        </div>
        <section id="platform" className="platform-section">
          <div className="section-intro">
            <span className="eyebrow">LESS GUESSWORK. MORE GOOD SERVICE.</span>
            <h2>
              The back of house,
              <br />
              brought into focus.
            </h2>
            <p>
              Useful software goes beyond a dashboard. Follow an ingredient
              through purchasing, stock movement, preparation, and reporting.
            </p>
          </div>
          <div className="feature-editorial">
            {[
              {
                icon: Box,
                title: "A stockroom you can see.",
                text: "Track 30 sample products across four locations. Count, adjust, and transfer with a clear audit trail for every change.",
                link: "/app/inventory",
                label: "Explore inventory",
              },
              {
                icon: ArrowRightLeft,
                title: "Order. Receive. Reconcile.",
                text: "Create purchase orders, handle partial deliveries, and see exactly what is still on the way. Duplicate receipts are rejected.",
                link: "/app/orders",
                label: "Try receiving stock",
              },
              {
                icon: ChefHat,
                title: "Every ingredient has a cost.",
                text: "See the theoretical cost and margin of cocktails, dishes, and coffee. Update an ingredient price and watch recipes recalculate.",
                link: "/app/recipes",
                label: "Open recipe costing",
              },
              {
                icon: ClipboardCheck,
                title: "Keep the team in rhythm.",
                text: "Opening routines, stock count assignments, waste records, and simple alerts make the next action clear.",
                link: "/app/operations",
                label: "Meet the demo team",
              },
            ].map((f) => (
              <article key={f.title}>
                <f.icon size={24} />
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <Link to={f.link} className="text-button">
                  {f.label}
                  <ArrowUpRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section className="recipe-showcase">
          <div>
            <span className="eyebrow">THE DETAILS MAKE THE DIFFERENCE</span>
            <h2>
              A better view of
              <br />
              what’s on the menu.
            </h2>
            <p>
              Compare ingredient costs, understand your targets, and inspect the
              numbers behind each serving. The demo includes six working
              recipes, from a Classic Margarita to a Chicken Caesar.
            </p>
            <Link to="/app/recipes" className="button">
              Explore recipe costs <ArrowUpRight size={16} />
            </Link>
            <small>
              Theoretical costing. Labor, overhead, and actual sales are
              excluded.
            </small>
          </div>
          <img
            src="/screenshots/recipes.png"
            alt="StockPilot recipe costing with ingredient costs, menu prices, target percentages, and theoretical margins"
            loading="lazy"
          />
        </section>
        <section className="demo-invitation">
          <span className="eyebrow">A CONCEPT YOU CAN ACTUALLY USE</span>
          <h2>Take it for a service.</h2>
          <p>
            Add an item. Receive a delivery. Cost a cocktail.
            <br />
            Every change stays in your browser, and you can reset anytime.
          </p>
          <Link to="/app" className="button primary large">
            Launch Interactive Demo <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <footer>
        <Brand />
        <p>
          StockPilot is a concept/prototype built for a digital agency
          portfolio.
          <br />
          Fictional data. No real business connection. No signup or payments.
        </p>
        <span>DEMO 03 · 2026</span>
      </footer>
    </div>
  );
}
