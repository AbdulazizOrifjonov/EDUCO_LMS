Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
strRootDir = fso.GetParentFolderName(strScriptDir)

strStartup = WshShell.SpecialFolders("Startup")
Set oShortcut = WshShell.CreateShortcut(strStartup & "\EDUCO_LMS_BOT.lnk")
oShortcut.TargetPath = strRootDir & "\START_BOT_SILENT.vbs"
oShortcut.WorkingDirectory = strRootDir
oShortcut.Description = "EDUCO LMS 24/7 Background Bot"
oShortcut.Save
