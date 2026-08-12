# Ringkasan Perbaikan

1. `script.js`
   - Menghapus definisi ganda `closeModalEditNilai()`.
   - Menyatukan perilaku penutupan modal agar modal disembunyikan, input dinamis dibersihkan, dan history browser tetap konsisten.

2. `index.html`
   - Menghapus pemuatan SheetJS kedua (`xlsx-latest`) di bagian akhir halaman.
   - Aplikasi tetap memakai versi yang sudah dipin di `<head>`: `xlsx@0.18.5`.
   - Ini mencegah global `XLSX` ditimpa oleh versi lain setelah `script.js` dimuat.

3. `sw.js`
   - Cache dinaikkan dari `madasa-pwa-v5` ke `madasa-pwa-v6`.
   - Instalasi service worker tidak lagi memakai `cache.addAll()` yang gagal total bila satu aset 404.
   - Setiap aset kini dicache secara independen dengan `Promise.allSettled()`.

## Catatan audit yang belum diubah otomatis

- Arsip ini tidak menyertakan folder `asset/`, `rapor/`, `informasi/`, `administrasi/`, `absensi/`, dan `cetak/`, padahal beberapa path tersebut dipakai oleh `index.html` dan `sw.js`. Jika memang tidak ada pada hosting, sebagian gambar/menu akan 404.
- Backend Apps Script menyimpan token login di sheet `SesiAktif`, tetapi belum memiliki expiry nyata dan logout browser belum menghapus token dari server.
- Beberapa endpoint baca ditempatkan sebelum validasi token. Ini mungkin disengaja untuk portal wali santri, tetapi berarti data tersebut dapat dipanggil tanpa sesi login.
- Password pada sheet `LOGIN` dibandingkan sebagai teks biasa. Untuk lingkungan produksi, sebaiknya dimigrasikan ke hash password.

Perubahan di atas sengaja dibatasi pada bug yang relatif aman dan tidak mengubah struktur sheet atau kontrak API.
