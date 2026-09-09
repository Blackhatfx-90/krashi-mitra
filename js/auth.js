'use strict';
const APP_URL='/app';
const api=(action, options={})=>fetch('/api/auth?action='+action, {headers:{'Content-Type':'application/json'},...options}).then(async r=>{const x=await r.json().catch(()=>({})); if(!r.ok) throw new Error(x.error||'अनुरोध पूरा नहीं हुआ।'); return x;});
function showAuthMsg(form,text,kind='error'){if(!form)return;let b=form.querySelector('.auth-msg');if(!b){b=document.createElement('p');b.className='auth-msg';form.prepend(b)}b.textContent=text;b.dataset.kind=kind}
function value(form,id){return String(form.querySelector('#'+id)?.value||'').trim()}
async function submitAuth(form, action){const email=value(form,action==='signup'?'signup-email':'login-email').toLowerCase(), password=value(form,action==='signup'?'signup-password':'login-password'); if(!email||!email.includes('@')) return showAuthMsg(form,'कृपया सही ईमेल भरें।'); if(password.length<8) return showAuthMsg(form,'पासवर्ड कम से कम 8 अक्षर का रखें।'); if(action==='signup'){const name=value(form,'signup-name'),phone=value(form,'signup-phone').replace(/\D/g,''); if(!name||phone.length!==10)return showAuthMsg(form,'नाम और 10 अंकों का मोबाइल नंबर जरूरी है।'); if(password!==value(form,'signup-confirm-password'))return showAuthMsg(form,'दोनों पासवर्ड एक जैसे नहीं हैं।');}
 try{const out=await api(action,{method:'POST',body:JSON.stringify({name:value(form,'signup-name'),phone:value(form,'signup-phone'),email,password})});showAuthMsg(form,'सफलता! प्रोफ़ाइल पूरी करने के लिए ऐप खुल रहा है…','ok');setTimeout(()=>location.href=APP_URL,400)}catch(e){showAuthMsg(form,e.message)}}
function init(){const signup=document.getElementById('signup-form'),login=document.getElementById('login-form'); signup?.addEventListener('submit',e=>{e.preventDefault();submitAuth(signup,'signup')}); login?.addEventListener('submit',e=>{e.preventDefault();submitAuth(login,'login')});  /* Google se login — /api/google par bhej dete hain. Wahan se Google ke
   login page par jaata hai aur wapas aakar session bana deta hai.
   Server par key na lagi ho to wo khud /login?error=... par wapas bhej dega. */
document.querySelectorAll('[id$="-google-btn"]').forEach(b=>b.addEventListener('click',()=>{
  b.disabled=true; b.style.opacity='.6';
  showAuthMsg(b.closest('form'),'Google पर ले जा रहे हैं…','info');
  window.location.href='/api/google';
}));

/* Google se wapas aane par agar kuch gadbad hui to yahan message dikhta hai */
(function(){
  const why=new URLSearchParams(location.search).get('error'); if(!why) return;
  const msg={ google_not_configured:'Google लॉगिन अभी चालू नहीं है (सर्वर पर सेटिंग बाकी है)।',
              google_disabled_client:'यह Google OAuth client बंद कर दिया गया है। Google Cloud Console में नया client बनाना होगा।',
              google_invalid_client:'Google client ID या secret गलत है।',
              google_redirect_uri_mismatch:'Google Console में redirect URI इस पते से मेल नहीं खाता।',
              state_mismatch:'सुरक्षा जाँच विफल — कृपया दोबारा कोशिश करें।',
              token_exchange_failed:'Google से बात नहीं हो पाई — दोबारा कोशिश करें।',
              email_not_verified:'इस Google खाते का ईमेल सत्यापित नहीं है।',
              no_email:'Google खाते से ईमेल नहीं मिला।' }[why]
            || 'लॉगिन पूरा नहीं हो पाया — दोबारा कोशिश करें।';
  const form=document.getElementById('login-form')||document.getElementById('signup-form');
  if(form) showAuthMsg(form,msg,'error');
})();}
document.addEventListener('DOMContentLoaded',init);

/* ---------------------------------------------------------------------------
 * NOTE — password dikhane/chhupane wala "aankh" button yahan JAAN-BOOJHKAR
 * nahi hai. Wo js/landing.js ke initPasswordToggles() me pehle se maujood hai
 * aur poora sahi kaam karta hai (type, dono icon, aria-label).
 *
 * Pehle yahan uski ek NAKAL thi. Dono handler ek hi click par chalte the —
 * ek password ko dikha deta, doosra turant wapas chhupa deta. Isliye user ko
 * lagta tha ki button toota hua hai. Ek hi jagah rakhna zaroori hai.
 * ------------------------------------------------------------------------- */
