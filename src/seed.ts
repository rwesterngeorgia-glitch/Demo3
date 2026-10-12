import type { Product, State } from "./types";
import { applyAction, uid, round } from "./domain";
export const day = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function seed(): State {
  const suppliers = [
    {
      id: "s1",
      name: "Northline Beverage Co.",
      contact: "Alex Morgan",
      email: "orders@northline.example.com",
      phone: "202-555-0101",
      lead: 3,
    },
    {
      id: "s2",
      name: "Field & Fork Provisions",
      contact: "Sam Chen",
      email: "hello@fieldfork.example.com",
      phone: "202-555-0102",
      lead: 2,
    },
    {
      id: "s3",
      name: "The Daily Supply",
      contact: "Jordan Ellis",
      email: "team@dailysupply.example.com",
      phone: "202-555-0103",
      lead: 4,
    },
  ];
  const data: [
    string,
    string,
    Product["unit"],
    number,
    number,
    number,
    number,
    string,
  ][] = [
    ["Blanco tequila", "Spirits", "bottle", 750, 24, 18, 6, "s1"],
    ["London dry gin", "Spirits", "bottle", 750, 22, 12, 5, "s1"],
    ["Bourbon whiskey", "Spirits", "bottle", 750, 28, 14, 5, "s1"],
    ["Campari", "Spirits", "bottle", 750, 25, 8, 4, "s1"],
    ["Sweet vermouth", "Wine", "bottle", 750, 14, 6, 4, "s1"],
    ["Triple sec", "Spirits", "bottle", 750, 16, 7, 4, "s1"],
    ["Angostura bitters", "Spirits", "bottle", 200, 15, 4, 2, "s1"],
    ["House lager", "Beer", "each", 1, 2.2, 144, 48, "s1"],
    ["Pale ale", "Beer", "each", 1, 2.8, 72, 24, "s1"],
    ["Pinot noir", "Wine", "bottle", 750, 18, 20, 6, "s1"],
    ["Sauvignon blanc", "Wine", "bottle", 750, 15, 16, 6, "s1"],
    ["Tonic water", "Mixers", "each", 1, 1.1, 96, 24, "s1"],
    ["Soda water", "Mixers", "each", 1, 0.8, 12, 24, "s1"],
    ["Simple syrup", "Mixers", "L", 1000, 6, 4, 2, "s1"],
    ["Fresh lime juice", "Produce", "L", 1000, 12, 3, 2, "s2"],
    ["Limes", "Produce", "kg", 1000, 4.8, 7, 3, "s2"],
    ["Oranges", "Produce", "kg", 1000, 3.8, 5, 2, "s2"],
    ["Romaine lettuce", "Produce", "kg", 1000, 4, 4, 3, "s2"],
    ["Tomatoes", "Produce", "kg", 1000, 5.5, 6, 3, "s2"],
    ["Chicken breast", "Meats", "kg", 1000, 11, 8, 4, "s2"],
    ["Ground beef", "Meats", "kg", 1000, 13, 6, 3, "s2"],
    ["Burger buns", "Dry goods", "each", 1, 0.65, 40, 20, "s2"],
    ["Parmesan", "Dry goods", "kg", 1000, 19, 3, 1, "s2"],
    ["Espresso beans", "Dry goods", "kg", 1000, 22, 5, 2, "s3"],
    ["Whole milk", "Mixers", "L", 1000, 2.2, 10, 4, "s2"],
    ["Olive oil", "Dry goods", "L", 1000, 9, 4, 2, "s2"],
    ["Croutons", "Dry goods", "kg", 1000, 8, 2, 1, "s2"],
    ["Surface sanitizer", "Cleaning", "L", 1000, 5, 8, 3, "s3"],
    ["Dish soap", "Cleaning", "L", 1000, 4, 0, 2, "s3"],
    ["Paper towels", "Cleaning", "each", 1, 2.5, 18, 12, "s3"],
  ];
  const products: Product[] = data.map((d, i) => ({
    id: `p${i + 1}`,
    name: d[0],
    sku: `SP-${String(i + 1).padStart(3, "0")}`,
    category: d[1],
    description: `Fictional hospitality stock · ${d[0].toLowerCase()}`,
    unit: d[2],
    volume: d[3],
    pack: d[2] === "bottle" ? 6 : d[2] === "each" ? 24 : 1,
    cost: d[4],
    price: d[2] === "bottle" ? d[4] * 2 : 0,
    min: d[6],
    supplier: d[7],
    storage:
      d[1] === "Produce" || d[1] === "Meats" ? "Kitchen" : "Storage room",
    icon: d[1],
    archived: false,
  }));
  let s: State = {
    version: 1,
    products,
    stock: {},
    movements: [],
    suppliers,
    orders: [],
    recipes: [],
    tasks: [
      {
        id: "t1",
        title: "Check bar par levels",
        kind: "Opening",
        owner: "Maya · Bartender",
        done: false,
      },
      {
        id: "t2",
        title: "Log cooler temperatures",
        kind: "Opening",
        owner: "Theo · Kitchen staff",
        done: true,
      },
      {
        id: "t3",
        title: "Count spirits at main bar",
        kind: "Stock count",
        owner: "Maya · Bartender",
        done: false,
      },
      {
        id: "t4",
        title: "Reconcile closing waste",
        kind: "Closing",
        owner: "Noah · Manager",
        done: false,
      },
      {
        id: "t5",
        title: "Sanitize preparation stations",
        kind: "Closing",
        owner: "Theo · Kitchen staff",
        done: false,
      },
    ],
    notes: [
      {
        id: "n1",
        text: "Check the Northline delivery against the purchase order before shelving. Log any breakage as waste.",
        at: new Date().toISOString(),
        actor: "Noah · Manager",
      },
    ],
    receipts: [],
  };
  data.forEach((d, i) => {
    const p = products[i],
      total = d[5],
      primary =
        p.id !== "p15" && ["Produce", "Meats", "Dry goods"].includes(p.category)
          ? "Kitchen"
          : "Main bar";
    const main =
        p.unit === "each" ? Math.floor(total * 0.6) : round(total * 0.6),
      storage =
        p.unit === "each" ? Math.floor(total * 0.3) : round(total * 0.3);
    s.stock[p.id] = {
      [primary]: main,
      "Storage room": storage,
      "Secondary bar": round(total - main - storage),
    };
    if (p.category === "Cleaning") s.stock[p.id] = { "Storage room": total };
  });
  // Seed a real ledger over the last 14 days; every sample event changes stock.
  for (let offset = 13; offset >= 0; offset--) {
    for (const [id, n, kind] of [
      ["p1", 0.12, "Recipe"],
      ["p8", 3, "Recipe"],
      ["p20", 0.2, "Recipe"],
      ["p18", 0.08, "Waste"],
    ] as const) {
      const loc = id === "p20" || id === "p18" ? "Kitchen" : "Main bar";
      const used =
        id === "p8"
          ? Math.round(n * (0.7 + (offset % 4) * 0.2))
          : round(n * (0.7 + (offset % 4) * 0.2));
      const before = s.stock[id][loc],
        after = round(before - used);
      s.stock[id][loc] = after;
      const d = new Date();
      d.setDate(d.getDate() - offset);
      d.setHours(17, offset * 3, 0, 0);
      s.movements.unshift({
        id: uid(),
        at: d.toISOString(),
        product: id,
        location: loc,
        type: kind,
        delta: -used,
        before,
        after,
        cost: products.find((p) => p.id === id)!.cost,
        reason: kind === "Waste" ? "Spoilage" : "Recorded sample preparation",
        actor: kind === "Waste" ? "Theo · Kitchen staff" : "Maya · Bartender",
        group: uid(),
      });
    }
  }
  // Normalize floating point balances at six-decimal precision.
  Object.values(s.stock).forEach((stock) =>
    Object.keys(stock).forEach(
      (l) => (stock[l] = Math.round(stock[l] * 1e6) / 1e6),
    ),
  );
  const ingredients = (rows: [string, number, string][]) =>
    rows.map(([product, quantity, unit]) => ({ product, quantity, unit }));
  s.recipes = [
    {
      id: "r1",
      name: "Classic Margarita",
      category: "Cocktails",
      price: 14,
      target: 25,
      ingredients: ingredients([
        ["p1", 60, "ml"],
        ["p6", 25, "ml"],
        ["p15", 30, "ml"],
        ["p14", 10, "ml"],
      ]),
      note: "Shake over ice. Salt half the rim.",
    },
    {
      id: "r2",
      name: "Negroni",
      category: "Cocktails",
      price: 15,
      target: 25,
      ingredients: ingredients([
        ["p2", 30, "ml"],
        ["p4", 30, "ml"],
        ["p5", 30, "ml"],
      ]),
      note: "Stir and serve over a large ice cube.",
    },
    {
      id: "r3",
      name: "Old Fashioned",
      category: "Cocktails",
      price: 16,
      target: 25,
      ingredients: ingredients([
        ["p3", 60, "ml"],
        ["p14", 5, "ml"],
        ["p7", 2, "ml"],
      ]),
      note: "Stir, express an orange peel.",
    },
    {
      id: "r4",
      name: "Chicken Caesar",
      category: "Food",
      price: 19,
      target: 30,
      ingredients: ingredients([
        ["p20", 180, "g"],
        ["p18", 100, "g"],
        ["p23", 25, "g"],
        ["p27", 30, "g"],
        ["p26", 15, "ml"],
      ]),
      note: "Costs include recorded ingredients only; labor and overhead excluded.",
    },
    {
      id: "r5",
      name: "House cheeseburger",
      category: "Food",
      price: 17,
      target: 30,
      ingredients: ingredients([
        ["p21", 200, "g"],
        ["p22", 1, "each"],
        ["p19", 40, "g"],
        ["p23", 20, "g"],
      ]),
      note: "Theoretical ingredient cost per serving.",
    },
    {
      id: "r6",
      name: "Flat white",
      category: "Coffee",
      price: 5,
      target: 25,
      ingredients: ingredients([
        ["p24", 18, "g"],
        ["p25", 160, "ml"],
      ]),
      note: "Double espresso with steamed milk.",
    },
  ];
  s = applyAction(s, {
    type: "order",
    order: {
      id: "PO-1042",
      supplier: "s1",
      location: "Storage room",
      expected: day(1),
      status: "Ordered",
      created: new Date().toISOString(),
      lines: [
        { product: "p1", quantity: 12, received: 0, cost: 24 },
        { product: "p13", quantity: 48, received: 0, cost: 0.8 },
      ],
    },
  });
  s = applyAction(s, {
    type: "order",
    order: {
      id: "PO-1043",
      supplier: "s2",
      location: "Kitchen",
      expected: day(2),
      status: "Ordered",
      created: new Date().toISOString(),
      lines: [
        { product: "p20", quantity: 5, received: 0, cost: 11 },
        { product: "p18", quantity: 4, received: 0, cost: 4 },
      ],
    },
  });
  return s;
}
