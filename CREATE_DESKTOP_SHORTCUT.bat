@echo off
title EDUCO LMS - Ish Stolida Tugma Yaratish
color 0B
cls

echo ==========================================================
echo    EDUCO LMS - ISH STOLIDA (DESKTOP) TUGMA YARATISH
echo ==========================================================
echo.
echo Ish stolida "EDUCO BOT ISHGA TUSHIRISH" yorlig'i yaratilmoqda...

cscript //nologo "%~dp0scripts\create_desktop_shortcut.vbs"

echo.
echo ==========================================================
echo [TAYYOR] Ish stolingizda "EDUCO BOT ISHGA TUSHIRISH"
echo belgisi muvaffaqiyatli yaratildi!
echo ==========================================================
echo.
pause
