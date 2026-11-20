# Personal Work OS — Modern Navy Edition

Personal Work OS adalah aplikasi produktivitas pribadi berbasis HTML, CSS, JavaScript, dan IndexedDB.

## Modul
- My Tasks (modul lama dipertahankan)
- Habit Tracker dan checklist salat lima waktu (modul lama dipertahankan)
- Notes & Knowledge (modul lama dipertahankan)
- Overview Dashboard
- Goals & Life Planning
- Project Management
- Finance (pencatatan manual pemasukan/pengeluaran)
- Learning & Skills
- Journal
- Business & Ideas
- Calendar (menampilkan deadline Tasks pada bulan berjalan)
- Reports & Analytics
- Settings, Backup JSON, dan Restore JSON
- PWA shell untuk instalasi dan cache offline

## Database dan kompatibilitas
Database tetap menggunakan `PersonalWorkOS_DB`, versi IndexedDB tetap `1`, dan nama object stores lama dipertahankan. Tidak ada instruksi untuk menghapus database lama. Data tersimpan di browser (IndexedDB), bukan di dalam file ZIP.

## Menjalankan di GitHub Codespaces
Dari terminal pada folder proyek:

```bash
python3 -m http.server 5500
```

Buka tab Ports, lalu buka port 5500. Gunakan Codespace dan port/origin yang sama dengan aplikasi sebelumnya agar browser dapat mengakses IndexedDB yang sama.

## Backup sebelum upgrade
1. Buka aplikasi versi lama pada alamat preview Codespaces yang biasa dipakai.
2. Buka DevTools Console bila perlu; untuk versi paket ini, setelah upgrade buka Overview → Settings & Backup → Download Backup JSON.
3. Simpan file JSON di komputer/lokasi aman.

Jika data browser lama penting, jangan menghapus site data, jangan mengganti origin preview, dan jangan menghapus Codespace sebelum backup dilakukan.

## Restore
Buka Settings & Backup, pilih file JSON, lalu tekan Restore JSON. Restore melakukan `put` berdasarkan ID pada object stores yang dikenal; record yang tidak ada di backup tidak dihapus. Setelah restore, aplikasi dimuat ulang.

## Catatan cakupan versi
Modul Goals, Projects, Finance, Learning, Journal, dan Business Ideas menyediakan CRUD dasar (buat, baca, edit, hapus). Finance adalah pencatatan manual, bukan koneksi bank. Calendar saat ini menampilkan deadline Tasks bulan berjalan. Reports menampilkan ringkasan data yang sudah dicatat. Google Sheets sync dan AI assistant belum diaktifkan.
