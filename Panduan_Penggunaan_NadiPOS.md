# Panduan Penggunaan Aplikasi Nadi POS Pertanian 🌾

Selamat datang di panduan penggunaan aplikasi **Nadi POS**. Aplikasi ini dirancang khusus untuk mempermudah proses transaksi kasir, pengelolaan stok (jika ada), serta pencatatan arus kas keuangan toko pertanian Anda.

---

## 📑 Daftar Isi
1. [Memulai Aplikasi](#1-memulai-aplikasi)
2. [Halaman Kasir (Point of Sale)](#2-halaman-kasir-point-of-sale)
3. [Mencetak Struk Pembelian](#3-mencetak-struk-pembelian)
4. [Mengelola Keuangan (Pemasukan & Pengeluaran)](#4-mengelola-keuangan-pemasukan--pengeluaran)
5. [Melihat & Mencetak Laporan](#5-melihat--mencetak-laporan)
6. [Menghapus Data (Barang & Pelanggan)](#6-menghapus-data-barang--pelanggan)
7. [Sistem Pencadangan Data (Backup)](#7-sistem-pencadangan-data-backup)

---

## 1. Memulai Aplikasi

Untuk saat ini, aplikasi dijalankan melalui sistem server lokal. 
- Di masa mendatang, aplikasi ini dapat diubah menjadi format **.exe** sehingga Anda cukup melakukan *double-click* ikon di layar desktop untuk membukanya.
- Aplikasi terdiri dari dua sistem utama:
  - **Sistem Kasir** (Tempat melayani pelanggan)
  - **Sistem Laporan** (Tempat merekap laba, arus kas, pemasukan, dan pengeluaran)

### Spesifikasi Minimum (System Requirements)
Aplikasi Nadi POS berjalan sangat ringan, namun untuk performa optimal saat transaksi padat, berikut spesifikasi yang disarankan:
- **Sistem Operasi**: Windows 10 atau Windows 11 (64-bit)
- **RAM**: Minimal 4 GB (Disarankan 8 GB)
- **Penyimpanan**: Sisa ruang kosong (Free Space) minimal 500 MB
- **Perangkat Tambahan**: *Barcode Scanner* (USB) & Printer Thermal (USB)

---

## 2. Halaman Kasir (Point of Sale)

Halaman ini digunakan setiap kali ada pelanggan yang melakukan transaksi pembelian.

**Cara Penggunaan:**
1. **Menggunakan Barcode Scanner:** Aplikasi ini sudah mendukung pemindai barcode (*barcode scanner*). Anda cukup menyorotkan alat scanner ke produk, dan produk akan otomatis masuk ke dalam keranjang belanja tanpa perlu menekan tombol apa pun.
2. **Pencarian Manual:** Anda juga bisa mengetikkan nama produk atau memilih dari daftar produk yang tersedia di layar.
3. **Mengatur Jumlah (Qty):** Setelah produk masuk keranjang, sesuaikan jumlah kuantitas produk yang dibeli pelanggan.
4. **Pembayaran:**
   - Cek **Total Belanja** di sisi layar.
   - Masukkan nominal uang yang dibayarkan oleh pelanggan pada kolom "Nominal Bayar".
   - Sistem akan otomatis menghitung uang **Kembalian**.
   - Klik tombol **Selesaikan Transaksi** (atau Bayar) untuk memproses pesanan.

---

## 3. Mencetak Struk Pembelian

Setelah transaksi di halaman Kasir selesai, akan muncul halaman pratinjau struk (`PratinjauStruk`).

**Cara Mencetak:**
1. Pastikan printer kasir/thermal sudah menyala dan terhubung ke komputer.
2. Pada halaman pratinjau, klik tombol **Cetak Struk**.
3. Sistem akan menyembunyikan elemen-elemen layar seperti menu *sidebar* agar hasil cetakan hanya menampilkan isi struk dengan rapi.
4. *Pop-up* pengaturan printer (Print Dialog) Windows akan muncul. Pastikan pengaturan kertas sesuai dengan ukuran printer kasir Anda, lalu klik **Print**.

---

## 4. Mengelola Keuangan (Pemasukan & Pengeluaran)

Nadi POS memisahkan keuangan dari hasil dagangan murni dan transaksi keuangan lainnya agar perhitungan laba tetap akurat.

### A. Input Pemasukan Tambahan
Gunakan fitur ini jika ada uang masuk ke toko di luar penjualan barang dagangan.
- **Kategori yang tersedia:** Pendapatan Lain, Suntikan Modal, Piutang Dibayar.
- *Catatan: Transaksi ini akan tercatat di arus kas (Debit), tetapi **TIDAK** memengaruhi hitungan murni Laba Bersih penjualan toko.*

### B. Input Pengeluaran
Gunakan fitur ini untuk mencatat uang keluar toko.
- **Kategori yang umum:** Biaya Operasional (listrik, gaji karyawan, kebersihan), Kulakan/Restok Barang (pembelian aset barang).
- *Catatan: Khusus untuk pembelian restok barang dalam jumlah besar, pengeluaran ini sudah dipisahkan secara otomatis sehingga **TIDAK** akan memotong laba bersih harian.*

---

## 5. Melihat & Mencetak Laporan

Halaman Laporan adalah pusat kontrol untuk memantau kesehatan finansial toko Anda.

**Fitur Laporan:**
- **Laba Bersih Harian:** Menampilkan hasil perhitungan otomatis yang sangat akurat dari: *(Total Pendapatan Penjualan) - (Total Harga Modal Tengkulak) = Laba Bersih Murni*.
- **Tabel Arus Kas:** Mencatat histori setiap transaksi uang masuk dan keluar secara mendetail lengkap dengan **Tanggal, Jam & Menit**.
- **Cetak/Ekspor PDF:** 
  - Anda bisa mengunduh laporan ke dalam bentuk dokumen PDF untuk dibaca oleh pemilik (Owner).
  - Tampilan PDF sudah didesain elegan dengan judul tabel berwarna putih dan teks data berwarna hitam pekat agar kontras dan mudah dibaca saat dicetak.

---

## 6. Menghapus Data (Barang & Pelanggan)

Sistem Nadi POS memisahkan data master (Barang dan Pelanggan) dengan data riwayat transaksi. Hal ini memungkinkan Anda untuk menghapus data barang maupun pelanggan tanpa takut merusak pembukuan laba bersih Anda.

**1. Menghapus Barang (Produk)**
Buka halaman Manajemen Stok. Di ujung kanan tabel barang, klik ikon tempat sampah berwarna merah.
- **Efek:** Barang akan "disembunyikan" dan tidak akan bisa dicari lagi saat ada transaksi baru di Kasir.
- **Aman:** Riwayat harga modal dan harga jual barang tersebut di masa lalu tetap tersimpan utuh di Laporan Laba Bersih harian Anda.

**2. Menghapus Pelanggan**
Buka halaman Daftar Pelanggan. Di ujung kanan tabel pelanggan, klik ikon tempat sampah berwarna merah.
- **Efek:** Profil pelanggan akan dihapus, sehingga tidak bisa lagi ditautkan untuk transaksi di masa mendatang.
- **Aman:** Riwayat belanja/uang masuk dari pelanggan tersebut akan otomatis dialihkan menjadi "Pelanggan Umum" sehingga saldo pemasukan tetap akurat.

---

## 7. Sistem Pencadangan Data (Backup)

Data transaksi Anda sangat berharga. Untuk mencegah hilangnya data akibat kerusakan komputer/laptop, selalu lakukan pencadangan data secara berkala.

**Mekanisme Cara Kerja Backup:**
Sistem Nadi POS menggunakan sebuah skrip otomatis (file `.bat`) yang ketika dijalankan akan mengambil file pusat penyimpanan data (`sqlite.db`) dari folder *backend*, lalu menggandakannya ke sebuah folder penyimpanan yang aman. 
Setiap kali Anda melakukan backup, file baru akan dibuat tanpa menimpa file lama dengan menyertakan keterangan Tahun-Bulan-Tanggal_Jam-Menit-Detik (contoh: `sqlite_backup_20260617_232300.db`). Hal ini memungkinkan Anda untuk mengembalikan data ke hari/jam tertentu jika terjadi kesalahan kasir.

**Langkah Melakukan Backup:**
1. Cari dan klik dua kali (Double-Click) file bernama `backup-database.bat` yang berada di folder utama aplikasi.
2. Jendela hitam akan muncul sebentar memproses data, lalu akan menampilkan pesan bahwa **Backup Berhasil**.
3. Secara otomatis, salinan database terbaru akan tersimpan di dalam folder bernama `backups` di komputer Anda.

**Integrasi Langsung ke Google Drive (Sangat Disarankan):**
Agar cadangan data aman sekalipun laptop/komputer Anda rusak atau dicuri, Anda bisa mengubah tujuan file *backup* agar langsung masuk ke Google Drive.
- Pastikan aplikasi **Google Drive for Desktop** sudah terpasang di komputer Anda.
- Klik kanan pada file `backup-database.bat` -> pilih **Edit** (atau buka dengan Notepad).
- Cari tulisan: `set DEST_DIR="d:\koding\Aplikasi Toko\Aplikasi-POS\backups"`
- Ubah alamat di dalam tanda kutip tersebut ke folder Google Drive Anda, misalnya: `set DEST_DIR="G:\My Drive\Backup NadiPOS"`
- Simpan file (Ctrl + S). 
Mulai sekarang, setiap kali Anda melakukan double-click, data akan langsung diamankan ke *cloud* Google.

---
*Panduan ini dapat terus diperbarui seiring dengan penambahan fitur di masa mendatang.*
