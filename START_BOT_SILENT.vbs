' ==============================================================================
' EDUCO LMS: Botlarni orqa fonda yashirin (silent) ishga tushirish skripti
' Ekranda hech qanday qora CMD oynasi chiqmaydi, ikkala bot tinchgina ishlaydi.
' ==============================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.CurrentDirectory = strDir
WshShell.Run "cmd /c node bot.js", 0, False
