@echo off
title EDUCO LMS - Bot Holati
color 0B
cls

echo ==========================================================
echo    EDUCO LMS - TELEGRAM BOT VA SMS HOLATINI TEKSHIRISH
echo ==========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\status_bot.ps1"

echo.
echo ==========================================================
echo Tekshiruv yakunlandi.
echo ==========================================================
echo.
pause
