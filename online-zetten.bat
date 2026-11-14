@echo off
cd /d "%~dp0"
rem Git is niet nodig op deze pc.
set EAS_NO_VCS=1
echo.
echo Zakelijk Nieuws online zetten, zodat Expo Go de app zonder pc kan openen.
echo Wordt er iets gevraagd? Druk op Enter of typ Y en dan Enter.
echo.
if not exist node_modules (
  echo Eerste keer: pakketten installeren. Dit duurt enkele minuten...
  call npm install
)

call npx --yes eas-cli@latest whoami >nul 2>nul
if errorlevel 1 (
  echo Meld je aan met je Expo-account, hetzelfde als in Expo Go.
  call npx --yes eas-cli@latest login
  if errorlevel 1 goto fout
)

echo.
echo Stap 1 van 3: project aanmaken bij Expo (gebeurt maar een keer)
call npx --yes eas-cli@latest init
if errorlevel 1 goto fout

echo.
echo Stap 2 van 3: updates instellen
call npx --yes eas-cli@latest update:configure --platform ios
if errorlevel 1 goto fout

echo.
echo Stap 3 van 3: app online zetten
call npx --yes eas-cli@latest update --branch main --platform ios --message "Nieuwe versie"
if errorlevel 1 goto fout

echo.
echo Klaar. Open Expo Go op je iPhone. Je app staat nu onder je projecten.
echo Je pc mag uit.
pause
exit /b 0

:fout
echo.
echo Er ging iets mis. Maak een foto of screenshot van dit venster en stuur die door.
pause
exit /b 1
