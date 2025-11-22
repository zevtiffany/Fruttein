# 🍓 Fruttein Juice Shop - Website Documentation

Website profesional untuk Fruttein Juice Shop dengan sistem member loyalty dan poin reward.

## 📁 Struktur Project

```
Fruttein/
├── index.html              # File utama website
├── header.html             # Komponen header (referensi)
├── footer.html             # Komponen footer (referensi)
├── campaign.mp4            # Video kampanye
│
├── css/
│   └── styles.css          # Stylesheet utama
│
├── js/
│   └── script.js           # JavaScript untuk member management
│
└── assets/
    └── images/
        ├── mango.jpg            # Gambar produk Nampisga
        ├── strawberry.jpg       # Gambar produk Stropis
        ├── avocado.jpg          # Gambar produk Alpisan
        ├── FrutteinGaleri1.jpg  # Galeri foto
        ├── FrutteinGaleri2.jpg  # Galeri foto
        ├── gallery3.jpg         # Galeri foto
        ├── gallery4.jpg         # Galeri foto
        ├── walogo.png           # Logo WhatsApp (opsional)
        └── instalogo.png        # Logo Instagram (opsional)
```

## 🚀 Fitur Utama

### 1. **Desain Profesional**
- Modern UI dengan gradient colors
- Responsive design (mobile, tablet, desktop)
- Smooth animations dan transitions
- Sticky navigation header

### 2. **Sistem Member & Poin Loyalitas**
- ✅ Daftar member dengan nama dan nomor WhatsApp
- ✅ Sistem poin otomatis: 1 poin per pembelian
- ✅ Hadiah reward setiap 10 poin
- ✅ Data tersimpan di browser (localStorage)
- ✅ Export data ke CSV

### 3. **Fitur Member Management**
- Tambah member baru
- Catat pembelian (tambah poin)
- Klaim reward saat mencapai 10 poin
- Hapus member dari database
- Reset semua data (untuk admin)
- Link WhatsApp terintegrasi

### 4. **Bagian Website**
- **Beranda**: Hero section yang menarik
- **Tentang Kami**: Cerita Fruttein dan nilai-nilai perusahaan
- **Menu**: 3 produk unggulan dengan harga dan deskripsi
- **Promo**: Banner promo spesial
- **Member**: Sistem loyalitas dan daftar member
- **Galeri**: Foto-foto produk dan aktivitas
- **Lokasi**: Maps dan informasi kontak
- **Footer**: Informasi lengkap dan link sosial media

## 💾 Cara Menggunakan

### Setup Awal
1. Buat folder `assets/images` di root project
2. Masukkan gambar-gambar produk dan galeri ke folder tersebut
3. Letakkan file `campaign.mp4` di root
4. Semua file HTML, CSS, JS sudah siap digunakan

### Mengakses Website
1. Buka `index.html` di browser
2. Website akan langsung berfungsi

### Mengelola Member
1. **Tambah Member**: Isi nama dan nomor WhatsApp, klik "Tambah Member"
2. **Catat Pembelian**: Klik tombol "➕ Beli" untuk menambah poin
3. **Klaim Reward**: Saat poin mencapai 10, tombol "🎁 Klaim" akan aktif
4. **Export Data**: Klik "📥 Export CSV" untuk download data member
5. **Reset Data**: Klik "🔄 Reset Data" untuk menghapus semua data

## 🎯 Sistem Poin

| Aksi | Poin |
|------|------|
| Setiap pembelian | +1 |
| Klaim reward | -10 (reward diperoleh) |

**Contoh:**
- Membeli 3 kali = 3 poin (⏳ 7 poin lagi)
- Membeli 10 kali total = 10 poin (✅ Siap klaim hadiah!)
- Klaim reward = Dapat 1 hadiah, poin kembali 0

## 🔧 Kustomisasi

### Mengubah Warna Brand
Edit file `css/styles.css`:
```css
:root {
  --primary-color: #DD0303;      /* Warna merah Fruttein */
  --secondary-color: #FEF3E2;    /* Warna krem */
  --accent-color: #25D366;       /* Warna hijau WhatsApp */
}
```

### Mengubah Informasi Kontak
Edit di `index.html`:
- Nomor WhatsApp: Ganti `6285204575882` dengan nomor Anda
- Alamat: Update di bagian Lokasi
- Link Instagram: Update di footer dan floating buttons

### Menambah Produk Menu
Tambahkan blok HTML baru di section Menu:
```html
<div class="menu-item">
  <img src="assets/images/product.jpg" alt="Nama Produk">
  <div class="menu-item-content">
    <h3>Nama Produk</h3>
    <p>Deskripsi produk</p>
    <p class="price">Rp10.000</p>
    <a href="https://wa.me/6285204575882?text=Pesan..." class="order-link">🛒 Pesan via WhatsApp</a>
  </div>
</div>
```

## 📱 Responsive Breakpoints

- **Desktop**: 1200px (optimal view)
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px (fully responsive)

## 💡 Tips

1. **Performa**: Optimasi ukuran gambar sebelum upload
2. **SEO**: Meta tags sudah ditambahkan di header
3. **Backup**: Selalu backup localStorage data member secara berkala
4. **WhatsApp**: Pastikan nomor WhatsApp aktif untuk customer service
5. **Update**: Tambah galeri dan promo secara berkala untuk engagement

## 🐛 Troubleshooting

### Data member tidak tersimpan
- Periksa apakah browser mengizinkan localStorage
- Coba refresh halaman atau clear cache

### Gambar tidak muncul
- Pastikan folder `assets/images/` ada
- Cek nama file gambar sesuai dengan path di HTML
- Gunakan path relatif yang benar

### WhatsApp link tidak berfungsi
- Pastikan nomor WhatsApp benar (dengan kode negara 62)
- Link sudah tested dan siap pakai

## 📞 Support

Hubungi tim Fruttein via WhatsApp: +62 852-0457-5882

---

**Dibuat dengan ❤️ untuk Fruttein Juice Shop**
