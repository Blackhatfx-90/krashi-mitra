(() => {
  if (!/\/app(?:\.html)?$/.test(location.pathname)) return;
  const states = ['Andhra Pradesh','Bihar','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Madhya Pradesh','Maharashtra','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal','Other'];
  const esc = s => String(s||'').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  /* Teen alag jawab lautata hai — yeh farq ZAROORI hai:
       null       -> pakka pata hai ki login nahi hai   (401/403)
       'unknown'  -> pata hi nahi chala (internet nahi / server down)
       object     -> login hai
     Pehle yahan sirf null/object tha aur neeche har fail par /login bhej diya
     jaata tha. Iska matlab tha ki BINA INTERNET ke kisan app khol hi nahi
     sakta tha — jabki poori rog-pehchan offline chalti hai. Yahi is app ki
     sabse badi khaasiyat hai, isliye network fail hone par ab nahi rokte. */
  async function session(){
    try {
      const r = await fetch('/api/auth?action=session');
      if (r.status === 401 || r.status === 403) return null;
      if (!r.ok) return 'unknown';
      return await r.json();
    } catch (_) {
      return 'unknown';
    }
  }
  function render(u){ const modal=document.createElement('div'); modal.className='km-profile-modal'; modal.innerHTML=`<section class="km-profile-card" role="dialog" aria-modal="true"><h1>किसान प्रोफ़ाइल पूरी करें</h1><p>नमस्ते ${esc(u.name)}। सही सलाह और दवा की मात्रा के लिए ये जानकारी भरें।</p><form id="km-profile-form"><label>गांव / शहर<input name="village" required autocomplete="address-level2"></label><label>राज्य<select name="state" required><option value="">राज्य चुनें</option>${states.map(s=>`<option>${s}</option>`).join('')}</select></label><label>PIN code<input name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required placeholder="262001"></label><label>जमीन की मात्रा <button type="button" id="km-speak-land">आवाज़ से भरें</button><div class="km-land-row"><input name="landAmount" type="number" min="0.01" step="0.01" required placeholder="2.5"><select name="landUnit"><option value="acre">एकड़ / acre</option><option value="hectare">हेक्टेयर / hectare</option><option value="bigha">बीघा / bigha</option><option value="kanal">कनाल / kanal</option></select></div></label><p class="km-profile-error" aria-live="polite"></p><button class="km-profile-submit">प्रोफ़ाइल सेव करें</button></form></section>`; document.body.append(modal); const form=modal.querySelector('form'); modal.querySelector('#km-speak-land').onclick=()=>{ const R=window.SpeechRecognition||window.webkitSpeechRecognition; if(!R) return alert('इस फोन में आवाज़ पहचान उपलब्ध नहीं है। कृपया मात्रा लिखें।'); const r=new R(); r.lang='hi-IN'; r.onresult=e=>{ const text=e.results[0][0].transcript.replace(',','.'); const n=text.match(/[0-9]+(?:\.[0-9]+)?/); if(n) form.landAmount.value=n[0]; }; r.start(); }; form.onsubmit=async e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(form)); const r=await fetch('/api/auth?action=profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); const out=await r.json(); if(!r.ok) return modal.querySelector('.km-profile-error').textContent=out.error||'जानकारी सेव नहीं हुई।'; modal.remove();}; }
  session().then(s=>{
    if (s === 'unknown') return;                 // offline ya server down — app chalne do
    if (!s) { location.replace('/login'); return; }
    if (!s.profile) render(s.user);
  }).catch(() => { /* yahan aakar bhi kisan ko rokna nahi hai */ });
})();
