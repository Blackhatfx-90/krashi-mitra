'use strict';

/* ============================================================================
 * VRIDHI AI — Kshetriya dashboard ke ASLI aankde
 * api/stats.js   (GET, sirf logged-in adhikari)
 *
 * KYUN BANI
 *   Dashboard ke chaaron bade number (outbreak hotspots, farm parcels,
 *   pending verifications, crop loss prevented) ek JS file me haath se
 *   likhe hue the. Wo har baar wahi dikhte the — chahe kisi kisan ne aaj
 *   ek bhi jaanch bheji ho ya nahi. Aisa dashboard adhikari ko bharosa
 *   deta hai jiska koi aadhaar nahi. Yahi sabse khatarnak cheez hai:
 *   jhoothe aankde par sarkari faisla ho jata hai.
 *
 * AB YE NUMBER KAHAN SE AATE HAIN
 *   Sirf usi cheez se jo hamare paas SACH ME hai — kisan ki bheji hui
 *   jaanchein (km:scans) aur vibhag ki bheji hui chetavniyan.
 *
 *     hotspots   = ek hi zile me, ek hi rog ki, 14 din ke andar
 *                  >= 3 jaanchein  -> ek "cluster"
 *                  laal (critical) tab jab >= 8 jaanchein ya bharosa >= 85%
 *     pending    = jin jaanchon ka status abhi 'pending' hai (asli ginti)
 *     slaHours   = pending jaanch ka aasat intezaar (ghante me)
 *     scans7d    = pichhle 7 din ki jaanchein
 *
 * JO HUMARE PAAS NAHI HAI, WO NULL JAATA HAI — SHOONYA NAHI
 *   farmParcels    : cadastral/khasra data kisi sarkari GIS layer se aayega.
 *                    Wo abhi juda nahi hai, isliye null.
 *   cropLossCrores : "kitni fasal bachi" ek aarthik anumaan hai. Uske liye
 *                    chahiye — asli ropit rakba, upaj, aur mandi bhav.
 *                    Bina inke koi bhi number gaddi ka hoga, isliye null.
 *
 *   Dashboard null par "—" aur "abhi data nahi" dikhata hai. Adhikari ko
 *   khaali khana dikhna behtar hai, banaya hua number dikhne se.
 * ========================================================================= */

const store = require('./_store');
const { adminFor } = require('./admin');

const SCANS_KEY  = 'km:scans';
const STATUS_KEY = 'km:scan_status';
const MAX_SCANS  = 300;

const CLUSTER_WINDOW_DAYS = 14;

const DAY = 86400000;

function ago(days) { return Date.now() - days * DAY; }
function ts(s) { const t = Date.parse(s || ''); return isFinite(t) ? t : 0; }

/* Ek hi rog ko alag-alag naam se aane par bhi ek hi maano. */
function districtKey(s) {
  return String(s.district || '').trim() || null;   // zila na ho to cluster me nahi
}

/* ---------------------------------------------------------------------------
 * Cluster ki paribhasha EK hi jagah hai — api/outbreaks.js me.
 *
 * Pehle yahan apni alag ginti thi: scan ginte the (>=3), aur critical 8 scan
 * par. Usme teen dikkat thi —
 *
 *   1. Ek hi kisan 10 baar photo khinche to "cluster" ban jata tha. Adhikari
 *      ko lagta 10 khet me rog hai, jabki ek tha.
 *   2. Jis jaanch ko adhikari khud 'rejected' kar chuka tha, wo bhi ginti me
 *      rehti thi — yaani uske dekhne ka koi asar hi nahi hota tha.
 *   3. Swasth fasal ki jaanch bhi gin jaati thi.
 *
 * Aur sabse badi baat: kisan app /api/outbreaks se apni ginti leti hai. Do
 * alag paribhasha ka matlab hota ki adhikari ki screen par 8 likha ho aur
 * usi jile ke kisan ke phone par 3. Isliye ab dono ek hi function se aate
 * hain — bharosa ka sawal hai.
 *
 * Adhikari login kiya hua hai, isliye use GPS bhi milta hai (naksha ke liye);
 * kisan wale sarvajanik raste par nahi jata.
 * ------------------------------------------------------------------------- */
const { clusterScans } = require('./outbreaks');

function buildClusters(scans) {
  return clusterScans(scans, {
    windowDays: CLUSTER_WINDOW_DAYS,
    includePrivate: true,
  }).map((c) => ({
    district: c.district,
    disease: c.diseaseHi || c.diseaseEn || c.label,
    crop: c.crop,
    cropNameHi: c.cropNameHi || c.crop,
    /* Ab do ginti dikhti hain: kitne KISAN (asli failav) aur kitni JAANCH.
       Adhikari ko dono chahiye — 3 kisan/20 jaanch aur 3 kisan/3 jaanch
       do alag haalat hain. */
    farmerCount: c.farmerCount,
    scanCount: c.scanCount,
    verifiedCount: c.verifiedCount,
    confirmed: c.confirmed,
    avgConfidence: c.avgConfidence,
    villages: c.villages,
    villageCount: c.villageCount,
    points: c.points || [],
    lastReportedAt: c.lastSeen || null,
    firstReportedAt: c.firstSeen || null,
    level: c.level,
    levelHi: c.levelHi,
    /* Radar 'critical' / 'watch' samajhta hai — usi me badal dete hain */
    severity: c.level === 'gambhir' ? 'critical'
            : c.level === 'chetavni' ? 'warning' : 'watch',
  }));
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  /* Yeh poore zile ki sehat ka naksha hai — bina login ke koi na dekhe. */
  let admin = null;
  try { admin = await adminFor(req); }
  catch (e) { console.error('[stats] admin check fail:', e && e.message); }
  if (!admin) return res.status(401).json({ ok: false, error: 'login_zaroori' });

  try {
    const [rows, overrides] = await Promise.all([
      store.listAll(SCANS_KEY, MAX_SCANS),
      store.hashAll(STATUS_KEY),
    ]);

    const scans = rows.map(s => {
      const o = overrides[s.id];
      return o ? Object.assign({}, s, o) : s;
    });

    const pending = scans.filter(s => (s.status || 'pending') === 'pending');

    /* SLA = pending jaanchein kitni der se intezaar kar rahi hain. */
    let slaHours = null;
    if (pending.length) {
      const waits = pending.map(s => Date.now() - ts(s.receivedAt)).filter(w => w > 0);
      if (waits.length) {
        slaHours = Math.round((waits.reduce((a, b) => a + b, 0) / waits.length) / 3600000 * 10) / 10;
      }
    }

    const clusters = buildClusters(scans);

    /* Fasal ke hisaab se ginti — analytics ke liye. */
    const byCrop = {};
    const byDistrict = {};
    for (const s of scans) {
      if (s.crop) byCrop[s.crop] = (byCrop[s.crop] || 0) + 1;
      const d = districtKey(s);
      if (d) byDistrict[d] = (byDistrict[d] || 0) + 1;
    }

    return res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      storage: store.storageKind(),

      metrics: {
        totalScans:       scans.length,
        scans7d:          scans.filter(s => ts(s.receivedAt) >= ago(7)).length,
        scans24h:         scans.filter(s => ts(s.receivedAt) >= ago(1)).length,
        pendingScans:     pending.length,
        verifiedScans:    scans.filter(s => s.status === 'verified').length,
        rejectedScans:    scans.filter(s => s.status === 'rejected').length,
        labScans:         scans.filter(s => s.status === 'lab').length,
        activeClusters:   clusters.length,
        criticalClusters: clusters.filter(c => c.severity === 'critical').length,
        slaHours:         slaHours,

        /* Jaan-boojhkar null — neeche `unavailable` me kaaran likha hai. */
        farmParcels:      null,
        cropLossCrores:   null,
        affectedAreaHa:   null,
      },

      /* Dashboard yahi text dikhata hai jahan number nahi hai. Kisi bhi
         adhikari ko yeh saaf dikhna chahiye ki khana khaali kyun hai. */
      unavailable: {
        farmParcels: 'खसरा/कैडस्ट्रल परत अभी नहीं जुड़ी है — राज्य के भू-अभिलेख GIS से जोड़ना बाकी।',
        cropLossCrores: 'बचाई गई फसल का आर्थिक अनुमान लगाने के लिए रोपित रकबा, उपज और मंडी भाव चाहिए — ये तीनों अभी उपलब्ध नहीं।',
        affectedAreaHa: 'प्रभावित रकबा तभी निकलेगा जब खेत की सीमा (कैडस्ट्रल) जुड़ जाए।',
      },

      clusters: clusters,
      byCrop: byCrop,
      byDistrict: byDistrict,
    });

  } catch (err) {
    console.error('[stats]', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
