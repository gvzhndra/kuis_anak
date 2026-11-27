/* Pembuat soal Matematika otomatis — setiap main soalnya berbeda.
 * Setiap fungsi menerima level (1 = Mudah, 2 = Sedang, 3 = Sulit)
 * dan mengembalikan { q, img?, choices[4], answer, explain, bab } atau { type:"input", answer }.
 * Materi mengikuti Buku Siswa Matematika Kurikulum Merdeka (Kemendikdasmen).
 */
(function () {
  "use strict";
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmt = n => n.toLocaleString("id-ID");
  const ICONS = ["🍎", "⭐", "🐟", "🌸", "🎈", "🍌", "🐥", "🚗", "🍬", "⚽", "🦋", "🍊"];
  const NAMES = ["Adi", "Ayu", "Made", "Komang", "Putu", "Nyoman", "Wayan", "Kadek", "Sinta", "Budi", "Dewi", "Gede"];
  const THINGS = [["kelereng", "butir"], ["permen", "buah"], ["pensil", "batang"], ["buku", "buah"], ["kue", "potong"], ["bunga", "tangkai"], ["jeruk", "buah"], ["balon", "buah"]];

  // 4 pilihan angka unik di sekitar jawaban (tidak negatif)
  function numChoices(ans, spread, min) {
    spread = spread || 3; min = min == null ? 0 : min;
    const set = new Set([ans]);
    let guard = 0;
    while (set.size < 4 && guard++ < 100) {
      const d = R(1, spread) * (Math.random() < 0.5 ? -1 : 1);
      if (ans + d >= min) set.add(ans + d);
    }
    let k = 1; while (set.size < 4) set.add(ans + spread + k++);
    const arr = [...set].sort((a, b) => a - b);
    return { choices: arr.map(String), answer: arr.indexOf(ans) };
  }
  const shuffleArr = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const repeat = (ic, n) => Array.from({ length: n }, () => ic).join("");
  function rows(ic, n) { // bagi gambar per 5 agar mudah dihitung
    const out = []; for (let i = 0; i < n; i += 5) out.push(repeat(ic, Math.min(5, n - i)));
    return out.join("\n");
  }

  // ---------- terbilang (untuk kelas 3) ----------
  const SAT = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  function terbilang(n) {
    if (n < 12) return SAT[n] || "nol";
    if (n < 20) return SAT[n - 10] + " belas";
    if (n < 100) return (SAT[Math.floor(n / 10)] + " puluh " + SAT[n % 10]).trim();
    if (n < 200) return ("seratus " + terbilang(n - 100)).trim();
    if (n < 1000) return (SAT[Math.floor(n / 100)] + " ratus " + terbilang(n % 100)).trim();
    if (n === 1000) return "seribu";
    return String(n);
  }

  const G = {};

  // ======================= KELAS 1 =======================
  G.k1_count = function (lvl) {
    const ic = pick(ICONS);
    if (lvl === 1) {
      const n = R(2, 10);
      return Object.assign({ bab: "Membilang sampai 10", q: `Ada berapa ${ic}?`, img: rows(ic, n), imgSpeak: "", explain: `Ayo hitung satu per satu. Jumlahnya ${n}.` }, numChoices(n, 2, 1));
    }
    let ic2 = pick(ICONS); while (ic2 === ic) ic2 = pick(ICONS);
    const a = R(2, lvl === 2 ? 7 : 5), b = R(1, lvl === 2 ? 10 - a : 10 - a);
    const mixed = shuffleArr([...Array(a).fill(ic), ...Array(b).fill(ic2)]).join("");
    if (lvl === 2)
      return Object.assign({ bab: "Membilang sampai 10", q: `Hitung hanya ${ic}!\nAda berapa ${ic}?`, img: mixed, imgSpeak: "", explain: `Ada ${a} ${ic} dan ${b} ${ic2}. Yang ditanya hanya ${ic}, jadi ${a}.` }, numChoices(a, 2, 1));
    return Object.assign({ bab: "Membilang sampai 10", q: `Berapa jumlah ${ic} dan ${ic2} semuanya?`, img: mixed, imgSpeak: "", explain: `${a} ${ic} + ${b} ${ic2} = ${a + b}.` }, numChoices(a + b, 2, 1));
  };

  G.k1_add = function (lvl) {
    const a = R(1, lvl === 1 ? 5 : 8), b = R(1, 10 - a), ic = pick(ICONS);
    if (lvl === 1)
      return Object.assign({ bab: "Penjumlahan sampai 10", q: `${a} + ${b} = …`, img: repeat(ic, a) + "  ➕  " + repeat(ic, b), imgSpeak: "", explain: `${a} ditambah ${b} sama dengan ${a + b}.` }, numChoices(a + b, 2, 0));
    if (lvl === 2)
      return Object.assign({ bab: "Penjumlahan sampai 10", q: `${a} + ${b} = …`, explain: `Mulai dari ${a}, maju ${b} langkah: ${a + b}.` }, numChoices(a + b, 2, 0));
    return Object.assign({ bab: "Penjumlahan sampai 10", q: `${a} + … = ${a + b}\nBilangan yang tepat adalah …`, explain: `${a + b} − ${a} = ${b}, jadi ${a} + ${b} = ${a + b}.` }, numChoices(b, 2, 0));
  };

  G.k1_sub = function (lvl) {
    const a = R(3, 10), b = R(1, a - 1), ic = pick(ICONS);
    if (lvl === 1)
      return Object.assign({ bab: "Pengurangan sampai 10", q: `Ada ${a} ${ic}. Diambil ${b}.\nSisa berapa?`, img: repeat(ic, a - b) + repeat("❌", b), imgSpeak: "", explain: `${a} − ${b} = ${a - b}.` }, numChoices(a - b, 2, 0));
    if (lvl === 2)
      return Object.assign({ bab: "Pengurangan sampai 10", q: `${a} − ${b} = …`, explain: `Mulai dari ${a}, mundur ${b} langkah: ${a - b}.` }, numChoices(a - b, 2, 0));
    if (Math.random() < 0.5)
      return Object.assign({ bab: "Hubungan penjumlahan & pengurangan", q: `${a} − … = ${a - b}\nBilangan yang tepat adalah …`, explain: `${a} − ${b} = ${a - b}. Cek: ${a - b} + ${b} = ${a}.` }, numChoices(b, 2, 0));
    const s = a, x = b, y = a - b;
    return Object.assign({ bab: "Hubungan penjumlahan & pengurangan", q: `${x} + ${y} = ${s}\nMaka ${s} − ${x} = …`, explain: `Penjumlahan dan pengurangan berhubungan. Karena ${x} + ${y} = ${s}, maka ${s} − ${x} = ${y}.` }, numChoices(y, 2, 0));
  };

  G.k1_compare = function (lvl) {
    if (lvl === 1) {
      let ic2, ic = pick(ICONS); do { ic2 = pick(ICONS); } while (ic2 === ic);
      let a = R(1, 9), b = R(1, 9); if (a === b) b = a === 9 ? 8 : a + 1;
      const more = Math.random() < 0.5;
      const opts = [ic, ic2, "sama banyak", "tidak tahu"];
      const ans = (a > b) === more ? 0 : 1;
      return { bab: "Membandingkan banyak benda", q: `Mana yang lebih ${more ? "BANYAK" : "SEDIKIT"}?`, img: repeat(ic, a) + "\n" + repeat(ic2, b), imgSpeak: "",
        choices: opts, answer: ans, noShuffle: true, explain: `Ada ${a} ${ic} dan ${b} ${ic2}. Jadi yang lebih ${more ? "banyak" : "sedikit"} adalah ${opts[ans]}.` };
    }
    const set = new Set(); while (set.size < 4) set.add(R(1, 10));
    const arr = [...set];
    const big = Math.random() < 0.5;
    const ans = big ? Math.max(...arr) : Math.min(...arr);
    if (lvl === 3) {
      const t = R(3, 8), cand = big ? R(t + 1, 10) : R(0, t - 1);
      const opts = [cand]; while (opts.length < 4) { const v = big ? R(0, t) : R(t, 10); if (!opts.includes(v)) opts.push(v); }
      return { bab: "Membandingkan bilangan", q: `Bilangan yang ${big ? "LEBIH DARI" : "KURANG DARI"} ${t} adalah …`, choices: opts.map(String), answer: 0,
        explain: `${cand} ${big ? "lebih dari" : "kurang dari"} ${t}.` };
    }
    return { bab: "Membandingkan bilangan", q: big ? "Bilangan yang paling BESAR adalah …" : "Bilangan yang paling KECIL adalah …",
      choices: arr.map(String), answer: arr.indexOf(ans), explain: `${ans} adalah bilangan paling ${big ? "besar" : "kecil"}.` };
  };

  G.k1_sequence = function (lvl) {
    const step = lvl === 3 ? 2 : 1;
    const down = lvl >= 2 && Math.random() < 0.5;
    const len = 4;
    const start = down ? R(len * step, 10) : R(lvl === 3 ? 0 : 1, 10 - (len - 1) * step);
    const seq = Array.from({ length: len }, (_, i) => start + (down ? -i : i) * step);
    const hide = lvl === 1 ? 3 : R(1, 3);
    const ans = seq[hide];
    return Object.assign({ bab: "Menghitung maju dan mundur", q: "Bilangan yang tepat untuk mengisi titik-titik adalah …", img: seq.map((v, i) => (i === hide ? "…" : v)).join(", "),
      imgType: "text", explain: `Hitung ${down ? "mundur" : "maju"} ${step === 2 ? "loncat 2" : "satu-satu"}: ${seq.join(", ")}.` }, numChoices(ans, 2, 0));
  };

  G.k1_before_after = function () {
    const n = R(1, 9), after = Math.random() < 0.5;
    const ans = after ? n + 1 : n - 1;
    return Object.assign({ bab: "Menghitung maju dan mundur", q: `Bilangan ${after ? "SESUDAH" : "SEBELUM"} ${n} adalah …`, explain: `${n - 1}, ${n}, ${n + 1}. Jadi jawabannya ${ans}.` }, numChoices(ans, 2, 0));
  };

  G.k1_story = function (lvl) {
    const nm = pick(NAMES), [th, unit] = pick(THINGS);
    if (lvl === 3 && Math.random() < 0.5) {
      const a = R(5, 10), b = R(1, 3), c = R(1, a - b - 1 > 0 ? a - b - 1 : 1);
      const r = a - b - c;
      if (r >= 0) return Object.assign({ bab: "Soal cerita", q: `${nm} punya ${a} ${th}. Diberikan ke Adik ${b}, lalu ke Kakak ${c}.\nSisa ${th} ${nm} ada berapa?`,
        explain: `${a} − ${b} = ${a - b}, lalu ${a - b} − ${c} = ${r}.` }, numChoices(r, 2, 0));
    }
    if (Math.random() < 0.5) {
      const a = R(2, 7), b = R(1, 10 - a);
      return Object.assign({ bab: "Soal cerita penjumlahan", q: `${nm} punya ${a} ${th}. Ibu memberi ${b} ${th} lagi.\nSekarang ${th} ${nm} ada berapa?`,
        explain: `${a} + ${b} = ${a + b} ${unit} ${th}.` }, numChoices(a + b, 2, 0));
    }
    const a = R(4, 10), b = R(1, a - 1);
    return Object.assign({ bab: "Soal cerita pengurangan", q: `${nm} punya ${a} ${th}. Diberikan ke teman ${b} ${th}.\nSisa ${th} ${nm} ada berapa?`,
      explain: `${a} − ${b} = ${a - b} ${unit} ${th}.` }, numChoices(a - b, 2, 0));
  };

  G.k1_bond = function (lvl) {
    const whole = lvl === 1 ? R(4, 6) : lvl === 2 ? R(6, 9) : 10;
    const a = R(1, whole - 1), b = whole - a;
    if (Math.random() < 0.5)
      return Object.assign({ bab: "Pasangan bilangan", q: `${whole} = ${a} + …`, explain: `Pasangan bilangan ${whole}: ${a} dan ${b}, karena ${a} + ${b} = ${whole}.` }, numChoices(b, 2, 0));
    return Object.assign({ bab: "Pasangan bilangan", q: `Pasangan bilangan ${whole} dengan ${a} adalah …`, explain: `${a} + ${b} = ${whole}. Jadi pasangannya ${b}.` }, numChoices(b, 2, 0));
  };

  G.k1_shapes = function (lvl) {
    const items = [
      ["⚽ bola", "bola"], ["🥫 kaleng", "tabung"], ["🎲 dadu", "kubus"], ["📦 kardus", "balok"],
      ["🍕 sepotong pizza", "segitiga"], ["🖼️ bingkai foto", "persegi panjang"], ["🕐 jam dinding", "lingkaran"], ["🪟 ubin lantai", "persegi"]
    ];
    const [obj, shape] = pick(lvl === 1 ? items.slice(4) : items);
    const others = [...new Set(items.map(i => i[1]).filter(s => s !== shape))];
    const opts = [shape, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
    return { bab: "Mengenal bentuk", q: `Bentuk ${obj.replace(/^\S+\s/, "")} mirip dengan …`, img: obj.split(" ")[0], choices: opts, answer: opts.indexOf(shape),
      explain: `${obj.replace(/^\S+\s/, "")} berbentuk ${shape}.` };
  };

  // ======================= KELAS 3 =======================
  G.k3_place = function (lvl) {
    const n = R(lvl === 1 ? 100 : 101, 999);
    const ds = String(n).split("").map(Number);
    const pos = R(0, 2), digit = ds[pos];
    const names = ["ratusan", "puluhan", "satuan"];
    if (lvl === 1) {
      const opts = ["ratusan", "puluhan", "satuan", "ribuan"];
      // pastikan angka yang ditanya unik di bilangan itu
      if (ds.filter(d => d === digit).length > 1) return G.k3_place(lvl);
      return { bab: "Nilai tempat", q: `Angka ${digit} pada bilangan ${fmt(n)} menempati nilai tempat …`, choices: opts, answer: opts.indexOf(names[pos]),
        explain: `${fmt(n)} = ${ds[0]} ratusan, ${ds[1]} puluhan, ${ds[2]} satuan.` };
    }
    if (ds.filter(d => d === digit).length > 1 || digit === 0) return G.k3_place(lvl);
    const val = digit * [100, 10, 1][pos];
    const set = [...new Set([val, digit, digit * 10, digit * 100, digit * 1000])].slice(0, 4);
    if (lvl === 3) return { type: "input", bab: "Nilai tempat", q: `${fmt(n)} = ${ds[0] * 100} + … + ${ds[2]}\nIsilah titik-titik!`, answer: String(ds[1] * 10),
      explain: `${fmt(n)} = ${ds[0] * 100} + ${ds[1] * 10} + ${ds[2]} (bentuk panjang).` };
    return { bab: "Nilai tempat", q: `Nilai angka ${digit} pada bilangan ${fmt(n)} adalah …`, choices: set.map(fmt), answer: set.indexOf(val),
      explain: `Angka ${digit} ada di tempat ${names[pos]}, jadi nilainya ${fmt(val)}.` };
  };

  G.k3_read = function (lvl) {
    const n = lvl === 1 ? R(100, 999) : R(101, 999);
    if (lvl === 1 || Math.random() < 0.5) {
      const near = [...new Set([n, Number(String(n).split("").reverse().join("")) || n + 10, n + 10, n - 1, n + 100 <= 999 ? n + 100 : n - 100])].filter(x => x >= 100 && x <= 999 && String(x).length === 3);
      const opts = [n, ...near.filter(x => x !== n).slice(0, 3)];
      while (opts.length < 4) opts.push(n + opts.length * 2);
      const sh = opts.sort((a, b) => a - b);
      return { bab: "Lambang bilangan", q: `Lambang bilangan dari "${terbilang(n)}" adalah …`, choices: sh.map(fmt), answer: sh.indexOf(n),
        explain: `"${terbilang(n)}" ditulis ${fmt(n)}.` };
    }
    const wrongs = [n + 10, n - 10, n + 1, n - 1, n + 100, n - 100].filter(x => x >= 100 && x <= 999).slice(0, 3);
    const opts = [n, ...wrongs].slice(0, 4).sort(() => Math.random() - 0.5);
    return { bab: "Lambang bilangan", q: `Bilangan ${fmt(n)} dibaca …`, choices: opts.map(terbilang), answer: opts.indexOf(n),
      explain: `${fmt(n)} dibaca "${terbilang(n)}".` };
  };

  G.k3_compare = function (lvl) {
    if (lvl === 3) {
      const set = new Set(); const base = R(1, 8) * 100;
      while (set.size < 4) set.add(base + R(0, 99));
      const arr = [...set]; const asc = Math.random() < 0.5;
      const correct = arr.slice().sort((a, b) => asc ? a - b : b - a);
      const wrong1 = correct.slice().reverse(), wrong2 = [correct[1], correct[0], correct[2], correct[3]], wrong3 = [correct[0], correct[2], correct[1], correct[3]];
      const opts = [correct, wrong1, wrong2, wrong3].map(a => a.map(fmt).join(", ")).sort(() => Math.random() - 0.5);
      return { bab: "Mengurutkan bilangan", q: `Urutan bilangan dari yang ${asc ? "terkecil" : "terbesar"} adalah …`, img: arr.map(fmt).join(", "), imgType: "text",
        choices: opts, answer: opts.indexOf(correct.map(fmt).join(", ")), explain: `Bandingkan ratusan, lalu puluhan, lalu satuan: ${correct.map(fmt).join(", ")}.` };
    }
    let a = R(100, 999), b = lvl === 1 ? R(100, 999) : a + pick([-9, -1, 1, 9, 10, -10, 0]);
    if (b < 100 || b > 999) b = a + 1;
    const sign = a > b ? ">" : a < b ? "<" : "=";
    const opts = [">", "<", "=", "+"];
    return { bab: "Membandingkan bilangan", q: `${fmt(a)} … ${fmt(b)}\nTanda yang tepat adalah …`, choices: opts, answer: opts.indexOf(sign), noShuffle: true,
      explain: `${fmt(a)} ${sign === ">" ? "lebih dari" : sign === "<" ? "kurang dari" : "sama dengan"} ${fmt(b)}, jadi tandanya ${sign}.` };
  };

  G.k3_add = function (lvl) {
    let a, b;
    if (lvl === 1) { a = R(11, 60); b = R(10, 39); if ((a % 10) + (b % 10) > 9) b -= b % 10; }
    else if (lvl === 2) { a = R(15, 69); b = R(15, 99 - a); if ((a % 10) + (b % 10) < 10) a = a - (a % 10) + R(5, 9), b = b - (b % 10) + R(5, 9); if (a + b > 100) b = 100 - a; }
    else { a = R(120, 600); b = R(105, 399); }
    if (lvl >= 2 && Math.random() < 0.35) return { type: "input", bab: "Penjumlahan", q: `${fmt(a)} + ${fmt(b)} = …\nKetik jawabanmu!`, answer: String(a + b), explain: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.` };
    return Object.assign({ bab: "Penjumlahan", q: `${fmt(a)} + ${fmt(b)} = …`, explain: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}. Jumlahkan satuan dulu, lalu puluhan${lvl === 3 ? ", lalu ratusan" : ""}.` }, numChoicesF(a + b, lvl === 1 ? 10 : 10));
  };

  G.k3_sub = function (lvl) {
    let a, b;
    if (lvl === 1) { a = R(40, 99); b = R(10, a - 10); if ((a % 10) < (b % 10)) b -= b % 10; }
    else if (lvl === 2) { a = R(40, 100); b = R(12, a - 5); }
    else { a = R(400, 999); b = R(120, a - 50); }
    if (lvl >= 2 && Math.random() < 0.35) return { type: "input", bab: "Pengurangan", q: `${fmt(a)} − ${fmt(b)} = …\nKetik jawabanmu!`, answer: String(a - b), explain: `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}.` };
    return Object.assign({ bab: "Pengurangan", q: `${fmt(a)} − ${fmt(b)} = …`, explain: `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}. Cek: ${fmt(a - b)} + ${fmt(b)} = ${fmt(a)}.` }, numChoicesF(a - b, 10));
  };

  G.k3_mul = function (lvl) {
    const a = lvl === 1 ? pick([2, 5, 10]) : R(2, 10), b = R(lvl === 1 ? 1 : 3, 10);
    if (lvl === 3) {
      const nm = pick(NAMES), [th] = pick(THINGS);
      return Object.assign({ bab: "Perkalian", q: `${nm} punya ${a} kotak. Setiap kotak berisi ${b} ${th}.\nBerapa jumlah ${th} semuanya?`,
        explain: `${a} × ${b} = ${a * b}.\n(${Array(a).fill(b).join(" + ")} = ${a * b})` }, numChoicesF(a * b, a));
    }
    if (lvl === 1 && Math.random() < 0.5)
      return Object.assign({ bab: "Perkalian", q: `${Array(b).fill(a).join(" + ")} sama dengan …`, explain: `Penjumlahan berulang ${a} sebanyak ${b} kali = ${b} × ${a} = ${a * b}.` }, numChoicesF(a * b, a));
    if (lvl === 2 && Math.random() < 0.35) return { type: "input", bab: "Perkalian", q: `${a} × ${b} = …\nKetik jawabanmu!`, answer: String(a * b), explain: `${a} × ${b} = ${a * b}.` };
    return Object.assign({ bab: "Perkalian", q: `${a} × ${b} = …`, explain: `${a} × ${b} artinya ${b} dijumlahkan ${a} kali = ${a * b}.` }, numChoicesF(a * b, a));
  };

  G.k3_div = function (lvl) {
    const b = lvl === 1 ? pick([2, 5, 10]) : R(2, 10), ans = R(2, 10), a = b * ans;
    if (lvl === 3) {
      const nm = pick(NAMES), [th] = pick(THINGS);
      return Object.assign({ bab: "Pembagian", q: `${nm} punya ${a} ${th}. Dibagikan sama banyak kepada ${b} teman.\nSetiap teman mendapat berapa ${th}?`,
        explain: `${a} : ${b} = ${ans}, karena ${b} × ${ans} = ${a}.` }, numChoicesF(ans, 2));
    }
    if (lvl === 2 && Math.random() < 0.35) return { type: "input", bab: "Pembagian", q: `${a} : ${b} = …\nKetik jawabanmu!`, answer: String(ans), explain: `${a} : ${b} = ${ans}, karena ${b} × ${ans} = ${a}.` };
    return Object.assign({ bab: "Pembagian", q: `${a} : ${b} = …`, explain: `${a} : ${b} = ${ans}, karena ${b} × ${ans} = ${a}.` }, numChoicesF(ans, 2));
  };

  G.k3_sentence = function (lvl) {
    const nm = pick(NAMES), [th, unit] = pick(THINGS);
    const add = Math.random() < 0.5;
    const a = R(lvl === 3 ? 120 : 20, lvl === 3 ? 500 : 80); let b = R(lvl === 3 ? 50 : 10, lvl === 3 ? 300 : 40); if (b === a) b += 3;
    const big = Math.max(a, b), small = Math.min(a, b);
    const story = add ? `${nm} mempunyai ${fmt(a)} ${th}. Kemudian ${nm} membeli lagi ${fmt(b)} ${th}.`
      : `${nm} mempunyai ${fmt(big)} ${th}. Sebanyak ${fmt(small)} ${th} diberikan kepada adik.`;
    const right = add ? `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}` : `${fmt(big)} − ${fmt(small)} = ${fmt(big - small)}`;
    if (lvl === 1) {
      const wrongs = add ? [`${fmt(a)} − ${fmt(b)} = …`, `${fmt(a)} × ${fmt(b)} = …`, `${fmt(b)} − ${fmt(a)} = …`] : [`${fmt(big)} + ${fmt(small)} = …`, `${fmt(small)} − ${fmt(big)} = …`, `${fmt(big)} × ${fmt(small)} = …`];
      const r = add ? `${fmt(a)} + ${fmt(b)} = …` : `${fmt(big)} − ${fmt(small)} = …`;
      const opts = [r, ...wrongs].sort(() => Math.random() - 0.5);
      return { bab: "Kalimat matematika", q: "Kalimat matematika yang tepat untuk cerita di bawah adalah …", img: story, imgType: "passage", choices: opts, answer: opts.indexOf(r), explain: `${add ? "Membeli lagi berarti bertambah (+)." : "Diberikan berarti berkurang (−)."}\n${right}` };
    }
    const ans = add ? a + b : big - small;
    const qq = add ? `Berapa jumlah ${th} ${nm} sekarang?` : `Berapa sisa ${th} ${nm}?`;
    return Object.assign({ bab: "Kalimat matematika", q: qq, img: story, imgType: "passage", explain: `Kalimat matematikanya: ${right} ${unit}.` }, numChoicesF(ans, 10));
  };

  G.k3_measure = function (lvl) {
    const t = lvl === 1 ? pick(["m-cm", "kg-g"]) : pick(["m-cm", "kg-g", "cm-m", "g-kg", "km-m"]);
    const n = R(1, lvl === 3 ? 9 : 5);
    const map = { "m-cm": [n, "m", n * 100, "cm", "1 m = 100 cm"], "kg-g": [n, "kg", n * 1000, "gram", "1 kg = 1.000 gram"],
      "cm-m": [n * 100, "cm", n, "m", "100 cm = 1 m"], "g-kg": [n * 1000, "gram", n, "kg", "1.000 gram = 1 kg"], "km-m": [n, "km", n * 1000, "m", "1 km = 1.000 m"] };
    const [v1, u1, v2, u2, rule] = map[t];
    return Object.assign({ bab: "Pengukuran panjang & berat", q: `${fmt(v1)} ${u1} = … ${u2}`, explain: `${rule}, jadi ${fmt(v1)} ${u1} = ${fmt(v2)} ${u2}.` },
      numChoicesFixed(v2));
  };

  // pilihan untuk angka besar: kelipatan step agar terlihat masuk akal
  function numChoicesF(ans, step) {
    step = Math.max(1, step || 1);
    const set = new Set([ans]); let guard = 0;
    const deltas = [step, -step, 1, -1, 10, -10, 2 * step];
    while (set.size < 4 && guard++ < 50) { const v = ans + pick(deltas); if (v >= 0) set.add(v); }
    let k = 1; while (set.size < 4) set.add(ans + k++);
    const arr = [...set].sort((a, b) => a - b);
    return { choices: arr.map(fmt), answer: arr.indexOf(ans) };
  }
  function numChoicesFixed(ans) {
    const others = [...new Set([ans * 10, ans / 10, ans * 100, ans + (ans >= 100 ? 100 : 1), ans + 1000])]
      .filter(v => Number.isInteger(v) && v > 0 && v !== ans);
    const arr = [ans, ...others.slice(0, 3)].sort((a, b) => a - b);
    return { choices: arr.map(fmt), answer: arr.indexOf(ans) };
  }

  window.KUIS_GENERATORS = G;
})();
