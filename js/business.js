// لوحة صاحب المحل: تسجيل الدخول، تسجيل المحل، مواعيد اليوم، الإحصائيات، الإعدادات
import { init, store, mode } from './store.js';
import { CAT_LABEL, esc, money, hourLabel, fullDate, today, isoDate, parseIso, uid, toast, ICON } from './common.js';

const $app = document.getElementById('app');
const S = { user: null, shop: null, bookings: [], tab: 'today', date: today(), authMode: 'login', draft: null, busy: false };

const STATUS = { confirmed: 'مؤكد', wait: 'قائمة الانتظار', done: 'حضر', cancelled: 'ملغي', noshow: 'لم يحضر' };
const blankShop = () => ({
  name: '', cat: 'salon', area: '', phone: '', color: Math.floor(Math.random() * 5), open: 9, close: 22, capacity: 2,
  services: [{ id: uid('svc'), name: '', dur: 60, price: 100 }],
  homeService: false, homeFee: 50, quietOn: false, quietPct: 20, quietHours: [14, 15], depositOn: true, depositAmount: 20, active: true
});

/* ------------------------------ عرض ------------------------------ */
function render() {
  if (!S.user) return ($app.innerHTML = viewAuth());
  if (!S.shop) { S.draft = S.draft || blankShop(); return ($app.innerHTML = `<div class="biz"><main class="biz-main">${viewSettings(true)}</main></div>`); }
  const side = (id, icon, label) => `<button class="side-btn ${S.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>${icon}<span>${label}</span></button>`;
  const body = { today: viewToday, stats: viewStats, settings: () => viewSettings(false) }[S.tab]();
  $app.innerHTML = `<div class="biz">
    <aside class="biz-side">
      <div class="brand"><div class="logo">ر</div><div><b>رتّب</b><small>لوحة المحل</small></div></div>
      ${side('today', ICON.cal(18), 'المواعيد')}
      ${side('stats', ICON.chart(18), 'الإحصائيات')}
      ${side('settings', ICON.gear(18), 'إعدادات المحل')}
      <button class="side-btn" data-act="share">${ICON.tag(18)}<span>نسخ رابط الحجز</span></button>
      <a class="side-btn" href="index.html" style="text-decoration:none">${ICON.home(18)}<span>صفحة العملاء</span></a>
      <button class="side-btn" data-act="logout">${ICON.logout(18)}<span>${mode === 'local' ? 'تصفير البيانات التجريبية' : 'تسجيل الخروج'}</span></button>
    </aside>
    <main class="biz-main">${body}</main>
  </div>`;
}

function viewAuth() {
  const signup = S.authMode === 'signup';
  return `<div class="auth"><form class="card form" id="auth-form" style="padding:24px">
    <div class="brand" style="padding:0"><div class="logo" style="color:#fff">ر</div><div><b>رتّب للأعمال</b><small style="color:var(--muted)">${signup ? 'سجّل محلك مجانًا' : 'دخول أصحاب المحلات'}</small></div></div>
    <label class="field">البريد الإلكتروني<input name="email" type="email" required autocomplete="email"></label>
    <label class="field">كلمة المرور<input name="pass" type="password" required minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}"><span class="hint">6 خانات على الأقل</span></label>
    <button class="btn block" ${S.busy ? 'disabled' : ''}>${signup ? 'إنشاء حساب' : 'دخول'}</button>
    <button type="button" class="link-btn" data-act="authmode">${signup ? 'عندك حساب؟ سجّل دخول' : 'ما عندك حساب؟ سجّل محلك'}</button>
  </form></div>`;
}

const dayBookings = () => S.bookings.filter((b) => b.date === S.date).sort((a, b) => a.hour - b.hour || (a.createdAt || 0) - (b.createdAt || 0));

function rowActions(b) {
  const btn = (st, label, cls = 'ghost') => `<button class="btn small ${cls}" data-act="status" data-v="${esc(b.id)}" data-s="${st}">${label}</button>`;
  if (b.status === 'confirmed') return btn('done', 'حضر', '') + btn('noshow', 'ما حضر') + btn('cancelled', 'إلغاء', 'danger-text');
  if (b.status === 'wait') return btn('confirmed', 'أكّد له الموعد', 'warn') + btn('cancelled', 'رفض', 'danger-text');
  return '';
}

function viewToday() {
  const list = dayBookings();
  const active = list.filter((b) => b.status === 'confirmed' || b.status === 'done');
  const waits = list.filter((b) => b.status === 'wait');
  const seats = (S.shop.close - S.shop.open) * S.shop.capacity;
  const used = active.reduce((n, b) => n + b.people, 0);
  return `<header class="biz-head">
      <div><h1>${esc(S.shop.name)}</h1><span class="meta">${fullDate(S.date)}</span></div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="icon-btn" style="background:#fff;border:1px solid var(--line)" data-act="day" data-v="-1" aria-label="اليوم السابق">${ICON.back(18)}</button>
        <input type="date" id="date" value="${S.date}" aria-label="اختر التاريخ" style="height:44px;border-radius:12px;border:1px solid var(--line);padding:0 10px;background:#fff">
        <button class="icon-btn" style="background:#fff;border:1px solid var(--line);transform:scaleX(-1)" data-act="day" data-v="1" aria-label="اليوم التالي">${ICON.back(18)}</button>
      </div>
    </header>
    <div class="kpis">
      <div class="kpi"><span>حجوزات اليوم</span><b>${active.length}</b><small>${active.filter((b) => b.people > 1).length} منها جماعية</small></div>
      <div class="kpi"><span>الدخل المتوقع</span><b>${money(active.reduce((n, b) => n + (b.total || 0), 0))}</b><small>شامل الخصومات</small></div>
      <div class="kpi"><span>الإشغال</span><b>${seats ? Math.round((used / seats) * 100) : 0}%</b><small>${used} من ${seats} مقعد</small></div>
      <div class="kpi"><span>قائمة الانتظار</span><b>${waits.length}</b><small>أكّد لهم إذا فضى موعد</small></div>
    </div>
    <section class="panel wide"><h2>مواعيد اليوم</h2>
      ${list.length ? `<div class="table-wrap"><table>
        <thead><tr><th>الوقت</th><th>العميل</th><th>الجوال</th><th>الخدمة</th><th>المبلغ</th><th>الحالة</th><th>إجراء</th></tr></thead>
        <tbody>${list.map((b) => `<tr>
          <td style="font-weight:600;white-space:nowrap">${hourLabel(b.hour)}</td>
          <td>${esc(b.customerName)}${b.people > 1 ? ` <span class="tag new">+${b.people - 1}</span>` : ''}</td>
          <td dir="ltr" style="text-align:right"><a href="tel:${esc(b.customerPhone)}">${esc(b.customerPhone)}</a></td>
          <td>${esc(b.serviceName)}${b.atHome ? ' <span class="tag home">في البيت</span>' : ''}${b.discount ? ' <span class="tag offer">خصم العصر</span>' : ''}</td>
          <td style="white-space:nowrap">${money(b.total)}</td>
          <td><span class="status st-${esc(b.status)}">${STATUS[b.status] || esc(b.status)}</span></td>
          <td><div class="row-actions">${rowActions(b)}</div></td>
        </tr>`).join('')}</tbody></table></div>` : '<div class="empty">ما فيه مواعيد في هذا اليوم.</div>'}
    </section>`;
}

function viewStats() {
  const t = today();
  const from = new Date(); from.setDate(from.getDate() - 30);
  const fromIso = isoDate(from);
  const range = S.bookings.filter((b) => b.date >= fromIso && b.date < t);
  const done = range.filter((b) => b.status === 'done');
  const noshow = range.filter((b) => b.status === 'noshow');
  const attended = done.length + noshow.length ? Math.round((done.length / (done.length + noshow.length)) * 100) : 0;
  const byPhone = {};
  done.forEach((b) => { byPhone[b.customerPhone + b.customerName] = (byPhone[b.customerPhone + b.customerName] || 0) + 1; });
  const custs = Object.values(byPhone);
  const returning = custs.length ? Math.round((custs.filter((n) => n > 1).length / custs.length) * 100) : 0;

  const hours = [];
  for (let h = S.shop.open; h < S.shop.close; h++) hours.push({ h, n: done.filter((b) => b.hour === h).length });
  const max = Math.max(1, ...hours.map((x) => x.n));
  const quietSet = new Set(S.shop.quietHours || []);
  const lowest = hours.slice().sort((a, b) => a.n - b.n).slice(0, 2).map((x) => x.h).sort((a, b) => a - b);

  const svc = {};
  done.forEach((b) => { svc[b.serviceName] = (svc[b.serviceName] || 0) + 1; });
  const top = Object.entries(svc).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return `<header class="biz-head"><div><h1>الإحصائيات</h1><span class="meta">آخر 30 يوم</span></div></header>
    <div class="kpis">
      <div class="kpi"><span>مواعيد مكتملة</span><b>${done.length}</b><small>${noshow.length} لم يحضروا</small></div>
      <div class="kpi"><span>الدخل</span><b>${money(done.reduce((n, b) => n + (b.total || 0), 0))}</b><small>من المواعيد المكتملة</small></div>
      <div class="kpi"><span>نسبة الحضور</span><b>${attended}%</b><small>${S.shop.depositOn ? 'العربون مفعّل' : 'جرّب تفعيل العربون'}</small></div>
      <div class="kpi"><span>عملاء رجعوا</span><b>${returning}%</b><small>زاروك أكثر من مرة</small></div>
    </div>
    <div class="panels">
      <section class="panel wide">
        <div class="biz-head"><h2>المواعيد المكتملة حسب الساعة</h2>
          <div class="legend"><span><i></i>عادي</span><span><i class="quiet"></i>ساعات الخصم</span></div></div>
        ${done.length ? `<div class="bars">${hours.map((x) => `<div class="bar"><span>${x.n}</span><i class="${quietSet.has(x.h) && S.shop.quietOn ? 'quiet' : ''}" style="height:${Math.round((x.n / max) * 150) + 4}px"></i></div>`).join('')}</div>
        <div class="bar-labels">${hours.map((x) => `<span>${x.h > 12 ? x.h - 12 : x.h}</span>`).join('')}</div>
        <p class="sub">أهدى وقت عندك: ${lowest.map(hourLabel).join(' و ')}. ${S.shop.quietOn ? 'تقدر تعدّل ساعات الخصم من الإعدادات.' : 'فعّل خصم الساعات الهادئة من الإعدادات عشان تعبّيه.'}</p>`
        : '<div class="empty">تظهر الإحصائيات بعد ما تكتمل أول المواعيد.</div>'}
      </section>
      <section class="panel"><h2>أكثر الخدمات طلبًا</h2>
        ${top.length ? top.map(([name, n]) => { const p = Math.round((n / done.length) * 100); return `<div style="display:flex;flex-direction:column;gap:6px">
          <div class="kv"><b>${esc(name)}</b><span>${p}%</span></div><div class="meter"><i style="width:${p}%"></i></div></div>`; }).join('') : '<div class="empty">ما فيه بيانات للحين.</div>'}
      </section>
    </div>`;
}

function hourOptions(sel, from, to) {
  let o = '';
  for (let h = from; h <= to; h++) o += `<option value="${h}" ${h === Number(sel) ? 'selected' : ''}>${hourLabel(h % 24)}${h === 24 ? ' (منتصف الليل)' : ''}</option>`;
  return o;
}

function viewSettings(isNew) {
  const d = S.draft || (S.draft = JSON.parse(JSON.stringify(S.shop)));
  const quietBtns = [];
  for (let h = Number(d.open); h < Number(d.close); h++) quietBtns.push(`<button type="button" class="${d.quietHours.includes(h) ? 'on' : ''}" data-act="qh" data-v="${h}" aria-pressed="${d.quietHours.includes(h)}">${hourLabel(h)}</button>`);
  return `<header class="biz-head"><div><h1>${isNew ? 'سجّل محلك' : 'إعدادات المحل'}</h1><span class="meta">${isNew ? 'خطوة وحدة وتبدأ تستقبل حجوزات' : 'التغييرات تظهر للعملاء مباشرة'}</span></div>
    ${isNew ? '' : ''}</header>
  <form id="shop-form" class="panels" novalidate>
    <section class="panel wide"><h2>معلومات المحل</h2>
      <div class="grid2">
        <label class="field">اسم المحل<input name="name" required maxlength="40" value="${esc(d.name)}"></label>
        <label class="field">الفئة<select name="cat">${Object.entries(CAT_LABEL).map(([k, v]) => `<option value="${k}" ${d.cat === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field">الحي / المدينة<input name="area" required maxlength="40" value="${esc(d.area)}" placeholder="حي الملقا، الرياض"></label>
        <label class="field">جوال المحل<input name="phone" inputmode="tel" maxlength="10" value="${esc(d.phone)}" placeholder="05XXXXXXXX"></label>
        <label class="field">يفتح الساعة<select name="open">${hourOptions(d.open, 0, 23)}</select></label>
        <label class="field">يقفل الساعة<select name="close">${hourOptions(d.close, 1, 24)}</select></label>
        <label class="field">عدد العملاء بنفس الوقت<input name="capacity" type="number" min="1" max="30" value="${esc(d.capacity)}"><span class="hint">عدد الموظفين أو الكراسي</span></label>
      </div>
    </section>

    <section class="panel wide"><h2>الخدمات والأسعار</h2>
      ${d.services.map((v, i) => `<div class="svc-edit">
        <label class="field svc-name">اسم الخدمة<input name="svc-name-${i}" maxlength="40" value="${esc(v.name)}" placeholder="مثال: قص وتصفيف"></label>
        <label class="field">المدة (دقيقة)<input name="svc-dur-${i}" type="number" min="5" step="5" value="${esc(v.dur)}"></label>
        <label class="field">السعر (ر.س)<input name="svc-price-${i}" type="number" min="0" value="${esc(v.price)}"></label>
        <button type="button" class="icon-btn" style="background:#fff;border:1px solid var(--line);color:var(--danger)" data-act="delsvc" data-v="${i}" aria-label="حذف الخدمة">${ICON.trash(18)}</button>
      </div>`).join('')}
      <button type="button" class="btn ghost small" style="align-self:flex-start" data-act="addsvc">${ICON.plus(16)} إضافة خدمة</button>
    </section>

    <section class="panel"><h2>أدوات زيادة الدخل</h2>
      <label class="toggle-row" style="cursor:pointer"><span class="txt"><b>خصم الساعات الهادئة</b><span>يملأ الأوقات اللي ما عليها طلب</span></span><input type="checkbox" name="quietOn" ${d.quietOn ? 'checked' : ''} style="width:22px;height:22px"></label>
      <label class="field">نسبة الخصم<select name="quietPct">${[10, 15, 20, 25, 30].map((p) => `<option value="${p}" ${Number(d.quietPct) === p ? 'selected' : ''}>${p}%</option>`).join('')}</select></label>
      <div class="field">ساعات الخصم<div class="hours-pick" id="qh">${quietBtns.join('')}</div></div>
      <label class="toggle-row" style="cursor:pointer"><span class="txt"><b>عربون ضد الغياب</b><span>يُخصم من الفاتورة</span></span><input type="checkbox" name="depositOn" ${d.depositOn ? 'checked' : ''} style="width:22px;height:22px"></label>
      <label class="field">مبلغ العربون (ر.س)<input name="depositAmount" type="number" min="0" value="${esc(d.depositAmount)}"></label>
    </section>

    <section class="panel"><h2>خدمات إضافية</h2>
      <label class="toggle-row" style="cursor:pointer"><span class="txt"><b>خدمة منزلية</b><span>تروح للعميل في بيته</span></span><input type="checkbox" name="homeService" ${d.homeService ? 'checked' : ''} style="width:22px;height:22px"></label>
      <label class="field">رسوم الزيارة (ر.س)<input name="homeFee" type="number" min="0" value="${esc(d.homeFee)}"></label>
      <label class="toggle-row" style="cursor:pointer"><span class="txt"><b>المحل ظاهر للعملاء</b><span>أطفه إذا تبي توقف الحجوزات مؤقتًا</span></span><input type="checkbox" name="active" ${d.active !== false ? 'checked' : ''} style="width:22px;height:22px"></label>
      <button class="btn block" ${S.busy ? 'disabled' : ''}>${isNew ? 'سجّل المحل' : 'احفظ التغييرات'}</button>
    </section>
  </form>`;
}

/* ------------------------------ أفعال ------------------------------ */
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
  S.busy = true;
  try {
    S.shop = await store().saveShop(d);
    S.draft = null; S.tab = 'today';
    await loadBookings();
    toast('تم الحفظ');
  } catch (e) { console.error(e); toast('ما قدرنا نحفظ، حاول مرة ثانية'); }
  S.busy = false; render();
}

async function loadBookings() {
  try { S.bookings = S.shop ? await store().shopBookings(S.shop.id) : []; } catch (e) { console.error(e); S.bookings = []; toast('ما قدرنا نجيب الحجوزات'); }
}

const actions = {
  tab: (v) => { S.tab = v; S.draft = null; render(); },
  authmode: () => { S.authMode = S.authMode === 'login' ? 'signup' : 'login'; render(); },
  day: (v) => { const d = parseIso(S.date); d.setDate(d.getDate() + Number(v)); S.date = isoDate(d); render(); },
  status: async (v, el) => {
    const b = S.bookings.find((x) => x.id === v);
    if (!b) return;
    const st = el.dataset.s;
    try { await store().setStatus(b, st); b.status = st; toast('تم التحديث'); }
    catch (e) { console.error(e); toast(e.message === 'FULL' ? 'الموعد ممتلئ، ألغِ موعد ثاني أول' : 'ما قدرنا نحدّث'); }
    render();
  },
  addsvc: () => { readForm(); S.draft.services.push({ id: uid('svc'), name: '', dur: 60, price: 100 }); render(); },
  delsvc: (v) => { readForm(); S.draft.services.splice(Number(v), 1); if (!S.draft.services.length) S.draft.services.push({ id: uid('svc'), name: '', dur: 60, price: 100 }); render(); },
  qh: (v) => { readForm(); const h = Number(v); const q = S.draft.quietHours; const i = q.indexOf(h); if (i >= 0) q.splice(i, 1); else q.push(h); render(); },
  share: async () => {
    const url = new URL('index.html?shop=' + encodeURIComponent(S.shop.id), location.href).href;
    try { await navigator.clipboard.writeText(url); toast('نسخنا رابط الحجز، شاركه مع عملائك'); } catch (e) { prompt('انسخ رابط الحجز:', url); }
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
  if (e.target.id === 'date' && e.target.value) { S.date = e.target.value; render(); }
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
      toast(c.includes('email-already') ? 'البريد مسجل من قبل، سجّل دخول' : c.includes('weak-password') ? 'كلمة المرور ضعيفة' : 'البريد أو كلمة المرور غير صحيحة');
      S.busy = false; render();
    }
  }
});

(async function boot() {
  try {
    await init({ anonymous: false });
    if (mode === 'local') document.getElementById('demo').hidden = false;
    store().onUser(async (u) => {
      S.user = u; S.busy = false; S.draft = null;
      S.shop = u ? await store().myShop() : null;
      await loadBookings();
      render();
    });
  } catch (e) {
    console.error(e);
    $app.innerHTML = '<div class="loading">ما قدرنا نتصل بالخادم. تأكد من الإنترنت وحدّث الصفحة.</div>';
  }
})();
