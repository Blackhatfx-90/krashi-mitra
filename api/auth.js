const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const rateLimit = require('./_ratelimit');

let clientPromise;
function client() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  if (!clientPromise) clientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  return clientPromise;
}
function cookies(req) { return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(v => { const i=v.indexOf('='); return [v.slice(0,i).trim(), decodeURIComponent(v.slice(i+1))]; })); }
function token() { return require('crypto').randomBytes(32).toString('hex'); }
function setCookie(res, value) { res.setHeader('Set-Cookie', `krashi_session=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`); }
function clearCookie(res) { res.setHeader('Set-Cookie', 'krashi_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'); }
function body(req) { return new Promise((resolve,reject)=>{ let s=''; req.on('data',c=>s+=c); req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}}); }); }
async function db() { return (await client()).db(process.env.MONGODB_DB || 'krashi_mitra'); }
async function userFor(req) { const c=cookies(req); if(!c.krashi_session) return null; const d=await db(); const session=await d.collection('sessions').findOne({token:c.krashi_session, expiresAt:{$gt:new Date()}}); return session ? d.collection('users').findOne({_id:session.userId}) : null; }
/* ---------------------------------------------------------------------------
 * PASSWORD AAZMANE KI SEEMA
 *
 * login par koi ginti nahi thi. Yani ek script ek hi email par hazaron
 * password aazma sakti thi — kisan ke khate me ghusne ke liye koi aur
 * rukawat hai hi nahi (na OTP, na captcha). bcrypt dheema zaroor hai, par
 * dheema hona rok nahi hai.
 *
 * 10 galat koshish / 15 minute / IP. Jo aadmi apna hi password bhool gaya
 * hai wo 3-4 baar me yaad kar leta hai; 10 usse kaafi upar hai.
 *
 * SIRF GALAT koshish ginti hai — sahi password par ginti nahi badhti,
 * warna ek ghar ke kai log ek hi phone se login karein to aapas me hi
 * atak jaate.
 *
 * signup par bhi seema hai, warna ek script hazaron farzi khate bana kar
 * database bhar de.
 * ------------------------------------------------------------------------- */
const LOGIN_TRIES = 10, LOGIN_WINDOW = 900;      // 15 minute
const SIGNUP_TRIES = 5, SIGNUP_WINDOW = 3600;    // 1 ghanta

module.exports = async (req,res) => { res.setHeader('Content-Type','application/json'); try { const d=await db(); const action=req.query.action; const input=await body(req);
  if(req.method==='POST' && (action==='login'||action==='signup')){
    const isLogin = action==='login';
    const r = await rateLimit.count(req, isLogin?'login':'signup',
                                    isLogin?LOGIN_TRIES:SIGNUP_TRIES,
                                    isLogin?LOGIN_WINDOW:SIGNUP_WINDOW);
    if(!r.ok){
      res.setHeader('Retry-After', String(r.retryAfter));
      return res.status(429).json({ error: isLogin
        ? 'बहुत बार गलत पासवर्ड डाला गया है। कृपया कुछ मिनट बाद दोबारा कोशिश कीजिए।'
        : 'बहुत सारे खाते बनाने की कोशिश हुई है। कृपया थोड़ी देर बाद कोशिश कीजिए।',
        retryAfter: r.retryAfter });
    }
  }
  if(req.method==='POST' && action==='signup'){ const email=String(input.email||'').trim().toLowerCase(), phone=String(input.phone||'').replace(/\D/g,'').slice(-10), password=String(input.password||''); if(!email||phone.length!==10||password.length<8) return res.status(400).json({error:'नाम, ईमेल, 10 अंकों का मोबाइल और कम से कम 8 अक्षर का पासवर्ड जरूरी है।'}); const exists=await d.collection('users').findOne({$or:[{email},{phone}]}); if(exists) return res.status(409).json({error:'यह ईमेल या मोबाइल पहले से पंजीकृत है।'}); const now=new Date(), user={name:String(input.name).trim(),email,phone,passwordHash:await bcrypt.hash(password,12),authProvider:'password',profile:null,createdAt:now,updatedAt:now}; const r=await d.collection('users').insertOne(user); const t=token(); await d.collection('sessions').insertOne({token:t,userId:r.insertedId,expiresAt:new Date(Date.now()+2592000000)}); setCookie(res,t); await rateLimit.note(req,'signup',SIGNUP_WINDOW); return res.status(201).json({user:{name:user.name,email,phone},profileComplete:false}); }
  if(req.method==='POST' && action==='login'){ const email=String(input.email||'').trim().toLowerCase(), password=String(input.password||''); const user=await d.collection('users').findOne({email}); if(!user) { await rateLimit.note(req,'login',LOGIN_WINDOW); return res.status(401).json({error:'ईमेल या पासवर्ड गलत है।'}); } if(!user.passwordHash) return res.status(409).json({error:'यह खाता Google से बना है और अभी इसका पासवर्ड सेट नहीं हुआ। कृपया एक बार Google से लॉगिन करके पासवर्ड बनाएँ।',needsGoogle:true}); if(!(await bcrypt.compare(password,user.passwordHash))) { await rateLimit.note(req,'login',LOGIN_WINDOW); return res.status(401).json({error:'ईमेल या पासवर्ड गलत है।'}); } const t=token(); await d.collection('sessions').insertOne({token:t,userId:user._id,expiresAt:new Date(Date.now()+2592000000)}); setCookie(res,t); return res.json({user:{name:user.name,email:user.email,phone:user.phone},profileComplete:Boolean(user.profile)}); }
  if(req.method==='GET' && action==='session'){ const user=await userFor(req); if(!user) return res.status(401).json({authenticated:false}); return res.json({authenticated:true,user:{name:user.name,email:user.email,phone:user.phone},profile:user.profile||null,language:user.language||null,needsPassword:!user.passwordHash,authProvider:user.authProvider||'password'}); }
  /* PROFILE — ab do kisht me bhi bhara ja sakta hai.
   *
   * Pehle yeh sab kuch EK saath maangta tha (gaon + rajya + PIN + zameen).
   * Naya onboarding ise do form me baantta hai — pehle apni jankari, phir
   * anumatiyan, phir zameen — kyunki ek hi bar 8 khane dikhne par kisan
   * wahin chhod deta hai. Isliye `step` aaya:
   *     step:'personal'  -> gaon/zila/rajya (zameen nahi maangte)
   *     step:'land'      -> sirf zameen
   *     step nadarad     -> purana vyavhaar, sab ek saath (kuch nahi toota)
   * Har kisht purani profile ke UPAR likhi jati hai, use mitati nahi.
   */
  if(req.method==='POST' && action==='profile'){
    const user=await userFor(req); if(!user) return res.status(401).json({error:'सत्र समाप्त हो गया।'});
    const old=user.profile||{};
    const step=String(input.step||'');
    const str=(v,n)=>String(v==null?'':v).trim().slice(0,n||80);
    const land=Number(input.landAmount);
    const pin=String(input.pin||'');

    if(step==='personal'){
      if(!input.village||!input.state) return res.status(400).json({error:'कृपया गाँव और राज्य भरें।'});
      if(pin && !/^[0-9]{6}$/.test(pin)) return res.status(400).json({error:'PIN 6 अंकों का होना चाहिए।'});
    } else if(step==='land'){
      if(!Number.isFinite(land)||land<=0) return res.status(400).json({error:'कृपया ज़मीन की मात्रा भरें।'});
    } else {
      if(!input.village||!input.state||!/^[0-9]{6}$/.test(pin)||!Number.isFinite(land)||land<=0)
        return res.status(400).json({error:'कृपया गांव, राज्य, सही PIN और जमीन की मात्रा भरें।'});
    }

    const profile=Object.assign({},old,{updatedAt:new Date()});
    if(step!=='land'){
      if(input.village!=null)  profile.village=str(input.village);
      if(input.district!=null) profile.district=str(input.district);
      if(input.state!=null)    profile.state=str(input.state,60);
      if(pin)                  profile.pin=pin;
      if(input.firstName!=null) profile.firstName=str(input.firstName,60);
      if(input.surname!=null)   profile.surname=str(input.surname,60);
    }
    if(step!=='personal'){
      if(Number.isFinite(land)&&land>0){ profile.landAmount=land; profile.landUnit=str(input.landUnit||'acre',20); }
    }

    const set={profile,updatedAt:new Date()};
    /* Naam Form 1 se aata hai. Google wale khate me Google ka naam hota hai,
       par kisan apna naam badal sakta hai — isliye user.name bhi update. */
    const full=[str(input.firstName,60),str(input.surname,60)].filter(Boolean).join(' ');
    if(full) set.name=full;
    /* Phone: 10 ank. Pehle se kisi aur ka ho to chhupke se nahi badalte. */
    const ph=String(input.phone||'').replace(/\D/g,'').slice(-10);
    if(ph.length===10 && ph!==user.phone){
      const taken=await d.collection('users').findOne({phone:ph,_id:{$ne:user._id}});
      if(taken) return res.status(409).json({error:'यह मोबाइल नंबर पहले से किसी और खाते पर है।'});
      set.phone=ph;
    }

    await d.collection('users').updateOne({_id:user._id},{$set:set});
    return res.json({profile,name:set.name||user.name,phone:set.phone||user.phone});
  }
  /* Chuni hui bhasha account ke saath sambhal lete hain, taaki naya phone
     ya dobara login karne par kisan ko phir se na chunni pade. */
  if(req.method==='POST' && action==='language'){ const user=await userFor(req); if(!user) return res.status(401).json({error:'सत्र समाप्त हो गया।'}); const lang=String(input.language||'').trim(); if(!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(lang)) return res.status(400).json({error:'भाषा कोड सही नहीं है।'}); await d.collection('users').updateOne({_id:user._id},{$set:{language:lang,updatedAt:new Date()}}); return res.json({language:lang}); }

  /* Google se bane khate me password nahi hota. Yahan wo ek baar set hota
     hai, taaki aage se email+password se bhi login kiya ja sake (Google na
     chale tab bhi kisan andar aa sake). Pehle se password ho to yeh action
     kuch nahi karta — chupke se badalne ka raasta nahi dena chahiye. */
  if(req.method==='POST' && action==='set-password'){ const user=await userFor(req); if(!user) return res.status(401).json({error:'सत्र समाप्त हो गया।'}); if(user.passwordHash) return res.status(409).json({error:'पासवर्ड पहले से बना हुआ है।'}); const password=String(input.password||''); if(password.length<8) return res.status(400).json({error:'पासवर्ड कम से कम 8 अक्षर का होना चाहिए।'}); await d.collection('users').updateOne({_id:user._id},{$set:{passwordHash:await bcrypt.hash(password,12),updatedAt:new Date()}}); return res.json({ok:true}); }

  if(req.method==='POST' && action==='logout'){ const c=cookies(req); if(c.krashi_session) await d.collection('sessions').deleteOne({token:c.krashi_session}); clearCookie(res); return res.json({ok:true}); }
  return res.status(404).json({error:'Not found'});
 } catch(e){ console.error('[v0] auth error',e); return res.status(500).json({error:'Server configuration or database error.'}); } }; 
