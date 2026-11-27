// ============================================================
//  PENGATURAN KUIS ANAK — ubah bagian ini sesuai kebutuhan
// ============================================================
window.KUIS_CONFIG = {
  // URL Web App Google Apps Script (lihat backend/Code.gs & README.md).
  // Wajib diisi agar akun bisa dipakai di beberapa perangkat & pantauan langsung aktif.
  // Jika kosong (""), akun & nilai hanya tersimpan di perangkat ini.
  sheetUrl: "https://script.google.com/macros/s/AKfycbxarTyvMy4w0qUk81xqbhZOT8GdRIbbNwzrJUQYbo5Uv4wDLoUWksMvq5FYP1AIbTcH/exec",

  // PIN Pojok Orang Tua. Harus SAMA dengan PARENT_PIN di backend/Code.gs.
  parentPin: "12345",

  // Jumlah soal per kuis, per kelas.
  questionsPerQuiz: { 1: 10, 2: 10, 3: 10, 4: 15, 5: 15, 6: 15 },

  // Timer (menit) per kelas. Isi 0 untuk mematikan timer.
  timerMinutes: { 1: 0, 2: 0, 3: 15, 4: 20, 5: 20, 6: 20 },

  // Nilai minimal (persen) untuk membuka level berikutnya.
  unlockPercent: 70,

  // Pantauan langsung di Pojok Orang Tua diperbarui setiap … detik.
  liveRefreshSeconds: 10,

  // Daftar pelajaran per kelas → nama file di folder data/kelasN/
  // Kelas yang belum ada di sini tampil "segera" saat mendaftar.
  subjects: {
    1: ["matematika", "bahasa_indonesia", "pancasila", "agama_hindu", "bahasa_bali"],
    3: ["matematika", "bahasa_indonesia", "ipas", "pancasila", "agama_hindu", "bahasa_bali"]
  }
};
