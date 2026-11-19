@echo off
title EDUCO LMS - Botni Yangilash (Update)
color 0E
cls

echo ==========================================================
echo    EDUCO LMS - BOT KODLARINI YANGILASH VA ISHGA TUSHIRISH
echo ==========================================================
echo.
echo Noutbukdan kiritilgan yangi o'zgarishlar GitHub dan tortib olinmoqda...
echo.

cd /d "%~dp0"

echo 1. Ishlab turgan eski bot to'xtatilmoqda...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*bot.js*' } | Stop-Process -Force -ErrorAction SilentlyContinue"

echo 2. Mahalliy o'zgarishlar xavfsiz saqlanmoqda...
git stash

echo 3. GitHub dan eng so'nggi kodlar olinmoqda...
git pull origin main

echo 4. Paketlar tekshirilmoqda...
call npm install --prefer-offline --no-audit

echo.
echo ==========================================================
echo [TAYYOR] Loyiha yangilandi! Bot qayta ishga tushirilmoqda...
echo ==========================================================
echo.

call START_BOT.bat
