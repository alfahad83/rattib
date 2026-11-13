// طبقة البيانات: نفس الواجهة سواء كان التطبيق على Firebase أو في الوضع التجريبي
import { FIREBASE_CONFIG } from './config.js';
import { SEED_SHOPS } from './seed.js';
import { isoDate, today, uid as makeId } from './common.js';

export const mode = FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey ? 'firebase' : 'local';
let impl = null;

export async function init(opts = {}) {
  impl = mode === 'firebase' ? await firebaseImpl(opts) : localImpl();
  await impl.ready();
  return mode;
}

export function store() {
  if (!impl) throw new Error('store not initialised');
  return impl;
}

// مكان الحجز محسوب؟ (المؤكد فقط ياخذ من السعة)
const counts = (status) => status === 'confirmed' || status === 'done';

/* ------------------------------------------------------------------ */
/* الوضع التجريبي: localStorage                                        */
/* ------------------------------------------------------------------ */
function localImpl() {
  const KEY = 'rattib-demo-v1';
  const deviceKey = 'rattib-device';
  let device = localStorage.getItem(deviceKey);
  if (!device) { device = makeId('dev'); localStorage.setItem(deviceKey, device); }

  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
  if (!db || !Array.isArray(db.shops)) db = { shops: SEED_SHOPS.map((s) => JSON.parse(JSON.stringify(s))), bookings: demoBookings(device) };
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));
  const taken = (shopId, date, hour) => db.bookings
    .filter((b) => b.shopId === shopId && b.date === date && b.hour === hour && counts(b.status))
    .reduce((n, b) => n + b.people, 0);
  let user = { uid: 'demo-owner', email: 'demo@rattib', demo: true };

  return {
    ready: async () => save(),
    customerUid: () => device,
    listShops: async () => db.shops.filter((s) => s.active !== false),
    getShop: async (id) => db.shops.find((s) => s.id === id) || null,
    takenCounts: async (shopId, date) => {
      const m = {};
      db.bookings.filter((b) => b.shopId === shopId && b.date === date && counts(b.status)).forEach((b) => { m[b.hour] = (m[b.hour] || 0) + b.people; });
      return m;
    },
    createBooking: async (b) => {
      const shop = db.shops.find((s) => s.id === b.shopId);
      if (b.status === 'confirmed' && taken(b.shopId, b.date, b.hour) + b.people > shop.capacity) throw new Error('FULL');
      const rec = { ...b, id: makeId('bk'), customerUid: device, createdAt: Date.now() };
      db.bookings.push(rec); save();
      return rec;
    },
    myBookings: async () => db.bookings.filter((b) => b.customerUid === device),
    setStatus: async (booking, status) => {
      const b = db.bookings.find((x) => x.id === booking.id);
      if (!b) return;
      const shop = db.shops.find((s) => s.id === b.shopId);
      if (!counts(b.status) && counts(status) && taken(b.shopId, b.date, b.hour) + b.people > shop.capacity) throw new Error('FULL');
      b.status = status; save();
    },
    // صاحب المحل
    onUser: (cb) => { cb(user); return () => {}; },
    signIn: async () => user,
    signUp: async () => user,
    signOut: async () => { localStorage.removeItem(KEY); location.reload(); },
    myShop: async () => db.shops.find((s) => s.ownerUid === user.uid) || null,
    saveShop: async (shop) => {
      const i = db.shops.findIndex((s) => s.id === shop.id);
      const rec = { ...shop, id: shop.id || makeId('shop'), ownerUid: user.uid };
      if (i >= 0) db.shops[i] = rec; else db.shops.push(rec);
      save();
      return rec;
    },
    shopBookings: async (shopId) => db.bookings.filter((b) => b.shopId === shopId)
  };
}

// بيانات تجريبية: حجوزات لعملاء آخرين + سجل 30 يوم لمحل "لمسة ناعمة" + آخر حلاقة لك قبل 23 يوم
function demoBookings(device) {
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const names = ['نورة', 'سارة', 'مها', 'جود', 'العنود', 'ريما', 'لمى', 'هيا', 'دانة', 'شهد'];
  const out = [];
  const add = (shop, dateObj, hour, status, name, svcIdx = 0, people = 1, cust = 'demo-cust') => {
    const svc = shop.services[svcIdx % shop.services.length];
    out.push({ id: makeId('bk'), shopId: shop.id, shopName: shop.name, customerUid: cust, customerName: name, customerPhone: '05XXXXXXXX',
      serviceId: svc.id, serviceName: svc.name, price: svc.price, people, atHome: false, date: isoDate(dateObj), hour,
      discount: 0, total: svc.price * people, deposit: shop.depositOn ? shop.depositAmount : 0, status, createdAt: Date.now() });
  };
  const now = new Date(); now.setHours(0, 0, 0, 0);
  SEED_SHOPS.forEach((shop) => {
    for (let d = 0; d < 7; d++) {
      const day = new Date(now); day.setDate(now.getDate() + d);
      for (let h = shop.open; h < shop.close; h++) {
        if (shop.quietHours.includes(h)) continue;
        if (rnd() < 0.3) for (let c = 0; c < shop.capacity; c++) add(shop, day, h, 'confirmed', names[Math.floor(rnd() * names.length)], Math.floor(rnd() * 3));
      }
    }
  });
  const s1 = SEED_SHOPS[0];
  for (let d = 30; d >= 1; d--) {
    const day = new Date(now); day.setDate(now.getDate() - d);
    for (let h = s1.open; h < s1.close; h++) {
      const busy = h >= 17 ? 0.75 : h >= 14 && h <= 15 ? 0.12 : 0.4;
      if (rnd() < busy) add(s1, day, h, rnd() < 0.93 ? 'done' : 'noshow', names[Math.floor(rnd() * names.length)], Math.floor(rnd() * 3));
    }
  }
  const s2 = SEED_SHOPS[1];
  const past = new Date(now); past.setDate(now.getDate() - 23);
  add(s2, past, 19, 'done', 'أنت', 0, 1, device);
  return out;
}

/* ------------------------------------------------------------------ */
/* Firebase: Auth + Firestore                                          */
/* ------------------------------------------------------------------ */
async function firebaseImpl(opts) {
  const V = '10.12.2';
  const base = `https://www.gstatic.com/firebasejs/${V}/`;
  const { initializeApp } = await import(base + 'firebase-app.js');
  const A = await import(base + 'firebase-auth.js');
  const F = await import(base + 'firebase-firestore.js');
  const app = initializeApp(FIREBASE_CONFIG);
  const auth = A.getAuth(app);
  const fs = F.getFirestore(app);
  const col = (n) => F.collection(fs, n);
  const withId = (snap) => ({ ...snap.data(), id: snap.id });
  const slotRef = (shopId, date, hour) => F.doc(fs, 'slots', `${shopId}_${date}_${hour}`);

  const firstUser = new Promise((res) => { const off = A.onAuthStateChanged(auth, (u) => { off(); res(u); }); });

  return {
    ready: async () => {
      const u = await firstUser;
      if (!u && opts.anonymous) await A.signInAnonymously(auth);
    },
    customerUid: () => auth.currentUser && auth.currentUser.uid,
    listShops: async () => (await F.getDocs(F.query(col('shops'), F.where('active', '==', true)))).docs.map(withId),
    getShop: async (id) => { const s = await F.getDoc(F.doc(fs, 'shops', id)); return s.exists() ? withId(s) : null; },
    takenCounts: async (shopId, date) => {
      const snap = await F.getDocs(F.query(col('slots'), F.where('shopId', '==', shopId), F.where('date', '==', date)));
      const m = {};
      snap.docs.forEach((d) => { const x = d.data(); m[x.hour] = x.count || 0; });
      return m;
    },
    createBooking: async (b) => {
      const ref = F.doc(col('bookings'));
      const rec = { ...b, customerUid: auth.currentUser.uid, createdAt: Date.now() };
      await F.runTransaction(fs, async (tx) => {
        if (b.status === 'confirmed') {
          const shop = await tx.get(F.doc(fs, 'shops', b.shopId));
          const sr = slotRef(b.shopId, b.date, b.hour);
          const slot = await tx.get(sr);
          const n = slot.exists() ? slot.data().count || 0 : 0;
          if (n + b.people > (shop.data().capacity || 1)) throw new Error('FULL');
          tx.set(sr, { shopId: b.shopId, date: b.date, hour: b.hour, count: n + b.people });
        }
        tx.set(ref, rec);
      });
      return { ...rec, id: ref.id };
    },
    myBookings: async () => {
      const u = auth.currentUser; if (!u) return [];
      return (await F.getDocs(F.query(col('bookings'), F.where('customerUid', '==', u.uid)))).docs.map(withId);
    },
    setStatus: async (booking, status) => {
      const ref = F.doc(fs, 'bookings', booking.id);
      await F.runTransaction(fs, async (tx) => {
        const cur = await tx.get(ref);
        const b = cur.data();
        const was = counts(b.status), will = counts(status);
        if (was !== will) {
          const sr = slotRef(b.shopId, b.date, b.hour);
          const slot = await tx.get(sr);
          const n = slot.exists() ? slot.data().count || 0 : 0;
          if (will) {
            const shop = await tx.get(F.doc(fs, 'shops', b.shopId));
            if (n + b.people > (shop.data().capacity || 1)) throw new Error('FULL');
          }
          tx.set(sr, { shopId: b.shopId, date: b.date, hour: b.hour, count: Math.max(0, n + (will ? b.people : -b.people)) });
        }
        tx.update(ref, { status });
      });
    },
    // صاحب المحل
    onUser: (cb) => A.onAuthStateChanged(auth, (u) => cb(u && !u.isAnonymous ? u : null)),
    signIn: async (email, pass) => (await A.signInWithEmailAndPassword(auth, email, pass)).user,
    signUp: async (email, pass) => (await A.createUserWithEmailAndPassword(auth, email, pass)).user,
    signOut: async () => A.signOut(auth),
    myShop: async () => {
      const u = auth.currentUser; if (!u) return null;
      const snap = await F.getDocs(F.query(col('shops'), F.where('ownerUid', '==', u.uid), F.limit(1)));
      return snap.empty ? null : withId(snap.docs[0]);
    },
    saveShop: async (shop) => {
      const u = auth.currentUser;
      const ref = shop.id ? F.doc(fs, 'shops', shop.id) : F.doc(col('shops'));
      const rec = { ...shop, ownerUid: u.uid, updatedAt: Date.now() };
      delete rec.id;
      await F.setDoc(ref, rec);
      return { ...rec, id: ref.id };
    },
    shopBookings: async (shopId) => (await F.getDocs(F.query(col('bookings'), F.where('shopId', '==', shopId)))).docs.map(withId)
  };
}

export { today };
