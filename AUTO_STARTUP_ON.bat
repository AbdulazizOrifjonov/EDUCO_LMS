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
echo Bot orqa fonda hozirning o'zidayoq ishga tushirilmoqda...
cscript //nologo "%~dp0START_BOT_SILENT.vbs"

echo.
echo ==========================================================
echo [TAYYOR] Bot orqa fonda muvaffaqiyatli ishga tushirildi!
echo Shuningdek, har safar kompyuter yoqilganda avtomatik yonadi.
echo Hech qanday qora oyna ko'rinmaydi.
echo Bekor qilish uchun: AUTO_STARTUP_OFF.bat ni bosing.
echo ==========================================================
echo.
pause
