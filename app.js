/* AITools Bilingual — app.js */

// ── LANGUAGE ─────────────────────────────────────────
const L = {
  c: localStorage.getItem('ait_lang') || 'ar',
  set(l) {
    this.c = l;
    localStorage.setItem('ait_lang', l);
    const html = document.documentElement;
    html.lang = l;
    html.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.body.style.fontFamily = l === 'ar' ? "'Cairo','Syne',sans-serif" : "'Syne',sans-serif";
    document.querySelectorAll('[data-ar]').forEach(el => { el.textContent = l === 'ar' ? el.dataset.ar : el.dataset.en; });
    document.querySelectorAll('[data-ar-placeholder]').forEach(el => { el.placeholder = l === 'ar' ? el.dataset.arPlaceholder : el.dataset.enPlaceholder; });
    document.querySelectorAll('[data-ar-html]').forEach(el => { el.innerHTML = l === 'ar' ? el.dataset.arHtml : el.dataset.enHtml; });
    document.querySelectorAll('[data-ar-title]').forEach(el => { el.title = l === 'ar' ? el.dataset.arTitle : el.dataset.enTitle; });
    document.querySelectorAll('.lang-btn').forEach(b => { b.textContent = l === 'ar' ? '🌐 English' : '🌐 عربي'; });
    // Update meta
    const metaD = document.getElementById('metaDesc');
    if (metaD) metaD.setAttribute('content', l === 'ar' ? (metaD.dataset.ar || '') : (metaD.dataset.en || ''));
    // Update title
    const titleEl = document.querySelector('title[data-ar]');
    if (titleEl) titleEl.textContent = l === 'ar' ? titleEl.dataset.ar : titleEl.dataset.en;
  },
  init() {
    this.set(this.c);
    document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => this.set(this.c === 'ar' ? 'en' : 'ar')));
  },
  t(ar, en) { return this.c === 'ar' ? ar : en; }
};

// ── DAILY LIMIT ─────────────────────────────────────
const LIM = {
  MAX: 5,
  key(id) { return `ait_${id}_${new Date().toDateString()}`; },
  used(id) { return +localStorage.getItem(this.key(id)) || 0; },
  inc(id) { localStorage.setItem(this.key(id), this.used(id) + 1); },
  ok(id) { return this.used(id) < this.MAX; },
  left(id) { return Math.max(0, this.MAX - this.used(id)); },
  bar(id) {
    const u = this.used(id), r = this.left(id), pct = (u / this.MAX) * 100;
    const fill = document.getElementById('lf');
    const txt = document.getElementById('lt');
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.innerHTML = L.t(`<strong>${r}</strong> استخدام مجاني متبقٍ اليوم`, `<strong>${r}</strong> free uses left today`);
    const n = document.getElementById('un');
    if (n) n.classList.toggle('on', r === 0);
  }
};

// ── API ───────────────────────────────────────────────
async function callAI(prompt) {
  const r = await fetch('/api', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({prompt}) });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || 'Error');
  return d.result;
}

// ── RUN ───────────────────────────────────────────────
async function runTool(id, buildPrompt) {
  if (!LIM.ok(id)) { document.getElementById('un')?.classList.add('on'); return; }
  const btn = document.getElementById('runBtn');
  const out = document.getElementById('to');
  const ph = document.getElementById('tph');
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spin"></span> ${L.t('جاري التوليد...','Generating...')}`; }
  try {
    const p = buildPrompt();
    if (!p) return;
    const res = await callAI(p);
    LIM.inc(id); LIM.bar(id);
    if (ph) ph.style.display = 'none';
    if (out) { out.textContent = res; out.classList.add('on'); }
    document.querySelectorAll('.t-act').forEach(b => b.style.display = 'inline-flex');
  } catch(e) {
    if (out) { out.textContent = L.t(`⚠️ خطأ: ${e.message}`, `⚠️ Error: ${e.message}`); out.classList.add('on'); if (ph) ph.style.display = 'none'; }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = L.t('⚡ تشغيل الأداة', '⚡ Run Tool'); }
  }
}

// ── OUTPUT ACTIONS ───────────────────────────────────
function copyOut() {
  const t = document.getElementById('to');
  if (!t?.textContent) return;
  navigator.clipboard.writeText(t.textContent);
  const b = document.querySelector('[onclick="copyOut()"]');
  if (b) { b.textContent = L.t('✓ تم','✓ Done'); setTimeout(() => b.innerHTML = `📋 <span data-ar="نسخ" data-en="Copy">${L.t('نسخ','Copy')}</span>`, 1800); }
}
function shareOut() {
  const t = document.getElementById('to');
  if (!t?.textContent) return;
  navigator.share ? navigator.share({ text: t.textContent }) : copyOut();
}
function dlOut() {
  const t = document.getElementById('to');
  if (!t?.textContent) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([t.textContent], {type:'text/plain'}));
  a.download = 'ai-result.txt'; a.click();
}
function clearOut() {
  const t = document.getElementById('to'), p = document.getElementById('tph');
  if (t) { t.textContent = ''; t.classList.remove('on'); }
  if (p) p.style.display = 'flex';
  document.querySelectorAll('.t-act').forEach(b => b.style.display = 'none');
}

// ── CHAR COUNTER ─────────────────────────────────────
function cc(id, cid, max) {
  const el = document.getElementById(id), cn = document.getElementById(cid);
  if (el && cn) { const l = el.value.length; cn.textContent = `${l}/${max}`; cn.style.color = l > max * .88 ? '#f0b429' : 'var(--text3)'; }
}

// ── FILTER ──────────────────────────────────────────
function filterCat(cat) {
  document.querySelectorAll('.c-tab').forEach(t => t.classList.toggle('on', t.dataset.cat === cat));
  document.querySelectorAll('.t-card').forEach(c => { c.style.display = cat === 'all' || c.dataset.cat === cat ? 'flex' : 'none'; });
}

// ── FAQ ──────────────────────────────────────────────
function initFAQ() {
  document.querySelectorAll('.fa-item').forEach(item => {
    item.querySelector('.fa-q')?.addEventListener('click', () => {
      const o = item.classList.contains('open');
      document.querySelectorAll('.fa-item').forEach(i => i.classList.remove('open'));
      if (!o) item.classList.add('open');
    });
  });
}

// ── COOKIE ───────────────────────────────────────────
function initCookie() {
  const b = document.getElementById('cb');
  if (b && !localStorage.getItem('ait_ck')) b.style.display = 'block';
}
function ck(t) { localStorage.setItem('ait_ck', t); document.getElementById('cb').style.display = 'none'; }

// ── NAV ──────────────────────────────────────────────
function toggleNav() {
  const l = document.querySelector('.nav-links');
  if (l) l.classList.toggle('open');
}

// ── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  L.init();
  initFAQ();
  initCookie();
  const id = document.body.dataset.tool;
  if (id) { LIM.bar(id); document.querySelectorAll('.t-act').forEach(b => b.style.display = 'none'); }
  const inp = document.getElementById('mi');
  if (inp) inp.addEventListener('input', () => cc('mi','mcc',4000));
  // Filter default
  const firstTab = document.querySelector('.c-tab');
  if (firstTab) firstTab.classList.add('on');
});
