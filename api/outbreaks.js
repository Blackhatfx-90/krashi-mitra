/* ============================================================================
 * api/outbreaks.js — "aapke jile me yeh rog phail raha hai"
 *
 *   GET /api/outbreaks                        saare chal rahe prakop
 *   GET /api/outbreaks?district=Bareilly      sirf ek jile ke
 *   GET /api/outbreaks?district=X&crop=wheat  kisan app isi tarah poochti hai
 *
 * KAAM KAISE KARTA HAI
 *   Alag se koi "outbreak" table nahi hai — jaanch ke aankde (api/scans) hi
 *   sach hain. Yahan unhe jod kar dekha jata hai: ek hi jile me, ek hi fasal
 *   me, ek hi rog — pichhle 14 din me kitni baar mila?
 *
 *     3 se kam   -> kuch nahi. Do kisan ke khet me rog hona normal hai.
 *     3 se        -> 'nazar'    (dhyan rakhein)
 *     6 se        -> 'chetavni' (ab bachav karein)
 *     12 se       -> 'gambhir'  (rog phail chuka hai)
 *
 * KYUN GINTI-BHAR SE KAAM NAHI CHALTA
 *   Ek hi kisan 10 baar photo khinche to wo prakop nahi hai. Isliye hum
 *   'aadhar' (distinct) ginte hain — kisan ka naam/gaon/phone jo mila ho,
 *   usse. Kuch na mila to scan ki apni id, taaki ginti kam ho jaye, badhe na.
 *
 *   Officer ne jise 'rejected' kar diya, wo ginti me nahi aata — wahi to
 *   dashboard ka matlab hai.
 *
 * NIJTA: yahan se kabhi kisi kisan ka naam, phone ya photo bahar nahi jata.
 * Sirf ginti, jila, fasal aur rog ka naam. Jawab sarvajanik hai (akhbaar
 * jaisi soochna), isliye koi login nahi.
 * ========================================================================= */

'use strict';

const store = require('./_store');

const SCANS_KEY  = 'km:scans';
const STATUS_KEY = 'km:scan_status';
const MAX_SCANS  = 300;

const WINDOW_DAYS = 14;          // itne din purani jaanch tak ginte hain
const LEVELS = [
  { min: 12, level: 'gambhir',  hi: 'गंभीर — रोग फैल चुका है',      severity: 'critical' },
  { min: 6,  level: 'chetavni', hi: 'चेतावनी — अब बचाव करें',        severity: 'warning'  },
  { min: 3,  level: 'nazar',    hi: 'नज़र रखें',                     severity: 'info'     },
];

function clean(v, max) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max || 120);
}

function levelFor(n) {
  for (let i = 0; i < LEVELS.length; i++) if (n >= LEVELS[i].min) return LEVELS[i];
  return null;
}

/* Ek hi kisan ki baar-baar ki jaanch ek hi gini jaye */
function farmerKey(s) {
  const who = (s.phone || '') + '|' + (s.farmerName || '') + '|' + (s.village || '');
  return who.replace(/\|+/g, '|') === '||' ? 'scan:' + s.id : 'who:' + who.toLowerCase();
}

/** Scans se prakop nikalta hai. Test ke liye alag rakha hai. */
function clusterScans(scans, opts) {
  const o = opts || {};
  const windowMs = (o.windowDays || WINDOW_DAYS) * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - windowMs;
  const groups = {};

  scans.forEach((s) => {
    if (!s || s.status === 'rejected') return;           // officer ne mana kar diya
    if (!s.district || !s.crop || !s.label) return;      // jila pata nahi to prakop kaisa
    const t = Date.parse(s.receivedAt || '');
    if (!isFinite(t) || t < cutoff) return;

    /* Swasth fasal prakop nahi hai */
    const lab = String(s.label).toLowerCase();
    if (lab.indexOf('healthy') !== -1 || lab.indexOf('swasth') !== -1) return;

    const key = [String(s.district).toLowerCase(), s.crop, s.label].join('|');
    const g = groups[key] || (groups[key] = {
      id: 'OB-' + Buffer.from(key).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 14).toUpperCase(),
      district: s.district,
      crop: s.crop,
      cropNameHi: s.cropNameHi || '',
      label: s.label,
      diseaseHi: s.diseaseHi || '',
      diseaseEn: s.diseaseEn || '',
      farmers: {},          // aadhar ginti — baad me hata dete hain
      scanCount: 0,
      verifiedCount: 0,
      villages: {},
      firstSeen: s.receivedAt,
      lastSeen: s.receivedAt,
    });

    g.farmers[farmerKey(s)] = 1;
    g.scanCount += 1;
    if (s.status === 'verified' || s.status === 'lab') g.verifiedCount += 1;
    if (s.village) g.villages[s.village] = 1;
    if (s.receivedAt < g.firstSeen) g.firstSeen = s.receivedAt;
    if (s.receivedAt > g.lastSeen)  g.lastSeen  = s.receivedAt;
  });

  const out = [];
  Object.keys(groups).forEach((k) => {
    const g = groups[k];
    const count = Object.keys(g.farmers).length;
    const lv = levelFor(count);
    if (!lv) return;                                     // 3 se kam — prakop nahi

    delete g.farmers;
    g.farmerCount = count;
    g.villageCount = Object.keys(g.villages).length;
    g.villages = Object.keys(g.villages).slice(0, 8);
    g.level = lv.level;
    g.levelHi = lv.hi;
    g.severity = lv.severity;
    /* Officer ne khud dekh liya ho to kisan ko zyada bharosa hona chahiye */
    g.confirmed = g.verifiedCount > 0;
    out.push(g);
  });

  /* Sabse gambhir pehle, phir sabse nayi */
  const order = { gambhir: 0, chetavni: 1, nazar: 2 };
  out.sort((a, b) => (order[a.level] - order[b.level]) ||
                     (b.farmerCount - a.farmerCount) ||
                     (a.lastSeen < b.lastSeen ? 1 : -1));
  return out;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const q = req.query || {};
    const district = clean(q.district, 80).toLowerCase();
    const crop = clean(q.crop, 40).toLowerCase();
    const days = Math.max(1, Math.min(90, Number(q.days) || WINDOW_DAYS));

    const [rows, overrides] = await Promise.all([
      store.listAll(SCANS_KEY, MAX_SCANS),
      store.hashAll(STATUS_KEY),
    ]);
    /* Officer ka status alag rakha hai — jodna zaroori hai, warna
       'rejected' wali jaanch bhi prakop me gin jayegi. */
    const scans = rows.map((s) => {
      const o = overrides[s.id];
      return o ? Object.assign({}, s, o) : s;
    });

    let clusters = clusterScans(scans, { windowDays: days });

    if (district) clusters = clusters.filter((c) => c.district.toLowerCase() === district);
    if (crop)     clusters = clusters.filter((c) => c.crop === crop);

    return res.status(200).json({
      ok: true,
      storage: store.storageKind(),
      note: store.storageNote(),
      windowDays: days,
      scannedRows: scans.length,
      count: clusters.length,
      outbreaks: clusters,
    });

  } catch (err) {
    console.error('[outbreaks]', err);
    return res.status(500).json({ ok: false, error: 'server_error',
                                  detail: String(err && err.message).slice(0, 200) });
  }
};

/* Test ke liye bahar */
module.exports.clusterScans = clusterScans;
module.exports.LEVELS = LEVELS;
