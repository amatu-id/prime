/* Amatu Prime — alat latihan. Setiap alat: render(root, A) → fungsi stop (dipanggil saat pindah halaman). A = window.PRIME_APP */
(() => {
  'use strict';
  const T = window.PRIME_TOOLS = {};
  let wake = null;
  async function wakeOn() { try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch { } }
  function wakeOff() { try { wake && wake.release(); } catch { } wake = null; }
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  // ---------- Napas Tenang ----------
  const POLA = {
    kotak: { t: 'Napas kotak', d: 'Tarik 4 · tahan 4 · hembus 4 · tahan 4. Untuk fokus sebelum presentasi atau negosiasi.', f: [['Tarik', 4, 1], ['Tahan', 4, 1], ['Hembuskan', 4, .55], ['Tahan', 4, .55]] },
    tenang: { t: '4-7-8', d: 'Tarik 4 · tahan 7 · hembus 8. Menenangkan, cocok sebelum tidur.', f: [['Tarik', 4, 1], ['Tahan', 7, 1], ['Hembuskan', 8, .55]] },
    helaan: { t: 'Helaan fisiologis', d: 'Tarik lewat hidung, tambah tarikan pendek, hembus panjang lewat mulut. Cepat meredakan panik.', f: [['Tarik', 2.5, .92], ['Tarik lagi', 1, 1.06], ['Hembuskan panjang', 6.5, .55]] },
    koheren: { t: 'Koheren 5,5', d: 'Tarik 5,5 · hembus 5,5 detik. Ritme lembut untuk menurunkan stres harian.', f: [['Tarik', 5.5, 1], ['Hembuskan', 5.5, .55]] }
  };
  T.napas = {
    t: 'Napas Tenang',
    render(root, A) {
      let pola = 'kotak', menit = 2, run = false, t0 = 0, iv = 0, lastPh = -1;
      root.innerHTML = '<h1 class="h1">Napas tenang</h1><p class="sub">Tenangkan tubuh dulu, baru pikiran. Ikuti bola: membesar saat menarik napas, mengecil saat menghembuskan. Kunci semua pola: hembusan lebih panjang dari tarikan.</p>' +
        '<div class="ctrl" style="justify-content:flex-start"><div class="seg" id="np-p">' + Object.keys(POLA).map(k => '<button data-v="' + k + '" class="' + (k === pola ? 'on' : '') + '">' + POLA[k].t + '</button>').join('') + '</div>' +
        '<div class="seg" id="np-m">' + [1, 2, 3, 5].map(m => '<button data-v="' + m + '" class="' + (m === menit ? 'on' : '') + '">' + m + ' mnt</button>').join('') + '</div></div>' +
        '<p class="mut" id="np-d" style="margin:12px 0 0"></p>' +
        '<div class="card breath" style="margin-top:16px"><div class="bcircle"><div class="ringbg"></div><div class="orb" id="np-orb"></div><div class="lbl"><b id="np-ph">Siap</b><span id="np-c"></span></div></div>' +
        '<div class="bsteps" id="np-s"></div><div class="clock" id="np-left" style="margin-top:14px">' + fmt(menit * 60) + '</div>' +
        '<div class="ctrl"><button class="btn gold" id="np-go">' + A.ic('play') + 'Mulai</button></div></div>';
      const $ = s => root.querySelector(s), orb = $('#np-orb');
      const paint = () => {
        const P = POLA[pola]; $('#np-d').textContent = P.d;
        $('#np-s').innerHTML = P.f.map((f, i) => '<span data-i="' + i + '">' + f[0] + ' ' + String(f[1]).replace('.', ',') + '</span>').join('');
        if (!run) $('#np-left').textContent = fmt(menit * 60);
      };
      paint();
      function tick() {
        const P = POLA[pola], cyc = P.f.reduce((a, f) => a + f[1], 0), el = (Date.now() - t0) / 1000, left = menit * 60 - el;
        A.keepAwake();
        if (left <= 0) return stop(true);
        let x = el % cyc, i = 0; while (x >= P.f[i][1]) { x -= P.f[i][1]; i++; }
        const ph = P.f[i];
        if (i !== lastPh) {
          lastPh = i; orb.style.transitionDuration = ph[1] + 's'; orb.style.transform = 'scale(' + ph[2] + ')';
          $('#np-ph').textContent = ph[0]; root.querySelectorAll('#np-s span').forEach(s => s.classList.toggle('on', +s.dataset.i === i));
          try { navigator.vibrate && navigator.vibrate(18); } catch { }
        }
        $('#np-c').textContent = Math.ceil(ph[1] - x); $('#np-left').textContent = fmt(left);
      }
      function start() { run = true; t0 = Date.now(); lastPh = -1; A.busy(true); wakeOn(); $('#np-go').innerHTML = A.ic('stop') + 'Berhenti'; tick(); iv = setInterval(tick, 150); }
      function stop(done) {
        clearInterval(iv); iv = 0; if (!run) return; run = false; A.busy(false); wakeOff();
        orb.style.transitionDuration = '1.2s'; orb.style.transform = 'scale(.55)'; $('#np-c').textContent = '';
        $('#np-go').innerHTML = A.ic('play') + 'Mulai lagi'; root.querySelectorAll('#np-s span').forEach(s => s.classList.remove('on'));
        if (done === true) { $('#np-ph').textContent = 'Selesai'; $('#np-left').textContent = 'Bagus. Rasakan bedanya.'; A.count('br'); A.gain(5, 'Napas tenang'); }
        else { $('#np-ph').textContent = 'Siap'; $('#np-left').textContent = fmt(menit * 60); }
      }
      root.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.id === 'np-go') return run ? stop() : start();
        const seg = b.closest('.seg'); if (!seg) return;
        seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        if (seg.id === 'np-p') { pola = b.dataset.v; if (run) { t0 = Date.now(); lastPh = -1; } }
        else { menit = +b.dataset.v; if (run) t0 = Date.now(); }
        paint();
      });
      return () => stop();
    }
  };

  // ---------- Jeda 90 Detik ----------
  const PROMPT = ['Berhenti. Jangan bicara, jangan mengetik dulu.', 'Tarik napas panjang… hembuskan lebih lama dari tarikanmu.', 'Apa nama emosimu sekarang? Kesal, kecewa, malu, atau takut?', 'Rasakan kakimu di lantai. Turunkan bahu, lemaskan rahang.', 'Apa yang sebenarnya kamu butuhkan dari situasi ini?', 'Apakah ini masih penting 10 bulan lagi?', 'Respons apa yang akan membuatmu bangga besok pagi?'];
  T.jeda = {
    t: 'Jeda 90 Detik',
    render(root, A) {
      let dur = 90, run = false, t0 = 0, iv = 0;
      const R = 108, C = 2 * Math.PI * R;
      root.innerHTML = '<h1 class="h1">Jeda 90 detik</h1><p class="sub">Saat emosi memuncak, lonjakannya di tubuh biasanya mereda dalam waktu singkat bila tidak terus diberi bahan bakar. Tahan reaksimu sampai lingkaran habis, sambil menjawab pertanyaan pemandu dalam hati.</p>' +
        '<div class="ctrl" style="justify-content:flex-start"><div class="seg" id="jd-d">' + [60, 90, 120].map(s => '<button data-v="' + s + '" class="' + (s === dur ? 'on' : '') + '">' + s + ' detik</button>').join('') + '</div></div>' +
        '<div class="card pause" style="margin-top:16px"><div class="pring"><svg viewBox="0 0 240 240"><circle cx="120" cy="120" r="' + R + '" fill="none" stroke="var(--sunk)" stroke-width="12"/><circle id="jd-ring" cx="120" cy="120" r="' + R + '" fill="none" stroke="var(--gold2)" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="0"/></svg><div class="val" id="jd-v">' + dur + '</div></div>' +
        '<div class="prompt" id="jd-p">Tekan mulai saat kamu merasa ingin bereaksi.</div><div class="ctrl" id="jd-c"><button class="btn gold" id="jd-go">' + A.ic('play') + 'Mulai jeda</button></div></div>';
      const $ = s => root.querySelector(s);
      function tick() {
        const el = (Date.now() - t0) / 1000, left = dur - el; A.keepAwake();
        if (left <= 0) return stop(true);
        $('#jd-v').textContent = Math.ceil(left); $('#jd-ring').setAttribute('stroke-dashoffset', (C * el / dur).toFixed(1));
        const p = PROMPT[Math.min(PROMPT.length - 1, Math.floor(el / (dur / PROMPT.length)))]; if ($('#jd-p').textContent !== p) $('#jd-p').textContent = p;
      }
      function start() { run = true; t0 = Date.now(); A.busy(true); wakeOn(); $('#jd-c').innerHTML = '<button class="btn ghost" id="jd-go">' + A.ic('stop') + 'Hentikan</button>'; tick(); iv = setInterval(tick, 200); }
      function stop(done) {
        clearInterval(iv); iv = 0; if (!run) return; run = false; A.busy(false); wakeOff();
        if (done === true) {
          $('#jd-v').textContent = '✓'; $('#jd-ring').setAttribute('stroke-dashoffset', C.toFixed(1)); $('#jd-p').textContent = 'Sekarang kamu yang memilih responsmu, bukan emosimu.';
          $('#jd-c').innerHTML = '<a class="btn gold" href="#/latihan/jurnal">' + A.ic('pen') + 'Catat di Jurnal Emosi</a><button class="btn ghost" id="jd-go">' + A.ic('redo') + 'Ulangi</button>';
          A.count('ps'); A.gain(5, 'Jeda 90 detik');
        } else { $('#jd-v').textContent = dur; $('#jd-ring').setAttribute('stroke-dashoffset', '0'); $('#jd-p').textContent = 'Tekan mulai saat kamu merasa ingin bereaksi.'; $('#jd-c').innerHTML = '<button class="btn gold" id="jd-go">' + A.ic('play') + 'Mulai jeda</button>'; }
      }
      root.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.id === 'jd-go') return run ? stop() : start();
        const seg = b.closest('#jd-d'); if (seg && !run) { dur = +b.dataset.v; seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); $('#jd-v').textContent = dur; }
      });
      return () => stop();
    }
  };

  // ---------- Jurnal Emosi ----------
  const EMO = [['Marah', ['kesal', 'jengkel', 'tersinggung', 'frustrasi', 'geram']], ['Sedih', ['kecewa', 'terluka', 'kesepian', 'putus asa', 'kehilangan']], ['Takut', ['cemas', 'khawatir', 'gugup', 'panik', 'terancam']], ['Malu', ['canggung', 'bersalah', 'rendah diri', 'dipermalukan']], ['Senang', ['lega', 'bangga', 'bersyukur', 'tenang', 'bersemangat']]];
  T.jurnal = {
    t: 'Jurnal Emosi',
    render(root, A) {
      let sel = new Set();
      const list = () => A.S.get('jurnal', []) || [];
      function insights() {
        const L = list(); if (!L.length) return '';
        const recent = L.filter(j => j.t > Date.now() - 14 * 864e5), cnt = {};
        L.forEach(j => (j.e || []).forEach(e => { cnt[e] = (cnt[e] || 0) + 1; }));
        const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
        const avg = recent.length ? (recent.reduce((a, j) => a + (+j.i || 0), 0) / recent.length).toFixed(1).replace('.', ',') : '–';
        const st = (i, v, l) => '<div class="stat">' + A.ic(i) + '<b>' + v + '</b><small>' + l + '</small></div>';
        return '<div class="ins" style="margin-top:14px">' + st('note', L.length, 'Catatan') + st('flame', avg, 'Rata-rata intensitas 14 hari') + st('spark', top.length ? A.esc(top.join(', ')) : '–', 'Emosi tersering') + '</div>';
      }
      function rows() {
        const L = list().slice().reverse();
        if (!L.length) return '<div class="empty">Belum ada catatan. Catatan pertama paling berharga: tulis kejadian emosional terakhirmu.</div>';
        return L.map(j => '<div class="jitem"><div class="hd">' + (j.e || []).map(e => '<span class="tag">' + A.esc(e) + '</span>').join('') + '<span class="tag" style="background:var(--goldbg);color:var(--gold)">' + (j.i || '?') + '/10</span><small>' + new Date(j.t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</small><button class="ib" data-del="' + j.t + '" aria-label="Hapus">' + A.ic('trash', 'sm') + '</button></div>' +
          (j.s ? '<p><b>Situasi:</b> ' + A.esc(j.s) + '</p>' : '') + (j.p ? '<p><b>Pikiran:</b> ' + A.esc(j.p) + '</p>' : '') + (j.r ? '<p><b>Responsku:</b> ' + A.esc(j.r) + '</p>' : '') + (j.b ? '<p><b>Lain kali:</b> ' + A.esc(j.b) + '</p>' : '') + '</div>').join('');
      }
      root.innerHTML = '<h1 class="h1">Jurnal emosi</h1><p class="sub">Emosi yang dicatat lebih mudah dikenali polanya. Tulis singkat: apa yang terjadi, apa yang kamu rasakan, dan apa yang ingin kamu lakukan berbeda lain kali.</p>' +
        '<div class="card pad form" style="margin-top:18px"><div class="field"><label for="jr-s">Apa yang terjadi?</label><textarea id="jr-s" placeholder="Contoh: Atasan memotong presentasiku di depan klien."></textarea></div>' +
        '<div class="field"><label>Apa yang kamu rasakan? <span class="mut">(boleh lebih dari satu)</span></label><div class="emos" id="jr-e">' + EMO.map(([g, es]) => '<div class="grp">' + g + '</div>' + es.map(e => '<button type="button" data-e="' + e + '">' + e + '</button>').join('')).join('') + '</div></div>' +
        '<div class="field"><label for="jr-i">Seberapa kuat? <b id="jr-iv">5</b>/10</label><input type="range" id="jr-i" min="1" max="10" value="5"></div>' +
        '<div class="field"><label for="jr-p">Pikiran yang terlintas</label><input type="text" id="jr-p" placeholder="Contoh: Dia meremehkanku."></div>' +
        '<div class="field"><label for="jr-r">Apa yang kamu ucapkan atau lakukan?</label><input type="text" id="jr-r" placeholder="Contoh: Aku diam dan cemberut sepanjang rapat."></div>' +
        '<div class="field"><label for="jr-b">Lain kali aku akan…</label><input type="text" id="jr-b" placeholder="Contoh: Bilang, ‘Boleh saya selesaikan dulu poin ini?’"></div>' +
        '<div><button class="btn gold" id="jr-save">' + A.ic('check') + 'Simpan catatan</button></div></div>' +
        '<div id="jr-ins"></div><section class="sec"><div class="sech"><h2 class="h2">Catatanku</h2></div><div class="jlist" id="jr-list"></div></section>';
      const $ = s => root.querySelector(s);
      const refresh = () => { $('#jr-ins').innerHTML = insights(); $('#jr-list').innerHTML = rows(); };
      refresh();
      $('#jr-i').addEventListener('input', e => { $('#jr-iv').textContent = e.target.value; });
      root.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.e) { const v = b.dataset.e; if (sel.has(v)) sel.delete(v); else sel.add(v); b.classList.toggle('on', sel.has(v)); return; }
        if (b.id === 'jr-save') {
          const j = { t: Date.now(), s: $('#jr-s').value.trim(), e: [...sel], i: +$('#jr-i').value, p: $('#jr-p').value.trim(), r: $('#jr-r').value.trim(), b: $('#jr-b').value.trim() };
          if (!j.s && !j.e.length) { A.toast('Isi dulu kejadian atau emosinya'); return; }
          const L = list(); L.push(j); A.S.set('jurnal', L.slice(-200));
          ['#jr-s', '#jr-p', '#jr-r', '#jr-b'].forEach(s => { $(s).value = ''; }); sel = new Set(); root.querySelectorAll('[data-e]').forEach(x => x.classList.remove('on')); $('#jr-i').value = 5; $('#jr-iv').textContent = '5';
          A.count('jr'); A.gain(5, 'Jurnal emosi'); refresh(); return;
        }
        if (b.dataset.del) {
          A.confirmDlg('Hapus catatan ini?', 'Catatan jurnal yang dihapus tidak bisa dikembalikan.', 'Hapus', true).then(ok => { if (!ok) return; A.S.set('jurnal', list().filter(j => String(j.t) !== b.dataset.del)); refresh(); });
        }
      });
      return null;
    }
  };

  // ---------- Pelatih Bicara ----------
  const TOPIK = ['Ceritakan pekerjaan atau kegiatanmu sehari-hari dalam satu menit.', 'Perkenalkan dirimu seperti di awal wawancara kerja.', 'Ceritakan satu kegagalan dan pelajaran terbesarnya.', 'Yakinkan temanmu untuk mulai olahraga minggu ini.', 'Tolak ajakan lembur akhir pekan dengan sopan dan tegas.', 'Usulkan kepada atasan agar rapat mingguan dipersingkat.', 'Jelaskan hobimu kepada orang yang belum pernah mencobanya.', 'Jual produk favoritmu seolah kamu penjualnya.', 'Beri masukan kepada rekan yang sering terlambat, pakai format SBI.', 'Jawab pertanyaan: kenapa kami harus memilih kamu?', 'Ceritakan tempat terindah yang pernah kamu kunjungi.', 'Jelaskan satu keputusan sulit yang pernah kamu ambil.', 'Minta kenaikan gaji dengan menyebut tiga pencapaianmu.', 'Jawab dengan tenang: "Kamu yakin bisa pegang proyek ini?"', 'Ceritakan buku, film, atau video yang mengubah cara pikirmu.', 'Jelaskan cara membuat makanan favoritmu.', 'Beri sambutan singkat di acara ulang tahun sahabatmu.', 'Ajak tim mencoba cara kerja baru selama satu bulan.', 'Klarifikasi salah paham dengan teman soal pesan di grup.', 'Ceritakan apa yang ingin kamu capai lima tahun lagi.', 'Tawarkan jasamu kepada calon klien dalam 60 detik.', 'Jelaskan kepada orang tuamu kenapa kamu ingin pindah kerja.', 'Ceritakan momen saat kamu berhasil menahan emosi.', 'Pimpin pembukaan rapat: tujuan, agenda, dan hasil yang diharapkan.'];
  const PENGISI = ['eh', 'ehm', 'em', 'emm', 'hmm', 'anu', 'apa namanya', 'apa ya', 'gitu loh'];
  const KEBIASAAN = ['kayak', 'terus', 'jadi', 'nah', 'sebenarnya', 'intinya', 'pokoknya', 'sih', 'gitu'];
  const LEMAH = ['mungkin', 'kayaknya', 'sepertinya', 'cuma', 'maaf', 'agak', 'kurang tahu', 'nggak tahu'];
  const rx = w => new RegExp('(^|[^a-z])(' + w.map(x => x.replace(/ /g, '\\s+')).join('|') + ')(?=$|[^a-z])', 'gi');
  T.bicara = {
    t: 'Pelatih Bicara',
    render(root, A) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const canRec = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
      let mode = SR ? 'teks' : canRec ? 'suara' : 'waktu', dur = 60, topic = TOPIK[Math.floor(Math.random() * TOPIK.length)];
      let run = false, t0 = 0, iv = 0, rec = null, finals = '', interim = '', media = null, chunks = [], stream = null, audioUrl = '';
      root.innerHTML = '<h1 class="h1">Pelatih bicara</h1><p class="sub">Bicara tentang topik di bawah. Setelah selesai, lihat tempo bicara, kata pengisi, dan kata pelemahmu, lalu centang daftar periksa. Latih 3–5 kali seminggu.</p>' +
        '<div class="ctrl" style="justify-content:flex-start"><div class="seg" id="sp-m">' + [['teks', 'Transkrip', !!SR], ['suara', 'Rekam suara', canRec], ['waktu', 'Timer saja', true]].filter(x => x[2]).map(([v, t]) => '<button data-v="' + v + '" class="' + (v === mode ? 'on' : '') + '">' + t + '</button>').join('') + '</div>' +
        '<div class="seg" id="sp-d">' + [30, 60, 90].map(s => '<button data-v="' + s + '" class="' + (s === dur ? 'on' : '') + '">' + s + ' dtk</button>').join('') + '</div></div>' +
        '<div class="card pad coach" style="margin-top:16px"><div class="mut" style="font-size:12.5px;font-weight:700;letter-spacing:.08em">TOPIK</div><div class="topic" id="sp-t"></div><button class="btn ghost sm" id="sp-new" style="margin-top:12px">' + A.ic('shuffle', 'sm') + 'Topik lain</button>' +
        '<button class="recbtn" id="sp-go" aria-label="Mulai">' + A.ic('mic') + '</button><div class="clock" id="sp-c">' + fmt(dur) + '</div><div class="mut" id="sp-h" style="font-size:13.5px;margin-top:6px"></div>' +
        '<div id="sp-out"></div></div>';
      const $ = s => root.querySelector(s);
      const hint = () => { $('#sp-h').textContent = mode === 'teks' ? 'Ucapanmu ditulis otomatis (butuh izin mikrofon). Pengenal suara kadang tidak menulis "eh/em"; dengarkan juga dirimu.' : mode === 'suara' ? 'Suaramu direkam di perangkat ini saja untuk diputar ulang. Tidak dikirim ke mana pun.' : 'Bicara sambil melihat timer, lalu nilai dirimu dengan daftar periksa.'; };
      const paint = () => { $('#sp-t').textContent = topic; hint(); if (!run) $('#sp-c').textContent = fmt(dur); };
      paint();
      function tick() {
        const el = (Date.now() - t0) / 1000, left = dur - el; A.keepAwake();
        $('#sp-c').textContent = fmt(left);
        if (mode === 'teks') { const tr = $('#sp-live'); if (tr) tr.innerHTML = A.esc(finals) + ' <span class="int">' + A.esc(interim) + '</span>'; }
        if (left <= 0) stop(true);
      }
      async function start() {
        finals = ''; interim = ''; $('#sp-out').innerHTML = mode === 'teks' ? '<div class="transcript" id="sp-live"><span class="int">Mendengarkan…</span></div>' : '';
        if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = ''; }
        if (mode === 'teks') {
          try {
            rec = new SR(); rec.lang = 'id-ID'; rec.continuous = true; rec.interimResults = true;
            rec.onresult = ev => { let it = ''; for (let i = ev.resultIndex; i < ev.results.length; i++) { const r = ev.results[i]; if (r.isFinal) finals += r[0].transcript.trim() + ' '; else it += r[0].transcript; } interim = it; };
            rec.onerror = ev => { if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { A.toast('Izin mikrofon ditolak. Pakai mode Timer saja.'); stop(false); } };
            rec.onend = () => { if (run && mode === 'teks') { try { rec.start(); } catch { } } };
            rec.start();
          } catch (e) { A.toast('Pengenal suara tidak tersedia di perangkat ini'); return; }
        } else if (mode === 'suara') {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true }); chunks = [];
            media = new MediaRecorder(stream); media.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); }; media.start(500);
          } catch { A.toast('Izin mikrofon ditolak. Pakai mode Timer saja.'); return; }
        }
        run = true; t0 = Date.now(); A.busy(true); wakeOn(); $('#sp-go').classList.add('on'); $('#sp-go').innerHTML = A.ic('stop'); iv = setInterval(tick, 250);
      }
      function stop(auto) {
        clearInterval(iv); iv = 0; if (!run) return; run = false; A.busy(false); wakeOff();
        const secs = Math.max(1, Math.min(dur, (Date.now() - t0) / 1000));
        $('#sp-go').classList.remove('on'); $('#sp-go').innerHTML = A.ic('mic'); $('#sp-c').textContent = fmt(dur);
        if (rec) { const r = rec; rec = null; try { r.onend = null; r.stop(); } catch { } setTimeout(() => result(secs, auto), 700); return; }
        if (media) { const m = media; media = null; m.onstop = () => { try { stream.getTracks().forEach(t => t.stop()); } catch { } audioUrl = URL.createObjectURL(new Blob(chunks, { type: m.mimeType || 'audio/webm' })); result(secs, auto); }; try { m.stop(); } catch { result(secs, auto); } return; }
        result(secs, auto);
      }
      function result(secs, auto) {
        const text = (finals + ' ' + interim).replace(/\s+/g, ' ').trim();
        const checks = ['Kalimat pertama langsung ke inti', 'Nada turun di akhir pernyataan', 'Ada jeda setelah poin penting', 'Tidak terburu-buru, napas teratur', 'Penutup jelas (ringkasan atau ajakan)'];
        let html = '';
        if (mode === 'teks') {
          const words = text ? text.split(/\s+/).length : 0, wpm = Math.round(words / (secs / 60));
          const nP = (text.match(rx(PENGISI)) || []).length, nL = (text.match(rx(LEMAH)) || []).length;
          const kb = {}; (text.match(rx(KEBIASAAN)) || []).forEach(w => { const k = w.replace(/^[^a-z]/i, '').toLowerCase(); kb[k] = (kb[k] || 0) + 1; });
          const habits = Object.entries(kb).filter(x => x[1] >= 3).sort((a, b) => b[1] - a[1]);
          const hl = A.esc(text).replace(rx(PENGISI), '$1<mark>$2</mark>').replace(rx(LEMAH), '$1<mark class="h">$2</mark>');
          const tempo = !words ? 'Tidak ada suara yang tertangkap' : secs < 10 ? 'Terlalu singkat untuk mengukur tempo' : wpm < 100 ? 'Agak lambat: coba lebih mengalir' : wpm > 170 ? 'Terlalu cepat: pelankan dan beri jeda' : 'Tempo nyaman didengar';
          const st = (v, l) => '<div class="stat"><b>' + v + '</b><small>' + l + '</small></div>';
          html = '<div class="metrics">' + st(words && secs >= 10 ? wpm : '–', 'kata/menit · ' + tempo) + st(words, 'kata dalam ' + Math.round(secs) + ' detik') + st(nP, 'kata pengisi (eh, em, anu…)') + st(nL, 'kata pelemah (mungkin, cuma…)') + '</div>' +
            '<div class="transcript">' + (hl || '<span class="int">Tidak ada ucapan yang tertulis. Pastikan mikrofon aktif dan bicara cukup keras.</span>') + '</div>' +
            (habits.length ? '<p class="mut" style="text-align:left;margin:10px 0 0;font-size:14px">Kata kebiasaan yang sering muncul: ' + habits.map(([w, n]) => '<b>' + A.esc(w) + '</b> ×' + n).join(', ') + '. Coba ganti sebagian dengan jeda.</p>' : '');
        } else if (mode === 'suara' && audioUrl) {
          html = '<div style="margin-top:16px"><audio controls src="' + audioUrl + '" style="width:100%"></audio><p class="mut" style="font-size:13.5px">Dengarkan ulang: hitung "eh/em", perhatikan nada di akhir kalimat dan kecepatanmu.</p></div>';
        }
        html += '<div class="checks">' + checks.map((c, i) => '<label><input type="checkbox" data-ck="' + i + '"> <span>' + c + '</span></label>').join('') + '</div>' +
          '<div class="ctrl"><button class="btn gold" id="sp-again">' + A.ic('redo') + 'Ulangi topik ini</button><button class="btn ghost" id="sp-next">' + A.ic('shuffle') + 'Topik baru</button></div>';
        $('#sp-out').innerHTML = html;
        if (secs >= 15) { A.count('sp'); A.gain(10, 'Latihan bicara'); } else if (!auto) A.toast('Bicara minimal 15 detik untuk dihitung');
      }
      root.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.id === 'sp-go') return run ? stop(false) : start();
        if (b.id === 'sp-new' || b.id === 'sp-next') { if (run) return; let n; do n = TOPIK[Math.floor(Math.random() * TOPIK.length)]; while (n === topic && TOPIK.length > 1); topic = n; paint(); if (b.id === 'sp-next') $('#sp-out').innerHTML = ''; return; }
        if (b.id === 'sp-again') { $('#sp-out').innerHTML = ''; start(); return; }
        const seg = b.closest('.seg'); if (!seg || run) return;
        seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        if (seg.id === 'sp-m') mode = b.dataset.v; else dur = +b.dataset.v;
        paint();
      });
      return () => { stop(false); if (audioUrl) URL.revokeObjectURL(audioUrl); };
    }
  };

  // ---------- Lembar Negosiasi ----------
  const NF = [
    ['t', 'Judul', 'Contoh: Gaji posisi supervisor PT Maju', 'text', 'full'],
    ['arah', 'Saya ingin angka yang…', '', 'arah', 'full'],
    ['tujuan', 'Tujuan & kepentingan saya', 'Apa yang paling penting buatku? (bukan hanya angka)', 'area'],
    ['mereka', 'Kepentingan mereka (perkiraan)', 'Apa yang mereka khawatirkan atau inginkan?', 'area'],
    ['batna', 'BATNA saya', 'Kalau gagal sepakat, apa alternatif terbaikku?', 'area'],
    ['batnaM', 'BATNA mereka (perkiraan)', 'Kalau gagal dengan saya, apa pilihan mereka?', 'area'],
    ['buka', 'Angka pembuka (jangkar)', 'Contoh: 16.750.000', 'num'],
    ['target', 'Target saya', 'Contoh: 15.500.000', 'num'],
    ['batas', 'Batas saya (titik pergi)', 'Contoh: 14.000.000', 'num'],
    ['batasM', 'Perkiraan batas mereka', 'Contoh: 15.000.000', 'num'],
    ['tukar', 'Konsesi yang bisa ditukar', 'Murah bagiku, bernilai bagi mereka: waktu mulai, termin, durasi kontrak…', 'area', 'full'],
    ['tanya', 'Pertanyaan terkalibrasi', '', 'area', 'full'],
    ['hasil', 'Catatan hasil', 'Apa yang terjadi? Apa yang akan kulakukan berbeda?', 'area', 'full']
  ];
  const TANYA = 'Apa yang paling penting buat Anda dalam kesepakatan ini?\nBagaimana saya bisa menyetujui itu, kalau batas kami hanya …?\nApa yang perlu terjadi supaya ini berhasil untuk kedua pihak?';
  function num(s) {
    s = String(s || '').toLowerCase().replace(/rp|\s/g, ''); if (!s) return null;
    let mult = 1; if (/(jt|juta)$/.test(s)) { mult = 1e6; s = s.replace(/(jt|juta)$/, ''); } else if (/(rb|ribu|k)$/.test(s)) { mult = 1e3; s = s.replace(/(rb|ribu|k)$/, ''); } else if (/(m|miliar)$/.test(s)) { mult = 1e9; s = s.replace(/(m|miliar)$/, ''); }
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(',', '.');
    const v = parseFloat(s); return isFinite(v) ? v * mult : null;
  }
  const rp = v => v == null ? '–' : 'Rp ' + Math.round(v).toLocaleString('id-ID');
  T.nego = {
    t: 'Lembar Negosiasi',
    render(root, A) {
      let sheets = A.S.get('nego', []) || []; let curId = sheets.length ? sheets[sheets.length - 1].id : null; let saveT = 0;
      const curS = () => sheets.find(s => s.id === curId);
      function newSheet() { const s = { id: Date.now().toString(36), t: '', arah: 'naik', tanya: TANYA }; sheets.push(s); curId = s.id; A.S.set('nego', sheets); draw(); }
      function zopa(s) {
        const b = num(s.batas), bm = num(s.batasM), tg = num(s.target), o = num(s.buka);
        const vals = [b, bm, tg, o].filter(v => v != null); if (vals.length < 2 || b == null || bm == null) return '<div class="zopa mut" style="font-size:14px">Isi <b>batas saya</b> dan <b>perkiraan batas mereka</b> untuk melihat zona kesepakatan (ZOPA).</div>';
        const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * .12 || hi * .05 || 1, a = lo - pad, z = hi + pad, pos = v => ((v - a) / (z - a) * 100).toFixed(2) + '%';
        const naik = s.arah !== 'turun'; const zl = naik ? b : bm, zh = naik ? bm : b; const ada = zh >= zl;
        const pin = (v, c, t, cls) => v == null ? '' : '<span class="pin ' + cls + '" style="left:' + pos(v) + ';background:' + c + '"><span>' + t + '</span></span>';
        return '<div class="zopa"><b>' + (ada ? 'Ada ZOPA: ' + rp(zl) + ' – ' + rp(zh) : 'Belum ada ZOPA') + '</b><div class="mut" style="font-size:13.5px">' + (ada ? (tg != null && (naik ? tg > zh : tg < zl) ? 'Targetmu di luar perkiraan batas mereka: siapkan alasan kuat atau variabel lain untuk ditukar.' : 'Kesepakatan mungkin terjadi di zona hijau. Buka dengan jangkar, lalu bergerak dengan konsesi mengecil.') : 'Batas kedua pihak tidak bertemu. Perkuat BATNA, cari variabel selain harga, atau siap pergi.') + '</div>' +
          '<div class="track">' + (ada ? '<span class="seg-z" style="left:' + pos(zl) + ';width:calc(' + pos(zh) + ' - ' + pos(zl) + ')"></span>' : '') + pin(b, 'var(--bad)', 'Batasku', 'a') + pin(bm, 'var(--ink2)', 'Batas mereka', 'b') + pin(tg, 'var(--good)', 'Target', 'a') + pin(o, 'var(--gold2)', 'Pembuka', 'b') + '</div></div>';
      }
      function opener(s) {
        const o = num(s.buka); if (o == null) return '';
        return '<div class="box" style="margin-top:14px"><div class="hd">' + A.ic('chat') + 'Contoh kalimat pembuka</div><p>“Berdasarkan riset dan nilai yang saya bawa, angka yang saya ajukan ' + rp(o) + '. ' + (s.tukar ? 'Saya juga terbuka membahas hal lain seperti yang sudah saya catat. ' : '') + 'Bagaimana menurut Anda?” Lalu diam, biarkan mereka merespons lebih dulu.</p></div>';
      }
      function draw() {
        const s = curS();
        root.innerHTML = '<div class="sech" style="align-items:flex-start"><div><h1 class="h1">Lembar negosiasi</h1><p class="sub">Negosiasi dimenangkan sebelum dimulai. Isi lembar ini sebelum bicara soal gaji, harga, kontrak, atau sewa. Tersimpan otomatis.</p></div>' + (s ? '<button class="btn ghost sm noprint" data-print>' + A.ic('print', 'sm') + 'Cetak</button>' : '') + '</div>' +
          '<div class="sheets noprint">' + sheets.map(x => '<button class="chip' + (x.id === curId ? ' on' : '') + '" data-sh="' + x.id + '">' + A.esc(x.t || 'Tanpa judul') + '</button>').join('') + '<button class="chip" id="ng-new">' + A.ic('plus', 'sm') + 'Lembar baru</button></div>' +
          (s ? '<div class="card pad"><div class="ngrid form">' + NF.map(([k, l, ph, ty, full]) => '<div class="field' + (full ? ' full' : '') + '"><label for="ng-' + k + '">' + l + '</label>' +
            (ty === 'area' ? '<textarea id="ng-' + k + '" data-k="' + k + '" placeholder="' + A.esc(ph) + '">' + A.esc(s[k] || '') + '</textarea>'
              : ty === 'arah' ? '<div class="seg" id="ng-arah"><button data-v="naik" class="' + (s.arah !== 'turun' ? 'on' : '') + '">Lebih tinggi (penjual, gaji)</button><button data-v="turun" class="' + (s.arah === 'turun' ? 'on' : '') + '">Lebih rendah (pembeli)</button></div>'
                : '<input type="text" id="ng-' + k + '" data-k="' + k + '" inputmode="' + (ty === 'num' ? 'decimal' : 'text') + '" placeholder="' + A.esc(ph) + '" value="' + A.esc(s[k] || '') + '">' + (ty === 'num' ? '<div class="hint" data-h="' + k + '">' + (num(s[k]) != null ? rp(num(s[k])) : 'Boleh tulis 15,5 jt atau 15.500.000') + '</div>' : '')) + '</div>').join('') + '</div>' +
            '<div id="ng-z" style="margin-top:14px">' + zopa(s) + '</div><div id="ng-o">' + opener(s) + '</div>' +
            '<div style="margin-top:16px;display:flex;justify-content:flex-end" class="noprint"><button class="btn ghost sm" id="ng-del" style="color:var(--bad)">' + A.ic('trash', 'sm') + 'Hapus lembar</button></div></div>'
            : '<div class="card pad empty">Belum ada lembar. <button class="btn gold sm" id="ng-new2" style="margin-left:8px">' + A.ic('plus', 'sm') + 'Buat lembar pertama</button></div>') +
          '<div class="box"><div class="hd">' + A.ic('info') + 'Ingat</div><p>Jangan ungkapkan batasmu. Setiap konsesi ditukar dengan sesuatu ("kalau… maka…"), konsesi makin mengecil, dan setelah menyebut angka: diam.</p></div>';
      }
      function save() {
        clearTimeout(saveT); saveT = setTimeout(() => {
          A.S.set('nego', sheets); const s = curS();
          if (s && !s.xp && s.t && num(s.batas) != null && num(s.target) != null && (s.batna || '').length > 3) { s.xp = 1; A.S.set('nego', sheets); A.gain(5, 'Lembar negosiasi'); }
        }, 500);
      }
      draw();
      root.addEventListener('input', e => {
        const k = e.target.dataset && e.target.dataset.k; const s = curS(); if (!k || !s) return;
        s[k] = e.target.value; save();
        if (k === 't') { const c = root.querySelector('[data-sh="' + s.id + '"]'); if (c) c.textContent = s.t || 'Tanpa judul'; }
        const h = root.querySelector('[data-h="' + k + '"]'); if (h) h.textContent = num(s[k]) != null ? rp(num(s[k])) : 'Boleh tulis 15,5 jt atau 15.500.000';
        if (/^(buka|target|batas|batasM|tukar)$/.test(k)) { root.querySelector('#ng-z').innerHTML = zopa(s); root.querySelector('#ng-o').innerHTML = opener(s); }
      });
      root.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.id === 'ng-new' || b.id === 'ng-new2') return newSheet();
        if (b.dataset.sh) { curId = b.dataset.sh; draw(); return; }
        if (b.closest('#ng-arah')) { const s = curS(); s.arah = b.dataset.v; save(); b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); root.querySelector('#ng-z').innerHTML = zopa(s); return; }
        if (b.id === 'ng-del') { A.confirmDlg('Hapus lembar ini?', 'Lembar negosiasi yang dihapus tidak bisa dikembalikan.', 'Hapus', true).then(ok => { if (!ok) return; sheets = sheets.filter(x => x.id !== curId); curId = sheets.length ? sheets[sheets.length - 1].id : null; A.S.set('nego', sheets); draw(); }); }
      });
      return () => { clearTimeout(saveT); A.S.set('nego', sheets); };
    }
  };

  // ---------- Tantangan 30 Hari ----------
  T.tantangan = {
    t: 'Tantangan 30 Hari',
    render(root, A) {
      const C = A.P.C;
      function draw() {
        const ch = A.S.get('chal', {}), d = ch.d || {}, n = Object.keys(d).length;
        let today = 1; while (today <= C.length && d[today] && d[today] !== A.day()) today++;
        root.innerHTML = '<h1 class="h1">Tantangan 30 hari</h1><p class="sub">Satu misi kecil per hari. Kebiasaan bicara dan kendali diri tumbuh dari latihan kecil yang diulang. Centang misi saat selesai; urutannya boleh fleksibel.</p>' +
          '<div class="card pad" style="margin-top:18px;display:flex;align-items:center;gap:16px;flex-wrap:wrap"><div style="flex:1;min-width:200px"><b>' + n + ' dari ' + C.length + ' misi selesai</b><div class="bar" style="margin-top:8px;height:8px"><i style="width:' + (n / C.length * 100) + '%"></i></div></div>' + (ch.s ? '<span class="tag">Mulai ' + A.dstr(ch.s) + '</span>' : '') + '</div>' +
          '<div class="days" style="margin-top:16px">' + C.map((c, i) => { const k = i + 1, m = A.MBY[c[2]]; return '<button class="day' + (d[k] ? ' done' : '') + (k === today && !d[k] ? ' today' : '') + '" data-d="' + k + '"><span class="n">' + (d[k] ? A.ic('check', 'sm') : k) + '</span><span class="tx"><b>' + A.esc(c[0]) + '</b><small>' + A.esc(c[1]) + '</small>' + (m ? '<small style="color:' + m.c + ';font-weight:650;margin-top:4px">' + A.esc(m.t) + '</small>' : '') + '</span></button>'; }).join('') + '</div>';
      }
      draw();
      root.addEventListener('click', e => {
        const b = e.target.closest('[data-d]'); if (!b) return;
        const k = b.dataset.d, ch = A.S.get('chal', {}); ch.d = ch.d || {};
        if (ch.d[k]) { delete ch.d[k]; A.S.set('chal', ch); draw(); return; }
        ch.d[k] = A.day(); if (!ch.s) ch.s = A.day(); A.S.set('chal', ch); A.gain(10, 'Misi hari ke-' + k); draw();
        if (Object.keys(ch.d).length === A.P.C.length) A.toast('Semua misi selesai. Luar biasa!', 'xp');
      });
      return null;
    }
  };
})();
