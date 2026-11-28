/* Kuis Anak — latihan Ujian Akhir Semester (Kurikulum Merdeka)
 * Aplikasi satu halaman tanpa framework. Soal dibaca dari data/kelasN/<pelajaran>.json
 * Akun anak: nama + avatar + kata sandi gambar, disinkronkan ke Google Sheet (backend/Code.gs).
 */
(function () {
  "use strict";

  const CFG = window.KUIS_CONFIG;
  const GEN = window.KUIS_GENERATORS || {};
  const ONLINE = !!CFG.sheetUrl;
  const app = document.getElementById("app");
  const LEVELS = [
    { n: 1, name: "Mudah",  stars: "⭐",     desc: "Pemanasan dulu, yuk!",    color: "var(--c3)" },
    { n: 2, name: "Sedang", stars: "⭐⭐",   desc: "Mulai menantang!",        color: "var(--c2)" },
    { n: 3, name: "Sulit",  stars: "⭐⭐⭐", desc: "Tantangan juara!",        color: "var(--c1)" },
    { n: 0, name: "Campur", stars: "🎲",     desc: "Seperti ujian sungguhan", color: "var(--c4)" }
  ];
  const TILE_COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c6)", "#F4A259"];
  const AVATARS = ["🐰", "🦁", "🐼", "🐯", "🐨", "🦊", "🐸", "🐵", "🦄", "🐧", "🐬", "🐢"];
  const AV_COLORS = ["#FF8A5B", "#B388EB", "#4CC9F0", "#F4A259", "#7BD389", "#F78FB3"];
  const PICS = ["🐶", "🐱", "🐸", "🍎", "🍌", "🍓", "⭐", "🌈", "🚗"];
  const LETTERS = ["A", "B", "C", "D", "E"];
  const GRADES = [1, 2, 3, 4, 5, 6];

  // ================================================================ storage
  const store = {
    get(k, d) { try { const v = localStorage.getItem("kuisAnak." + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("kuisAnak." + k, JSON.stringify(v)); } catch (e) { /* abaikan */ } }
  };
  // accounts[username] = { username, name, grade, avatar, hash, progress, lastUsed }
  let accounts = store.get("accounts", {});
  const saveAccounts = () => store.set("accounts", accounts);

  const normName = s => String(s || "").trim().replace(/\s+/g, " ");
  const toUser = s => normName(s).toLowerCase();
  const validName = s => /^[a-z0-9 ]{2,30}$/.test(toUser(s));
  // hash sederhana (cyrb53) — cukup untuk mencegah anak saling memakai akun, bukan keamanan tingkat tinggi
  function hashPw(user, seq) {
    const str = "kuisanak|" + user + "|" + seq;
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return "h" + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
  const avColor = av => AV_COLORS[Math.max(0, AVATARS.indexOf(av)) % AV_COLORS.length];

  // progres level milik akun yang sedang main
  function prog(user, subj, lvl) { return (((user.progress || {})[subj]) || {})[lvl] || null; }
  function saveProg(user, subj, lvl, pct) {
    user.progress = user.progress || {};
    user.progress[subj] = user.progress[subj] || {};
    const p = user.progress[subj][lvl] || { best: 0, attempts: 0 };
    p.best = Math.max(p.best, pct); p.attempts++;
    user.progress[subj][lvl] = p;
    accounts[user.username] = user; saveAccounts();
  }
  function isUnlocked(user, subj, lvl) {
    if (lvl === 1) return true;
    if (lvl === 0) return isUnlocked(user, subj, 2);
    const prev = prog(user, subj, lvl - 1);
    return !!prev && prev.best >= CFG.unlockPercent;
  }
  function starsFor(pct) { return pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0; }
  function totalStars(user) {
    let s = 0;
    Object.values(user.progress || {}).forEach(sub => Object.values(sub).forEach(p => { s += starsFor(p.best); }));
    return s;
  }
  function mergeProgress(a, b) {
    const out = JSON.parse(JSON.stringify(a || {}));
    Object.keys(b || {}).forEach(subj => {
      out[subj] = out[subj] || {};
      Object.keys(b[subj] || {}).forEach(l => {
        const x = out[subj][l] || { best: 0, attempts: 0 }, y = b[subj][l] || {};
        out[subj][l] = { best: Math.max(+x.best || 0, +y.best || 0), attempts: Math.max(+x.attempts || 0, +y.attempts || 0) };
      });
    });
    return out;
  }

  // ================================================================ server (Google Sheet)
  async function api(action, payload, timeoutMs) {
    if (!ONLINE) throw new Error("OFFLINE");
    const ctl = "AbortController" in window ? new AbortController() : null;
    const t = ctl ? setTimeout(() => ctl.abort(), timeoutMs || 15000) : null;
    try {
      // tanpa header khusus → "simple request", tidak perlu preflight CORS di Apps Script
      const r = await fetch(CFG.sheetUrl, { method: "POST", body: JSON.stringify(Object.assign({ action }, payload)), signal: ctl ? ctl.signal : undefined });
      return await r.json();
    } finally { if (t) clearTimeout(t); }
  }
  async function apiCheck(username) {
    const r = await fetch(CFG.sheetUrl + "?action=check&username=" + encodeURIComponent(username));
    return r.json();
  }
  const ERR = {
    NAMA_SUDAH_DIPAKAI: "Nama ini sudah dipakai. Coba tambahkan nama lain, misalnya \"Putu Ayu\" atau \"Putu 2\".",
    NAMA_TIDAK_VALID: "Nama hanya boleh huruf, angka, dan spasi (2–30 huruf).",
    AKUN_TIDAK_ADA: "Nama belum terdaftar. Cek lagi ejaannya, atau buat pemain baru.",
    SANDI_SALAH: "Gambar rahasia salah. Coba lagi ya!",
    OFFLINE: "Tidak ada koneksi ke Google Sheet."
  };
  const errMsg = e => ERR[e] || ERR[(e && e.message) || ""] || "Gagal terhubung. Periksa internet lalu coba lagi.";

  // antrean kiriman (hasil kuis & progres) — dikirim ulang jika sedang offline
  function enqueue(item) { const q = store.get("queue", []); q.push(item); store.set("queue", q); flushQueue(); }
  let flushing = false;
  async function flushQueue() {
    if (!ONLINE || flushing || !navigator.onLine) return;
    flushing = true;
    try {
      // antrean dibaca ulang setiap putaran agar kiriman baru yang masuk saat menunggu tidak tertimpa
      for (let item = store.get("queue", [])[0]; item; item = store.get("queue", [])[0]) {
        const res = await api(item.action, item.payload);
        if (res && res.ok && item.action === "saveProgress" && res.progress && accounts[item.payload.username]) {
          accounts[item.payload.username].progress = mergeProgress(accounts[item.payload.username].progress, res.progress); saveAccounts();
        }
        store.set("queue", store.get("queue", []).slice(1)); // berhasil, atau ditolak server (mis. sandi salah) → tidak diulang
      }
    } catch (e) { /* jaringan gagal → coba lagi nanti */ }
    flushing = false;
  }
  window.addEventListener("online", flushQueue);
  setInterval(flushQueue, 60000);

  function sendLive(status, extra) {
    if (!ONLINE || !S.user || !navigator.onLine) return;
    const u = S.user, z = S.quiz;
    api("live", Object.assign({
      username: u.username, hash: u.hash, status,
      subject: S.subject ? S.subject.subject : "", level: z ? z.levelName : "",
      index: z ? z.i + 1 : 0, total: z ? z.qs.length : 0, correct: z ? z.answers.filter(a => a && a.ok).length : 0
    }, extra || {}), 8000).catch(() => {});
  }

  // ================================================================ data soal
  const cache = {};
  async function loadSubject(grade, key) {
    const id = grade + "/" + key;
    if (cache[id]) return cache[id];
    const res = await fetch(`data/kelas${grade}/${key}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Gagal memuat data/kelas${grade}/${key}.json`);
    const data = await res.json();
    data.questions = (data.questions || []).filter(q => !q.skip); // materi yang belum diajarkan
    data.key = key; cache[id] = data;
    return data;
  }

  // ================================================================ helpers
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function view(html, cls) { stopLiveRefresh(); app.className = "app " + (cls || ""); app.innerHTML = html; window.scrollTo(0, 0); }
  function on(sel, fn) { app.querySelectorAll(sel).forEach(el => el.addEventListener("click", fn)); }
  const topbar = (pill, backId) => `<div class="top"><button class="iconbtn" id="${backId || "back"}" aria-label="Kembali">←</button>${pill ? `<div class="pill">${pill}</div>` : ""}</div>`;
  function shake(el) { if (!el) return; el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
  function busy(on) { const b = document.getElementById("busy"); if (b) b.classList.toggle("hidden", !on); }

  // ================================================================ suara
  let actx;
  function beep(ok) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      (ok ? [523, 659, 784] : [330, 262]).forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = ok ? "triangle" : "sine"; o.frequency.value = f;
        const t = actx.currentTime + i * 0.11;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.2);
      });
    } catch (e) { /* tanpa suara */ }
  }
  const voices = { id: null, en: null };
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices();
    voices.id = vs.find(v => /^id/i.test(v.lang)) || vs.find(v => /indones/i.test(v.name)) || null;
    voices.en = vs.find(v => /^en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function cleanSpeech(text, lang) {
    let t = String(text).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{1B00}-\u{1B7F}]/gu, " "); // emoji & aksara Bali tidak dibaca
    if (lang === "en") return t.replace(/\.\.\.+|…|_+/g, " blank ");
    return t.replace(/\.\.\.+|…/g, " titik-titik ").replace(/×/g, " kali ").replace(/(\d)\s*[:÷]\s*(\d)/g, "$1 dibagi $2")
      .replace(/(\d)\s*[-−]\s*(\d)/g, "$1 kurang $2").replace(/\+/g, " tambah ").replace(/=/g, " sama dengan ").replace(/_+/g, " titik-titik ");
  }
  // parts: [{ text, lang: "id" | "en" }] — dibacakan berurutan, tiap bagian dengan suaranya sendiri
  function speak(parts, btn) {
    if (!("speechSynthesis" in window)) { alert("Perangkat ini belum mendukung suara."); return; }
    speechSynthesis.cancel();
    if (typeof parts === "string") parts = [{ text: parts, lang: "id" }];
    parts = parts.filter(p => p.text && String(p.text).trim());
    if (btn) btn.classList.add("on");
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(cleanSpeech(p.text, p.lang));
      u.lang = p.lang === "en" ? "en-US" : "id-ID";
      const v = voices[p.lang === "en" ? "en" : "id"]; if (v) u.voice = v;
      u.rate = p.lang === "en" ? 0.85 : 0.9;
      if (btn && i === parts.length - 1) u.onend = u.onerror = () => btn.classList.remove("on");
      speechSynthesis.speak(u);
    });
  }
  function stopSpeak() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }
  function confetti() {
    const box = document.getElementById("confetti"), bits = ["🎉", "⭐", "🎊", "✨", "🌟", "🎈"];
    for (let i = 0; i < 26; i++) {
      const s = document.createElement("span");
      s.textContent = bits[i % bits.length];
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
      s.style.animationDelay = Math.random() * 0.6 + "s";
      box.appendChild(s); setTimeout(() => s.remove(), 4500);
    }
  }

  // ================================================================ state
  const S = { user: null, subject: null, quiz: null, timer: null, liveTimer: null };

  // ================================================================ BERANDA
  function home() {
    stopTimer(); stopSpeak(); S.user = null;
    const list = Object.values(accounts).sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
    const cards = list.map(u => `
      <button class="kid press" data-u="${esc(u.username)}" style="background:${avColor(u.avatar)}">
        <div class="av">${esc(u.avatar)}</div>
        <div><div class="nm">${esc(u.name)}</div><div class="gr">Kelas ${u.grade} SD</div>
        <div class="st">⭐ ${totalStars(u)} bintang</div></div>
      </button>`).join("");
    view(`
      <div class="hello">Halo! 👋<br>Siapa yang<br><span>main hari ini?</span></div>
      ${cards || `<p class="note" style="font-size:18px">Belum ada pemain di perangkat ini. Yuk, buat akunmu dulu!</p>`}
      <button class="kid press newkid" id="new"><div class="av">➕</div><div><div class="nm">Pemain baru</div><div class="gr">Buat akun dengan namamu</div></div></button>
      ${ONLINE ? `<button class="btn white press" id="login" style="font-size:19px">🔑 Sudah punya akun? Masuk di sini</button>` : ""}
      <button class="parentlink" id="parent">🔒 Pojok Orang Tua</button>`);
    on("[data-u]", e => unlockProfile(accounts[e.currentTarget.dataset.u]));
    on("#new", () => signup({}));
    on("#login", () => loginOther({}));
    on("#parent", parentPin);
  }

  // ---------------------------------------------------------------- kata sandi gambar
  // Menampilkan 3 kotak + 9 gambar. onDone(seq) dipanggil setelah 3 gambar dipilih.
  function picturePad(opts) {
    let seq = [];
    const draw = () => {
      view(`${topbar(opts.pill)}
        <h1 class="title" style="text-align:center">${opts.title}</h1>
        ${opts.sub ? `<p class="note" style="text-align:center;margin-top:-6px">${opts.sub}</p>` : ""}
        <div class="slots">${[0, 1, 2].map(i => `<span class="${seq[i] ? "f" : ""}">${seq[i] ? (opts.hide ? "●" : seq[i]) : ""}</span>`).join("")}</div>
        <div class="pics">${PICS.map(p => `<button class="press" data-p="${p}">${p}</button>`).join("")}</div>
        <button class="btn white press" id="undo" style="font-size:18px">⌫ Hapus</button>
        <p class="note err" id="err" style="text-align:center">${opts.error || ""}</p>
        <div id="busy" class="note hidden" style="text-align:center">⏳ Menghubungkan…</div>`);
      on("#back", opts.back);
      on("#undo", () => { seq.pop(); opts.error = ""; draw(); });
      on("[data-p]", e => {
        if (seq.length >= 3) return;
        seq.push(e.currentTarget.dataset.p); opts.error = "";
        if (seq.length === 3) { draw(); const s = seq.join(""); seq = []; setTimeout(() => opts.onDone(s, msg => { opts.error = msg; draw(); shake(app.querySelector(".slots")); }), 150); }
        else draw();
      });
    };
    draw();
  }

  function unlockProfile(u) {
    picturePad({
      pill: `${esc(u.avatar)} ${esc(u.name)}`, title: `Halo, ${esc(u.name)}!`, sub: "Pilih 3 gambar rahasiamu", hide: true, back: home,
      onDone: (seq, fail) => {
        if (hashPw(u.username, seq) !== u.hash) return fail(ERR.SANDI_SALAH);
        startSession(u);
        if (ONLINE) api("login", { username: u.username, hash: u.hash }).then(r => {
          if (r && r.ok) {
            const a = accounts[u.username]; if (!a) return;
            a.grade = r.account.grade; a.name = r.account.name || a.name; a.avatar = r.account.avatar || a.avatar;
            a.progress = mergeProgress(a.progress, r.account.progress); saveAccounts();
          }
        }).catch(() => {});
      }
    });
  }

  function startSession(u) {
    u.lastUsed = Date.now(); accounts[u.username] = u; saveAccounts();
    S.user = u;
    flushQueue();
    subjects();
  }

  // ---------------------------------------------------------------- daftar akun baru
  function signup(st) {
    // langkah 1: kelas
    const step1 = () => view(`${topbar("➕ Pemain baru")}
      <h1 class="title">Kamu kelas berapa?</h1>
      <div class="grades">${GRADES.map(g => {
        const ok = !!CFG.subjects[g];
        return `<button class="grade press ${ok ? "" : "locked"}" data-g="${g}" ${ok ? "" : "disabled"}><b>${g}</b><span>${ok ? "Kelas " + g : "segera"}</span></button>`;
      }).join("")}</div>`);
    // langkah 2: nama
    const step2 = (error) => {
      view(`${topbar("➕ Pemain baru · Kelas " + st.grade)}
        <h1 class="title">Siapa namamu?</h1>
        <form id="f"><input class="bigin" id="nm" maxlength="30" autocomplete="off" autocapitalize="words" placeholder="Nama panggilan" value="${esc(st.name || "")}">
        <p class="note err" id="err">${error || ""}</p>
        <p class="note">Nama ini jadi nama akunmu. Pakai nama panggilan saja, ya.</p>
        <button class="btn green press" type="submit">Lanjut →</button></form>
        <div id="busy" class="note hidden" style="text-align:center">⏳ Mengecek nama…</div>`);
      on("#back", step1Go);
      const inp = document.getElementById("nm"); setTimeout(() => inp.focus(), 50);
      document.getElementById("f").addEventListener("submit", async ev => {
        ev.preventDefault();
        const name = normName(inp.value), user = toUser(name);
        if (!validName(name)) return step2(ERR.NAMA_TIDAK_VALID);
        if (accounts[user]) return step2(ERR.NAMA_SUDAH_DIPAKAI);
        if (ONLINE) {
          busy(true);
          try { const r = await apiCheck(user); if (r && r.taken) { st.name = name; return step2(ERR.NAMA_SUDAH_DIPAKAI); } }
          catch (e) { st.name = name; return step2(errMsg(e)); }
        }
        st.name = name; st.username = user; step3();
      });
    };
    // langkah 3: avatar
    const step3 = () => {
      view(`${topbar("➕ " + esc(st.name))}
        <h1 class="title">Pilih hewan favoritmu</h1>
        <div class="avs">${AVATARS.map(a => `<button class="press" data-a="${a}" style="background:${avColor(a)}">${a}</button>`).join("")}</div>`);
      on("#back", () => step2());
      on("[data-a]", e => { st.avatar = e.currentTarget.dataset.a; step4(); });
    };
    // langkah 4 & 5: kata sandi gambar + ulangi
    const step4 = () => picturePad({
      pill: `${esc(st.avatar)} ${esc(st.name)}`, title: "Buat gambar rahasia", sub: "Pilih 3 gambar dan INGAT urutannya!", back: step3,
      onDone: seq => { st.seq = seq; step5(); }
    });
    const step5 = () => picturePad({
      pill: `${esc(st.avatar)} ${esc(st.name)}`, title: "Ulangi gambar rahasia", sub: "Pilih lagi 3 gambar yang sama", hide: true, back: step4,
      onDone: async (seq, fail) => {
        if (seq !== st.seq) return fail("Urutannya berbeda. Coba lagi ya!");
        const u = { username: st.username, name: st.name, grade: st.grade, avatar: st.avatar, hash: hashPw(st.username, seq), progress: {} };
        if (ONLINE) {
          busy(true);
          try {
            const r = await api("register", { username: u.username, name: u.name, grade: u.grade, avatar: u.avatar, hash: u.hash });
            if (!r || !r.ok) return fail(errMsg(r && r.error));
          } catch (e) { return fail(errMsg(e)); }
        }
        welcome(u, st.seq);
      }
    });
    const step1Go = () => { step1(); on("#back", home); on("[data-g]", e => { st.grade = +e.currentTarget.dataset.g; step2(); }); };
    step1Go();
  }

  function welcome(u, seq) {
    accounts[u.username] = u; saveAccounts();
    view(`<div class="result">
      <div style="font-size:90px">${esc(u.avatar)}</div>
      <div class="big">Selamat datang, ${esc(u.name)}!</div>
      <div class="score" style="margin-top:12px">Gambar rahasiamu:</div>
      <div class="slots" style="margin:8px auto">${[...seq].length ? Array.from(seq.matchAll(/\p{Extended_Pictographic}️?/gu)).map(m => `<span class="f">${m[0]}</span>`).join("") : ""}</div>
      <div class="note" style="font-size:16px">Ingat baik-baik, ya! ${ONLINE ? "Dengan nama & gambar ini kamu bisa main di HP atau tablet lain." : ""}</div>
      <div class="spacer"></div>
      <button class="btn green press" id="go">Ayo mulai! 🚀</button></div>`);
    confetti();
    on("#go", () => startSession(u));
  }

  // ---------------------------------------------------------------- masuk dari perangkat lain
  function loginOther(st) {
    const stepName = (error) => {
      view(`${topbar("🔑 Masuk")}
        <h1 class="title">Siapa namamu?</h1>
        <form id="f"><input class="bigin" id="nm" maxlength="30" autocomplete="off" autocapitalize="words" placeholder="Nama akunmu" value="${esc(st.name || "")}">
        <p class="note err">${error || ""}</p>
        <button class="btn green press" type="submit">Lanjut →</button></form>`);
      on("#back", home);
      const inp = document.getElementById("nm"); setTimeout(() => inp.focus(), 50);
      document.getElementById("f").addEventListener("submit", ev => {
        ev.preventDefault();
        st.name = normName(inp.value);
        if (!validName(st.name)) return stepName(ERR.NAMA_TIDAK_VALID);
        st.username = toUser(st.name); stepPad();
      });
    };
    const stepPad = () => picturePad({
      pill: `🔑 ${esc(st.name)}`, title: "Gambar rahasiamu", sub: "Pilih 3 gambar sesuai urutan", hide: true, back: () => stepName(),
      onDone: async (seq, fail) => {
        const hash = hashPw(st.username, seq);
        busy(true);
        try {
          const r = await api("login", { username: st.username, hash });
          if (!r || !r.ok) {
            if (r && r.error === "AKUN_TIDAK_ADA") return stepName(ERR.AKUN_TIDAK_ADA);
            return fail(errMsg(r && r.error));
          }
          const a = r.account;
          const local = accounts[a.username] || {};
          startSession({ username: a.username, name: a.name, grade: a.grade, avatar: a.avatar, hash, progress: mergeProgress(local.progress, a.progress) });
        } catch (e) { fail(errMsg(e)); }
      }
    });
    stepName();
  }

  // ================================================================ PELAJARAN, BAB & LEVEL
  // Soal yang punya "ch" (nomor bab) → muncul menu per bab + 🐉 Bos Final.
  const hasChapters = d => !!(d && (d.chGenerators || (d.questions || []).some(q => q.ch)));
  const chName = (d, ch) => ch === "all" ? `Campur semua bab semester ${S.sem || 1}` : ((d.chapters || [])[ch - 1] || `Bab ${ch}`);
  // Semester: "semesters": {"1": [1,2,3], "2": [4,5]} di file JSON. Tanpa itu → semua bab = semester 1.
  const semChapters = (d, sem) => {
    const all = (d.chapters || []).map((_, i) => i + 1);
    if (d.semesters) return (d.semesters[sem] || []).filter(ch => all.includes(ch));
    return sem === 1 ? all : [];
  };
  const chList = (d, sem) => semChapters(d, sem || S.sem || 1);
  const semKey = (name, sem) => (sem || S.sem || 1) === 1 ? name : name + (sem || S.sem);   // "boss"/"all" (smt 1) · "boss2"/"all2" (smt 2)
  const progKey = (d, ch) => !ch ? d.key : `${d.key}#${ch === "all" || ch === "boss" ? semKey(ch) : ch}`; // kunci progres per bab
  const chapterPassed = (u, d, ch) => ((prog(u, progKey(d, ch), 1) || {}).best || 0) >= CFG.unlockPercent;
  const bossUnlocked = (u, d, sem) => { const l = chList(d, sem); return l.length > 0 && l.every(ch => chapterPassed(u, d, ch)); };
  const bossProg = (u, d, sem) => prog(u, `${d.key}#${semKey("boss", sem)}`, 0);
  function subjectSummary(u, d) { // teks kecil di ubin pelajaran & Pojok Orang Tua
    if (d.type === "drill") {
      const done = ["add", "sub", "mul", "div"].filter(op => [1, 2, 3].some(l => prog(u, `${d.key}#${op}`, l))).length;
      return done ? `${done}/4 jenis dicoba` : null;
    }
    if (!hasChapters(d)) {
      const bests = [1, 2, 3].map(l => prog(u, d.key, l)).filter(Boolean);
      if (!bests.length) return null;
      return `Level ${[1, 2, 3].filter(l => isUnlocked(u, d.key, l)).length} · terbaik ${Math.max(...bests.map(b => b.best))}`;
    }
    const parts = [1, 2].filter(sm => chList(d, sm).length).map(sm => {
      const passed = chList(d, sm).filter(ch => chapterPassed(u, d, ch)).length, boss = bossProg(u, d, sm);
      return boss ? `S${sm} 🐉${boss.best}` : passed ? `S${sm} bab ${passed}/${chList(d, sm).length}` : "";
    }).filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  }

  async function subjects() {
    stopTimer(); stopSpeak();
    const u = S.user, list = CFG.subjects[u.grade] || [];
    view(`<div class="top"><button class="iconbtn" id="back" aria-label="Ganti pemain">⇦</button><div class="pill">${esc(u.avatar)} ${esc(u.name)} · Kelas ${u.grade}</div></div>
      <h1 class="title">Mau belajar apa?</h1><div class="tiles" id="tiles"><div class="note">Memuat…</div></div>
      <button class="parentlink" id="out">👋 Ganti pemain</button>`);
    on("#back", home); on("#out", home);
    if (!list.length) { document.getElementById("tiles").innerHTML = `<p class="note">Soal untuk kelas ${u.grade} belum tersedia.</p>`; return; }
    const datas = await Promise.all(list.map(k => loadSubject(u.grade, k).catch(err => ({ key: k, error: err.message }))));
    if (S.user !== u) return;
    document.getElementById("tiles").innerHTML = datas.map((d, i) => {
      if (d.error) return `<div class="tile" style="background:#C9CDD8"><div class="ic">⚠️</div><div class="t">${esc(d.key)}</div><div class="s">Data belum ada</div></div>`;
      const sum = subjectSummary(u, d);
      return `<button class="tile press" data-s="${esc(d.key)}" style="background:${TILE_COLORS[i % TILE_COLORS.length]}">
        <div class="ic">${esc(d.icon)}</div><div class="t">${esc(d.subject)}</div>
        <div class="s">${sum ? esc(sum) : "Belum dicoba"}</div></button>`;
    }).join("");
    on("[data-s]", e => {
      S.subject = cache[u.grade + "/" + e.currentTarget.dataset.s];
      if (S.subject.type === "drill") return DRILL.open();
      if (hasChapters(S.subject)) semesters(); else { S.ch = null; levels(); }
    });
  }

  const learnBtn = d => d.lessons ? `<button class="learnbtn press" id="learn"><span>📖</span><div><b>Belajar Dulu</b><small>Materi seru + main cocokkan + mini kuis</small></div></button>` : "";

  function semesters() {
    stopTimer(); stopSpeak();
    const u = S.user, d = S.subject;
    const card = sm => {
      const l = chList(d, sm);
      if (!l.length) return `<button class="sem locked" data-sem="${sm}" aria-disabled="true"><div class="sn">${sm}</div><div><b>Semester ${sm}</b><span>Segera hadir</span></div></button>`;
      const passed = l.filter(ch => chapterPassed(u, d, ch)).length, boss = bossProg(u, d, sm);
      return `<button class="sem press" data-sem="${sm}"><div class="sn">${sm}</div><div><b>Semester ${sm}</b>
        <span>${l.length} bab · lulus ${passed}/${l.length}${boss ? ` · 🐉 ${boss.best}` : ""}</span>
        <small>${esc(l.map(ch => chName(d, ch).replace(/^(Bab|Unit|Chapter) [\d–-]+ ?/, "")).join(" · "))}</small></div></button>`;
    };
    view(`${topbar(`${esc(d.icon)} ${esc(d.subject)}`)}
      <h1 class="title">Pilih semester</h1>
      ${learnBtn(d)}
      <div class="sems">${card(1)}${card(2)}</div>
      <div class="chapters">${d.source ? `<b>Sumber:</b> ${esc(d.source)}` : ""}</div>`);
    on("#back", subjects);
    on("#learn", () => LEARN.open(d, semesters));
    on("[data-sem]", e => { const sm = +e.currentTarget.dataset.sem; if (!chList(d, sm).length) return shake(e.currentTarget); S.sem = sm; chapters(); });
  }

  function chapters() {
    stopTimer(); stopSpeak();
    const u = S.user, d = S.subject;
    const dots = ch => [1, 2, 3].map(l => { const p = prog(u, progKey(d, ch), l); return p && p.best >= CFG.unlockPercent ? "⭐" : "☆"; }).join("");
    const cards = chList(d).map(ch => {
      const best = Math.max(0, ...[1, 2, 3].map(l => (prog(u, progKey(d, ch), l) || {}).best || 0));
      return `<button class="chap press" data-ch="${ch}">
        <div class="cn">${ch}</div>
        <div class="ct"><b>${esc(chName(d, ch))}</b><span>${dots(ch)} ${best ? `· terbaik ${best}` : ""}</span></div></button>`;
    }).join("");
    const passed = chList(d).filter(ch => chapterPassed(u, d, ch)).length, total = chList(d).length;
    const open = bossUnlocked(u, d), boss = bossProg(u, d);
    view(`${topbar(`${esc(d.icon)} ${esc(d.subject)} · Smt ${S.sem || 1}`)}
      <h1 class="title">Pilih bab</h1>
      ${learnBtn(d)}
      <div class="chaps">${cards}</div>
      <button class="chap press mix" data-ch="all"><div class="cn">🎲</div><div class="ct"><b>Campur semua bab</b><span>Latihan acak dari semua bab semester ${S.sem || 1}</span></div></button>
      <button class="boss press ${open ? "" : "locked"}" id="boss">
        <div class="bi">${open ? "🐉" : "🔒"}</div>
        <div><b>Bos Final · Sumatif Semester ${S.sem || 1}</b>
        <span>${open ? `Pilihan ganda + isian + uraian${boss ? ` · 🏆 ${boss.best}` : ""}` : `Lulus level Mudah (nilai ${CFG.unlockPercent}+) di semua bab · ${passed}/${total}`}</span></div></button>
      <div class="chapters">${d.source ? `<b>Sumber:</b> ${esc(d.source)}` : ""}</div>`);
    on("#back", semesters);
    on("#learn", () => LEARN.open(d, chapters));
    on("[data-ch]", e => { const c = e.currentTarget.dataset.ch; S.ch = c === "all" ? "all" : +c; levels(); });
    on("#boss", e => open ? bossIntro() : shake(e.currentTarget));
  }

  function levels() {
    stopTimer(); stopSpeak();
    const u = S.user, d = S.subject, key = progKey(d, S.ch);
    const cards = LEVELS.map(L => {
      const open = isUnlocked(u, key, L.n), p = prog(u, key, L.n);
      const lockMsg = open ? "" : L.n === 0 ? `Buka dengan nilai ${CFG.unlockPercent}+ di Mudah` : `Dapat nilai ${CFG.unlockPercent}+ di ${LEVELS[L.n - 2].name}`;
      return `<button class="lvl press ${open ? "" : "locked"}" data-l="${L.n}" style="background:${L.color}">
        <div class="stars">${open ? L.stars : "🔒"}</div>
        <div><div class="nm">${L.name}</div><div class="ds">${open ? L.desc : lockMsg}</div></div>
        ${p ? `<div class="best">🏆 ${p.best}</div>` : ""}</button>`;
    }).join("");
    const chap = S.ch ? `<p class="note" style="margin:-8px 0 12px;font-size:17px"><b>${S.ch === "all" ? "🎲" : "Bab " + S.ch}</b> · ${esc(chName(d, S.ch))}</p>` : "";
    view(`${topbar(`${esc(d.icon)} ${esc(d.subject)}`)}
      <h1 class="title">Pilih level</h1>${chap}
      <div class="levels">${cards}</div>
      ${S.ch ? "" : `<div class="chapters"><b>Materi:</b> ${esc((d.chapters || []).join(" · "))}${d.source ? `<br><b>Sumber:</b> ${esc(d.source)}` : ""}</div>`}`);
    on("#back", () => S.ch ? chapters() : subjects());
    on("[data-l]", e => {
      const l = +e.currentTarget.dataset.l;
      if (!isUnlocked(u, key, l)) return shake(e.currentTarget);
      startQuiz(l);
    });
  }

  // ================================================================ KUIS
  function makeGenerated(fnName, level) {
    const fn = GEN[fnName]; if (!fn) return null;
    const q = fn(level);
    q.id = q.id || `gen-${fnName}`; q.level = level; q.generated = true;
    return q;
  }
  const isMC = q => !q.type || q.type === "mc";
  function genList(d, ch, level) {
    if (d.chGenerators) {
      const chs = ch && ch !== "all" ? [ch] : chList(d).map(String).filter(c => d.chGenerators[c]);
      return [].concat(...chs.map(c => ((d.chGenerators[c] || {})[level]) || []));
    }
    return ((d.generators || {})[level]) || [];
  }
  function inChapter(q, ch) { return !ch || (ch === "all" ? chList(S.subject).includes(q.ch) : q.ch === ch); }
  function pickForLevel(d, level, n, ch) {
    // latihan biasa: pilihan ganda + isian (uraian khusus Bos Final & level Sulit)
    const pool = shuffle((d.questions || []).filter(q => q.level === level && inChapter(q, ch) && (q.type !== "uraian" || level === 3)));
    const gens = genList(d, ch, level);
    const genCount = gens.length ? Math.min(n, Math.max(Math.round(n * (d.generatedShare ?? 0.5)), n - pool.length)) : 0;
    // batasi uraian maksimal 2 per kuis agar tidak terlalu lama
    const out = []; let essays = 0;
    // soal bab ini terlalu sedikit di level ini → tambah dari level terdekat di bab yang sama
    if (ch && ch !== "all" && pool.length < n - genCount) {
      const near = [level === 1 ? 2 : level === 3 ? 2 : 1, level === 2 ? 3 : level === 1 ? 3 : 1];
      near.forEach(l => pool.push(...shuffle((d.questions || []).filter(q => q.level === l && inChapter(q, ch) && q.type !== "uraian"))));
    }
    for (const q of pool) { if (out.length >= n - genCount) break; if (q.type === "uraian") { if (essays >= 2) continue; essays++; } out.push(q); }
    let guard = 0;
    while (out.length < n && guard++ < 200) {
      const q = gens.length ? makeGenerated(gens[Math.floor(Math.random() * gens.length)], level) : null;
      if (!q) break;
      if (!out.some(o => o.q === q.q && o.img === q.img)) out.push(q);
    }
    return shuffle(out);
  }
  function buildQuiz(d, level, n, ch) {
    if (level !== 0) return pickForLevel(d, level, n, ch);
    const a = Math.round(n * 0.3), b = Math.round(n * 0.4), c = n - a - b;
    return [...pickForLevel(d, 1, a, ch), ...pickForLevel(d, 2, b, ch), ...pickForLevel(d, 3, c, ch)];
  }
  function prepareChoices(q) {
    if (!isMC(q)) return q;
    const idx = q.choices.map((c, i) => i);
    // soal otomatis sudah mengatur urutan pilihannya sendiri (angka diurutkan agar mudah dibaca)
    const order = q.noShuffle || q.generated ? idx : shuffle(idx);
    return Object.assign({}, q, { choices: order.map(i => q.choices[i]), answer: order.indexOf(q.answer) });
  }

  function startQuiz(level) {
    const u = S.user, d = S.subject;
    const n = (CFG.questionsPerQuiz || {})[u.grade] || 10;
    const qs = buildQuiz(d, level, n, S.ch).map(prepareChoices);
    if (!qs.length) { alert("Soal untuk level ini belum tersedia."); return; }
    const L = LEVELS.find(x => x.n === level);
    S.quiz = { level, levelName: S.ch ? `Smt ${S.sem || 1} · ${S.ch === "all" ? "Campur" : "Bab " + S.ch} · ${L.name}` : L.name, key: progKey(d, S.ch),
      qs, i: 0, answers: [], combo: 0, bestCombo: 0, start: Date.now(), timeLeft: ((CFG.timerMinutes || {})[u.grade] || 0) * 60 };
    if (S.quiz.timeLeft) startTimer();
    sendLive("bermain");
    question();
  }

  // ---------------------------------------------------------------- 🐉 Bos Final (ulangan sumatif)
  // Susunan Bos Final per kelas (kelas 1–2 lebih ringan)
  const BOSS_LAYOUT = {
    small: { A: { n: 10, pts: 1, name: "Pilihan Ganda" }, B: { n: 5, pts: 2, name: "Isian Singkat" }, C: { n: 2, pts: 3, name: "Uraian" } },
    big:   { A: { n: 12, pts: 1, name: "Pilihan Ganda" }, B: { n: 5, pts: 2, name: "Isian Singkat" }, C: { n: 3, pts: 3, name: "Uraian" } }
  };
  const bossCfg = () => BOSS_LAYOUT[S.user && S.user.grade <= 2 ? "small" : "big"];
  const secName = s => ((S.subject && S.subject.bossSectionNames) || {})[s] || bossCfg()[s].name;
  function pickSpread(list, n, d) { // ambil merata dari tiap bab
    const by = {}; shuffle(list).forEach(q => { (by[q.ch || 0] = by[q.ch || 0] || []).push(q); });
    const keys = Object.keys(by), out = [];
    while (out.length < n && keys.some(k => by[k].length)) keys.forEach(k => { if (out.length < n && by[k].length) out.push(by[k].shift()); });
    return out;
  }
  function genFor(d, kind, count) { // soal otomatis untuk Bos Final (Matematika)
    // bossGeneratorsBySem: {"2": {A:[…],B:[…],C:[…]}} untuk semester 2; tanpa itu → bossGenerators (semester 1)
    const bg = ((d.bossGeneratorsBySem || {})[S.sem || 1]) || ((S.sem || 1) === 1 ? d.bossGenerators : null) || {};
    const names = bg[kind] || [], out = [];
    let guard = 0;
    while (out.length < count && names.length && guard++ < 300) {
      let q = makeGenerated(names[Math.floor(Math.random() * names.length)], kind === "A" ? 2 + (guard % 2) : 3);
      if (!q) break;
      if (kind !== "A" && q.type !== "input") { // ubah pilihan ganda angka → isian
        const ans = q.choices[q.answer];
        if (!/^[\d.]+$/.test(ans)) continue;
        q = Object.assign({}, q, { type: "input", answer: ans.replace(/\./g, ""), choices: undefined });
      }
      if (kind === "A" && q.type === "input") continue;
      if (!out.some(o => o.q === q.q && o.img === q.img)) out.push(q);
    }
    return out;
  }
  function buildBoss(d) {
    const qs = (d.questions || []).filter(q => chList(d).includes(q.ch)); // hanya bab semester ini
    const mcPool = qs.filter(q => isMC(q) && q.level >= 2);
    let A = pickSpread(mcPool, bossCfg().A.n, d);
    if (A.length < bossCfg().A.n) A = A.concat(pickSpread(qs.filter(q => isMC(q) && q.level === 1), bossCfg().A.n - A.length, d));
    A = A.concat(genFor(d, "A", bossCfg().A.n - A.length));
    let B = pickSpread(qs.filter(q => q.type === "input"), bossCfg().B.n, d);
    B = B.concat(genFor(d, "B", bossCfg().B.n - B.length));
    let C = pickSpread(qs.filter(q => q.type === "uraian"), bossCfg().C.n, d);
    C = C.concat(genFor(d, "C", bossCfg().C.n - C.length));
    const tag = (arr, s) => arr.map(q => Object.assign(prepareChoices(q), { section: s, points: bossCfg()[s].pts }));
    return [...tag(shuffle(A), "A"), ...tag(B, "B"), ...tag(C, "C")];
  }
  function bossIntro() {
    const u = S.user, d = S.subject, mins = (CFG.bossMinutes || {})[u.grade] || 0;
    const qs = buildBoss(d);
    const cnt = s => qs.filter(q => q.section === s).length;
    view(`${topbar(`${esc(d.icon)} ${esc(d.subject)}`)}
      <div class="result bossintro">
        <div style="font-size:84px">🐉</div>
        <div class="big">Bos Final!</div>
        <div class="score">Sumatif Semester ${S.sem || 1} · ${esc(d.subject)} · semua bab semester ini</div>
        <div class="secs">
          <div><b>A</b> ${secName("A")}<span>${cnt("A")} soal × ${bossCfg().A.pts} poin</span></div>
          <div><b>B</b> ${secName("B")}<span>${cnt("B")} soal × ${bossCfg().B.pts} poin</span></div>
          <div><b>C</b> ${secName("C")}<span>${cnt("C")} soal × ${bossCfg().C.pts} poin</span></div>
        </div>
        <p class="note" style="font-size:16px">${mins ? `⏱ Waktu ${mins} menit. ` : ""}Tidak ada penjelasan sampai selesai — seperti ulangan sungguhan. Uraian dinilai sendiri dengan kunci jawaban di akhir.</p>
        <div class="spacer"></div>
        <button class="btn green press" id="start">⚔️ Mulai melawan Bos!</button></div>`);
    on("#back", chapters);
    on("#start", () => {
      S.quiz = { boss: true, level: 0, levelName: `🐉 Sumatif Smt ${S.sem || 1}`, key: progKey(d, "boss"), qs, i: 0, answers: [], combo: 0, bestCombo: 0, start: Date.now(), timeLeft: mins * 60 };
      if (S.quiz.timeLeft) startTimer();
      sendLive("bermain");
      question();
    });
  }

  function startTimer() {
    stopTimer();
    S.timer = setInterval(() => {
      const z = S.quiz; if (!z) return stopTimer();
      z.timeLeft--;
      const el = document.getElementById("timer");
      if (el) el.textContent = "⏱ " + fmtTime(z.timeLeft);
      if (z.timeLeft <= 0) { stopTimer(); z.boss ? bossGrade(true) : finish(true); }
    }, 1000);
  }
  function stopTimer() { if (S.timer) clearInterval(S.timer); S.timer = null; }
  const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;

  function imgBlock(q) {
    if (!q.img) return "";
    const kind = q.imgType || (/[a-zA-Z]{3,}/.test(q.img) ? (q.img.length > 60 ? "passage" : "text") : "");
    return `<div class="qimg ${kind}">${esc(q.img)}</div>`;
  }
  const isNumAns = q => /^-?[\d.,]+$/.test(String(q.answer));

  function question() {
    stopSpeak();
    const u = S.user, z = S.quiz, q = z.qs[z.i], g1 = u.grade <= 2;
    let opts;
    if (q.type === "input") {
      opts = `<form class="inputrow" id="inform"><input id="inp" ${isNumAns(q) ? 'inputmode="numeric"' : 'autocapitalize="off"'} autocomplete="off" spellcheck="false" placeholder="Ketik jawaban…" aria-label="Jawaban"><button type="submit">OK</button></form>`;
    } else if (q.type === "uraian") {
      opts = `<form id="essay">${g1 ? `<p class="note" style="font-size:16px">💬 Sebutkan jawabanmu dulu ke Ayah/Ibu, lalu ketik singkat di sini.</p>` : ""}<textarea id="ess" class="essay" rows="${g1 ? 3 : 5}" placeholder="${g1 ? "Ketik jawabanmu…" : "Tulis jawabanmu dengan kalimat lengkap…"}" aria-label="Jawaban uraian"></textarea>
        <button class="btn green press" type="submit" style="margin-top:10px">✍️ Selesai menulis</button></form>`;
    } else if (g1) {
      const short = q.choices.every(c => String(c).length <= 3);
      opts = `<div class="opts">${q.choices.map((c, i) => `<button class="opt press o${i} ${short ? "short" : ""}" data-i="${i}"><span class="l">${LETTERS[i]}</span>${esc(c)}</button>`).join("")}</div>`;
    } else {
      opts = `<div class="opts3 ${q.choiceAksara ? "aksara" : ""}">${q.choices.map((c, i) => `<button class="opt3" data-i="${i}"><span class="l">${LETTERS[i]}</span><span>${esc(c)}</span></button>`).join("")}</div>`;
    }
    const tagType = q.type === "input" ? "✏️ Isian" : q.type === "uraian" ? "📝 Uraian" : "";
    const pill = z.boss ? `🐉 Bagian ${q.section} · ${z.i + 1}/${z.qs.length}` : `${esc(S.subject.icon)} Soal ${z.i + 1} dari ${z.qs.length} <small>${q.level ? "⭐".repeat(q.level) : ""}</small>`;
    view(`
      <div class="top"><button class="iconbtn" id="quit" aria-label="Keluar">✕</button>
        <div class="pill">${pill}</div>
        ${z.timeLeft ? `<div class="pill" id="timer">⏱ ${fmtTime(z.timeLeft)}</div>` : ""}</div>
      <div class="bar ${z.boss ? "bossbar" : ""}"><i style="width:${(z.i / z.qs.length) * 100}%"></i></div>
      ${z.boss && (z.i === 0 || z.qs[z.i - 1].section !== q.section) ? `<div class="sechead">Bagian ${q.section} · ${secName(q.section)} <small>(${bossCfg()[q.section].pts} poin/soal)</small></div>` : ""}
      <div class="qcard"><button class="speak" id="speak" aria-label="Bacakan soal">🔊</button>
        ${tagType ? `<div class="qtype">${tagType}</div>` : ""}
        <div class="q">${esc(q.q)}</div>${imgBlock(q)}</div>
      ${opts}
      <div class="combo" id="combo">${!z.boss && z.combo >= 2 ? `🔥 ${z.combo} benar berturut-turut!` : ""}</div>
      <div id="after"></div>`, g1 ? "g1" : "g3");
    requestAnimationFrame(() => { const b = app.querySelector(".bar i"); if (b) b.style.width = ((z.i + 1) / z.qs.length) * 100 + "%"; });

    on("#quit", () => { if (confirm("Keluar dari kuis? Nilai tidak disimpan.")) { stopTimer(); sendLive("keluar"); z.boss ? chapters() : levels(); } });
    on("#speak", e => {
      // Pelajaran berbahasa asing (mis. "lang": "en" di file JSON): pilihan & gambar dibaca dengan suara bahasa itu.
      // Per soal bisa diatur: "qLang" (bahasa pertanyaan), "imgLang", "choiceLang".
      const L = S.subject.lang || "id";
      const parts = [{ text: q.q, lang: q.qLang || "id" },
        { text: q.imgSpeak != null ? q.imgSpeak : (q.img && /[a-zA-Z]/.test(q.img) ? q.img : ""), lang: q.imgLang || L }];
      if (isMC(q)) q.choices.forEach((c, i) => parts.push({ text: `${LETTERS[i]}.`, lang: "id" }, { text: q.choiceLang === "none" ? "" : c, lang: q.choiceLang || L }));
      speak(parts, e.currentTarget);
    });
    on("[data-i]", e => answer(+e.currentTarget.dataset.i));
    const f = document.getElementById("inform");
    if (f) { f.addEventListener("submit", ev => { ev.preventDefault(); const v = document.getElementById("inp").value.trim(); if (v) answer(v); }); setTimeout(() => document.getElementById("inp").focus(), 50); }
    const ef = document.getElementById("essay");
    if (ef) ef.addEventListener("submit", ev => {
      ev.preventDefault();
      const v = document.getElementById("ess").value.trim();
      if (v.length < 3) return shake(document.getElementById("ess"));
      answer(v);
    });
  }

  // isian: abaikan huruf besar, tanda baca, spasi berlebih, titik ribuan
  const norm = s => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/(\d)\.(?=\d{3}\b)/g, "$1").replace(/,/g, ".").replace(/[^a-z0-9.\s-]/g, " ").replace(/\s+/g, " ").trim().replace(/\.$/, "");
  const kwFound = (text, kw) => norm(text).includes(norm(kw));

  function answer(choice) {
    const z = S.quiz, q = z.qs[z.i];
    if (z.answers[z.i]) return;
    stopSpeak();
    if (q.type === "uraian") return essayCheck(choice);
    let ok, given, correctText;
    if (q.type === "input") {
      ok = [q.answer].concat(q.accept || []).map(norm).includes(norm(choice)); given = choice; correctText = q.answer;
      const inp = document.getElementById("inp"); inp.disabled = true;
      app.querySelector(".inputrow button").disabled = true;
      if (!z.boss) inp.classList.add(ok ? "ok" : "bad");
    } else {
      ok = choice === q.answer; given = q.choices[choice]; correctText = q.choices[q.answer];
      app.querySelectorAll("[data-i]").forEach(b => {
        const i = +b.dataset.i; b.disabled = true;
        if (z.boss) { b.classList.add(i === choice ? "picked" : "dim"); return; }
        if (i === q.answer) { b.classList.add("ok", "pop"); if (b.classList.contains("opt3")) b.insertAdjacentHTML("beforeend", `<span class="tag" style="color:var(--ok)">✓ Jawaban benar</span>`); }
        else if (i === choice) { b.classList.add("bad", "shake"); if (b.classList.contains("opt3")) b.insertAdjacentHTML("beforeend", `<span class="tag" style="color:var(--bad)">✗ Pilihanmu</span>`); }
        else b.classList.add("dim");
      });
    }
    z.answers[z.i] = { ok, score: ok ? 1 : 0, given, correct: correctText, q };
    sendLive("bermain");
    if (z.boss) return setTimeout(nextQ, 350); // Bos Final: tanpa umpan balik, langsung soal berikutnya
    z.combo = ok ? z.combo + 1 : 0; z.bestCombo = Math.max(z.bestCombo, z.combo);
    beep(ok);
    const praise = ["Benar! Hebat! 🎉", "Betul sekali! 🌟", "Pintar! 👏", "Mantap! 💯", "Keren! 🚀"];
    const oops = ["Hampir! Coba lihat lagi ya 💪", "Belum tepat, tidak apa-apa! 🌱", "Ayo, kita pelajari bersama 📚"];
    const title = ok ? praise[Math.floor(Math.random() * praise.length)] : oops[Math.floor(Math.random() * oops.length)];
    const body = (!ok && q.type === "input" ? `Jawaban yang benar: ${correctText}\n` : "") + (q.explain || (ok ? "" : `Jawaban yang benar: ${correctText}`));
    document.getElementById("combo").textContent = z.combo >= 2 ? `🔥 ${z.combo} benar berturut-turut!` : "";
    showNext(`<div class="fb ${ok ? "good" : ""}"><h4>${title}</h4>${body ? `<p>${esc(body)}</p>` : ""}</div>`);
    if (ok && z.combo > 0 && z.combo % 5 === 0) confetti();
  }
  function showNext(html) {
    const z = S.quiz, last = z.i === z.qs.length - 1;
    document.getElementById("after").innerHTML = `${html}<button class="next" id="next">${last ? "Lihat hasil 🏁" : "Lanjut →"}</button>`;
    on("#next", nextQ);
    document.getElementById("next").scrollIntoView({ behavior: "smooth", block: "end" });
  }
  function nextQ() {
    const z = S.quiz;
    if (z.i < z.qs.length - 1) { z.i++; return question(); }
    z.boss ? bossGrade(false) : finish(false);
  }

  // uraian: tampilkan kunci + kata penting, lalu anak menilai sendiri
  function essayBox(q, text) {
    const kws = q.keywords || [];
    return `<div class="fb essaykey"><h4>🔑 Kunci jawaban</h4><p>${esc(q.answer)}</p>
      ${kws.length ? `<div class="kws">${kws.map(k => `<span class="${kwFound(text, k) ? "hit" : ""}">${kwFound(text, k) ? "✓ " : ""}${esc(k)}</span>`).join("")}</div>
      <p class="note" style="margin-top:6px">Kata penting yang hijau sudah ada di jawabanmu.</p>` : ""}</div>
      <p class="note" style="font-size:17px;font-weight:700;color:var(--ink)">Bandingkan jawabanmu. Bagaimana nilainya?</p>
      <div class="selfgrade">
        <button class="press g1" data-sg="1">✅ Tepat</button>
        <button class="press g2" data-sg="0.5">🟡 Kurang lengkap</button>
        <button class="press g3" data-sg="0">❌ Belum</button></div>`;
  }
  function essayCheck(text) {
    const z = S.quiz, q = z.qs[z.i];
    document.getElementById("ess").disabled = true;
    app.querySelector("#essay button").remove();
    z.answers[z.i] = { pending: true, given: text, q };
    if (z.boss) { z.answers[z.i] = { ok: false, score: null, given: text, q }; sendLive("bermain"); return nextQ(); } // dinilai di akhir
    document.getElementById("after").innerHTML = essayBox(q, text);
    on("[data-sg]", e => {
      const sc = +e.currentTarget.dataset.sg;
      z.answers[z.i] = { ok: sc === 1, score: sc, given: text, correct: q.answer, q };
      sendLive("bermain"); beep(sc > 0);
      showNext("");
    });
    document.getElementById("after").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Bos Final: setelah semua dijawab → nilai uraian satu per satu, lalu hasil
  function bossGrade(timeUp) {
    stopTimer();
    const z = S.quiz;
    z.timeUp = z.timeUp || timeUp;
    const idx = z.qs.findIndex((q, i) => q.type === "uraian" && z.answers[i] && z.answers[i].score == null);
    if (idx < 0) return finish(z.timeUp);
    const q = z.qs[idx], a = z.answers[idx];
    view(`${topbar("🐉 Menilai uraian")}
      <h1 class="title">Nilai jawaban uraianmu</h1>
      <div class="qcard"><div class="qtype">📝 Uraian · ${bossCfg().C.pts} poin</div><div class="q" style="padding-right:0">${esc(q.q)}</div>${imgBlock(q)}</div>
      <div class="rv"><b>Jawabanmu:</b><div class="re" style="font-size:17px;color:var(--ink)">${esc(a.given)}</div></div>
      ${essayBox(q, a.given)}`);
    on("#back", () => {});
    on("[data-sg]", e => { const sc = +e.currentTarget.dataset.sg; z.answers[idx] = Object.assign(a, { ok: sc === 1, score: sc, correct: q.answer }); bossGrade(z.timeUp); });
  }

  function finish(timeUp) {
    stopTimer(); stopSpeak();
    const u = S.user, d = S.subject, z = S.quiz;
    const pts = q => q.points || 1;
    const totalPts = z.qs.reduce((s, q) => s + pts(q), 0);
    const earned = z.qs.reduce((s, q, i) => s + pts(q) * ((z.answers[i] && z.answers[i].score) || 0), 0);
    const total = z.qs.length, right = z.answers.filter(a => a && a.ok).length;
    const pct = Math.round((earned / totalPts) * 100);
    const lockKeys = z.boss ? [] : [2, 3, 0];
    const wasLocked = lockKeys.filter(l => !isUnlocked(u, z.key, l));
    const bossWasLocked = S.ch && S.ch !== "all" ? !bossUnlocked(u, d) : false;
    saveProg(u, z.key, z.level, pct);
    const nowOpen = wasLocked.filter(l => isUnlocked(u, z.key, l)).map(l => LEVELS.find(L => L.n === l).name);
    if (bossWasLocked && bossUnlocked(u, d)) nowOpen.push("🐉 Bos Final");
    const st = starsFor(pct);
    const wrong = z.qs.map((q, i) => ({ q, a: z.answers[i] })).filter(x => !x.a || !x.a.ok);

    const record = {
      timestamp: new Date().toISOString(), username: u.username, name: u.name, grade: u.grade,
      subject: d.subject, subjectKey: d.key, level: z.levelName,
      score: right, total, percent: pct, durationSec: Math.round((Date.now() - z.start) / 1000), bestCombo: z.bestCombo,
      wrong: wrong.map(x => ({ id: x.q.id, bab: x.q.bab || (x.q.ch ? chName(d, x.q.ch) : ""), q: x.q.q.slice(0, 120) }))
    };
    const hist = store.get("history", []); hist.push(record); store.set("history", hist.slice(-500));
    if (ONLINE) {
      enqueue({ action: "saveResult", payload: { username: u.username, hash: u.hash, data: record } });
      enqueue({ action: "saveProgress", payload: { username: u.username, hash: u.hash, progress: u.progress } });
      sendLive("selesai", { correct: right, index: total });
    }

    const secRows = z.boss ? ["A", "B", "C"].map(s => {
      const idx = z.qs.map((q, i) => i).filter(i => z.qs[i].section === s);
      if (!idx.length) return "";
      const e = idx.reduce((t, i) => t + pts(z.qs[i]) * ((z.answers[i] && z.answers[i].score) || 0), 0), t = idx.reduce((t2, i) => t2 + pts(z.qs[i]), 0);
      return `<div><b>${s}</b> ${secName(s)}<span>${+e.toFixed(1)} / ${t} poin</span></div>`;
    }).join("") : "";
    const msg = z.boss ? (pct >= 80 ? `Bos dikalahkan! 🏆` : pct >= 60 ? `Hampir menang, ${u.name}!` : `Bos masih kuat. Latihan lagi, ya!`)
      : pct >= 90 ? `Luar biasa, ${u.name}!` : pct >= 70 ? `Hebat, ${u.name}!` : pct >= 40 ? `Bagus, terus berlatih ya!` : `Semangat! Coba lagi yuk!`;
    view(`<div class="result">
      ${timeUp ? `<div class="pill" style="align-self:center">⏰ Waktu habis!</div>` : ""}
      ${z.boss ? `<div style="font-size:70px">${pct >= 80 ? "🏆" : "🐉"}</div>` : ""}
      <div class="bigstars">${[1, 2, 3].map(i => `<span class="${i <= st ? "" : "off"}">⭐</span>`).join("")}</div>
      <div class="big">${esc(msg)}</div>
      <div class="score">${z.boss ? `Nilai ulangan` : `<b>${right}</b> dari ${total} soal benar ·`} nilai <b>${pct}</b></div>
      ${secRows ? `<div class="secs">${secRows}</div>` : ""}
      ${z.bestCombo >= 3 ? `<div class="score">🔥 Rekor beruntun: ${z.bestCombo}</div>` : ""}
      ${nowOpen.length ? `<div class="unlock">🔓 Terbuka: ${esc(nowOpen.join(", "))}!</div>` : ""}
      <div class="spacer"></div>
      ${wrong.length ? `<button class="btn white press" id="review">🔍 ${z.boss ? "Pembahasan" : "Lihat yang salah"} (${wrong.length})</button>` : ""}
      <button class="btn green press" id="again">🔁 ${z.boss ? "Lawan Bos lagi" : "Main lagi (soal diacak)"}</button>
      <button class="btn blue press" id="other">📚 ${S.ch || z.boss ? "Pilih bab / level lain" : "Pilih level / pelajaran lain"}</button>
    </div>`);
    if (st >= 2) confetti();
    S.lastWrong = wrong;
    on("#review", review);
    on("#again", () => z.boss ? bossIntro() : startQuiz(z.level));
    on("#other", () => z.boss ? chapters() : levels());
  }

  function review() {
    const z = S.quiz;
    const corr = q => q.type === "input" || q.type === "uraian" ? q.answer : q.choices[q.answer];
    const items = S.lastWrong.map(x => `
      <div class="rv"><div class="rq">${x.q.type === "uraian" ? "📝 " : x.q.type === "input" ? "✏️ " : ""}${esc(x.q.q)}</div>${x.q.img ? `<div class="re">${esc(x.q.img)}</div>` : ""}
        <div class="ra">${x.a ? `<span class="x">${x.q.type === "uraian" && x.a.score === 0.5 ? "🟡" : "✗"} Jawabanmu: ${esc(x.a.given)}</span><br>` : `<span class="x">✗ Belum dijawab</span><br>`}
        <span class="v">✓ ${x.q.type === "uraian" ? "Kunci" : "Jawaban benar"}: ${esc(corr(x.q))}</span></div>
        ${x.q.explain ? `<div class="re">💡 ${esc(x.q.explain)}</div>` : ""}</div>`).join("");
    view(`${topbar("🔍 Yang perlu dipelajari")}${items}<button class="btn green press" id="again">🔁 Coba lagi</button>`);
    on("#back", () => z.boss ? chapters() : levels());
    on("#again", () => z.boss ? bossIntro() : startQuiz(z.level));
  }

  // ================================================================ POJOK ORANG TUA
  function parentPin() {
    let pin = "";
    const LEN = String(CFG.parentPin).length; // panjang PIN mengikuti config (mis. 4 atau 5 angka)
    const draw = () => {
      view(`${topbar("🔒 Orang Tua")}
        <h1 class="title" style="text-align:center">Masukkan PIN</h1>
        <div class="pin">${Array.from({ length: LEN }, (_, i) => `<i class="${i < pin.length ? "f" : ""}"></i>`).join("")}</div>
        <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map(k => k === "" ? "<span></span>" : `<button data-k="${k}">${k}</button>`).join("")}</div>
        <p class="note" style="text-align:center">PIN bisa diubah di js/config.js</p>`);
      on("#back", home);
      on("[data-k]", e => {
        const k = e.currentTarget.dataset.k;
        pin = k === "⌫" ? pin.slice(0, -1) : (pin + k).slice(0, LEN);
        if (pin.length === LEN) {
          if (pin === String(CFG.parentPin)) return parent(pin);
          pin = ""; draw(); return shake(app.querySelector(".pin"));
        }
        draw();
      });
    };
    draw();
  }

  function stopLiveRefresh() { if (S.liveTimer) clearInterval(S.liveTimer); S.liveTimer = null; }
  const ago = iso => {
    const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    return s < 60 ? `${s} detik lalu` : s < 3600 ? `${Math.round(s / 60)} menit lalu` : s < 86400 ? `${Math.round(s / 3600)} jam lalu` : `${Math.round(s / 86400)} hari lalu`;
  };

  function liveHtml(rows) {
    const recent = rows.filter(r => r.updated && Date.now() - new Date(r.updated).getTime() < 6 * 3600 * 1000)
      .sort((a, b) => new Date(b.updated) - new Date(a.updated));
    if (!recent.length) return `<p class="note">Belum ada yang bermain dalam 6 jam terakhir.</p>`;
    return recent.map(r => {
      const fresh = Date.now() - new Date(r.updated).getTime() < 3 * 60 * 1000;
      const playing = fresh && r.status === "bermain";
      const pct = r.total ? Math.round((r.index / r.total) * 100) : 0;
      const state = playing ? `🟢 Sedang mengerjakan <b>${esc(r.subject)}</b> (${esc(r.level)}) · soal ${r.index}/${r.total} · benar ${r.correct}`
        : r.status === "selesai" ? `✅ Selesai <b>${esc(r.subject)}</b> (${esc(r.level)}) · benar ${r.correct}/${r.total}`
        : r.status === "keluar" ? `⏸️ Keluar dari <b>${esc(r.subject)}</b> di soal ${r.index}/${r.total}`
        : `💤 Tidak aktif · terakhir <b>${esc(r.subject)}</b>`;
      return `<div class="live ${playing ? "on" : ""}"><div class="lav">${esc(r.avatar)}</div>
        <div class="lbody"><b>${esc(r.name)}</b> · Kelas ${esc(r.grade)}<br>${state}
        ${playing ? `<span class="tr"><i style="width:${pct}%;background:var(--ok)"></i></span>` : ""}
        <small>${ago(r.updated)}</small></div></div>`;
    }).join("");
  }

  async function parent(pin) {
    view(`${topbar("🔒 Orang Tua")}<h1 class="title">Perkembangan belajar 📊</h1><p class="note">⏳ Memuat data…</p>`);
    on("#back", home);
    let accs = Object.values(accounts), hist = store.get("history", []), live = [], source = "perangkat ini", err = "";
    if (ONLINE) {
      try {
        const [a, h, l] = await Promise.all([api("accounts", { pin }), api("history", { pin }), api("liveStatus", { pin })]);
        if (a.ok && h.ok && l.ok) { accs = a.data; hist = h.data; live = l.data; source = "Google Sheet (semua perangkat)"; }
        else err = errMsg(a.error || h.error || l.error);
      } catch (e) { err = errMsg(e); }
    }
    if (!app.querySelector(".title") || !/Perkembangan/.test(app.querySelector(".title").textContent)) return; // sudah pindah layar

    const blocks = await Promise.all(accs.sort((a, b) => a.grade - b.grade || String(a.name).localeCompare(b.name)).map(async acc => {
      const mine = hist.filter(h => (h.username || "") === acc.username);
      const keys = CFG.subjects[acc.grade] || [];
      const rows = await Promise.all(keys.map(async key => {
        let d; try { d = await loadSubject(acc.grade, key); } catch (e) { return ""; }
        const hs = mine.filter(h => h.subjectKey === key);
        const lvTxt = d.type === "drill" ? "bersusun" : hasChapters(d) ? [1, 2].filter(sm => chList(d, sm).length).map(sm => { const b = bossProg(acc, d, sm); return `S${sm} ${chList(d, sm).filter(ch => chapterPassed(acc, d, ch)).length}/${chList(d, sm).length}${b ? "🐉" + b.best : ""}`; }).join(" ") : `Lv${[1, 2, 3].filter(l => isUnlocked(acc, key, l)).length}`;
        if (!hs.length) return `<div class="row"><span class="n">${esc(d.subject)}</span><span class="tr"></span><span class="v">belum</span></div>`;
        const recent = hs.slice(-3), avg = Math.round(recent.reduce((s, h) => s + Number(h.percent), 0) / recent.length);
        const color = avg >= 80 ? "var(--ok)" : avg >= 60 ? "var(--c5)" : "var(--bad)";
        return `<div class="row"><span class="n">${esc(d.subject)}</span><span class="tr"><i style="width:${avg}%;background:${color}"></i></span><span class="v">${avg} · ${lvTxt} · ${hs.length}x</span></div>`;
      }));
      const babCount = {};
      mine.slice(-30).forEach(h => (h.wrong || []).forEach(x => { if (x.bab) { const k = `${h.subject}: ${x.bab}`; babCount[k] = (babCount[k] || 0) + 1; } }));
      const weak = Object.entries(babCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const last = mine.slice(-4).reverse().map(h => `${new Date(h.timestamp).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · ${esc(h.subject)} (${esc(h.level)}) · ${h.percent}`).join("<br>");
      return `<div class="pkid"><h5>${esc(acc.avatar)} ${esc(acc.name)} · Kelas ${acc.grade}
          <button class="mini" data-grade="${esc(acc.username)}">✏️ Kelas</button>
          ${accounts[acc.username] ? `<button class="mini" data-forget="${esc(acc.username)}">🗑️</button>` : ""}</h5>
        ${rows.join("") || `<p class="note">Soal kelas ${acc.grade} belum tersedia.</p>`}
        ${weak.length ? `<div class="warn">⚠️ Perlu latihan: ${weak.map(w => esc(w[0])).join("; ")}</div>` : ""}
        ${last ? `<div class="hist"><b>Terakhir:</b><br>${last}</div>` : ""}</div>`;
    }));
    const pending = store.get("queue", []).length;
    view(`${topbar("🔒 Orang Tua")}
      <h1 class="title">Perkembangan belajar 📊</h1>
      ${err ? `<p class="note err">⚠️ ${esc(err)} Menampilkan data perangkat ini.</p>` : ""}
      ${ONLINE ? `<h2 class="sub">🔴 Pantauan langsung <small id="liveAt"></small></h2><div id="live">${liveHtml(live)}</div>` : ""}
      <h2 class="sub">👧👦 Semua pemain</h2>
      <p class="note">Angka = rata-rata 3 kuis terakhir · Lv = level terbuka · x = jumlah kuis</p>
      ${blocks.join("") || `<p class="note">Belum ada akun.</p>`}
      <div class="sync">${ONLINE ? `☁️ Data dari ${esc(source)}${pending ? ` · ${pending} kiriman menunggu` : ""}` : "💾 Tersimpan di perangkat ini saja. Pasang Google Sheet agar akun bisa dipakai di perangkat lain & pantauan langsung aktif (lihat README)."}</div>`);
    on("#back", home);
    on("[data-grade]", async e => {
      const un = e.currentTarget.dataset.grade, acc = accs.find(a => a.username === un);
      const g = prompt(`Kelas baru untuk ${acc.name} (1–6):`, acc.grade);
      if (!g || !(+g >= 1 && +g <= 6)) return;
      if (ONLINE) { try { const r = await api("setGrade", { pin, username: un, grade: +g }); if (!r.ok) return alert(errMsg(r.error)); } catch (x) { return alert(errMsg(x)); } }
      if (accounts[un]) { accounts[un].grade = +g; saveAccounts(); }
      parent(pin);
    });
    on("[data-forget]", e => {
      const un = e.currentTarget.dataset.forget;
      if (!confirm(`Hapus ${accounts[un].name} dari perangkat ini?${ONLINE ? " Akun & nilai di Google Sheet tetap ada." : " Nilainya akan hilang."}`)) return;
      delete accounts[un]; saveAccounts(); parent(pin);
    });
    if (ONLINE) {
      const stamp = () => { const el = document.getElementById("liveAt"); if (el) el.textContent = "· diperbarui " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); };
      stamp();
      S.liveTimer = setInterval(async () => {
        try { const l = await api("liveStatus", { pin }, 8000); const box = document.getElementById("live"); if (l.ok && box) { box.innerHTML = liveHtml(l.data); stamp(); } } catch (x) { /* coba lagi */ }
      }, (CFG.liveRefreshSeconds || 10) * 1000);
    }
  }

  // ================================================================ 🧮 Latihan Bersusun (js/bersusun.js)
  const DRILL = window.KUIS_DRILL ? window.KUIS_DRILL({ view, on, esc, shake, beep, confetti, topbar, S, saveProg, prog, store, ONLINE, enqueue, sendLive,
    back: () => subjects() }) : { open: () => alert("File js/bersusun.js belum dimuat.") };

  // ================================================================ 📖 Belajar Dulu (js/belajar.js)
  const LEARN = window.KUIS_BELAJAR ? window.KUIS_BELAJAR({ view, on, esc, shake, beep, confetti, topbar, S, saveProg, prog, store, ONLINE, enqueue, sendLive, speak, stopSpeak, shuffle })
    : { open: () => alert("File js/belajar.js belum dimuat."), stop: () => {} };

  // ================================================================ mulai
  flushQueue();
  home();
})();
