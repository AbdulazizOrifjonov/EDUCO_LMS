Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
strRootDir = fso.GetParentFolderName(strScriptDir)

strDesktop = WshShell.SpecialFolders("Desktop")
Set oShortcut = WshShell.CreateShortcut(strDesktop & "\EDUCO_BOT_ISHGA_TUSHIRISH.lnk")
oShortcut.TargetPath = strRootDir & "\START_BOT.bat"
oShortcut.WorkingDirectory = strRootDir
oShortcut.Description = "EDUCO LMS Telegram Bot & SMS Launcher"
oShortcut.Save
