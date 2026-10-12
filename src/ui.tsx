import {
  useEffect,
  useRef,
  useId,
  cloneElement,
  type ReactNode,
  type ReactElement,
} from "react";
import {
  X,
  Download,
  Package,
  Wine,
  Beef,
  Leaf,
  Coffee,
  Droplets,
  SprayCan,
  Beer,
} from "lucide-react";
import { csv, money, quantity, round, status } from "./domain";
import type { Product, State } from "./types";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="modal-head">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <label className="field">
      <span id={id}>{label}</span>
      {cloneElement(children as ReactElement<{ "aria-labelledby"?: string }>, {
        "aria-labelledby": id,
      })}
    </label>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function ItemIcon({ category }: { category: string }) {
  const Icon =
    (
      {
        Spirits: Wine,
        Beer,
        Wine,
        Mixers: Droplets,
        Produce: Leaf,
        Meats: Beef,
        "Dry goods": Coffee,
        Cleaning: SprayCan,
      } as Record<string, typeof Package>
    )[category] || Package;
  return (
    <span className={`item-icon cat-${category.replace(" ", "")}`}>
      <Icon size={18} />
    </span>
  );
}
export function Export({
  rows,
  name = "stockpilot-report",
}: {
  rows: Record<string, unknown>[];
  name?: string;
}) {
  return (
    <button
      className="button"
      disabled={!rows.length}
      onClick={() => {
        const url = URL.createObjectURL(
          new Blob([csv(rows)], { type: "text/csv;charset=utf-8;" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download size={15} />
      Export CSV
    </button>
  );
}
export const inventoryRows = (s: State, items: Product[], loc: string) =>
  items.map((p) => ({
    Product: p.name,
    SKU: p.sku,
    Category: p.category,
    Location: loc,
    Quantity: round(quantity(s, p.id, loc)),
    Unit: p.unit,
    "Unit cost USD": p.cost,
    "Inventory value USD": round(quantity(s, p.id, loc) * p.cost),
    "Minimum stock": p.min,
    Status: status(quantity(s, p.id, loc), p.min),
    Supplier: s.suppliers.find((x) => x.id === p.supplier)?.name,
  }));
export function Empty({
  title = "No results",
  text = "Try a different filter or add your first entry.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <Package size={28} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function Value({ value }: { value: number }) {
  return <span className="tabular">{money(value)}</span>;
}
