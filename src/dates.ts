export function validDate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y,m,d] = v.split('-').map(Number), parsed = new Date(0);
  parsed.setUTCFullYear(y,m-1,d); parsed.setUTCHours(0,0,0,0);
  return y >= 1900 && parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m-1 && parsed.getUTCDate() === d;
}
