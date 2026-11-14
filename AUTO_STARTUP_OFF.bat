@echo off
title EDUCO LMS - Avtomatik Ishga Tushirishni Bekor Qilish
color 0E
cls

echo ==========================================================
echo    EDUCO LMS - WINDOWS STARTUP TIZIMINI O'CHIRISH
echo ==========================================================
echo.
echo Startup yorlig'i olib tashlanmoqda...

cscript //nologo "%~dp0scripts\remove_startup_shortcut.vbs"

echo.
echo ==========================================================
echo [TAYYOR] Avtomatik ishga tushish o'chirildi.
echo ==========================================================
echo.
pause
