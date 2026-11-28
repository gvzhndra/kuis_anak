"""Soal Bahasa Inggris KELAS 1 dari buku "My Next Words Grade 1" (Kemendikbudristek 2021).
Semester 1 = Unit 1–7 (Bab 1–3), Semester 2 = Unit 8–13 (Bab 4–6).
Jalankan: python3 tools/gen_inggris_k1.py  lalu  python3 tools/build_bank.py"""
import json

Q = []
def M(lvl, ch, q, right, wrong, ex, img=None, **kw):
    d = {"level": lvl, "ch": ch, "q": q, "choices": [right] + wrong, "answer": 0, "explain": ex}
    if img: d.update(img=img, imgSpeak=kw.pop("imgSpeak", ""))
    d.update(kw); Q.append(d)
def I(lvl, ch, q, ans, ex, img=None, **kw):
    alts = ans.split(";")
    d = {"level": lvl, "ch": ch, "type": "input", "q": q, "answer": alts[0], "accept": alts[1:], "explain": ex}
    if img: d.update(img=img, imgSpeak=kw.pop("imgSpeak", ""))
    d.update(kw); Q.append(d)
def U(ch, q, ans, kws):
    Q.append({"level": 3, "ch": ch, "type": "uraian", "q": q, "answer": ans, "keywords": kws})
ID = {"choiceLang": "id"}  # pilihan berbahasa Indonesia

# ===================== SEMESTER 1 =====================
# Bab 1 · Unit 1–3: How are you? · Hi, I am Kimi · My name is Joshua
M(1, 1, "Salam di pagi hari adalah …", "Good morning", ["Good evening", "Goodbye", "Good afternoon"], "Good morning = selamat pagi.", "🌅")
M(1, 1, "Salam di siang/sore hari adalah …", "Good afternoon", ["Good morning", "Good evening", "Goodbye"], "Good afternoon = selamat siang/sore.", "☀️")
M(1, 1, "Salam di malam hari adalah …", "Good evening", ["Good morning", "Good afternoon", "Hello"], "Good evening = selamat malam.", "🌙")
M(1, 1, "Saat berpisah dengan teman, kita berkata …", "Goodbye", ["Good morning", "How are you?", "I am fine"], "Goodbye = selamat tinggal / sampai jumpa.", "👋")
M(2, 1, "Made bertanya, \"How are you?\" Jawaban yang tepat adalah …", "I am fine.", ["I am Made.", "Goodbye.", "Good evening."], "How are you? = Apa kabar? Jawab: I am fine / I am good / I am ok.")
M(2, 1, "\"How are you?\" artinya …", "Apa kabar?", ["Siapa namamu?", "Selamat pagi.", "Sampai jumpa."], "How are you? = Apa kabar?", **ID)
M(2, 1, "\"What is your name?\" artinya …", "Siapa namamu?", ["Apa kabar?", "Berapa umurmu?", "Di mana rumahmu?"], "What is your name? = Siapa namamu?", **ID)
M(2, 1, "Kucing di buku memperkenalkan diri: \"Hi, I am …\"", "Kimi", ["Made", "Cici", "Joshua"], "Kucing itu bernama Kimi. \"Hi, I am Kimi. Meow.\"", "🐱")
M(3, 1, "Jawaban untuk \"What is your name?\" adalah …", "My name is Joshua.", ["I am fine.", "Good morning.", "Your name is Joshua?"], "Jawab dengan: My name is … atau I am …")
M(3, 1, "Joshua menunjuk Cici dan berkata \"… are Cici.\"", "You", ["I", "My", "Me"], "\"I am Joshua, you are Cici.\" You = kamu.")
M(3, 1, "Bertemu guru di pagi hari, kita berkata …", "Good morning, Ma'am.", ["Goodbye, Ma'am.", "Good evening, Ma'am.", "I am Ma'am."], "Sapa guru dengan sopan: Good morning, Ma'am / Sir.")
M(3, 1, "Kalimat \"My name is Cici.\" artinya …", "Namaku Cici.", ["Kamu Cici.", "Apa kabar, Cici?", "Selamat pagi, Cici."], "My name is … = Namaku …", **ID)
I(1, 1, "Lengkapi: \"Good …\" (selamat pagi)", "morning", "Good morning = selamat pagi.")
I(2, 1, "Lengkapi: \"How are you?\" — \"I am …\" (baik)", "fine;good;ok;okay", "I am fine / I am good / I am ok.")
I(3, 1, "Lengkapi: \"My … is Made.\" (namaku Made)", "name", "My name is Made.")
U(1, "Perkenalkan dirimu dalam bahasa Inggris!", "Hello! My name is Komang. / Hi, I am Komang. (Gunakan namamu sendiri.)", ["my name is", "I am", "hello"])

# Bab 2 · Unit 4–5: My number is ten · I have four books
for n, w, emo in [(1, "one", "🍎"), (3, "three", "⭐⭐⭐"), (5, "five", "✋")]:
    M(1, 2, f"Angka {n} dalam bahasa Inggris adalah …", w, [x for x in ["one", "two", "three", "four", "five", "six"] if x != w][:3], f"{n} = {w}.")
M(1, 2, "Bahasa Inggris dari benda ini adalah …", "book", ["bag", "pencil", "chair"], "Buku = book.", "📘")
M(2, 2, "Bahasa Inggris dari benda ini adalah …", "pencil", ["eraser", "ruler", "board"], "Pensil = pencil.", "✏️")
M(2, 2, "Bahasa Inggris dari benda ini adalah …", "ruler", ["pencil", "clock", "chair"], "Penggaris = ruler.", "📏")
M(2, 2, "Bahasa Inggris dari benda ini adalah …", "clock", ["board", "bag", "book"], "Jam dinding = clock.", "🕐")
M(2, 2, "Angka 8 dalam bahasa Inggris adalah …", "eight", ["seven", "nine", "six"], "8 = eight.")
M(3, 2, "\"Ten little pencils.\" Ada berapa pensil?", "10", ["2", "7", "1"], "Ten = 10.", **ID)
M(3, 2, "Benda untuk menghapus tulisan pensil adalah …", "eraser", ["ruler", "clock", "board"], "Penghapus = eraser.")
M(3, 2, "\"pencil case\" artinya …", "kotak pensil", ["pensil warna", "tas sekolah", "papan tulis"], "Pencil case = kotak pensil.", **ID)
M(3, 2, "Hitung lalu pilih: ✏️✏️✏️✏️ = … pencils", "four", ["three", "five", "six"], "Ada 4 pensil = four pencils.", imgLang="en")
I(1, 2, "Angka 2 dalam bahasa Inggris adalah …", "two", "2 = two.")
I(2, 2, "Bahasa Inggris dari \"tas\" adalah …", "bag", "Tas = bag 🎒.")
I(3, 2, "Bahasa Inggris dari \"kursi\" adalah …", "chair", "Kursi = chair 🪑.")
U(2, "Sebutkan 3 benda di kelas dalam bahasa Inggris!", "Contoh: book, pencil, eraser, ruler, bag, chair, board, clock, pencil case.", ["book", "pencil", "eraser", "ruler", "bag", "chair", "board", "clock"])

# Bab 3 · Unit 6–7: My garden is colorful · It is a big circle
for emo, w in [("🟥", "red"), ("🟦", "blue"), ("🟨", "yellow")]:
    M(1, 3, "Warna ini dalam bahasa Inggris adalah …", w, [x for x in ["red", "blue", "yellow", "green", "black", "white"] if x != w][:3], f"{emo} = {w}.", emo)
M(1, 3, "Bentuk ini dalam bahasa Inggris adalah …", "circle", ["square", "triangle", "star"], "Lingkaran = circle.", "⚪")
M(2, 3, "Warna ini dalam bahasa Inggris adalah …", "purple", ["pink", "brown", "orange"], "Ungu = purple.", "🟪")
M(2, 3, "Warna ini dalam bahasa Inggris adalah …", "brown", ["black", "orange", "green"], "Cokelat = brown.", "🟫")
M(2, 3, "Bentuk ini dalam bahasa Inggris adalah …", "triangle", ["circle", "square", "rectangle"], "Segitiga = triangle.", "🔺")
M(2, 3, "Bentuk ini dalam bahasa Inggris adalah …", "square", ["circle", "triangle", "heart"], "Persegi = square.", "🟧")
M(3, 3, "Gajah itu besar. Besar dalam bahasa Inggris adalah …", "big", ["small", "red", "circle"], "Big = besar, small = kecil.", "🐘")
M(3, 3, "Semut itu kecil. Kecil dalam bahasa Inggris adalah …", "small", ["big", "square", "pink"], "Small = kecil.", "🐜")
M(3, 3, "\"The door is square.\" Bentuk pintu adalah …", "persegi", ["lingkaran", "segitiga", "bintang"], "Square = persegi.", **ID)
M(3, 3, "\"It is a big circle.\" artinya …", "Itu lingkaran besar.", ["Itu segitiga kecil.", "Itu persegi besar.", "Itu lingkaran kecil."], "Big = besar, circle = lingkaran.", **ID)
I(1, 3, "Bahasa Inggris dari warna hijau 🟩 adalah …", "green", "Hijau = green.")
I(2, 3, "Bahasa Inggris dari warna putih ⬜ adalah …", "white", "Putih = white.")
I(3, 3, "Bahasa Inggris dari \"segitiga\" adalah …", "triangle", "Segitiga = triangle 🔺.")
U(3, "Sebutkan 3 warna dan 2 bentuk dalam bahasa Inggris!", "Warna: red, blue, yellow, green, black, white, pink, orange, brown, purple. Bentuk: circle, square, triangle.", ["red", "blue", "yellow", "green", "circle", "square", "triangle"])

# ===================== SEMESTER 2 =====================
# Bab 4 · Unit 8–9: I have two pencils · At Cici's farm
M(1, 4, "Bahasa Inggris dari hewan ini adalah …", "duck", ["cat", "fish", "bird"], "Bebek = duck.", "🦆")
M(1, 4, "Bahasa Inggris dari hewan ini adalah …", "rabbit", ["duck", "chicken", "cat"], "Kelinci = rabbit.", "🐰")
M(1, 4, "Bahasa Inggris dari hewan ini adalah …", "chicken", ["bird", "duck", "fish"], "Ayam = chicken.", "🐔")
M(1, 4, "Bahasa Inggris dari hewan ini adalah …", "fish", ["cat", "rabbit", "bird"], "Ikan = fish.", "🐟")
M(2, 4, "\"I have a cat.\" artinya …", "Aku punya kucing.", ["Aku suka kucing.", "Itu kucing besar.", "Dia punya kucing."], "I have = aku punya.", **ID)
M(2, 4, "\"I have seven pencils.\" Ada berapa pensil?", "7", ["2", "5", "10"], "Seven = 7.", **ID)
M(2, 4, "Aku punya 3 tas. Dalam bahasa Inggris …", "I have three bags.", ["I have two bags.", "I have three books.", "I like three bags."], "Three = 3, bags = tas (lebih dari satu).")
M(2, 4, "Bahasa Inggris dari hewan ini adalah …", "bird", ["fish", "duck", "rabbit"], "Burung = bird.", "🐦")
M(3, 4, "Kalimat yang BENAR adalah …", "I have four erasers.", ["I has four erasers.", "I have four eraser is.", "Four I have erasers."], "Pola: I have + jumlah + benda.")
M(3, 4, "Cici punya ladang dengan bebek, ayam, dan kelinci. Ladang dalam bahasa Inggris adalah …", "farm", ["park", "class", "garden"], "At Cici's farm = di ladang Cici.")
M(3, 4, "\"I have ten pencils.\" Angka ten adalah …", "10", ["2", "8", "1"], "Ten = 10.", **ID)
M(3, 4, "Aku punya seekor kelinci. Dalam bahasa Inggris …", "I have a rabbit.", ["I have a duck.", "I am a rabbit.", "I like a rabbit."], "I have a … = aku punya seekor/sebuah …")
I(1, 4, "Bahasa Inggris dari \"kucing\" adalah …", "cat", "Kucing = cat 🐱.")
I(2, 4, "Lengkapi: \"I … two pencils.\" (punya)", "have", "I have = aku punya.")
I(3, 4, "Bahasa Inggris dari \"bebek\" adalah …", "duck", "Bebek = duck 🦆.")
U(4, "Tulis satu kalimat tentang hewan yang kamu punya atau inginkan, dengan \"I have …\"!", "Contoh: I have a cat. / I have a fish. / I have two rabbits.", ["I have", "cat", "fish", "rabbit", "bird", "duck", "chicken"])

# Bab 5 · Unit 10–11: She is Cici and he is Made · Aisyah's family
M(1, 5, "Made adalah anak laki-laki. Kita menyebutnya …", "He", ["She", "I", "You"], "Laki-laki → He. \"He is Made. He is a boy.\"")
M(1, 5, "Cici adalah anak perempuan. Kita menyebutnya …", "She", ["He", "I", "We"], "Perempuan → She. \"She is Cici. She is a girl.\"")
M(1, 5, "Bahasa Inggris dari \"ayah\" adalah …", "father", ["mother", "brother", "sister"], "Ayah = father.", "👨")
M(1, 5, "Bahasa Inggris dari \"ibu\" adalah …", "mother", ["father", "grandmother", "sister"], "Ibu = mother.", "👩")
M(2, 5, "\"She is a girl.\" artinya …", "Dia anak perempuan.", ["Dia anak laki-laki.", "Dia ibuku.", "Aku anak perempuan."], "Girl = anak perempuan, boy = anak laki-laki.", **ID)
M(2, 5, "Bahasa Inggris dari \"nenek\" adalah …", "grandmother", ["grandfather", "mother", "sister"], "Nenek = grandmother.", "👵")
M(2, 5, "Bahasa Inggris dari \"kakek\" adalah …", "grandfather", ["grandmother", "father", "brother"], "Kakek = grandfather.", "👴")
M(2, 5, "\"This is my family.\" artinya …", "Ini keluargaku.", ["Ini temanku.", "Ini rumahku.", "Ini sekolahku."], "Family = keluarga.", **ID)
M(3, 5, "Lengkapi: \"Joshua is a boy. … is my friend.\"", "He", ["She", "I", "They"], "Joshua laki-laki → He.")
M(3, 5, "Lengkapi: \"Aisyah is a girl. … is my friend.\"", "She", ["He", "I", "We"], "Aisyah perempuan → She.")
M(3, 5, "Saudara perempuan dalam bahasa Inggris adalah …", "sister", ["brother", "father", "boy"], "Sister = saudara perempuan, brother = saudara laki-laki.")
M(3, 5, "Pilih kalimat yang BENAR!", "He is a boy.", ["She is a boy.", "He is a girl.", "He a boy is."], "Laki-laki → He is a boy. Perempuan → She is a girl.")
I(1, 5, "Bahasa Inggris dari \"anak laki-laki\" adalah …", "boy", "Boy = anak laki-laki.")
I(2, 5, "Bahasa Inggris dari \"anak perempuan\" adalah …", "girl", "Girl = anak perempuan.")
I(3, 5, "Bahasa Inggris dari \"saudara laki-laki\" adalah …", "brother", "Brother = saudara laki-laki.")
U(5, "Sebutkan anggota keluargamu dalam bahasa Inggris (minimal 3)!", "father (ayah), mother (ibu), brother, sister, grandfather (kakek), grandmother (nenek).", ["father", "mother", "brother", "sister", "grandfather", "grandmother"])

# Bab 6 · Unit 12–13: She has some fruits · I like fruits
M(1, 6, "Bahasa Inggris dari buah ini adalah …", "apple", ["orange", "mango", "banana"], "Apel = apple.", "🍎")
M(1, 6, "Bahasa Inggris dari buah ini adalah …", "banana", ["apple", "watermelon", "mango"], "Pisang = banana.", "🍌")
M(1, 6, "Bahasa Inggris dari buah ini adalah …", "watermelon", ["strawberry", "orange", "apple"], "Semangka = watermelon.", "🍉")
M(1, 6, "Bahasa Inggris dari buah ini adalah …", "strawberry", ["apple", "mango", "watermelon"], "Stroberi = strawberry.", "🍓")
M(2, 6, "Bahasa Inggris dari buah ini adalah …", "mango", ["orange", "banana", "apple"], "Mangga = mango.", "🥭")
M(2, 6, "\"She has five apples.\" Ada berapa apel?", "5", ["3", "7", "10"], "Five = 5.", **ID)
M(2, 6, "\"I like strawberry.\" artinya …", "Aku suka stroberi.", ["Aku punya stroberi.", "Dia suka stroberi.", "Aku makan apel."], "I like = aku suka.", **ID)
M(2, 6, "\"He likes mango.\" artinya …", "Dia (laki-laki) suka mangga.", ["Dia (perempuan) suka mangga.", "Aku suka mangga.", "Dia punya mangga."], "He likes = dia (laki-laki) suka.", **ID)
M(3, 6, "Lengkapi: \"She … three mangoes.\" (punya)", "has", ["have", "is", "like"], "I/You have, He/She has.")
M(3, 6, "Lengkapi: \"I … ten strawberries.\" (punya)", "have", ["has", "likes", "is"], "I have, she/he has.")
M(3, 6, "Lengkapi: \"She … orange.\" (suka)", "likes", ["like", "have", "has"], "I/You like, He/She likes.")
M(3, 6, "Pilih kalimat yang BENAR!", "He has seven apples.", ["He have seven apples.", "He is seven apples.", "He like seven apples."], "He/She has … , He/She likes …")
I(1, 6, "Bahasa Inggris dari \"jeruk\" 🍊 adalah …", "orange", "Jeruk = orange.")
I(2, 6, "Lengkapi: \"I … apple.\" (suka)", "like", "I like apple. = Aku suka apel.")
I(3, 6, "Lengkapi: \"Sister … five oranges.\" (punya)", "has", "Sister = dia (perempuan) → has.")
U(6, "Buah apa yang kamu suka? Jawab dalam bahasa Inggris dengan \"I like …\"!", "Contoh: I like mango. / I like apple and banana.", ["I like", "apple", "banana", "mango", "orange", "strawberry", "watermelon"])

json.dump({"bahasa_inggris": Q}, open("data/_sumber/kelas1_inggris.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(Q), "soal Bahasa Inggris kelas 1")
