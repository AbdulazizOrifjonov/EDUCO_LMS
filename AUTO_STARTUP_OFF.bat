@echo off
title EDUCO LMS - Avtomatik Ishga Tushirishni Bekor Qilish
color 0E
cls

echo ==========================================================
echo    EDUCO LMS - WINDOWS STARTUP AVTOMATIK TIZIMNI O'CHIRISH
echo ==========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$startupPath = [Environment]::GetFolderPath('Startup') + '\EDUCO_LMS_BOT.lnk'; if (Test-Path $startupPath) { Remove-Item -Path $startupPath -Force; Write-Host '[MUVAFFAQIYATLI] Startup yorlig''i olib tashlandi!' -ForegroundColor Green } else { Write-Host '[INFO] Startup papkasida EDUCO yorlig''i yo''q edi.' -ForegroundColor Yellow }"

echo.
echo ==========================================================
echo Avtomatik ishga tushish o'chirildi.
echo ==========================================================
pause
