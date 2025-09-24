# QLinkNote Electron 桌面版

## 安装依赖

```bash
npm install
```

## 开发模式

启动 Web 版本：
```bash
npm run dev
```

启动 Electron 开发版本：
```bash
npm run electron:dev
```

## 构建和打包

构建 Web 版本：
```bash
npm run build
```

构建 Electron 版本：
```bash
npm run electron:pack
```

构建分发版本：
```bash
npm run electron:dist
```

## Electron 功能特性

### 🖥️ 桌面应用特性
- 原生桌面窗口
- 系统菜单栏集成
- 本地文件系统支持
- 跨平台支持 (Windows, macOS, Linux)

### 📁 文件操作
- 通过菜单或快捷键创建新文件
- 打开本地 Markdown 文件
- 保存到本地文件系统
- 另存为功能

### ⌨️ 菜单和快捷键
- **文件菜单**：新建、打开、保存、另存为
- **编辑菜单**：撤销、重做、剪切、复制、粘贴、查找
- **视图菜单**：预览模式、分屏模式、主题切换
- **窗口菜单**：最小化、关闭

### 🔧 开发和调试
- 开发模式下自动打开 DevTools
- 热重载支持
- 错误日志输出

### 📦 打包和分发
- 支持生成 Windows 安装程序 (NSIS)
- 支持生成 macOS DMG 包
- 支持生成 Linux AppImage

## 项目结构

```
QLinkNote/
├── electron/              # Electron 主进程文件
│   ├── main.js            # Electron 主进程
│   └── preload.js         # 预加载脚本
├── src/                   # React 源代码
│   ├── components/        # React 组件
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useElectronFileSystem.ts  # Electron 文件系统
│   │   └── useElectronMenu.ts        # Electron 菜单处理
│   └── ...
├── scripts/              # 构建脚本
│   └── build-electron.js # Electron 构建脚本
└── dist/                 # 构建输出目录
```

## 环境要求

- Node.js 16+
- npm 7+

## 故障排除

### 依赖安装问题
如果遇到 Electron 下载问题，可以设置镜像：
```bash
npm config set electron_mirror https://npm.taobao.org/mirrors/electron/
```

### 构建问题
确保所有依赖都已正确安装：
```bash
rm -rf node_modules package-lock.json
npm install
```

### 权限问题
Windows 上可能需要以管理员身份运行：
```bash
# 以管理员身份运行 PowerShell
npm run electron:dev
```