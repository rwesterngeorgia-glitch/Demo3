import { createContext, useContext, useState, type ReactNode } from "react";
import { applyAction } from "./domain";
import { seed } from "./seed";
import type { Action, State } from "./types";
export const KEY = "stockpilot-demo-v1";
function load(): { state: State; warning: string } {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed.version === 1 &&
        Array.isArray(parsed.products) &&
        parsed.stock &&
        Array.isArray(parsed.movements) &&
        Array.isArray(parsed.receipts) &&
        Array.isArray(parsed.recipes) &&
        Array.isArray(parsed.tasks) &&
        Array.isArray(parsed.suppliers) &&
        Array.isArray(parsed.orders)
      )
        return { state: parsed, warning: "" };
      return {
        state: seed(),
        warning:
          "An incompatible saved demo was replaced with fresh sample data.",
      };
    }
    return { state: seed(), warning: "" };
  } catch {
    return {
      state: seed(),
      warning:
        "Browser storage is unavailable or damaged. Changes may not survive a refresh.",
    };
  }
}
const Context = createContext<{
  state: State;
  dispatch: (a: Action) => void;
  reset: () => void;
  warning: string;
}>({} as never);
export function Store({ children }: { children: ReactNode }) {
  const [initial] = useState(load);
  const [state, setState] = useState(initial.state),
    [warning, setWarning] = useState(initial.warning);
  const save = (next: State) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setWarning("");
    } catch {
      setWarning(
        "Your change is saved in memory, but browser storage failed. Keep this tab open or export your data.",
      );
    }
    setState(next);
  };
  return (
    <Context.Provider
      value={{
        state,
        warning,
        dispatch: (a) => save(applyAction(state, a)),
        reset: () => save(seed()),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
