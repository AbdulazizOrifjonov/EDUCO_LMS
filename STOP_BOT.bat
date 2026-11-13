@echo off
title EDUCO LMS - Botni To'xtatish
color 0C
cls

echo ==========================================================
echo    EDUCO LMS - TELEGRAM BOT VA SMS XIZMATINI TO'XTATISH
echo ==========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*bot.js*' }; if ($procs) { foreach ($p in $procs) { Stop-Process -Id $p.ProcessId -Force; Write-Host ('[OK] Bot jarayoni to''xtatildi (PID: ' + $p.ProcessId + ')') -ForegroundColor Green } } else { Write-Host '[INFO] Hozirda faol bot jarayoni topilmadi (allaqachon to''xtatilgan).' -ForegroundColor Yellow }"

echo.
echo ==========================================================
echo Bot xizmati to'xtatildi!
echo ==========================================================
pause
