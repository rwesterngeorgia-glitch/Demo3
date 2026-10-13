import { useState } from "react";
import { Plus, Truck, Mail, Phone, Trash2, ArrowRight } from "lucide-react";
import { useStore } from "./store";
import { locations, type Order } from "./types";
import { money, round, uid } from "./domain";
import { day } from "./seed";
import { Modal, Field, Badge, Empty, Export } from "./ui";
export default function Purchasing({
  actor,
  notify,
  directory = false,
  loc = "All locations",
}: {
  actor: string;
  notify: (s: string) => void;
  directory?: boolean;
  loc?: string;
}) {
  const { state, dispatch } = useStore(),
    [create, setCreate] = useState(false),
    [selected, setSelected] = useState<Order | null>(null),
    [filter, setFilter] = useState("All statuses"),
    [supplierFilter, setSupplierFilter] = useState("All suppliers"),
    [cancel, setCancel] = useState<Order | null>(null);
  const locationOrders = state.orders.filter(
    (o) => loc === "All locations" || o.location === loc,
  );
  const orders = locationOrders.filter(
    (o) =>
      (filter === "All statuses" || o.status === filter) &&
      (supplierFilter === "All suppliers" || o.supplier === supplierFilter),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">KEEP SERVICE MOVING</span>
          <h1>{directory ? "Suppliers" : "Purchase orders"}</h1>
          <p>
            {directory
              ? "Good relationships start with a clear order history."
              : "From draft to delivery, with every unit accounted for."}
          </p>
        </div>
        <button className="button primary" onClick={() => setCreate(true)}>
          <Plus size={16} />
          New purchase order
        </button>
      </div>
      {directory ? (
        <div className="supplier-grid">
          {state.suppliers.map((s) => {
            const orders = locationOrders.filter((o) => o.supplier === s.id);
            return (
              <article className="panel supplier" key={s.id}>
                <span className="supplier-logo">
                  {s.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <h2>{s.name}</h2>
                <p>
                  {s.contact} · {s.lead}-day typical lead time
                </p>
                <p>
                  <Mail size={15} />
                  {s.email}
                </p>
                <p>
                  <Phone size={15} />
                  {s.phone}
                </p>
                <div className="strip">
                  <span>{orders.length} orders</span>
                  <strong>
                    {money(
                      orders
                        .filter((o) => o.status !== "Canceled")
                        .reduce(
                          (sum, o) =>
                            sum +
                            o.lines.reduce(
                              (n, l) => n + l.quantity * l.cost,
                              0,
                            ),
                          0,
                        ),
                    )}{" "}
                    ordered
                  </strong>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setSupplierFilter(s.id);
                    setCreate(true);
                  }}
                >
                  Create an order <ArrowRight size={15} />
                </button>
                <small>Fictional supplier information</small>
              </article>
            );
          })}
        </div>
      ) : (
        <>
          <div className="stats small-stats">
            <article>
              <span>Open orders</span>
              <strong>
                {
                  locationOrders.filter((o) =>
                    ["Ordered", "Partially received"].includes(o.status),
                  ).length
                }
              </strong>
            </article>
            <article>
              <span>Outstanding value</span>
              <strong>
                {money(
                  locationOrders
                    .filter((o) =>
                      ["Ordered", "Partially received"].includes(o.status),
                    )
                    .reduce(
                      (n, o) =>
                        n +
                        o.lines.reduce(
                          (sum, l) => sum + (l.quantity - l.received) * l.cost,
                          0,
                        ),
                      0,
                    ),
                )}
              </strong>
            </article>
            <article>
              <span>Received value</span>
              <strong>
                {money(
                  locationOrders.reduce(
                    (n, o) =>
                      n +
                      o.lines.reduce((sum, l) => sum + l.received * l.cost, 0),
                    0,
                  ),
                )}
              </strong>
            </article>
          </div>
          <div className="panel">
            <div className="filterbar">
              <select
                aria-label="Order status filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {[
                  "All statuses",
                  "Draft",
                  "Ordered",
                  "Partially received",
                  "Received",
                  "Canceled",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                aria-label="Order supplier filter"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option>All suppliers</option>
                {state.suppliers.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Export
                name="purchase-orders"
                rows={orders.map((o) => ({
                  Order: o.id,
                  Supplier: state.suppliers.find((s) => s.id === o.supplier)
                    ?.name,
                  Status: o.status,
                  "Expected delivery": o.expected,
                  Location: o.location,
                  "Ordered value USD": o.lines.reduce(
                    (n, l) => n + l.quantity * l.cost,
                    0,
                  ),
                  "Received value USD": o.lines.reduce(
                    (n, l) => n + l.received * l.cost,
                    0,
                  ),
                }))}
              />
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Supplier</th>
                    <th>Delivery</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.id}</strong>
                        <small className="block">
                          {o.lines.length} items · {o.location}
                        </small>
                      </td>
                      <td>
                        {state.suppliers.find((s) => s.id === o.supplier)?.name}
                      </td>
                      <td>{o.expected}</td>
                      <td>
                        {money(
                          o.lines.reduce((n, l) => n + l.quantity * l.cost, 0),
                        )}
                      </td>
                      <td>
                        <Badge
                          tone={
                            o.status === "Received"
                              ? "green"
                              : o.status === "Canceled"
                                ? "red"
                                : "amber"
                          }
                        >
                          {o.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="button compact"
                            onClick={() => setSelected(o)}
                          >
                            {["Ordered", "Partially received"].includes(
                              o.status,
                            )
                              ? "Receive"
                              : "View"}
                          </button>
                          {o.status === "Draft" && (
                            <button
                              className="button compact"
                              onClick={async () => {
                                if (!await dispatch({
                                  type: "orderStatus",
                                  id: o.id,
                                  status: "Ordered",
                                })) return;
                                notify("Purchase order placed in demo");
                              }}
                            >
                              Place order
                            </button>
                          )}
                          {!["Canceled", "Received"].includes(o.status) && (
                            <button
                              className="icon-button"
                              aria-label={`Cancel ${o.id}`}
                              onClick={() => setCancel(o)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!orders.length && (
                <Empty
                  title="No purchase orders"
                  text="Create an order to start replenishing stock."
                />
              )}
            </div>
          </div>
        </>
      )}
      {create && (
        <OrderForm
          initialLocation={loc === "All locations" ? "Storage room" : loc}
          supplier={supplierFilter === "All suppliers" ? state.products.find(p=>!p.archived)?.supplier || state.suppliers[0]?.id || "" : supplierFilter}
          actor={actor}
          onClose={() => setCreate(false)}
          onSaved={() => {
            setCreate(false);
            notify("Purchase order saved");
          }}
        />
      )}
      {selected && (
        <ReceiveForm
          order={state.orders.find((o) => o.id === selected.id)!}
          actor={actor}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            notify("Delivery received. Stock and ledger updated.");
          }}
        />
      )}
      {cancel && (
        <Modal title="Cancel purchase order" onClose={() => setCancel(null)}>
          <p>
            Cancel the outstanding balance of {cancel.id}? Previously received
            stock remains in inventory.
          </p>
          <div className="form-actions">
            <button className="button" onClick={() => setCancel(null)}>
              Keep order
            </button>
            <button
              className="button danger"
              onClick={async () => {
                if (!await dispatch({
                  type: "orderStatus",
                  id: cancel.id,
                  status: "Canceled",
                })) return;
                setCancel(null);
                notify("Order canceled");
              }}
            >
              Cancel order
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function OrderForm({
  initialLocation,
  supplier,
  onClose,
  onSaved,
}: {
  initialLocation: string;
  supplier: string;
  actor: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { state, dispatch } = useStore(),
    [sid, setSid] = useState(supplier),
    [loc, setLoc] = useState(initialLocation),
    [expected, setExpected] = useState(day(3)),
    [draft, setDraft] = useState(false),
    [error, setError] = useState("");
  const options = state.products.filter(
    (p) => !p.archived && p.supplier === sid,
  );
  const line = (id = options[0]?.id || "") => ({
    product: id,
    quantity: 1,
    received: 0,
    cost: state.products.find((p) => p.id === id)?.cost || 0,
  });
  const [lines, setLines] = useState([line()]);
  const change = (i: number, k: string, v: string | number) =>
    setLines(
      lines.map((l, j) =>
        j === i
          ? {
              ...l,
              [k]: v,
              ...(k === "product"
                ? { cost: state.products.find((p) => p.id === v)!.cost }
                : {}),
            }
          : l,
      ),
    );
  return (
    <Modal title="Create purchase order" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            if (!await dispatch({
              type: "order",
              order: {
                id: `PO-${Date.now().toString().slice(-6)}`,
                supplier: sid,
                location: loc,
                expected,
                status: draft ? "Draft" : "Ordered",
                created: new Date().toISOString(),
                lines,
              },
            })) return;
            onSaved();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <div className="form-grid">
          <Field label="Supplier">
            <select
              value={sid}
              onChange={(e) => {
                const id = e.target.value;
                setSid(id);
                const p = state.products.find(
                  (p) => p.supplier === id && !p.archived,
                );
                setLines([
                  { product: p?.id || "", quantity: 1, received: 0, cost: p?.cost || 0 },
                ]);
              }}
            >
              {state.suppliers.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Receive at">
            <select value={loc} onChange={(e) => setLoc(e.target.value)}>
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Expected delivery">
            <input
              type="date"
              required
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
            />
          </Field>
        </div>
        <div className="line-list">
          {!options.length && <p className="callout">No active items for this supplier. Choose another supplier or restore its items from “Show archived items” in Inventory.</p>}
          {lines.map((l, i) => (
            <div key={i} className="order-line">
              <Field label={`Item ${i + 1}`}>
                <select
                  value={l.product}
                  onChange={(e) => change(i, "product", e.target.value)}
                >
                  {options.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantity (base units)">
                <input
                  type="number"
                  min="0.000001"
                  step="any"
                  required
                  value={l.quantity}
                  onChange={(e) => change(i, "quantity", +e.target.value)}
                />
              </Field>
              <Field label="Cost per unit ($)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={l.cost}
                  onChange={(e) => change(i, "cost", +e.target.value)}
                />
              </Field>
              <button
                className="icon-button"
                type="button"
                aria-label={`Remove line ${i + 1}`}
                disabled={lines.length === 1}
                onClick={() => setLines(lines.filter((_, j) => j !== i))}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() =>
            setLines([
              ...lines,
              line(
                options.find((p) => !lines.some((l) => l.product === p.id))?.id,
              ),
            ])
          }
        >
          <Plus size={15} />
          Add line item
        </button>
        <div className="strip">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft}
              onChange={(e) => setDraft(e.target.checked)}
            />
            Save as draft
          </label>
          <strong>
            Total {money(lines.reduce((n, l) => n + l.quantity * l.cost, 0))}
          </strong>
        </div>
        <p className="hint">Orders are simulated. No supplier is contacted.</p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">Save purchase order</button>
        </div>
      </form>
    </Modal>
  );
}
function ReceiveForm({
  order,
  actor,
  onClose,
  onSaved,
}: {
  order: Order;
  actor: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { state, dispatch } = useStore(),
    [values, setValues] = useState(order.lines.map(() => 0)),
    [receipt] = useState(uid),
    [error, setError] = useState("");
  const open = ["Ordered", "Partially received"].includes(order.status);
  return (
    <Modal
      title={`${open ? "Receive delivery" : "Order details"} · ${order.id}`}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            if (!await dispatch({
              type: "receive",
              id: order.id,
              quantities: values,
              receipt,
              actor,
            })) return;
            onSaved();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <div className="callout">
          <Truck size={18} /> Receiving at {order.location} · {order.expected}
          <p>
            Enter this delivery only. Outstanding balances update after each
            receipt. The same submitted delivery cannot be processed twice.
          </p>
        </div>
        {order.lines.map((l, i) => {
          const p = state.products.find((p) => p.id === l.product)!;
          return (
            <div className="receive-line" key={l.product}>
              <div>
                <strong>{p.name}</strong>
                <small className="block">
                  {l.received} / {l.quantity} {p.unit} received ·{" "}
                  {money(l.cost)} / {p.unit}
                </small>
              </div>
              {open ? (
                <Field label={`Receive ${p.name}`}>
                  <input
                    type="number"
                    min="0"
                    max={round(l.quantity - l.received)}
                    step="any"
                    value={values[i]}
                    onChange={(e) =>
                      setValues(
                        values.map((n, j) => (j === i ? +e.target.value : n)),
                      )
                    }
                  />
                </Field>
              ) : (
                <Badge>{order.status}</Badge>
              )}
            </div>
          );
        })}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            Close
          </button>
          {open && <button className="button primary">Confirm receipt</button>}
        </div>
      </form>
    </Modal>
  );
}
