$ErrorActionPreference = 'Stop'

$packageArgs = @{
  packageName   = $env:ChocolateyPackageName
  fileType      = 'EXE'
  url           = 'https://github.com/parcoil/sparkle/releases/download/2.12.0/sparkle-2.12.0-setup.exe'
  checksum      = '8c7a858e19242d01a95efdd880d8c7c30705c6112040e7ebf0cb4ddc6492ac9b'
  checksumType  = 'sha256'
  softwareName  = 'sparkle*'
  silentArgs    = '/S'
  validExitCodes = @(0, 1)
}

Install-ChocolateyPackage @packageArgs
