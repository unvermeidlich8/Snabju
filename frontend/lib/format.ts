export function fmtPlain(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function fmt(n: number): string {
  return fmtPlain(n) + ' ₽';
}

// formats raw input → "8 (XXX) XXX-XX-XX" progressively
export function formatPhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('7')) d = '8' + d.slice(1);
  else if (d.length > 0 && !d.startsWith('8')) d = '8' + d;
  d = d.slice(0, 11);
  if (!d) return '';
  let r = d[0];
  if (d.length <= 1) return r;
  r += ' (' + d.slice(1, 4);
  if (d.length <= 4) return r;
  r += ') ' + d.slice(4, 7);
  if (d.length <= 7) return r;
  r += '-' + d.slice(7, 9);
  if (d.length <= 9) return r;
  r += '-' + d.slice(9, 11);
  return r;
}

// converts display format back to "+7XXXXXXXXXX" for API
export function toApiPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('8') && d.length === 11) return '+7' + d.slice(1);
  if (d.startsWith('7') && d.length === 11) return '+' + d;
  return phone;
}