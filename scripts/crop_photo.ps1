Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\Abdul\.gemini\antigravity\brain\8a072453-fd80-44cf-8bef-442e0e71d8b0\.user_uploaded\media_1793624146052_291e5621.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Output "Source: $($src.Width)x$($src.Height)"

$cropRect = New-Object System.Drawing.Rectangle(20, 590, 420, 295)
$cropBmp = $src.Clone($cropRect, $src.PixelFormat)

$outDir = "C:\Users\Abdul\Documents\EDUCO_LMS\public\uploads"
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}
$cropBmp.Save("$outDir\teacher_abdulazizbek.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$cropBmp.Dispose()
$src.Dispose()
Write-Output "Cropped photo saved to public/uploads/teacher_abdulazizbek.jpg"
