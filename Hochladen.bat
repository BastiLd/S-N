@echo off
chcp 65001 >nul
title S-N - Bilder und Videos hochladen
cd /d "%~dp0"

echo.
echo  ============================================
echo   S-N - Simba ^& Nala
echo   Neue Bilder und Videos hochladen
echo   (c) Bastian Klaus
echo  ============================================
echo.
echo  Neue Dateien vorher hier ablegen:
echo    roh\bilder\   fuer Fotos
echo    roh\videos\   fuer Videos
echo.
pause

call npm run hochladen
set FEHLER=%errorlevel%

echo.
if not "%FEHLER%"=="0" (
  echo  ---------------------------------------------
  echo   Es ist etwas schiefgegangen. Nichts wurde
  echo   hochgeladen. Der Grund steht oben.
  echo  ---------------------------------------------
) else (
  echo  ---------------------------------------------
  echo   Fertig. Die Seite wird in ca. 1 Minute
  echo   neu gebaut:
  echo   https://bastild.github.io/S-N/gedenken/
  echo  ---------------------------------------------
)
echo.
pause
