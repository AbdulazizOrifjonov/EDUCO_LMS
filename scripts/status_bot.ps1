$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*bot.js*' }
if ($procs) {
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "🟢 EDUCO LMS BOT HOZIR FAOL VA ISHLAYAPTI!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    foreach ($p in $procs) {
        Write-Host ("  Jarayon ID (PID): " + $p.ProcessId)
        Write-Host ("  Ishga tushgan vaqt: " + $p.CreationDate)
    }
    exit 0
} else {
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "🔴 EDUCO LMS BOT HOZIR ISHLAMAYAPTI" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "Ishga tushirish uchun ish stolidagi yorliqni bosing." -ForegroundColor Yellow
    exit 1
}
