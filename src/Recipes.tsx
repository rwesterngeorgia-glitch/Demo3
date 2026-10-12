import { useState } from "react";
import { Plus, ArrowUpRight, ChefHat, Trash2 } from "lucide-react";
import { useStore } from "./store";
import { convert, money, recipeCost, uid } from "./domain";
import { locations, type Recipe } from "./types";
import { Modal, Field, Badge, Export } from "./ui";
export default function Recipes({
  actor,
  loc,
  notify,
}: {
  actor: string;
  loc: string;
  notify: (s: string) => void;
}) {
  const { state, dispatch } = useStore(),
    [selected, setSelected] = useState<Recipe | null>(null),
    [edit, setEdit] = useState<Recipe | "new" | null>(null),
    [filter, setFilter] = useState("All recipes"),
    [servings, setServings] = useState(1),
    [productionLoc, setProductionLoc] = useState(
      loc === "All locations" ? "Main bar" : loc,
    ),
    [error, setError] = useState("");
  const recipes = state.recipes.filter(
    (r) => filter === "All recipes" || r.category === filter,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">KNOW WHAT EVERY SERVING COSTS</span>
          <h1>Recipe costing</h1>
          <p>Ingredient costs, clear margins, better menu decisions.</p>
        </div>
        <button className="button primary" onClick={() => setEdit("new")}>
          <Plus size={16} />
          New recipe
        </button>
      </div>
      <div className="callout subtle">
        <ChefHat size={18} />
        <span>
          Theoretical ingredient costing. Gross margin excludes labor, overhead,
          tax, and actual sales. Production entries model consumption only.
        </span>
      </div>
      <div className="filterbar standalone">
        <div className="tabs">
          {["All recipes", "Cocktails", "Food", "Coffee"].map((c) => (
            <button
              className={filter === c ? "active" : ""}
              key={c}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <Export
          name="recipe-costs"
          rows={recipes.map((r) => {
            const cost = recipeCost(state, r);
            return {
              Recipe: r.name,
              Category: r.category,
              "Ingredient cost USD": cost,
              "Selling price USD": r.price,
              "Theoretical gross profit USD": r.price - cost,
              "Cost percentage": (cost / r.price) * 100,
              "Gross margin percentage": (1 - cost / r.price) * 100,
              "Target cost percentage": r.target,
            };
          })}
        />
      </div>
      <div className="recipe-grid">
        {recipes.map((r) => {
          const cost = recipeCost(state, r),
            pct = (cost / r.price) * 100;
          return (
            <article className="panel recipe-card" key={r.id}>
              <div className="recipe-top">
                <span className="recipe-number">
                  {r.category === "Cocktails"
                    ? "BAR"
                    : r.category === "Food"
                      ? "KITCHEN"
                      : "CAFÉ"}{" "}
                  / {r.id.replace("r", "0")}
                </span>
                <Badge tone={pct > r.target ? "amber" : "green"}>
                  {pct > r.target ? "Above target" : "On target"}
                </Badge>
              </div>
              <h2>{r.name}</h2>
              <p>{r.ingredients.length} ingredients · per serving</p>
              <div className="recipe-price">
                <span>
                  {money(cost)}
                  <small>ingredient cost</small>
                </span>
                <span>
                  {money(r.price)}
                  <small>menu price</small>
                </span>
              </div>
              <div className="cost-meter">
                <span style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="recipe-metrics">
                <span>
                  Cost <strong>{pct.toFixed(1)}%</strong>
                </span>
                <span>
                  Margin <strong>{(100 - pct).toFixed(1)}%</strong>
                </span>
                <span>Target {r.target}%</span>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  setSelected(r);
                  setError("");
                }}
              >
                View cost breakdown <ArrowUpRight size={16} />
              </button>
            </article>
          );
        })}
      </div>
      {selected &&
        (() => {
          const r = state.recipes.find((r) => r.id === selected.id)!,
            cost = recipeCost(state, r);
          return (
            <Modal title={r.name} onClose={() => setSelected(null)}>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Recipe quantity</th>
                      <th>Base conversion</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.ingredients.map((i, j) => {
                      const p = state.products.find((p) => p.id === i.product)!;
                      return (
                        <tr key={j}>
                          <td>{p.name}</td>
                          <td>
                            {i.quantity} {i.unit}
                          </td>
                          <td>
                            {convert(p, i.quantity, i.unit).toFixed(4)} {p.unit}
                          </td>
                          <td>
                            {money(convert(p, i.quantity, i.unit) * p.cost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="strip">
                <span>
                  Ingredient cost <strong>{money(cost)}</strong>
                </span>
                <span>
                  Theoretical gross profit{" "}
                  <strong>{money(r.price - cost)}</strong>
                </span>
              </div>
              <p className="hint">{r.note}</p>
              <div className="callout">
                <strong>Record demonstration production</strong>
                <p>
                  This consumes the ingredients at one location and records each
                  in the ledger. It does not record sales.
                </p>
                <div className="form-grid">
                  <Field label="Servings">
                    <input
                      type="number"
                      min="0.000001"
                      step="any"
                      value={servings}
                      onChange={(e) => setServings(+e.target.value)}
                    />
                  </Field>
                  <Field label="Production location">
                    <select
                      value={productionLoc}
                      onChange={(e) => setProductionLoc(e.target.value)}
                    >
                      {locations.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <button
                  className="button"
                  onClick={() => {
                    try {
                      dispatch({
                        type: "consume",
                        id: r.id,
                        servings,
                        location: productionLoc,
                        actor,
                      });
                      setSelected(null);
                      notify("Recipe ingredients consumed and logged");
                    } catch (err) {
                      setError((err as Error).message);
                    }
                  }}
                >
                  Record production
                </button>
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                <button
                  className="button"
                  onClick={() => {
                    setSelected(null);
                    setEdit(r);
                  }}
                >
                  Edit recipe
                </button>
                <button
                  className="button primary"
                  onClick={() => setSelected(null)}
                >
                  Done
                </button>
              </div>
            </Modal>
          );
        })()}
      {edit && (
        <RecipeForm
          recipe={edit === "new" ? undefined : edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            notify("Recipe saved");
          }}
        />
      )}
    </>
  );
}
function RecipeForm({
  recipe,
  onClose,
  onSaved,
}: {
  recipe?: Recipe;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { state, dispatch } = useStore(),
    [r, setR] = useState<Recipe>(
      recipe || {
        id: uid(),
        name: "",
        category: "Cocktails",
        price: 14,
        target: 25,
        note: "",
        ingredients: [{ product: "p1", quantity: 30, unit: "ml" }],
      },
    ),
    [error, setError] = useState("");
  return (
    <Modal title={recipe ? "Edit recipe" : "Create recipe"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            dispatch({ type: "recipe", recipe: r });
            onSaved();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <div className="form-grid">
          <Field label="Recipe name">
            <input
              required
              value={r.name}
              onChange={(e) => setR({ ...r, name: e.target.value })}
            />
          </Field>
          <Field label="Recipe category">
            <select
              value={r.category}
              onChange={(e) => setR({ ...r, category: e.target.value })}
            >
              {["Cocktails", "Food", "Coffee"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Selling price ($)">
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={r.price}
              onChange={(e) => setR({ ...r, price: +e.target.value })}
            />
          </Field>
          <Field label="Target cost (%)">
            <input
              type="number"
              min="1"
              max="100"
              required
              value={r.target}
              onChange={(e) => setR({ ...r, target: +e.target.value })}
            />
          </Field>
        </div>
        {r.ingredients.map((i, j) => {
          const p = state.products.find((p) => p.id === i.product)!;
          const units = [
            p.unit,
            ...(p.unit === "bottle"
              ? ["ml", "L"]
              : p.unit === "kg"
                ? ["g"]
                : p.unit === "L"
                  ? ["ml"]
                  : []),
          ];
          const change = (patch: Partial<typeof i>) =>
            setR({
              ...r,
              ingredients: r.ingredients.map((x, k) =>
                j === k ? { ...x, ...patch } : x,
              ),
            });
          return (
            <div className="order-line" key={j}>
              <Field label={`Ingredient ${j + 1}`}>
                <select
                  value={i.product}
                  onChange={(e) => {
                    const p = state.products.find(
                      (p) => p.id === e.target.value,
                    )!;
                    change({ product: p.id, unit: p.unit });
                  }}
                >
                  {state.products
                    .filter((p) => !p.archived)
                    .map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Recipe quantity">
                <input
                  type="number"
                  step="any"
                  min="0.000001"
                  required
                  value={i.quantity}
                  onChange={(e) => change({ quantity: +e.target.value })}
                />
              </Field>
              <Field label="Unit">
                <select
                  value={i.unit}
                  onChange={(e) => change({ unit: e.target.value })}
                >
                  {units.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </Field>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ingredient ${j + 1}`}
                disabled={r.ingredients.length === 1}
                onClick={() =>
                  setR({
                    ...r,
                    ingredients: r.ingredients.filter((_, k) => j !== k),
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          className="text-button"
          onClick={() =>
            setR({
              ...r,
              ingredients: [
                ...r.ingredients,
                { product: "p1", quantity: 30, unit: "ml" },
              ],
            })
          }
        >
          <Plus size={16} />
          Add ingredient
        </button>
        <Field label="Preparation note">
          <textarea
            value={r.note}
            onChange={(e) => setR({ ...r, note: e.target.value })}
          />
        </Field>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">Save recipe</button>
        </div>
      </form>
    </Modal>
  );
}
