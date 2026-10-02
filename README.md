# Perisai Bahasa — Misi Kata Kerja

**Perisai Bahasa** ialah permainan pendidikan web bertema misi siber untuk membantu murid sekolah rendah dalam pendidikan inklusif mengenal, membaca, memahami dan menggunakan **kata kerja tindakan Bahasa Melayu**.

Permainan direka supaya mekanik permainan sentiasa menyokong pembelajaran:

**Lihat → Dengar → Baca → Faham → Pilih → Maklum balas → Ulang → Kuasai**

## Sasaran murid

- Murid sekolah rendah, khususnya Tahun 2–3.
- Murid pendidikan inklusif yang memerlukan pengukuhan kosa kata dan bacaan asas.
- Sesuai digunakan dengan mouse, skrin sentuh, papan kekunci atau kamera/pengesanan tangan.

## Kandungan pembelajaran

16 kata kerja digunakan:

`makan`, `minum`, `baca`, `tulis`, `duduk`, `berdiri`, `berjalan`, `berlari`, `melompat`, `menyapu`, `mencuci`, `membuka`, `menutup`, `tidur`, `mandi`, `bermain`.

Tiga jenis misi:

1. **Misi A — Kenal Gambar**: pilih kata kerja berdasarkan visual.
2. **Misi B — Kenal Perkataan**: cari kata kerja sasaran.
3. **Misi C — Lengkapkan Ayat**: pilih kata kerja yang melengkapkan ayat mudah.

## Ciri inklusif

- Arahan ringkas dan visual besar.
- Tiada sistem nyawa atau potongan mata.
- Sokongan audio menggunakan Web Speech API.
- Petunjuk berperingkat.
- Saiz tulisan boleh dibesarkan.
- Mod kontras tinggi.
- Pilihan kurangkan animasi.
- Mod sentuh/tetik sebagai fallback penuh jika kamera tidak tersedia.
- Sokongan papan kekunci: `1`, `2`, `3`, `H` dan `R`.

## Teknologi

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas API
- Web Audio API
- Web Speech API
- MediaPipe Hands melalui CDN
- MediaPipe Camera Utils melalui CDN

Tiada Node.js, npm, backend atau proses build diperlukan.

## Struktur fail

```text
perisai-bahasa/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Menjalankan secara tempatan

Untuk mod sentuh/tetik, anda boleh membuka `index.html` terus dalam pelayar moden.

Untuk menguji kamera dengan lebih konsisten, jalankan melalui `localhost` atau hos HTTPS. Contoh menggunakan Python jika tersedia:

```bash
python -m http.server 8000
```

Kemudian buka:

```text
http://localhost:8000
```

## Deploy ke GitHub Pages

1. Cipta repository baharu di GitHub, contohnya `perisai-bahasa`.
2. Muat naik `index.html`, `style.css`, `script.js` dan `README.md` ke root repository.
3. Buka **Settings** repository.
4. Pilih **Pages**.
5. Di bahagian **Build and deployment**, pilih **Deploy from a branch**.
6. Pilih branch `main`.
7. Pilih folder `/ (root)`.
8. Tekan **Save**.
9. Selepas penerbitan selesai, buka URL seperti:

```text
https://USERNAME.github.io/perisai-bahasa/
```

## Kamera dan privasi

Akses kamera memerlukan konteks selamat seperti HTTPS atau localhost serta kebenaran pengguna. Permainan ini memproses video kamera pada halaman/pelayar untuk pengesanan tangan dan tidak mempunyai kod backend untuk memuat naik atau menyimpan rakaman video.

Jika pengguna menolak kebenaran kamera atau MediaPipe gagal dimuatkan, permainan akan menawarkan **Mod Sentuh / Tetik**.

## Nota penting untuk penggunaan sekolah

- Uji dahulu pada peranti dan pelayar yang akan digunakan di kelas.
- Pastikan sambungan internet tersedia untuk memuatkan Google Fonts dan MediaPipe CDN.
- Jika akses CDN disekat oleh rangkaian sekolah, Mod Sentuh/Tetik masih berfungsi tetapi fail CDN yang gagal mungkin menghasilkan mesej fallback kamera.
- Gunakan mod paparan penuh untuk pengalaman terbaik.

## Keyboard shortcuts

- `1`, `2`, `3` — pilih jawapan.
- `H` — minta petunjuk.
- `R` — ulang arahan audio.
- `Esc` — tutup modal tetapan/senarai kata.

## Lesen dan penggunaan

Kod projek ini boleh diubah suai untuk kegunaan pengajaran, demonstrasi inovasi dan pembelajaran sekolah. Semak terma lesen pustaka pihak ketiga yang dimuatkan melalui CDN jika projek diterbitkan atau diedarkan secara lebih luas.
