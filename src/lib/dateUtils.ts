export function daysBetween(laterISO: string, earlierISO: string): number {
  const a = new Date(`${laterISO}T00:00:00`);
  const b = new Date(`${earlierISO}T00:00:00`);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function formatDateJp(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}
