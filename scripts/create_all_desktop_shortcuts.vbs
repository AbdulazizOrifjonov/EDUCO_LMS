Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
strRootDir = fso.GetParentFolderName(strScriptDir)
strDesktop = WshShell.SpecialFolders("Desktop")

' 1. Start Bot
Set s1 = WshShell.CreateShortcut(strDesktop & "\🚀 EDUCO BOT ISHGA TUSHIRISH.lnk")
s1.TargetPath = strRootDir & "\START_BOT.bat"
s1.WorkingDirectory = strRootDir
s1.Description = "EDUCO LMS Telegram Bot & SMS Launcher"
s1.Save

' 2. Status Bot
Set s2 = WshShell.CreateShortcut(strDesktop & "\📊 BOT HOLATINI TEKSHIRISH.lnk")
s2.TargetPath = strRootDir & "\STATUS_BOT.bat"
s2.WorkingDirectory = strRootDir
s2.Description = "EDUCO LMS Bot Holatini Tekshirish"
s2.Save

' 3. Stop Bot
Set s3 = WshShell.CreateShortcut(strDesktop & "\🛑 BOTNI TO'XTATISH.lnk")
s3.TargetPath = strRootDir & "\STOP_BOT.bat"
s3.WorkingDirectory = strRootDir
s3.Description = "EDUCO LMS Botni To'xtatish"
s3.Save
