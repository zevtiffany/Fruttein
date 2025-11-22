# 🚀 INSTALASI & SETUP GUIDE - FRUTTEIN

## ✅ Status: READY TO USE

Website Fruttein sudah 100% selesai! Yang perlu Anda lakukan hanya 3 hal sederhana.

---

## 📦 STEP 1: Verifikasi File (2 menit)

Pastikan file ini sudah ada di folder `Fruttein/`:

```
✅ index.html             - File utama
✅ css/styles.css         - Desain
✅ js/script.js           - Logika
✅ config.json            - Konfigurasi
✅ campaign.mp4           - Video
✅ assets/images/         - Folder gambar
✅ Dokumentasi (README, QUICKSTART, dll)
```

Cek dengan membuka folder di File Explorer atau Terminal.

---

## 🖼️ STEP 2: Siapkan Gambar (5-10 menit)

Butuh **9 gambar** untuk website berfungsi optimal.

### Lokasi: `assets/images/`

**Produk (3 gambar):**
- [ ] `mango.jpg` - Produk Nampisga
- [ ] `strawberry.jpg` - Produk Stropis
- [ ] `avocado.jpg` - Produk Alpisan

**Galeri (4 gambar):**
- [ ] `FrutteinGaleri1.jpg` - Foto 1
- [ ] `FrutteinGaleri2.jpg` - Foto 2
- [ ] `gallery3.jpg` - Foto 3
- [ ] `gallery4.jpg` - Foto 4

**Optional (2 logo):**
- [ ] `walogo.png` - Logo WhatsApp (opsional)
- [ ] `instalogo.png` - Logo Instagram (opsional)

### Tips Gambar:
- Ukuran: 600x400px sampai 1000x800px (landscape)
- Format: JPG, PNG
- Size: Maksimal 500KB per file (biar cepat loading)
- Kualitas: Bagus dan menarik (biar produk terlihat lezat!)

---

## ✏️ STEP 3: Update Informasi (5 menit)

Edit file `index.html` dengan text editor (Notepad, VS Code, etc).

### 1️⃣ Update Nomor WhatsApp

**Cari:** `6285204575882`
**Ganti dengan:** Nomor WhatsApp Anda

Contoh:
```html
<!-- SEBELUM -->
<a href="https://wa.me/6285204575882?text=Halo%20Fruttein!">

<!-- SESUDAH -->
<a href="https://wa.me/628123456789?text=Halo%20Fruttein!">
```

**Di mana ada?**
- Floating buttons (bawah kanan)
- Menu order links
- Footer kontak
- Lokasi section

### 2️⃣ Update Alamat Toko

**Cari:** `Jl. Kendal Sari No.43, Malang`
**Ganti dengan:** Alamat toko Anda

Contoh:
```html
<!-- SEBELUM -->
<p>Jl. Kendal Sari No.43, Malang, Indonesia</p>

<!-- SESUDAH -->
<p>Jl. Merdeka No.99, Kota Anda, Indonesia</p>
```

### 3️⃣ Update Link Instagram

**Cari:** `fruttein`
**Ganti dengan:** Username Instagram Anda

Contoh:
```html
<!-- SEBELUM -->
<a href="https://www.instagram.com/fruttein">

<!-- SESUDAH -->
<a href="https://www.instagram.com/toko_anda">
```

### 4️⃣ Update Jam Operasional

**Cari:** `Senin - Minggu: 08:00 - 19:00`
**Ganti dengan:** Jam buka Anda

Contoh:
```html
<!-- SEBELUM -->
<p>Senin - Minggu: 08:00 - 19:00</p>

<!-- SESUDAH -->
<p>Senin - Jumat: 10:00 - 20:00, Sabtu-Minggu: 09:00 - 21:00</p>
```

### Tips Edit File:
1. **Jangan hapus tag HTML** (jangan hapus `<a>`, `<p>`, dll)
2. **Hanya ganti text/nomor di dalamnya**
3. **Save file** (Ctrl + S)
4. **Refresh browser** (F5) untuk lihat hasilnya

---

## 🎉 STEP 4: Buka & Gunakan (1 menit)

### Cara 1: Double-Click
1. Buka folder `Fruttein/`
2. Double-click file `index.html`
3. Browser akan terbuka otomatis ✅

### Cara 2: Drag & Drop
1. Buka browser (Chrome, Firefox, Edge, etc)
2. Drag file `index.html` ke browser
3. Website terbuka ✅

### Cara 3: Manual URL
1. Buka browser
2. Ketik di address bar: `file:///D:/Belajar Coding/Fruttein/index.html`
3. Tekan Enter ✅

---

## 🎯 Test Member System

### ✅ Test 1: Tambah Member
```
1. Isi "Nama Member": Budi Santoso
2. Isi "Nomor WhatsApp": 0852-1111-1111
3. Klik "Tambah Member"
4. Member muncul di tabel ✅
```

### ✅ Test 2: Catat Pembelian
```
1. Cari Budi Santoso di tabel
2. Klik tombol "➕ Beli"
3. Poinnya jadi 1/10 ✅
4. Ulangi 9x lagi, jadi 10 poin
```

### ✅ Test 3: Klaim Reward
```
1. Saat poin = 10, tombol "🎁 Klaim" aktif
2. Klik tombol "🎁 Klaim"
3. Notifikasi: reward diklaim ✅
4. Poin kembali 0
```

### ✅ Test 4: Export CSV
```
1. Klik "📥 Export CSV"
2. File CSV di-download ✅
3. Buka di Excel/Google Sheets
```

---

## 🔧 Troubleshooting

### ❌ Gambar tidak muncul
**Solusi:**
1. Cek nama file gambar (case sensitive)
2. Pastikan folder `assets/images/` ada
3. Refresh browser (Ctrl + F5)

### ❌ WhatsApp link tidak berfungsi
**Solusi:**
1. Pastikan nomor benar (harus ada kode 62)
2. Nomor gak boleh ada symbol aneh (hanya angka & dash)
3. Contoh yang benar: `6285204575882` atau `0852-0457-5882`

### ❌ Data member hilang setelah refresh
**Solusi:**
1. Browser mungkin clear localStorage
2. Jangan pakai Private/Incognito Mode
3. Check browser settings izinkan localStorage

### ❌ Website loading lambat
**Solusi:**
1. Kurangi ukuran file gambar
2. Gunakan format JPG (lebih kecil dari PNG)
3. Compress gambar online: tinypng.com

---

## 📱 Cek Responsive

Website harus terlihat bagus di semua perangkat!

### Desktop (1920x1080)
- Buka website di PC/Laptop ✅

### Tablet (768x1024)
- Resize browser ke 768px
- Atau buka di tablet ✅

### Mobile (375x667)
- Buka di HP ✅
- Atau resize browser ke 375px

**Seharusnya:** Semua konten jelas, buttons bisa diklik, gambar terlihat.

---

## 🎨 Customization Optional

Jika ingin ubah warna/design:

### Ubah Warna Brand

Edit `css/styles.css` - bagian paling atas:

```css
:root {
  --primary-color: #DD0303;      /* Warna merah, ganti di sini */
  --secondary-color: #FEF3E2;    /* Warna krem */
  --accent-color: #25D366;       /* Warna hijau */
}
```

Gunakan color picker: https://htmlcolorcodes.com/

---

## 📚 Dokumentasi Lengkap

Setelah setup, buka file ini untuk info lebih lanjut:

- **README.md** - Dokumentasi lengkap
- **QUICKSTART.md** - Panduan penggunaan
- **CHECKLIST.md** - Pre-launch checklist
- **docs.html** - Dokumentasi visual

---

## ✨ Selamat! 🎉

Anda sudah berhasil setup Fruttein Juice Shop!

### Apa yang bisa dilakukan sekarang:
✅ Buka website di browser
✅ Tambah member customer
✅ Catat setiap pembelian
✅ Kelola poin dan reward
✅ Export data member
✅ Share link website

### Tips untuk sukses:
1. **Update promo** di website setiap minggu
2. **Ajak customer** untuk daftar member
3. **Catat pembelian** setiap ada order
4. **Backup data** dengan export CSV
5. **Cek website** di mobile untuk memastikan baik

---

## 🆘 Butuh Bantuan?

- **Baca dokumentasi** di folder Fruttein
- **Check file** `docs.html` untuk index visual
- **Hubungi:** +62 852-0457-5882

---

**Setup Selesai! Website Siap Digunakan! 🚀**

Dibuat dengan ❤️ untuk Fruttein Juice Shop
22 November 2025
