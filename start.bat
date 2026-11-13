@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is niet geinstalleerd. Installeer de LTS-versie via https://nodejs.org en probeer opnieuw.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Eerste keer: pakketten installeren. Dit duurt enkele minuten...
  call npm install
  if errorlevel 1 (
    echo Installeren is mislukt. Zie de melding hierboven.
    pause
    exit /b 1
  )
)
call npx expo start %*
pause
