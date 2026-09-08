$ErrorActionPreference = "Stop"

$Repository = "teotti/banana-cli"
$Version = if ($env:BANANA_VERSION) { $env:BANANA_VERSION } else { "latest" }
$InstallDir = if ($env:BANANA_INSTALL_DIR) {
  $env:BANANA_INSTALL_DIR
} else {
  Join-Path $env:LOCALAPPDATA "BananaSplit\bin"
}

if ($env:OS -ne "Windows_NT") {
  throw "install.ps1 supports Windows only"
}

$Architecture = switch ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture) {
  "Arm64" { "arm64" }
  "X64" { "x64" }
  default { throw "Unsupported architecture: $_" }
}

if ($Version -eq "latest") {
  $BaseUrl = "https://github.com/$Repository/releases/latest/download"
} elseif ($Version -match '^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$') {
  $BaseUrl = "https://github.com/$Repository/releases/download/$Version"
} else {
  throw "BANANA_VERSION must be latest or a stable tag such as v0.1.0"
}

if ($env:BANANA_RELEASE_BASE_URL) {
  $BaseUrl = $env:BANANA_RELEASE_BASE_URL.TrimEnd("/")
}

$Archive = "banana-windows-$Architecture.zip"
$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid())
New-Item -ItemType Directory -Path $TempDir | Out-Null

try {
  $ArchivePath = Join-Path $TempDir $Archive
  $ChecksumsPath = Join-Path $TempDir "SHA256SUMS"
  Invoke-WebRequest "$BaseUrl/$Archive" -OutFile $ArchivePath -UseBasicParsing
  Invoke-WebRequest "$BaseUrl/SHA256SUMS" -OutFile $ChecksumsPath -UseBasicParsing

  $ChecksumLine = Get-Content $ChecksumsPath | Where-Object {
    (($_ -split '\s+')[-1]).TrimStart("*") -eq $Archive
  } | Select-Object -First 1
  if (-not $ChecksumLine) {
    throw "No checksum found for $Archive"
  }

  $Expected = ($ChecksumLine -split '\s+')[0].ToUpperInvariant()
  $Actual = (Get-FileHash $ArchivePath -Algorithm SHA256).Hash
  if ($Expected -ne $Actual) {
    throw "Checksum verification failed for $Archive"
  }

  Expand-Archive $ArchivePath -DestinationPath $TempDir -Force
  New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
  Copy-Item (Join-Path $TempDir "banana.exe") (Join-Path $InstallDir "banana.exe") -Force

  if (-not $env:BANANA_SKIP_PATH_UPDATE) {
    $UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $PathEntries = $UserPath -split ";" | Where-Object { $_ }
    if ($InstallDir -notin $PathEntries) {
      $NewUserPath = (($PathEntries + $InstallDir) -join ";")
      [Environment]::SetEnvironmentVariable("Path", $NewUserPath, "User")
    }
    if ($InstallDir -notin ($env:Path -split ";")) {
      $env:Path = "$env:Path;$InstallDir"
    }
  }

  Write-Host "Installed banana to $(Join-Path $InstallDir 'banana.exe')"
  Write-Host "Open a new terminal to run banana."
} finally {
  Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue
}
