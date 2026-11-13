// رتّب — صفحة العملاء (ويب + تطبيق)
import { init, store, mode } from './store.js';
import { CATS, CAT_LABEL, esc, money, hourLabel, nextDays, fullDate, today, daysBetween, toast, ICON, catIcon, shopArt, CAT_THEME } from './common.js';
import { transition, tween, replay } from './motion.js';

const $app = document.getElementById('app');
const days = nextDays(7);
const REMINDER_DAYS = 21;
const CAT_ICON_KEY = { all: 'all', salon: 'salon', barber: 'barber', spa: 'spa', trainer: 'trainer', home: 'homesvc' };

const S = {
  screen: 'home', cat: 'all', q: '',
  shops: [], shop: null, svcId: null, dayIdx: 0, hour: null, people: 1, atHome: false, taken: {},
  bookings: [], last: null, busy: false, nearest: [], intro: true, lastTotal: 0, bumpPeople: false, vtShop: null
};
const ORDER = { home: 0, offers: 1, bookings: 2, shop: 3, done: 4 };
let lastScreen = null;

const minPrice = (s) => Math.min(...s.services.map((v) => Number(v.price) || 0));
const isQuiet = (shop, h) => !!shop.quietOn && (shop.quietHours || []).includes(h);
const profile = () => { try { return JSON.parse(localStorage.getItem('rattib-profile')) || null; } catch (e) { return null; } };
const STATUS = { confirmed: 'مؤكد', wait: 'قائمة الانتظار', done: 'مكتمل', cancelled: 'ملغي', noshow: 'لم يحضر' };

/* =============================== العرض =============================== */
function render() {
  const view = { home: viewHome, offers: viewOffers, bookings: viewBookings, shop: viewShop, done: viewDone }[S.screen] || viewHome;
  const changed = S.screen !== lastScreen;
  const prev = lastScreen;
  lastScreen = S.screen;
  const paint = () => {
    $app.innerHTML = header() + view() + (S.screen === 'shop' ? '' : footer()) + tabbar();
    if (changed) window.scrollTo(0, 0);
    afterPaint();
  };
  if (changed && prev !== null) transition(paint, ORDER[S.screen] >= ORDER[prev] ? 'forward' : 'back');
  else paint();
}

function afterPaint() {
  if (S.screen === 'home' && S.intro) setTimeout(() => { S.intro = false; }, 1600);
  if (S.screen === 'shop') {
    const k = calc();
    const el = document.getElementById('total');
    if (el && k.svc) { tween(el, S.lastTotal || k.total, k.total, money); S.lastTotal = k.total; }
    if (!k.svc) S.lastTotal = 0;
    if (S.bumpPeople) { replay(document.getElementById('people'), 'bump'); S.bumpPeople = false; }
  }
}

function header() {
  const tab = ['home', 'offers', 'bookings'].includes(S.screen) ? S.screen : '';
  const b = (id, label) => `<button class="hnav-btn ${tab === id ? 'on' : ''}" data-act="go" data-v="${id}" ${tab === id ? 'aria-current="page"' : ''}>${label}</button>`;
  return `<header class="hdr" style="view-transition-name:hdr">
    <div class="wrap hdr-in">
      <button class="logo-btn" data-act="go" data-v="home" aria-label="رتّب، الرئيسية"><span class="logo-mark">${ICON.cal(22)}</span><span class="logo-word">رتّب</span></button>
      <nav class="hnav" aria-label="الأقسام">${b('home', 'الرئيسية')}${b('offers', 'العروض')}${b('bookings', 'حجوزاتي')}</nav>
      <a class="hdr-biz" href="business.html">${ICON.chart(18)}<span>لأصحاب المحلات</span></a>
      <button class="hdr-points" data-act="go" data-v="bookings" aria-label="نقاطك: ${points()}">${ICON.star(18)}<span>${points()}</span></button>
    </div>
  </header>`;
}

function tabbar() {
  if (!['home', 'offers', 'bookings'].includes(S.screen)) return '';
  const b = (id, icon, label) => `<button class="${S.screen === id ? 'on' : ''}" data-act="go" data-v="${id}" ${S.screen === id ? 'aria-current="page"' : ''}>${icon}<span>${label}</span></button>`;
  return `<nav class="tabbar" style="view-transition-name:tabbar" aria-label="التنقل">${b('home', ICON.home(23), 'الرئيسية')}${b('offers', ICON.tag(23), 'العروض')}${b('bookings', ICON.cal(23), 'حجوزاتي')}</nav>`;
}

function footer() {
  return `<footer class="ftr"><div class="wrap ftr-in">
    <div class="ftr-brand"><span class="logo-mark sm">${ICON.cal(18)}</span><b>رتّب</b><span>مواعيد الصالونات والسبا والحلاقين والمدربين.</span></div>
    <div class="ftr-links"><button data-act="go" data-v="offers">العروض</button><button data-act="go" data-v="bookings">حجوزاتي</button><a href="business.html">سجّل محلك</a></div>
    <small>فكرة وتطوير: فهد العنزي</small>
  </div></footer>`;
}

/* ------------------------------ الرئيسية ------------------------------ */
function filteredShops() {
  const q = S.q.trim();
  return S.shops.filter((s) => {
    const catOk = S.cat === 'all' || (S.cat === 'home' ? s.homeService : s.cat === S.cat);
    const hay = [s.name, s.area, CAT_LABEL[s.cat], ...s.services.map((v) => v.name)].join(' ');
    return catOk && (!q || hay.includes(q));
  });
}

function shopCard(s) {
  return `<button class="shop" data-act="open" data-v="${esc(s.id)}">
    <div class="shop-cover" style="${S.vtShop === s.id ? 'view-transition-name:shop-cover' : ''}">${shopArt(s)}
      ${s.quietOn ? `<span class="badge">${ICON.bolt(14)} خصم ${esc(s.quietPct)}% وقت الهدوء</span>` : ''}
    </div>
    <div class="shop-info">
      <h3>${esc(s.name)}</h3>
      <p class="where">${ICON.pin(15)}<span>${esc(CAT_LABEL[s.cat] || '')} في ${esc(s.area)}</span></p>
      <div class="shop-foot">
        <span class="shop-price">يبدأ من <b>${money(minPrice(s))}</b></span>
        ${s.homeService ? `<span class="pill">${ICON.homesvc(14)} يجيك البيت</span>` : ''}
      </div>
    </div>
  </button>`;
}

function listHtml() {
  const list = filteredShops();
  if (!S.shops.length) return `<div class="empty">ما فيه محلات مسجلة للحين. أصحاب المحلات يقدرون يسجلون من <a href="business.html">لوحة المحل</a>.</div>`;
  if (!list.length) return '<div class="empty">ما لقينا محل يطابق بحثك. جرّب اسم خدمة أو حي ثاني، أو اختر "الكل".</div>';
  return list.map(shopCard).join('');
}

function board() {
  const nowTxt = new Date().toLocaleTimeString('ar-SA-u-nu-latn', { hour: 'numeric', minute: '2-digit' });
  const anyToday = S.nearest.some((n) => n.di === 0);
  return `<aside class="board" aria-labelledby="board-h">
    <div class="board-head">
      <h2 id="board-h">${anyToday ? 'فاضي اليوم' : 'فاضي بكرة'}</h2>
      <span class="board-now"><i></i>الحين ${esc(nowTxt)}</span>
    </div>
    ${S.nearest.length ? `<ol class="board-rows">${S.nearest.slice(0, 5).map((n, i) => {
      const p = minPrice(n.shop);
      return `<li style="--i:${i}"><button class="board-row" data-act="slotopen" data-v="${esc(n.shop.id)}|${n.di}|${n.h}">
        <span class="br-time"><b>${hourLabel(n.h)}</b><small>${days[n.di].label}</small></span>
        <span class="br-shop"><b>${esc(n.shop.name)}</b><small>${esc(CAT_LABEL[n.shop.cat] || '')}${n.quiet ? `، خصم ${esc(n.shop.quietPct)}%` : ''}</small></span>
        <span class="br-price">${money(n.quiet ? p * (1 - n.shop.quietPct / 100) : p)}</span>
        <span class="br-go">احجز</span>
      </button></li>`;
    }).join('')}</ol>` : '<p class="board-empty">ما فيه مواعيد فاضية قريبة. تصفح المحلات واختر يوم ثاني.</p>'}
  </aside>`;
}

async function computeNearest() {
  const nowH = new Date().getHours();
  const out = [];
  for (const di of [0, 1]) {
    const iso = days[di].iso;
    await Promise.all(S.shops.map(async (s) => {
      let taken = {};
      try { taken = await store().takenCounts(s.id, iso); } catch (e) { /* نتجاهل المحل */ }
      for (let h = s.open; h < s.close; h++) {
        if (di === 0 && h <= nowH) continue;
        if ((taken[h] || 0) + 1 <= s.capacity) { out.push({ shop: s, di, h, quiet: isQuiet(s, h) }); break; }
      }
    }));
    if (out.length >= 3) break;
  }
  return out.sort((a, b) => a.di - b.di || a.h - b.h).slice(0, 8);
}

function catCount(id) {
  if (id === 'all') return S.shops.length;
  if (id === 'home') return S.shops.filter((s) => s.homeService).length;
  return S.shops.filter((s) => s.cat === id).length;
}

function viewHome() {
  const offers = S.shops.filter((s) => s.quietOn);
  return `<main class="${S.intro ? 'enter' : ''}">
    <section class="hero">
      <div class="wrap hero-in">
        <div class="hero-copy">
          <h1>مواعيدك،<br>مرتّبة.</h1>
          <p class="hero-lead">صالونات وحلاقين وسبا ومدربين. شوف الأوقات الفاضية واحجز بلمسة، بدون اتصال ولا انتظار.</p>
          <label class="hero-search">${ICON.search(22)}
            <input id="q" type="search" value="${esc(S.q)}" placeholder="وش تبي؟ قص، مساج، حلاقة ذقن…" aria-label="ابحث عن خدمة أو محل أو حي">
          </label>
        </div>
        ${board()}
      </div>
    </section>

    <section class="wrap sect" aria-label="الفئات">
      <div class="cats" role="group" aria-label="الفئات">
        ${CATS.map((c) => {
          const t = CAT_THEME[c.id] || { bg: '#E3ECE9', fg: '#123B33' };
          return `<button class="cat ${S.cat === c.id ? 'on' : ''}" data-act="cat" data-v="${c.id}" aria-pressed="${S.cat === c.id}" style="--c-bg:${t.bg};--c-fg:${t.fg}">
            <span class="cat-ic">${catIcon(CAT_ICON_KEY[c.id], 30)}</span><b>${c.label}</b><small>${catCount(c.id)} محل</small>
          </button>`;
        }).join('')}
      </div>
    </section>

    ${offers.length ? `<section class="wrap sect">
      <button class="offer-band" data-act="go" data-v="offers">
        <span class="ob-ic">${ICON.bolt(28)}</span>
        <span class="ob-txt"><b>عروض الساعات الهادئة</b><span>${offers.length} محلات تنزّل أسعار الأوقات اللي ما عليها زحمة</span></span>
        <span class="ob-go">شوف العروض</span>
      </button>
    </section>` : ''}

    <section class="wrap sect" id="shops" aria-labelledby="shops-h">
      <div class="block-head"><h2 id="shops-h">${S.cat === 'all' ? 'كل المحلات' : esc((CATS.find((c) => c.id === S.cat) || {}).label || '')}</h2><span id="count">${filteredShops().length} محل</span></div>
      <div class="shops" id="list">${listHtml()}</div>
    </section>

    <section class="wrap sect how" aria-labelledby="how-h">
      <h2 id="how-h">تحجز بثلاث خطوات</h2>
      <ol class="steps">
        <li><span class="step-ic">${ICON.search(26)}</span><b>اختر المحل والخدمة</b><p>قارن الأسعار والمواعيد الفاضية في مكان واحد.</p></li>
        <li><span class="step-ic">${ICON.clock(26)}</span><b>اختر الوقت</b><p>الأوقات المحجوزة واضحة، والساعات الهادئة عليها خصم.</p></li>
        <li><span class="step-ic">${ICON.shield(26)}</span><b>أكّد الحجز</b><p>يوصل المحل اسمك وجوالك، وتكسب نقاط تنفعك بعدين.</p></li>
      </ol>
    </section>

    <section class="wrap sect">
      <div class="biz-cta">
        <div><h2>عندك صالون أو محل حلاقة أو سبا؟</h2><p>سجّل محلك مجانًا، واستقبل الحجوزات، وتابع الحضور والدخل من لوحة وحدة.</p></div>
        <a class="btn gold" href="business.html">سجّل محلك</a>
      </div>
    </section>
  </main>`;
}

/* ------------------------------ العروض ------------------------------ */
function viewOffers() {
  const offers = S.shops.filter((s) => s.quietOn);
  return `<main class="wrap page">
    <div class="page-head"><h1>العروض</h1><p>محلات تنزّل أسعار الساعات الهادئة. احجز في هذي الأوقات ووفّر.</p></div>
    ${offers.length ? `<div class="offers">${offers.map((s) => {
      const p = minPrice(s); const hrs = (s.quietHours || []).slice().sort((a, b) => a - b);
      return `<article class="offer">
        <div class="offer-cover">${shopArt(s)}<span class="offer-pct">خصم ${esc(s.quietPct)}%</span></div>
        <div class="offer-body">
          <h3>${esc(s.name)}</h3>
          <p class="where">${ICON.pin(15)}<span>${esc(CAT_LABEL[s.cat] || '')} في ${esc(s.area)}</span></p>
          <p class="where">${ICON.clock(15)}<span>${hrs.map(hourLabel).join('، ')}</span></p>
          <div class="offer-foot"><span><b>${money(p * (1 - s.quietPct / 100))}</b> <s>${money(p)}</s></span>
          <button class="btn sm" data-act="open" data-v="${esc(s.id)}">احجز العرض</button></div>
        </div>
      </article>`;
    }).join('')}</div>` : '<div class="empty">ما فيه عروض الحين. ارجع بعدين.</div>'}
  </main>`;
}

/* ------------------------------ حجوزاتي ------------------------------ */
function points() {
  return S.bookings.filter((b) => b.status === 'confirmed' || b.status === 'done').reduce((n, b) => n + Math.floor((b.total || 0) / 10), 0);
}

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
  const upcoming = (b) => b.date >= t && (b.status === 'confirmed' || b.status === 'wait');
  const list = S.bookings.slice().sort((a, b) => {
    if (upcoming(a) !== upcoming(b)) return upcoming(a) ? -1 : 1;
    return upcoming(a) ? (a.date + a.hour).localeCompare(b.date + b.hour) : b.date.localeCompare(a.date);
  });
  const pts = points();
  return `<main class="wrap page">
    <div class="page-head"><h1>حجوزاتي</h1><p>مواعيدك القادمة والسابقة، ونقاطك.</p></div>
    <div class="bk-layout">
      <aside class="bk-side">
        <div class="points-card">
          <span class="pc-ic">${ICON.gift(26)}</span>
          <small>رصيد نقاطك</small><b>${pts}</b>
          <div class="pc-meter"><i style="width:${pts % 100}%"></i></div>
          <small>كل 10 ر.س = نقطة. باقي ${100 - (pts % 100)} نقطة على المكافأة الجاية.</small>
        </div>
        ${r ? `<div class="remind">
          <span class="rm-ic">${ICON.bell(22)}</span>
          <div><b>صار لك ${r.weeks} أسابيع من آخر موعد</b><p>${esc(r.b.shopName)}، ${esc(r.b.serviceName)}. تحجز نفسه؟</p></div>
          <div class="rm-actions"><button class="btn sm" data-act="rebook" data-v="${esc(r.b.id)}">احجز نفس الموعد</button><button class="btn sm ghost" data-act="dismiss" data-v="${esc(r.b.id)}">لاحقًا</button></div>
        </div>` : ''}
      </aside>
      <section class="bk-list" aria-label="المواعيد">
        ${list.length ? list.map((b) => {
          const d = new Date(b.date + 'T00:00');
          const can = upcoming(b);
          return `<article class="bk ${can ? '' : 'past'}">
            <div class="bk-date"><b>${d.getDate()}</b><small>${fullDate(b.date).split(' ')[0]}</small></div>
            <div class="bk-main"><h3>${esc(b.shopName)}</h3><p>${esc(b.serviceName)}${b.people > 1 ? ` × ${b.people}` : ''}${b.atHome ? '، في البيت' : ''}</p><p class="bk-time">${ICON.clock(14)} ${hourLabel(b.hour)}، ${fullDate(b.date)}</p></div>
            <div class="bk-end"><span class="status st-${esc(b.status)}">${STATUS[b.status] || esc(b.status)}</span>
            ${can ? `<button class="btn sm danger" data-act="cancel" data-v="${esc(b.id)}">إلغاء</button>` : ''}</div>
          </article>`;
        }).join('') : '<div class="empty">ما عندك حجوزات للحين. اختر محل من الرئيسية واحجز أول موعد.</div>'}
      </section>
    </div>
  </main>`;
}

/* ------------------------------ صفحة المحل ------------------------------ */
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
  const shop = S.shop; const k = calc();
  const day = days[S.dayIdx];
  const nowH = new Date().getHours();
  const hours = [];
  for (let h = shop.open; h < shop.close; h++) if (!(S.dayIdx === 0 && h <= nowH)) hours.push(h);
  return `<main class="shop-page">
    <div class="wrap">
      <div class="sp-cover" style="view-transition-name:shop-cover">${shopArt(shop, true)}
        <button class="sp-back" data-act="go" data-v="home" aria-label="رجوع للرئيسية">${ICON.back(22)}</button>
      </div>
    </div>
    <div class="wrap sp-layout">
      <div class="sp-main">
        <div class="sp-title">
          <h1>${esc(shop.name)}</h1>
          <div class="sp-facts">
            <span>${ICON.pin(16)} ${esc(CAT_LABEL[shop.cat] || '')} في ${esc(shop.area)}</span>
            <span>${ICON.clock(16)} ${hourLabel(shop.open)} إلى ${hourLabel(shop.close)}</span>
            ${shop.quietOn ? `<span class="hl">${ICON.bolt(16)} خصم ${esc(shop.quietPct)}% وقت الهدوء</span>` : ''}
          </div>
        </div>

        <section class="sp-sec"><h2>الخدمة</h2>
          <div class="svcs">${shop.services.map((v) => `<button class="svc ${S.svcId === v.id ? 'on' : ''}" data-act="svc" data-v="${esc(v.id)}" aria-pressed="${S.svcId === v.id}">
            <span class="svc-radio">${S.svcId === v.id ? ICON.check(14) : ''}</span>
            <span class="svc-txt"><b>${esc(v.name)}</b><small>${esc(v.dur)} دقيقة</small></span>
            <span class="svc-price">${money(v.price)}</span>
          </button>`).join('')}</div>
        </section>

        <section class="sp-sec sp-extras">
          ${shop.homeService ? `<button class="opt" data-act="home" aria-pressed="${S.atHome}">
            <span class="opt-ic">${ICON.homesvc(22)}</span><span class="opt-txt"><b>الخدمة في بيتك</b><small>رسوم الزيارة ${money(shop.homeFee)}</small></span><span class="switch"></span>
          </button>` : ''}
          <div class="opt">
            <span class="opt-ic">${ICON.users(22)}</span><span class="opt-txt"><b>عدد الأشخاص</b><small>حجز جماعي بنفس الموعد</small></span>
            <span class="stepper"><button data-act="dec" aria-label="إنقاص شخص">−</button><b id="people" aria-live="polite">${S.people}</b><button data-act="inc" aria-label="زيادة شخص">+</button></span>
          </div>
        </section>

        <section class="sp-sec"><h2>اليوم</h2>
          <div class="days">${days.map((d, i) => `<button class="day ${i === S.dayIdx ? 'on' : ''}" data-act="day" data-v="${i}" aria-pressed="${i === S.dayIdx}"><small>${d.label}</small><b>${d.short.split(' ')[0]}</b><small>${d.short.split(' ')[1] || ''}</small></button>`).join('')}</div>
        </section>

        <section class="sp-sec"><h2>الوقت</h2>
          ${hours.length ? `<div class="slots">${hours.map((h) => {
            const full = (S.taken[h] || 0) + S.people > shop.capacity;
            const quiet = isQuiet(shop, h);
            return `<button class="slot ${full ? 'full' : ''} ${quiet ? 'quiet' : ''} ${S.hour === h ? 'on' : ''}" data-act="hour" data-v="${h}" aria-pressed="${S.hour === h}">
              <b>${hourLabel(h)}</b><small>${full ? 'محجوز' : quiet ? `خصم ${shop.quietPct}%` : 'متاح'}</small></button>`;
          }).join('')}</div>` : '<div class="empty">ما بقى مواعيد اليوم. اختر يوم ثاني.</div>'}
          ${k.full ? `<p class="note">${ICON.bell(18)} هذا الموعد محجوز. انضم لقائمة الانتظار، وإذا فضى يأكده لك المحل.</p>` : ''}
        </section>
      </div>

      <aside class="summary" aria-label="ملخص الحجز">
        <h2>ملخص الحجز</h2>
        <dl>
          <div><dt>الخدمة</dt><dd>${k.svc ? `${esc(k.svc.name)}${S.people > 1 ? ` × ${S.people}` : ''}` : '<span class="muted">اختر خدمة</span>'}</dd></div>
          <div><dt>الموعد</dt><dd>${k.hasHour ? `${fullDate(day.iso)}، ${hourLabel(S.hour)}` : '<span class="muted">اختر اليوم والوقت</span>'}</dd></div>
          ${k.homeFee ? `<div><dt>رسوم الزيارة</dt><dd>${money(k.homeFee)}</dd></div>` : ''}
          ${k.discount ? `<div class="save"><dt>خصم وقت الهدوء</dt><dd>−${money(k.discount)}</dd></div>` : ''}
        </dl>
        <div class="sum-total"><span>الإجمالي</span><b id="total">${k.svc ? money(k.total) : '—'}</b></div>
        ${k.full
          ? `<button class="btn block rose" data-act="wait" ${k.svc && !S.busy ? '' : 'disabled'}>انضم لقائمة الانتظار</button>`
          : `<button class="btn block" data-act="confirm" ${k.ready && !S.busy ? '' : 'disabled'}>أكّد الحجز</button>`}
        ${k.deposit ? `<p class="fine">${ICON.shield(16)} عربون ${money(k.deposit)} يُخصم من الفاتورة ويحمي موعدك (الدفع الإلكتروني قريبًا)</p>` : ''}
      </aside>
    </div>
  </main>`;
}

/* ------------------------------ التأكيد ------------------------------ */
function viewDone() {
  const b = S.last; const wait = b.status === 'wait';
  return `<main class="wrap page done">
    <div class="stamp stamp-anim ${wait ? 'wait' : ''}" aria-hidden="true"><svg viewBox="0 0 112 112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <circle class="ring" cx="56" cy="56" r="48" stroke-width="6" transform="rotate(-90 56 56)"/>
      ${wait ? '<path class="mark" d="M56 32v26l16 10" stroke-width="7"/>' : '<path class="mark" d="M36 58l14 14 27-30" stroke-width="8"/>'}
    </svg></div>
    <h1>${wait ? 'أنت في قائمة الانتظار' : 'تم الحجز'}</h1>
    <p class="done-sub">${wait ? 'إذا فضى الموعد يأكده لك المحل، وتشوف الحالة في حجوزاتي.' : 'موعدك مؤكد، وتلقاه في حجوزاتي.'}</p>
    <div class="ticket-card">
      <div class="tc-top"><b>${esc(b.shopName)}</b><span class="status st-${esc(b.status)}">${STATUS[b.status]}</span></div>
      <div class="tc-row"><span>الخدمة</span><b>${esc(b.serviceName)}${b.people > 1 ? ` × ${b.people}` : ''}</b></div>
      <div class="tc-row"><span>الموعد</span><b>${fullDate(b.date)}، ${hourLabel(b.hour)}</b></div>
      <div class="tc-row"><span>الإجمالي</span><b>${money(b.total)}</b></div>
      ${wait ? '' : `<div class="tc-earn">${ICON.gift(20)} كسبت ${Math.floor(b.total / 10)} نقطة من هذا الحجز</div>`}
    </div>
    <div class="done-actions">
      <button class="btn" data-act="go" data-v="bookings">عرض حجوزاتي</button>
      <button class="btn ghost" data-act="go" data-v="home">الرئيسية</button>
    </div>
  </main>`;
}

/* =============================== الأفعال =============================== */
async function loadTaken() {
  try { S.taken = await store().takenCounts(S.shop.id, days[S.dayIdx].iso); } catch (e) { console.error(e); S.taken = {}; }
}

async function openShop(id, svcId = null, dayIdx = 0, hour = null) {
  const shop = S.shops.find((s) => s.id === id) || await store().getShop(id);
  if (!shop) return toast('المحل غير متاح الحين');
  S.vtShop = shop.id;
  if (!svcId && shop.services.length === 1) svcId = shop.services[0].id;
  Object.assign(S, { screen: 'shop', shop, svcId, dayIdx, hour, people: 1, atHome: false, taken: {}, lastTotal: 0 });
  await loadTaken();
  render();
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
    computeNearest().then((n) => { S.nearest = n; });
  } catch (e) {
    console.error(e);
    if (e.message === 'FULL') { toast('انحجز هذا الموعد قبلك. اختر وقت ثاني.'); await loadTaken(); S.hour = null; }
    else toast('ما انحفظ الحجز. تأكد من الإنترنت وحاول مرة ثانية.');
  }
  S.busy = false; render();
}

const actions = {
  go: (v) => { S.screen = v; render(); },
  cat: (v) => {
    S.cat = v;
    render();
    const el = document.getElementById('shops');
    if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  },
  open: (v) => openShop(v),
  slotopen: (v) => { const [id, di, h] = v.split('|'); openShop(id, null, Number(di), Number(h)); },
  svc: (v) => { S.svcId = v; render(); },
  home: () => { S.atHome = !S.atHome; render(); },
  inc: () => { S.people = Math.min(6, S.people + 1); S.bumpPeople = true; render(); },
  dec: () => { S.people = Math.max(1, S.people - 1); S.bumpPeople = true; render(); },
  day: async (v) => { S.dayIdx = Number(v); S.hour = null; await loadTaken(); render(); },
  hour: (v) => { S.hour = Number(v); render(); },
  confirm: () => book('confirmed'),
  wait: () => book('wait'),
  cancel: async (v) => {
    const b = S.bookings.find((x) => x.id === v);
    if (!b || !window.confirm('تبي تلغي هذا الموعد؟')) return;
    try { await store().setStatus(b, 'cancelled'); b.status = 'cancelled'; toast('ألغينا الموعد'); } catch (e) { console.error(e); toast('ما انلغى الموعد. حاول مرة ثانية.'); }
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
    S.nearest = await computeNearest();
    const shopParam = new URLSearchParams(location.search).get('shop');
    render();
    if (shopParam) openShop(shopParam);
  } catch (e) {
    console.error(e);
    $app.innerHTML = '<div class="loading">ما قدرنا نتصل بالخادم. تأكد من الإنترنت وحدّث الصفحة.</div>';
  }
})();
