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
    /* credentials saaf-saaf likha hai: /api/scans ab login maangta hai
       (usme kisan ka naam, phone aur khet ka GPS hota hai). Default waise
       bhi same-origin hai, par yahan padhne wale ko dikhna chahiye ki
       cookie jaani zaroori hai. */
    const res = await fetch(BASE + '/scans', { cache: 'no-store', credentials: 'same-origin' });
    if (res.status === 401) return { ok: false, scans: [], storage: null, needsLogin: true };
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
      credentials: 'same-origin',
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

/* ---------------------------------------------------------------------------
 * ASLI AANKDE — /api/stats
 *
 * Dashboard ke bade number pehle src/data/*.js me haath se likhe hue the.
 * Wo har baar wahi dikhte the, chahe kisi kisan ne aaj ek bhi jaanch bheji
 * ho ya nahi. Sarkari faisla jhoothe number par nahi hona chahiye.
 *
 * Jo number hamare paas sach me nahi hai (khasra/cadastral rakba, bachai
 * gayi fasal ka rupaya) wo `null` aata hai — shoonya nahi — aur uske saath
 * `unavailable` me kaaran likha hota hai. UI wahan "—" dikhata hai.
 * ------------------------------------------------------------------------- */
export async function fetchStats() {
  try {
    const res = await fetch(BASE + '/stats', { cache: 'no-store', credentials: 'same-origin' });
    if (res.status === 401) return { ok: false, error: 'login' };
    if (!res.ok) return { ok: false, error: 'server' };
    return await res.json();
  } catch (err) {
    console.warn('[api] stats nahi mile:', err.message);
    return { ok: false, error: 'network' };
  }
}

/* Adhikari ka apna khata — kaun logged in hai. */
export async function fetchAdminSession() {
  try {
    const res = await fetch(BASE + '/admin?action=session', {
      cache: 'no-store', credentials: 'same-origin',
    });
    if (!res.ok) return { authenticated: false };
    return await res.json();
  } catch (_) {
    return { authenticated: false };
  }
}

export async function adminLogout() {
  try {
    await fetch(BASE + '/admin?action=logout', { method: 'POST', credentials: 'same-origin' });
    return { ok: true };
  } catch (_) {
    return { ok: false };
  }
}

/* ---------------------------------------------------------------------------
 * CIBRC protocol — dawa aur matra ki list
 *
 * Pehle ye matraayein code ki ek file me thi. Badalne ke liye programmer,
 * build aur deploy chahiye tha — matlab CIBRC ki nayi matra kisano tak
 * hafton nahi pahunchti thi. Ab adhikari khud badalta hai.
 * ------------------------------------------------------------------------- */
export async function fetchProtocols() {
  try {
    const res = await fetch(BASE + '/protocols', { cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) return { ok: false, protocols: [] };
    return await res.json();
  } catch (_) {
    return { ok: false, protocols: [] };
  }
}

export async function saveProtocol(p) {
  try {
    const res = await fetch(BASE + '/protocols', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    });
    return await res.json();
  } catch (_) {
    return { ok: false, error: 'network' };
  }
}

export async function deleteProtocol(id) {
  try {
    const res = await fetch(BASE + '/protocols?id=' + encodeURIComponent(id), {
      method: 'DELETE', credentials: 'same-origin',
    });
    return await res.json();
  } catch (_) {
    return { ok: false, error: 'network' };
  }
}
