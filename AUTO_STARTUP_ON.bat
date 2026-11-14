@echo off
title EDUCO LMS - Avtomatik Ishga Tushirishni Faollashtirish
color 0A
cls

echo ==========================================================
echo    EDUCO LMS - WINDOWS STARTUP AVTOMATIK ISHGA TUSHIRISH
echo ==========================================================
echo.
echo Startup yorlig'i yaratilmoqda...

cscript //nologo "%~dp0scripts\create_startup_shortcut.vbs"

echo.
echo ==========================================================
echo [TAYYOR] Endi har kuni o'quv markazda kompyuter yoqilganda
echo bot avtomatik orqa fonda ishlab turadi!
echo Hech qanday qora oyna ko'rinmaydi.
echo Bekor qilish uchun: AUTO_STARTUP_OFF.bat ni bosing.
echo ==========================================================
echo.
pause
