export function fmtDate(d?: string | null): string {
  if (!d) return '—';
  const clean = d.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return d;
  const [y, m, day] = parts;
  return `${day}.${m}.${y}.`;
}

export function isLate(deadlineStr: string | null | undefined, done: boolean): boolean {
  if (done || !deadlineStr) return false;
  const clean = deadlineStr.split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3) return false;
  const [y, m, d] = parts;
  const deadlineDate = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return deadlineDate < today;
}

export function isNearDeadline(deadlineStr: string | null | undefined, done: boolean, days = 14): boolean {
  if (done || !deadlineStr) return false;
  const clean = deadlineStr.split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3) return false;
  const [y, m, d] = parts;
  const deadlineDate = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

export function isStale(startStr: string | null | undefined, done: boolean): boolean {
  if (done || !startStr) return false;
  const start = new Date(startStr);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 2);
  return start < cutoff;
}
