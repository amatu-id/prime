/* Amatu Prime — Ilmu Bicara & Kendali Diri. Data: data/*.js (window.PRIME), alat latihan: tools.js (window.PRIME_TOOLS).
   Semua progres di localStorage "prime.*" (disinkron oleh /amatu.js di Portal AMATU). */
(() => {
  'use strict';
  const P = window.PRIME || { M: [], S: [], T: [], C: [], SK: [] };
  const VER = (/[?&]v=([^&]+)/.exec((document.currentScript || {}).src || '') || [])[1] || '';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (n, c = '') => '<svg class="ic ' + c + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
  const mi = (id, c = '') => '<svg class="ic ' + c + '" aria-hidden="true"><use href="#m-' + id + '"/></svg>';
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const strip = s => String(s || '').replace(/\*\*?/g, '').replace(/^(##|>|!|x:|v:|=|-|\d+\.)\s*/gm, '');

  // ---------- data ----------
  const MODS = P.M.slice().sort((a, b) => a.no - b.no);
  const MBY = {}, LBY = {}, LES = [];
  for (const m of MODS) { MBY[m.id] = m; m.L.forEach((l, i) => { l.m = m; l.i = i; LES.push(l); LBY[l.id] = l; }); }
  const SBY = {}; for (const s of P.S) SBY[s.id] = s;
  const SKC = {}; for (const c of P.SK || []) SKC[c.id] = c;
  const minutes = l => Math.max(3, Math.round((strip(l.x) + ' ' + l.l + ' ' + l.q.flat().join(' ')).split(/\s+/).length / 190));
  const grad = c => 'background:' + c + ';background:linear-gradient(160deg,color-mix(in srgb,' + c + ' 68%,#fff),' + c + ')';
  const deep = c => 'background:' + c + ';background:linear-gradient(135deg,' + c + ',color-mix(in srgb,' + c + ' 55%,#000))';

  // ---------- storage ----------
  const S = {
    get(k, d) { try { const v = localStorage.getItem('prime.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('prime.' + k, JSON.stringify(v)); } catch { toast('Tidak bisa menyimpan di perangkat ini'); } }
  };
  const day = (t = Date.now()) => Math.floor((t - new Date(t).getTimezoneOffset() * 60000) / 864e5);
  const dstr = d => new Date(d * 864e5).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  function touch() {
    const a = S.get('act', {}); const t = day(); a.days = a.days || [];
    if (a.days[a.days.length - 1] !== t) { a.days.push(t); a.days = a.days.slice(-400); S.set('act', a); }
  }
  function streak() {
    const ds = (S.get('act', {}).days || []).slice().sort((a, b) => b - a); const t = day();
    if (!ds.length || ds[0] < t - 1) return 0;
    let n = 1; for (let i = 1; i < ds.length; i++) { if (ds[i] === ds[i - 1] - 1) n++; else if (ds[i] !== ds[i - 1]) break; }
    return n;
  }
  function best() { const ds = (S.get('act', {}).days || []).slice().sort((a, b) => a - b); let b = 0, n = 0; for (let i = 0; i < ds.length; i++) { n = i && ds[i] === ds[i - 1] + 1 ? n + 1 : (i && ds[i] === ds[i - 1] ? n : 1); b = Math.max(b, n); } return b; }
  function count(k, n = 1) { const a = S.get('act', {}); a[k] = (a[k] || 0) + n; S.set('act', a); }

  // ---------- XP & level ----------
  const LV = [[0, 'Pemula'], [100, 'Pendengar'], [250, 'Pembicara'], [500, 'Penyampai'], [850, 'Persuader'], [1300, 'Negosiator'], [1850, 'Diplomat'], [2500, 'Strategis'], [3300, 'Maestro'], [4300, 'Prime']];
  function level(x) {
    let i = 0; while (i + 1 < LV.length && x >= LV[i + 1][0]) i++;
    const cur = LV[i][0], nxt = LV[i + 1] ? LV[i + 1][0] : null;
    return { i, n: i + 1, name: LV[i][1], x, cur, nxt, pct: nxt ? (x - cur) / (nxt - cur) : 1 };
  }
  const xpNow = () => S.get('xp', { x: 0 }).x || 0;
  function gain(n, why, tool) {
    const o = S.get('xp', { x: 0 }); const t = day();
    if (tool) { const used = (o.d && o.d[t]) || 0; n = Math.min(n, 40 - used); o.d = { [t]: used + Math.max(0, n) }; }
    touch();
    if (n <= 0) { if (!tool) return; S.set('xp', o); return; }
    const before = level(o.x || 0); o.x = (o.x || 0) + n; S.set('xp', o);
    xpToast(n, why);
    const after = level(o.x); if (after.i > before.i) TQ.push(['Naik level ' + after.n + ': ' + after.name, 'xp']);
    chrome();
  }

  // ---------- progress helpers ----------
  const doneMap = () => S.get('done', {});
  const isDone = id => !!doneMap()[id];
  function markDone(l, quiet) {
    const d = doneMap(); if (d[l.id]) return false;
    d[l.id] = day(); S.set('done', d); gain(20, 'Pelajaran selesai'); if (!quiet) chrome();
    const m = l.m; if (m.L.every(x => d[x.id])) TQ.push(['Modul ' + m.t + ' tuntas! Lencana baru di Progres', 'xp']);
    return true;
  }
  const modDone = m => { const d = doneMap(); return m.L.filter(l => d[l.id]).length; };
  function nextLesson() {
    const d = doneMap(); const last = LBY[S.get('cfg', {}).last];
    if (last && !d[last.id]) return last;
    const k = last ? LES.indexOf(last) : -1;
    for (let i = 1; i <= LES.length; i++) { const l = LES[(k + i) % LES.length]; if (!d[l.id]) return l; }
    return last || LES[0];
  }
  function quizStats() {
    const q = S.get('quiz', {}); let c = 0, n = 0, perfect = 0;
    for (const l of LES) { const r = q[l.id]; if (r) { c += r.b; n += r.n; if (r.b === r.n) perfect++; } }
    return { pct: n ? Math.round(c / n * 100) : 0, n, perfect, final: q.akhir };
  }
  function saveQuiz(key, correct, total, xpPer = 5) {
    const q = S.get('quiz', {}); const prev = q[key] || { b: 0, n: total };
    const imp = Math.max(0, correct - (prev.b || 0));
    const bonus = correct === total && (prev.b || 0) < total ? 10 : 0;
    q[key] = { b: Math.max(prev.b || 0, correct), n: total, t: day(), last: correct };
    S.set('quiz', q);
    if (imp || bonus) gain(imp * xpPer + bonus, correct === total ? 'Kuis sempurna' : 'Kuis'); else touch();
    return q[key];
  }

  // ---------- badges ----------
  function badges() {
    const d = doneMap(), nd = Object.keys(d).filter(id => LBY[id]).length, a = S.get('act', {}), qs = quizStats();
    const ch = Object.keys((S.get('chal', {}).d) || {}).length, j = (S.get('jurnal', []) || []).length, bs = best();
    const list = [
      ['Langkah Pertama', 'Selesaikan 1 pelajaran', nd >= 1, 'star'],
      ['Rajin Belajar', '10 pelajaran selesai', nd >= 10, 'book'],
      ['Setengah Jalan', Math.ceil(LES.length / 2) + ' pelajaran selesai', nd >= Math.ceil(LES.length / 2), 'flame'],
      ['Tamat Semua', 'Semua ' + LES.length + ' pelajaran', nd >= LES.length, 'crown'],
      ['Konsisten', 'Belajar 7 hari berturut-turut', bs >= 7, 'cal'],
      ['Tak Terhentikan', '30 hari berturut-turut', bs >= 30, 'flame'],
      ['Kepala Dingin', '10 sesi napas atau jeda', (a.br || 0) + (a.ps || 0) >= 10, 'wind'],
      ['Pengamat Diri', '7 catatan Jurnal Emosi', j >= 7, 'pen'],
      ['Suara Berbobot', '5 sesi Pelatih Bicara', (a.sp || 0) >= 5, 'mic'],
      ['Juara Kuis', '10 kuis pelajaran sempurna', qs.perfect >= 10, 'trophy'],
      ['Tantangan 30', 'Semua misi Tantangan 30 Hari', ch >= 30, 'target'],
      ['Lulus Prime', 'Ujian akhir ≥ 80%', !!(qs.final && qs.final.b / qs.final.n >= .8), 'award']
    ].map(([t, s, on, i]) => ({ t, s, on, i }));
    for (const m of MODS) list.push({ t: 'Ahli ' + m.t, s: 'Semua pelajaran Modul ' + m.no, on: m.L.every(l => d[l.id]), m });
    return list;
  }

  // ---------- markup (lesson text) ----------
  const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, '$1<i>$2</i>');
  const CAN_TTS = 'speechSynthesis' in window;
  function sayHTML(kind, text, act) {
    return '<div class="say ' + kind + '"><span class="lb">' + (kind === 'x' ? 'HINDARI' : 'GUNAKAN') + '</span><span class="q">' + inl(text) + '</span>' +
      (kind === 'v' && act ? '<button class="ib" data-say="' + esc(text) + '" aria-label="Dengarkan">' + ic('vol') + '</button>' : '') + '</div>';
  }
  function md(src) {
    const out = []; let para = [], list = null, def = null;
    const fp = () => { if (para.length) { out.push('<p>' + inl(para.join(' ')) + '</p>'); para = []; } };
    const fl = () => { if (list) { out.push('<' + list.t + (list.s > 1 ? ' start="' + list.s + '"' : '') + '>' + list.i.map(x => '<li>' + inl(x) + '</li>').join('') + '</' + list.t + '>'); list = null; } };
    const fd = () => { if (def) { out.push('<div class="def">' + def.map(([a, b]) => '<div class="dt">' + inl(a) + '</div><div>' + inl(b) + '</div>').join('') + '</div>'); def = null; } };
    const all = () => { fp(); fl(); fd(); };
    for (const raw of String(src).split('\n')) {
      const t = raw.trim(); let m;
      if (!t) { all(); continue; }
      if (t.startsWith('## ')) { all(); out.push('<h2>' + inl(t.slice(3)) + '</h2>'); }
      else if ((m = /^- (.*)/.exec(t))) { fp(); fd(); if (!list || list.t !== 'ul') { fl(); list = { t: 'ul', i: [] }; } list.i.push(m[1]); }
      else if ((m = /^(\d+)\. (.*)/.exec(t))) { fp(); fd(); if (!list || list.t !== 'ol') { fl(); list = { t: 'ol', i: [], s: +m[1] }; } list.i.push(m[2]); }
      else if (t.startsWith('> ')) { all(); out.push('<div class="call tip">' + ic('spark') + '<div>' + inl(t.slice(2)) + '</div></div>'); }
      else if (t.startsWith('! ')) { all(); out.push('<div class="call warn">' + ic('alert') + '<div>' + inl(t.slice(2)) + '</div></div>'); }
      else if ((m = /^([xv]): (.*)/.exec(t))) { all(); out.push(sayHTML(m[1], m[2], CAN_TTS)); }
      else if ((m = /^= ([^:]+): (.*)/.exec(t))) { fp(); fl(); (def = def || []).push([m[1], m[2]]); }
      else { fl(); fd(); para.push(t); }
    }
    all();
    return out.join('');
  }

  // ---------- speech + clipboard ----------
  let VOICE = null;
  function pickVoice() {
    if (!CAN_TTS) return;
    const vs = speechSynthesis.getVoices().filter(v => /^id([-_]|$)/i.test(v.lang));
    VOICE = vs.find(v => /google|damayanti|natural|premium|enhanced|neural/i.test(v.name)) || vs[0] || null;
  }
  if (CAN_TTS) { pickVoice(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice); }
  function speak(text) {
    if (!CAN_TTS) return toast('Perangkat ini belum mendukung suara');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/\(.*?\)/g, ''));
    u.lang = 'id-ID'; if (VOICE) u.voice = VOICE; u.rate = .96;
    speechSynthesis.speak(u);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch { } ta.remove(); }
    toast('Kalimat disalin');
  }

  // ---------- toast + dialog ----------
  // plain toasts replace what is shown; 'xp' toasts (XP, level, modul tuntas) wait their turn
  let toastT = 0, tOn = null; const TQ = [];
  function showToast(msg, kind) {
    const el = $('#toast'); if (!el) return;
    el.textContent = msg; el.className = 'show' + (kind ? ' ' + kind : ''); tOn = kind || 'plain';
    clearTimeout(toastT); toastT = setTimeout(() => { el.className = kind || ''; tOn = null; const n = TQ.shift(); if (n) setTimeout(() => showToast(n[0], n[1]), 200); }, 2200);
  }
  function toast(msg, kind) { if (kind === 'xp' && tOn === 'xp') { if (TQ.length < 3) TQ.push([msg, kind]); } else showToast(msg, kind); }
  let acc = null;
  function xpToast(n, why) {
    const now = Date.now();
    if (acc && now - acc.t < 700 && tOn === 'xp') { acc.n += n; acc.w.push(why); acc.t = now; const el = $('#toast'); if (el) el.textContent = '+' + acc.n + ' XP · ' + acc.w.join(' + '); return; }
    acc = { n, w: [why], t: now }; toast('+' + n + ' XP · ' + why, 'xp');
  }
  function confirmDlg(title, text, okLabel, danger) {
    return new Promise(res => {
      const ov = document.createElement('div'); ov.className = 'ov';
      ov.innerHTML = '<div class="dlg" role="dialog" aria-modal="true"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="acts"><button class="btn ghost" data-v="0">Batal</button><button class="btn' + (danger ? '' : ' gold') + '" data-v="1"' + (danger ? ' style="background:var(--bad);color:#fff"' : '') + '>' + esc(okLabel) + '</button></div></div>';
      const done = v => { ov.remove(); res(v); };
      ov.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) done(b.dataset.v === '1'); else if (e.target === ov) done(false); });
      document.body.appendChild(ov); $('[data-v="1"]', ov).focus();
    });
  }

  // ---------- pieces ----------
  function mcard(m) {
    const n = modDone(m), all = m.L.length;
    return '<a class="mcard' + (n === all ? ' done' : '') + '" href="#/m/' + m.id + '"><div class="top"><span class="mtile" style="' + grad(m.c) + '">' + mi(m.id) + '</span><div><div class="no">MODUL ' + m.no + '</div><div class="t">' + esc(m.t) + '</div></div></div>' +
      '<p>' + esc(m.s) + '</p><div class="ft"><div class="bar"><i style="width:' + (n / all * 100) + '%;background:' + m.c + '"></i></div><span>' + n + '/' + all + '</span></div></a>';
  }
  function skCard(s, open) {
    const m = MBY[s.m]; const fav = (S.get('fav', {}).s || []).includes(s.id);
    return '<article class="sk' + (open ? ' open' : '') + '" data-sk="' + s.id + '"><div class="hd"><b>' + esc(s.t) + '</b>' +
      '<button class="ib' + (fav ? ' on' : '') + '" data-fav="' + s.id + '" aria-label="Favorit">' + ic('star') + '</button></div>' +
      '<p class="sit">' + esc(s.s) + '</p>' +
      sayHTML('x', s.x[0]) +
      '<div class="vtabs">' + s.v.map((v, i) => '<button class="' + (i ? '' : 'on') + '" data-vi="' + i + '">' + esc(v[0]) + '</button>').join('') + '</div>' +
      '<div class="vbox">' + sayHTML('v', s.v[0][1], CAN_TTS) + '</div>' +
      '<div class="more">' + s.x.slice(1).map(x => sayHTML('x', x)).join('') + '<div class="why"><b>Kenapa berhasil:</b> ' + esc(s.w) + '</div></div>' +
      '<div class="ft"><button class="toggle" data-more>' + 'Kenapa berhasil' + ic('down') + '</button><span class="sp"></span>' +
      '<button class="ib" data-copy aria-label="Salin">' + ic('copy') + '</button>' +
      (m ? '<a class="tag" href="#/m/' + m.id + '" style="background:' + m.c + '1f;color:' + m.c + '">' + esc(m.t) + '</a>' : '') + '</div></article>';
  }
  function tkCard(t) {
    const m = MBY[t[0]];
    return '<div class="tk"><span class="tag" style="background:' + (m ? m.c : '#888') + '">' + esc(m ? m.t : t[0]) + '</span><b>' + esc(t[1]) + '</b><p>' + esc(t[2]) + '</p></div>';
  }
  const stat = (i, v, l) => '<div class="stat">' + ic(i) + '<b>' + v + '</b><small>' + l + '</small></div>';

  // ---------- views ----------
  function vHome() {
    const d = doneMap(), nd = LES.filter(l => d[l.id]).length, nx = nextLesson(), lv = level(xpNow()), st = streak(), qs = quizStats();
    const t = day(), tr = P.T[t % P.T.length], sk = P.S[(t * 7 + 3) % P.S.length];
    const ch = P.C.length ? chalToday() : null;
    return {
      title: '', crumb: [], html:
        '<div class="wrap anim"><div class="hero"><div class="hero-main"><div class="eyebrow">Amatu Prime</div><h1>Bicara berbobot. Emosi terkendali.</h1>' +
        '<p>Tegas tidak harus kasar, dan dihargai tidak harus dengan mengintimidasi. ' + MODS.length + ' modul, ' + LES.length + ' pelajaran, dan ' + P.S.length + ' contoh kalimat untuk situasi nyata.</p>' +
        '<div class="acts"><a class="btn gold" href="#/l/' + nx.id + '">' + ic('play') + (nd ? 'Lanjutkan belajar' : 'Mulai belajar') + '</a><a class="btn ghost" href="#/skrip">' + ic('chat') + 'Contoh kalimat</a></div></div>' +
        '<div><div class="stats">' + stat('book', nd + '<small class="mut" style="font:500 15px var(--sans)">/' + LES.length + '</small>', 'Pelajaran selesai') + stat('crown', 'Lv ' + lv.n, lv.name + ' · ' + lv.x + ' XP') +
        stat('flame', st, st ? 'Hari berturut-turut' : 'Mulai hari ini') + stat('trophy', qs.n ? qs.pct + '%' : '–', 'Rata-rata kuis') + '</div>' +
        '<a class="card cont" style="margin-top:12px" href="#/l/' + nx.id + '"><span class="ico" style="' + grad(nx.m.c) + '">' + mi(nx.m.id) + '</span><span class="tx"><small>' + (nd ? 'LANJUTKAN' : 'MULAI DARI SINI') + ' · MODUL ' + nx.m.no + '</small><b>' + esc(nx.t) + '</b></span>' + ic('next') + '</a></div></div>' +
        '<section class="sec"><div class="sech"><h2 class="h2">Hari ini</h2><a href="#/latihan">Semua latihan</a></div><div class="daily">' +
        '<div class="card dcard"><div class="k">' + ic('spark', 'sm') + 'Trik hari ini</div><b>' + esc(tr[1]) + '</b><p>' + esc(tr[2]) + '</p><div class="ft"><a class="btn ghost sm" href="#/trik">Trik lainnya</a></div></div>' +
        '<div class="card dcard"><div class="k">' + ic('chat', 'sm') + 'Kalimat hari ini</div><b>' + esc(sk.t) + '</b><p>“' + esc(sk.v[0][1]) + '”</p><div class="ft"><a class="btn ghost sm" href="#/skrip/' + sk.id + '">Lihat situasinya</a>' + (CAN_TTS ? '<button class="btn ghost sm" data-say="' + esc(sk.v[0][1]) + '">' + ic('vol', 'sm') + 'Dengar</button>' : '') + '</div></div>' +
        (ch ? '<div class="card dcard"><div class="k">' + ic('target', 'sm') + 'Tantangan hari ke-' + ch.n + '</div><b>' + esc(ch.c[0]) + '</b><p>' + esc(ch.c[1]) + '</p><div class="ft"><a class="btn ghost sm" href="#/latihan/tantangan">' + (ch.done ? ic('check', 'sm') + 'Selesai' : 'Buka tantangan') + '</a></div></div>' : '') +
        '</div></section>' +
        '<section class="sec"><div class="sech"><h2 class="h2">Modul belajar</h2><a href="#/belajar">Lihat semua</a></div><div class="mods">' + MODS.map(mcard).join('') + '</div></section>' +
        '<section class="sec"><div class="sech"><h2 class="h2">Latihan cepat</h2></div><div class="tools">' + toolCards(['situasi', 'napas', 'bicara']) + '</div></section></div>'
    };
  }
  function chalToday() {
    const c = S.get('chal', {}); const dd = c.d || {};
    let n = 1; while (n <= P.C.length && dd[n] && dd[n] !== day()) n++;
    if (n > P.C.length) n = P.C.length;
    return { n, c: P.C[n - 1], done: !!dd[n] };
  }
  function vBelajar() {
    const d = doneMap(), nd = LES.filter(l => d[l.id]).length;
    return {
      title: 'Belajar', crumb: [['Belajar']], html: '<div class="wrap anim"><h1 class="h1">Semua modul</h1><p class="sub">' + MODS.length + ' modul · ' + LES.length + ' pelajaran · ' + nd + ' selesai. Mulai dari Tata Bicara, atau langsung ke topik yang paling kamu butuhkan.</p>' +
        '<div class="bar" style="margin-top:16px;height:8px"><i style="width:' + (nd / LES.length * 100) + '%"></i></div>' +
        '<div class="mods" style="margin-top:24px">' + MODS.map(mcard).join('') + '</div></div>'
    };
  }
  function vModul(id) {
    const m = MBY[id]; if (!m) return vNot();
    const d = doneMap(), n = modDone(m), nx = m.L.find(l => !d[l.id]) || m.L[0], q = S.get('quiz', {})['m:' + m.id];
    const sk = P.S.filter(s => s.m === m.id).slice(0, 4), tk = P.T.filter(t => t[0] === m.id);
    return {
      title: m.t, crumb: [['Belajar', '#/belajar'], [m.t]], html: '<div class="wrap anim"><div class="mhead" style="' + deep(m.c) + '"><span class="mtile">' + mi(m.id) + '</span><div><div class="eyebrow">Modul ' + m.no + ' · ' + m.L.length + ' pelajaran</div><h1>' + esc(m.t) + '</h1><p>' + esc(m.d) + '</p>' +
        '<div class="acts"><a class="btn lite" href="#/l/' + nx.id + '">' + ic('play') + (n ? (n === m.L.length ? 'Ulangi' : 'Lanjutkan') : 'Mulai') + '</a><a class="btn ghost" href="#/kuis/' + m.id + '">' + ic('trophy') + 'Kuis modul' + (q ? ' · ' + Math.round(q.b / q.n * 100) + '%' : '') + '</a><a class="btn ghost" href="#/cetak/' + m.id + '">' + ic('print') + 'Cetak / PDF</a></div></div></div>' +
        '<section class="sec"><div class="sech"><h2 class="h2">Pelajaran</h2><span class="tag">' + n + '/' + m.L.length + ' selesai</span></div><div class="lrows">' +
        m.L.map((l, i) => '<a class="lrow' + (d[l.id] ? ' done' : '') + '" href="#/l/' + l.id + '"><span class="n">' + (d[l.id] ? ic('check', 'sm') : i + 1) + '</span><span class="tx"><b>' + esc(l.t) + '</b><small>' + esc(l.d) + '</small></span><span class="meta"><span class="tag">' + ic('clock', 'sm') + minutes(l) + ' mnt</span>' + ic('next', 'sm') + '</span></a>').join('') + '</div></section>' +
        (sk.length ? '<section class="sec"><div class="sech"><h2 class="h2">Contoh kalimat terkait</h2><a href="#/skrip?m=' + m.id + '">Semua</a></div><div class="sklist">' + sk.map(s => skCard(s)).join('') + '</div></section>' : '') +
        (tk.length ? '<section class="sec"><div class="sech"><h2 class="h2">Trik ' + esc(m.t) + '</h2></div><div class="tips">' + tk.map(tkCard).join('') + '</div></section>' : '') + '</div>'
    };
  }
  function vLesson(id) {
    const l = LBY[id]; if (!l) return vNot();
    const m = l.m, done = isDone(id), note = (S.get('notes', {})[id]) || '', fav = (S.get('fav', {}).l || []).includes(id);
    const cfg = S.get('cfg', {}); if (cfg.last !== id) { cfg.last = id; S.set('cfg', cfg); }
    const prev = LES[LES.indexOf(l) - 1], next = LES[LES.indexOf(l) + 1];
    const qr = S.get('quiz', {})[id];
    return {
      title: l.t, crumb: [['Belajar', '#/belajar'], [m.t, '#/m/' + m.id], [l.t]], lesson: l, html:
        '<div class="wrap"><article class="read lesson anim"><div class="eyebrow"><a class="tag" style="background:' + m.c + '1f;color:' + m.c + '" href="#/m/' + m.id + '">' + mi(m.id, 'sm') + 'Modul ' + m.no + ' · ' + esc(m.t) + '</a><span class="mut">Pelajaran ' + (l.i + 1) + ' dari ' + m.L.length + '</span></div>' +
        '<h1>' + esc(l.t) + '</h1><p class="lead">' + esc(l.d) + '</p>' +
        '<div class="lmeta"><span class="tag">' + ic('clock', 'sm') + minutes(l) + ' menit</span>' + (done ? '<span class="tag" style="color:var(--good);background:var(--goodbg)">' + ic('check', 'sm') + 'Selesai</span>' : '') + (qr ? '<span class="tag">' + ic('trophy', 'sm') + 'Kuis ' + qr.b + '/' + qr.n + '</span>' : '') +
        '<span class="sp"></span><button class="ib' + (fav ? ' on' : '') + '" data-lfav aria-label="Simpan">' + ic('bookmark') + '</button><button class="ib" data-fsbtn aria-label="Ukuran teks"><b style="font:700 15px var(--serif)">Aa</b></button><button class="ib" data-print aria-label="Cetak">' + ic('print') + '</button></div>' +
        '<div class="prose">' + md(l.x) + '</div>' +
        '<div class="box"><div class="hd">' + ic('target') + 'Latihan</div><p>' + esc(l.l) + '</p><textarea data-note="' + id + '" placeholder="Catatanku: tulis hasil latihan atau kalimat versimu sendiri…">' + esc(note) + '</textarea></div>' +
        '<section class="quiz" id="lq"><div class="sech"><h2 class="h2">Uji pemahaman</h2><span class="tag">' + l.q.length + ' soal</span></div>' + l.q.map((q, i) => qCard(qItem(q, l), i, l.q.length)).join('') + '</section>' +
        doneBar(l, done) +
        '<nav class="lnav">' + (prev ? '<a href="#/l/' + prev.id + '"><small>' + ic('back', 'sm') + 'Sebelumnya</small><b>' + esc(prev.t) + '</b></a>' : '<span></span>') +
        (next ? '<a class="nx" href="#/l/' + next.id + '"><small>Berikutnya' + ic('next', 'sm') + '</small><b>' + esc(next.t) + '</b></a>' : '<a class="nx" href="#/kuis/akhir"><small>Selesai semua?' + ic('next', 'sm') + '</small><b>Ujian Akhir Prime</b></a>') + '</nav></article></div>'
    };
  }
  const doneBar = (l, done) => '<div class="donebar' + (done ? ' ok' : '') + '" id="donebar">' + (done ? ic('check', 'lg') + '<div class="tx"><b>Pelajaran selesai</b><small>Lanjutkan ke pelajaran berikutnya atau ulangi kuis kapan saja.</small></div>' :
    ic('flame', 'lg') + '<div class="tx"><b>Sudah paham?</b><small>Jawab kuis di atas atau tandai selesai untuk mendapat 20 XP.</small></div><button class="btn gold sm" data-done>Tandai selesai</button>') + '</div>';
  function qItem(q, l) { const o = shuffle([{ t: q[1], ok: 1 }].concat(q.slice(2, -1).map(t => ({ t, ok: 0 })))); return { q: q[0], o, ex: q[q.length - 1], l }; }
  function qCard(it, i, n, src) {
    return '<div class="qcard" data-qi="' + i + '"><div class="qtop"><span>Soal ' + (i + 1) + (n ? ' dari ' + n : '') + '</span>' + (src ? '<a class="tag" href="#/l/' + it.l.id + '" style="background:' + it.l.m.c + '1f;color:' + it.l.m.c + '">' + esc(it.l.m.t) + '</a>' : '') + '</div>' +
      '<div class="qq">' + esc(it.q) + '</div><div class="opts">' + it.o.map((o, k) => '<button class="opt" data-ok="' + o.ok + '"><span class="k">' + 'ABCD'[k] + '</span><span>' + esc(o.t) + '</span></button>').join('') + '</div><div class="expl"></div></div>';
  }
  function answer(card, btn, it) {
    const opts = $('.opts', card); if (opts.classList.contains('done')) return null;
    opts.classList.add('done'); const ok = btn.dataset.ok === '1';
    btn.classList.add(ok ? 'ok' : 'no'); if (!ok) { const r = $('.opt[data-ok="1"]', opts); r && r.classList.add('ok'); }
    const ex = $('.expl', card); ex.innerHTML = '<b>' + (ok ? 'Tepat.' : 'Kurang tepat.') + '</b> ' + esc(it.ex); ex.classList.add('show');
    return ok;
  }

  // big quiz (module / mixed / final)
  let QZ = null;
  function vKuis(key) {
    const m = MBY[key];
    const cfg = key === 'akhir' ? { t: 'Ujian Akhir Prime', n: 30, d: 'Tiga puluh soal situasi dari semua modul. Lulus dengan nilai 80% atau lebih untuk mendapat lencana Lulus Prime.' }
      : key === 'campur' ? { t: 'Latihan Situasi', n: 10, d: 'Sepuluh soal acak dari semua modul. Cocok untuk latihan harian lima menit.' }
        : m ? { t: 'Kuis ' + m.t, n: Math.min(15, m.L.length * 3), d: 'Soal dari semua pelajaran Modul ' + m.no + '. Nilai terbaik disimpan.' } : null;
    if (!cfg) return vNot();
    const crumb = m ? [['Belajar', '#/belajar'], [m.t, '#/m/' + m.id], ['Kuis']] : [['Latihan', '#/latihan'], [cfg.t]];
    if (!QZ || QZ.key !== key) {
      const r = S.get('quiz', {})[key === 'akhir' ? 'akhir' : 'm:' + key];
      return {
        title: cfg.t, crumb, html: '<div class="wrap"><div class="read anim"><div class="qcard result"><div class="medal">' + ic(key === 'akhir' ? 'award' : 'trophy') + '</div><h1 class="h2" style="margin-top:14px">' + esc(cfg.t) + '</h1><p style="margin-top:10px">' + esc(cfg.d) + '</p>' +
          (r ? '<p class="mut">Nilai terbaikmu: <b>' + r.b + '/' + r.n + '</b> (' + Math.round(r.b / r.n * 100) + '%)</p>' : '') +
          '<div class="acts"><button class="btn gold" data-start="' + key + '" data-n="' + cfg.n + '">' + ic('play') + 'Mulai · ' + cfg.n + ' soal</button></div></div></div></div>'
      };
    }
    if (QZ.i >= QZ.items.length) return { title: cfg.t, crumb, html: '<div class="wrap"><div class="read anim">' + resultHTML(cfg) + '</div></div>' };
    const it = QZ.items[QZ.i];
    return {
      title: cfg.t, crumb, html: '<div class="wrap"><div class="read"><div class="qfoot" style="margin:0 0 14px"><div class="qprog"><div class="bar"><i style="width:' + (QZ.i / QZ.items.length * 100) + '%"></i></div></div><span class="tag">' + ic('check', 'sm') + QZ.c + ' benar</span></div>' +
        qCard(it, QZ.i, QZ.items.length, true) + '<div class="qfoot"><button class="btn ghost sm" data-quit>Keluar</button><button class="btn gold" data-nextq disabled>' + (QZ.i + 1 < QZ.items.length ? 'Lanjut' : 'Lihat hasil') + ic('next') + '</button></div></div></div>'
    };
  }
  function startQuiz(key, n) {
    const m = MBY[key]; let pool;
    if (m) pool = m.L.flatMap(l => l.q.map(q => [q, l]));
    else if (key === 'akhir') { pool = []; for (const md of MODS) pool.push(...shuffle(md.L.flatMap(l => l.q.map(q => [q, l]))).slice(0, Math.ceil(n / MODS.length) + 1)); }
    else pool = LES.flatMap(l => l.q.map(q => [q, l]));
    const items = shuffle(pool).slice(0, n).map(([q, l]) => qItem(q, l));
    QZ = { key, items, i: 0, c: 0, wrong: [], answered: false };
  }
  function resultHTML(cfg) {
    if (!QZ.saved) {
      QZ.saved = true; const tot = QZ.items.length;
      if (QZ.key === 'campur') { gain(QZ.c * 2, 'Latihan situasi', true); }
      else saveQuiz(QZ.key === 'akhir' ? 'akhir' : 'm:' + QZ.key, QZ.c, tot, QZ.key === 'akhir' ? 4 : 3);
    }
    const pct = Math.round(QZ.c / QZ.items.length * 100), pass = pct >= 80;
    const msg = pct === 100 ? 'Sempurna. Kamu benar-benar menguasai materinya.' : pct >= 80 ? 'Hebat! Pemahamanmu sudah kuat.' : pct >= 60 ? 'Bagus, tinggal sedikit lagi. Ulangi pelajaran di bawah ini.' : 'Tidak apa-apa. Baca ulang pelajaran yang disarankan, lalu coba lagi.';
    const rev = [...new Set(QZ.wrong.map(it => it.l))].slice(0, 6);
    return '<div class="qcard result"><div class="medal pop">' + ic(QZ.key === 'akhir' && pass ? 'award' : 'trophy') + '</div><div class="big">' + pct + '%</div><b>' + QZ.c + ' dari ' + QZ.items.length + ' benar</b>' +
      (QZ.key === 'akhir' ? '<p style="margin-top:8px">' + (pass ? 'Selamat, kamu <b>Lulus Prime</b>! Lencana sudah tersimpan di halaman Progres.' : 'Butuh 80% untuk lulus. ' + msg) + '</p>' : '<p style="margin-top:8px">' + msg + '</p>') +
      '<div class="acts"><button class="btn gold" data-start="' + QZ.key + '" data-n="' + QZ.items.length + '">' + ic('redo') + 'Ulangi</button><a class="btn ghost" href="' + (MBY[QZ.key] ? '#/m/' + QZ.key : '#/latihan') + '">Kembali</a></div></div>' +
      (rev.length ? '<section class="sec"><div class="sech"><h2 class="h2">Pelajari lagi</h2></div><div class="lrows">' + rev.map(l => '<a class="lrow" href="#/l/' + l.id + '"><span class="n" style="' + grad(l.m.c) + ';color:#fff">' + mi(l.m.id, 'sm') + '</span><span class="tx"><b>' + esc(l.t) + '</b><small>' + esc(l.m.t) + '</small></span>' + ic('next', 'sm') + '</a>').join('') + '</div></section>' : '');
  }

  function vSkrip(id, q) {
    if (id) {
      const s = SBY[id]; if (!s) return vNot();
      const rel = P.S.filter(x => x.k === s.k && x.id !== s.id).slice(0, 4);
      return {
        title: s.t, crumb: [['Contoh Kalimat', '#/skrip'], [s.t]], html: '<div class="wrap"><div class="read anim"><a class="tag" href="#/skrip?k=' + s.k + '">' + esc((SKC[s.k] || {}).t || s.k) + '</a><h1 class="h1" style="margin-top:12px">' + esc(s.t) + '</h1>' +
          '<div style="margin-top:18px">' + skCard(s, true) + '</div>' + (rel.length ? '<section class="sec"><div class="sech"><h2 class="h2">Situasi serupa</h2></div><div class="sklist">' + rel.map(x => skCard(x)).join('') + '</div></section>' : '') + '</div></div>'
      };
    }
    const k = q.get('k') || '', mf = q.get('m') || '', favs = S.get('fav', {}).s || [];
    let list = P.S;
    if (k === 'fav') list = list.filter(s => favs.includes(s.id)); else if (k) list = list.filter(s => s.k === k);
    if (mf) list = list.filter(s => s.m === mf);
    const chips = [['', 'Semua'], ['fav', 'Favorit']].concat((P.SK || []).map(c => [c.id, c.t]));
    return {
      title: 'Contoh Kalimat', crumb: [['Contoh Kalimat']], html: '<div class="wrap anim"><h1 class="h1">Contoh kalimat per situasi</h1><p class="sub">Bukan cuma teori: apa yang sebaiknya diucapkan saat disindir, ditegur, diminta tolong, ditawar, atau saat PDKT. Bandingkan versi yang lemah dan yang kuat, lalu latih ucapkan.</p>' +
        '<div class="skbar"><div class="chips scroll">' + chips.map(([v, t]) => '<a class="chip' + (v === k && !mf ? ' on' : '') + '" href="#/skrip' + (v ? '?k=' + v : '') + '">' + (v === 'fav' ? ic('star', 'sm') : '') + esc(t) + (v && v !== 'fav' ? ' <span class="mut">' + P.S.filter(s => s.k === v).length + '</span>' : '') + '</a>').join('') + '</div>' +
        (mf && MBY[mf] ? '<div><span class="tag">Modul: ' + esc(MBY[mf].t) + '</span> <a class="tag" href="#/skrip">Hapus filter ' + ic('x', 'sm') + '</a></div>' : '') +
        (k && SKC[k] ? '<p class="mut" style="margin:0">' + esc(SKC[k].d) + '</p>' : '') + '</div>' +
        (list.length ? '<div class="sklist">' + list.map(s => skCard(s)).join('') + '</div>' : '<div class="empty">' + (k === 'fav' ? 'Belum ada favorit. Ketuk bintang di kartu kalimat untuk menyimpannya.' : 'Tidak ada kalimat.') + '</div>') + '</div>'
    };
  }
  let TSEED = 0;
  function vTrik(q) {
    const k = q.get('k') || ''; let list = P.T.slice(); if (k) list = list.filter(t => t[0] === k);
    if (TSEED) { const r = list.map((t, i) => [Math.sin(TSEED * (i + 1)) , t]); r.sort((a, b) => a[0] - b[0]); list = r.map(x => x[1]); }
    return {
      title: 'Tips & Trik', crumb: [['Tips & Trik']], html: '<div class="wrap anim"><div class="sech" style="align-items:flex-start"><div><h1 class="h1">Tips & trik</h1><p class="sub">' + P.T.length + ' trik singkat yang bisa langsung dipakai hari ini. Pilih satu, praktikkan, ulangi sampai jadi kebiasaan.</p></div><button class="btn ghost sm" data-shuffle>' + ic('shuffle', 'sm') + 'Acak</button></div>' +
        '<div class="chips scroll" style="margin:6px 0 20px">' + [['', 'Semua']].concat(MODS.map(m => [m.id, m.t])).map(([v, t]) => '<a class="chip' + (v === k ? ' on' : '') + '" href="#/trik' + (v ? '?k=' + v : '') + '">' + esc(t) + '</a>').join('') + '</div>' +
        '<div class="tips">' + list.map(tkCard).join('') + '</div></div>'
    };
  }
  const TOOLDEF = {
    situasi: ['target', 'Latihan Situasi', '10 soal acak dari semua modul. Lima menit sehari.', '#/kuis/campur', 'Kuis'],
    akhir: ['award', 'Ujian Akhir Prime', '30 soal. Lulus 80% untuk lencana Lulus Prime.', '#/kuis/akhir', 'Ujian'],
    napas: ['wind', 'Napas Tenang', 'Napas kotak, 4-7-8, dan helaan fisiologis dengan panduan animasi.', '#/latihan/napas', 'Emosi'],
    jeda: ['clock', 'Jeda 90 Detik', 'Tahan reaksi saat emosi memuncak, dengan pertanyaan pemandu.', '#/latihan/jeda', 'Emosi'],
    jurnal: ['pen', 'Jurnal Emosi', 'Catat pemicu, emosi, dan respons. Lihat polamu dari waktu ke waktu.', '#/latihan/jurnal', 'Kendali diri'],
    bicara: ['mic', 'Pelatih Bicara', 'Bicara 60 detik tentang topik acak, hitung kata pengisi dan tempo.', '#/latihan/bicara', 'Tata bicara'],
    nego: ['m-negosiasi', 'Lembar Negosiasi', 'Siapkan BATNA, batas, target, dan pembuka sebelum bernegosiasi.', '#/latihan/nego', 'Negosiasi'],
    tantangan: ['cal', 'Tantangan 30 Hari', 'Satu misi kecil per hari untuk membangun kebiasaan baru.', '#/latihan/tantangan', 'Kebiasaan']
  };
  function toolCards(ids) {
    return ids.map(id => { const t = TOOLDEF[id]; const icon = t[0].startsWith('m-') ? mi(t[0].slice(2)) : ic(t[0]); return '<a class="tool" href="' + t[3] + '"><span class="ti">' + icon + '</span><b>' + t[1] + '</b><p>' + t[2] + '</p><span class="tag">' + t[4] + '</span></a>'; }).join('');
  }
  function vLatihan(tool) {
    if (tool) {
      const T = (window.PRIME_TOOLS || {})[tool]; if (!T) return vNot();
      return { title: T.t, crumb: [['Latihan', '#/latihan'], [T.t]], tool: T, html: '<div class="wrap"><div class="read anim" id="toolroot"></div></div>' };
    }
    const q = S.get('quiz', {});
    return {
      title: 'Latihan', crumb: [['Latihan']], html: '<div class="wrap anim"><h1 class="h1">Latihan</h1><p class="sub">Ilmu bicara dan kendali diri hanya menempel lewat praktik. Pilih alat latihan, kuis situasi, atau tantangan harian.</p>' +
        '<div class="tools" style="margin-top:22px">' + toolCards(Object.keys(TOOLDEF)) + '</div>' +
        '<section class="sec"><div class="sech"><h2 class="h2">Kuis per modul</h2></div><div class="chips">' + MODS.map(m => { const r = q['m:' + m.id]; return '<a class="chip" href="#/kuis/' + m.id + '"><span style="width:10px;height:10px;border-radius:3px;background:' + m.c + '"></span>' + esc(m.t) + (r ? ' <span class="mut">' + Math.round(r.b / r.n * 100) + '%</span>' : '') + '</a>'; }).join('') + '</div></section></div>'
    };
  }
  function vProgres() {
    const d = doneMap(), nd = LES.filter(l => d[l.id]).length, lv = level(xpNow()), qs = quizStats(), bd = badges(), cfg = S.get('cfg', {});
    const seg = (k, opts, cur) => '<div class="seg" data-set="' + k + '">' + opts.map(([v, t]) => '<button data-v="' + v + '" class="' + (v === cur ? 'on' : '') + '">' + t + '</button>').join('') + '</div>';
    return {
      title: 'Progres', crumb: [['Progres']], html: '<div class="wrap anim"><h1 class="h1">Progres & pengaturan</h1>' +
        '<div class="card pad" style="margin-top:20px;display:flex;align-items:center;gap:18px;flex-wrap:wrap"><div class="medal">' + ic('crown') + '</div><div style="flex:1;min-width:200px"><div class="mut" style="font-size:13px;font-weight:650">LEVEL ' + lv.n + '</div><div class="h2">' + lv.name + '</div><div class="bar" style="margin-top:10px;height:8px"><i style="width:' + Math.round(lv.pct * 100) + '%"></i></div><small class="mut">' + lv.x + ' XP' + (lv.nxt ? ' · ' + (lv.nxt - lv.x) + ' XP lagi ke ' + LV[lv.i + 1][1] : ' · level tertinggi') + '</small></div></div>' +
        '<div class="grid g4" style="margin-top:14px">' + stat('book', nd + '/' + LES.length, 'Pelajaran selesai') + stat('flame', streak(), 'Streak (terbaik ' + best() + ')') + stat('trophy', qs.n ? qs.pct + '%' : '–', 'Rata-rata kuis') + stat('award', bd.filter(b => b.on).length + '/' + bd.length, 'Lencana') + '</div>' +
        '<section class="sec"><div class="sech"><h2 class="h2">Per modul</h2></div><div class="card pad mprog">' + MODS.map(m => { const n = modDone(m); return '<a href="#/m/' + m.id + '"><span class="t">' + esc(m.t) + '</span><span class="bar"><i style="width:' + (n / m.L.length * 100) + '%;background:' + m.c + '"></i></span><em>' + n + '/' + m.L.length + '</em></a>'; }).join('') + '</div></section>' +
        '<section class="sec"><div class="sech"><h2 class="h2">Lencana</h2></div><div class="badges">' + bd.map(b => '<div class="badge' + (b.on ? ' on' : '') + '"><div class="bi"' + (b.m && b.on ? ' style="' + grad(b.m.c) + ';color:#fff"' : '') + '>' + (b.m ? mi(b.m.id) : ic(b.i)) + '</div><b>' + esc(b.t) + '</b><small>' + esc(b.s) + '</small></div>').join('') + '</div></section>' +
        '<section class="sec"><div class="sech"><h2 class="h2">Pengaturan</h2></div><div class="card pad">' +
        '<div class="setrow"><div><b>Tema</b><small>Ikuti perangkat, terang, atau gelap</small></div>' + seg('theme', [['', 'Otomatis'], ['light', 'Terang'], ['dark', 'Gelap']], cfg.theme || '') + '</div>' +
        '<div class="setrow"><div><b>Ukuran teks pelajaran</b><small>Untuk kenyamanan membaca</small></div>' + seg('fs', [['s', 'Kecil'], ['m', 'Sedang'], ['l', 'Besar']], cfg.fs || 'm') + '</div>' +
        '<div class="setrow"><div><b>Suara</b><small>' + (CAN_TTS ? (VOICE ? 'Suara: ' + esc(VOICE.name) : 'Suara bahasa Indonesia bawaan perangkat') : 'Perangkat ini belum mendukung suara') + '</small></div>' + (CAN_TTS ? '<button class="btn ghost sm" data-say="Saya usul jadwalnya kita geser ke Kamis.">' + ic('vol', 'sm') + 'Coba suara</button>' : '') + '</div>' +
        '<div class="setrow"><div><b>Atur ulang progres</b><small>Hapus pelajaran selesai, kuis, XP, dan streak di semua perangkat</small></div><button class="btn ghost sm" data-reset style="color:var(--bad)">' + ic('trash', 'sm') + 'Atur ulang</button></div></div></section>' +
        '<section class="sec"><div class="sech"><h2 class="h2">Tentang Prime</h2></div><div class="card pad" style="color:var(--ink2);line-height:1.65">Prime adalah ruang belajar ilmu bicara dan pengendalian diri: tata bicara, tegas tanpa kasar, kendali emosi, menahan diri, cara bersikap, pengaruh & manipulasi, politik, pesona, negosiasi, deal, dan marketing. Terinspirasi dari <a href="https://www.instagram.com/p/DewEg4Vgs1h/" target="_blank" rel="noopener" style="color:var(--gold);font-weight:600">reel Instagram tentang belajar ilmu ngomong</a>; seluruh materi di sini ditulis ulang dan diperluas untuk Amatu.<p class="mut" style="margin:12px 0 0;font-size:13.5px">Materi bersifat edukasi umum, bukan pengganti bantuan psikolog, konselor, atau penasihat hukum. Gunakan ilmu pengaruh secara etis.</p><p class="mut" style="margin:6px 0 0;font-size:12.5px">Versi ' + esc(VER || 'lokal') + '</p></div></section></div>'
    };
  }
  function vCari(q) {
    const raw = (q.get('q') || '').trim(), t = norm(raw);
    const inp = $('#q'); if (inp && document.activeElement !== inp) inp.value = raw;
    if (t.length < 2) return { title: 'Cari', crumb: [['Cari']], html: '<div class="wrap"><div class="empty">Ketik minimal dua huruf untuk mencari pelajaran, kalimat, atau trik.</div></div>' };
    const words = t.split(/\s+/).filter(Boolean), res = [];
    const score = (title, body) => { const a = norm(title), b = norm(body); let s = 0; for (const w of words) { if (a.includes(w)) s += 5; else if (b.includes(w)) s += 1; else return 0; } return s + (a.includes(t) ? 6 : 0); };
    for (const l of LES) { const s = score(l.t, l.d + ' ' + strip(l.x) + ' ' + l.l); if (s) res.push([s, 'l', l]); }
    for (const x of P.S) { const s = score(x.t, x.s + ' ' + x.x.join(' ') + ' ' + x.v.map(v => v[1]).join(' ') + ' ' + x.w); if (s) res.push([s, 's', x]); }
    for (const x of P.T) { const s = score(x[1], x[2]); if (s) res.push([s, 't', x]); }
    res.sort((a, b) => b[0] - a[0]);
    const snip = body => { const b = String(body), i = norm(b).indexOf(words[0]); const st = Math.max(0, i - 50); return (st ? '…' : '') + b.slice(st, st + 170) + '…'; };
    const hl = s => { let h = esc(s); for (const w of words) { if (w.length < 2) continue; h = h.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); } return h; };
    const row = ([, k, x]) => k === 'l' ? '<a href="#/l/' + x.id + '"><span class="mtile" style="width:36px;height:36px;border-radius:10px;' + grad(x.m.c) + '">' + mi(x.m.id, 'sm') + '</span><span class="tx"><b>' + hl(x.t) + '</b><small>' + hl(snip(x.d + ' ' + strip(x.x))) + '</small></span><span class="tag">Pelajaran</span></a>'
      : k === 's' ? '<a href="#/skrip/' + x.id + '"><span class="mtile" style="width:36px;height:36px;border-radius:10px;background:var(--goldbg);color:var(--gold)">' + ic('chat', 'sm') + '</span><span class="tx"><b>' + hl(x.t) + '</b><small>' + hl(snip(x.s + ' ' + x.v[0][1])) + '</small></span><span class="tag">Kalimat</span></a>'
        : '<a href="#/trik?k=' + x[0] + '"><span class="mtile" style="width:36px;height:36px;border-radius:10px;background:var(--sunk);color:var(--gold)">' + ic('spark', 'sm') + '</span><span class="tx"><b>' + hl(x[1]) + '</b><small>' + hl(x[2]) + '</small></span><span class="tag">Trik</span></a>';
    return { title: 'Cari: ' + raw, crumb: [['Cari'], ['“' + raw + '”']], html: '<div class="wrap"><div class="read anim"><h1 class="h2">' + res.length + ' hasil untuk “' + esc(raw) + '”</h1><div class="sres" style="margin-top:16px">' + (res.length ? res.slice(0, 60).map(row).join('') : '<div class="empty">Tidak ditemukan. Coba kata lain, misalnya “sindiran”, “menolak”, “gaji”, atau “marah”.</div>') + '</div></div></div>' };
  }
  function vCetak(id) {
    const m = MBY[id]; if (!m) return vNot();
    return {
      title: 'Cetak ' + m.t, crumb: [['Belajar', '#/belajar'], [m.t, '#/m/' + m.id], ['Cetak']], html: '<div class="wrap printall"><div class="read"><div class="noprint card pad" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:22px"><div style="flex:1;min-width:200px"><b>Versi cetak Modul ' + m.no + '</b><div class="mut" style="font-size:14px">Pilih "Simpan sebagai PDF" di dialog cetak untuk menyimpan modul ini.</div></div><button class="btn gold" data-print>' + ic('print') + 'Cetak / Simpan PDF</button></div>' +
        '<div class="mhead" style="' + deep(m.c) + '"><div><div class="eyebrow">Amatu Prime · Modul ' + m.no + '</div><h1>' + esc(m.t) + '</h1><p>' + esc(m.d) + '</p></div></div>' +
        m.L.map((l, i) => '<section class="lsn lesson" style="margin-top:34px"><div class="eyebrow mut">Pelajaran ' + (i + 1) + '</div><h1 style="font-size:28px">' + esc(l.t) + '</h1><p class="lead">' + esc(l.d) + '</p><div class="prose">' + md(l.x).replace(/<button[^>]*data-say[^>]*>.*?<\/button>/g, '') + '</div><div class="box"><div class="hd">' + ic('target') + 'Latihan</div><p>' + esc(l.l) + '</p></div></section>').join('') + '</div></div>'
    };
  }
  const vNot = () => ({ title: 'Tidak ditemukan', crumb: [], html: '<div class="wrap"><div class="empty">Halaman tidak ditemukan. <a href="#/" style="color:var(--gold);font-weight:600">Kembali ke beranda</a></div></div>' });

  // ---------- router ----------
  const TOP = new Set(['', 'belajar', 'skrip', 'trik', 'latihan', 'progres']);
  let cur = null, depth = 0, pend = false, toolStop = null;
  function route() {
    const h = location.hash.replace(/^#\/?/, ''); const qi = h.indexOf('?');
    const path = decodeURIComponent(qi < 0 ? h : h.slice(0, qi)), q = new URLSearchParams(qi < 0 ? '' : h.slice(qi + 1));
    const p = path.split('/').filter(Boolean); return { p, q, a: p[0] || '', b: p[1] || '', key: path + (qi < 0 ? '' : h.slice(qi)) };
  }
  function parent(r) {
    if (r.a === 'l' && LBY[r.b]) return '#/m/' + LBY[r.b].m.id;
    if (r.a === 'm') return '#/belajar';
    if (r.a === 'kuis') return MBY[r.b] ? '#/m/' + r.b : '#/latihan';
    if (r.a === 'cetak') return '#/m/' + r.b;
    if (r.a === 'latihan') return '#/latihan';
    if (r.a === 'skrip') return '#/skrip';
    return '#/';
  }
  function render(keep) {
    const r = route(); const sc = $('#scroll'); const top = keep ? sc.scrollTop : 0;
    if (toolStop) { try { toolStop(); } catch { } toolStop = null; }
    window.PRIME_BUSY = false;
    if (r.a !== 'kuis') QZ = null;
    let v;
    try {
      v = r.a === '' ? vHome() : r.a === 'belajar' ? vBelajar() : r.a === 'm' ? vModul(r.b) : r.a === 'l' ? vLesson(r.b) : r.a === 'kuis' ? vKuis(r.b)
        : r.a === 'skrip' ? vSkrip(r.b, r.q) : r.a === 'trik' ? vTrik(r.q) : r.a === 'latihan' ? vLatihan(r.b) : r.a === 'progres' ? vProgres()
          : r.a === 'cari' ? vCari(r.q) : r.a === 'cetak' ? vCetak(r.b) : vNot();
    } catch (e) { console.error(e); v = { title: 'Galat', crumb: [], html: '<div class="wrap"><div class="empty">Terjadi galat saat membuka halaman ini. <a href="#/" style="color:var(--gold)">Beranda</a></div></div>' }; }
    const view = $('#view'); view.innerHTML = v.html; cur = { r, v };
    document.title = (v.title ? v.title + ' · ' : '') + 'Amatu Prime';
    $('#crumb').innerHTML = '<a href="#/">Prime</a>' + (v.crumb || []).map(([t, h]) => ic('next') + (h ? '<a href="' + h + '">' + esc(t) + '</a>' : '<b>' + esc(t) + '</b>')).join('');
    $$('#snav a, #tabs a').forEach(a => { const k = a.dataset.k; a.classList.toggle('on', k === r.a || (k === 'm:' + r.b && (r.a === 'm' || r.a === 'kuis' || r.a === 'cetak')) || (r.a === 'l' && LBY[r.b] && k === 'm:' + LBY[r.b].m.id) || (k === 'belajar' && (/^(m|l|cetak)$/.test(r.a) || (r.a === 'kuis' && MBY[r.b]))) || (k === 'latihan' && r.a === 'kuis' && !MBY[r.b])); });
    $('#t-back').classList.toggle('hide', TOP.has(r.a) && !r.b && !r.q.toString());
    if (v.tool) { const root = $('#toolroot'); try { toolStop = v.tool.render(root, API) || null; } catch (e) { console.error(e); root.innerHTML = '<div class="empty">Alat ini gagal dimuat.</div>'; } }
    sc.scrollTop = top; if (!keep) { try { view.focus({ preventScroll: true }); } catch { } }
    if (r.a !== 'cari') { const top2 = $('#top'); if (top2.classList.contains('sopen') && !$('#q').value) top2.classList.remove('sopen'); }
    pend = false;
  }
  addEventListener('hashchange', () => { depth++; render(); });

  // ---------- events ----------
  document.addEventListener('click', e => {
    const t = e.target;
    let b;
    if ((b = t.closest('[data-say]'))) { e.preventDefault(); speak(b.dataset.say); return; }
    if ((b = t.closest('.opt'))) {
      const card = b.closest('.qcard'), r = cur && cur.r;
      if (r && r.a === 'l') {
        const l = LBY[r.b]; const i = +card.dataset.qi; const q = l.q[i];
        const it = { ex: q[q.length - 1] }; const ok = answer(card, b, it); if (ok === null) return;
        card.dataset.ans = ok ? '1' : '0';
        const cards = $$('#lq .qcard'); window.PRIME_BUSY = true;
        if (cards.every(c => c.dataset.ans)) {
          window.PRIME_BUSY = false;
          const c = cards.filter(x => x.dataset.ans === '1').length; const fresh = markDone(l, true); saveQuiz(l.id, c, cards.length);
          const db = $('#donebar'); if (db) db.outerHTML = doneBar(l, true);
          const msg = c === cards.length ? 'Sempurna, ' + c + '/' + c + ' benar!' : c + '/' + cards.length + ' benar' + (fresh ? ' · pelajaran selesai' : '');
          if (tOn === 'xp') TQ.unshift([msg, 'xp']); else toast(msg, 'xp');
          chrome();
        }
      } else if (QZ && r && r.a === 'kuis') {
        const it = QZ.items[QZ.i]; const ok = answer(card, b, it); if (ok === null) return;
        if (ok) QZ.c++; else QZ.wrong.push(it); QZ.answered = true; window.PRIME_BUSY = true;
        const nb = $('[data-nextq]'); if (nb) { nb.disabled = false; nb.focus(); }
        const tg = $('.qfoot .tag'); if (tg) tg.innerHTML = ic('check', 'sm') + QZ.c + ' benar';
      }
      return;
    }
    if ((b = t.closest('[data-nextq]'))) { if (QZ) { QZ.i++; QZ.answered = false; render(); } return; }
    if ((b = t.closest('[data-start]'))) { startQuiz(b.dataset.start, +b.dataset.n); render(); return; }
    if ((b = t.closest('[data-quit]'))) { QZ = null; window.PRIME_BUSY = false; location.hash = parent(cur.r); return; }
    if ((b = t.closest('[data-done]'))) { const l = cur && LBY[cur.r.b]; if (l) { markDone(l); const db = $('#donebar'); if (db) db.outerHTML = doneBar(l, true); } return; }
    if ((b = t.closest('[data-lfav]'))) {
      const id = cur.r.b, f = S.get('fav', {}); f.l = f.l || []; const i = f.l.indexOf(id); if (i < 0) f.l.push(id); else f.l.splice(i, 1); S.set('fav', f);
      b.classList.toggle('on', i < 0); toast(i < 0 ? 'Pelajaran disimpan' : 'Dihapus dari simpanan'); return;
    }
    if ((b = t.closest('[data-fav]'))) {
      const id = b.dataset.fav, f = S.get('fav', {}); f.s = f.s || []; const i = f.s.indexOf(id); if (i < 0) f.s.push(id); else f.s.splice(i, 1); S.set('fav', f);
      $$('[data-fav="' + id + '"]').forEach(x => x.classList.toggle('on', i < 0)); toast(i < 0 ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit'); return;
    }
    if ((b = t.closest('[data-vi]'))) {
      const card = b.closest('.sk'), s = SBY[card.dataset.sk], i = +b.dataset.vi;
      $$('[data-vi]', card).forEach(x => x.classList.toggle('on', x === b)); $('.vbox', card).innerHTML = sayHTML('v', s.v[i][1], CAN_TTS); return;
    }
    if ((b = t.closest('[data-more]'))) { b.closest('.sk').classList.toggle('open'); return; }
    if ((b = t.closest('[data-copy]'))) { const card = b.closest('.sk'), s = SBY[card.dataset.sk], on = $('[data-vi].on', card); copy(s.v[on ? +on.dataset.vi : 0][1]); return; }
    if ((b = t.closest('[data-print]'))) { window.print(); return; }
    if ((b = t.closest('[data-fsbtn]'))) { const c = S.get('cfg', {}); c.fs = { s: 'm', m: 'l', l: 's' }[c.fs || 'm']; S.set('cfg', c); applyCfg(); toast('Ukuran teks: ' + { s: 'kecil', m: 'sedang', l: 'besar' }[c.fs]); return; }
    if ((b = t.closest('[data-shuffle]'))) { TSEED = Math.random() * 1000 + 1; render(true); return; }
    if ((b = t.closest('.seg[data-set] button'))) {
      const k = b.closest('.seg').dataset.set, c = S.get('cfg', {}); c[k] = b.dataset.v || undefined; if (!c[k]) delete c[k]; S.set('cfg', c); applyCfg();
      $$('button', b.closest('.seg')).forEach(x => x.classList.toggle('on', x === b)); return;
    }
    if ((b = t.closest('[data-reset]'))) {
      confirmDlg('Atur ulang progres?', 'Pelajaran selesai, nilai kuis, XP, streak, dan tantangan akan dihapus. Catatan, jurnal, favorit, dan lembar negosiasi tetap disimpan.', 'Atur ulang', true).then(ok => {
        if (!ok) return; ['done', 'quiz', 'xp', 'act', 'chal'].forEach(k => { try { localStorage.removeItem('prime.' + k); } catch { } }); chrome(); render(true); toast('Progres diatur ulang');
      });
      return;
    }
    if ((b = t.closest('[data-theme-cycle]'))) { const c = S.get('cfg', {}); c.theme = { '': 'light', light: 'dark', dark: '' }[c.theme || '']; if (!c.theme) delete c.theme; S.set('cfg', c); applyCfg(); toast('Tema: ' + ({ light: 'terang', dark: 'gelap' }[c.theme] || 'otomatis')); chrome(); return; }
  });
  let noteT = 0;
  document.addEventListener('input', e => {
    const ta = e.target.closest && e.target.closest('[data-note]'); if (!ta) return;
    clearTimeout(noteT); noteT = setTimeout(() => { const n = S.get('notes', {}); const v = ta.value.trim(); if (v) n[ta.dataset.note] = ta.value; else delete n[ta.dataset.note]; S.set('notes', n); }, 600);
  });

  // search
  const qInp = $('#q'); let qT = 0;
  qInp.addEventListener('input', () => {
    clearTimeout(qT); qT = setTimeout(() => {
      const v = qInp.value.trim();
      if (v.length >= 2) { const h = '#/cari?q=' + encodeURIComponent(v); if (location.hash !== h) { if (route().a === 'cari') location.replace(h); else location.hash = h; } }
    }, 260);
  });
  qInp.addEventListener('keydown', e => {
    if (e.key === 'Escape') { qInp.value = ''; qInp.blur(); $('#top').classList.remove('sopen'); if (route().a === 'cari') history.back(); }
    if (e.key === 'Enter') { clearTimeout(qT); const v = qInp.value.trim(); if (v.length >= 2) location.hash = '#/cari?q=' + encodeURIComponent(v); qInp.blur(); }
  });
  $('#t-search').addEventListener('click', () => { $('#top').classList.add('sopen'); qInp.focus(); });
  qInp.addEventListener('blur', () => setTimeout(() => { if (!qInp.value) $('#top').classList.remove('sopen'); }, 150));
  $('#t-back').addEventListener('click', () => { if (depth > 0 && history.length > 1) { depth -= 2; history.back(); } else location.hash = parent(route()); });
  addEventListener('keydown', e => {
    const tag = (document.activeElement || {}).tagName;
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag) && !e.metaKey && !e.ctrlKey) { e.preventDefault(); if (innerWidth <= 860) $('#top').classList.add('sopen'); qInp.focus(); }
  });

  // ---------- chrome (sidebar, tabs, level) ----------
  function buildNav() {
    const main = [['', 'home', 'Beranda'], ['belajar', 'book', 'Belajar'], ['skrip', 'chat', 'Contoh Kalimat'], ['latihan', 'target', 'Latihan'], ['trik', 'spark', 'Tips & Trik'], ['progres', 'trophy', 'Progres']];
    $('#snav').innerHTML = main.map(([k, i, t]) => '<a href="#/' + k + '" data-k="' + k + '">' + ic(i) + t + '</a>').join('') + '<div class="sh">Modul</div>' +
      MODS.map(m => '<a class="mod" href="#/m/' + m.id + '" data-k="m:' + m.id + '"><span class="dot" style="' + grad(m.c) + '">' + mi(m.id) + '</span><span class="t">' + esc(m.t) + '</span><em data-mc="' + m.id + '"></em></a>').join('');
    $('#tabs').innerHTML = [['', 'home', 'Beranda'], ['belajar', 'book', 'Belajar'], ['skrip', 'chat', 'Kalimat'], ['latihan', 'target', 'Latihan'], ['trik', 'spark', 'Trik']].map(([k, i, t]) => '<a href="#/' + k + '" data-k="' + k + '">' + ic(i) + '<span>' + t + '</span></a>').join('');
  }
  function chrome() {
    const lv = level(xpNow()); const cfg = S.get('cfg', {});
    for (const m of MODS) { const el = $('[data-mc="' + m.id + '"]'); if (el) el.textContent = modDone(m) + '/' + m.L.length; }
    const C = 2 * Math.PI * 16;
    $('#sfoot').innerHTML = '<a class="lvcard" href="#/progres"><span class="ring"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="var(--sunk)" stroke-width="4"/><circle cx="20" cy="20" r="16" fill="none" stroke="var(--gold2)" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + (C * lv.pct).toFixed(1) + ' ' + C.toFixed(1) + '"/></svg><b>' + lv.n + '</b></span><span class="lt"><b>' + lv.name + '</b><small>' + lv.x + ' XP · streak ' + streak() + ' hari</small></span></a>' +
      '<div class="row"><button class="btn ghost sm" style="flex:1" data-theme-cycle>' + ic(cfg.theme === 'dark' ? 'moon' : 'sun', 'sm') + ({ light: 'Terang', dark: 'Gelap' }[cfg.theme] || 'Tema otomatis') + '</button></div>';
    $('#t-lvl').innerHTML = ic('crown') + '<span>Lv ' + lv.n + '</span><span class="lvt"> · ' + lv.x + ' XP</span>';
  }
  function applyCfg() {
    const c = S.get('cfg', {}), R = document.documentElement;
    if (c.theme === 'light' || c.theme === 'dark') R.dataset.theme = c.theme; else delete R.dataset.theme;
    R.dataset.fs = c.fs || 'm';
    const dark = c.theme === 'dark' || (!c.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    $$('meta[name="theme-color"]').forEach(mt => { if (c.theme) mt.setAttribute('content', dark ? '#0e0f12' : '#f6f4ef'); else mt.setAttribute('content', /dark/.test(mt.getAttribute('media') || '') ? '#0e0f12' : '#f6f4ef'); });
  }

  // ---------- other devices (amatu.js) + new version ----------
  const isBusy = () => { const a = document.activeElement; return window.PRIME_BUSY || (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.id !== 'q'); };
  function remote(key) {
    if (key && !/^prime\./.test(key)) return;
    if (key === 'prime.cfg') applyCfg();
    if (isBusy()) { pend = true; return; }
    chrome(); render(true);
  }
  addEventListener('storage', e => remote(e.key));
  setInterval(() => { if (pend && !isBusy()) { chrome(); render(true); } }, 4000);
  async function verCheck() {
    if (!VER || location.protocol === 'file:') return;
    try { const r = await fetch('versi.txt?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return; const v = (await r.text()).trim(); if (v && v !== VER && !$('#newver')) { const b = document.createElement('button'); b.id = 'newver'; b.className = 'btn gold sm'; b.innerHTML = ic('redo', 'sm') + 'Versi baru'; b.onclick = () => location.reload(); $('#top').insertBefore(b, $('#t-lvl')); } } catch { }
  }
  setInterval(verCheck, 10 * 60 * 1000); document.addEventListener('visibilitychange', () => { if (!document.hidden) verCheck(); });

  // ---------- API for tools.js ----------
  const API = {
    $, $$, esc, ic, mi, S, day, dstr, toast, gain: (n, why) => gain(n, why, true), count, touch, speak, copy, confirmDlg, CAN_TTS, P, MBY,
    busy: v => { window.PRIME_BUSY = !!v; }, keepAwake: () => { try { window.AMATU && window.AMATU.touch && window.AMATU.touch(); } catch { } }, chrome
  };
  window.PRIME_APP = API;

  // ---------- start ----------
  applyCfg(); buildNav(); chrome(); render();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyCfg);
})();
