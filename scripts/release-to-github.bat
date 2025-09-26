@echo off
chcp 65001 >nul
echo.
echo ======================================
echo      QLinkNote GitHub 发布工具
echo ======================================
echo.

REM 检查是否安装了 GitHub CLI
where gh >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ GitHub CLI 未安装
    echo.
    echo 请先安装 GitHub CLI:
    echo   winget install GitHub.cli
    echo.
    echo 或访问: https://cli.github.com/
    pause
    exit /b 1
)

REM 检查是否已登录 GitHub
gh auth status >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未登录 GitHub CLI
    echo.
    echo 请先登录:
    echo   gh auth login
    pause
    exit /b 1
)

REM 获取版本号
set /p VERSION="请输入版本号 (如 1.0.1): "
if "%VERSION%"=="" (
    echo ❌ 版本号不能为空
    pause
    exit /b 1
)

echo.
echo 🚀 开始发布 QLinkNote v%VERSION%...
echo.

REM 运行发布脚本
node scripts\release-to-github.js "%VERSION%"

if %errorlevel% equ 0 (
    echo.
    echo ✅ 发布成功！
    echo.
    echo 🌐 查看发布: https://github.com/yourusername/qlinknote/releases
) else (
    echo.
    echo ❌ 发布失败，请查看错误信息
)

echo.
pause