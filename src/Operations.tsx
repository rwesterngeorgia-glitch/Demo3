import { useState } from "react";
import {
  Check,
  ClipboardCheck,
  MessageSquare,
  Users,
  Plus,
} from "lucide-react";
import { useStore } from "./store";
import { Badge, Field } from "./ui";
export const staff = [
  {
    name: "Alex Rivera",
    role: "Owner",
    initials: "AR",
    area: "All operations",
  },
  {
    name: "Noah Bennett",
    role: "Manager",
    initials: "NB",
    area: "Purchasing & closing",
  },
  {
    name: "Maya Ellis",
    role: "Bartender",
    initials: "ME",
    area: "Main bar & counts",
  },
  {
    name: "Theo Park",
    role: "Kitchen staff",
    initials: "TP",
    area: "Kitchen & preparation",
  },
];
export default function Operations({
  actor,
  notify,
}: {
  actor: string;
  notify: (s: string) => void;
}) {
  const { state, dispatch } = useStore(),
    [tab, setTab] = useState("Checklists"),
    [note, setNote] = useState(""),
    [error, setError] = useState("");
  const done = state.tasks.filter((t) => t.done).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A TEAM IN SYNC</span>
          <h1>Team & operations</h1>
          <p>Shared routines, clear ownership, and the little details.</p>
        </div>
        <Badge tone="green">
          {done} / {state.tasks.length} tasks complete
        </Badge>
      </div>
      <div className="callout subtle">
        <Users size={18} />
        All staff are fictional. Actor selection is a demo label, with no
        authentication or enforced permissions. Do not enter real employee
        information.
      </div>
      <div className="tabs standalone">
        {["Checklists", "Staff directory", "Announcements"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Checklists" ? (
        <div className="checklist-grid">
          {["Opening", "Closing", "Stock count"].map((kind) => (
            <section className="panel" key={kind}>
              <div className="panel-heading">
                <div>
                  <h2>
                    <ClipboardCheck size={18} />
                    {kind}
                  </h2>
                  <p>
                    {kind === "Stock count"
                      ? "Assigned inventory reconciliation"
                      : "Daily service routine"}
                  </p>
                </div>
                <Badge>
                  {state.tasks.filter((t) => t.kind === kind && t.done).length}/
                  {state.tasks.filter((t) => t.kind === kind).length}
                </Badge>
              </div>
              {state.tasks
                .filter((t) => t.kind === kind)
                .map((t) => (
                  <button
                    className={`task-row ${t.done ? "done" : ""}`}
                    key={t.id}
                    onClick={() => {
                      dispatch({ type: "task", id: t.id });
                      notify(t.done ? "Task reopened" : "Task completed");
                    }}
                    aria-pressed={t.done}
                  >
                    <span className="task-check">
                      {t.done && <Check size={16} />}
                    </span>
                    <div>
                      <strong>{t.title}</strong>
                      <small>{t.owner}</small>
                    </div>
                  </button>
                ))}
              {kind === "Stock count" && (
                <p className="hint pad">
                  Use Inventory → Stock movement → Count to record measured
                  quantities and reconcile discrepancies. Checking this
                  assignment marks the routine complete only.
                </p>
              )}
            </section>
          ))}
        </div>
      ) : tab === "Staff directory" ? (
        <div className="supplier-grid">
          {staff.map((s) => (
            <article className="panel supplier" key={s.name}>
              <span className="avatar">{s.initials}</span>
              <h2>{s.name}</h2>
              <Badge tone="green">{s.role}</Badge>
              <p>{s.area}</p>
              <small>Fictional demonstration staff member</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="notes-layout">
          <section className="panel pad">
            <h2>
              <MessageSquare size={18} />
              Post an announcement
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  dispatch({ type: "note", text: note, actor });
                  setNote("");
                  notify("Announcement saved");
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              <Field label="Operational note (fictional data only)">
                <textarea
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Keep your demo team in the loop…"
                />
              </Field>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <button className="button primary">
                <Plus size={15} />
                Post note
              </button>
            </form>
          </section>
          <section className="panel">
            {state.notes.map((n) => (
              <article className="note" key={n.id}>
                <strong>{n.actor}</strong>
                <small>{new Date(n.at).toLocaleString()}</small>
                <p>{n.text}</p>
              </article>
            ))}
          </section>
        </div>
      )}
    </>
  );
}
