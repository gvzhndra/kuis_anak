"""Gabungkan soal dari data/_sumber/kelasN_*.txt ke data/kelasN/*.json dan beri nomor bab (ch).
Jalankan: python3 tools/build_bank.py   (aman dijalankan berulang — soal sumber diganti, soal lama tetap)"""
import json, re, glob, os
CH3 = {
 "bahasa_indonesia": ["Bab 1 Kawan Seiring", "Bab 2 Yuk, Berpendapat!"],
 "ipas": ["Bab 1 Keajaiban Tubuhku", "Bab 2 Dahulu, Kini, dan Nanti", "Bab 3 Peduli dan Berbagi", "Bab 4 Siklus Hidup yang Menakjubkan"],
 "pancasila": ["Bab 1 Aku Anak Indonesia", "Bab 2 Aku Patuh Aturan"],
 "agama_hindu": ["Bab 1 Kitab Purana", "Bab 2 Tri Murti", "Bab 3 Tri Parartha"],
 "bahasa_bali": ["Bab 1 Pangastungkara, Kulawarga & Anggan Awak", "Bab 2 Wilangan & Wewaran", "Bab 3 Basa Alus (Sor Singgih)", "Bab 4 Aksara Bali & Angka Bali"],
 "bahasa_inggris": ["Chapter 1 My Self", "Chapter 2 My Family", "Chapter 3 My Family's Activities at Home"],
 "pjok": ["Bab 1 Gerakku Semakin Lincah", "Bab 2 Ayo, Bermain Strategi!"],
 "tik": ["Bab 1 Perangkat Komputer", "Bab 2 Keyboard, Mouse, File & Aplikasi", "Bab 3 Internet Sehat & Aman"],
}
TOPIC3 = {  # bab lama tanpa nomor → nomor bab
 "Tanda baca": 1, "Huruf kapital": 1, "Kata tanya": 2,
 "Pangastungkara": 1, "Kulawarga": 1, "Anggan awak": 1, "Wilangan": 2, "Wewaran": 2, "Sor singgih basa": 3, "Pangangge aksara": 3,
 "Perangkat": 1, "Keyboard": 2, "Desktop": 2, "Program": 2, "Internet": 3,
}
CH1 = {
 "bahasa_indonesia": ["Bab 1 Bunyi Apa? (huruf vokal & huruf awal)", "Bab 2 Ayo, Bermain! (suku kata)", "Bab 3 Awas Kuman!", "Bab 4 Aku Bisa! (membaca & kalimat)"],
 "pancasila": ["Bab 1 Aku dan Teman-Temanku", "Bab 2 Aku Patuh pada Aturan"],
 "agama_hindu": ["Bab 1 Cerita Ramayana", "Bab 2 Ciptaan Hyang Widhi Wasa"],
 "bahasa_bali": ["Bab 1 Pangastungkara & Kulawarga", "Bab 2 Wilangan (Angka)", "Bab 3 Anggan Awak, Warna & Wewalungan"],
 "bahasa_inggris": ["Unit 1 Greetings & Family", "Unit 2 Colors & Numbers", "Unit 3 Animals, Body & Things"],
 "pjok": ["Bab 1 Serunya Gerak di Tempat", "Bab 2 Asyiknya Gerak Berpindah Tempat", "Bab 3 Bergerak Menggunakan Benda"],
 "tik": ["Bab 1 Mengenal Komputer & Gawai", "Bab 2 Bagian-Bagian Komputer", "Bab 3 Mouse & Keyboard", "Bab 4 Aturan Memakai Komputer"],
}
TOPIC1 = {
 "Huruf vokal": 1, "Huruf awal": 1, "Suku kata": 2, "Kata sopan": 4, "Tanda baca": 4, "Menyusun kata": 4, "Membaca": 4, "Kalimat": 4, "Huruf kapital": 4,
 "Pangastungkara": 1, "Kulawarga": 1, "Angka": 2, "Anggan awak": 3, "Warna": 3, "Wewalungan": 3,
 "Greetings": 1, "Family": 1, "Colors": 2, "Numbers": 2, "Animals": 3, "Fruits": 3, "Parts of the body": 3, "Things in the classroom": 3,
 "Mengenal komputer": 1, "Mengenal gawai": 1, "Bagian komputer": 2, "Menggunakan mouse": 3, "Menggunakan keyboard": 3, "Aturan memakai komputer": 4, "Sikap memakai komputer": 4,
}
GRADES = {1: (CH1, TOPIC1), 3: (CH3, TOPIC3)}
# Materi yang BELUM diajarkan di sekolah → soal disimpan tetapi tidak dipakai ("skip": true).
# Hapus baris di sini jika materinya sudah diajarkan, lalu jalankan ulang skrip ini.
SKIP = {(3, "bahasa_bali"): r"pangangge|\bulu\b|\bsuku\b|taleng|pepet"}
TOPIC = TOPIC3

def ch_of(bab):
    m = re.search(r"(?:Bab|Chapter)\s*(\d)", bab or "")
    if m: return int(m.group(1))
    for k, v in sorted(TOPIC.items(), key=lambda kv: -len(kv[0])):
        if (bab or "").startswith(k): return v
    raise ValueError("bab tanpa nomor: " + bab)

for G, (CH, TOPIC) in GRADES.items():
    src = {}
    for f in sorted(glob.glob(f"data/_sumber/kelas{G}_*.txt")):
        cur = None
        for raw in open(f, encoding="utf-8"):
            line = raw.rstrip("\n")
            if not line.strip() or line.startswith("#"): continue
            if line.startswith("@"): cur = line[1:].strip(); src.setdefault(cur, []); continue
            p = [x.replace("\\n", "\n") for x in line.split("|")]
            t = p[0]
            if t == "M":
                _, lv, ch, q, a, w1, w2, w3, ex = p
                src[cur].append({"level": int(lv), "ch": int(ch), "q": q, "choices": [a, w1, w2, w3], "answer": 0, "explain": ex})
            elif t == "I":
                _, lv, ch, q, ans, ex = p
                alts = [x.strip() for x in ans.split(";") if x.strip()]
                src[cur].append({"level": int(lv), "ch": int(ch), "type": "input", "q": q, "answer": alts[0], "accept": alts[1:], "explain": ex})
            elif t == "U":
                _, ch, q, ans, kws = p
                src[cur].append({"level": 3, "ch": int(ch), "type": "uraian", "q": q, "answer": ans, "keywords": [k.strip() for k in kws.split(",") if k.strip()]})
            else: raise ValueError(line)

    for f in sorted(glob.glob(f"data/_sumber/kelas{G}_*.json")):
        for key, qs in json.load(open(f, encoding="utf-8")).items():
            src.setdefault(key, []).extend(qs)
    for key, chapters in CH.items():
        f = f"data/kelas{G}/{key}.json"
        d = json.load(open(f, encoding="utf-8"))
        old = [q for q in d["questions"] if not q.get("fromSource")]
        for q in old: q["ch"] = ch_of(q.get("bab", ""))
        new = []
        for q in src.get(key, []):
            q = dict(q); q["bab"] = chapters[q["ch"] - 1]; q["fromSource"] = True; new.append(q)
        pat = SKIP.get((G, key))
        for q in old + new:
            text = q["q"] + " " + " ".join(map(str, q.get("choices", []))) + " " + str(q.get("answer", ""))
            if pat and re.search(pat, text, re.I): q["skip"] = True
            else: q.pop("skip", None)
        d["chapters"] = chapters
        d["questions"] = old + new
        for i, q in enumerate(d["questions"]): q["id"] = f"k{G}-{key}-{i+1:03d}"
        json.dump(d, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


# ---- validasi
tot = 0
for f in sorted(glob.glob("data/kelas*/*.json")):
    d = json.load(open(f, encoding="utf-8")); qs = d["questions"]; tot += len(qs); bad = []
    nch = len(d.get("chapters", []))
    for q in qs:
        t = q.get("type", "mc")
        if t == "mc" and (len(q["choices"]) != 4 or len(set(q["choices"])) != 4 or not 0 <= q["answer"] < 4): bad.append(q["id"])
        if t in ("input", "uraian") and not str(q.get("answer", "")).strip(): bad.append(q["id"])
        if q.get("ch") and not 1 <= q["ch"] <= nch: bad.append(q["id"] + " ch")
    per = ""
    if any(q.get("ch") for q in qs):
        per = " | " + "  ".join(f"B{c}:" + "/".join(str(sum(1 for q in qs if q.get('ch') == c and q.get('type', 'mc') == 'mc' and q['level'] == l)) for l in (1, 2, 3))
                                + f"+i{sum(1 for q in qs if q.get('ch') == c and q.get('type') == 'input')}+u{sum(1 for q in qs if q.get('ch') == c and q.get('type') == 'uraian')}" for c in range(1, nch + 1))
    print(f"{f:36} {len(qs):4}{per} {bad or 'OK'}")
print("TOTAL", tot)
