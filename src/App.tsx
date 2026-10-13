import { useEffect, useState, Component, Suspense, lazy, type ReactNode } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ChefHat,
  Trash2,
  Users,
  ChartNoAxesCombined,
  Bell,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Moon,
  Sun,
  RotateCcw,
  Play,
  MapPin,
  ArrowUpRight,
  Keyboard,
  Truck,
} from "lucide-react";
import { useStore } from "./store";
import { locations, type Product } from "./types";
import { Modal } from "./ui";
import GuidedTour, { tourSteps } from "./GuidedTour";
import Landing, { Brand } from "./Landing";
import Inventory, { ProductForm } from "./Inventory";
import Purchasing from "./Purchasing";
import Recipes from "./Recipes";
import Operations from "./Operations";
const Overview = lazy(() => import('./Analytics').then(m => ({default:m.Overview})));
const Waste = lazy(() => import('./Analytics').then(m => ({default:m.Waste})));
const Reports = lazy(() => import('./Analytics').then(m => ({default:m.Reports})));
const Alerts = lazy(() => import('./Analytics').then(m => ({default:m.Alerts})));
import { quantity } from "./domain";
const nav = [
  { path: "/app", name: "Overview", icon: LayoutDashboard },
  { path: "/app/inventory", name: "Inventory", icon: Package },
  { path: "/app/orders", name: "Purchase orders", icon: ShoppingCart },
  { path: "/app/suppliers", name: "Suppliers", icon: Truck },
  { path: "/app/recipes", name: "Recipe costing", icon: ChefHat },
  { path: "/app/waste", name: "Waste & loss", icon: Trash2 },
  { path: "/app/operations", name: "Team & operations", icon: Users },
  { path: "/app/reports", name: "Reports", icon: ChartNoAxesCombined },
  { path: "/app/alerts", name: "Alert center", icon: Bell },
];
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="fatal">
        <h1>This workspace could not load.</h1>
        <p>
          Try reloading. If saved browser data is damaged, reset the local demo
          below.
        </p>
        <button
          className="button primary"
          onClick={() => {
            try {localStorage.removeItem("stockpilot-demo-v1");localStorage.removeItem("stockpilot-demo-v1-recovery");}catch { /* Reload can still start a memory-only workspace. */ }
            window.location.reload();
          }}
        >
          Reset local demo & reload
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app/*" element={<Workspace />} />
        <Route
          path="*"
          element={
            <div className="fatal">
              <h1>Page not found</h1>
              <Link to="/app" className="button primary">
                Open StockPilot
              </Link>
            </div>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
function Workspace() {
  const { state, warning, reset, exportRecovery } = useStore(),
    location = useLocation(),
    navigate = useNavigate();
  const [loc, setLoc] = useState("All locations"),
    [actor, setActor] = useState("Noah · Manager"),
    [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [dark, setDark] = useState(() => {
      try {
        return localStorage.getItem("stockpilot-theme") === "dark";
      } catch {
        return false;
      }
    }),
    [command, setCommand] = useState(false),
    [search, setSearch] = useState(""),
    [edit, setEdit] = useState<Product | null>(null),
    [resetOpen, setResetOpen] = useState(false),
    [tour, setTour] = useState<number | null>(null),
    [toast, setToast] = useState("");
  const alertCount =
    state.products.filter(p => !p.archived).filter((p) => quantity(state, p.id, loc) < p.min)
      .length + state.tasks.filter((t) => !t.done).length;
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("stockpilot-theme", dark ? "dark" : "light");
    } catch {
      /* UI still usable without persistence */
    }
    return () => {
      document.documentElement.dataset.theme = "light";
    };
  }, [dark]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommand((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const notify = (s: string) => setToast(s);
  const props = { loc, actor, notify };
  const current =
    nav.find((n) => n.path === location.pathname)?.name || "Workspace";
  const startTour = () => {
    setLoc("All locations");
    setTour(0);
    navigate("/app");
    setMobile(false);
  };
  return (
    <div className={`workspace ${collapsed ? "collapsed" : ""}`}>
      <a href="#workspace-content" className="skip-link">
        Skip to content
      </a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <Link to="/" className="sidebar-brand" aria-label="StockPilot homepage">
          <Brand />
        </Link>
        <div className="workspace-name">
          <span className="workspace-avatar">H</span>
          <div>
            <strong>Harbor & Hearth</strong>
            <small>Hospitality demo workspace</small>
          </div>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Workspace navigation">
          {nav.map((n, i) => (
            <div key={n.path}>
              {i === 6 && <span className="nav-label">MANAGEMENT</span>}
              <NavLink
                end={n.path === "/app"}
                to={n.path}
                onClick={() => setMobile(false)}
                title={collapsed ? n.name : undefined}
              >
                <n.icon size={19} />
                <span>{n.name}</span>
                {n.name === "Alert center" && alertCount > 0 && (
                  <span className="nav-count">{alertCount}</span>
                )}
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="tour-button" onClick={startTour}>
            <Play size={16} />
            <span>Take a guided tour</span>
            <ArrowUpRight size={14} />
          </button>
          <Link to="/" className="portfolio-label">
            <span className="dot" />
            PORTFOLIO DEMO
          </Link>
          <p>
            Concept software.
            <br />
            Fictional business data.
          </p>
          <button
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
            <span>Collapse sidebar</span>
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumbs">
            Workspace <span>/</span>
            <strong>{current}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="command-button"
              onClick={() => {
                setSearch("");
                setCommand(true);
              }}
            >
              <Search size={16} />
              <span>Search anything…</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div className="location-selector">
              <MapPin size={15} />
              <select
                aria-label="Current location"
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
              >
                {["All locations", ...locations].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <button
              className="icon-button"
              aria-label={dark ? "Use light theme" : "Use dark theme"}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              className="notification-button"
              to="/app/alerts"
              aria-label={`${alertCount} stock and task alerts`}
            >
              <Bell size={19} />
              {alertCount > 0 && <span />}
            </Link>
            <div className="actor-select">
              <span className="avatar small">{actor.slice(0, 1)}</span>
              <select
                aria-label="Simulated demo actor"
                value={actor}
                onChange={(e) => setActor(e.target.value)}
              >
                {[
                  "Alex · Owner",
                  "Noah · Manager",
                  "Maya · Bartender",
                  "Theo · Kitchen staff",
                ].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </header>
        <div className="demo-bar">
          <span>
            <span className="dot" />
            <strong>Portfolio Demo</strong>
            <span className="demo-description">
              {" "}
              · Fictional data · saved in this browser. Roles are simulated.
            </span>
          </span>
          <button onClick={() => setResetOpen(true)}>
            <RotateCcw size={13} />
            Reset Demo Data
          </button>
        </div>
        {warning && (
          <div role="alert" className="error storage-warning">
            {warning}
            <button className="button" onClick={exportRecovery}>Download saved data</button>
          </div>
        )}
        <main id="workspace-content" className="content">
          <Suspense fallback={<p role="status">Loading workspace…</p>}><Routes>
            <Route index element={<Overview {...props} />} />
            <Route path="inventory" element={<Inventory {...props} />} />
            <Route
              path="orders"
              element={<Purchasing actor={actor} notify={notify} loc={loc} />}
            />
            <Route
              path="suppliers"
              element={
                <Purchasing actor={actor} notify={notify} loc={loc} directory />
              }
            />
            <Route path="recipes" element={<Recipes {...props} />} />
            <Route path="waste" element={<Waste {...props} />} />
            <Route
              path="operations"
              element={<Operations actor={actor} notify={notify} />}
            />
            <Route path="reports" element={<Reports loc={loc} />} />
            <Route path="alerts" element={<Alerts loc={loc} />} />
            <Route
              path="*"
              element={
                <div className="empty">
                  <h1>Workspace page not found</h1>
                  <Link to="/app">Return to overview</Link>
                </div>
              }
            />
          </Routes></Suspense>
          <footer className="app-footer">
            <span>
              <span className="dot" />
              Browser-local demo · schema v1
            </span>
            <span>Role selection is simulated; no real authentication.</span>
            <span>StockPilot / Demo 03</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {resetOpen && (
        <Modal
          title="Reset this demo workspace?"
          onClose={() => setResetOpen(false)}
        >
          <p>
            This replaces your browser’s StockPilot changes with the original
            fictional sample inventory, orders, recipes, and tasks.
          </p>
          <p className="hint">Other visitors’ workspaces are independent.</p>
          <div className="form-actions">
            <button className="button" onClick={() => setResetOpen(false)}>
              Keep changes
            </button>
            <button
              className="button primary"
              onClick={async () => {
                if (!await reset()) return;
                setResetOpen(false);
                notify("Original demo data restored");
              }}
            >
              Reset demo
            </button>
          </div>
        </Modal>
      )}
      {command && (
        <Modal title="Search your workspace" onClose={() => setCommand(false)}>
          <div className="search-field command-search">
            <Search size={19} />
            <input
              autoFocus
              aria-label="Search workspace"
              placeholder="Pages, products, or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Keyboard size={18} />
          </div>
          <div className="command-results">
            <span className="nav-label">GO TO</span>
            {nav
              .filter((n) =>
                n.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((n) => (
                <button
                  key={n.path}
                  onClick={() => {
                    navigate(n.path);
                    setCommand(false);
                  }}
                >
                  <n.icon size={17} />
                  {n.name}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            <span className="nav-label">INVENTORY ITEMS</span>
            {state.products
              .filter(
                (p) =>
                  !p.archived &&
                  `${p.name} ${p.sku}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              .slice(0, 6)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setEdit(p);
                    setCommand(false);
                  }}
                >
                  <Package size={17} />
                  {p.name}
                  <small>{p.sku}</small>
                </button>
              ))}
          </div>
        </Modal>
      )}
      {edit && (
        <ProductForm
          product={edit}
          loc={loc}
          actor={actor}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            notify("Item updated");
          }}
        />
      )}
      {tour !== null && (
        <GuidedTour
          key={tour}
          step={tour}
          onClose={() => setTour(null)}
          onChange={(step) => {
            setTour(step);
            navigate(tourSteps[step].path);
          }}
        />
      )}
    </div>
  );
}
