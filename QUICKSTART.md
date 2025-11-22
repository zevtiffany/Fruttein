# 📋 PANDUAN QUICK START - FRUTTEIN JUICE SHOP

## 🚀 Mulai Cepat

### 1. Setup Folder
```
Buat folder ini jika belum ada:
Fruttein/
  └── assets/
      └── images/
```

### 2. Letakkan Gambar
Letakkan file gambar berikut di `assets/images/`:
- `mango.jpg` - Produk Nampisga
- `strawberry.jpg` - Produk Stropis
- `avocado.jpg` - Produk Alpisan
- `FrutteinGaleri1.jpg`, `FrutteinGaleri2.jpg`, `gallery3.jpg`, `gallery4.jpg` - Galeri
- `walogo.png` - Logo WhatsApp (opsional)
- `instalogo.png` - Logo Instagram (opsional)

### 3. Buka Website
Double-click file `index.html` atau buka di browser:
```
file:///D:/Belajar Coding/Fruttein/index.html
```

## 📱 Cara Pakai Sistem Member

### ✅ Tambah Member Baru
1. Isi nama member di input "Nama Member"
2. Isi nomor WhatsApp di input nomor (cth: 0852-xxxx-xxxx)
3. Klik tombol "➕ Tambah Member"
4. Member akan langsung tampil di tabel

### ➕ Catat Pembelian
1. Cari nama member di tabel
2. Klik tombol "➕ Beli" di baris member
3. Poin akan bertambah 1
4. Ulangi setiap ada pembelian

### 🎁 Klaim Reward
1. Saat member mencapai 10 poin, tombol "🎁 Klaim" akan aktif
2. Klik tombol tersebut
3. Member akan mendapat 1 hadiah dan poin reset ke 0 (atau sisa poin jika > 10)

### 📥 Export Data
1. Klik tombol "📥 Export CSV" 
2. File CSV akan otomatis ter-download
3. Bisa dibuka di Excel atau Google Sheets

### 🔄 Reset Data
1. Klik tombol "🔄 Reset Data" (merah)
2. Konfirmasi 2x
3. Semua data member akan dihapus

## 🎨 Customize Info

### Ubah Nomor WhatsApp
File: `index.html`
Cari: `6285204575882`
Ganti dengan nomor Anda

### Ubah Alamat Toko
File: `index.html`
Cari: `Jl. Kendal Sari No.43, Malang`
Ganti dengan alamat Anda

### Ubah Link Instagram
File: `index.html`
Cari: `fruttein`
Ganti dengan username Instagram Anda

### Ubah Jam Operasional
File: `index.html`
Cari: `Senin - Minggu: 08:00 - 19:00`
Ganti dengan jam Anda

### Tambah Produk Menu
Copy-paste blok berikut di section Menu:
```html
<div class="menu-item">
  <img src="assets/images/produk.jpg" alt="Nama Produk">
  <div class="menu-item-content">
    <h3>Nama Produk</h3>
    <p>Deskripsi produk di sini</p>
    <p class="price">Rp10.000</p>
    <a href="https://wa.me/6285204575882?text=Halo%20Fruttein!%20Saya%20ingin%20pesan%20Produk." class="order-link">🛒 Pesan via WhatsApp</a>
  </div>
</div>
```

## 💡 Tips & Trik

### Backup Data Member
1. Buka Browser DevTools (F12)
2. Buka Tab Console
3. Paste kode:
```javascript
const backup = localStorage.getItem('frutteinMembers');
console.log(backup);
// Copy hasil ke tempat aman (notepad)
```

### Restore Data Member
1. Buka Browser DevTools (F12)
2. Paste data yang sebelumnya di-backup:
```javascript
localStorage.setItem('frutteinMembers', 'PASTE_DATA_DI_SINI');
location.reload();
```

### Cek Total Poin Semua Member
```javascript
const members = JSON.parse(localStorage.getItem('frutteinMembers'));
const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
console.log('Total Poin Semua Member:', totalPoints);
```

### Cek Member yang Siap Reward
```javascript
const members = JSON.parse(localStorage.getItem('frutteinMembers'));
const readyForReward = members.filter(m => m.points >= 10);
console.log('Member Siap Reward:', readyForReward);
```

## 📊 Struktur File

```
Fruttein/
├── index.html              ← File utama (buka ini!)
├── README.md               ← Dokumentasi lengkap
├── QUICKSTART.md           ← Panduan ini
├── config.json             ← Konfigurasi app
├── TESTING_DATA.html       ← Data contoh untuk testing
│
├── css/
│   └── styles.css          ← Desain visual
│
├── js/
│   └── script.js           ← Logika member management
│
├── assets/
│   └── images/
│       ├── mango.jpg
│       ├── strawberry.jpg
│       ├── avocado.jpg
│       ├── FrutteinGaleri1.jpg
│       ├── FrutteinGaleri2.jpg
│       ├── gallery3.jpg
│       ├── gallery4.jpg
│       ├── walogo.png (opsional)
│       └── instalogo.png (opsional)
│
└── campaign.mp4            ← Video kampanye

```

## ❓ FAQ

**Q: Data member menghilang setelah refresh?**
A: Pastikan browser mengizinkan localStorage. Cek di Settings → Privacy.

**Q: Bagaimana kalau lupa nomor member?**
A: Nomor WhatsApp disimpan di tabel dan bisa di-klik untuk chat langsung.

**Q: Bisa pakai di HP?**
A: Ya! Buka file index.html di browser HP Anda, tapi lebih baik pakai di desktop untuk manajemen.

**Q: Bagaimana kalau member beli 15 kali?**
A: Akan dapat 10 poin (1 reward), sisa 5 poin untuk pembelian berikutnya.

**Q: Data bisa hilang?**
A: Data tersimpan di browser. Jangan clear cache/history. Gunakan fitur export untuk backup.

---

**Butuh bantuan? Hubungi: +62 852-0457-5882**

Dibuat dengan ❤️ untuk Fruttein
