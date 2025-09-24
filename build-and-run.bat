@echo off
echo 正在构建并运行 QLinkNote...
echo.

echo 1. 构建 Web 应用...
call npx vite build

if %errorlevel% neq 0 (
    echo 构建失败！
    pause
    exit /b 1
)

echo 2. 启动 Electron 应用...
npx electron .

pause