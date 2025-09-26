@echo off
echo Starting QLinkNote Desktop Application...
echo.

REM Stop any existing processes
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start the application
echo Starting Vite development server...
start /min cmd /c "npm run dev"

REM Wait for the server to start
echo Waiting for development server...
timeout /t 5 /nobreak >nul

REM Start Electron
echo Starting Electron desktop application...
start "" npx electron .

echo.
echo QLinkNote is starting up...
echo You can close this window once the application opens.
pause