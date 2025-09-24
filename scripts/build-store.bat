@echo off
echo ==========================================
echo  QLinkNote 微软应用商店构建脚本
echo ==========================================
echo.

echo 📋 检查构建环境...
where npm >nul 2>nul
if errorlevel 1 (
    echo ❌ 错误: 未找到 npm，请安装 Node.js
    pause
    exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo ❌ 错误: 未找到 node，请安装 Node.js
    pause
    exit /b 1
)

echo ✅ Node.js 环境检查通过

echo.
echo 🔨 开始构建过程...
echo.

echo 1️⃣ 清理旧的构建文件...
if exist "dist" rmdir /s /q "dist"
if exist "release" rmdir /s /q "release"
echo ✅ 清理完成

echo.
echo 2️⃣ 安装依赖...
call npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

echo.
echo 3️⃣ 构建前端代码...
call npm run build
if errorlevel 1 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)
echo ✅ 前端构建完成

echo.
echo 4️⃣ 检查图标文件...
if not exist "assets\icon.ico" (
    echo ⚠️  警告: 缺少 assets\icon.ico 文件
    echo 💡 提示: 请运行 'node scripts/generate-icons.js' 查看图标生成指南
)

if not exist "assets\appx" (
    echo ⚠️  警告: 缺少 assets\appx\ 目录
    echo 💡 提示: 请创建应用商店所需的图标文件
)

echo.
echo 5️⃣ 构建 Electron 应用 (包含 APPX)...
call npm run electron:pack
if errorlevel 1 (
    echo ❌ Electron 构建失败
    pause
    exit /b 1
)
echo ✅ Electron 构建完成

echo.
echo 📦 构建结果检查...
if exist "release\*.appx" (
    echo ✅ APPX 包构建成功:
    dir "release\*.appx" /b
) else (
    echo ⚠️  未找到 APPX 包文件
    echo 💡 可能需要配置代码签名证书
)

if exist "release\*.exe" (
    echo ✅ NSIS 安装包构建成功:
    dir "release\*.exe" /b
)

echo.
echo ==========================================
echo  构建完成! 
echo ==========================================
echo.
echo 📁 构建文件位置: release\
echo 📋 下一步:
echo    1. 检查生成的 APPX 文件
echo    2. 测试应用安装和运行
echo    3. 准备上传到 Microsoft Partner Center
echo.
echo 🔗 更多信息请查看: MICROSOFT_STORE_GUIDE.md
echo.
pause