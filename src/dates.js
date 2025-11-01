// /src/dates.js
export function parseYMDLocal(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function startOfTodayLocal() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function dayDiff(a, b) {
  return Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY);
}
