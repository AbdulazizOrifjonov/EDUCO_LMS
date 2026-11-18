@echo off
chcp 65001 >nul
title EDUCO LMS - Telegram Botlar (@EcommerceDatabot & @EducoLms_Bot) va SMS Shlyuzi
color 0A
cd /d "C:\Users\Abdul\Documents\EDUCO_LMS"

:start
cls
echo ======================================================================
echo           EDUCO LMS TELEGRAM BOTLARI VA SMS SHLYUZI
echo ======================================================================
echo   [1] @EcommerceDatabot - Yangi toza token orqali tezkor SMS yuborish
echo   [2] @EducoLms_Bot - Davomat, Baholar, SMS va Ko'p Rolli LMS Boshqaruvi
echo   [3] Android Gateway - Xiaomi SIM-karta orqali ketma-ket SMS uzatish
echo ======================================================================
echo.
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" | Where-Object { $_.CommandLine -like '*bot.js*' -or $_.CommandLine -like '*telegram-bot.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Get-NetTCPConnection -LocalPort 59123,59124 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Start-Sleep -Milliseconds 800" >nul 2>&1
echo Server ishga tushmoqda... (Oynani yopmang, botlar ushbu oynada ishlaydi)
echo.
node bot.js
echo.
echo ======================================================================
echo [DIQQAT] Bot xizmati to'xtadi!
echo Qaytadan ishga tushirish uchun ixtiyoriy tugmani bosing...
echo ======================================================================
pause >nul
goto start
