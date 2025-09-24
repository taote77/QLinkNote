@echo off
echo 正在启动 QLinkNote Electron 应用...
echo.

echo 1. 启动开发服务器...
start "Vite Dev Server" cmd /c "npm run dev"

echo 2. 等待服务器启动...
timeout /t 3 /nobreak >nul

echo 3. 启动 Electron 应用...
npx electron .

pause