Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strStartup = WshShell.SpecialFolders("Startup")
strShortcut = strStartup & "\EDUCO_LMS_BOT.lnk"
If fso.FileExists(strShortcut) Then
    fso.DeleteFile(strShortcut)
End If
