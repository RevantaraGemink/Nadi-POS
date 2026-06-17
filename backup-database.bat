@echo off
title Backup Database Nadi POS
color 0A

:: Mendapatkan format waktu yang rapi (YYYYMMDD_HHMMSS) terlepas dari pengaturan bahasa/regional PC
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%%datetime:~4,2%%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%%datetime:~12,2%

:: Konfigurasi Path (Silakan diubah sesuai kebutuhan, misal ke folder Google Drive)
set SOURCE="d:\koding\Aplikasi Toko\Aplikasi-POS\agripos-be\sqlite.db"
set DEST_DIR="d:\koding\Aplikasi Toko\Aplikasi-POS\backups"

echo ====================================================
echo PROSES BACKUP DATABASE NADI POS
echo ====================================================
echo.

:: Membuat folder backup jika belum ada
if not exist %DEST_DIR% (
    echo Membuat folder backup di %DEST_DIR%...
    mkdir %DEST_DIR%
)

:: Lokasi dan nama file hasil backup
set DEST_FILE=%DEST_DIR%\sqlite_backup_%TIMESTAMP%.db

:: Menyalin file
echo Menyalin file database...
copy %SOURCE% %DEST_FILE% >nul

if %errorlevel% equ 0 (
    echo.
    echo [SUKSES] Backup berhasil dilakukan!
    echo Tersimpan di: %DEST_FILE%
) else (
    color 0C
    echo.
    echo [GAGAL] Terjadi kesalahan saat menyalin file.
    echo Pastikan file database ada di lokasi sumber.
)

echo.
echo ====================================================
echo TIPS: Untuk mengamankan data jika laptop rusak, 
echo Anda bisa klik kanan file ini -^> "Edit", lalu 
echo ubah nilai DEST_DIR ke folder Google Drive Anda.
echo ====================================================
echo.
pause
