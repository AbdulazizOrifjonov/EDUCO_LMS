' ==============================================================================
' EDUCO LMS: Botlarni orqa fonda yashirin (silent) ishga tushirish skripti
' Ekranda hech qanday qora CMD oynasi chiqmaydi, ikkala bot tinchgina ishlaydi.
' ==============================================================================
Set WshShell = CreateObject("WScript.Shell")
strDir = "C:\Users\Abdul\Documents\EDUCO_LMS"

WshShell.CurrentDirectory = strDir
WshShell.Run """C:\Program Files\nodejs\node.exe"" bot.js", 0, False
