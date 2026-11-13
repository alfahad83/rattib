// تطبيق العميل: تصفح المحلات، الحجز، قائمة الانتظار، حجوزاتي والنقاط
import { init, store, mode } from './store.js';
import { CATS, CAT_LABEL, COLORS, esc, money, hourLabel, nextDays, fullDate, today, daysBetween, toast, ICON } from './common.js';

const $app = document.getElementById('app');
const days = nextDays(7);
const REMINDER_DAYS = 21;

const S = {
  screen: 'home', cat: 'all', q: '',
  shops: [], shop: null, svcId: null, dayIdx: 0, hour: null, people: 1, atHome: false, taken: {},
  bookings: [], last: null, busy: false
};

const color = (s) => COLORS[(s.color ?? 0) % COLORS.length];
const minPrice = (s) => Math.min(...s.services.map((v) => Number(v.price) || 0));
const initial = (s) => (s.name || '؟').trim().charAt(0);
const isQuiet = (shop, h) => !!shop.quietOn && (shop.quietHours || []).includes(h);
const profile = () => { try { return JSON.parse(localStorage.getItem('rattib-profile')) || null; } catch (e) { return null; } };

/* ------------------------------ عرض ------------------------------ */
function render() {
  const v = { home: viewHome, offers: viewOffers, bookings: viewBookings, shop: viewShop, done: viewDone }[S.screen] || viewHome;
  $app.innerHTML = v() + (['home', 'offers', 'bookings'].includes(S.screen) ? nav() : '');
  window.scrollTo(0, 0);
}

function nav() {
  const b = (id, icon, label) => `<button class="${S.screen === id ? 'on' : ''}" data-act="go" data-v="${id}" ${S.screen === id ? 'aria-current="page"' : ''}>${icon}<span>${label}</span></button>`;
  return `<nav class="nav" aria-label="التنقل الرئيسي">${b('home', ICON.home(22), 'الرئيسية')}${b('offers', ICON.tag(22), 'العروض')}${b('bookings', ICON.cal(22), 'حجوزاتي')}</nav>`;
}

function filteredShops() {
  const q = S.q.trim();
  return S.shops.filter((s) => {
    const catOk = S.cat === 'all' || (S.cat === 'home' ? s.homeService : s.cat === S.cat);
    const hay = [s.name, s.area, CAT_LABEL[s.cat], ...s.services.map((v) => v.name)].join(' ');
    return catOk && (!q || hay.includes(q));
  });
}

function shopCard(s) {
  const c = color(s);
  return `<button class="shop-card" data-act="open" data-v="${esc(s.id)}">
    <div class="avatar" style="background:${c.tint};color:${c.ink}">${esc(initial(s))}</div>
    <div class="body">
      <span class="name">${esc(s.name)}</span>
      <span class="meta">${esc(CAT_LABEL[s.cat] || '')} · ${esc(s.area)}</span>
      <div class="tags">
        <span class="from">يبدأ من ${money(minPrice(s))}</span>
        ${s.quietOn ? `<span class="tag offer">خصم العصر ${esc(s.quietPct)}%</span>` : ''}
        ${s.homeService ? '<span class="tag home">يجيك البيت</span>' : ''}
      </div>
    </div>
  </button>`;
}

function listHtml() {
  const list = filteredShops();
  if (!S.shops.length) return `<div class="empty">ما فيه محلات مسجلة للحين. أصحاب المحلات يقدرون يسجلون من <a href="business.html">لوحة المحل</a>.</div>`;
  if (!list.length) return '<div class="empty">ما لقينا شي يطابق بحثك. جرّب كلمة ثانية أو فئة ثانية.</div>';
  return list.map(shopCard).join('');
}

function viewHome() {
  const pts = points();
  const anyQuiet = S.shops.some((s) => s.quietOn);
  return `<main class="screen">
    <div class="hello">
      <div><small>هلا وغلا</small><h1>وش تبي ترتّب اليوم؟</h1></div>
      <button class="pill-btn" data-act="go" data-v="bookings">${ICON.star(16)}<span>${pts} نقطة</span></button>
    </div>
    <label class="search">${ICON.search(18)}
      <input id="q" type="search" value="${esc(S.q)}" placeholder="ابحث عن محل أو خدمة أو حي" aria-label="ابحث عن محل أو خدمة أو حي">
    </label>
    <div class="chips" role="group" aria-label="الفئات">
      ${CATS.map((c) => `<button class="chip ${S.cat === c.id ? 'on' : ''}" data-act="cat" data-v="${c.id}" aria-pressed="${S.cat === c.id}">${c.label}</button>`).join('')}
    </div>
    ${anyQuiet ? `<button class="promo" data-act="go" data-v="offers">
      <div style="flex:1"><span class="k">عروض الساعات الهادئة</span><span class="t">خصومات على مواعيد العصر</span><span class="s">محلات تنزّل أسعار الأوقات الهادئة</span></div>
      ${ICON.tag(40)}</button>` : ''}
    <div class="row-head"><h2>المحلات</h2><span id="count">${filteredShops().length} محل</span></div>
    <div class="list" id="list">${listHtml()}</div>
  </main>`;
}

function viewOffers() {
  const offers = S.shops.filter((s) => s.quietOn);
  return `<main class="screen">
    <div><h1 class="title">العروض</h1><p class="sub">المحلات تنزّل أسعار الأوقات الهادئة، وأنت توفّر.</p></div>
    ${offers.length ? offers.map((s) => {
      const c = color(s); const p = minPrice(s); const hrs = (s.quietHours || []).slice().sort((a, b) => a - b);
      return `<div class="card" style="border-color:#F5C98B">
        <div style="display:flex;gap:12px;align-items:center">
          <div class="avatar sm" style="background:${c.tint};color:${c.ink}">${esc(initial(s))}</div>
          <div style="flex:1"><b style="font-size:16px">${esc(s.name)}</b><div class="meta">${esc(CAT_LABEL[s.cat] || '')} · ${esc(s.area)}</div></div>
          <span class="tag offer" style="font-size:13px;padding:4px 10px">-${esc(s.quietPct)}%</span>
        </div>
        <div class="meta" style="display:flex;align-items:center;gap:6px">${ICON.clock(16)}<span>${hrs.map(hourLabel).join('، ')}</span></div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <span><b>من ${money(p * (1 - s.quietPct / 100))}</b> <s class="meta">${money(p)}</s></span>
          <button class="btn small" data-act="open" data-v="${esc(s.id)}">احجز العرض</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty">ما فيه عروض حاليًا.</div>'}
  </main>`;
}

function points() {
  return S.bookings.filter((b) => b.status === 'confirmed' || b.status === 'done').reduce((n, b) => n + Math.floor((b.total || 0) / 10), 0);
}

const STATUS = { confirmed: 'مؤكد', wait: 'قائمة الانتظار', done: 'مكتمل', cancelled: 'ملغي', noshow: 'لم يحضر' };

function reminder() {
  const t = today();
  const past = S.bookings.filter((b) => (b.status === 'done' || b.status === 'confirmed') && b.date < t).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!past) return null;
  const ago = daysBetween(past.date, t);
  if (ago < REMINDER_DAYS || localStorage.getItem('rattib-dismiss-' + past.id)) return null;
  const hasUpcoming = S.bookings.some((b) => b.shopId === past.shopId && b.date >= t && b.status === 'confirmed');
  return hasUpcoming ? null : { b: past, weeks: Math.floor(ago / 7) };
}

function viewBookings() {
  const t = today();
  const r = reminder();
  const list = S.bookings.slice().sort((a, b) => {
    const ua = a.date >= t && (a.status === 'confirmed' || a.status === 'wait');
    const ub = b.date >= t && (b.status === 'confirmed' || b.status === 'wait');
    if (ua !== ub) return ua ? -1 : 1;
    return ua ? (a.date + a.hour).localeCompare(b.date + b.hour) : b.date.localeCompare(a.date);
  });
  return `<main class="screen">
    <h1 class="title">حجوزاتي</h1>
    <div class="points"><small>رصيد نقاطك</small><b>${points()} نقطة</b><small>كل 10 ر.س تصرفها = نقطة، وتنفعك في أي محل داخل رتّب.</small></div>
    ${r ? `<div class="card">
      <div style="display:flex;gap:10px;align-items:flex-start">
        <div class="avatar sm" style="width:40px;height:40px;background:#EEF2FF;color:#3730A3">${ICON.bell(20)}</div>
        <div><b style="font-size:15px">صار لك ${r.weeks} أسابيع من آخر موعد</b><div class="meta">نفس المحل ونفس الخدمة؟ ${esc(r.b.shopName)} · ${esc(r.b.serviceName)}</div></div>
      </div>
      <div class="actions"><button class="btn dark" data-act="rebook" data-v="${esc(r.b.id)}">احجز الحين</button><button class="btn ghost" style="flex:0 0 auto" data-act="dismiss" data-v="${esc(r.b.id)}">لاحقًا</button></div>
    </div>` : ''}
    <div class="row-head"><h2>مواعيدك</h2></div>
    <div class="list">
      ${list.length ? list.map((b) => {
        const canCancel = b.date >= t && (b.status === 'confirmed' || b.status === 'wait');
        return `<div class="card" style="gap:8px">
          <div class="bk-head"><b>${esc(b.shopName)}</b><span class="status st-${esc(b.status)}">${STATUS[b.status] || esc(b.status)}</span></div>
          <span>${esc(b.serviceName)}${b.people > 1 ? ` × ${b.people}` : ''}${b.atHome ? ' · في البيت' : ''}</span>
          <div class="bk-head"><span class="meta">${fullDate(b.date)} · ${hourLabel(b.hour)}</span>
          ${canCancel ? `<button class="btn small danger-text" data-act="cancel" data-v="${esc(b.id)}">إلغاء</button>` : ''}</div>
        </div>`;
      }).join('') : '<div class="empty">ما عندك حجوزات للحين.</div>'}
    </div>
  </main>`;
}

function calc() {
  const shop = S.shop;
  const svc = shop.services.find((v) => v.id === S.svcId) || null;
  const hasHour = S.hour !== null;
  const full = hasHour && (S.taken[S.hour] || 0) + S.people > shop.capacity;
  const quiet = hasHour && isQuiet(shop, S.hour);
  const base = svc ? Number(svc.price) * S.people : 0;
  const discount = quiet ? Math.round(base * (shop.quietPct / 100)) : 0;
  const homeFee = S.atHome && shop.homeService ? Number(shop.homeFee) || 0 : 0;
  const total = base - discount + homeFee;
  const deposit = shop.depositOn ? Number(shop.depositAmount) || 0 : 0;
  return { svc, hasHour, full, quiet, base, discount, homeFee, total, deposit, ready: !!svc && hasHour && !full };
}

function viewShop() {
  const shop = S.shop; const c = color(shop); const k = calc();
  const day = days[S.dayIdx];
  const nowH = new Date().getHours();
  const hours = [];
  for (let h = shop.open; h < shop.close; h++) if (!(S.dayIdx === 0 && h <= nowH)) hours.push(h);
  const svcName = k.svc ? `${k.svc.name}${S.people > 1 ? ` × ${S.people} أشخاص` : ''}${S.atHome ? ' · في البيت' : ''}` : 'اختر الخدمة';
  return `<header class="topbar"><button class="icon-btn" data-act="go" data-v="home" aria-label="رجوع">${ICON.back(20)}</button><b>${esc(shop.name)}</b></header>
  <main class="screen shop-screen">
    <div class="shop-head">
      <div class="avatar lg" style="background:${c.tint};color:${c.ink}">${esc(initial(shop))}</div>
      <div><h1>${esc(shop.name)}</h1>
        <div class="meta">${ICON.pin(14)}<span>${esc(CAT_LABEL[shop.cat] || '')} · ${esc(shop.area)}</span></div>
        <div class="meta">${ICON.clock(14)}<span>${hourLabel(shop.open)} – ${hourLabel(shop.close)}</span></div>
      </div>
    </div>

    <section class="section"><h2>اختر الخدمة</h2>
      ${shop.services.map((v) => `<button class="svc ${S.svcId === v.id ? 'on' : ''}" data-act="svc" data-v="${esc(v.id)}" aria-pressed="${S.svcId === v.id}">
        <div><span class="n">${esc(v.name)}</span><span class="d">${esc(v.dur)} دقيقة</span></div>
        <span class="p">${money(v.price)}</span><span class="radio">${S.svcId === v.id ? ICON.check(14) : ''}</span>
      </button>`).join('')}
    </section>

    ${shop.homeService ? `<button class="toggle-row" data-act="home" aria-pressed="${S.atHome}">
      <span style="color:var(--accent)">${ICON.home(22)}</span>
      <span class="txt"><b>الخدمة في بيتك</b><span>رسوم الزيارة ${money(shop.homeFee)}</span></span><span class="switch"></span>
    </button>` : ''}

    <section class="section"><h2>${ICON.users(20)} حجز جماعي</h2>
      <div class="stepper-row"><span>للعرسان والصديقات: أكثر من شخص بنفس الموعد</span>
        <div class="stepper"><button data-act="inc" aria-label="زيادة شخص">+</button><b aria-live="polite">${S.people}</b><button data-act="dec" aria-label="إنقاص شخص">−</button></div>
      </div>
    </section>

    <section class="section"><h2>اليوم</h2>
      <div class="days">${days.map((d, i) => `<button class="day ${i === S.dayIdx ? 'on' : ''}" data-act="day" data-v="${i}" aria-pressed="${i === S.dayIdx}"><b>${d.label}</b><small>${d.short}</small></button>`).join('')}</div>
    </section>

    <section class="section"><h2>الوقت</h2>
      ${hours.length ? `<div class="slots">${hours.map((h) => {
        const full = (S.taken[h] || 0) + S.people > shop.capacity;
        const quiet = isQuiet(shop, h);
        const sub = full ? 'محجوز' : quiet ? `خصم ${shop.quietPct}%` : '';
        return `<button class="slot ${full ? 'full' : ''} ${quiet ? 'quiet' : ''} ${S.hour === h ? 'on' : ''}" data-act="hour" data-v="${h}" aria-pressed="${S.hour === h}"><b>${hourLabel(h)}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
      }).join('')}</div>` : '<div class="empty">ما بقى مواعيد اليوم. جرّب يوم ثاني.</div>'}
      ${k.full ? '<div class="note">هذا الموعد محجوز. انضم لقائمة الانتظار، وإذا فضى المحل يأكد لك الموعد.</div>' : ''}
    </section>
  </main>
  <div class="checkout">
    <div class="sum">
      <div><b>${esc(svcName)}</b><span>${k.hasHour ? `${fullDate(day.iso)} · ${hourLabel(S.hour)}` : 'اختر اليوم والوقت'}</span></div>
      <div class="total"><b>${k.svc ? money(k.total) : '—'}</b>${k.discount ? `<em>وفّرت ${money(k.discount)}</em>` : ''}</div>
    </div>
    ${k.full
      ? `<button class="btn warn block" data-act="wait" ${k.svc && !S.busy ? '' : 'disabled'}>انضم لقائمة الانتظار</button>`
      : `<button class="btn block" data-act="confirm" ${k.ready && !S.busy ? '' : 'disabled'}>أكّد الحجز</button>`}
    ${k.deposit ? `<span class="fine">عربون ${money(k.deposit)} يُخصم من الفاتورة ويحمي موعدك من الغياب (الدفع يُضاف لاحقًا)</span>` : ''}
  </div>`;
}

function viewDone() {
  const b = S.last; const wait = b.status === 'wait';
  return `<main class="screen done">
    <div class="done-badge ${wait ? 'wait' : ''}">${wait ? ICON.clock(40) : ICON.check(42)}</div>
    <div><h1 class="title">${wait ? 'أنت في قائمة الانتظار' : 'تم الحجز'}</h1>
    <p class="sub">${wait ? 'إذا فضى الموعد يأكده لك المحل، وتشوف الحالة في حجوزاتي.' : 'موعدك مؤكد، وتلقاه في حجوزاتي.'}</p></div>
    <div class="card" style="width:100%;text-align:right">
      <div class="kv"><span>المحل</span><b>${esc(b.shopName)}</b></div>
      <div class="kv"><span>الخدمة</span><b>${esc(b.serviceName)}${b.people > 1 ? ` × ${b.people}` : ''}</b></div>
      <div class="kv"><span>الموعد</span><b>${fullDate(b.date)} · ${hourLabel(b.hour)}</b></div>
      <div class="kv"><span>الإجمالي</span><b>${money(b.total)}</b></div>
    </div>
    ${wait ? '' : `<div class="earned">${ICON.star(20)}<span>كسبت ${Math.floor(b.total / 10)} نقطة من هذا الحجز</span></div>`}
    <div style="width:100%;display:flex;flex-direction:column;gap:8px">
      <button class="btn block" data-act="go" data-v="bookings">عرض حجوزاتي</button>
      <button class="btn ghost block" data-act="go" data-v="home">الرئيسية</button>
    </div>
  </main>`;
}

/* ------------------------------ أفعال ------------------------------ */
async function loadTaken() {
  try { S.taken = await store().takenCounts(S.shop.id, days[S.dayIdx].iso); } catch (e) { console.error(e); S.taken = {}; }
}

async function openShop(id, svcId = null) {
  const shop = S.shops.find((s) => s.id === id) || await store().getShop(id);
  if (!shop) return toast('المحل غير متاح');
  Object.assign(S, { screen: 'shop', shop, svcId, dayIdx: 0, hour: null, people: 1, atHome: false, taken: {} });
  render();
  await loadTaken(); render();
}

function askProfile() {
  const dlg = document.getElementById('profile');
  const form = document.getElementById('profile-form');
  const p = profile() || {};
  form.name.value = p.name || ''; form.phone.value = p.phone || '';
  return new Promise((res) => {
    dlg.addEventListener('close', () => {
      if (dlg.returnValue !== 'ok') return res(null);
      const np = { name: form.name.value.trim(), phone: form.phone.value.trim() };
      localStorage.setItem('rattib-profile', JSON.stringify(np));
      res(np);
    }, { once: true });
    dlg.showModal();
  });
}

async function book(status) {
  const k = calc();
  if (!k.svc || !k.hasHour) return;
  const p = profile() || await askProfile();
  if (!p) return;
  const shop = S.shop;
  S.busy = true; render();
  try {
    const rec = await store().createBooking({
      shopId: shop.id, shopName: shop.name, customerName: p.name, customerPhone: p.phone,
      serviceId: k.svc.id, serviceName: k.svc.name, price: Number(k.svc.price), people: S.people, atHome: S.atHome,
      date: days[S.dayIdx].iso, hour: S.hour, discount: k.discount, homeFee: k.homeFee, total: k.total, deposit: k.deposit, status
    });
    S.bookings.push(rec); S.last = rec; S.screen = 'done';
  } catch (e) {
    console.error(e);
    if (e.message === 'FULL') { toast('سبقك أحد على هذا الموعد، اختر وقت ثاني'); await loadTaken(); S.hour = null; }
    else toast('ما قدرنا نحفظ الحجز، حاول مرة ثانية');
  }
  S.busy = false; render();
}

const actions = {
  go: (v) => { S.screen = v; render(); },
  cat: (v) => { S.cat = v; render(); },
  open: (v) => openShop(v),
  svc: (v) => { S.svcId = v; render(); },
  home: () => { S.atHome = !S.atHome; render(); },
  inc: () => { S.people = Math.min(6, S.people + 1); render(); },
  dec: () => { S.people = Math.max(1, S.people - 1); render(); },
  day: async (v) => { S.dayIdx = Number(v); S.hour = null; render(); await loadTaken(); render(); },
  hour: (v) => { S.hour = Number(v); render(); },
  confirm: () => book('confirmed'),
  wait: () => book('wait'),
  cancel: async (v) => {
    const b = S.bookings.find((x) => x.id === v);
    if (!b || !confirm('متأكد تبي تلغي الموعد؟')) return;
    try { await store().setStatus(b, 'cancelled'); b.status = 'cancelled'; toast('تم إلغاء الموعد'); } catch (e) { console.error(e); toast('ما قدرنا نلغي، حاول مرة ثانية'); }
    render();
  },
  rebook: (v) => { const b = S.bookings.find((x) => x.id === v); if (b) openShop(b.shopId, b.serviceId); },
  dismiss: (v) => { localStorage.setItem('rattib-dismiss-' + v, '1'); render(); }
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el.dataset.v);
});

document.addEventListener('input', (e) => {
  if (e.target.id !== 'q') return;
  S.q = e.target.value;
  document.getElementById('list').innerHTML = listHtml();
  document.getElementById('count').textContent = `${filteredShops().length} محل`;
});

(async function boot() {
  try {
    await init({ anonymous: true });
    if (mode === 'local') document.getElementById('demo').hidden = false;
    [S.shops, S.bookings] = await Promise.all([store().listShops(), store().myBookings()]);
    const shopParam = new URLSearchParams(location.search).get('shop');
    render();
    if (shopParam) openShop(shopParam);
  } catch (e) {
    console.error(e);
    $app.innerHTML = '<div class="loading">ما قدرنا نتصل بالخادم. تأكد من الإنترنت وحدّث الصفحة.</div>';
  }
})();
