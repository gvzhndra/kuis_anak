"""Membuat soal Aksara Bali & Angka Bali (kelas 3, Bab 4) → data/_sumber/kelas3_aksara.json
Hanya aksara wianjana (hanacaraka) + kata sederhana TANPA pangangge + angka Bali.
Jalankan: python3 tools/gen_aksara.py  lalu  python3 tools/build_bank.py"""
import json, random, unicodedata

random.seed(7)  # hasil selalu sama
ORDER = ["ha", "na", "ca", "ra", "ka", "da", "ta", "sa", "wa", "la", "ma", "ga", "ba", "nga", "pa", "ja", "ya", "nya"]
AK = {r: unicodedata.lookup("BALINESE LETTER " + r.upper()) for r in ORDER}
DIG = [unicodedata.lookup("BALINESE DIGIT " + w) for w in ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"]]
# kata sederhana: setiap suku kata = aksara wianjana berbunyi "a" (tanpa pangangge)
WORDS = [("bapa", "ayah"), ("mata", "mata"), ("raja", "raja"), ("sapa", "siapa"), ("kaca", "kaca/cermin"), ("dawa", "panjang"),
         ("jaja", "kue"), ("lara", "sedih/sakit"), ("maca", "membaca"), ("basa", "bahasa"), ("nama", "nama"), ("naga", "naga"),
         ("kala", "waktu"), ("jala", "jaring"), ("wana", "hutan"), ("kaja", "arah gunung (utara)"), ("lada", "merica"), ("baya", "bahaya")]
CH = 4
BAB = "Bab 4 Aksara Bali & Angka Bali"

def syl(word):  # pecah kata jadi suku kata hanacaraka (nga/nya lebih dulu)
    out, i = [], 0
    while i < len(word):
        for s in sorted(ORDER, key=len, reverse=True):
            if word.startswith(s, i): out.append(s); i += len(s); break
        else: raise ValueError(word)
    return out
def wglyph(word): return "".join(AK[s] for s in syl(word))
def num(n): return "".join(DIG[int(c)] for c in str(n))
def others(pool, right, k=3):
    p = [x for x in pool if x != right]; random.shuffle(p); return p[:k]
def mc(level, q, right, wrong, explain, **kw):
    d = {"level": level, "ch": CH, "bab": BAB, "q": q, "choices": [right] + wrong, "answer": 0, "explain": explain}
    d.update(kw); return d
def isian(level, q, ans, explain, **kw):
    d = {"level": level, "ch": CH, "bab": BAB, "type": "input", "q": q, "answer": ans, "accept": [], "explain": explain}
    d.update(kw); return d

Q = []
# ⭐ Mudah: kenali satu aksara & satu angka
for r in ORDER:
    Q.append(mc(1, "Aksara ini dibaca …", r, others(ORDER, r), f"{AK[r]} dibaca \"{r}\".", img=AK[r], imgType="aksara", imgSpeak=""))
for n in range(10):
    Q.append(mc(1, "Angka Bali ini adalah …", str(n), others([str(x) for x in range(10)], str(n)), f"{DIG[n]} = {n}.", img=DIG[n], imgType="aksara", imgSpeak=""))
# ⭐⭐ Sedang: bacaan → aksara, urutan hanacaraka, angka 2 digit
for r in ORDER:
    Q.append(mc(2, f"Aksara Bali untuk bunyi \"{r}\" adalah …", AK[r], [AK[x] for x in others(ORDER, r)], f"\"{r}\" ditulis {AK[r]}.", choiceAksara=True, choiceLang="none"))
for i in range(0, len(ORDER) - 3, 2):
    seq, nxt = ORDER[i:i + 3], ORDER[i + 3]
    Q.append(mc(2, "Aksara berikutnya dalam urutan hanacaraka adalah …", AK[nxt], [AK[x] for x in others(ORDER, nxt)],
                f"Urutannya: {' '.join(ORDER[i:i + 4])} → {' '.join(AK[x] for x in ORDER[i:i + 4])}.", img=" ".join(AK[x] for x in seq) + " …", imgType="aksara", imgSpeak="", choiceAksara=True, choiceLang="none"))
for n in random.sample(range(11, 100), 8):
    wrong = list({n + 1, n - 1, int(str(n)[::-1]) if str(n)[::-1] != str(n) else n + 10, n + 10} - {n})[:3]
    Q.append(mc(2, "Angka Bali ini adalah …", str(n), [str(w) for w in wrong], f"{num(n)} = {n} ({DIG[n // 10]} = {n // 10}, {DIG[n % 10]} = {n % 10}).", img=num(n), imgType="aksara", imgSpeak=""))
for w, arti in random.sample(WORDS, 6):
    Q.append(isian(2, "Tulis cara membaca aksara ini (huruf latin):", w, f"{' + '.join(f'{AK[s]} {s}' for s in syl(w))} = {w} ({arti}).", img=wglyph(w), imgType="aksara", imgSpeak=""))
for n in random.sample(range(12, 100), 4):
    Q.append(isian(2, "Tulis angka Bali ini dengan angka biasa:", str(n), f"{num(n)} = {n}.", img=num(n), imgType="aksara", imgSpeak=""))
# ⭐⭐⭐ Sulit: membaca kata, menulis kata, angka 3 digit
for w, arti in WORDS:
    Q.append(mc(3, "Tulisan aksara Bali ini dibaca …", w, [x for x, _ in others(WORDS, (w, arti))],
                f"{' + '.join(f'{AK[s]} {s}' for s in syl(w))} = {w} ({arti}).", img=wglyph(w), imgType="aksara", imgSpeak=""))
for w, arti in random.sample(WORDS, 10):
    Q.append(mc(3, f"Tulisan aksara Bali untuk kata \"{w}\" ({arti}) adalah …", wglyph(w), [wglyph(x) for x, _ in others(WORDS, (w, arti))],
                f"{w} = {' + '.join(syl(w))} → {wglyph(w)}.", choiceAksara=True, choiceLang="none"))
for n in random.sample(range(100, 1000), 6):
    s = str(n); wrong = list({int(s[::-1]) if s[::-1] != s else n + 100, n + 10, n - 10 if n > 110 else n + 20, n + 1} - {n})[:3]
    Q.append(mc(3, f"Angka {n} ditulis dalam angka Bali …", num(n), [num(x) for x in wrong], f"{n} = {num(n)}.", choiceAksara=True, choiceLang="none"))
for w, arti in random.sample(WORDS, 6):
    Q.append(isian(3, "Tulis cara membaca kata aksara Bali ini:", w, f"{' + '.join(f'{AK[s]} {s}' for s in syl(w))} = {w} ({arti}).", img=wglyph(w), imgType="aksara", imgSpeak=""))
for n in random.sample(range(100, 1000), 3):
    Q.append(isian(3, "Tulis angka Bali ini dengan angka biasa:", str(n), f"{num(n)} = {n}.", img=num(n), imgType="aksara", imgSpeak=""))

for q in Q: assert len(set(q.get("choices", [1, 2, 3, 4]))) == 4, q
json.dump({"bahasa_bali": Q}, open("data/_sumber/kelas3_aksara.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(Q), "soal aksara dibuat;", sum(q["level"] == 1 for q in Q), "/", sum(q["level"] == 2 for q in Q), "/", sum(q["level"] == 3 for q in Q), "per level")
