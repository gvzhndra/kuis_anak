# 🎒 Kuis Anak

Latihan Ujian Akhir Semester (Kurikulum Merdeka) untuk **Kelas 1** dan **Kelas 3 SD**.
Dibuka di browser (tablet/HP/laptop), tanpa instal aplikasi.

## Isi

| Kelas | Pelajaran | Sumber materi (semester 1) |
|---|---|---|
| 1 | Matematika | Buku Siswa Matematika Kelas I · Bab 1–4 (soal otomatis + soal pilihan) |
| 1 | Bahasa Indonesia | *Aku Bisa!* Kelas I (Edisi Revisi) · Bab 1–4 |
| 1 | Pendidikan Pancasila | Buku Siswa Kelas I · Bab 1–2 |
| 1 | Agama Hindu | Buku Siswa Agama Hindu & Budi Pekerti Kelas I · Bab 1–2 |
| 1 | Bahasa Bali | Materi umum muatan lokal (bukan dari SIBI) |
| 1 | Bahasa Inggris | Materi umum (buku nasional baru mulai Kelas III) |
| 1 | PJOK | Buku Siswa PJOK Kelas I · Bab 1–3 |
| 1 | TIK | Materi umum muatan sekolah (bukan mapel nasional SD) |
| 3 | Matematika | Buku Siswa Matematika Kelas III · Bab 1–3 (soal otomatis + soal pilihan) |
| 3 | Bahasa Indonesia | *Kawan Seiring* Kelas III (Edisi Revisi) · Bab 1–2 |
| 3 | IPAS | Buku Siswa IPAS Kelas III (Edisi Revisi) · Bab 1–4 |
| 3 | Pendidikan Pancasila | Buku Siswa Kelas III · Bab 1–2 |
| 3 | Agama Hindu | Buku Siswa Agama Hindu & Budi Pekerti Kelas III · Bab 1–3 |
| 3 | Bahasa Bali | Materi umum muatan lokal (bukan dari SIBI) · **Bab 4 Aksara Bali & Angka Bali** (hanacaraka, kata tanpa pangangge, angka ᭐–᭙) |
| 3 | Bahasa Inggris | *English for Nusantara Kids* Kelas III · Chapter 1–3 (🔊 suara bahasa Inggris) |
| 3 | PJOK | Buku Siswa PJOK Kelas III · Bab 1–2 |
| 3 | TIK | Materi umum muatan sekolah (bukan mapel nasional SD) |

Buku PDF asli (dari buku.kemendikdasmen.go.id) ada di folder `buku/` — **tidak** ikut di-upload ke GitHub (lihat `.gitignore`), karena ukurannya ±250 MB.

> ⚠️ Pembagian bab per semester bisa berbeda antar sekolah. Jika kisi-kisi sekolah berbeda, edit soal di folder `data/`.

## Fitur
- 3 level per pelajaran: ⭐ **Mudah** → ⭐⭐ **Sedang** → ⭐⭐⭐ **Sulit**. Level berikutnya terbuka setelah nilai ≥ 70. Level 🎲 **Campur** = seperti ujian sungguhan.
- Kelas 1: tombol besar warna-warni, gambar, tombol 🔊 membacakan soal, tanpa timer.
- Kelas 3: gaya ujian (A–D), sebagian soal isian, timer 15 menit (bisa diubah).
- Penjelasan setiap jawaban, rekor beruntun 🔥, bintang, konfeti 🎉.
- Matematika: soal dibuat otomatis, jadi selalu berbeda setiap main.
- **Akun pribadi**: setiap anak mendaftar sendiri → pilih kelas, ketik nama panggilan, pilih avatar hewan, dan buat **gambar rahasia** (3 gambar berurutan). Nama tidak boleh kembar.
- Perangkat mengingat akun yang pernah masuk (cukup ketuk wajah + gambar rahasia). Di perangkat lain: **🔑 Masuk** dengan nama + gambar rahasia.
- Beberapa anak bisa main **bersamaan** di perangkat berbeda. Level yang sudah terbuka ikut ke perangkat mana pun.
- **Pojok Orang Tua** (PIN `1234`):
  - 🔴 **Pantauan langsung**: siapa yang sedang main, pelajaran apa, soal ke berapa, berapa yang benar (diperbarui tiap 10 detik).
  - Nilai per pelajaran (rata-rata 3 kuis terakhir), level terbuka, bab yang perlu dilatih, riwayat terakhir.
  - ✏️ Ubah kelas anak (misalnya saat naik kelas), 🗑️ hapus akun dari perangkat ini.

## Menu per bab & 🐉 Bos Final (kelas 1 & 3)
- Setiap pelajaran dibagi **per bab** (sesuai buku). Setiap bab punya level Mudah → Sedang → Sulit, plus 🎲 **Campur semua bab**.
- **🐉 Bos Final · Ulangan Sumatif** terbuka setelah level Mudah semua bab lulus (nilai ≥ 70). Formatnya seperti lembar ulangan:
  - **A. Pilihan ganda** — kelas 3: 12 soal, kelas 1: 10 soal (× 1 poin)
  - **B. Isian singkat** — 5 soal × 2 poin (dinilai otomatis; huruf besar/kecil & tanda baca diabaikan)
  - **C. Uraian** — kelas 3: 3 soal, kelas 1: 2 soal pendek (× 3 poin). Kelas 1 diberi petunjuk: sebutkan jawaban ke Ayah/Ibu dulu, lalu ketik singkat. Anak menulis jawaban, lalu di akhir melihat **kunci + kata penting** dan menilai sendiri: ✅ Tepat / 🟡 Kurang lengkap / ❌ Belum. (Sebaiknya didampingi orang tua.)
  - Tanpa umpan balik sampai selesai. Timer: kelas 3 = 45 menit, kelas 1 = tanpa timer (atur di `bossMinutes`).
- Matematika: soal dibuat otomatis per bab; bagian C Bos Final berisi **soal cerita** (kelas 3: dua langkah).
- Soal isian & uraian juga muncul di latihan biasa (isian di level Sedang/Sulit, uraian maks. 2 di level Sulit).

## 🧮 Latihan Bersusun (kelas 3)
Menu tersendiri di daftar pelajaran kelas 3. Anak mengisi kotak **satu per satu** seperti di kertas, dengan keypad angka:

| Latihan | ⭐ Mudah | ⭐⭐ Sedang | ⭐⭐⭐ Sulit |
|---|---|---|---|
| ➕ Penjumlahan bersusun | 2 angka tanpa simpan | 2 angka dengan simpan | 3 angka |
| ➖ Pengurangan bersusun | 2 angka tanpa pinjam | 2 angka dengan pinjam | 3 angka, pinjam berantai (mis. 503 − 279) |
| ✖️ Perkalian bersusun | 2 angka × 1 angka | dengan simpanan | 2 angka × 2 angka (dua baris lalu dijumlah) |
| ➗ Pembagian porogapit | 2 angka : 1 angka | dengan sisa di tengah | 3 angka : 1 angka |

- Kotak yang harus diisi **menyala**; di bawahnya ada pertanyaan langkah, mis. *"① Bagi: 23 : 8 = ?"*, *"Kolom puluhan: 6 + 5 + 1 (simpanan) = ?"*.
- Porogapit mengikuti urutan **① Bagi → ② Kali → ③ Kurang → ④ Turunkan**.
- Simpanan ditulis kecil di atas; saat meminjam, angka lama **dicoret** dan angka baru ditulis kecil di atasnya.
- Salah → kotak bergoyang; salah 2× → petunjuk lengkap muncul. 💡 = petunjuk, 👀 = tunjukkan jawaban kotak ini.
- Setiap sesi 5 soal. Nilai = persentase kotak yang benar pada percobaan pertama. Hasil tercatat di Pojok Orang Tua.

## Struktur
```
index.html            halaman utama
css/style.css         tampilan
js/config.js          ⚙️ PENGATURAN: URL Google Sheet, PIN, jumlah soal, timer
js/app.js             logika aplikasi
js/generators.js      pembuat soal Matematika otomatis
js/bersusun.js        🧮 Latihan Bersusun (penjumlahan, pengurangan, perkalian, porogapit)
data/kelas3/bersusun.json  ubin menu Latihan Bersusun
data/kelas1/*.json    bank soal kelas 1
data/kelas3/*.json    bank soal kelas 3
backend/Code.gs       backend Google Apps Script
data/_sumber/*.txt    sumber soal tambahan dalam format ringkas (lihat di bawah)
tools/build_bank.py   mengubah data/_sumber/*.txt → data/kelasN/*.json
buku/                 PDF buku siswa (lokal saja)
```

## Mengubah / menambah soal
Buka file di `data/kelasN/<pelajaran>.json` (misalnya di Antigravity), lalu tambahkan:
```json
{"level": 2, "bab": "Bab 1 ...", "q": "Pertanyaan …", "img": "🍎🍎 (opsional)",
 "choices": ["jawaban benar", "salah 1", "salah 2", "salah 3"], "answer": 0,
 "explain": "Penjelasan singkat."}
```
- `answer` = nomor urut jawaban benar di `choices` (mulai dari 0). Pilihan diacak otomatis saat main.
- `level`: 1 = Mudah, 2 = Sedang, 3 = Sulit.
- `id` boleh dikosongkan.

### Cara cepat menambah soal (format ringkas)
Tambahkan baris di `data/_sumber/kelas1_part1.txt`, `kelas1_part2.txt`, `kelas3_part1.txt`, atau `kelas3_part2.txt` di bawah judul pelajaran (`@ ipas`, dst.):
```
M|level|bab|pertanyaan|jawaban benar|salah 1|salah 2|salah 3|penjelasan
I|level|bab|pertanyaan|jawaban;variasi lain|penjelasan
U|bab|pertanyaan|kunci jawaban|kata penting 1, kata penting 2
```
Lalu jalankan:
```bash
python3 tools/build_bank.py
```
Skrip ini memasukkan soal ke file JSON, memberi nomor bab, dan mengecek kesalahan.

### Materi yang belum diajarkan (dinonaktifkan sementara)
Soal **pangangge suara** aksara Bali kelas 3 (ulu, suku, taleng, pepet) disimpan tetapi **tidak dipakai** karena belum diajarkan di sekolah.
Jika sudah diajarkan: buka `tools/build_bank.py`, hapus baris `(3, "bahasa_bali")` di bagian `SKIP`, lalu jalankan `python3 tools/build_bank.py`.

Soal aksara Bali dibuat oleh `tools/gen_aksara.py` (daftar kata ada di dalamnya). Setelah mengubahnya, jalankan:
```bash
python3 tools/gen_aksara.py && python3 tools/build_bank.py
```

## Menjalankan di laptop
Karena soal dibaca dari file JSON, buka lewat server lokal (bukan klik dua kali):
```bash
python3 -m http.server 8765
```
Lalu buka http://localhost:8765

## Upload ke GitHub Pages
1. Buat repository baru di GitHub (misalnya `kuis-anak`).
2. Upload file aplikasi saja (±240 KB). File yang **tidak** perlu di-upload sudah tercantum di `.gitignore`:
   `buku/` (PDF ±250 MB), `mockup/`, `.claude/`, pengaturan editor, dan file sistem seperti `.DS_Store`.
   Jika memakai `git` atau GitHub Desktop, file-file itu otomatis dilewati. Jika upload lewat browser (drag & drop), jangan ikut sertakan folder tersebut.
3. Di repository: **Settings → Pages → Source: Deploy from a branch → main / (root)** → Save.
4. Setelah ±1 menit, aplikasi bisa dibuka di `https://<username>.github.io/kuis-anak/`.
5. Di tablet/HP: buka link tersebut → menu browser → **Add to Home Screen** agar seperti aplikasi.

## Pasang Google Sheet (sangat disarankan)
Tanpa Google Sheet, akun & nilai hanya tersimpan di satu perangkat dan pantauan langsung tidak aktif.

1. Buat Google Sheet baru, beri nama misalnya **Nilai Kuis Anak**.
2. Menu **Ekstensi → Apps Script**. Hapus isi `Code.gs`, tempel isi `backend/Code.gs`.
3. Ubah baris `const PARENT_PIN = '1234';` (harus sama dengan `parentPin` di `js/config.js`), lalu klik 💾.
4. Pilih fungsi `setup` → **Run** → izinkan akses (sekali saja). Tab **Akun**, **Hasil**, **Live** akan dibuat.
5. **Deploy → New deployment →** ⚙️ **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Salin **Web app URL** (berakhiran `/exec`) ke `js/config.js`:
   ```js
   sheetUrl: "https://script.google.com/macros/s/XXXX/exec",
   ```
7. Upload ulang `js/config.js` ke GitHub.

> Jika nanti `Code.gs` diubah: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (URL tetap sama).

Isi Sheet:
- **Akun** — satu baris per anak: username, nama, kelas, avatar, progres level. (Gambar rahasia disimpan sebagai kode acak, bukan gambar aslinya.)
- **Hasil** — satu baris per kuis selesai: waktu, nama, pelajaran, level, nilai, bab yang salah.
- **Live** — status terbaru tiap anak untuk pantauan langsung.

> Catatan keamanan & privasi: gambar rahasia mencegah anak saling memakai akun, tetapi ini bukan keamanan tingkat tinggi. Data orang tua dilindungi PIN. Pakai **nama panggilan** saja, jangan nama lengkap. Jika keluarga lain ingin memakai aplikasi ini, sebaiknya mereka memasang Google Sheet sendiri agar data anak tidak tercampur.
