# UMKM Admin Finance

Sistem Manajemen Administrasi & Keuangan UMKM — aplikasi full-stack berbasis **Next.js 15** untuk membantu pemilik usaha mikro, kecil, dan menengah dalam mengelola produk, transaksi, keuangan, pelanggan, dan supplier.

## Fitur Utama

| Modul | Deskripsi |
|-------|-----------|
| 📊 **Dashboard** | Statistik penjualan hari ini, total pendapatan/pengeluaran, laba bersih, grafik tren, produk terlaris, alert stok rendah |
| 📦 **Produk** | Manajemen inventori lengkap: tambah/edit/hapus produk, kategori, harga beli/jual, stok minimum |
| 🛒 **Transaksi / POS** | Sistem kasir (Point of Sale): grid produk, keranjang belanja, diskon, pajak, cetak invoice PDF |
| 💰 **Keuangan** | Pencatatan pemasukan & pengeluaran manual per kategori |
| 👥 **Pelanggan** | Manajemen data pelanggan dengan riwayat transaksi |
| 🚚 **Supplier** | Manajemen data pemasok |
| 📈 **Laporan** | Filter periode, ekspor Excel & PDF |
| ⚙️ **Pengaturan** | Profil bisnis, logo, pajak |

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 15 (App Router, JavaScript) |
| Database | SQLite via Prisma |
| Auth | NextAuth.js v4 (Credentials + JWT) |
| UI | React + Vanilla CSS (dark mode, glassmorphism) |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Excel | SheetJS (xlsx) |
| PWA | next-pwa |
| Icons | lucide-react |
| Font | Inter (Google Fonts) |

## Cara Menjalankan

### Prasyarat
- Node.js 18+
- npm 9+

### Langkah-langkah

```bash
# 1. Install dependensi
npm install

# 2. Salin file konfigurasi environment
cp .env.local.example .env.local

# 3. Jalankan migrasi database
npx prisma migrate dev --name init

# 4. Isi data contoh (seed)
npx prisma db seed

# 5. Jalankan aplikasi
npm run dev
```

Buka `http://localhost:3000` di browser Anda.

## Akun Default (Seed)

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@umkm.test` | `password123` |
| Staff | `staff@umkm.test` | `password123` |

## Struktur Folder

```
/
├── prisma/
│   ├── schema.prisma       # Skema database (9 tabel)
│   ├── seed.js             # Data contoh realistis
│   └── migrations/         # File migrasi SQL
├── public/
│   ├── manifest.json       # PWA manifest
│   └── icons/              # Icon PWA 192x192 & 512x512
├── src/
│   ├── app/
│   │   ├── layout.js       # Root layout + PWA meta
│   │   ├── page.js         # Dashboard
│   │   ├── globals.css     # Design system lengkap
│   │   ├── AppShell.js     # Layout wrapper (sidebar + navbar)
│   │   ├── login/          # Halaman login
│   │   ├── register/       # Halaman registrasi
│   │   ├── products/       # Manajemen produk
│   │   ├── transactions/   # Transaksi & POS
│   │   ├── finances/       # Keuangan
│   │   ├── customers/      # Pelanggan
│   │   ├── suppliers/      # Supplier
│   │   ├── reports/        # Laporan & ekspor
│   │   ├── settings/       # Pengaturan bisnis
│   │   └── api/            # ~30 API Route handlers
│   ├── components/
│   │   ├── Sidebar.js      # Sidebar collapsible + bottom nav mobile
│   │   ├── Navbar.js       # Navbar dengan info user & logout
│   │   ├── StatCard.js     # Kartu statistik
│   │   ├── DataTable.js    # Tabel generik dengan search
│   │   ├── Modal.js        # Modal generik
│   │   ├── Chart.js        # Wrapper Recharts (area + bar chart)
│   │   └── InvoicePDF.js   # Generator invoice PDF
│   └── lib/
│       ├── prisma.js       # Prisma client singleton
│       ├── auth.js         # NextAuth authOptions + requireAuth helper
│       └── utils.js        # formatCurrency, formatDate, generateInvoiceNo
├── next.config.js          # Konfigurasi Next.js + next-pwa
└── .env.local.example      # Contoh variabel environment
```

## Scripts

```bash
npm run dev          # Mode pengembangan
npm run build        # Build produksi
npm run start        # Jalankan build produksi
npm run db:migrate   # Jalankan migrasi Prisma
npm run db:seed      # Isi data contoh
npm run db:reset     # Reset database
```

## PWA — Instalasi di HP

Aplikasi ini mendukung **Progressive Web App (PWA)** sehingga dapat diinstal di smartphone:

1. Buka aplikasi di **Google Chrome** di HP Anda
2. Ketuk ikon **tiga titik** (menu) di pojok kanan atas
3. Pilih **"Add to Home screen"** / **"Tambahkan ke layar utama"**
4. Konfirmasi instalasi

Setelah terinstal, aplikasi dapat dibuka seperti aplikasi native tanpa perlu membuka browser.

> **Catatan:** Untuk PWA yang optimal di produksi, ganti file placeholder di `public/icons/` dengan ikon PNG berkualitas tinggi berukuran 192×192 dan 512×512 piksel.

## Variabel Environment

```env
DATABASE_URL="file:./data.db"           # Path database SQLite (relatif ke prisma/schema.prisma)
NEXTAUTH_SECRET="random-secret-string"  # Secret untuk JWT (wajib diubah di produksi)
NEXTAUTH_URL="http://localhost:3000"    # URL aplikasi
```

## License

MIT — Lihat file [LICENSE](LICENSE) untuk detail lengkap.
