' ==============================================================================
' EDUCO LMS: Botlarni orqa fonda yashirin (silent) ishga tushirish skripti
' Ekranda hech qanday qora CMD oynasi chiqmaydi, ikkala bot tinchgina ishlaydi.
' ==============================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.CurrentDirectory = strDir

' Node.exe yo'lini aniqlash (Standart dasturlar yoki PATH orqali)
strNode = "node"
If fso.FileExists("C:\Program Files\nodejs\node.exe") Then
    strNode = """C:\Program Files\nodejs\node.exe"""
ElseIf fso.FileExists("C:\Program Files (x86)\nodejs\node.exe") Then
    strNode = """C:\Program Files (x86)\nodejs\node.exe"""
End If

WshShell.Run "cmd /c " & strNode & " bot.js", 0, False
