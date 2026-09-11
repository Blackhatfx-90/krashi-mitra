/* ============================================================================
 * KRASHI MITRA — KISAN CHAUPAL (samudaay)
 * js/community.js
 *
 * KYUN
 *   Har sawal ka jawab model nahi de sakta. "Is ilaake me kaun sa beej chala?"
 *   "yeh dawa kahan milti hai?" "aapke yahan bhi patti peeli ho rahi hai?" —
 *   yeh padosi kisan hi bata sakta hai. Gaon me yeh baat chaupal par hoti
 *   thi; app me uski jagah khali padi thi.
 *
 * NIJTA
 *   Sirf pehla naam aur jila dikhta hai. Phone kabhi nahi. Kisan apni hi
 *   likhi baat kabhi bhi hata sakta hai.
 *
 * LOGIN
 *   Padhne ke liye nahi chahiye — soochna sabke liye khuli hai. Likhne ke
 *   liye chahiye, warna spam aur jhoothi salah bhar jaati hai. Kheti ki
 *   galat salah se kisan ka paisa aur poori fasal jaati hai.
 *
 * OFFLINE
 *   Aakhri baar padhi hui baatein cache me rehti hain, to bina network ke
 *   bhi padhi ja sakti hain. Likhne ke liye network chahiye — aur wo saaf
 *   likh kar batate hain, chupchaap fail nahi hote.
 * ========================================================================= */

(function () {
  'use strict';

  const CACHE_KEY = 'km.community.cache.v1';
  const SEEN_KEY  = 'km.community.seen.v1';
  const PREFS_KEY = 'km.preferences.v1';
  const ENDPOINT  = 'api/community';

  const D = { posts: [], loggedIn: false, loading: false, error: '', el: {} };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  const ico = (n, c) => (typeof icon === 'function' ? icon(n, c) : '');

  function read(k, d) {
    try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; }
    catch (_) { return d; }
  }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }

  function prefs() { return read(PREFS_KEY, {}); }
  function cropNow() {
    try { return (typeof state === 'object' && state && state.cropId) || ''; } catch (_) { return ''; }
  }

  /* Kitna purana — "2 ghante pehle" padhna tareekh se aasan hai */
  function ago(iso) {
    const ms = Date.now() - Date.parse(iso || '');
    if (!isFinite(ms)) return '';
    const m = Math.round(ms / 60000);
    if (m < 1) return 'अभी';
    if (m < 60) return m + ' मिनट पहले';
    const h = Math.round(m / 60);
    if (h < 24) return h + ' घंटे पहले';
    const d = Math.round(h / 24);
    return d < 30 ? d + ' दिन पहले' : new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  }

  /* ---------------------------------------------------------------------
   * Server se
   * ------------------------------------------------------------------- */
  async function load(opts) {
    const o = opts || {};
    D.loading = true; D.error = ''; render();
    try {
      const p = prefs();
      const qs = [];
      if (o.crop !== false && cropNow()) qs.push('crop=' + encodeURIComponent(cropNow()));
      if (o.near && p.district) { qs.push('district=' + encodeURIComponent(p.district), 'near=1'); }

      const r = await fetch(ENDPOINT + (qs.length ? '?' + qs.join('&') : ''), { cache: 'no-store' });
      if (!r.ok) throw new Error('http_' + r.status);
      const d = await r.json();
      if (!d || !d.ok) throw new Error('bad_reply');

      D.posts = d.posts || [];
      D.loggedIn = Boolean(d.loggedIn);
      write(CACHE_KEY, { at: Date.now(), posts: D.posts });
      notifyReplies(D.posts);
    } catch (err) {
      /* Network gaya — purana dikha dete hain, khali screen se accha hai */
      const c = read(CACHE_KEY, null);
      D.posts = (c && c.posts) || [];
      D.error = D.posts.length ? 'purana' : 'offline';
    }
    D.loading = false; render();
  }

  /* Apne sawal par naya jawab aaya to hi soochna — baki sab shor hai */
  function notifyReplies(posts) {
    if (!window.kmNotify) return;
    const seen = read(SEEN_KEY, {});
    let changed = false;

    posts.forEach((q) => {
      if (!q.mine) return;
      const n = q.answerCount || 0;
      const was = seen[q.id] || 0;
      if (n <= was) { if (was !== n) { seen[q.id] = n; changed = true; } return; }

      window.kmNotify.push({
        id: 'comm:' + q.id + ':' + n,
        category: 'community',
        severity: 'info',
        title: 'आपके सवाल पर ' + (n - was) + ' नया जवाब',
        body: (q.text || '').slice(0, 90),
      });
      seen[q.id] = n; changed = true;
    });

    if (changed) write(SEEN_KEY, seen);
  }

  async function send(body) {
    const r = await fetch(ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => null);
    return { ok: r.ok && d && d.ok, status: r.status, data: d };
  }

  async function ask(text) {
    const p = prefs();
    return send({ type:'question', text: text, crop: cropNow(), district: p.district || '' });
  }
  async function answer(parentId, text) {
    return send({ type:'answer', parentId: parentId, text: text });
  }

  async function act(id, action) {
    const r = await fetch(ENDPOINT, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, action: action }),
    });
    return r.ok;
  }
  async function remove(id) {
    const r = await fetch(ENDPOINT + '?id=' + encodeURIComponent(id), { method: 'DELETE' });
    return r.ok;
  }

  /* ---------------------------------------------------------------------
   * Dikhana
   * ------------------------------------------------------------------- */
  function render() {
    const host = D.el.body;
    if (!host) return;

    if (D.loading && !D.posts.length) {
      host.innerHTML = '<p class="cm-empty">' + esc('चौपाल खुल रही है…') + '</p>';
      return;
    }

    const head =
      '<div class="cm-ask">' +
        (D.loggedIn
          ? '<textarea id="cmText" rows="2" maxlength="1200" placeholder="' +
              esc('अपने खेत की बात पूछें — जैसे "गेहूँ में पत्ती पीली हो रही है, किसी और के यहाँ भी?"') +
            '"></textarea>' +
            '<button type="button" class="btn btn--primary btn--sm" id="cmAsk">' +
              esc('पूछें') + '</button>'
          : '<p class="cm-login">' + ico('user','ic ic--xs') + ' ' +
              esc('पढ़ना सबके लिए खुला है। पूछने या जवाब देने के लिए लॉग इन करें।') +
            '</p>') +
      '</div>';

    const note = D.error === 'offline'
      ? '<p class="cm-note">' + ico('wifi-off','ic ic--xs') + ' ' +
          esc('इंटरनेट नहीं है — चौपाल अभी नहीं खुल पाई।') + '</p>'
      : D.error === 'purana'
      ? '<p class="cm-note">' + ico('wifi-off','ic ic--xs') + ' ' +
          esc('इंटरनेट नहीं है — पिछली बार की बातें दिख रही हैं।') + '</p>'
      : '';

    const list = D.posts.length
      ? '<ul class="cm-list">' + D.posts.map(questionHtml).join('') + '</ul>'
      : '<p class="cm-empty">' + esc('अभी कोई सवाल नहीं है। पहली बात आप ही शुरू करें।') + '</p>';

    host.innerHTML = head + note + list;
    wire();
  }

  function questionHtml(q) {
    return '<li class="cm-q' + (q.resolved ? ' is-done' : '') + '">' +
      '<div class="cm-q__head">' +
        '<span class="cm-who">' + esc(q.authorName) +
          (q.district ? ' · ' + esc(q.district) : '') + '</span>' +
        '<span class="cm-when">' + esc(ago(q.at)) + '</span>' +
      '</div>' +
      '<p class="cm-q__text">' + esc(q.text) + '</p>' +
      (q.resolved ? '<span class="cm-solved">' + esc('हल हो गया') + '</span>' : '') +

      '<div class="cm-actions">' +
        (q.mine
          ? '<button type="button" data-cm-resolve="' + esc(q.id) + '">' +
              esc(q.resolved ? 'फिर से खोलें' : 'हल हो गया') + '</button>' +
            '<button type="button" class="cm-del" data-cm-del="' + esc(q.id) + '">' +
              esc('हटाएँ') + '</button>'
          : '<button type="button" data-cm-helpful="' + esc(q.id) + '"' +
              (q.iFoundHelpful ? ' class="is-on"' : '') + '>' +
              esc('काम आया') + (q.helpful ? ' (' + q.helpful + ')' : '') + '</button>') +
        (D.loggedIn
          ? '<button type="button" data-cm-reply="' + esc(q.id) + '">' +
              esc('जवाब दें') + '</button>' : '') +
      '</div>' +

      (q.answers && q.answers.length
        ? '<ul class="cm-answers">' + q.answers.map((a) =>
            '<li class="cm-a">' +
              '<div class="cm-q__head"><span class="cm-who">' + esc(a.authorName) +
                (a.district ? ' · ' + esc(a.district) : '') + '</span>' +
                '<span class="cm-when">' + esc(ago(a.at)) + '</span></div>' +
              '<p class="cm-a__text">' + esc(a.text) + '</p>' +
              '<div class="cm-actions">' +
                (a.mine
                  ? '<button type="button" class="cm-del" data-cm-del="' + esc(a.id) + '">' +
                      esc('हटाएँ') + '</button>'
                  : '<button type="button" data-cm-helpful="' + esc(a.id) + '"' +
                      (a.iFoundHelpful ? ' class="is-on"' : '') + '>' +
                      esc('काम आया') + (a.helpful ? ' (' + a.helpful + ')' : '') + '</button>') +
              '</div>' +
            '</li>').join('') + '</ul>'
        : '') +

      '<div class="cm-reply" id="cmReply-' + esc(q.id) + '" hidden>' +
        '<textarea rows="2" maxlength="1200" placeholder="' +
          esc('अपने अनुभव से बताएँ — जो आपने खुद आज़माया हो') + '"></textarea>' +
        '<button type="button" class="btn btn--primary btn--sm" data-cm-send="' + esc(q.id) + '">' +
          esc('भेजें') + '</button>' +
      '</div>' +
    '</li>';
  }

  /* ---------- buttons ---------- */
  function wire() {
    const host = D.el.body;
    if (!host) return;

    const askBtn = host.querySelector('#cmAsk');
    if (askBtn) askBtn.addEventListener('click', async () => {
      const ta = host.querySelector('#cmText');
      const text = (ta.value || '').trim();
      if (text.length < 5) { ta.focus(); return; }
      askBtn.disabled = true;
      const r = await ask(text);
      askBtn.disabled = false;
      if (r.ok) { ta.value = ''; load(); }
      else alert(r.status === 401 ? 'पूछने के लिए लॉग इन करें।'
                                  : 'भेजी नहीं जा सकी — इंटरनेट देखें।');
    });

    host.querySelectorAll('[data-cm-reply]').forEach((b) =>
      b.addEventListener('click', () => {
        const box = host.querySelector('#cmReply-' + b.dataset.cmReply);
        if (box) { box.hidden = !box.hidden; if (!box.hidden) box.querySelector('textarea').focus(); }
      }));

    host.querySelectorAll('[data-cm-send]').forEach((b) =>
      b.addEventListener('click', async () => {
        const box = b.closest('.cm-reply');
        const ta = box.querySelector('textarea');
        const text = (ta.value || '').trim();
        if (text.length < 5) { ta.focus(); return; }
        b.disabled = true;
        const r = await answer(b.dataset.cmSend, text);
        b.disabled = false;
        if (r.ok) { ta.value = ''; load(); }
        else alert('जवाब भेजा नहीं जा सका — इंटरनेट देखें।');
      }));

    host.querySelectorAll('[data-cm-helpful]').forEach((b) =>
      b.addEventListener('click', async () => {
        b.disabled = true;
        if (await act(b.dataset.cmHelpful, 'helpful')) load();
        else { b.disabled = false; }
      }));

    host.querySelectorAll('[data-cm-resolve]').forEach((b) =>
      b.addEventListener('click', async () => {
        if (await act(b.dataset.cmResolve, 'resolve')) load();
      }));

    host.querySelectorAll('[data-cm-del]').forEach((b) =>
      b.addEventListener('click', async () => {
        if (!confirm('यह बात हटा दें? वापस नहीं आएगी।')) return;
        if (await remove(b.dataset.cmDel)) load();
        else alert('हटाई नहीं जा सकी।');
      }));
  }

  function init() {
    D.el.card = document.getElementById('communityCard');
    D.el.body = document.getElementById('communityBody');
    if (!D.el.body) return;
    /* Purana turant dikha do, phir taaza laao — khali screen se accha hai */
    const c = read(CACHE_KEY, null);
    if (c && c.posts) { D.posts = c.posts; render(); }
    setTimeout(() => load(), 1200);
  }

  window.kmCommunity = { load, ask, answer, act, remove, render,
                         get posts() { return D.posts; } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
