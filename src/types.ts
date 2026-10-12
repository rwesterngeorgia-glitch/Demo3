export const locations = [
  "Main bar",
  "Kitchen",
  "Storage room",
  "Secondary bar",
] as const;
export const categories = [
  "Spirits",
  "Beer",
  "Wine",
  "Mixers",
  "Produce",
  "Meats",
  "Dry goods",
  "Cleaning",
] as const;
export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  unit: "bottle" | "kg" | "L" | "each";
  volume: number;
  pack: number;
  cost: number;
  price: number;
  min: number;
  supplier: string;
  storage: string;
  icon: string;
  archived: boolean;
};
export type Movement = {
  id: string;
  at: string;
  product: string;
  location: string;
  type:
    | "Incoming"
    | "Adjustment"
    | "Transfer out"
    | "Transfer in"
    | "Waste"
    | "Recipe"
    | "Count";
  delta: number;
  before: number;
  after: number;
  cost: number;
  reason: string;
  actor: string;
  group: string;
};
export type Supplier = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  lead: number;
};
export type Order = {
  id: string;
  supplier: string;
  location: string;
  expected: string;
  status: "Draft" | "Ordered" | "Partially received" | "Received" | "Canceled";
  lines: {
    product: string;
    quantity: number;
    received: number;
    cost: number;
  }[];
  created: string;
};
export type Recipe = {
  id: string;
  name: string;
  category: string;
  price: number;
  target: number;
  ingredients: { product: string; quantity: number; unit: string }[];
  note: string;
};
export type Task = {
  id: string;
  title: string;
  kind: string;
  owner: string;
  done: boolean;
};
export type State = {
  version: 1;
  products: Product[];
  stock: Record<string, Record<string, number>>;
  movements: Movement[];
  suppliers: Supplier[];
  orders: Order[];
  recipes: Recipe[];
  tasks: Task[];
  notes: { id: string; text: string; at: string; actor: string }[];
  receipts: string[];
};
export type Action =
  | {
      type: "product";
      product: Product;
      quantity: number;
      location: string;
      actor: string;
    }
  | { type: "archive"; id: string }
  | {
      type: "move";
      product: string;
      location: string;
      destination?: string;
      kind: "Incoming" | "Adjustment" | "Transfer" | "Waste" | "Count";
      quantity: number;
      unit: string;
      reason: string;
      actor: string;
    }
  | { type: "order"; order: Order }
  | { type: "orderStatus"; id: string; status: "Ordered" | "Canceled" }
  | {
      type: "receive";
      id: string;
      quantities: number[];
      receipt: string;
      actor: string;
    }
  | { type: "recipe"; recipe: Recipe }
  | {
      type: "consume";
      id: string;
      servings: number;
      location: string;
      actor: string;
    }
  | { type: "task"; id: string }
  | { type: "note"; text: string; actor: string };
