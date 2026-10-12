import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  AlertTriangle,
  Package,
  Wallet,
  ArrowDownRight,
  Plus,
  CheckCircle2,
  Clock,
  Truck,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useStore } from "./store";
import { money, quantity, recipeCost, round, eventDay } from "./domain";
import { categories, type Movement, type State } from "./types";
import { day } from "./seed";
import { Badge, Empty, Export, ItemIcon, inventoryRows } from "./ui";
import { MovementForm } from "./Inventory";
export const activeProducts = (s: State) =>
  s.products.filter((p) => !p.archived);
export const scopedMovements = (s: State, loc: string) =>
  s.movements.filter((m) => loc === "All locations" || m.location === loc);
export function trend(events: Movement[], days = 14) {
  return Array.from({ length: days }, (_, i) => {
    const date = day(i - days + 1),
      rows = events.filter((m) => eventDay(m.at) === date);
    return {
      date,
      label: date.slice(5),
      Consumption: round(
        rows
          .filter((m) => m.type === "Recipe")
          .reduce((n, m) => n - m.delta * m.cost, 0),
      ),
      Waste: round(
        rows
          .filter((m) => m.type === "Waste")
          .reduce((n, m) => n - m.delta * m.cost, 0),
      ),
    };
  });
}
export function TrendChart({
  events,
  waste = false,
}: {
  events: Movement[];
  waste?: boolean;
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label={`${waste ? "Waste" : "Recipe consumption"} cost by day in USD, based on recorded events`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={trend(events)}
          margin={{ top: 12, right: 15, left: -15, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 5"
            stroke="var(--line)"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <Tooltip formatter={(v) => money(Number(v))} />
          <Area
            type="monotone"
            dataKey={waste ? "Waste" : "Consumption"}
            stroke={waste ? "#b97334" : "#168565"}
            fill={waste ? "#b9733420" : "#16856518"}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function CategoryChart({
  rows,
}: {
  rows: { name: string; value: number }[];
}) {
  return (
    <div
      className="chart category-chart"
      role="img"
      aria-label="Value in USD by category"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ left: 0, right: 25, top: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={75}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <Tooltip formatter={(v) => money(Number(v))} />
          <Bar
            dataKey="value"
            fill="#168565"
            radius={[0, 3, 3, 0]}
            barSize={12}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Ledger({
  events,
  limit,
}: {
  events: Movement[];
  limit?: number;
}) {
  const { state } = useStore();
  const rows = limit ? events.slice(0, limit) : events;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Item / activity</th>
            <th>Location</th>
            <th>Before → after</th>
            <th>Change</th>
            <th>Actor / time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id}>
              <td>
                <strong>
                  {state.products.find((p) => p.id === m.product)?.name}
                </strong>
                <small className="block">
                  {m.type} · {m.reason}
                </small>
              </td>
              <td>{m.location}</td>
              <td className="tabular">
                {round(m.before)} → {round(m.after)}
              </td>
              <td className={m.delta < 0 ? "negative" : "positive"}>
                {m.delta > 0 ? "+" : ""}
                {round(m.delta)}{" "}
                <small>
                  {state.products.find((p) => p.id === m.product)?.unit}
                </small>
              </td>
              <td>
                <span>{m.actor}</span>
                <small className="block">
                  {new Date(m.at).toLocaleString()}
                </small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <Empty
          title="No movements recorded"
          text="Inventory changes will appear here with before and after quantities."
        />
      )}
    </div>
  );
}
export function Overview({
  loc,
  actor,
  notify,
}: {
  loc: string;
  actor: string;
  notify: (s: string) => void;
}) {
  const { state } = useStore(),
    [move, setMove] = useState(false);
  const products = activeProducts(state),
    events = scopedMovements(state, loc),
    low = products.filter(
      (p) =>
        quantity(state, p.id, loc) > 0 && quantity(state, p.id, loc) < p.min,
    ),
    out = products.filter((p) => quantity(state, p.id, loc) === 0),
    value = products.reduce(
      (n, p) => n + quantity(state, p.id, loc) * p.cost,
      0,
    ),
    waste = events
      .filter((m) => m.type === "Waste" && eventDay(m.at) >= day(-6))
      .reduce((n, m) => n - m.delta * m.cost, 0),
    open = state.orders.filter(
      (o) =>
        ["Ordered", "Partially received"].includes(o.status) &&
        (loc === "All locations" || o.location === loc),
    ),
    cat = categories.map((c) => ({
      name: c,
      value: products
        .filter((p) => p.category === c)
        .reduce((n, p) => n + quantity(state, p.id, loc) * p.cost, 0),
    }));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR OPERATION, IN VIEW</span>
          <h1>Overview</h1>
          <p>Ready for a smoother service. Here’s where things stand.</p>
        </div>
        <button className="button primary" onClick={() => setMove(true)}>
          <Plus size={16} />
          Record movement
        </button>
      </div>
      <div className="stats">
        <article>
          <span>
            Inventory value <Wallet size={17} />
          </span>
          <strong>{money(value)}</strong>
          <small>At current unit costs</small>
        </article>
        <article>
          <span>
            Active products <Package size={17} />
          </span>
          <strong>{products.length}</strong>
          <small>
            Across {loc === "All locations" ? "4 locations" : "this view"}
          </small>
        </article>
        <article className="attention">
          <span>
            Low stock <AlertTriangle size={17} />
          </span>
          <strong>{low.length}</strong>
          <small>Below minimum stock level</small>
        </article>
        <article>
          <span>
            Out of stock <ArrowDownRight size={17} />
          </span>
          <strong>{out.length}</strong>
          <small>Ready for replenishment</small>
        </article>
      </div>
      <div className="dashboard-grid">
        <section className="panel wide">
          <div className="panel-heading">
            <div>
              <h2>Stock consumption</h2>
              <p>Ingredient value used in recorded recipe events</p>
            </div>
            <Badge>Last 14 days · USD</Badge>
          </div>
          <TrendChart events={events} />
          <div className="chart-foot">
            <span className="dot" />
            Recorded consumption{" "}
            <span>
              {money(
                events
                  .filter(
                    (m) => m.type === "Recipe" && eventDay(m.at) >= day(-13),
                  )
                  .reduce((n, m) => n - m.delta * m.cost, 0),
              )}{" "}
              total
            </span>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Inventory mix</h2>
              <p>Value by category</p>
            </div>
          </div>
          <CategoryChart rows={cat} />
          <div className="chart-foot">
            Current active stock <strong>{money(value)}</strong>
          </div>
        </section>
        <section className="panel wide">
          <div className="panel-heading">
            <div>
              <h2>Needs your attention</h2>
              <p>Small actions that keep service on track</p>
            </div>
            <Link to="/app/alerts" className="text-button">
              All alerts <ArrowUpRight size={15} />
            </Link>
          </div>
          {[...out, ...low].slice(0, 4).map((p) => (
            <div className="attention-row" key={p.id}>
              <ItemIcon category={p.category} />
              <div>
                <strong>{p.name}</strong>
                <small>
                  {round(quantity(state, p.id, loc))} {p.unit} on hand · min{" "}
                  {p.min}
                </small>
              </div>
              <Badge tone={quantity(state, p.id, loc) === 0 ? "red" : "amber"}>
                {quantity(state, p.id, loc) === 0
                  ? "Out of stock"
                  : "Low stock"}
              </Badge>
              <Link className="text-button" to="/app/orders">
                Reorder <ArrowUpRight size={14} />
              </Link>
            </div>
          ))}
          {!low.length && !out.length && (
            <Empty
              title="Stock levels look good"
              text="No products below the configured minimum."
            />
          )}
          <div className="panel-bottom">
            Reorder rule: top up to 2 × minimum, less outstanding orders at the
            selected location.
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>On the way</h2>
              <p>{open.length} open purchase orders</p>
            </div>
            <Truck size={19} />
          </div>
          {open.slice(0, 3).map((o) => (
            <Link to="/app/orders" className="delivery" key={o.id}>
              <span className="delivery-icon">
                <Truck size={18} />
              </span>
              <div>
                <strong>
                  {state.suppliers.find((s) => s.id === o.supplier)?.name}
                </strong>
                <small>
                  {o.id} · Due {o.expected}
                </small>
              </div>
              <Badge tone="amber">{o.status}</Badge>
            </Link>
          ))}
          {!open.length && <p className="hint pad">No upcoming deliveries.</p>}
          <div className="waste-summary">
            <span>Waste · last 7 days</span>
            <strong>{money(waste)}</strong>
            <Link to="/app/waste" className="text-button">
              View losses <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent activity</h2>
            <p>A clear trail of every stock change</p>
          </div>
          <Link to="/app/reports" className="text-button">
            Full ledger <ArrowUpRight size={15} />
          </Link>
        </div>
        <Ledger events={events} limit={5} />
      </section>
      {move && (
        <MovementForm
          loc={loc}
          actor={actor}
          onClose={() => setMove(false)}
          onSaved={() => {
            setMove(false);
            notify("Stock movement recorded");
          }}
        />
      )}
    </>
  );
}
export function Waste({
  loc,
  actor,
  notify,
}: {
  loc: string;
  actor: string;
  notify: (s: string) => void;
}) {
  const { state } = useStore(),
    [record, setRecord] = useState(false),
    [from, setFrom] = useState(day(-13)),
    [to, setTo] = useState(day()),
    [cat, setCat] = useState("All categories");
  const events = scopedMovements(state, loc).filter(
      (m) =>
        m.type === "Waste" &&
        eventDay(m.at) >= from &&
        eventDay(m.at) <= to &&
        (cat === "All categories" ||
          state.products.find((p) => p.id === m.product)?.category === cat),
    ),
    total = events.reduce((n, m) => n - m.delta * m.cost, 0),
    reasons = [...new Set(events.map((m) => m.reason))].map((name) => ({
      name,
      value: events
        .filter((m) => m.reason === name)
        .reduce((n, m) => n - m.delta * m.cost, 0),
    })),
    rows = categories.map((name) => ({
      name,
      value: events
        .filter(
          (m) =>
            state.products.find((p) => p.id === m.product)?.category === name,
        )
        .reduce((n, m) => n - m.delta * m.cost, 0),
    }));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LESS WASTE. MORE CONTROL.</span>
          <h1>Waste & loss</h1>
          <p>Track what’s lost, understand why, and act sooner.</p>
        </div>
        <button className="button primary" onClick={() => setRecord(true)}>
          <Plus size={16} />
          Record waste
        </button>
      </div>
      <div className="filterbar standalone">
        <FieldDate label="Waste from" value={from} set={setFrom} />
        <FieldDate label="Waste to" value={to} set={setTo} />
        <select
          aria-label="Waste category"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          {["All categories", ...categories].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <Export
          name="waste-report"
          rows={events.map((m) => ({
            Date: m.at,
            Product: state.products.find((p) => p.id === m.product)?.name,
            Category: state.products.find((p) => p.id === m.product)?.category,
            Location: m.location,
            Quantity: -m.delta,
            Unit: state.products.find((p) => p.id === m.product)?.unit,
            "Loss USD": -m.delta * m.cost,
            Reason: m.reason,
            Actor: m.actor,
          }))}
        />
      </div>
      <div className="stats small-stats">
        <article>
          <span>Recorded loss value</span>
          <strong>{money(total)}</strong>
        </article>
        <article>
          <span>Waste events</span>
          <strong>{events.length}</strong>
        </article>
        <article>
          <span>Largest loss reason</span>
          <strong className="text-stat">
            {reasons.sort((a, b) => b.value - a.value)[0]?.name || "No losses"}
          </strong>
        </article>
      </div>
      <div className="dashboard-grid">
        <section className="panel wide">
          <div className="panel-heading">
            <div>
              <h2>Waste over time</h2>
              <p>Loss value at the cost recorded when wasted · last 14 days</p>
            </div>
          </div>
          <TrendChart events={events} waste />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Loss by category</h2>
              <p>Filtered loss value · USD</p>
            </div>
          </div>
          <CategoryChart rows={rows} />
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <h2>Recorded waste events</h2>
        </div>
        <Ledger events={events} />
      </section>
      {record && (
        <MovementForm
          kind="Waste"
          loc={loc}
          actor={actor}
          onClose={() => setRecord(false)}
          onSaved={() => {
            setRecord(false);
            notify("Waste recorded. Inventory reduced.");
          }}
        />
      )}
    </>
  );
}
function FieldDate({
  label,
  value,
  set,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
}) {
  return (
    <label className="date-filter">
      <span>{label}</span>
      <input
        aria-label={label}
        type="date"
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </label>
  );
}
export function Reports({ loc }: { loc: string }) {
  const { state } = useStore(),
    [report, setReport] = useState("Valuation"),
    [cat, setCat] = useState("All categories"),
    [supplier, setSupplier] = useState("All suppliers"),
    [from, setFrom] = useState(day(-13)),
    [to, setTo] = useState(day());
  const productMatches = (id: string) => {
    const p = state.products.find((p) => p.id === id);
    return (
      p &&
      (cat === "All categories" || p.category === cat) &&
      (supplier === "All suppliers" || p.supplier === supplier)
    );
  };
  const products = state.products.filter((p) => productMatches(p.id));
  const events = scopedMovements(state, loc).filter(
    (m) =>
      productMatches(m.product) &&
      eventDay(m.at) >= from &&
      eventDay(m.at) <= to,
  );
  let rows: Record<string, unknown>[] = [];
  if (report === "Valuation" || report === "Low stock")
    rows = inventoryRows(
      state,
      products.filter(
        (p) =>
          report === "Valuation" ||
          (!p.archived && quantity(state, p.id, loc) < p.min),
      ),
      loc,
    ).map((r, i) => ({
      ...r,
      ...(report === "Valuation"
        ? { Archived: products[i].archived ? "Yes" : "No" }
        : {}),
    }));
  if (report === "Movements" || report === "Waste")
    rows = events
      .filter((m) => report !== "Waste" || m.type === "Waste")
      .map((m) => ({
        Timestamp: m.at,
        Product: state.products.find((p) => p.id === m.product)?.name,
        Location: m.location,
        Type: m.type,
        Before: m.before,
        After: m.after,
        Delta: m.delta,
        Unit: state.products.find((p) => p.id === m.product)?.unit,
        "Event unit cost USD": m.cost,
        "Movement value USD": round(m.delta * m.cost),
        Reason: m.reason,
        Actor: m.actor,
        "Transaction group": m.group,
      }));
  if (report === "Recipe costs")
    rows = state.recipes
      .filter((r) => r.ingredients.some((i) => productMatches(i.product)))
      .map((r) => {
        const cost = recipeCost(state, r);
        return {
          Recipe: r.name,
          Category: r.category,
          "Ingredient cost USD": round(cost),
          "Menu price USD": r.price,
          "Theoretical profit USD": round(r.price - cost),
          "Cost %": round((cost / r.price) * 100),
          "Margin %": round((1 - cost / r.price) * 100),
        };
      });
  if (report === "Purchasing")
    rows = state.orders
      .filter(
        (o) =>
          (supplier === "All suppliers" || o.supplier === supplier) &&
          (loc === "All locations" || o.location === loc) &&
          eventDay(o.created) >= from &&
          eventDay(o.created) <= to,
      )
      .flatMap((o) =>
        o.lines
          .filter((l) => productMatches(l.product))
          .map((l) => ({
            Order: o.id,
            Supplier: state.suppliers.find((s) => s.id === o.supplier)?.name,
            Product: state.products.find((p) => p.id === l.product)?.name,
            Location: o.location,
            Status: o.status,
            Ordered: l.quantity,
            Received: l.received,
            "Ordered value USD": l.quantity * l.cost,
            "Received value USD": l.received * l.cost,
            "Expected delivery": o.expected,
          })),
      );
  if (report === "Consumption")
    rows = products
      .filter((p) =>
        events.some((m) => m.product === p.id && m.type === "Recipe"),
      )
      .map((p) => {
        const recorded = events.filter(
          (m) => m.product === p.id && m.type === "Recipe",
        );
        return {
          Product: p.name,
          Category: p.category,
          "Consumed quantity": round(recorded.reduce((n, m) => n - m.delta, 0)),
          Unit: p.unit,
          "Consumed value USD": round(
            recorded.reduce((n, m) => n - m.delta * m.cost, 0),
          ),
          Events: recorded.length,
        };
      });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">FROM STOCK TO INSIGHT</span>
          <h1>Reports</h1>
          <p>Useful numbers, traceable to the records behind them.</p>
        </div>
        <Export
          rows={rows}
          name={`stockpilot-${report.toLowerCase().replace(" ", "-")}`}
        />
      </div>
      <div className="tabs report-tabs">
        {[
          "Valuation",
          "Low stock",
          "Purchasing",
          "Waste",
          "Movements",
          "Recipe costs",
          "Consumption",
        ].map((r) => (
          <button
            className={report === r ? "active" : ""}
            key={r}
            onClick={() => setReport(r)}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="panel">
        <div className="filterbar">
          <select
            aria-label="Report category"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            {["All categories", ...categories].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Report supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          >
            <option>All suppliers</option>
            {state.suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {!["Valuation", "Low stock", "Recipe costs"].includes(report) && (
            <>
              <FieldDate label="From" value={from} set={setFrom} />
              <FieldDate label="To" value={to} set={setTo} />
            </>
          )}
        </div>
        {["Valuation", "Low stock", "Recipe costs"].includes(report) && (
          <p className="hint pad">
            Current balances and current ingredient costs. Historical movement
            and waste costs use each event’s recorded cost. Recipe results are
            theoretical.
          </p>
        )}
        {report === "Valuation" && (
          <div className="valuation-chart">
            <CategoryChart
              rows={categories.map((name) => ({
                name,
                value: products
                  .filter((p) => p.category === name)
                  .reduce((n, p) => n + quantity(state, p.id, loc) * p.cost, 0),
              }))}
            />
          </div>
        )}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {Object.keys(rows[0] || {}).map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {Object.entries(row).map(([k, v]) => (
                    <td key={k}>
                      {typeof v === "number" ? round(v) : String(v ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty />}
        </div>
        <div className="table-foot">
          {rows.length} records · {loc} · CSV exports match this filtered view
        </div>
      </div>
    </>
  );
}
export function Alerts({ loc }: { loc: string }) {
  const { state } = useStore();
  const products = activeProducts(state),
    events = scopedMovements(state, loc),
    open = state.orders.filter(
      (o) =>
        ["Ordered", "Partially received"].includes(o.status) &&
        (loc === "All locations" || o.location === loc),
    ),
    loss = events
      .filter((m) => m.type === "Waste" && eventDay(m.at) >= day(-6))
      .reduce((n, m) => n - m.delta * m.cost, 0);
  const low = products.filter((p) => quantity(state, p.id, loc) < p.min),
    tasks = state.tasks.filter((t) => !t.done);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE AHEAD OF SERVICE</span>
          <h1>Alert center</h1>
          <p>Practical signals. Explicit rules. Clear next steps.</p>
        </div>
        <Badge>
          {low.length + open.length + tasks.length + (loss > 25 ? 1 : 0)}{" "}
          actionable alerts
        </Badge>
      </div>
      <div className="callout subtle">
        Reorder suggestion = max(0, 2 × minimum − current stock − outstanding
        ordered quantities). Minimum is evaluated at the selected location.
        Company view uses total stock. High waste = more than $25 in recorded
        losses over the last 7 days.
      </div>
      <div className="panel alerts-list">
        {low.map((p) => {
          const q = quantity(state, p.id, loc),
            outstanding = open.reduce(
              (n, o) =>
                n +
                o.lines
                  .filter((l) => l.product === p.id)
                  .reduce((n, l) => n + l.quantity - l.received, 0),
              0,
            );
          return (
            <div className="alert-row" key={p.id}>
              <span className="alert-icon">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h3>
                  {p.name} · {q === 0 ? "out of stock" : "below minimum"}
                </h3>
                <p>
                  {round(q)} {p.unit} available · minimum {p.min} ·{" "}
                  {round(outstanding)} incoming
                </p>
                <small>
                  Suggested reorder:{" "}
                  {round(Math.max(0, 2 * p.min - q - outstanding))} {p.unit}
                </small>
              </div>
              <Link className="button compact" to="/app/orders">
                Review orders
              </Link>
            </div>
          );
        })}
        {open.map((o) => (
          <div className="alert-row" key={o.id}>
            <span className="alert-icon green">
              <Truck size={20} />
            </span>
            <div>
              <h3>{o.id} · expected delivery</h3>
              <p>
                Due {o.expected} at {o.location}
              </p>
            </div>
            <Link className="button compact" to="/app/orders">
              Receive stock
            </Link>
          </div>
        ))}
        {loss > 25 && (
          <div className="alert-row">
            <AlertTriangle />
            <div>
              <h3>Waste exceeds the demo threshold</h3>
              <p>{money(loss)} in 7 days · threshold $25</p>
            </div>
            <Link to="/app/waste" className="button">
              Review waste
            </Link>
          </div>
        )}
        {tasks.map((t) => (
          <div className="alert-row" key={t.id}>
            <span className="alert-icon neutral">
              <Clock size={20} />
            </span>
            <div>
              <h3>{t.title}</h3>
              <p>
                {t.owner} · {t.kind} checklist incomplete
              </p>
            </div>
            <Link className="button compact" to="/app/operations">
              Open checklist
            </Link>
          </div>
        ))}
        {!low.length && !open.length && !tasks.length && loss <= 25 && (
          <div className="empty">
            <CheckCircle2 />
            <h3>All clear</h3>
          </div>
        )}
      </div>
    </>
  );
}
