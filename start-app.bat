@echo off
title Lakshmi Boutique App Launcher
echo ===================================================
echo   Lakshmi Boutique App - Starting Server...
echo ===================================================
echo.

:: Change directory to where the batch file is located
cd /d "%~dp0"

:: Start the default browser to open the application home page
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000

:: Start the web server
echo.
echo Running server. Close this window to stop the application.
echo.
npm run dev

pause
