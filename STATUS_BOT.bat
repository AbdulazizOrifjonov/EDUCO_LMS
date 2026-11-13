@echo off
title EDUCO LMS - Bot Holati
color 0B
cls

echo ==========================================================
echo    EDUCO LMS - TELEGRAM BOT VA SMS HOLATINI TEKSHIRISH
echo ==========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*bot.js*' }; if ($procs) { Write-Host '🟢 BOT ISHLAYAPTI!' -ForegroundColor Green; foreach ($p in $procs) { Write-Host ('   Jarayon ID (PID): ' + $p.ProcessId); Write-Host ('   Ishga tushgan vaqt: ' + $p.CreationDate) } } else { Write-Host '🔴 BOT HOZIR ISHLAMAYAPTI (To''xtatilgan)' -ForegroundColor Red; Write-Host 'Ishga tushirish uchun START_BOT.bat ni bosing.' -ForegroundColor Yellow }"

echo.
echo ==========================================================
pause
