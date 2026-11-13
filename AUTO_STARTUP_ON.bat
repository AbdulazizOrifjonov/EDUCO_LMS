@echo off
title EDUCO LMS - Avtomatik Ishga Tushirishni Faollashtirish
color 0A
cls

echo ==========================================================
echo    EDUCO LMS - WINDOWS STARTUP AVTOMATIK ISHGA TUSHIRISH
echo ==========================================================
echo.
echo Windows yoqilishi bilan EDUCO bot avtomatik fonda ishga tushadi.
echo Hech qanday qora oyna ko'rinmaydi.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $startupPath = [Environment]::GetFolderPath('Startup'); $shortcut = $ws.CreateShortcut($startupPath + '\EDUCO_LMS_BOT.lnk'); $shortcut.TargetPath = 'C:\Users\Abdul\Documents\EDUCO_LMS\START_BOT_SILENT.vbs'; $shortcut.WorkingDirectory = 'C:\Users\Abdul\Documents\EDUCO_LMS'; $shortcut.Description = 'EDUCO LMS 24/7 Background Bot'; $shortcut.Save(); Write-Host ('[MUVAFFAQIYATLI] Startup yorlig''i yaratildi: ' + $startupPath + '\EDUCO_LMS_BOT.lnk') -ForegroundColor Green"

echo.
echo ==========================================================
echo [TAYYOR] Endi har kuni o'quv markazda kompyuter yoqilganda
echo bot avtomatik orqa fonda ishlab turadi!
echo O'chirish uchun istalgan payt AUTO_STARTUP_OFF.bat ni bosing.
echo ==========================================================
pause
