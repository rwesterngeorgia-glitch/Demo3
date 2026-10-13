import { categories, locations, type State } from './types';
import { convert } from './domain';
import { validDate } from './dates';
export const object = (v: unknown): v is Record<string,unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.length <= 10000;
const finite = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min;
const instant = (v: unknown) => text(v) && Number.isFinite(Date.parse(v));
const records = (v: unknown, fields: string[], max = 500) => Array.isArray(v) && v.length <= max && v.every(x => object(x) && fields.every(k => text(x[k]))) && new Set(v.map(x => x.id)).size === v.length;
export function migrateState(v: unknown): unknown {
  return object(v) && v.version === 1 && v.notes === undefined ? {...v,notes:[]} : v;
}
export function validState(v: unknown): v is State {
  if (!object(v) || v.version !== 1 || (v._schemaVersion !== undefined && v._schemaVersion !== 1)) return false;
  if (!records(v.products,['id','name','sku','category','description','unit','supplier','storage','icon']) || !records(v.suppliers,['id','name','contact','email','phone']) || !records(v.movements,['id','at','product','location','type','reason','actor','group'],5000) || !records(v.orders,['id','supplier','location','expected','status','created']) || !records(v.recipes,['id','name','category','note'],200) || !records(v.tasks,['id','title','kind','owner']) || !records(v.notes,['id','text','at','actor'],200) || !Array.isArray(v.receipts) || v.receipts.length > 5000 || !v.receipts.every(text) || !object(v.stock)) return false;
  const s = v as unknown as State, products = new Set(s.products.map(p => p.id)), suppliers = new Set(s.suppliers.map(x => x.id));
  if (!s.products.every(p => /^[\w-]{1,100}$/.test(p.id) && !["__proto__","prototype","constructor"].includes(p.id) && categories.includes(p.category as typeof categories[number]) && ['bottle','kg','L','each'].includes(p.unit) && finite(p.volume,Number.EPSILON) && finite(p.pack,1) && finite(p.cost) && finite(p.price) && finite(p.min) && typeof p.archived === 'boolean' && suppliers.has(p.supplier) && locations.includes(p.storage as typeof locations[number]))) return false;
  if (!s.suppliers.every(x => finite(x.lead)) || new Set(s.products.map(p => p.sku.toLowerCase())).size !== s.products.length || new Set(s.receipts).size !== s.receipts.length) return false;
  if (!Object.entries(s.stock).every(([id,values]) => products.has(id) && object(values) && Object.entries(values).every(([loc,n]) => locations.includes(loc as typeof locations[number]) && finite(n)))) return false;
  if (!s.products.every(p => object(s.stock[p.id]))) return false;
  if (!s.movements.every(x => products.has(x.product) && locations.includes(x.location as typeof locations[number]) && ['Incoming','Adjustment','Transfer out','Transfer in','Waste','Recipe','Count'].includes(x.type) && instant(x.at) && finite(x.delta,-Number.MAX_VALUE) && finite(x.before) && finite(x.after) && finite(x.cost) && Math.abs(x.before+x.delta-x.after)<.000002)) return false;
  if (!s.orders.every(o => suppliers.has(o.supplier) && locations.includes(o.location as typeof locations[number]) && validDate(o.expected) && instant(o.created) && ['Draft','Ordered','Partially received','Received','Canceled'].includes(o.status) && Array.isArray(o.lines) && o.lines.length > 0 && o.lines.length <= 100 && o.lines.every(l => object(l) && products.has(l.product) && finite(l.quantity,Number.EPSILON) && finite(l.received) && l.received <= l.quantity && finite(l.cost)) && new Set(o.lines.map(l => l.product)).size === o.lines.length)) return false;
  if (!s.recipes.every(r => finite(r.price,Number.EPSILON) && finite(r.target,Number.EPSILON) && r.target <= 100 && Array.isArray(r.ingredients) && r.ingredients.length > 0 && r.ingredients.length <= 100 && r.ingredients.every(i => object(i) && products.has(i.product) && finite(i.quantity,Number.EPSILON) && text(i.unit)))) return false;
  try {for (const r of s.recipes) for (const i of r.ingredients) convert(s.products.find(p => p.id === i.product)!,i.quantity,i.unit);} catch {return false;}
  return s.tasks.every(x => typeof x.done === 'boolean') && s.notes.every(x => instant(x.at));
}
