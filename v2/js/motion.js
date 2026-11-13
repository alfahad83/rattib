// نظام الحركة التلقائي لرتّب
// - انتقالات بين الشاشات (View Transitions API) مع اتجاه للأمام/للخلف
// - عدّادات أرقام متحركة (tween / countUp)
// - كل شي يطفي تلقائيًا مع "تقليل الحركة"
import { money } from './common.js';

const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
export const reduced = () => mq.matches;

export function transition(update, dir = 'forward') {
  if (!document.startViewTransition || reduced()) { update(); return; }
  const root = document.documentElement;
  root.classList.remove('vt-forward', 'vt-back');
  root.classList.add(dir === 'back' ? 'vt-back' : 'vt-forward');
  const t = document.startViewTransition(update);
  t.finished.finally(() => root.classList.remove('vt-forward', 'vt-back'));
}

const easeOut = (p) => 1 - Math.pow(1 - p, 3);

export function tween(el, from, to, fmt, dur = 480) {
  if (!el) return;
  if (reduced() || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = fmt(from + (to - from) * easeOut(p));
    if (p < 1) requestAnimationFrame(step);
  };
  el.textContent = fmt(from);
  requestAnimationFrame(step);
}

const FORMATS = {
  money: (v) => money(v),
  pct: (v) => `${Math.round(v)}%`,
  int: (v) => Math.round(v).toLocaleString('en-US')
};

// كل عنصر فيه data-count يعد من الصفر لقيمته
export function countUp(root = document) {
  root.querySelectorAll('[data-count]').forEach((el, i) => {
    const to = Number(el.dataset.count) || 0;
    const fmt = FORMATS[el.dataset.fmt] || FORMATS.int;
    setTimeout(() => tween(el, 0, to, fmt, 900), i * 60);
  });
}

// يشغّل حركة CSS من جديد على عنصر
export function replay(el, cls) {
  if (!el || reduced()) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
