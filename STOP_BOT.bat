@echo off
title EDUCO LMS - Botni To'xtatish
color 0C
cls

echo ==========================================================
echo    EDUCO LMS - TELEGRAM BOT VA SMS XIZMATINI TO'XTATISH
echo ==========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop_bot.ps1"

echo.
echo ==========================================================
echo Amal bajarildi.
echo ==========================================================
echo.
pause
