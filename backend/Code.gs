/**
 * Kuis Anak — backend Google Sheet (Google Apps Script)
 *
 * Cara pasang (lihat README.md untuk langkah lengkap):
 * 1. Buat Google Sheet baru → Ekstensi → Apps Script.
 * 2. Hapus isi Code.gs bawaan, tempel seluruh file ini, Simpan.
 * 3. Ubah PARENT_PIN di bawah agar sama dengan parentPin di js/config.js.
 * 4. Pilih fungsi `setup` → Run → izinkan akses.
 * 5. Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * 6. Salin URL (berakhiran /exec) ke js/config.js → sheetUrl.
 *    Setiap kali file ini diubah: Deploy → Manage deployments → ✏️ → Version: New version → Deploy.
 *
 * Tab yang dibuat otomatis:
 *   Akun   — satu baris per anak (username, nama, kelas, avatar, progres level)
 *   Hasil  — satu baris per kuis yang selesai
 *   Live   — status terbaru setiap anak (untuk pantauan langsung)
 */

const PARENT_PIN = '1234';

const TABS = {
  Akun:  ['Username', 'Nama', 'Kelas', 'Avatar', 'Kata Sandi (hash)', 'Dibuat', 'Terakhir Aktif', 'Progres (JSON)'],
  Hasil: ['Waktu', 'Username', 'Nama', 'Kelas', 'Pelajaran', 'Kunci Pelajaran', 'Level', 'Benar', 'Jumlah Soal', 'Nilai',
          'Durasi (detik)', 'Beruntun Terbaik', 'Bab yang Salah', 'Detail Salah (JSON)'],
  Live:  ['Username', 'Nama', 'Kelas', 'Avatar', 'Pelajaran', 'Level', 'Soal Ke', 'Jumlah Soal', 'Benar', 'Status', 'Diperbarui']
};

// ---------------------------------------------------------------- helpers
function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(TABS[name]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, TABS[name].length).setFontWeight('bold').setBackground('#FFD166');
  }
  return sh;
}
function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function clean_(v, max) {
  const s = String(v == null ? '' : v).slice(0, max || 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function norm_(u) { return String(u || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 30); }
function rows_(name) {
  const sh = sheet_(name);
  const last = sh.getLastRow();
  return last < 2 ? [] : sh.getRange(2, 1, last - 1, TABS[name].length).getValues();
}
function findRow_(name, username) { // nomor baris (1-based) atau -1
  const data = rows_(name);
  for (let i = 0; i < data.length; i++) if (norm_(data[i][0]) === username) return i + 2;
  return -1;
}
function account_(username) {
  const r = findRow_('Akun', username);
  if (r < 0) return null;
  const v = sheet_('Akun').getRange(r, 1, 1, TABS.Akun.length).getValues()[0];
  let progress = {};
  try { progress = JSON.parse(v[7] || '{}'); } catch (e) { progress = {}; }
  return { row: r, username: norm_(v[0]), name: v[1], grade: Number(v[2]), avatar: v[3], hash: String(v[4]), progress: progress };
}
function publicAcc_(a) { return { username: a.username, name: a.name, grade: a.grade, avatar: a.avatar, progress: a.progress }; }
function auth_(body) {
  const a = account_(norm_(body.username));
  if (!a) throw new Error('AKUN_TIDAK_ADA');
  if (String(body.hash) !== a.hash) throw new Error('SANDI_SALAH');
  return a;
}
function touch_(a) { sheet_('Akun').getRange(a.row, 7).setValue(new Date()); }

// gabungkan progres: ambil nilai terbaik & jumlah percobaan terbanyak
function mergeProgress_(a, b) {
  const out = JSON.parse(JSON.stringify(a || {}));
  Object.keys(b || {}).forEach(subj => {
    out[subj] = out[subj] || {};
    Object.keys(b[subj] || {}).forEach(lvl => {
      const x = out[subj][lvl] || { best: 0, attempts: 0 }, y = b[subj][lvl] || {};
      out[subj][lvl] = { best: Math.max(Number(x.best) || 0, Number(y.best) || 0), attempts: Math.max(Number(x.attempts) || 0, Number(y.attempts) || 0) };
    });
  });
  return out;
}

// ---------------------------------------------------------------- POST
function doPost(e) {
  let body;
  try { body = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch (x) { return out_({ ok: false, error: 'JSON_TIDAK_VALID' }); }
  // permintaan baca untuk Pojok Orang Tua (tanpa kunci antrean)
  if (['accounts', 'history', 'liveStatus'].indexOf(body.action) >= 0) {
    try {
      if (String(body.pin) !== PARENT_PIN) return out_({ ok: false, error: 'PIN_SALAH' });
      return out_(parentRead_(body.action));
    } catch (err) { return out_({ ok: false, error: String(err.message || err) }); }
  }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    switch (body.action) {
      case 'register': return out_(register_(body));
      case 'login': { const a = auth_(body); touch_(a); return out_({ ok: true, account: publicAcc_(a) }); }
      case 'saveProgress': return out_(saveProgress_(body));
      case 'saveResult': return out_(saveResult_(body));
      case 'live': return out_(live_(body));
      case 'setGrade': return out_(setGrade_(body));
      default: return out_({ ok: false, error: 'AKSI_TIDAK_DIKENAL' });
    }
  } catch (err) {
    return out_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function register_(b) {
  const username = norm_(b.username);
  if (!username || !/^[a-z0-9 ]{2,30}$/.test(username)) return { ok: false, error: 'NAMA_TIDAK_VALID' };
  if (findRow_('Akun', username) > 0) return { ok: false, error: 'NAMA_SUDAH_DIPAKAI' };
  const grade = Number(b.grade);
  if (!(grade >= 1 && grade <= 6)) return { ok: false, error: 'KELAS_TIDAK_VALID' };
  sheet_('Akun').appendRow([username, clean_(b.name, 30), grade, clean_(b.avatar, 8), String(b.hash).slice(0, 40), new Date(), new Date(), '{}']);
  return { ok: true, account: { username: username, name: b.name, grade: grade, avatar: b.avatar, progress: {} } };
}

function saveProgress_(b) {
  const a = auth_(b);
  const merged = mergeProgress_(a.progress, b.progress);
  const sh = sheet_('Akun');
  sh.getRange(a.row, 8).setValue(JSON.stringify(merged).slice(0, 45000));
  sh.getRange(a.row, 7).setValue(new Date());
  return { ok: true, progress: merged };
}

function saveResult_(b) {
  const a = auth_(b);
  const d = b.data || {};
  const wrong = Array.isArray(d.wrong) ? d.wrong : [];
  const babs = wrong.map(w => w.bab).filter(Boolean).filter((x, i, arr) => arr.indexOf(x) === i).join('; ');
  sheet_('Hasil').appendRow([
    d.timestamp ? new Date(d.timestamp) : new Date(), a.username, clean_(a.name), a.grade, clean_(d.subject), clean_(d.subjectKey), clean_(d.level),
    Number(d.score) || 0, Number(d.total) || 0, Number(d.percent) || 0, Number(d.durationSec) || 0, Number(d.bestCombo) || 0,
    babs, JSON.stringify(wrong).slice(0, 45000)
  ]);
  return { ok: true };
}

function live_(b) {
  const a = auth_(b);
  const row = [a.username, clean_(a.name), a.grade, clean_(a.avatar, 8), clean_(b.subject), clean_(b.level),
    Number(b.index) || 0, Number(b.total) || 0, Number(b.correct) || 0, clean_(b.status, 20), new Date()];
  const sh = sheet_('Live');
  const r = findRow_('Live', a.username);
  if (r > 0) sh.getRange(r, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
  return { ok: true };
}

function setGrade_(b) {
  if (String(b.pin) !== PARENT_PIN) return { ok: false, error: 'PIN_SALAH' };
  const a = account_(norm_(b.username));
  if (!a) return { ok: false, error: 'AKUN_TIDAK_ADA' };
  const g = Number(b.grade);
  if (!(g >= 1 && g <= 6)) return { ok: false, error: 'KELAS_TIDAK_VALID' };
  sheet_('Akun').getRange(a.row, 3).setValue(g);
  return { ok: true };
}

// ---------------------------------------------------------------- baca data
function parentRead_(action) {
  if (action === 'accounts') {
    return { ok: true, data: rows_('Akun').map(v => {
      let progress = {}; try { progress = JSON.parse(v[7] || '{}'); } catch (x) { /* kosong */ }
      return { username: norm_(v[0]), name: v[1], grade: Number(v[2]), avatar: v[3], lastActive: v[6] instanceof Date ? v[6].toISOString() : '', progress: progress };
    }) };
  }
  if (action === 'history') {
    return { ok: true, data: rows_('Hasil').slice(-800).map(r => {
      let wrong = []; try { wrong = JSON.parse(r[13] || '[]'); } catch (x) { /* kosong */ }
      return { timestamp: r[0] instanceof Date ? r[0].toISOString() : r[0], username: norm_(r[1]), name: r[2], grade: r[3], subject: r[4], subjectKey: r[5],
        level: r[6], score: r[7], total: r[8], percent: r[9], durationSec: r[10], bestCombo: r[11], wrong: wrong };
    }) };
  }
  return { ok: true, now: new Date().toISOString(), data: rows_('Live').map(r => ({
    username: norm_(r[0]), name: r[1], grade: r[2], avatar: r[3], subject: r[4], level: r[5], index: r[6], total: r[7], correct: r[8], status: r[9],
    updated: r[10] instanceof Date ? r[10].toISOString() : '' })) };
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'check') return out_({ ok: true, taken: findRow_('Akun', norm_(p.username)) > 0 });
  return out_({ ok: true, info: 'Kuis Anak backend aktif.' });
}

// Jalankan sekali dari editor (pilih `setup` → Run) untuk membuat tab & memberi izin.
function setup() {
  Object.keys(TABS).forEach(sheet_);
}
