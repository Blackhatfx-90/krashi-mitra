/* ============================================================================
 * api/community.js — kisano ka aapas ka sawal-jawab
 *
 *   GET    /api/community?crop=wheat&district=X   sawal padho
 *   POST   /api/community   {type:'question'|'answer', ...}  sawal ya jawab
 *   PATCH  /api/community   {id, action:'helpful'|'resolve'} 
 *   DELETE /api/community?id=..   apni hi baat hatao
 *
 * KYUN
 *   Har sawal ka jawab model nahi de sakta. "Is gaon me kaun sa beej chala?"
 *   ya "yeh dawa kahan milti hai" — yeh padosi kisan hi bata sakta hai.
 *
 * NIJTA
 *   Naam ke saath sirf pehla naam aur jila dikhta hai. Phone kabhi nahi.
 *   Login zaroori hai likhne ke liye — warna spam aur jhoothi salah bhar
 *   jaati hai, aur kheti ki galat salah se kisan ka paisa jata hai.
 *
 * Padhne ke liye login zaroori nahi — soochna sabke liye khuli hai.
 * ========================================================================= */

'use strict';

const store = require('./_store');

const KEY = 'km:community';
const EDIT_KEY = 'km:community_edit';
const MAX = 300;
const MAX_TEXT = 1200;

function clean(v, max) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max || 200);
}

/* Login kiska hai — api/auth.js wali hi session cookie */
async function userFor(req) {
  try {
    const raw = req.headers.cookie || '';
    const c = Object.fromEntries(raw.split(';').filter(Boolean).map((v) => {
      const i = v.indexOf('=');
      return [v.slice(0, i).trim(), decodeURIComponent(v.slice(i + 1))];
    }));
    if (!c.krashi_session) return null;
    if (!process.env.MONGODB_URI) return null;

    const { MongoClient } = require('mongodb');
    if (!global.__kmCommunityClient) {
      global.__kmCommunityClient = new MongoClient(process.env.MONGODB_URI).connect();
    }
    const cl = await global.__kmCommunityClient;
    const d = cl.db(process.env.MONGODB_DB || 'krashi_mitra');
    const s = await d.collection('sessions').findOne({
      token: c.krashi_session, expiresAt: { $gt: new Date() },
    });
    if (!s) return null;
    const u = await d.collection('users').findOne({ _id: s.userId });
    if (!u) return null;
    return { id: String(u._id), name: u.name || '', district: u.district || '' };
  } catch (_) { return null; }
}

/** Bahar jaane wala roop — yahan se phone ya poora naam kabhi nahi jata */
function publicRow(p, meId) {
  return {
    id: p.id,
    type: p.type,
    parentId: p.parentId || null,
    crop: p.crop || '',
    district: p.district || '',
    text: p.text,
    authorName: (p.authorName || '').split(' ')[0] || 'किसान',
    at: p.at,
    helpful: (p.helpful || []).length,
    iFoundHelpful: meId ? (p.helpful || []).indexOf(meId) !== -1 : false,
    mine: meId ? p.authorId === meId : false,
    resolved: Boolean(p.resolved),
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    const me = await userFor(req);

    /* Badlav (kaam aaya / hal ho gaya / hataya) alag rakhe jate hain, kyunki
       list me seedha likhna nahi hota. Padhte waqt jod dete hain — warna
       "kaam aaya" dabane ka koi asar hi na dikhe. */
    const [baseRows, edits] = await Promise.all([
      store.listAll(KEY, MAX),
      store.hashAll(EDIT_KEY),
    ]);
    const rows = baseRows.map((p) => (p && edits[p.id]) ? edits[p.id] : p);

    /* ---------------- GET ---------------- */
    if (req.method === 'GET') {
      const q = req.query || {};
      const crop = clean(q.crop, 40).toLowerCase();
      const district = clean(q.district, 80).toLowerCase();

      let live = rows.filter((p) => p && !p.deleted);
      if (crop) live = live.filter((p) => !p.crop || p.crop === crop || p.type === 'answer');
      if (district && q.near === '1') {
        live = live.filter((p) => (p.district || '').toLowerCase() === district || p.type === 'answer');
      }

      const questions = live.filter((p) => p.type === 'question');
      const answers = live.filter((p) => p.type === 'answer');

      /* Har sawal ke saath uske jawab — app ko dobara call na karni pade */
      const out = questions.map((qq) => {
        const mine = answers.filter((a) => a.parentId === qq.id)
          .sort((a, b) => (b.helpful || []).length - (a.helpful || []).length);
        const row = publicRow(qq, me && me.id);
        row.answers = mine.map((a) => publicRow(a, me && me.id));
        row.answerCount = mine.length;
        return row;
      });

      return res.status(200).json({
        ok: true, storage: store.storageKind(), note: store.storageNote(),
        loggedIn: Boolean(me), count: out.length, posts: out,
      });
    }

    /* ---------------- POST ---------------- */
    if (req.method === 'POST') {
      if (!me) return res.status(401).json({ ok: false, error: 'login_zaroori' });

      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
      if (!body) return res.status(400).json({ ok: false, error: 'bad_body' });

      const type = body.type === 'answer' ? 'answer' : 'question';
      const text = clean(body.text, MAX_TEXT);
      if (text.length < 5) return res.status(400).json({ ok: false, error: 'bahut chhota' });

      const parentId = type === 'answer' ? clean(body.parentId, 40) : '';
      if (type === 'answer') {
        if (!parentId) return res.status(400).json({ ok: false, error: 'kis sawal ka jawab' });
        if (!rows.some((p) => p.id === parentId && !p.deleted)) {
          return res.status(404).json({ ok: false, error: 'sawal nahi mila' });
        }
      }

      const post = {
        id: store.newId(type === 'answer' ? 'ANS' : 'QUE'),
        type: type, parentId: parentId || null,
        crop: clean(body.crop, 40).toLowerCase(),
        district: clean(body.district, 80) || me.district || '',
        text: text,
        authorId: me.id,
        authorName: me.name,
        at: new Date().toISOString(),
        helpful: [], resolved: false, deleted: false,
      };
      await store.listPush(KEY, post, MAX);
      return res.status(201).json({ ok: true, post: publicRow(post, me.id) });
    }

    /* ---------------- PATCH: kaam aaya / hal ho gaya ---------------- */
    if (req.method === 'PATCH') {
      if (!me) return res.status(401).json({ ok: false, error: 'login_zaroori' });
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
      const id = body && clean(body.id, 40);
      const action = body && clean(body.action, 20);
      const p = rows.find((x) => x.id === id && !x.deleted);
      if (!p) return res.status(404).json({ ok: false, error: 'nahi mila' });

      if (action === 'helpful') {
        p.helpful = p.helpful || [];
        const i = p.helpful.indexOf(me.id);
        /* Apni hi baat ko "kaam aaya" nahi keh sakte */
        if (p.authorId === me.id) return res.status(400).json({ ok: false, error: 'apni baat par nahi' });
        if (i === -1) p.helpful.push(me.id); else p.helpful.splice(i, 1);
      } else if (action === 'resolve') {
        if (p.authorId !== me.id) return res.status(403).json({ ok: false, error: 'sirf poochne wala' });
        p.resolved = !p.resolved;
      } else {
        return res.status(400).json({ ok: false, error: 'action galat' });
      }

      await store.hashSet(EDIT_KEY, p.id, p);
      return res.status(200).json({ ok: true, post: publicRow(p, me.id) });
    }

    /* ---------------- DELETE: apni hi baat ---------------- */
    if (req.method === 'DELETE') {
      if (!me) return res.status(401).json({ ok: false, error: 'login_zaroori' });
      const id = clean((req.query && req.query.id) || '', 40);
      const p = rows.find((x) => x.id === id);
      if (!p) return res.status(404).json({ ok: false, error: 'nahi mila' });
      if (p.authorId !== me.id) return res.status(403).json({ ok: false, error: 'sirf apni baat' });

      p.deleted = true;
      p.text = '';
      await store.hashSet(EDIT_KEY, p.id, p);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  } catch (err) {
    console.error('[community]', err);
    return res.status(500).json({ ok: false, error: 'server_error',
                                  detail: String(err && err.message).slice(0, 200) });
  }
};
