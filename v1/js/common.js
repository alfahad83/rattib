// أدوات مشتركة بين تطبيق العميل ولوحة المحل

export const CATS = [
  { id: 'all', label: 'الكل' },
  { id: 'salon', label: 'صالونات' },
  { id: 'barber', label: 'حلاقين' },
  { id: 'spa', label: 'سبا' },
  { id: 'trainer', label: 'مدربين' },
  { id: 'home', label: 'خدمة منزلية' }
];

export const CAT_LABEL = {
  salon: 'صالون نسائي',
  barber: 'حلاق رجالي',
  spa: 'سبا',
  trainer: 'مدرب شخصي'
};

export const COLORS = [
  { tint: '#FCE7EF', ink: '#9D174D' },
  { tint: '#EEF2FF', ink: '#3730A3' },
  { tint: '#E6F2F1', ink: '#0F5F58' },
  { tint: '#FEF3E2', ink: '#8A4205' },
  { tint: '#F3E8FF', ink: '#6B21A8' }
];

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const money = (n) => `${Math.round(n || 0).toLocaleString('en-US')} ر.س`;

export function hourLabel(h) {
  if (h === 0) return '12:00 ص';
  if (h < 12) return `${h}:00 ص`;
  if (h === 12) return '12:00 م';
  return `${h - 12}:00 م`;
}

export function isoDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseIso(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export function fullDate(iso) {
  const d = parseIso(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function nextDays(n) {
  const out = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({
      iso: isoDate(d),
      label: i === 0 ? 'اليوم' : i === 1 ? 'بكرة' : WEEKDAYS[d.getDay()],
      short: `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 4)}`
    });
  }
  return out;
}

export function today() {
  return isoDate(new Date());
}

export function daysBetween(isoA, isoB) {
  return Math.round((parseIso(isoB) - parseIso(isoA)) / 86400000);
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

const svg = (body, size = 20, extra = '') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;

export const ICON = {
  search: (s) => svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', s),
  star: (s) => svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', s),
  pin: (s) => svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', s),
  home: (s) => svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>', s),
  tag: (s) => svg('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>', s),
  cal: (s) => svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', s),
  back: (s) => svg('<path d="M9 6l6 6-6 6"/>', s),
  users: (s) => svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 20a6 6 0 0 0-3-5.2"/>', s),
  check: (s) => svg('<path d="M5 12.5l4.5 4.5L19 7"/>', s),
  bell: (s) => svg('<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>', s),
  clock: (s) => svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', s),
  plus: (s) => svg('<path d="M12 5v14M5 12h14"/>', s),
  trash: (s) => svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', s),
  logout: (s) => svg('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>', s),
  chart: (s) => svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', s),
  gear: (s) => svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>', s)
};
