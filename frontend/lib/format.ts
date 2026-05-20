export function fmtPlain(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function fmt(n: number): string {
  return fmtPlain(n) + ' ₽';
}