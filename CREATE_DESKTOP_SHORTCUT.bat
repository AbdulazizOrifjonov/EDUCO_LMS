@echo off
title EDUCO LMS - Ish Stolida Tugma Yaratish
color 0B
cls

echo ==========================================================
echo    EDUCO LMS - ISH STOLIDA (DESKTOP) TUGMA YARATISH
echo ==========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktopPath = [Environment]::GetFolderPath('Desktop'); $shortcut = $ws.CreateShortcut($desktopPath + '\🚀 EDUCO BOT ISHGA TUSHIRISH.lnk'); $shortcut.TargetPath = 'C:\Users\Abdul\Documents\EDUCO_LMS\START_BOT.bat'; $shortcut.WorkingDirectory = 'C:\Users\Abdul\Documents\EDUCO_LMS'; $shortcut.Description = 'EDUCO LMS Telegram Bot & SMS Launcher'; $shortcut.Save(); Write-Host ('[MUVAFFAQIYATLI] Ish stolida yorliq yaratildi: ' + $desktopPath + '\🚀 EDUCO BOT ISHGA TUSHIRISH.lnk') -ForegroundColor Green"

echo.
echo ==========================================================
echo [TAYYOR] Endi ish stolingizdagi "🚀 EDUCO BOT ISHGA TUSHIRISH"
echo belgisini ikki marta bossangiz, bot darhol ishga tushadi!
echo ==========================================================
pause
