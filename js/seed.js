// محلات تجريبية تظهر في الوضع التجريبي فقط (بدون Firebase)

const base = { open: 9, close: 22, capacity: 2, quietOn: false, quietPct: 20, quietHours: [14, 15], homeService: false, homeFee: 50, depositOn: true, depositAmount: 20, active: true };

export const SEED_SHOPS = [
  { ...base, id: 's1', ownerUid: 'demo-owner', name: 'صالون لمسة ناعمة', cat: 'salon', area: 'حي الملقا', phone: '', color: 0, capacity: 3,
    services: [ { id: 'a', name: 'قص وتصفيف', dur: 60, price: 120 }, { id: 'b', name: 'صبغة كاملة', dur: 120, price: 350 }, { id: 'c', name: 'مكياج سهرة', dur: 45, price: 250 } ] },
  { ...base, id: 's2', ownerUid: 'demo-other', name: 'حلاق الأناقة', cat: 'barber', area: 'حي النرجس', phone: '', color: 1, quietOn: true, capacity: 2,
    services: [ { id: 'a', name: 'حلاقة شعر', dur: 30, price: 50 }, { id: 'b', name: 'حلاقة ذقن', dur: 20, price: 30 }, { id: 'c', name: 'باكج العريس', dur: 90, price: 300 } ] },
  { ...base, id: 's3', ownerUid: 'demo-other', name: 'سبا الهدوء', cat: 'spa', area: 'حي الياسمين', phone: '', color: 2, quietOn: true, capacity: 2,
    services: [ { id: 'a', name: 'مساج استرخاء', dur: 60, price: 200 }, { id: 'b', name: 'حمام مغربي', dur: 45, price: 180 }, { id: 'c', name: 'عناية بالبشرة', dur: 50, price: 220 } ] },
  { ...base, id: 's4', ownerUid: 'demo-other', name: 'كابتن فيصل', cat: 'trainer', area: 'حي العارض', phone: '', color: 3, open: 6, capacity: 1, homeService: true, homeFee: 40,
    services: [ { id: 'a', name: 'حصة تدريب', dur: 60, price: 150 }, { id: 'b', name: 'تقييم لياقة', dur: 30, price: 80 } ] },
  { ...base, id: 's5', ownerUid: 'demo-other', name: 'بيوتي هوم', cat: 'salon', area: 'شمال الرياض', phone: '', color: 4, capacity: 2, homeService: true, homeFee: 60,
    services: [ { id: 'a', name: 'مكياج منزلي', dur: 60, price: 300 }, { id: 'b', name: 'تسريحة', dur: 45, price: 200 }, { id: 'c', name: 'حناء', dur: 60, price: 150 } ] }
];
