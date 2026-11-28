/* 🧮 Latihan Bersusun — penjumlahan, pengurangan, perkalian bersusun & pembagian porogapit.
 * Anak mengisi kotak satu per satu (seperti di kertas). Kotak yang aktif menyala, ada petunjuk 💡 di setiap langkah.
 * Bagian "BUILD" murni logika (bisa diuji tanpa browser); bagian "UI" memakai helper dari app.js.
 */
(function () {
  "use strict";
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const PLACE = ["satuan", "puluhan", "ratusan", "ribuan"];
  const digitsR = n => String(n).split("").reverse().map(Number); // digit dari kanan

  // pertanyaan langkah tanpa membocorkan jawaban (petunjuk lengkap muncul setelah 💡 / 2x salah)
  function askOf(h) {
    if (/Turunkan angka/.test(h)) return "④ Turunkan angka berikutnya dari atas.";
    if (/simpanan \d+ kecil/.test(h)) return "Ada simpanan? Tulis kecil di atas kolom berikutnya.";
    if (/Turunkan simpanan/.test(h)) return "Tidak ada angka lagi. Turunkan simpanannya.";
    if (/mendapat pinjaman/.test(h)) return h.split("→")[0] + "→ sekarang berapa?";
    if (/^Lanjutkan menulis/.test(h)) return "Lanjutkan menulis hasil kalinya.";
    const i = h.indexOf("=");
    return i > 0 ? h.slice(0, i) + "= ?" : h;
  }

  // ---------------------------------------------------------------- grid helper
  function Grid(rows, cols) {
    const g = { rows, cols, cells: {}, lines: [], steps: [], bracket: null };
    g.set = (r, c, v, kind, extra) => { g.cells[r + "," + c] = Object.assign({ v: String(v), kind: kind || "d" }, extra || {}); };
    g.input = (r, c, ans, hint, extra) => {
      g.cells[r + "," + c] = Object.assign({ v: "", kind: "in", ans: String(ans) }, extra || {});
      const st = { r, c, ans: String(ans), hint, ask: askOf(hint), then: [] };
      g.steps.push(st);
      return st;
    };
    g.line = (r, c1, c2) => g.lines.push({ r, c1, c2 });
    return g;
  }

  // ================================================================ BUILD: penjumlahan
  function buildAdd(a, b) {
    const sum = a + b, W = String(sum).length + 0, da = digitsR(a), db = digitsR(b), n = Math.max(da.length, db.length);
    const cols = Math.max(W, n) + 1, col = k => cols - 1 - k;
    const g = Grid(4, cols);
    da.forEach((d, k) => g.set(1, col(k), d));
    db.forEach((d, k) => g.set(2, col(k), d));
    g.set(2, 0, "+", "op"); g.line(2, 0, cols - 1);
    let carry = 0;
    for (let k = 0; k < n; k++) {
      const x = da[k], y = db[k];
      const parts = [x, y].filter(v => v !== undefined);
      if (carry) parts.push(carry);
      const s = parts.reduce((t, v) => t + v, 0), digit = s % 10, nc = Math.floor(s / 10);
      const expr = [x, y].filter(v => v !== undefined).join(" + ") + (carry ? ` + ${carry} (simpanan)` : "");
      const hint = `Kolom ${PLACE[k]}: ${expr} = ${s}.` + (nc ? ` Tulis ${digit}, simpan ${nc}.` : ` Tulis ${s}.`);
      g.input(3, col(k), digit, hint);
      if (nc) {
        if (k === n - 1) g.input(3, col(k + 1), nc, `Tidak ada angka lagi di kolom ${PLACE[k + 1]}. Turunkan simpanan ${nc}.`);
        else g.input(0, col(k + 1), nc, `Tulis simpanan ${nc} kecil di atas kolom ${PLACE[k + 1]}.`, { small: true });
      }
      carry = nc;
    }
    return Object.assign(g, { title: `${a} + ${b}`, answer: sum });
  }

  // ================================================================ BUILD: pengurangan (meminjam)
  function buildSub(a, b) {
    const diff = a - b, ta = digitsR(a), tb = digitsR(b), n = ta.length;
    const cols = n + 1, col = k => cols - 1 - k;
    const g = Grid(4, cols);
    ta.forEach((d, k) => g.set(1, col(k), d));
    tb.forEach((d, k) => g.set(2, col(k), d));
    g.set(2, 0, "−", "op"); g.line(2, 0, cols - 1);
    const eff = ta.slice(), resLen = String(diff).length;
    for (let k = 0; k < n; k++) {
      const y = tb[k] || 0;
      if (eff[k] < y) {
        let j = k + 1; while (eff[j] === 0) j++;               // cari tempat meminjam
        const before = eff[j]; eff[j] -= 1;
        const st = g.input(0, col(j), eff[j], `Kolom ${PLACE[k]}: ${eff[k]} kurang dari ${y}, jadi pinjam 1 dari kolom ${PLACE[j]}. ${before} − 1 = ${eff[j]}. Tulis ${eff[j]} kecil di atasnya.`, { small: true });
        st.then.push({ strike: [1, col(j)] });
        for (let m = j - 1; m > k; m--) {                      // nol di tengah: jadi 10 lalu dipinjam → 9
          eff[m] = 9;
          const s2 = g.input(0, col(m), 9, `Kolom ${PLACE[m]} 0 mendapat pinjaman jadi 10, lalu dipinjamkan 1 ke kanan → 9.`, { small: true });
          s2.then.push({ strike: [1, col(m)] });
        }
        eff[k] += 10;
        const last = g.steps[g.steps.length - 1];
        last.then.push({ set: [0, col(k), String(eff[k]), "auto"] }, { strike: [1, col(k)] });
      }
      const r = eff[k] - y;
      if (k < resLen) g.input(3, col(k), r, `Kolom ${PLACE[k]}: ${eff[k]} − ${y} = ${r}.`);
    }
    return Object.assign(g, { title: `${a} − ${b}`, answer: diff });
  }

  // ================================================================ BUILD: perkalian 1 digit
  function buildMul1(a, m) {
    const p = a * m, da = digitsR(a), W = String(p).length;
    const cols = Math.max(W, da.length) + 1, col = k => cols - 1 - k;
    const g = Grid(4, cols);
    da.forEach((d, k) => g.set(1, col(k), d));
    g.set(2, col(0), m); g.set(2, 0, "×", "op"); g.line(2, 0, cols - 1);
    let carry = 0;
    da.forEach((d, k) => {
      const s = d * m + carry, digit = s % 10, nc = Math.floor(s / 10);
      const hint = `${d} × ${m}${carry ? ` + ${carry} (simpanan)` : ""} = ${s}` + (nc ? `. Tulis ${digit}, simpan ${nc}.` : `. Tulis ${s}.`);
      g.input(3, col(k), digit, hint);
      if (nc) {
        if (k === da.length - 1) g.input(3, col(k + 1), nc, `Tidak ada angka lagi untuk dikali. Turunkan simpanan ${nc}.`);
        else g.input(0, col(k + 1), nc, `Tulis simpanan ${nc} kecil di atas kolom ${PLACE[k + 1]}.`, { small: true });
      }
      carry = nc;
    });
    return Object.assign(g, { title: `${a} × ${m}`, answer: p });
  }

  // ================================================================ BUILD: perkalian 2 digit (dua baris lalu dijumlah)
  function buildMul2(a, b) {
    const [b0, b1] = digitsR(b), p1 = a * b0, p2 = a * b1, tot = a * b, da = digitsR(a);
    const cols = String(tot).length + 1, col = k => cols - 1 - k;
    const g = Grid(5, cols);
    da.forEach((d, k) => g.set(0, col(k), d));
    digitsR(b).forEach((d, k) => g.set(1, col(k), d));
    g.set(1, 0, "×", "op"); g.line(1, 0, cols - 1);
    const partial = (row, mult, shift, intro) => {
      let carry = 0; const pd = digitsR(a * mult);
      pd.forEach((digit, k) => {
        const d = da[k];
        let hint;
        if (d !== undefined) { const s = d * mult + carry; hint = `${d} × ${mult}${carry ? ` + ${carry} (simpanan)` : ""} = ${s}` + (s >= 10 ? `. Tulis ${digit}, simpan ${Math.floor(s / 10)} di ingatan.` : `. Tulis ${digit}.`); carry = Math.floor(s / 10); }
        else hint = `Turunkan simpanan ${digit}.`;
        if (k === 0 && intro) hint = intro + " " + hint;
        g.input(row, col(k + shift), digit, hint);
      });
    };
    partial(2, b0, 0, `Baris 1: kalikan ${a} dengan satuan (${b0}).`);
    partial(3, b1, 1, `Baris 2: kalikan ${a} dengan puluhan (${b1}). Mulai menulis di kolom puluhan (geser 1 ke kiri).`);
    g.set(3, 0, "+", "op"); g.line(3, 0, cols - 1);
    const r1 = digitsR(p1), r2 = [undefined].concat(digitsR(p2)), td = digitsR(tot);
    let carry = 0;
    td.forEach((digit, k) => {
      const parts = [r1[k], r2[k]].filter(v => v !== undefined);
      const s = parts.reduce((t, v) => t + v, 0) + carry;
      const expr = parts.join(" + ") + (carry ? ` + simpanan ${carry}` : "");
      const hint = (k === 0 ? "Jumlahkan kedua baris. " : "") + (parts.length || carry ? `Kolom ${PLACE[k]}: ${expr || carry} = ${s}.` : "") + (s >= 10 ? ` Tulis ${digit}, simpan ${Math.floor(s / 10)}.` : ` Tulis ${digit}.`);
      g.input(4, col(k), digit, hint);
      carry = Math.floor(s / 10);
    });
    return Object.assign(g, { title: `${a} × ${b}`, answer: tot });
  }

  // ================================================================ BUILD: pembagian porogapit
  function buildDiv(dividend, d) {
    const D = String(dividend).split("").map(Number), n = D.length;
    const quotient = Math.floor(dividend / d);
    let idx = 0, cur = D[0];
    while (cur < d && idx < n - 1) { idx++; cur = cur * 10 + D[idx]; }
    const cycles = n - idx;
    const cols = n + 2, dc = j => 2 + j;                      // kolom 0 = pembagi, 1 = kurung
    const g = Grid(2 + cycles * 2, cols);
    g.set(1, 0, d, "d", { divisor: true }); g.set(1, 1, ")", "brk");
    D.forEach((x, j) => g.set(1, dc(j), x, "d", { brt: true }));
    let row = 2;
    while (true) {
      const q = Math.floor(cur / d), prod = q * d, rem = cur - prod;
      g.input(0, dc(idx), q, `① Bagi: ${cur} : ${d} = ${q}${rem ? ` (sisa ${rem})` : ""}. Tulis ${q} di atas.`);
      const ps = String(prod), start = dc(idx) - ps.length + 1;
      ps.split("").forEach((x, i) => g.input(row, start + i, x, i === 0 ? `② Kali: ${q} × ${d} = ${prod}. Tulis ${ps.length > 1 ? ps.split("").join(" lalu ") : prod} di bawah ${cur}.` : `Lanjutkan menulis ${prod}: angka ${x}.`));
      g.set(row, Math.max(1, start - 1), "−", "op");
      g.line(row, Math.max(2, start), dc(idx));
      g.input(row + 1, dc(idx), rem, `③ Kurang: ${cur} − ${prod} = ${rem}.`);
      if (idx === n - 1) break;
      idx++;
      g.input(row + 1, dc(idx), D[idx], `④ Turunkan angka ${D[idx]} dari atas → sekarang ${rem ? String(rem) + D[idx] : D[idx]}.`);
      cur = rem * 10 + D[idx];
      row += 2;
    }
    return Object.assign(g, { title: `${dividend} : ${d}`, answer: quotient, porogapit: true });
  }

  // ================================================================ angka soal per level
  const MAKERS = {
    add: lvl => {
      if (lvl === 1) { const ta = R(1, 7), tb = R(1, 8 - ta), ua = R(0, 8), ub = R(1, 9 - ua); return buildAdd(ta * 10 + ua, tb * 10 + ub); }
      if (lvl === 2) { let a, b; do { a = R(15, 89); b = R(15, 89); } while ((a % 10) + (b % 10) < 10); return buildAdd(a, b); }
      return buildAdd(R(125, 789), R(118, 699));
    },
    sub: lvl => {
      if (lvl === 1) { const ta = R(3, 9), tb = R(1, ta - 1), ua = R(2, 9), ub = R(0, ua); return buildSub(ta * 10 + ua, tb * 10 + ub); }
      if (lvl === 2) { let a, b; do { a = R(31, 98); b = R(12, a - 5); } while ((a % 10) >= (b % 10)); return buildSub(a, b); } // a diacak ulang tiap putaran
      let a, b; do { a = Math.random() < 0.3 ? R(3, 9) * 100 + R(0, 8) : R(312, 984); b = R(108, a - 20); } while ((a % 10) >= (b % 10)); return buildSub(a, b);
    },
    mul: lvl => {
      if (lvl === 1) { const m = R(2, 4), t = R(1, Math.floor(9 / m)), u = R(1, Math.floor(9 / m)); return buildMul1(t * 10 + u, m); }
      if (lvl === 2) { let a, m; do { a = R(12, 49); m = R(3, 9); } while ((a % 10) * m < 10); return buildMul1(a, m); }
      let b; do { b = R(11, 25); } while (b % 10 === 0); return buildMul2(R(12, 45), b);
    },
    div: lvl => {
      if (lvl === 1) { const d = R(2, 4), q1 = R(1, Math.floor(9 / d)), q0 = R(1, Math.floor(9 / d)); return buildDiv((q1 * 10 + q0) * d, d); }
      if (lvl === 2) { let d, q; do { d = R(2, 8); q = R(11, 48); } while (q * d > 99 || q * d < 24 || (q * d) % 10 === 0 && Math.random() < 0.5); return buildDiv(q * d, d); }
      let d, q; do { d = R(2, 9); q = R(21, 199); } while (q * d < 120 || q * d > 999); return buildDiv(q * d, d);
    }
  };
  const OPS = [
    { id: "add", name: "Penjumlahan bersusun", icon: "➕", color: "var(--c3)", lv: ["2 angka, tanpa simpan", "2 angka, dengan simpan", "3 angka"] },
    { id: "sub", name: "Pengurangan bersusun", icon: "➖", color: "var(--c2)", lv: ["2 angka, tanpa pinjam", "2 angka, dengan pinjam", "3 angka, pinjam berantai"] },
    { id: "mul", name: "Perkalian bersusun", icon: "✖️", color: "var(--c1)", lv: ["2 angka × 1 angka", "dengan simpanan", "2 angka × 2 angka"] },
    { id: "div", name: "Pembagian porogapit", icon: "➗", color: "var(--c4)", lv: ["2 angka : 1 angka", "dengan sisa di tengah", "3 angka : 1 angka"] }
  ];
  const PER_SESSION = 5;

  // ================================================================ UI
  window.KUIS_DRILL = function (K) {
    const { view, on, esc, shake, beep, confetti, topbar, S, saveProg, prog, store, ONLINE, enqueue, sendLive } = K;
    let keyHandler = null;
    const unbindKeys = () => { if (keyHandler) document.removeEventListener("keydown", keyHandler); keyHandler = null; };
    const key = op => `${S.subject.key}#${op}`;

    function home() {
      unbindKeys();
      const u = S.user;
      const cards = OPS.map(o => `
        <div class="drillop" style="--opc:${o.color}">
          <div class="dh"><span class="di">${o.icon}</span><b>${o.name}</b></div>
          <div class="dl">${[1, 2, 3].map(l => { const p = prog(u, key(o.id), l); return `<button class="press" data-op="${o.id}" data-l="${l}"><b>${"⭐".repeat(l)}</b><span>${esc(o.lv[l - 1])}</span>${p ? `<i>🏆 ${p.best}</i>` : ""}</button>`; }).join("")}</div>
        </div>`).join("");
      view(`${topbar("🧮 Latihan Bersusun")}
        <h1 class="title">Latihan bersusun</h1>
        <p class="note" style="margin:-8px 0 12px;font-size:16px">Isi kotak satu per satu seperti di kertas. Tekan 💡 jika butuh bantuan.</p>
        ${cards}`);
      on("#back", K.back);
      on("[data-op]", e => start(e.currentTarget.dataset.op, +e.currentTarget.dataset.l));
    }

    function start(op, lvl) {
      const o = OPS.find(x => x.id === op);
      const probs = []; const seen = new Set();
      while (probs.length < PER_SESSION) { const p = MAKERS[op](lvl); if (!seen.has(p.title)) { seen.add(p.title); probs.push(p); } }
      S.quiz = { drill: true, op, lvl, levelName: `${o.name} ${"⭐".repeat(lvl)}`, qs: probs, i: 0, answers: [], start: Date.now() };
      sendLive("bermain");
      problem();
    }

    function problem() {
      const z = S.quiz, g = z.qs[z.i];
      g.pos = g.pos || 0; g.miss = g.miss || 0; g.helped = g.helped || 0; g.firstOk = g.firstOk || 0; g.fixed = g.fixed || 0; g.wrongNow = 0;
      draw();
    }

    function cellHtml(g, r, c, active) {
      const cell = g.cells[r + "," + c];
      const ul = g.lines.some(l => l.r === r && c >= l.c1 && c <= l.c2);
      const cls = ["cell"];
      if (ul) cls.push("ul");
      if (!cell) return `<div class="${cls.join(" ")}"></div>`;
      if (cell.kind === "op") cls.push("op");
      if (cell.kind === "brk") cls.push("brk");
      if (cell.divisor) cls.push("divisor");
      if (cell.brt) cls.push("brt");
      if (cell.small) cls.push("small");
      if (cell.kind === "auto") cls.push("small", "auto");
      if (cell.strike) cls.push("strike");
      if (cell.kind === "in") cls.push(cell.state || "todo");
      if (active) cls.push("active");
      return `<div class="${cls.join(" ")}" data-rc="${r},${c}">${esc(cell.v)}</div>`;
    }

    function draw(msg) {
      const z = S.quiz, g = z.qs[z.i], st = g.steps[g.pos];
      let html = "";
      for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) html += cellHtml(g, r, c, st && st.r === r && st.c === c);
      const done = g.pos >= g.steps.length;
      view(`
        <div class="top"><button class="iconbtn" id="quit" aria-label="Keluar">✕</button>
          <div class="pill">🧮 Soal ${z.i + 1} dari ${z.qs.length}</div><div class="pill">${"⭐".repeat(z.lvl)}</div></div>
        <div class="bar"><i style="width:${((z.i + (done ? 1 : g.pos / g.steps.length)) / z.qs.length) * 100}%"></i></div>
        <div class="drillq">${esc(g.title)} = ${done ? `<b>${g.answer}</b>` : "…"}</div>
        <div class="sheet"><div class="sgrid" style="--cols:${g.cols}">${html}</div></div>
        ${done ? "" : `<div class="dhint ${msg ? "show" : ""}" id="hint">${esc(msg || (st ? st.ask : ""))}</div>`}
        ${done ? `<div class="fb good"><h4>${g.helped || g.fixed ? "Selesai! 👍" : "Benar semua! 🎉"}</h4><p>${esc(g.title)} = ${g.answer}${g.fixed ? ` · ${g.fixed} kotak diperbaiki` : ""}${g.helped ? ` · ${g.helped} kotak dibantu` : ""}</p></div>
          <button class="next" id="next">${z.i === z.qs.length - 1 ? "Lihat hasil 🏁" : "Soal berikutnya →"}</button>`
        : `<div class="dkeys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button class="press" data-k="${k}">${k}</button>`).join("")}<button class="press help" id="help">💡</button><button class="press" data-k="0">0</button><button class="press help" id="show">👀</button></div>`}`, "g3");
      on("#quit", () => { if (confirm("Keluar dari latihan?")) { sendLive("keluar"); home(); } });
      on("[data-k]", e => press(e.currentTarget.dataset.k));
      on("#help", () => { if (st) draw("💡 " + st.hint); });
      on("#show", () => reveal());
      on("#next", next);
      unbindKeys();
      if (!done) { keyHandler = e => { if (/^\d$/.test(e.key)) press(e.key); }; document.addEventListener("keydown", keyHandler); }
      const act = document.querySelector(".cell.active"); if (act) act.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    function apply(g, st) {
      const cell = g.cells[st.r + "," + st.c];
      cell.v = st.ans;
      st.then.forEach(t => {
        if (t.strike) { const c2 = g.cells[t.strike[0] + "," + t.strike[1]]; if (c2) c2.strike = true; }
        if (t.set) { const [r, c, v, kind] = t.set; const prev = g.cells[r + "," + c]; g.cells[r + "," + c] = { v, kind, small: true, state: prev && prev.state }; }
      });
    }

    function press(k) {
      const z = S.quiz, g = z.qs[z.i], st = g.steps[g.pos];
      if (!st) return;
      const cell = g.cells[st.r + "," + st.c];
      if (k === st.ans) {
        cell.state = g.wrongNow ? "fixed" : "ok";
        if (g.wrongNow) g.fixed++; else g.firstOk++;
        apply(g, st); g.pos++; g.wrongNow = 0; beep(true);
        if (g.pos >= g.steps.length) return finishProblem();
        return draw();
      }
      g.miss++; g.wrongNow++; beep(false);
      if (g.wrongNow >= 2) return draw("💡 " + st.hint);
      const el = document.querySelector(".cell.active"); shake(el);
      const h = document.getElementById("hint"); if (h) { h.textContent = "Belum tepat, coba lagi! Tekan 💡 untuk petunjuk."; h.classList.add("show"); }
    }

    function reveal() {
      const z = S.quiz, g = z.qs[z.i], st = g.steps[g.pos];
      if (!st) return;
      g.cells[st.r + "," + st.c].state = "help"; g.helped++;
      apply(g, st); g.pos++; g.wrongNow = 0;
      if (g.pos >= g.steps.length) return finishProblem();
      draw("👀 " + st.hint);
    }

    function finishProblem() {
      const z = S.quiz, g = z.qs[z.i];
      z.answers[z.i] = { ok: g.helped === 0 && g.fixed === 0, helped: g.helped, fixed: g.fixed, firstOk: g.firstOk, cells: g.steps.length };
      sendLive("bermain");
      if (!g.helped && !g.fixed) confetti();
      draw();
    }

    function next() {
      const z = S.quiz;
      if (z.i < z.qs.length - 1) { z.i++; return problem(); }
      result();
    }

    function result() {
      unbindKeys();
      const u = S.user, z = S.quiz, o = OPS.find(x => x.id === z.op);
      const cells = z.answers.reduce((t, a) => t + a.cells, 0);
      const firstTry = z.answers.reduce((t, a) => t + a.firstOk, 0); // kotak yang benar pada percobaan pertama
      const pct = Math.round((firstTry / cells) * 100);
      const perfect = z.answers.filter(a => a.ok).length;
      saveProg(u, key(z.op), z.lvl, pct);
      const record = { timestamp: new Date().toISOString(), username: u.username, name: u.name, grade: u.grade, subject: S.subject.subject, subjectKey: S.subject.key,
        level: z.levelName, score: perfect, total: z.qs.length, percent: pct, durationSec: Math.round((Date.now() - z.start) / 1000), bestCombo: 0,
        wrong: z.answers.map((a, i) => a.ok ? null : { id: "bersusun-" + z.op, bab: o.name, q: z.qs[i].title }).filter(Boolean) };
      const hist = store.get("history", []); hist.push(record); store.set("history", hist.slice(-500));
      if (ONLINE) {
        enqueue({ action: "saveResult", payload: { username: u.username, hash: u.hash, data: record } });
        enqueue({ action: "saveProgress", payload: { username: u.username, hash: u.hash, progress: u.progress } });
        sendLive("selesai", { correct: perfect, index: z.qs.length });
      }
      const st = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
      view(`<div class="result">
        <div style="font-size:64px">${o.icon}</div>
        <div class="bigstars">${[1, 2, 3].map(i => `<span class="${i <= st ? "" : "off"}">⭐</span>`).join("")}</div>
        <div class="big">${pct >= 90 ? `Jago bersusun, ${esc(u.name)}!` : pct >= 70 ? "Hebat!" : "Terus berlatih, ya!"}</div>
        <div class="score"><b>${perfect}</b> dari ${z.qs.length} soal tanpa salah · ketepatan ${pct}%</div>
        <div class="secs">${z.qs.map((g, i) => `<div><b>${i + 1}</b> ${esc(g.title)} = ${g.answer}<span>${z.answers[i].ok ? "✅" : z.answers[i].helped ? `👀 ${z.answers[i].helped}` : `✏️ ${z.answers[i].fixed}`}</span></div>`).join("")}</div>
        <p class="note">✅ tanpa salah · ✏️ = kotak yang diperbaiki · 👀 = kotak yang dibantu</p>
        <div class="spacer"></div>
        <button class="btn green press" id="again">🔁 Latihan lagi</button>
        <button class="btn blue press" id="menu">🧮 Pilih latihan lain</button></div>`);
      if (st >= 2) confetti();
      on("#again", () => start(z.op, z.lvl));
      on("#menu", home);
    }

    return { open: home, stop: unbindKeys };
  };

  // untuk pengujian otomatis
  window.KUIS_DRILL_BUILD = { buildAdd, buildSub, buildMul1, buildMul2, buildDiv, MAKERS };
})();
