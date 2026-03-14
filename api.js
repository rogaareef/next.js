// Gemini 1.5 Flash — Free tier proxy (no billing required)
const MODEL = 'gemini-1.5-flash';
const ipMap = new Map();

function rateOk(ip) {
  const now = Date.now();
  const hits = (ipMap.get(ip) || []).filter(t => now - t < 60000);
  hits.push(now);
  ipMap.set(ip, hits);
  if (ipMap.size > 5000) for (const [k,v] of ipMap) if (!v.some(t=>now-t<60000)) ipMap.delete(k);
  return hits.length <= 20;
}

const H = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'Content-Type',
  'Access-Control-Allow-Methods':'POST,OPTIONS',
  'Content-Type':'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return {statusCode:200,headers:H,body:''};
  if (event.httpMethod !== 'POST') return {statusCode:405,headers:H,body:JSON.stringify({error:'Method not allowed'})};

  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim()||'x';
  if (!rateOk(ip)) return {statusCode:429,headers:H,body:JSON.stringify({error:'Too many requests. Wait 60s.'})};

  let body;
  try { body = JSON.parse(event.body||'{}'); } catch { return {statusCode:400,headers:H,body:JSON.stringify({error:'Bad JSON'})}; }

  const {prompt} = body;
  if (!prompt||typeof prompt!=='string'||prompt.length>6000)
    return {statusCode:400,headers:H,body:JSON.stringify({error:'Invalid prompt'})};

  const key = process.env.GEMINI_API_KEY;
  if (!key) return {statusCode:500,headers:H,body:JSON.stringify({error:'API not configured'})};

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {method:'POST',headers:{'Content-Type':'application/json'},
       body:JSON.stringify({
         contents:[{role:'user',parts:[{text:prompt}]}],
         generationConfig:{maxOutputTokens:1800,temperature:0.8,topP:0.9}
       })}
    );
    if (!r.ok) {
      const e = await r.json().catch(()=>({}));
      return {statusCode:r.status,headers:H,body:JSON.stringify({error:e?.error?.message||'AI error'})};
    }
    const d = await r.json();
    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text||'';
    if (!text) return {statusCode:500,headers:H,body:JSON.stringify({error:'Empty response'})};
    return {statusCode:200,headers:H,body:JSON.stringify({result:text})};
  } catch(e) {
    return {statusCode:500,headers:H,body:JSON.stringify({error:'Server error'})};
  }
};
