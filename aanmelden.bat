@echo off
cd /d "%~dp0"
echo Meld je hier aan met je Expo-account. Dat is hetzelfde account als in Expo Go op je iPhone.
echo Bij het wachtwoord zie je niets verschijnen terwijl je typt. Dat is normaal.
echo.
call npx expo login
echo.
echo Klaar. Sluit dit venster en dubbelklik daarna op start.bat.
pause
