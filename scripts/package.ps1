# Builds the Chrome Web Store upload zip from ./extension.
# Usage (from repo root):  powershell -ExecutionPolicy Bypass -File scripts/package.ps1
#
# Uses System.IO.Compression directly instead of Compress-Archive: Windows
# PowerShell 5's Compress-Archive writes backslashes in entry names
# (icons\icon-128.png), which the Chrome Web Store can reject.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "extension"
$manifest = Get-Content (Join-Path $src "manifest.json") -Raw | ConvertFrom-Json
$dist = Join-Path $root "dist"
$zipPath = Join-Path $dist "full-names-for-productive-$($manifest.version).zip"

New-Item -ItemType Directory -Force -Path $dist | Out-Null
if (Test-Path $zipPath) { Remove-Item $zipPath }

$srcFull = (Resolve-Path $src).Path.TrimEnd('\') + '\'
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem -Path $src -Recurse -File | ForEach-Object {
    # manifest.json must sit at the zip root; entry names use forward slashes.
    $entry = $_.FullName.Substring($srcFull.Length).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip, $_.FullName, $entry, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally {
  $zip.Dispose()
}
Write-Host "Created $zipPath"
