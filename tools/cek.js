// Validasi data Prime: struktur pelajaran, kuis, skrip, trik, tantangan, dan markup yang tidak dikenali.
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '..', 'data');
const ctx = { PRIME: { M: [], S: [], T: [], C: [] } }; vm.createContext(ctx);
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
const P = ctx.PRIME, err = [], warn = [], ids = new Set();
const mods = new Set(P.M.map(m => m.id));
let nl = 0, nq = 0, words = 0;
for (const m of P.M) {
  for (const k of ['id', 'no', 't', 's', 'c', 'd', 'L']) if (m[k] == null) err.push('modul ' + m.id + ' tanpa ' + k);
  if (!/^#[0-9a-f]{6}$/i.test(m.c)) err.push('warna modul ' + m.id + ' bukan #rrggbb');
  for (const l of m.L) {
    nl++;
    if (ids.has(l.id)) err.push('id ganda ' + l.id); ids.add(l.id);
    for (const k of ['id', 't', 'd', 'x', 'l', 'q']) if (!l[k]) err.push(l.id + ' tanpa ' + k);
    words += (l.x + ' ' + l.l).split(/\s+/).length;
    for (const line of l.x.split('\n')) {
      const t = line.trim(); if (!t) continue;
      if (/^=/.test(t) && !/^= ([^:]+): (.*)/.test(t)) err.push(l.id + ': baris definisi tidak dikenali: ' + t.slice(0, 60));
      if (/^[xv]:/.test(t) && !/^[xv]: \S/.test(t)) err.push(l.id + ': baris contoh tidak dikenali: ' + t.slice(0, 60));
      if (/^#(?!# )/.test(t)) err.push(l.id + ': judul harus "## ": ' + t.slice(0, 60));
      if ((t.match(/\*\*/g) || []).length % 2) err.push(l.id + ': ** tidak berpasangan: ' + t.slice(0, 60));
    }
    for (const q of l.q) {
      nq++;
      if (q.length < 5) err.push(l.id + ': soal kurang opsi: ' + q[0]);
      const opts = q.slice(1, -1); if (new Set(opts).size !== opts.length) err.push(l.id + ': opsi ganda: ' + q[0]);
      if (opts.length > 4) err.push(l.id + ': opsi lebih dari 4: ' + q[0]);
      if (q[q.length - 1].length < 20) warn.push(l.id + ': penjelasan pendek: ' + q[0]);
    }
  }
}
// jalur: setiap modul tepat di satu tingkat, nomor modul = urutan jalur, id tingkat tidak bentrok dengan modul/kunci kuis
const J = P.J || [], inJ = new Map(), RES = new Set(['akhir', 'campur', 'penempatan']);
if (!J.length) err.push('PRIME.J (data/jalur.js) kosong');
J.forEach((j, i) => {
  for (const k of ['id', 'no', 't', 's', 'c', 'd', 'm']) if (j[k] == null) err.push('tingkat ' + j.id + ' tanpa ' + k);
  if (j.no !== i + 1) err.push('tingkat ' + j.id + ' no harus ' + (i + 1));
  if (!/^#[0-9a-f]{6}$/i.test(j.c)) err.push('warna tingkat ' + j.id + ' bukan #rrggbb');
  if (mods.has(j.id) || RES.has(j.id)) err.push('id tingkat bentrok: ' + j.id);
  for (const id of j.m || []) { if (!mods.has(id)) err.push('tingkat ' + j.id + ': modul tidak dikenal ' + id); if (inJ.has(id)) err.push('modul ' + id + ' di dua tingkat'); inJ.set(id, j.id); }
});
let urut = 0; for (const j of J) for (const id of j.m || []) { urut++; const m = P.M.find(x => x.id === id); if (m && m.no !== urut) err.push('modul ' + id + ' no ' + m.no + ', urutan jalur ' + urut); }
for (const m of P.M) { if (!inJ.has(m.id)) err.push('modul ' + m.id + ' tidak masuk tingkat mana pun'); if (RES.has(m.id)) err.push('id modul bentrok: ' + m.id); }
const cats = new Set((P.SK || []).map(c => c.id)), sid = new Set();
for (const s of P.S) {
  if (sid.has(s.id)) err.push('skrip id ganda ' + s.id); sid.add(s.id);
  if (!cats.has(s.k)) err.push('skrip ' + s.id + ' kategori tidak dikenal ' + s.k);
  if (s.m && !mods.has(s.m)) err.push('skrip ' + s.id + ' modul tidak dikenal ' + s.m);
  if (!s.x || !s.x.length || !s.v || !s.v.length || !s.w || !s.s) err.push('skrip ' + s.id + ' tidak lengkap');
  for (const v of s.v || []) if (!Array.isArray(v) || v.length !== 2) err.push('skrip ' + s.id + ' versi salah bentuk');
}
for (const t of P.T) if (!mods.has(t[0]) || t.length !== 3) err.push('trik salah: ' + t[1]);
for (const c of P.C) if (c.length !== 3 || !mods.has(c[2])) err.push('tantangan salah: ' + c[0]);
if (P.C.length !== 30) warn.push('tantangan bukan 30: ' + P.C.length);
for (const w of warn) console.log('peringatan:', w);
if (err.length) { for (const e of err) console.error('GALAT:', e); process.exit(1); }
console.log('data ok: ' + J.length + ' tingkat, ' + P.M.length + ' modul, ' + nl + ' pelajaran, ' + nq + ' soal, ' + P.S.length + ' skrip, ' + P.T.length + ' trik, ' + P.C.length + ' tantangan, ±' + words + ' kata materi');
