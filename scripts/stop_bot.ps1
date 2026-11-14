$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*bot.js*' }
if ($procs) {
    foreach ($p in $procs) {
        Stop-Process -Id $p.ProcessId -Force
        Write-Host ("[OK] Bot jarayoni to'xtatildi (PID: " + $p.ProcessId + ")") -ForegroundColor Green
    }
} else {
    Write-Host "[INFO] Hozirda faol bot jarayoni topilmadi (allaqachon to'xtatilgan)." -ForegroundColor Yellow
}
