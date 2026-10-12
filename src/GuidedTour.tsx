import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Play,
  X,
} from "lucide-react";
import { useStore } from "./store";
export const tourSteps = [
  {
    path: "/app",
    title: "Your operation, in view",
    text: "These totals come from live demo stock. Click around the dashboard, then continue to make your first stock change.",
    selector: ".stats",
    action: "Explore inventory",
  },
  {
    path: "/app/inventory",
    title: "Make your first stock change",
    text: "Try an incoming bottle, a transfer, or a physical count. Save a valid movement to advance automatically. This changes your browser’s demo data.",
    selector: ".page-heading .actions",
    action: "Open stock movement",
  },
  {
    path: "/app/orders",
    title: "Receive part of a delivery",
    text: "Enter a partial quantity, then confirm receipt. Stock increases and the outstanding balance stays open. A completed receipt advances the tour.",
    selector: "main .panel",
    action: "Try partial receiving",
  },
  {
    path: "/app/recipes",
    title: "See the cost of a serving",
    text: "Inspect the Old Fashioned breakdown. Record one serving at Main bar to consume its ingredients and advance. Costs are theoretical, with no sales recorded.",
    selector: ".recipe-grid",
    action: "Open recipe breakdown",
  },
  {
    path: "/app/reports",
    title: "Follow the audit trail",
    text: "View your movements and export the actual report as CSV. Before/after balances show exactly what changed. You can reset all demo data anytime.",
    selector: ".report-tabs",
    action: "Show movement report",
  },
];
export default function GuidedTour({
  step,
  onChange,
  onClose,
}: {
  step: number;
  onChange: (n: number) => void;
  onClose: () => void;
}) {
  const { state } = useStore(),
    location = useLocation(),
    [minimized, setMinimized] = useState(false);
  const baseline = useRef({
    movements: state.movements.length,
    receipts: state.receipts.length,
    recipes: state.movements.filter((m) => m.type === "Recipe").length,
  });
  const guide = tourSteps[step],
    inPlace = location.pathname === guide.path;
  useEffect(() => {
    if (!inPlace) return;
    const target = document.querySelector(guide.selector);
    target?.classList.add("tour-focus");
    target?.scrollIntoView({ block: "center", behavior: "instant" });
    return () => target?.classList.remove("tour-focus");
  }, [guide.selector, inPlace]);
  useEffect(() => {
    const completed =
      step === 1
        ? state.movements.length > baseline.current.movements
        : step === 2
          ? state.receipts.length > baseline.current.receipts
          : step === 3
            ? state.movements.filter((m) => m.type === "Recipe").length >
              baseline.current.recipes
            : false;
    if (completed) onChange(step + 1);
  }, [state.movements, state.receipts, step, onChange]);
  const tryAction = () => {
    if (!inPlace) {
      onChange(step);
      return;
    }
    if (step === 0) {
      onChange(1);
      return;
    }
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>("main button"),
    );
    if (step === 1)
      buttons.find((b) => b.textContent?.includes("Stock movement"))?.click();
    if (step === 2) {
      const rows = Array.from(document.querySelectorAll("main tbody tr"));
      const row =
        rows.find(
          (r) =>
            r.textContent?.includes("PO-1042") &&
            Array.from(r.querySelectorAll("button")).some(
              (b) => b.textContent === "Receive",
            ),
        ) ||
        rows.find((r) =>
          Array.from(r.querySelectorAll("button")).some(
            (b) => b.textContent === "Receive",
          ),
        );
      if (row)
        Array.from(row.querySelectorAll("button"))
          .find((b) => b.textContent === "Receive")
          ?.click();
      else
        buttons
          .find((b) => b.textContent?.includes("New purchase order"))
          ?.click();
    }
    if (step === 3) {
      const card = Array.from(document.querySelectorAll("main article")).find(
        (a) => a.textContent?.includes("Old Fashioned"),
      );
      card?.querySelector<HTMLButtonElement>(".text-button")?.click();
    }
    if (step === 4) buttons.find((b) => b.textContent === "Movements")?.click();
  };
  return (
    <section
      className={`guided-tour ${minimized ? "minimized" : ""}`}
      aria-label="Interactive guided tour"
    >
      <div className="guide-header">
        <span>
          <Play size={12} />
          GUIDED TOUR · {step + 1} / {tourSteps.length}
        </span>
        <div>
          <button
            className="icon-button"
            aria-label={minimized ? "Expand tour" : "Minimize tour"}
            onClick={() => setMinimized(!minimized)}
          >
            {minimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            className="icon-button"
            aria-label="End tour"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="guide-progress">
        {tourSteps.map((s, i) => (
          <button
            key={s.path}
            aria-label={`Go to tour step ${i + 1}: ${s.title}`}
            aria-current={i === step ? "step" : undefined}
            className={i <= step ? "complete" : ""}
            onClick={() => onChange(i)}
          />
        ))}
      </div>
      {!minimized && (
        <>
          <h2>{guide.title}</h2>
          <p>
            {inPlace
              ? guide.text
              : "You’re free to explore. Return to this tour stop when you’re ready."}
          </p>
          <button className="button primary guide-action" onClick={tryAction}>
            {inPlace ? guide.action : "Return to this step"}
            <ArrowRight size={14} />
          </button>
          <div className="guide-footer">
            <span>Your changes stay in this browser.</span>
            <div>
              <button
                className="text-button"
                disabled={step === 0}
                onClick={() => onChange(step - 1)}
              >
                Back
              </button>
              <button
                className="text-button"
                onClick={() =>
                  step === tourSteps.length - 1 ? onClose() : onChange(step + 1)
                }
              >
                {step === tourSteps.length - 1 ? (
                  <>
                    <Check size={13} />
                    Finish tour
                  </>
                ) : (
                  "Next step"
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
