/* 📖 Belajar Dulu — mini materi + permainan + mini kuis (untuk anak yang belum lancar membaca)
 * Isi materi: data/kelasN/<subject.lessons>.json  ·  Dipanggil dari app.js lewat window.KUIS_BELAJAR(K)
 * Alur tiap topik: ① Kartu materi → ② Cocokkan (ketuk gambar lalu kata, muncul garis) → ③ Dengar & pilih → ④ Mini kuis 5 soal
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------- gambar (emoji / bentuk / warna / svg)
  const SHAPES = {
    circle: '<circle cx="50" cy="50" r="40"/>',
    triangle: '<polygon points="50,9 93,87 7,87"/>',
    square: '<rect x="14" y="14" width="72" height="72" rx="3"/>',
    rectangle: '<rect x="3" y="28" width="94" height="44" rx="3"/>'
  };
  const SVGS = {
    eraser: '<g transform="rotate(-18 50 50)"><rect x="12" y="34" width="76" height="32" rx="7" fill="#F78FB3"/><path d="M52 34h29a7 7 0 0 1 7 7v18a7 7 0 0 1-7 7H52z" fill="#4CC9F0"/><rect x="12" y="34" width="76" height="32" rx="7" fill="none" stroke="#2B2D42" stroke-width="3"/></g>',
    table: '<rect x="6" y="30" width="88" height="11" rx="3" fill="#B5733F" stroke="#2B2D42" stroke-width="3"/><rect x="14" y="41" width="8" height="46" fill="#8B5A2B" stroke="#2B2D42" stroke-width="3"/><rect x="78" y="41" width="8" height="46" fill="#8B5A2B" stroke="#2B2D42" stroke-width="3"/>',
    board: '<rect x="5" y="12" width="90" height="62" rx="4" fill="#8B5A2B" stroke="#2B2D42" stroke-width="3"/><rect x="11" y="18" width="78" height="50" fill="#2E7D4F"/><path d="M20 32h32M20 44h48M20 56h22" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M30 74l-6 16M70 74l6 16" stroke="#2B2D42" stroke-width="4" stroke-linecap="round"/>'
  };
  function vis(o) {
    if (!o) return "";
    if (o.shape) return `<svg class="vis" viewBox="0 0 100 100" aria-hidden="true"><g fill="#4CC9F0" stroke="#2B2D42" stroke-width="4" stroke-linejoin="round">${SHAPES[o.shape] || ""}</g></svg>`;
    if (o.svg) return `<svg class="vis" viewBox="0 0 100 100" aria-hidden="true">${SVGS[o.svg] || ""}</svg>`;
    if (o.color) return `<span class="vis swatch" style="background:${o.color}"></span>`;
    if (o.pic || o.img) {
      const e = o.pic || o.img, n = (e.match(/\p{Extended_Pictographic}/gu) || []).length;
      const em = `<span class="vis emo${n > 1 ? " multi" : ""}">${e}</span>`;
      // ukuran: gambar yang sama ditampilkan besar / kecil di kotak yang sama
      return o.size ? `<span class="vis sizebox sz-${o.size}">${em}</span>` : em;
    }
    return "";
  }
  const hasVis = o => o && (o.shape || o.svg || o.color || o.pic || o.img);
  // kalimat campuran: bagian dalam tanda kutip dibacakan dengan suara bahasa Inggris
  function mixedParts(text) {
    return String(text).split(/"([^"]+)"/).map((t, i) => ({ text: t, lang: i % 2 ? "en" : "id" })).filter(p => p.text.trim());
  }

  window.KUIS_BELAJAR = function (K) {
    const { view, on, esc, shake, beep, confetti, topbar, S, saveProg, prog, store, ONLINE, enqueue, sendLive, speak, stopSpeak, shuffle } = K;
    let L = null, subj = null, goBack = null, onResize = null;
    const STEPS = [
      { id: "cards", ic: "📖", name: "Kartu materi", desc: "Ketuk kartu untuk mendengar" },
      { id: "match", ic: "🔗", name: "Cocokkan", desc: "Ketuk gambar, lalu ketuk katanya" },
      { id: "listen", ic: "👂", name: "Dengar & pilih", desc: "Dengarkan, lalu ketuk gambarnya" },
      { id: "quiz", ic: "⭐", name: "Mini kuis", desc: "5 soal, kumpulkan bintang!" }
    ];
    const pkey = t => `${subj.key}#learn-${t.id}`;
    const words = t => t.cards.filter(c => c.type !== "rule" && c.en);
    const starsOf = pct => pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
    const stepKey = t => S.user.username + "|" + subj.key + "|" + t.id;
    const doneSteps = t => (store.get("learnSteps", {})[stepKey(t)] || []);
    function markDone(t, step) {
      const all = store.get("learnSteps", {}), k = stepKey(t), l = all[k] || [];
      if (!l.includes(step)) l.push(step);
      all[k] = l; store.set("learnSteps", all);
    }
    function clean() { stopSpeak(); if (onResize) { window.removeEventListener("resize", onResize); onResize = null; } }
    const sayWord = c => speak([{ text: c.en, lang: "en" }]);

    async function open(d, back) {
      subj = d; goBack = back;
      const want = `data/kelas${S.user.grade}/${d.lessons}.json`;
      if (!L || L._src !== want) {
        view(`${topbar("📖 Belajar Dulu")}<p class="note">Memuat materi…</p>`, "wide"); on("#back", goBack);
        try {
          const r = await fetch(want, { cache: "no-cache" });
          if (!r.ok) throw new Error(want);
          L = await r.json(); L._src = want;
        } catch (e) { view(`${topbar("📖 Belajar Dulu")}<p class="note">Materi belum tersedia (${esc(want)}).</p>`, "wide"); on("#back", goBack); return; }
      }
      list();
    }

    // ---------------------------------------------------------------- daftar topik
    function list() {
      clean();
      const u = S.user;
      view(`${topbar(`📖 ${esc(subj.subject)}`)}
        <h1 class="title">Belajar dulu, yuk!</h1>
        <p class="note" style="margin:-6px 0 14px;font-size:17px">${esc(L.note || "")}</p>
        <div class="ltopics">${L.topics.map((t, i) => {
          const p = prog(u, pkey(t), 1), st = p ? starsOf(p.best) : 0, steps = doneSteps(t).length;
          return `<button class="ltopic press" data-t="${i}" style="--tc:${t.color || "var(--c2)"}">
            <span class="li">${esc(t.icon)}</span>
            <span class="lt"><b>${esc(t.title)}</b><small>${esc(t.sub || "")}</small></span>
            <span class="ls"><span>${[1, 2, 3].map(n => `<i class="${n <= st ? "" : "off"}">⭐</i>`).join("")}</span><small>${steps}/4 langkah</small></span></button>`;
        }).join("")}</div>`, "wide");
      on("#back", goBack);
      on("[data-t]", e => topic(L.topics[+e.currentTarget.dataset.t]));
    }

    // ---------------------------------------------------------------- halaman topik
    function topic(t) {
      clean();
      const u = S.user, done = doneSteps(t), p = prog(u, pkey(t), 1);
      const next = (STEPS.find(s => !done.includes(s.id)) || {}).id;
      view(`${topbar(`📖 ${esc(subj.subject)}`)}
        <div class="lhead" style="--tc:${t.color || "var(--c2)"}"><span>${esc(t.icon)}</span><div><h1 class="title">${esc(t.title)}</h1><small>${esc(t.sub || "")}</small></div></div>
        <div class="lsteps">${STEPS.map((s, i) => `<button class="lstep press ${s.id === next ? "sugg" : ""}" data-step="${s.id}">
          <span class="lnum">${done.includes(s.id) ? "✅" : i + 1}</span><span class="lic">${s.ic}</span>
          <span class="lt"><b>${s.name}</b><small>${s.id === "quiz" && p ? `🏆 terbaik ${p.best} · ${"⭐".repeat(starsOf(p.best)) || "coba lagi"}` : s.id === "cards" ? `${t.cards.length} kartu · ${s.desc.toLowerCase()}` : s.desc}</small></span></button>`).join("")}</div>`, "wide");
      on("#back", list);
      on("[data-step]", e => ({ cards, match, listen, quiz })[e.currentTarget.dataset.step](t));
    }

    function doneScreen(t, step, icon, msg, sub) {
      markDone(t, step);
      const i = STEPS.findIndex(s => s.id === step), nx = STEPS[i + 1];
      view(`<div class="result">
        <div style="font-size:84px">${icon}</div><div class="big">${msg}</div>
        ${sub ? `<div class="score">${sub}</div>` : ""}
        <div class="spacer"></div>
        ${nx ? `<button class="btn green press" id="nx">${nx.ic} Lanjut: ${nx.name}</button>` : ""}
        <button class="btn blue press" id="again">🔁 Ulangi</button>
        <button class="btn white press" id="tp">← ${esc(t.title)}</button></div>`, "wide");
      confetti(); beep(true);
      if (nx) on("#nx", () => ({ cards, match, listen, quiz })[nx.id](t));
      on("#again", () => ({ cards, match, listen, quiz })[step](t));
      on("#tp", () => topic(t));
    }

    // ---------------------------------------------------------------- ① kartu materi
    function cards(t) {
      clean();
      let i = 0;
      const render = () => {
        const c = t.cards[i], last = i === t.cards.length - 1;
        let body;
        if (c.type === "rule") {
          body = `<div class="lcard rule"><h2>${esc(c.title)}</h2>
            <div class="lrows">${c.rows.map((r, k) => `<button class="lrow press" data-row="${k}">
              <span class="rv">${hasVis(r) ? vis(r) : ""}</span>
              <span class="ra">${esc(r.a)}</span><span class="rb">${esc(r.b)} <i>🔊</i></span>${r.c ? `<span class="rc">${esc(r.c)}</span>` : ""}</button>`).join("")}</div>
            ${c.tip ? `<div class="ltip">💡 ${esc(c.tip)}</div>` : ""}</div>`;
        } else {
          body = `<button class="lcard word press" id="card">
            ${c.group ? `<span class="lgroup">${esc(c.group)}</span>` : ""}
            <div class="lbig">${vis(c)}</div>
            <div class="len">${esc(c.en)} <i>🔊</i></div>
            <div class="lid">${esc(c.id)}</div>
            ${c.note ? `<div class="lnote">${esc(c.note)}</div>` : ""}</button>
            ${c.ex ? `<button class="lex press" id="ex">💬 ${esc(c.ex)} <i>🔊</i></button>` : ""}`;
        }
        view(`${topbar(`${esc(t.icon)} ${esc(t.title)}`)}
          <div class="ldots">${t.cards.map((_, k) => `<i class="${k === i ? "on" : k < i ? "seen" : ""}"></i>`).join("")}</div>
          ${body}
          <div class="lnav"><button class="btn white press" id="prev" ${i ? "" : "disabled"}>◀</button>
          <button class="btn ${last ? "green" : "blue"} press" id="next">${last ? "Selesai ✅" : "Lanjut ▶"}</button></div>`, "wide");
        on("#back", () => topic(t));
        on("#prev", () => { if (i) { i--; render(); } });
        on("#next", () => { if (last) return doneScreen(t, "cards", "📖", "Kartu selesai!", "Sekarang kita main cocokkan, yuk!"); i++; render(); });
        on("#card", () => speak([{ text: c.en, lang: "en" }, { text: c.id, lang: "id" }]));
        on("#ex", () => speak([{ text: c.ex, lang: "en" }]));
        on("[data-row]", e => speak([{ text: c.rows[+e.currentTarget.dataset.row].b, lang: "en" }]));
        // bacakan otomatis setiap kartu
        if (c.type === "rule") speak(c.say || [{ text: c.title, lang: "id" }]);
        else speak([{ text: c.en, lang: "en" }, { text: c.id, lang: "id" }]);
      };
      render();
    }

    // ---------------------------------------------------------------- ② cocokkan (ketuk gambar ↔ kata, lalu muncul garis)
    const LINE_COLORS = ["#FF8A5B", "#4CC9F0", "#7BD389", "#B388EB", "#F78FB3"];
    function match(t) {
      clean();
      // kata kembar (mis. big/small) diselang-seling supaya tiap ronde berisi keduanya
      const groups = {}; shuffle(words(t)).forEach(c => (groups[c.en] = groups[c.en] || []).push(c));
      const mixed = []; const gl = Object.values(groups);
      for (let n = 0; gl.some(g => g.length); n++) { const g = gl[n % gl.length]; if (g.length) mixed.push(g.shift()); }
      const pool = mixed.slice(0, 8);
      const rounds = []; for (let k = 0; k < pool.length; k += 4) rounds.push(pool.slice(k, k + 4));
      if (rounds.length > 1 && rounds[rounds.length - 1].length < 3) { const tail = rounds.pop(); rounds[rounds.length - 1].push(...tail); }
      let r = 0, mistakes = 0;
      const play = () => {
        const items = rounds[r], right = shuffle(items.map((_, k) => k));
        const pairs = []; let sel = null;
        view(`${topbar(`🔗 Cocokkan · ${r + 1}/${rounds.length}`)}
          <p class="lhint">Ketuk <b>gambar</b>, lalu ketuk <b>katanya</b>. Ketuk kata untuk mendengar suaranya 🔊</p>
          <div class="lmatch" id="mbox"><svg class="mlines" id="mlines"></svg>
            <div class="mcol">${items.map((c, k) => `<button class="mitem mpic press" data-side="L" data-k="${k}">${vis(c)}</button>`).join("")}</div>
            <div></div>
            <div class="mcol">${right.map(k => `<button class="mitem mword press" data-side="R" data-k="${k}">${esc(items[k].en)}</button>`).join("")}</div>
          </div>`, "wide");
        on("#back", () => topic(t));
        const box = document.getElementById("mbox"), svg = document.getElementById("mlines");
        const el = (side, k) => box.querySelector(`[data-side="${side}"][data-k="${k}"]`);
        const draw = () => {
          const b = box.getBoundingClientRect();
          svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
          svg.innerHTML = pairs.map((p, n) => {
            const a = el("L", p.l).getBoundingClientRect(), c = el("R", p.r).getBoundingClientRect();
            const x1 = a.right - b.left, y1 = a.top + a.height / 2 - b.top, x2 = c.left - b.left, y2 = c.top + c.height / 2 - b.top;
            const col = LINE_COLORS[n % LINE_COLORS.length];
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="7" stroke-linecap="round"/><circle cx="${x1}" cy="${y1}" r="8" fill="${col}"/><circle cx="${x2}" cy="${y2}" r="8" fill="${col}"/>`;
          }).join("");
        };
        onResize = draw; window.addEventListener("resize", onResize);
        box.querySelectorAll(".mitem").forEach(b => b.addEventListener("click", () => {
          const side = b.dataset.side, k = +b.dataset.k;
          if (b.classList.contains("done")) return;
          if (side === "R") sayWord(items[k]);
          if (!sel || sel.side === side) {
            box.querySelectorAll(".mitem.sel").forEach(x => x.classList.remove("sel"));
            sel = { side, k }; b.classList.add("sel"); return;
          }
          const other = el(sel.side, sel.k);
          // cocok jika katanya sama (boleh ada kata kembar, mis. "big" untuk gajah dan bola besar)
          if (items[sel.k].en === items[k].en) {
            pairs.push(side === "L" ? { l: k, r: sel.k } : { l: sel.k, r: k }); other.classList.remove("sel"); other.classList.add("done"); b.classList.add("done");
            const col = LINE_COLORS[(pairs.length - 1) % LINE_COLORS.length];
            other.style.setProperty("--mc", col); b.style.setProperty("--mc", col);
            draw(); beep(true); if (side === "L") sayWord(items[k]);
            if (pairs.length === items.length) setTimeout(() => { if (++r < rounds.length) play(); else doneScreen(t, "match", "🔗", "Semua cocok!", mistakes ? `Salah ${mistakes} kali — tidak apa-apa, terus berlatih!` : "Tanpa salah sama sekali! 🌟"); }, 1100);
          } else {
            mistakes++; beep(false); shake(b); shake(other);
            other.classList.remove("sel");
          }
          sel = null;
        }));
      };
      play();
    }

    // ---------------------------------------------------------------- ③ dengar & pilih gambar
    function listen(t) {
      clean();
      const all = words(t), order = shuffle(all).slice(0, Math.min(6, all.length));
      let i = 0, firstOk = 0;
      const play = () => {
        const target = order[i];
        const opts = shuffle([target, ...shuffle(all.filter(c => c !== target && c.en !== target.en)).slice(0, 3)]);
        let tries = 0, locked = false;
        view(`${topbar(`👂 Dengar & pilih · ${i + 1}/${order.length}`)}
          <button class="lsay press" id="say"><span>🔊</span><b>Dengarkan</b></button>
          <div class="lpick">${opts.map((c, k) => `<button class="lpo press" data-k="${k}">${vis(c)}<small></small></button>`).join("")}</div>`, "wide");
        on("#back", () => topic(t));
        const say = () => sayWord(target);
        on("#say", say); say();
        on("[data-k]", e => {
          if (locked) return;
          const b = e.currentTarget, c = opts[+b.dataset.k];
          tries++;
          if (c === target) {
            locked = true; if (tries === 1) firstOk++;
            b.classList.add("ok"); b.querySelector("small").textContent = c.en; beep(true);
            speak([{ text: c.en, lang: "en" }, { text: c.id, lang: "id" }]);
            setTimeout(() => { if (++i < order.length) play(); else doneScreen(t, "listen", "👂", "Telingamu hebat!", `${firstOk} dari ${order.length} benar pada percobaan pertama`); }, 1600);
          } else {
            b.classList.add("bad"); b.querySelector("small").textContent = c.en; beep(false); shake(b);
            setTimeout(say, 500);
          }
        });
      };
      play();
    }

    // ---------------------------------------------------------------- ④ mini kuis
    function buildQuiz(t) {
      const N = 5, hand = shuffle(t.quiz || []).slice(0, Math.min(N, t.quizMix != null ? t.quizMix : 3));
      const ws = words(t), auto = [];
      shuffle(ws).forEach((c, k) => {
        if (hand.length + auto.length >= N) return;
        const others = shuffle(ws.filter(x => x !== c && x.en !== c.en)).slice(0, 3);
        if (others.length < 3) return;
        if (k % 2 === 0) auto.push({ q: "Dengarkan, lalu pilih gambarnya!", sayEn: c.en, choices: [c, ...others], answer: 0, explain: `${c.en} = ${c.id}.` });
        else auto.push({ q: "Bahasa Inggris dari gambar ini adalah …", vis: c, choices: [c.en, ...others.map(x => x.en)], answer: 0, explain: `${c.en} = ${c.id}.` });
      });
      return shuffle(hand.concat(auto)).map(q => {
        const idx = shuffle(q.choices.map((_, k) => k));
        return Object.assign({}, q, { choices: idx.map(k => q.choices[k]), answer: idx.indexOf(q.answer) });
      });
    }
    function quiz(t) {
      clean();
      const qs = buildQuiz(t);
      S.quiz = { learn: true, levelName: `📖 ${t.title}`, qs, i: 0, answers: [], start: Date.now() };
      sendLive("bermain");
      const z = S.quiz;
      const ask = () => {
        const q = z.qs[z.i], picChoices = typeof q.choices[0] === "object";
        const qvis = q.vis ? vis(q.vis) : q.img ? vis({ pic: q.img }) : "";
        view(`${topbar(`⭐ Mini kuis · ${z.i + 1}/${z.qs.length}`)}
          <div class="bar"><i style="width:${(z.i / z.qs.length) * 100}%"></i></div>
          <div class="qcard lq"><button class="speak" id="spk" aria-label="Bacakan">🔊</button>
            <div class="lqq">${esc(q.q)}</div>${qvis ? `<div class="lqv">${qvis}</div>` : ""}</div>
          ${picChoices
            ? `<div class="lpick">${q.choices.map((c, k) => `<button class="lpo press" data-a="${k}">${vis(c)}<small></small></button>`).join("")}</div>`
            : `<div class="opts">${q.choices.map((c, k) => `<button class="opt o${k} press ${String(c).length > 14 ? "long" : ""}" data-a="${k}">${esc(c)}</button>`).join("")}</div>`}
          <div id="fb"></div>`, "wide");
        on("#back", () => topic(t));
        const readQ = () => {
          const parts = mixedParts(q.q);
          if (q.sayEn) parts.push({ text: q.sayEn, lang: "en" });
          return parts;
        };
        on("#spk", e => speak(readQ().concat(picChoices ? [] : q.choices.map(c => ({ text: c, lang: q.choiceLang === "id" ? "id" : "en" }))), e.currentTarget));
        speak(readQ());
        on("[data-a]", e => {
          if (z.answers[z.i]) return;
          const k = +e.currentTarget.dataset.a, ok = k === q.answer;
          z.answers[z.i] = { ok };
          app().querySelectorAll("[data-a]").forEach(b => {
            const n = +b.dataset.a;
            if (n === q.answer) b.classList.add("ok");
            else if (n === k) b.classList.add("bad");
            else b.classList.add("dim");
            if (picChoices && (n === q.answer || n === k)) b.querySelector("small").textContent = q.choices[n].en || q.choices[n].shape || "";
          });
          beep(ok);
          if (picChoices || ok) { const c = q.choices[q.answer]; speak([{ text: typeof c === "object" ? c.en : c, lang: q.choiceLang === "id" ? "id" : "en" }]); }
          document.getElementById("fb").innerHTML = `<div class="fb ${ok ? "good" : "bad"}"><b>${ok ? "✅ Benar!" : "❌ Belum tepat"}</b> ${esc(q.explain || "")}</div>
            <button class="btn green press" id="nx">${z.i + 1 < z.qs.length ? "Lanjut ▶" : "Lihat hasil 🏆"}</button>`;
          on("#nx", () => { z.i++; if (z.i < z.qs.length) { sendLive("bermain"); ask(); } else result(); });
          document.getElementById("nx").scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      };
      const result = () => {
        const u = S.user, right = z.answers.filter(a => a && a.ok).length, pct = Math.round((right / z.qs.length) * 100);
        saveProg(u, pkey(t), 1, pct); markDone(t, "quiz");
        const record = { timestamp: new Date().toISOString(), username: u.username, name: u.name, grade: u.grade, subject: subj.subject, subjectKey: subj.key,
          level: z.levelName, score: right, total: z.qs.length, percent: pct, durationSec: Math.round((Date.now() - z.start) / 1000), bestCombo: 0,
          wrong: z.qs.map((q, n) => z.answers[n] && z.answers[n].ok ? null : { id: "belajar-" + t.id, bab: t.title, q: q.q }).filter(Boolean) };
        const hist = store.get("history", []); hist.push(record); store.set("history", hist.slice(-500));
        if (ONLINE) {
          enqueue({ action: "saveResult", payload: { username: u.username, hash: u.hash, data: record } });
          enqueue({ action: "saveProgress", payload: { username: u.username, hash: u.hash, progress: u.progress } });
          sendLive("selesai", { correct: right, index: z.qs.length });
        }
        const st = starsOf(pct);
        view(`<div class="result">
          <div style="font-size:72px">${esc(t.icon)}</div>
          <div class="bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? "" : "off"}">⭐</span>`).join("")}</div>
          <div class="big">${pct >= 90 ? `Pintar sekali, ${esc(u.name)}!` : pct >= 70 ? "Hebat!" : "Ayo coba lagi, pasti bisa!"}</div>
          <div class="score"><b>${right}</b> dari ${z.qs.length} benar</div>
          <div class="spacer"></div>
          <button class="btn green press" id="again">🔁 Kuis lagi</button>
          <button class="btn blue press" id="cards">📖 Lihat kartu lagi</button>
          <button class="btn white press" id="list">📚 Pilih topik lain</button></div>`, "wide");
        if (st >= 2) confetti();
        on("#again", () => quiz(t)); on("#cards", () => cards(t)); on("#list", list);
      };
      ask();
    }
    const app = () => document.getElementById("app");

    return { open, stop: clean };
  };
})();
