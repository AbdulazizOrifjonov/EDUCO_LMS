@echo off
chcp 65001 >nul
title EDUCO LMS - Cloudflare Pages Deploy
echo ======================================================================
echo    EDUCO LMS - CLOUDFLARE PAGESGA YANGI VERSIYANI YUKLASH (DEPLOY)
echo ======================================================================
echo.
echo 📁 Joylashuv: %~dp0
echo 📦 Loyiha nomi: educo-lms
echo.

cd /d "%~dp0"

echo [1/2] Loyiha qayta yig'ilmoqda (npm run build)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build jarayonida xatolik yuz berdi!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Cloudflare Pages ga yuklanmoqda (wrangler pages deploy)...
echo (Agar birinchi marta bo'lsa, brauzerda Cloudflare akkauntingizga kirish so'ralishi mumkin)
echo.

call npx wrangler pages deploy dist --project-name educo-lms

echo.
echo ======================================================================
echo  Yuklash yakunlandi! 
echo  Sayt: https://educo-lms.pages.dev
echo ======================================================================
pause
