Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(32,32)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(32,165,196))
$g.Dispose()
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()
$ms.Dispose()
$bmp.Dispose()

$icoPath = "D:\dev\better-nemo-main\src-tauri\icons\icon.ico"
$fs = [System.IO.File]::Open($icoPath, [System.IO.FileMode]::Create)
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([byte[]]@(0,0,1,0,1,0,32,32,0,0,0,0,0,0,0,0,0,0))
$len = $pngBytes.Length
$bw.Write([byte]($len -band 0xFF))
$bw.Write([byte](($len -shr 8) -band 0xFF))
$bw.Write([byte](22))
$bw.Write([byte](0))
$bw.Write($pngBytes)
$bw.Dispose()
$fs.Dispose()
Write-Output "ICO created successfully at $icoPath"
