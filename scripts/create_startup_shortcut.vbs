Set WshShell = CreateObject("WScript.Shell")
strStartup = WshShell.SpecialFolders("Startup")
Set oShortcut = WshShell.CreateShortcut(strStartup & "\EDUCO_LMS_BOT.lnk")
oShortcut.TargetPath = "C:\Users\Abdul\Documents\EDUCO_LMS\START_BOT_SILENT.vbs"
oShortcut.WorkingDirectory = "C:\Users\Abdul\Documents\EDUCO_LMS"
oShortcut.Description = "EDUCO LMS 24/7 Background Bot"
oShortcut.Save
