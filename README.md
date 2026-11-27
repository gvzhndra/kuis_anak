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
| 3 | Matematika | Buku Siswa Matematika Kelas III · Bab 1–3 (soal otomatis + soal pilihan) |
| 3 | Bahasa Indonesia | *Kawan Seiring* Kelas III (Edisi Revisi) · Bab 1–2 |
| 3 | IPAS | Buku Siswa IPAS Kelas III (Edisi Revisi) · Bab 1–4 |
| 3 | Pendidikan Pancasila | Buku Siswa Kelas III · Bab 1–2 |
| 3 | Agama Hindu | Buku Siswa Agama Hindu & Budi Pekerti Kelas III · Bab 1–3 |
| 3 | Bahasa Bali | Materi umum muatan lokal (bukan dari SIBI) |

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

## Struktur
```
index.html            halaman utama
css/style.css         tampilan
js/config.js          ⚙️ PENGATURAN: URL Google Sheet, PIN, jumlah soal, timer
js/app.js             logika aplikasi
js/generators.js      pembuat soal Matematika otomatis
data/kelas1/*.json    bank soal kelas 1
data/kelas3/*.json    bank soal kelas 3
backend/Code.gs       backend Google Apps Script
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
