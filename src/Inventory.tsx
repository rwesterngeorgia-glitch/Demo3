import { useState } from "react";
import {
  Plus,
  Search,
  ArrowUpDown,
  Pencil,
  Archive,
  ArrowRightLeft,
} from "lucide-react";
import { useStore } from "./store";
import { locations, categories, type Product, type Action } from "./types";
import { quantity, money, status, round, uid } from "./domain";
import {
  Modal,
  Field,
  Badge,
  ItemIcon,
  Empty,
  Export,
  inventoryRows,
} from "./ui";
export function ProductForm({
  product,
  loc,
  actor,
  onClose,
  onSaved,
}: {
  product?: Product;
  loc: string;
  actor: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { state, dispatch } = useStore();
  const [error, setError] = useState("");
  const [p, setP] = useState<Product>(
    product || {
      id: uid(),
      name: "",
      sku: "",
      category: "Spirits",
      description: "",
      unit: "bottle",
      volume: 750,
      pack: 6,
      cost: 0,
      price: 0,
      min: 5,
      supplier: "s1",
      storage: "Storage room",
      icon: "Spirits",
      archived: false,
    },
  );
  const [initial, setInitial] = useState(0);
  const edit = (key: keyof Product, value: string | number) =>
    setP({ ...p, [key]: value });
  return (
    <Modal
      title={product ? "Edit inventory item" : "New inventory item"}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            dispatch({
              type: "product",
              product: p,
              quantity: initial,
              location: loc === "All locations" ? "Storage room" : loc,
              actor,
            });
            onSaved();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <div className="form-grid">
          <Field label="Product name">
            <input
              required
              value={p.name}
              onChange={(e) => edit("name", e.target.value)}
            />
          </Field>
          <Field label="SKU">
            <input
              required
              value={p.sku}
              onChange={(e) => edit("sku", e.target.value)}
            />
          </Field>
          <Field label="Category">
            <select
              value={p.category}
              onChange={(e) => edit("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Supplier">
            <select
              value={p.supplier}
              onChange={(e) => edit("supplier", e.target.value)}
            >
              {state.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Base inventory unit">
            <select
              disabled={!!product}
              value={p.unit}
              onChange={(e) => edit("unit", e.target.value)}
            >
              {["bottle", "kg", "L", "each"].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
          <Field label="Units per case">
            <input
              disabled={!!product}
              type="number"
              min="1"
              step="1"
              required
              value={p.pack}
              onChange={(e) => edit("pack", +e.target.value)}
            />
          </Field>
          {p.unit === "bottle" && (
            <Field label="Bottle volume (ml)">
              <input
                disabled={!!product}
                type="number"
                min="1"
                required
                value={p.volume}
                onChange={(e) => edit("volume", +e.target.value)}
              />
            </Field>
          )}
          <Field label={`Cost per ${p.unit} ($)`}>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={p.cost}
              onChange={(e) => edit("cost", +e.target.value)}
            />
          </Field>
          <Field label="Selling price ($)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={p.price}
              onChange={(e) => edit("price", +e.target.value)}
            />
          </Field>
          <Field label="Minimum stock (base units)">
            <input
              type="number"
              min="0"
              step="any"
              required
              value={p.min}
              onChange={(e) => edit("min", +e.target.value)}
            />
          </Field>
          <Field label="Storage location">
            <select
              value={p.storage}
              onChange={(e) => edit("storage", e.target.value)}
            >
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          {!product && (
            <Field
              label={`Opening stock at ${loc === "All locations" ? "Storage room" : loc}`}
            >
              <input
                type="number"
                min="0"
                step="any"
                value={initial}
                onChange={(e) => setInitial(+e.target.value)}
              />
            </Field>
          )}
        </div>
        <Field label="Description">
          <textarea
            value={p.description}
            onChange={(e) => edit("description", e.target.value)}
          />
        </Field>
        <p className="hint">
          Stock is tracked in the base unit. Editing cost immediately
          recalculates all recipe costs. Existing unit definitions are fixed to
          preserve the ledger.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">Save item</button>
        </div>
      </form>
    </Modal>
  );
}
export function MovementForm({
  product,
  loc,
  actor,
  kind = "Incoming",
  onClose,
  onSaved,
}: {
  product?: Product;
  loc: string;
  actor: string;
  kind?: "Incoming" | "Adjustment" | "Transfer" | "Waste" | "Count";
  onClose: () => void;
  onSaved: () => void;
}) {
  const { state, dispatch } = useStore(),
    [id, setId] = useState(
      product?.id || state.products.find((p) => !p.archived)!.id,
    ),
    [source, setSource] = useState(loc === "All locations" ? "Main bar" : loc),
    [dest, setDest] = useState("Storage room"),
    [type, setType] = useState(kind),
    [n, setN] = useState(""),
    [unit, setUnit] = useState(""),
    [reason, setReason] = useState(kind === "Waste" ? "Spoilage" : ""),
    [error, setError] = useState("");
  const p = state.products.find((p) => p.id === id)!;
  const units = [
    p.unit,
    "case",
    ...(p.unit === "bottle"
      ? ["ml", "L"]
      : p.unit === "kg"
        ? ["g"]
        : p.unit === "L"
          ? ["ml"]
          : []),
  ];
  return (
    <Modal
      title={
        type === "Waste"
          ? "Record inventory loss"
          : type === "Count"
            ? "Reconcile stock count"
            : "Record stock movement"
      }
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            dispatch({
              type: "move",
              product: id,
              location: source,
              destination: dest,
              kind: type,
              quantity: Number(n),
              unit: unit || p.unit,
              reason,
              actor,
            });
            onSaved();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <Field label="Inventory item">
          <select
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setUnit("");
            }}
          >
            {state.products
              .filter((p) => !p.archived)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Movement type">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as typeof type);
                if (e.target.value === "Waste") setReason("Spoilage");
              }}
            >
              {["Incoming", "Adjustment", "Transfer", "Waste", "Count"].map(
                (k) => (
                  <option key={k}>{k}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Source location">
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          {type === "Transfer" && (
            <Field label="Destination location">
              <select value={dest} onChange={(e) => setDest(e.target.value)}>
                {locations.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
          )}
          <Field
            label={
              type === "Count"
                ? "Physical quantity counted"
                : type === "Adjustment"
                  ? "Signed adjustment (+ / −)"
                  : "Quantity"
            }
          >
            <input
              type="number"
              step="any"
              min={type === "Adjustment" ? undefined : 0}
              required
              value={n}
              onChange={(e) => setN(e.target.value)}
            />
          </Field>
          <Field label="Measurement unit">
            <select
              value={unit || p.unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>
        {type === "Waste" ? (
          <Field label="Loss reason">
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {["Spoilage", "Expired", "Damaged", "Spillage", "Other loss"].map(
                (r) => (
                  <option key={r}>{r}</option>
                ),
              )}
            </select>
          </Field>
        ) : (
          <Field label="Adjustment reason">
            <input
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Delivery unpacked, evening count"
            />
          </Field>
        )}
        <div className="callout">
          Available:{" "}
          <strong>
            {round(quantity(state, id, source))} {p.unit}
          </strong>
          . 1 case = {p.pack} {p.unit}
          {p.unit === "bottle" ? `; 1 bottle = ${p.volume} ml` : ""}.
          {type === "Count" && (
            <p>
              A count sets the location balance to the counted quantity and
              records the difference in the ledger.
            </p>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">
            {type === "Count" ? "Reconcile count" : "Save movement"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function Inventory({
  loc,
  actor,
  notify,
}: {
  loc: string;
  actor: string;
  notify: (s: string) => void;
}) {
  const { state, dispatch } = useStore(),
    [search, setSearch] = useState(""),
    [cat, setCat] = useState("All categories"),
    [filter, setFilter] = useState("All stock"),
    [supplier, setSupplier] = useState("All suppliers"),
    [sort, setSort] = useState("name"),
    [desc, setDesc] = useState(false),
    [edit, setEdit] = useState<Product | "new" | null>(null),
    [move, setMove] = useState<Product | "new" | null>(null),
    [archive, setArchive] = useState<Product | null>(null);
  const items = state.products
    .filter(
      (p) =>
        !p.archived &&
        (cat === "All categories" || p.category === cat) &&
        (supplier === "All suppliers" || p.supplier === supplier) &&
        `${p.name} ${p.sku} ${p.description}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "All stock" ||
          status(quantity(state, p.id, loc), p.min) === filter),
    )
    .sort((a, b) => {
      const v =
        sort === "name"
          ? a.name.localeCompare(b.name)
          : sort === "stock"
            ? quantity(state, a.id, loc) - quantity(state, b.id, loc)
            : quantity(state, a.id, loc) * a.cost -
              quantity(state, b.id, loc) * b.cost;
      return desc ? -v : v;
    });
  const header = (key: string, label: string) => (
    <button
      className="table-sort"
      onClick={() => {
        setSort(key);
        setDesc(sort === key ? !desc : false);
      }}
    >
      {label}
      <ArrowUpDown size={12} />
    </button>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE STOCKROOM</span>
          <h1>Inventory</h1>
          <p>Every item, every location. One clear picture.</p>
        </div>
        <div className="actions">
          <button className="button" onClick={() => setMove("new")}>
            <ArrowRightLeft size={16} />
            Stock movement
          </button>
          <button className="button primary" onClick={() => setEdit("new")}>
            <Plus size={16} />
            Add item
          </button>
        </div>
      </div>
      <div className="strip">
        <span>
          <strong>{items.length}</strong> active items
        </span>
        <span>
          <strong>
            {money(
              items.reduce(
                (n, p) => n + quantity(state, p.id, loc) * p.cost,
                0,
              ),
            )}
          </strong>{" "}
          inventory value
        </span>
        <Export rows={inventoryRows(state, items, loc)} name="inventory" />
      </div>
      <div className="panel">
        <div className="filterbar">
          <div className="search-field">
            <Search size={16} />
            <input
              aria-label="Search inventory"
              placeholder="Search products or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter category"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            {["All categories", ...categories].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Filter stock status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["All stock", "In stock", "Low stock", "Out of stock"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Filter supplier"
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
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{header("name", "Product")}</th>
                <th>Category</th>
                <th>{header("stock", "On hand")}</th>
                <th>Unit cost</th>
                <th>{header("value", "Value")}</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const q = quantity(state, p.id, loc),
                  st = status(q, p.min);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="product-cell">
                        <ItemIcon category={p.category} />
                        <div>
                          <strong>{p.name}</strong>
                          <small>
                            {p.sku} · {p.pack} per case
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td className="tabular">
                      <strong>{round(q)}</strong> <small>{p.unit}</small>
                    </td>
                    <td>{money(p.cost)}</td>
                    <td className="tabular">{money(q * p.cost)}</td>
                    <td>
                      <Badge
                        tone={
                          st === "In stock"
                            ? "green"
                            : st === "Low stock"
                              ? "amber"
                              : "red"
                        }
                      >
                        {st}
                      </Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          aria-label={`Edit ${p.name}`}
                          className="icon-button"
                          onClick={() => setEdit(p)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          aria-label={`Move ${p.name}`}
                          className="icon-button"
                          onClick={() => setMove(p)}
                        >
                          <ArrowRightLeft size={15} />
                        </button>
                        <button
                          aria-label={`Archive ${p.name}`}
                          className="icon-button"
                          onClick={() => setArchive(p)}
                        >
                          <Archive size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!items.length && <Empty />}
        </div>
        <div className="table-foot">
          Showing {items.length} items · Quantities in canonical base units ·{" "}
          {loc}
        </div>
      </div>
      {edit && (
        <ProductForm
          product={edit === "new" ? undefined : edit}
          loc={loc}
          actor={actor}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            notify("Inventory item saved");
          }}
        />
      )}
      {move && (
        <MovementForm
          product={move === "new" ? undefined : move}
          loc={loc}
          actor={actor}
          onClose={() => setMove(null)}
          onSaved={() => {
            setMove(null);
            notify("Stock and audit ledger updated");
          }}
        />
      )}
      {archive && (
        <Modal title="Archive inventory item" onClose={() => setArchive(null)}>
          <p>
            {archive.name} will leave the active catalog. Its stock and audit
            history remain in reports. Open orders and recipes using it must be
            updated before further processing.
          </p>
          <div className="form-actions">
            <button className="button" onClick={() => setArchive(null)}>
              Cancel
            </button>
            <button
              className="button danger"
              onClick={() => {
                dispatch({ type: "archive", id: archive.id });
                setArchive(null);
                notify("Item archived");
              }}
            >
              Archive item
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export type MoveAction = Extract<Action, { type: "move" }>;
