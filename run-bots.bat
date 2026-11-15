@echo off
title EDUCO LMS - Ikkala Telegram Bot (@EcommerceDatabot va @EducoLms_Bot)
color 0A
cd /d "C:\Users\Abdul\Documents\EDUCO_LMS"

echo ======================================================================
echo           EDUCO LMS TELEGRAM BOTLARI VA SMS SHLYUZI
echo ======================================================================
echo   [1] @EcommerceDatabot - SMS Gateway va Idempotent Navbat Boti
echo   [2] @EducoLms_Bot     - Davomat, Baholar va LMS Xabarnoma Boti
echo ======================================================================
echo.
echo Server ishga tushmoqda... (Oynani yopmang, botlar fonda ishlaydi)
echo.

node bot.js

echo.
echo ⚠️ Botlar to'xtadi. Qayta ishga tushirish uchun ixtiyoriy tugmani bosing...
pause
