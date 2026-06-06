$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'Lakshmi Boutique.lnk')
$Shortcut = $WshShell.CreateShortcut($DesktopPath)
$Shortcut.TargetPath = 'C:\Users\Guru Malleswari\.gemini\antigravity\scratch\lakshmi-boutique-app\start-app.bat'
$Shortcut.WorkingDirectory = 'C:\Users\Guru Malleswari\.gemini\antigravity\scratch\lakshmi-boutique-app'
$Shortcut.Description = 'Launch Lakshmi Boutique Tailoring & Fashion Manager'
$Shortcut.IconLocation = 'shell32.dll,220'
$Shortcut.Save()
Write-Output "Shortcut created successfully on the Desktop!"
