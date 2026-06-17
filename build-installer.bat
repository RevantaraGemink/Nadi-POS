@echo off
color 0A
title Nadi POS - Desktop App Builder
echo ====================================================
echo MEMULAI PROSES BUILD APLIKASI DESKTOP NADI POS
echo ====================================================

echo.
echo [1/5] Melakukan Build Frontend (Tampilan Kasir)...
cd agripos-web
call npm run build
if %errorlevel% neq 0 (
    echo Gagal melakukan build frontend!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [2/5] Melakukan Build Backend (Server Utama)...
cd agripos-be
call npm run build
if %errorlevel% neq 0 (
    echo Gagal melakukan build backend!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [3/5] Menggabungkan Komponen ke Folder Desktop App...
if not exist "desktop-app\server" mkdir "desktop-app\server"
if not exist "desktop-app\server\public" mkdir "desktop-app\server\public"

:: Salin Frontend
xcopy /E /I /Y "agripos-web\dist\*" "desktop-app\server\public\"

:: Salin Backend
copy /Y "agripos-be\dist\index.js" "desktop-app\server\"

echo.
echo [4/5] Menginstal Dependensi Electron...
cd desktop-app
call npm install
if %errorlevel% neq 0 (
    echo Gagal menginstal dependensi desktop-app!
    pause
    exit /b %errorlevel%
)

echo.
echo [5/5] Membuat File Installer (.exe)...
call npm run build
if %errorlevel% neq 0 (
    echo Gagal membuat installer .exe!
    pause
    exit /b %errorlevel%
)

echo.
echo ====================================================
echo BUILD BERHASIL! 
echo Installer Anda bisa ditemukan di folder:
echo Aplikasi-POS\desktop-app\release
echo ====================================================
pause
