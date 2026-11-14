@echo off
title EDUCO LMS - Bot Holati
color 0B
cls

echo ==========================================================
echo    EDUCO LMS - TELEGRAM BOT VA SMS HOLATINI TEKSHIRISH
echo ==========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\status_bot.ps1"
if %errorlevel% neq 0 (
    echo.
    echo ----------------------------------------------------------
    echo Botni hozir orqa fonda ishga tushirishni xohlaysizmi?
    echo [1] Ha, botni ishga tushirish
    echo [2] Yo'q, chiqish
    echo ----------------------------------------------------------
    set /p userchoice="Tanlovingizni kiriting [1 yoki 2]: "
    if "%userchoice%"=="1" (
        cscript //nologo "%~dp0START_BOT_SILENT.vbs"
        echo.
        echo [OK] Bot orqa fonda muvaffaqiyatli ishga tushirildi!
        echo Holatni qayta tekshirishingiz mumkin.
    )
)

echo.
echo ==========================================================
echo Tekshiruv yakunlandi.
echo ==========================================================
echo.
pause
