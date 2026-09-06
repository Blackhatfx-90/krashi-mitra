/* ============================================================================
 * js/auth.js — Login / Signup ka kaam
 *
 * ⚠️ SABSE ZAROORI BAAT — YEH DEMO AUTH HAI, ASLI SURAKSHA NAHI ⚠️
 *
 * Yeh poora login SIRF browser me chalta hai (localStorage). Koi server nahi,
 * koi database nahi. Iska matlab:
 *
 *   - Koi bhi banda browser ka console kholkar data dekh/badal sakta hai
 *   - Ek phone ka account doosre phone par nahi milega
 *   - Yeh kisi bhi asli/niji jaankari ki hifazat NAHI karta
 *
 * SIH demo aur viva ke liye yeh theek hai (poora flow dikh jata hai), par asli
 * kisanon ke saath chalane se PEHLE server-side auth lagana zaroori hai —
 * jaise Firebase Auth, Supabase, ya apna backend + JWT.
 *
 * Password plain text me nahi rakha jata (SHA-256 hash hota hai), par yeh bhi
 * asli suraksha nahi hai — sirf itna hai ki localStorage kholne par password
 * seedha na dikhe.
 *
 * GOOGLE LOGIN:
 *   Asli Google Sign-In chalane ke liye ek Client ID chahiye:
 *     1. https://console.cloud.google.com -> APIs & Services -> Credentials
 *     2. Create OAuth client ID -> Web application
 *     3. "Authorized JavaScript origins" me apna domain daalein:
 *          https://krashi-mitrasih.vercel.app
 *     4. Jo Client ID mile use neeche GOOGLE_CLIENT_ID me paste kar dein
 *   Khali chhod dein to button saaf bata dega ki setup baaki hai — jhootha
 *   "login ho gaya" nahi dikhayega.
 * ========================================================================= */

'use strict';

/* Yahan apna Google OAuth Client ID paste karein (khali = Google login band) */
const GOOGLE_CLIENT_ID = '';

const AUTH_KEY = 'kisansathi.users.v1';
const SESSION_KEY = 'kisansathi.session.v1';
const APP_URL = '/app';

/* ---------------------------------------------------------------------------
 * Chhote helpers
 * ------------------------------------------------------------------------- */
function readUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || '{}'); }
  catch (_) { return {}; }
}
function writeUsers(u) {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(u)); } catch (_) {}
}

/** Password ko seedha na rakhein — SHA-256 hash. (Asli suraksha nahi, upar padhein.) */
async function hashPassword(pwd) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (_) {
    return 'plain:' + pwd;      // bahut purane browser — tab bhi kaam chale
  }
}

function normalisePhone(p) {
  return String(p || '').replace(/\D/g, '').slice(-10);
}

function setSession(user) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      name: user.name, phone: user.phone, via: user.via || 'phone',
      at: new Date().toISOString(),
    }));
  } catch (_) {}
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch (_) { return null; }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
}
window.kisanSathiSession = getSession;
window.kisanSathiLogout = () => { clearSession(); location.href = '/'; };

/* Form ke upar chhota sandesh — alert() se behtar */
function showAuthMsg(form, text, kind) {
  if (!form) return;
  let box = form.querySelector('.auth-msg');
  if (!box) {
    box = document.createElement('p');
    box.className = 'auth-msg';
    form.insertBefore(box, form.firstChild);
  }
  box.textContent = text;
  box.dataset.kind = kind || 'error';
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------------------------------------------------------------------------
 * SIGN UP
 * ------------------------------------------------------------------------- */
function initSignup() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = (form.querySelector('#signup-name') || {}).value || '';
    const phoneRaw = (form.querySelector('#signup-phone') || {}).value || '';
    const pwd = (form.querySelector('#signup-password') || {}).value || '';
    const pwd2 = (form.querySelector('#signup-confirm-password') || {}).value || '';
    const phone = normalisePhone(phoneRaw);

    if (!name.trim()) return showAuthMsg(form, 'कृपया अपना नाम भरें।');
    if (phone.length !== 10) return showAuthMsg(form, 'कृपया 10 अंकों का सही मोबाइल नंबर भरें।');
    if (pwd.length < 6) return showAuthMsg(form, 'पासवर्ड कम से कम 6 अक्षर का रखें।');
    if (pwd !== pwd2) return showAuthMsg(form, 'दोनों पासवर्ड एक जैसे नहीं हैं।');

    const users = readUsers();
    if (users[phone]) {
      return showAuthMsg(form, 'यह नंबर पहले से जुड़ा है। कृपया लॉगिन करें।');
    }

    users[phone] = { name: name.trim(), phone: phone, pass: await hashPassword(pwd), via: 'phone' };
    writeUsers(users);
    setSession(users[phone]);

    showAuthMsg(form, 'खाता बन गया! ऐप खुल रहा है…', 'ok');
    setTimeout(() => { location.href = APP_URL; }, 700);
  });
}

/* ---------------------------------------------------------------------------
 * LOGIN
 * ------------------------------------------------------------------------- */
function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = normalisePhone((form.querySelector('#login-phone') || {}).value);
    const pwd = (form.querySelector('#login-password') || {}).value || '';

    if (phone.length !== 10) return showAuthMsg(form, 'कृपया 10 अंकों का सही मोबाइल नंबर भरें।');
    if (!pwd) return showAuthMsg(form, 'कृपया पासवर्ड भरें।');

    const users = readUsers();
    const user = users[phone];
    if (!user) {
      return showAuthMsg(form, 'यह नंबर मिला नहीं। पहले "नया खाता बनाएँ"।');
    }
    if (user.pass !== await hashPassword(pwd)) {
      return showAuthMsg(form, 'पासवर्ड गलत है। दोबारा कोशिश करें।');
    }

    setSession(user);
    showAuthMsg(form, 'स्वागत है, ' + user.name + '! ऐप खुल रहा है…', 'ok');
    setTimeout(() => { location.href = APP_URL; }, 700);
  });
}

/* ---------------------------------------------------------------------------
 * GOOGLE SIGN-IN
 * Client ID na ho to jhootha "login ho gaya" NAHI dikhate — saaf batate hain.
 * ------------------------------------------------------------------------- */
function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(part).split('').map(
      (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (_) { return null; }
}

function onGoogleCredential(response) {
  const info = decodeJwtPayload(response && response.credential);
  const form = document.getElementById('login-form') || document.getElementById('signup-form');

  if (!info || !info.email) {
    return showAuthMsg(form, 'Google से जानकारी नहीं मिल पाई। कृपया दोबारा कोशिश करें।');
  }

  const key = 'g:' + info.email;
  const users = readUsers();
  users[key] = { name: info.name || info.email, phone: '', email: info.email, via: 'google' };
  writeUsers(users);
  setSession(users[key]);

  showAuthMsg(form, 'स्वागत है, ' + users[key].name + '! ऐप खुल रहा है…', 'ok');
  setTimeout(() => { location.href = APP_URL; }, 700);
}

function initGoogle() {
  const btns = [document.getElementById('login-google-btn'),
                document.getElementById('signup-google-btn')].filter(Boolean);
  if (!btns.length) return;

  if (!GOOGLE_CLIENT_ID) {
    btns.forEach((b) => {
      b.addEventListener('click', () => {
        const form = b.closest('form') || document.querySelector('.auth-form');
        showAuthMsg(form,
          'Google लॉगिन अभी सेट नहीं है। js/auth.js में GOOGLE_CLIENT_ID भरना बाकी है। ' +
          'तब तक मोबाइल नंबर से लॉगिन करें।', 'info');
      });
    });
    console.info('[auth] Google login band hai — js/auth.js me GOOGLE_CLIENT_ID bharein');
    return;
  }

  /* Google Identity Services script sirf tab load karte hain jab ID mili ho */
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true; s.defer = true;
  s.onload = () => {
    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: onGoogleCredential,
      });
      btns.forEach((b) => b.addEventListener('click', () => google.accounts.id.prompt()));
      console.info('[auth] Google login taiyar');
    } catch (err) {
      console.warn('[auth] Google init fail:', err.message);
    }
  };
  s.onerror = () => console.warn('[auth] Google script load nahi hui (internet?)');
  document.head.appendChild(s);
}

/* ---------------------------------------------------------------------------
 * Pehle se logged-in ho to seedha app me bhej do
 * ------------------------------------------------------------------------- */
function redirectIfLoggedIn() {
  if (!/\/(login|signup)$|\/(login|signup)\.html$/.test(location.pathname)) return;
  if (getSession()) location.replace(APP_URL);
}

document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();
  initSignup();
  initLogin();
  initGoogle();
});
