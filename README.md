# Amatu Prime — Ilmu Bicara & Kendali Diri

Aplikasi belajar di **https://amatu-id.github.io/prime/** (bagian dari Portal AMATU).

Isi — jalur 4 tingkat dari dasar hingga fasih (23 modul, 173 pelajaran):
- **Dasar**: Dasar Komunikasi, Percaya Diri, Tata Bicara, Pilihan Kata, Seni Mengobrol.
- **Menengah**: Mengendalikan Emosi, Menahan Diri, Tegas Tanpa Kasar, Cara Bersikap, Chat, Email & Digital, Orang Terdekat.
- **Mahir**: Pengaruh & Manipulasi, Merayu & Pesona, Negosiasi, Deal & Closing, Marketing, Berpolitik.
- **Fasih**: Bicara Spontan, Argumentasi & Debat, Percakapan Sulit, Panggung & Pidato, Memimpin dengan Kata, Menjadi Fasih.
- Setiap pelajaran: materi, contoh kalimat "hindari vs gunakan", latihan + catatan, dan kuis situasi (519 soal).
- Halaman per tingkat, Ujian Tingkat (20 soal, lulus 80% = lencana), Tes Penempatan (3 soal per tingkat → saran tingkat awal).
- 92 contoh kalimat per situasi (10 kategori, termasuk Chat & Online, Acara & Panggung, Memimpin Tim), 127 tips & trik, Tantangan 30 Hari.
- Alat latihan: Napas Tenang, Jeda 90 Detik, Jurnal Emosi, Pelatih Bicara (transkrip/rekam suara), Lembar Negosiasi (BATNA/ZOPA), kuis modul, ujian tingkat, Tes Penempatan, Latihan Situasi, Ujian Akhir.
- Progres, XP, level, streak, lencana; tersimpan di `localStorage` `prime.*` dan disinkron oleh `/amatu.js`.

Terinspirasi dari [reel Instagram tentang belajar ilmu ngomong](https://www.instagram.com/p/DewEg4Vgs1h/); seluruh materi ditulis ulang dan diperluas.

## Pengembangan
- Tanpa build tool: `index.src.html`, `app.css`, `app.js`, `tools.js`, `data/*.js`.
- `./build.sh` → cek data (`tools/cek.js`), tulis `index.html` dengan `?v=<hash>` dan `versi.txt`.
- Urutan modul ditentukan `data/jalur.js` (`PRIME.J`: tingkat → daftar id modul); `no` di file modul harus sama dengan urutan jalur (dicek `tools/cek.js`). Nama file `m01…m23` hanya urutan pembuatan, bukan nomor modul.
- Format materi di `data/m*.js`: `## judul`, `- poin`, `1. langkah`, `> tip`, `! peringatan`, `x: kalimat lemah`, `v: kalimat kuat`, `= Istilah: definisi`, `**tebal**`. Kuis: `[soal, jawaban benar, salah1, salah2, salah3, penjelasan]`.
