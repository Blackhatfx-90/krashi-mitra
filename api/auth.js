const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

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
module.exports = async (req,res) => { res.setHeader('Content-Type','application/json'); try { const d=await db(); const action=req.query.action; const input=await body(req);
  if(req.method==='POST' && action==='signup'){ const email=String(input.email||'').trim().toLowerCase(), phone=String(input.phone||'').replace(/\D/g,'').slice(-10), password=String(input.password||''); if(!email||phone.length!==10||password.length<8) return res.status(400).json({error:'नाम, ईमेल, 10 अंकों का मोबाइल और कम से कम 8 अक्षर का पासवर्ड जरूरी है।'}); const exists=await d.collection('users').findOne({$or:[{email},{phone}]}); if(exists) return res.status(409).json({error:'यह ईमेल या मोबाइल पहले से पंजीकृत है।'}); const now=new Date(), user={name:String(input.name).trim(),email,phone,passwordHash:await bcrypt.hash(password,12),authProvider:'password',profile:null,createdAt:now,updatedAt:now}; const r=await d.collection('users').insertOne(user); const t=token(); await d.collection('sessions').insertOne({token:t,userId:r.insertedId,expiresAt:new Date(Date.now()+2592000000)}); setCookie(res,t); return res.status(201).json({user:{name:user.name,email,phone},profileComplete:false}); }
  if(req.method==='POST' && action==='login'){ const email=String(input.email||'').trim().toLowerCase(), password=String(input.password||''); const user=await d.collection('users').findOne({email}); if(!user || !user.passwordHash || !(await bcrypt.compare(password,user.passwordHash))) return res.status(401).json({error:'ईमेल या पासवर्ड गलत है।'}); const t=token(); await d.collection('sessions').insertOne({token:t,userId:user._id,expiresAt:new Date(Date.now()+2592000000)}); setCookie(res,t); return res.json({user:{name:user.name,email:user.email,phone:user.phone},profileComplete:Boolean(user.profile)}); }
  if(req.method==='GET' && action==='session'){ const user=await userFor(req); if(!user) return res.status(401).json({authenticated:false}); return res.json({authenticated:true,user:{name:user.name,email:user.email,phone:user.phone},profile:user.profile||null,language:user.language||null}); }
  if(req.method==='POST' && action==='profile'){ const user=await userFor(req); if(!user) return res.status(401).json({error:'सत्र समाप्त हो गया।'}); const land=Number(input.landAmount); if(!input.village||!input.state||!/^[0-9]{6}$/.test(String(input.pin||''))||!Number.isFinite(land)||land<=0) return res.status(400).json({error:'कृपया गांव, राज्य, सही PIN और जमीन की मात्रा भरें।'}); const profile={village:String(input.village).trim(),state:String(input.state),pin:String(input.pin),landAmount:land,landUnit:String(input.landUnit||'acre'),updatedAt:new Date()}; await d.collection('users').updateOne({_id:user._id},{$set:{profile,updatedAt:new Date()}}); return res.json({profile}); }
  /* Chuni hui bhasha account ke saath sambhal lete hain, taaki naya phone
     ya dobara login karne par kisan ko phir se na chunni pade. */
  if(req.method==='POST' && action==='language'){ const user=await userFor(req); if(!user) return res.status(401).json({error:'सत्र समाप्त हो गया।'}); const lang=String(input.language||'').trim(); if(!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(lang)) return res.status(400).json({error:'भाषा कोड सही नहीं है।'}); await d.collection('users').updateOne({_id:user._id},{$set:{language:lang,updatedAt:new Date()}}); return res.json({language:lang}); }

  if(req.method==='POST' && action==='logout'){ const c=cookies(req); if(c.krashi_session) await d.collection('sessions').deleteOne({token:c.krashi_session}); clearCookie(res); return res.json({ok:true}); }
  return res.status(404).json({error:'Not found'});
 } catch(e){ console.error('[v0] auth error',e); return res.status(500).json({error:'Server configuration or database error.'}); } }; 
