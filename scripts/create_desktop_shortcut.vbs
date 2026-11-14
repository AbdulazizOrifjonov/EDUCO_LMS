Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
Set oShortcut = WshShell.CreateShortcut(strDesktop & "\EDUCO_BOT_ISHGA_TUSHIRISH.lnk")
oShortcut.TargetPath = "C:\Users\Abdul\Documents\EDUCO_LMS\START_BOT.bat"
oShortcut.WorkingDirectory = "C:\Users\Abdul\Documents\EDUCO_LMS"
oShortcut.Description = "EDUCO LMS Telegram Bot & SMS Launcher"
oShortcut.Save
