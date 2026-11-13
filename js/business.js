// رتّب للأعمال: لوحة صاحب المحل (ويب + جوال)
import { init, store, mode } from './store.js';
import { countUp } from './motion.js';
import { CAT_LABEL, esc, money, hourLabel, fullDate, today, isoDate, parseIso, uid, toast, ICON, shopArt } from './common.js';

const $app = document.getElementById('app');
const S = { user: null, shop: null, bookings: [], tab: 'today', date: today(), authMode: 'login', draft: null, busy: false, animate: true };

const STATUS = { confirmed: 'مؤكد', wait: 'بالانتظار', done: 'حضر', cancelled: 'ملغي', noshow: 'لم يحضر' };
const TABS = [
  { id: 'today', label: 'المواعيد', icon: 'cal' },
  { id: 'stats', label: 'الإحصائيات', icon: 'chart' },
  { id: 'settings', label: 'الإعدادات', icon: 'gear' }
];
const blankShop = () => ({
  name: '', cat: 'salon', area: '', phone: '', color: 0, open: 9, close: 22, capacity: 2,
  services: [{ id: uid('svc'), name: '', dur: 60, price: 100 }],
  homeService: false, homeFee: 50, quietOn: false, quietPct: 20, quietHours: [14, 15], depositOn: true, depositAmount: 20, active: true
});
const bookingLink = () => new URL('index.html?shop=' + encodeURIComponent(S.shop.id), location.href).href;

/* =============================== الهيكل =============================== */
function render() {
  if (!S.user) { $app.innerHTML = viewAuth(); return; }
  if (!S.shop) {
    S.draft = S.draft || blankShop();
    $app.innerHTML = `<div class="onboard"><div class="onboard-head"><span class="logo-mark">${ICON.cal(22)}</span><div><h1>سجّل محلك</h1><p>عبّي البيانات مرة وحدة وتبدأ تستقبل حجوزات.</p></div></div>${viewSettings(true)}</div>`;
    return;
  }
  const body = { today: viewToday, stats: viewStats, settings: () => viewSettings(false) }[S.tab]();
  $app.innerHTML = `<div class="dash">
    ${sidebar()}
    <div class="dash-main ${S.animate ? 'grow' : ''}">
      ${topbar()}
      <div class="dash-body">${body}</div>
    </div>
    ${mobileTabs()}
  </div>`;
  if (S.animate) { countUp($app); S.animate = false; }
}

function sidebar() {
  return `<aside class="dside" aria-label="القائمة">
    <div class="dside-brand"><span class="logo-mark gold">${ICON.cal(22)}</span><div><b>رتّب</b><small>للأعمال</small></div></div>
    <nav class="dside-nav">${TABS.map((t) => `<button class="dnav ${S.tab === t.id ? 'on' : ''}" data-act="tab" data-v="${t.id}" ${S.tab === t.id ? 'aria-current="page"' : ''}>${ICON[t.icon](20)}<span>${t.label}</span></button>`).join('')}</nav>
    <div class="dside-shop">
      <div class="dshop-cover">${shopArt(S.shop)}</div>
      <b>${esc(S.shop.name)}</b>
      <small>${S.shop.active !== false ? '<i class="live"></i> ظاهر للعملاء' : 'مخفي عن العملاء'}</small>
      <button class="dside-link" data-act="share">${ICON.tag(18)}<span>نسخ رابط الحجز</span></button>
      <a class="dside-link" href="index.html">${ICON.home(18)}<span>صفحة العملاء</span></a>
      <button class="dside-link" data-act="logout">${ICON.logout(18)}<span>${mode === 'local' ? 'تصفير البيانات التجريبية' : 'تسجيل الخروج'}</span></button>
    </div>
  </aside>`;
}

function topbar() {
  const titles = { today: 'المواعيد', stats: 'الإحصائيات', settings: 'إعدادات المحل' };
  const dateNav = S.tab === 'today' ? `<div class="datenav">
      <button class="icon-btn" data-act="day" data-v="-1" aria-label="اليوم السابق">${ICON.back(18)}</button>
      <label class="datepick">${ICON.cal(18)}<input type="date" id="date" value="${S.date}" aria-label="اختر التاريخ"></label>
      <button class="icon-btn flip" data-act="day" data-v="1" aria-label="اليوم التالي">${ICON.back(18)}</button>
      ${S.date !== today() ? '<button class="btn sm ghost" data-act="today">اليوم</button>' : ''}
    </div>` : '';
  return `<header class="dtop">
    <div class="dtop-title">
      <span class="dtop-shop">${esc(S.shop.name)}</span>
      <h1>${titles[S.tab]}</h1>
      ${S.tab === 'today' ? `<p>${fullDate(S.date)}</p>` : S.tab === 'stats' ? '<p>آخر 30 يوم</p>' : '<p>التغييرات تظهر للعملاء مباشرة</p>'}
    </div>
    ${dateNav}
    <div class="dtop-mobile-actions"><button class="icon-btn" data-act="share" aria-label="نسخ رابط الحجز">${ICON.tag(18)}</button><button class="icon-btn" data-act="logout" aria-label="${mode === 'local' ? 'تصفير البيانات التجريبية' : 'تسجيل الخروج'}">${ICON.logout(18)}</button></div>
  </header>`;
}

function mobileTabs() {
  return `<nav class="dtabs" aria-label="التنقل">${TABS.map((t) => `<button class="${S.tab === t.id ? 'on' : ''}" data-act="tab" data-v="${t.id}" ${S.tab === t.id ? 'aria-current="page"' : ''}>${ICON[t.icon](22)}<span>${t.label}</span></button>`).join('')}</nav>`;
}

/* =============================== الدخول =============================== */
function viewAuth() {
  const signup = S.authMode === 'signup';
  return `<div class="auth-split">
    <section class="auth-art">
      <div class="auth-art-in">
        <span class="logo-mark gold lg">${ICON.cal(30)}</span>
        <h1>رتّب للأعمال</h1>
        <p>استقبل حجوزات محلك أونلاين، وخفّف الغياب، وعبّي ساعاتك الهادئة.</p>
        <ul>
          <li>${ICON.cal(20)} مواعيد اليوم في شاشة وحدة</li>
          <li>${ICON.shield(20)} عربون يحمي مواعيدك من الغياب</li>
          <li>${ICON.bolt(20)} خصم تلقائي على الساعات الهادئة</li>
          <li>${ICON.chart(20)} إحصائيات الحضور والدخل</li>
        </ul>
      </div>
    </section>
    <section class="auth-form">
      <form class="form" id="auth-form">
        <h2>${signup ? 'سجّل محلك مجانًا' : 'دخول أصحاب المحلات'}</h2>
        <p class="sub">${signup ? 'أنشئ حساب، وبعدها تعبّي بيانات محلك.' : 'ادخل ببريدك وكلمة المرور.'}</p>
        <label class="field">البريد الإلكتروني<input name="email" type="email" required autocomplete="email"></label>
        <label class="field">كلمة المرور<input name="pass" type="password" required minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}"><span class="hint">6 خانات على الأقل</span></label>
        <button class="btn block" ${S.busy ? 'disabled' : ''}>${signup ? 'إنشاء حساب' : 'دخول'}</button>
        <button type="button" class="link-btn" data-act="authmode">${signup ? 'عندك حساب؟ سجّل دخول' : 'ما عندك حساب؟ سجّل محلك'}</button>
        <a class="link-btn" href="index.html">الرجوع لصفحة العملاء</a>
      </form>
    </section>
  </div>`;
}

/* =============================== المواعيد =============================== */
const dayBookings = () => S.bookings.filter((b) => b.date === S.date).sort((a, b) => a.hour - b.hour || (a.createdAt || 0) - (b.createdAt || 0));

function actionsFor(b) {
  const btn = (st, label, cls = 'ghost') => `<button class="btn sm ${cls}" data-act="status" data-v="${esc(b.id)}" data-s="${st}">${label}</button>`;
  if (b.status === 'confirmed') return btn('done', `${ICON.check(16)} حضر`, '') + btn('noshow', 'ما حضر') + btn('cancelled', 'إلغاء', 'danger');
  if (b.status === 'wait') return btn('confirmed', 'أكّد له الموعد', 'gold') + btn('cancelled', 'رفض', 'danger');
  return '';
}

function apptCard(b) {
  return `<article class="appt st-line-${esc(b.status)}">
    <div class="appt-main">
      <div class="appt-who"><b>${esc(b.customerName)}</b>${b.people > 1 ? `<span class="tag new">${ICON.users(12)} ${b.people} أشخاص</span>` : ''}</div>
      <p>${esc(b.serviceName)}${b.atHome ? ' <span class="tag home">في البيت</span>' : ''}${b.discount ? ' <span class="tag offer">خصم الهدوء</span>' : ''}</p>
      <a class="appt-phone" href="tel:${esc(b.customerPhone)}" dir="ltr">${esc(b.customerPhone)}</a>
    </div>
    <div class="appt-side">
      <span class="status st-${esc(b.status)}">${STATUS[b.status] || esc(b.status)}</span>
      <b class="appt-total">${money(b.total)}</b>
    </div>
    ${actionsFor(b) ? `<div class="appt-actions">${actionsFor(b)}</div>` : ''}
  </article>`;
}

function ring(pct) {
  const r = 52, c = 2 * Math.PI * r;
  return `<svg class="ring-svg" viewBox="0 0 128 128" aria-hidden="true">
    <circle cx="64" cy="64" r="${r}" stroke="var(--pine-soft)" stroke-width="14" fill="none"/>
    <circle class="ring-val" cx="64" cy="64" r="${r}" stroke="var(--pine)" stroke-width="14" fill="none" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" style="--c:${c}" transform="rotate(-90 64 64)"/>
  </svg>`;
}

function viewToday() {
  const list = dayBookings();
  const active = list.filter((b) => b.status === 'confirmed' || b.status === 'done');
  const waits = list.filter((b) => b.status === 'wait');
  const shop = S.shop;
  const seats = (shop.close - shop.open) * shop.capacity;
  const used = active.reduce((n, b) => n + b.people, 0);
  const pct = seats ? Math.round((used / seats) * 100) : 0;
  const revenue = active.reduce((n, b) => n + (b.total || 0), 0);
  const nowH = new Date().getHours();
  const isToday = S.date === today();

  const hours = [];
  for (let h = shop.open; h < shop.close; h++) {
    const items = list.filter((b) => b.hour === h && b.status !== 'wait');
    const taken = items.filter((b) => b.status === 'confirmed' || b.status === 'done').reduce((n, b) => n + b.people, 0);
    hours.push({ h, items, taken });
  }

  return `<div class="kpis">
      <div class="kpi"><span>حجوزات اليوم</span><b data-count="${active.length}">${active.length}</b><small>${active.filter((b) => b.people > 1).length} منها جماعية</small></div>
      <div class="kpi"><span>الدخل المتوقع</span><b data-count="${revenue}" data-fmt="money">${money(revenue)}</b><small>شامل الخصومات</small></div>
      <div class="kpi"><span>حضروا</span><b data-count="${list.filter((b) => b.status === 'done').length}">${list.filter((b) => b.status === 'done').length}</b><small>من ${active.length} موعد</small></div>
      <div class="kpi"><span>قائمة الانتظار</span><b data-count="${waits.length}">${waits.length}</b><small>${waits.length ? 'أكّد لهم إذا فضى موعد' : 'ما فيه أحد'}</small></div>
    </div>
    <div class="today-grid">
      <section class="panel timeline-panel" aria-labelledby="tl-h">
        <div class="panel-head"><h2 id="tl-h">جدول اليوم</h2><span class="meta">${shop.capacity} عملاء بنفس الوقت</span></div>
        <ol class="timeline">${hours.map(({ h, items, taken }) => {
          const past = isToday && h < nowH;
          const now = isToday && h === nowH;
          const quiet = shop.quietOn && (shop.quietHours || []).includes(h);
          return `<li class="tl-hour ${past ? 'past' : ''} ${now ? 'now' : ''} ${items.length ? '' : 'is-empty'}">
            <div class="tl-time"><b>${hourLabel(h)}</b>${now ? '<small class="now-tag">الحين</small>' : ''}${quiet ? '<small class="quiet-tag">هادئة</small>' : ''}</div>
            <div class="tl-seats" aria-label="${taken} من ${shop.capacity} محجوز">${Array.from({ length: shop.capacity }, (_, i) => `<i class="${i < taken ? 'on' : ''}"></i>`).join('')}</div>
            <div class="tl-items">${items.length ? items.map(apptCard).join('') : '<span class="tl-free">فاضي</span>'}</div>
          </li>`;
        }).join('')}</ol>
      </section>

      <aside class="today-side">
        <section class="panel occ">
          <h2>الإشغال</h2>
          <div class="occ-ring">${ring(pct)}<div class="occ-val"><b data-count="${pct}" data-fmt="pct">${pct}%</b><small>${used} من ${seats}</small></div></div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>قائمة الانتظار</h2>${waits.length ? `<span class="count-badge">${waits.length}</span>` : ''}</div>
          ${waits.length ? waits.map((b) => `<div class="wait-row">
            <div><b>${esc(b.customerName)}</b><p>${hourLabel(b.hour)}، ${esc(b.serviceName)}</p></div>
            <button class="btn sm gold" data-act="status" data-v="${esc(b.id)}" data-s="confirmed">أكّد</button>
          </div>`).join('') : '<p class="meta">لما يكون موعد ممتلئ ويطلبه أحد، يظهر هنا.</p>'}
        </section>
        <section class="panel">
          <h2>تحكم سريع</h2>
          <button class="quick" data-act="quick" data-v="quietOn" aria-pressed="${!!shop.quietOn}">
            <span class="quick-ic gold">${ICON.bolt(20)}</span><span class="quick-txt"><b>خصم الساعات الهادئة</b><small>${shop.quietOn ? `${shop.quietPct}% على ${(shop.quietHours || []).map(hourLabel).join('، ')}` : 'متوقف'}</small></span><span class="switch"></span>
          </button>
          <button class="quick" data-act="quick" data-v="depositOn" aria-pressed="${!!shop.depositOn}">
            <span class="quick-ic">${ICON.shield(20)}</span><span class="quick-txt"><b>عربون ضد الغياب</b><small>${shop.depositOn ? money(shop.depositAmount) : 'متوقف'}</small></span><span class="switch"></span>
          </button>
          <button class="quick" data-act="quick" data-v="active" aria-pressed="${shop.active !== false}">
            <span class="quick-ic">${ICON.home(20)}</span><span class="quick-txt"><b>استقبال الحجوزات</b><small>${shop.active !== false ? 'المحل ظاهر للعملاء' : 'المحل مخفي'}</small></span><span class="switch"></span>
          </button>
        </section>
      </aside>
    </div>`;
}

/* =============================== الإحصائيات =============================== */
function viewStats() {
  const t = today();
  const from = new Date(); from.setDate(from.getDate() - 30);
  const fromIso = isoDate(from);
  const range = S.bookings.filter((b) => b.date >= fromIso && b.date < t);
  const done = range.filter((b) => b.status === 'done');
  const noshow = range.filter((b) => b.status === 'noshow');
  const attended = done.length + noshow.length ? Math.round((done.length / (done.length + noshow.length)) * 100) : 0;
  const byCust = {};
  done.forEach((b) => { const k = b.customerPhone + b.customerName; byCust[k] = (byCust[k] || 0) + 1; });
  const custs = Object.values(byCust);
  const returning = custs.length ? Math.round((custs.filter((n) => n > 1).length / custs.length) * 100) : 0;
  const revenue = done.reduce((n, b) => n + (b.total || 0), 0);
  const avg = done.length ? revenue / done.length : 0;

  const hours = [];
  for (let h = S.shop.open; h < S.shop.close; h++) hours.push({ h, n: done.filter((b) => b.hour === h).length });
  const max = Math.max(1, ...hours.map((x) => x.n));
  const quietSet = new Set(S.shop.quietOn ? S.shop.quietHours || [] : []);
  const lowest = hours.slice().sort((a, b) => a.n - b.n).slice(0, 2).map((x) => x.h).sort((a, b) => a - b);
  const peak = hours.slice().sort((a, b) => b.n - a.n)[0];

  const WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const wd = WD.map((name, i) => ({ name, n: done.filter((b) => parseIso(b.date).getDay() === i).length }));
  const wdMax = Math.max(1, ...wd.map((x) => x.n));

  const svc = {};
  done.forEach((b) => { svc[b.serviceName] = (svc[b.serviceName] || 0) + 1; });
  const top = Object.entries(svc).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (!done.length && !noshow.length) return '<div class="empty big">تظهر الإحصائيات بعد ما تكتمل أول المواعيد. غيّر حالة الموعد لـ "حضر" من صفحة المواعيد.</div>';

  return `<div class="kpis">
      <div class="kpi"><span>الدخل</span><b data-count="${revenue}" data-fmt="money">${money(revenue)}</b><small>متوسط الموعد ${money(avg)}</small></div>
      <div class="kpi"><span>مواعيد مكتملة</span><b data-count="${done.length}">${done.length}</b><small>${noshow.length} لم يحضروا</small></div>
      <div class="kpi"><span>نسبة الحضور</span><b data-count="${attended}" data-fmt="pct">${attended}%</b><small>${S.shop.depositOn ? 'العربون مفعّل' : 'جرّب تفعيل العربون'}</small></div>
      <div class="kpi"><span>عملاء رجعوا</span><b data-count="${returning}" data-fmt="pct">${returning}%</b><small>زاروك أكثر من مرة</small></div>
    </div>

    <div class="insights">
      <div class="insight">${ICON.bolt(22)}<p>أهدى وقت عندك <b>${lowest.map(hourLabel).join(' و ')}</b>. ${S.shop.quietOn ? 'خصم الساعات الهادئة شغّال.' : '<button class="link-btn inline" data-act="tab" data-v="settings">فعّل خصم الساعات الهادئة</button> عشان تعبّيه.'}</p></div>
      ${peak && peak.n ? `<div class="insight">${ICON.users(22)}<p>أزحم ساعة <b>${hourLabel(peak.h)}</b> بـ ${peak.n} موعد. ${S.shop.capacity < 3 ? 'إذا تقدر، زِد عدد الموظفين في هذا الوقت.' : ''}</p></div>` : ''}
    </div>

    <div class="stats-grid">
      <section class="panel wide">
        <div class="panel-head"><h2>المواعيد المكتملة حسب الساعة</h2><div class="legend"><span><i></i>عادي</span><span><i class="quiet"></i>ساعات الخصم</span></div></div>
        <div class="bars">${hours.map((x, i) => `<div class="bar"><span>${x.n}</span><i class="${quietSet.has(x.h) ? 'quiet' : ''}" style="--i:${i};height:${Math.round((x.n / max) * 160) + 4}px"></i></div>`).join('')}</div>
        <div class="bar-labels">${hours.map((x) => `<span>${x.h > 12 ? x.h - 12 : x.h}</span>`).join('')}</div>
      </section>
      <section class="panel">
        <h2>حسب أيام الأسبوع</h2>
        <div class="wd">${wd.map((x) => `<div class="wd-row"><span>${x.name}</span><div class="meter"><i style="width:${Math.round((x.n / wdMax) * 100)}%"></i></div><b>${x.n}</b></div>`).join('')}</div>
      </section>
      <section class="panel">
        <h2>أكثر الخدمات طلبًا</h2>
        ${top.map(([name, n]) => { const p = Math.round((n / done.length) * 100); return `<div class="svc-stat"><div class="kv"><b>${esc(name)}</b><span>${p}%</span></div><div class="meter"><i style="width:${p}%"></i></div></div>`; }).join('')}
      </section>
    </div>`;
}

/* =============================== الإعدادات =============================== */
function hourOptions(sel, from, to) {
  let o = '';
  for (let h = from; h <= to; h++) o += `<option value="${h}" ${h === Number(sel) ? 'selected' : ''}>${h === 24 ? '12:00 ص (منتصف الليل)' : hourLabel(h)}</option>`;
  return o;
}

function setSec(title, desc, inner) {
  return `<section class="set-sec"><div class="set-desc"><h2>${title}</h2><p>${desc}</p></div><div class="set-body">${inner}</div></section>`;
}

function viewSettings(isNew) {
  const d = S.draft || (S.draft = JSON.parse(JSON.stringify(S.shop)));
  const quietBtns = [];
  for (let h = Number(d.open); h < Number(d.close); h++) quietBtns.push(`<button type="button" class="${d.quietHours.includes(h) ? 'on' : ''}" data-act="qh" data-v="${h}" aria-pressed="${d.quietHours.includes(h)}">${hourLabel(h)}</button>`);
  const check = (name, on, title, desc) => `<label class="toggle-row"><span class="txt"><b>${title}</b><span>${desc}</span></span><input type="checkbox" class="sw" name="${name}" ${on ? 'checked' : ''}></label>`;
  return `<form id="shop-form" class="settings" novalidate>
    ${setSec('معلومات المحل', 'هذي البيانات اللي يشوفها العميل في صفحة محلك.', `<div class="grid2">
      <label class="field">اسم المحل<input name="name" required maxlength="40" value="${esc(d.name)}"></label>
      <label class="field">الفئة<select name="cat">${Object.entries(CAT_LABEL).map(([k, v]) => `<option value="${k}" ${d.cat === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field">الحي والمدينة<input name="area" required maxlength="40" value="${esc(d.area)}" placeholder="حي الملقا، الرياض"></label>
      <label class="field">جوال المحل<input name="phone" inputmode="tel" maxlength="10" value="${esc(d.phone)}" placeholder="05XXXXXXXX"></label>
    </div>`)}
    ${setSec('أوقات العمل', 'حدد متى تفتح وتقفل، وكم عميل تقدر تخدم بنفس الوقت.', `<div class="grid2">
      <label class="field">يفتح الساعة<select name="open">${hourOptions(d.open, 0, 23)}</select></label>
      <label class="field">يقفل الساعة<select name="close">${hourOptions(d.close, 1, 24)}</select></label>
      <label class="field">عدد العملاء بنفس الوقت<input name="capacity" type="number" min="1" max="30" value="${esc(d.capacity)}"><span class="hint">عدد الموظفين أو الكراسي</span></label>
    </div>`)}
    ${setSec('الخدمات والأسعار', 'كل خدمة تظهر للعميل باسمها ومدتها وسعرها.', `${d.services.map((v, i) => `<div class="svc-edit">
        <label class="field svc-name">اسم الخدمة<input name="svc-name-${i}" maxlength="40" value="${esc(v.name)}" placeholder="مثال: قص وتصفيف"></label>
        <label class="field">المدة (دقيقة)<input name="svc-dur-${i}" type="number" min="5" step="5" value="${esc(v.dur)}"></label>
        <label class="field">السعر (ر.س)<input name="svc-price-${i}" type="number" min="0" value="${esc(v.price)}"></label>
        <button type="button" class="icon-btn danger" data-act="delsvc" data-v="${i}" aria-label="حذف الخدمة">${ICON.trash(18)}</button>
      </div>`).join('')}
      <button type="button" class="btn ghost sm" data-act="addsvc">${ICON.plus(16)} إضافة خدمة</button>`)}
    ${setSec('زيادة الدخل', 'أدوات تعبّي أوقاتك الهادئة وتقلل الغياب.', `
      ${check('quietOn', d.quietOn, 'خصم الساعات الهادئة', 'يظهر للعميل على الأوقات اللي تختارها')}
      <div class="grid2"><label class="field">نسبة الخصم<select name="quietPct">${[10, 15, 20, 25, 30].map((p) => `<option value="${p}" ${Number(d.quietPct) === p ? 'selected' : ''}>${p}%</option>`).join('')}</select></label></div>
      <div class="field">ساعات الخصم<div class="hours-pick">${quietBtns.join('')}</div></div>
      ${check('depositOn', d.depositOn, 'عربون ضد الغياب', 'يُخصم من الفاتورة')}
      <div class="grid2"><label class="field">مبلغ العربون (ر.س)<input name="depositAmount" type="number" min="0" value="${esc(d.depositAmount)}"></label></div>`)}
    ${setSec('خدمات إضافية', 'خيارات تميز محلك.', `
      ${check('homeService', d.homeService, 'خدمة منزلية', 'تروح للعميل في بيته')}
      <div class="grid2"><label class="field">رسوم الزيارة (ر.س)<input name="homeFee" type="number" min="0" value="${esc(d.homeFee)}"></label></div>
      ${check('active', d.active !== false, 'المحل ظاهر للعملاء', 'أطفه إذا تبي توقف الحجوزات مؤقتًا')}`)}
    <div class="save-bar"><span>${isNew ? 'تقدر تعدّل كل شي بعدين.' : 'تأكد من البيانات قبل الحفظ.'}</span><button class="btn" ${S.busy ? 'disabled' : ''}>${isNew ? 'سجّل المحل' : 'احفظ التغييرات'}</button></div>
  </form>`;
}

/* =============================== الأفعال =============================== */
function readForm() {
  const f = document.getElementById('shop-form');
  if (!f) return;
  const d = S.draft;
  const n = (name) => Number(f.elements[name].value);
  d.name = f.elements.name.value.trim();
  d.cat = f.elements.cat.value;
  d.area = f.elements.area.value.trim();
  d.phone = f.elements.phone.value.trim();
  d.open = n('open'); d.close = n('close');
  d.capacity = Math.max(1, n('capacity') || 1);
  d.services = d.services.map((v, i) => ({ id: v.id, name: f.elements[`svc-name-${i}`].value.trim(), dur: n(`svc-dur-${i}`) || 30, price: Math.max(0, n(`svc-price-${i}`) || 0) }));
  d.quietOn = f.elements.quietOn.checked; d.quietPct = n('quietPct');
  d.depositOn = f.elements.depositOn.checked; d.depositAmount = Math.max(0, n('depositAmount') || 0);
  d.homeService = f.elements.homeService.checked; d.homeFee = Math.max(0, n('homeFee') || 0);
  d.active = f.elements.active.checked;
  d.quietHours = d.quietHours.filter((h) => h >= d.open && h < d.close);
}

async function saveShop() {
  readForm();
  const d = S.draft;
  d.services = d.services.filter((v) => v.name);
  if (!d.name || !d.area) return toast('اكتب اسم المحل والحي');
  if (d.close <= d.open) return toast('وقت الإقفال لازم يكون بعد وقت الفتح');
  if (!d.services.length) { d.services.push({ id: uid('svc'), name: '', dur: 60, price: 100 }); render(); return toast('أضف خدمة وحدة على الأقل'); }
  if (d.color === undefined) d.color = 0;
  S.busy = true;
  try {
    S.shop = await store().saveShop(d);
    S.draft = null; S.tab = 'today'; S.animate = true;
    await loadBookings();
    toast('انحفظت التغييرات');
  } catch (e) { console.error(e); toast('ما انحفظت التغييرات. حاول مرة ثانية.'); }
  S.busy = false; render();
}

async function loadBookings() {
  try { S.bookings = S.shop ? await store().shopBookings(S.shop.id) : []; } catch (e) { console.error(e); S.bookings = []; toast('ما قدرنا نجيب الحجوزات'); }
}

const actions = {
  tab: (v) => { S.tab = v; S.draft = null; S.animate = true; render(); window.scrollTo(0, 0); },
  authmode: () => { S.authMode = S.authMode === 'login' ? 'signup' : 'login'; render(); },
  day: (v) => { const d = parseIso(S.date); d.setDate(d.getDate() + Number(v)); S.date = isoDate(d); S.animate = true; render(); },
  today: () => { S.date = today(); S.animate = true; render(); },
  status: async (v, el) => {
    const b = S.bookings.find((x) => x.id === v);
    if (!b) return;
    const st = el.dataset.s;
    try { await store().setStatus(b, st); b.status = st; toast(`تم: ${STATUS[st]}`); }
    catch (e) { console.error(e); toast(e.message === 'FULL' ? 'الموعد ممتلئ. ألغِ موعد ثاني أول.' : 'ما تحدّثت الحالة. حاول مرة ثانية.'); }
    render();
  },
  quick: async (v) => {
    const cur = v === 'active' ? S.shop.active !== false : !!S.shop[v];
    try { S.shop = await store().saveShop({ ...S.shop, [v]: !cur }); toast('انحفظ'); } catch (e) { console.error(e); toast('ما انحفظ التغيير'); }
    render();
  },
  addsvc: () => { readForm(); S.draft.services.push({ id: uid('svc'), name: '', dur: 60, price: 100 }); render(); },
  delsvc: (v) => { readForm(); S.draft.services.splice(Number(v), 1); if (!S.draft.services.length) S.draft.services.push({ id: uid('svc'), name: '', dur: 60, price: 100 }); render(); },
  qh: (v) => { readForm(); const h = Number(v); const q = S.draft.quietHours; const i = q.indexOf(h); if (i >= 0) q.splice(i, 1); else q.push(h); render(); },
  share: async () => {
    const url = bookingLink();
    try { await navigator.clipboard.writeText(url); toast('نسخنا رابط الحجز. شاركه مع عملائك.'); } catch (e) { prompt('انسخ رابط الحجز:', url); }
  },
  logout: async () => {
    if (mode === 'local' && !confirm('بنرجّع البيانات التجريبية من البداية. متأكد؟')) return;
    await store().signOut();
  }
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset.v, el); }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'date' && e.target.value) { S.date = e.target.value; S.animate = true; render(); }
  if (e.target.name === 'open' || e.target.name === 'close') { readForm(); render(); }
});

document.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (e.target.id === 'shop-form') return saveShop();
  if (e.target.id === 'auth-form') {
    const f = e.target; S.busy = true; render();
    try {
      if (S.authMode === 'signup') await store().signUp(f.email.value, f.pass.value);
      else await store().signIn(f.email.value, f.pass.value);
    } catch (err) {
      console.error(err);
      const c = err.code || '';
      toast(c.includes('email-already') ? 'البريد مسجل من قبل. سجّل دخول.' : c.includes('weak-password') ? 'كلمة المرور ضعيفة. استخدم 6 خانات أو أكثر.' : 'البريد أو كلمة المرور غير صحيحة.');
      S.busy = false; render();
    }
  }
});

(async function boot() {
  try {
    await init({ anonymous: false });
    if (mode === 'local') document.getElementById('demo').hidden = false;
    store().onUser(async (u) => {
      S.user = u; S.busy = false; S.draft = null; S.animate = true;
      S.shop = u ? await store().myShop() : null;
      await loadBookings();
      render();
    });
  } catch (e) {
    console.error(e);
    $app.innerHTML = '<div class="loading">ما قدرنا نتصل بالخادم. تأكد من الإنترنت وحدّث الصفحة.</div>';
  }
})();
