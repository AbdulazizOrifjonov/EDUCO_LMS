' ========================================================
' EDUCO LMS: Botni orqa fonda yashirin ishga tushirish skripti
' Hech qanday qora CMD oynasi ko'rinmaydi, tinchgina ishlaydi.
' ========================================================
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Abdul\Documents\EDUCO_LMS"
WshShell.Run "node bot.js", 0, False
