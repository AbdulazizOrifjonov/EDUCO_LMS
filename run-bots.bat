@echo off
chcp 65001 >nul
title EDUCO LMS - Ikkala Telegram Bot (@EcommerceDatabot va @EducoLms_Bot)
color 0A
cd /d "C:\Users\Abdul\Documents\EDUCO_LMS"

:start
cls
echo ======================================================================
echo           EDUCO LMS TELEGRAM BOTLARI VA SMS SHLYUZI
echo ======================================================================
echo   [1] @EcommerceDatabot - SMS Gateway va Idempotent Navbat Boti
echo   [2] @EducoLms_Bot     - Davomat, Baholar va LMS Xabarnoma Boti
echo ======================================================================
echo.
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 59123,59124 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
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
