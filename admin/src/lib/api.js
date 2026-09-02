/* ============================================================================
 * src/lib/api.js — kisan app ke saath live judaav
 *
 * Dashboard aur kisan app ek hi domain par hain, isliye seedha /api/... call
 * kar sakte hain — koi CORS ya key ki zaroorat nahi.
 *
 *   GET   /api/scans        kisan ki nayi jaanchein
 *   PATCH /api/scans        status badalna (verified / rejected / lab)
 *   POST  /api/advisories   chetavni kisan tak bhejna
 *
 * Sab kuch "fail ho to chup raho" tareeke se — API na chale to dashboard
 * apne demo data par chalta rehta hai, toota hua nahi dikhta.
 * ========================================================================= */

const BASE = '/api';

/** Kisan app se aayi jaanchein. Fail ho to khali list. */
export async function fetchLiveScans() {
  try {
    const res = await fetch(BASE + '/scans', { cache: 'no-store' });
    if (!res.ok) return { ok: false, scans: [], storage: null };
    const data = await res.json();
    return {
      ok: Boolean(data && data.ok),
      scans: (data && data.scans) || [],
      storage: data && data.storage,
      note: data && data.note,
    };
  } catch (err) {
    console.warn('[api] scans nahi mili:', err.message);
    return { ok: false, scans: [], storage: null };
  }
}

/** Adhikari ne verify / reject / lab kiya. */
export async function updateScanStatus(id, status, extra) {
  try {
    const res = await fetch(BASE + '/scans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ id, status }, extra || {})),
    });
    return await res.json();
  } catch (err) {
    console.warn('[api] status update fail:', err.message);
    return { ok: false, error: 'network' };
  }
}

/** Chetavni kisan ki app par bhejna. */
export async function broadcastAdvisory(advisory) {
  try {
    const res = await fetch(BASE + '/advisories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advisory),
    });
    return await res.json();
  } catch (err) {
    console.warn('[api] advisory bhej nahi paye:', err.message);
    return { ok: false, error: 'network' };
  }
}

/**
 * Kisan app ka scan -> dashboard ki validation queue wala shape.
 * Dono taraf ke field alag hain, isliye yahan ek hi jagah badalte hain.
 */
export function scanToQueueItem(scan) {
  const conf = Math.round((scan.confidence || 0) * 1000) / 10;
  return {
    id: scan.id,
    isLive: true,                                   // badge dikhane ke liye
    farmerName: scan.farmerName || 'किसान (नाम नहीं भेजा गया)',
    phone: scan.phone || '—',
    village: scan.village || '—',
    district: scan.district || (scan.gps ? 'GPS से' : '—'),
    division: 'live',
    crop: scan.crop,
    cropName: scan.cropNameHi || scan.crop,
    aiDetectedDisease: scan.diseaseHi
      ? scan.diseaseHi + (scan.diseaseEn ? ' (' + scan.diseaseEn + ')' : '')
      : scan.label,
    aiConfidence: conf,
    submittedAt: new Date(scan.receivedAt).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }),
    gpsCoordinates: scan.gps || null,
    image: scan.thumb || '',
    leafSymptoms: 'किसान की ऐप से सीधे आई जाँच — ' +
      (scan.source === 'ai' ? 'ऑनलाइन AI से पुष्टि' : 'फ़ोन के मॉडल से') +
      ', भरोसा ' + conf + '%.',
    status: scan.status || 'pending',
    priority: (scan.severity === 'high' || conf >= 90) ? 'urgent' : 'normal',
    suggestedAction: 'किसान को दिखाई गई सलाह ऐप में पहले से है — यहाँ से पुष्टि या लैब रेफ़र करें।',
  };
}
