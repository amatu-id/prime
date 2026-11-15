# Amatu Prime — Ilmu Bicara & Kendali Diri

Aplikasi belajar di **https://amatu-id.github.io/prime/** (bagian dari Portal AMATU).

Isi:
- 11 modul, 89 pelajaran: Tata Bicara, Tegas Tanpa Kasar, Mengendalikan Emosi, Menahan Diri, Cara Bersikap, Pengaruh & Manipulasi, Berpolitik, Merayu & Pesona, Negosiasi, Deal & Closing, Marketing.
- Setiap pelajaran: materi, contoh kalimat "hindari vs gunakan", latihan + catatan, dan kuis situasi (267 soal).
- 59 contoh kalimat per situasi (kerja, sindiran, menolak, konflik, jualan, PDKT, keluarga), 67 tips & trik, Tantangan 30 Hari.
- Alat latihan: Napas Tenang, Jeda 90 Detik, Jurnal Emosi, Pelatih Bicara (transkrip/rekam suara), Lembar Negosiasi (BATNA/ZOPA), kuis modul, Latihan Situasi, Ujian Akhir.
- Progres, XP, level, streak, lencana; tersimpan di `localStorage` `prime.*` dan disinkron oleh `/amatu.js`.

Terinspirasi dari [reel Instagram tentang belajar ilmu ngomong](https://www.instagram.com/p/DewEg4Vgs1h/); seluruh materi ditulis ulang dan diperluas.

## Pengembangan
- Tanpa build tool: `index.src.html`, `app.css`, `app.js`, `tools.js`, `data/*.js`.
- `./build.sh` → cek data (`tools/cek.js`), tulis `index.html` dengan `?v=<hash>` dan `versi.txt`.
- Format materi di `data/m*.js`: `## judul`, `- poin`, `1. langkah`, `> tip`, `! peringatan`, `x: kalimat lemah`, `v: kalimat kuat`, `= Istilah: definisi`, `**tebal**`. Kuis: `[soal, jawaban benar, salah1, salah2, salah3, penjelasan]`.
