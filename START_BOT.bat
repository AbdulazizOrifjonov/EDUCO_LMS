@echo off
title EDUCO LMS - Telegram Bot ^& SMS Xizmati
color 0A

:start
cls
echo ==========================================================
echo    EDUCO LMS - TELEGRAM BOT VA SMS GATEWAY XIZMATI
echo ==========================================================
echo  Loyha yo'li: %~dp0
echo  Bot va SMS xizmati ishga tushirilmoqda...
echo  To'xtatish uchun: Ushbu oynani yoping yoki Ctrl+C bosing
echo ==========================================================
echo.

cd /d "%~dp0"
node bot.js

echo.
echo ==========================================================
echo [DIQQAT] Bot xizmati to'xtadi!
echo Qaytadan ishga tushirish uchun ixtiyoriy tugmani bosing...
echo ==========================================================
pause >nul
goto start
