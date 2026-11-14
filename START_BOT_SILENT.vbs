' ========================================================
' EDUCO LMS: Botni orqa fonda yashirin ishga tushirish skripti
' Hech qanday qora CMD oynasi ko'rinmaydi, tinchgina ishlaydi.
' ========================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.CurrentDirectory = strDir
WshShell.Run "node bot.js", 0, False
