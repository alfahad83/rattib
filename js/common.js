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

// أيقونات بلونين: طبقة شفافة (currentColor بشفافية) + خط
const svg = (body, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const tint = (d) => `<path d="${d}" fill="currentColor" fill-opacity=".18" stroke="none"/>`;
const tintC = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor" fill-opacity=".18" stroke="none"/>`;

export const ICON = {
  search: (s) => svg(tintC(11, 11, 7) + '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>', s),
  star: (s) => svg(tint('M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z') + '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>', s),
  pin: (s) => svg(tint('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z') + '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/>', s),
  home: (s) => svg(tint('M5 10.5L12 5l7 5.5V20H5z') + '<path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>', s),
  tag: (s) => svg(tint('M3.5 12.5V4.5h8l9 9-8 8z') + '<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.6"/>', s),
  cal: (s) => svg(tint('M4 9.5h16V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z') + '<rect x="4" y="5" width="16" height="16" rx="2.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/><path d="M9 15l2 2 4-4"/>', s),
  back: (s) => svg('<path d="M9 5.5l6.5 6.5L9 18.5"/>', s),
  users: (s) => svg(tintC(9, 8, 3.5) + '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.2 20a6 6 0 0 0-2.9-5.2"/>', s),
  check: (s) => svg('<path d="M5 12.5l4.5 4.5L19 7"/>', s),
  bell: (s) => svg(tint('M6 16.5v-5a6 6 0 0 1 12 0v5l1.8 1.8H4.2z') + '<path d="M6 16.5v-5a6 6 0 0 1 12 0v5l1.8 1.8H4.2z"/><path d="M10 21h4"/>', s),
  clock: (s) => svg(tintC(12, 12, 9) + '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>', s),
  plus: (s) => svg('<path d="M12 5v14M5 12h14"/>', s),
  trash: (s) => svg(tint('M6.5 7.5h11l-1 12.5h-9z') + '<path d="M4 7.5h16M9.5 7.5V4.5h5v3M6.5 7.5l1 12.5h9l1-12.5"/>', s),
  logout: (s) => svg('<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>', s),
  chart: (s) => svg(tint('M4 20h4v-8H4zM10 20h4V5h-4zM16 20h4v-11h-4z') + '<path d="M4 20h4v-8H4zM10 20h4V5h-4zM16 20h4v-11h-4zM2 20h20"/>', s),
  gear: (s) => svg(tintC(12, 12, 7.5) + '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>', s),
  gift: (s) => svg(tint('M4 11h16v9H4z') + '<rect x="3" y="7.5" width="18" height="4" rx="1"/><path d="M4.5 11.5V20h15v-8.5M12 7.5V20"/><path d="M12 7.5c-1.5-3.5-5-3.5-5-1.2 0 1.2 2 1.2 5 1.2zM12 7.5c1.5-3.5 5-3.5 5-1.2 0 1.2-2 1.2-5 1.2z"/>', s),
  bolt: (s) => svg(tint('M13 2.5L5 13.5h6l-1 8 8-11h-6z') + '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>', s),
  shield: (s) => svg(tint('M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z') + '<path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z"/><path d="M9 12l2 2 4-4"/>', s),
  // أيقونات الفئات
  all: (s) => svg(tint('M4 4h7v7H4zM13 13h7v7h-7z') + '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>', s),
  salon: (s) => svg(tintC(7, 17.5, 3) + tintC(17, 17.5, 3) + '<circle cx="7" cy="17.5" r="3"/><circle cx="17" cy="17.5" r="3"/><path d="M9 15.3L17.5 3.5M15 15.3L6.5 3.5"/>', s),
  barber: (s) => svg(tint('M2.5 7.5h12a2.5 2.5 0 0 1 0 5H5.5z') + '<path d="M2.5 7.5h12a2.5 2.5 0 0 1 0 5H5.5z"/><path d="M14.5 10l6.5 7-2 2-6.6-7"/><circle cx="14.5" cy="10" r=".8" fill="currentColor"/>', s),
  spa: (s) => svg(tint('M12 4c2.5 2.5 3 6.5 0 10-3-3.5-2.5-7.5 0-10z') + '<path d="M12 4c2.5 2.5 3 6.5 0 10-3-3.5-2.5-7.5 0-10z"/><path d="M12 14c-2-3.5-6-4.5-9-3.5 0 4 4 7 9 6.5 5 .5 9-2.5 9-6.5-3-1-7 0-9 3.5"/><path d="M12 17v3"/>', s),
  trainer: (s) => svg(tint('M3 9h3v6H3zM18 9h3v6h-3z') + '<path d="M3 9h3v6H3zM18 9h3v6h-3zM6 7.5h2.5v9H6zM15.5 7.5H18v9h-2.5zM8.5 12h7"/>', s),
  homesvc: (s) => svg(tint('M5 10.5L12 5l7 5.5V20H5z') + '<path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M12 17.5s-3-1.9-3-3.9a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 2-3 3.9-3 3.9z"/>', s)
};

// ألوان كل فئة (خلفية الغلاف + لون الرسمة)
export const CAT_THEME = {
  salon: { bg: '#F7DDE3', fg: '#9C2C4B' },
  barber: { bg: '#DCE6F1', fg: '#1F3F66' },
  spa: { bg: '#D9EEE4', fg: '#1E5E47' },
  trainer: { bg: '#F4E5CB', fg: '#7A4F12' }
};
export const catIcon = (cat, s) => (ICON[cat] || ICON.all)(s);

// غلاف مرسوم لكل محل: نقش منقط + رسمة الفئة كبيرة + حرف المحل
export function shopArt(shop, big = false) {
  const t = CAT_THEME[shop.cat] || CAT_THEME.salon;
  const id = `p${String(shop.id).replace(/[^a-z0-9]/gi, '')}${big ? 'b' : ''}`;
  const letter = esc((shop.name || '؟').trim().charAt(0));
  const icon = (ICON[shop.cat] || ICON.all)(big ? 220 : 150);
  return `<div class="art${big ? ' big' : ''}" style="--art-bg:${t.bg};--art-fg:${t.fg}">
    <svg class="art-dots" aria-hidden="true" width="100%" height="100%"><defs><pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="${t.fg}" fill-opacity=".16"/></pattern></defs><rect width="100%" height="100%" fill="url(#${id})"/></svg>
    <span class="art-icon">${icon}</span>
    <span class="art-letter">${letter}</span>
  </div>`;
}
