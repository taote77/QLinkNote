# QLinkNote - Markdown 编辑器

一个参考 Obsidian 设计的现代化 Markdown 编辑器，使用 React + TypeScript + Vite 构建，支持 Electron 桌面应用。

## ✨ 特性

- 📝 **实时编辑与预览** - 支持实时 Markdown 渲染和语法高亮
- 📁 **文件管理系统** - 创建、删除、重命名文件和文件夹
- 🔍 **全文搜索** - 快速搜索文件名和内容
- 🌓 **主题切换** - 深色/浅色主题支持
- ⚡ **快捷键支持** - 丰富的键盘快捷键
- 💾 **本地存储** - 自动保存到浏览器本地存储或文件系统
- 🖥️ **分屏模式** - 编辑和预览同时显示
- 🎨 **现代界面** - 类似 Obsidian 的简洁界面设计
- 🖥️ **桌面应用** - 基于 Electron 的跨平台桌面应用

## 🚀 快速开始

### 🔥 下载发布版本

访问 [Releases 页面](https://github.com/yourusername/qlinknote/releases) 下载最新版本：

- **Windows 安装版**: `QLinkNote-Setup-{version}.exe`
- **Windows 便携版**: `QLinkNote-win-x64-{version}.zip`
- **Microsoft Store 版**: `QLinkNote-{version}.appx`

### 🛠️ 开发环境

#### 安装依赖

```bash
npm install
```

#### 启动 Web 开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3001` 启动。

#### 启动 Electron 桌面应用

```bash
# Windows
start-electron.bat

# 或者使用 npm
npm run electron:dev
```

#### 构建和打包

```bash
# 构建 Web 版本
npm run build

# 打包 Electron 应用
npm run electron:pack

# 构建检查
npm run release:check
```

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 新建文件 |
| `Ctrl + S` | 保存文件 |
| `Ctrl + F` | 搜索文件 |
| `Ctrl + P` | 切换预览模式 |
| `Ctrl + \` | 切换分屏模式 |
| `Ctrl + Shift + K` | 切换主题 |

## 🎯 功能说明

### 文件管理
- 在侧边栏点击 **+** 按钮创建新文件或文件夹
- 右键文件/文件夹进行重命名或删除操作
- 文件内容自动保存到本地存储

### 编辑器
- 基于 Monaco Editor，提供优秀的代码编辑体验
- 支持 Markdown 语法高亮
- 自动补全和语法检查

### 预览
- 使用 `marked` 库进行 Markdown 解析
- `DOMPurify` 确保内容安全
- 支持表格、代码块、引用等丰富格式

### 搜索
- 支持文件名搜索
- 支持文件内容全文搜索
- 实时搜索结果更新

## 📦 发布流程

### 🤖 自动发布（推荐）

1. **更新版本号**：
```bash
npm run version:patch  # 1.0.0 -> 1.0.1
npm run version:minor  # 1.0.0 -> 1.1.0  
npm run version:major  # 1.0.0 -> 2.0.0
```

2. **GitHub Actions 自动构建发布**：
   - 标签推送后自动触发
   - 自动构建 Windows 安装包
   - 自动创建 GitHub Release

### 🔧 手动发布

#### Windows 用户
```bash
# 运行批处理脚本
scripts\release-to-github.bat
```

#### 命令行用户
```bash
# 使用默认版本号
npm run release:manual

# 指定版本号
node scripts/release-to-github.js 1.0.1
```

📄 **详细文档**: 查看 [GitHub 发布指南](GITHUB_RELEASE_GUIDE.md)

## 🛠️ 技术栈

- **React 18** - 用户界面框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 现代构建工具
- **Electron** - 跨平台桌面应用框架
- **Monaco Editor** - 代码编辑器
- **marked** - Markdown 解析器
- **DOMPurify** - XSS 防护
- **Lucide React** - 图标库
- **electron-builder** - Electron 应用打包工具

## 📁 项目结构

```
src/
├── components/          # React 组件
│   ├── Editor.tsx      # 编辑器组件
│   └── Sidebar.tsx     # 侧边栏组件
├── hooks/              # 自定义 Hooks
│   ├── useLocalStorage.ts
│   ├── useSearch.ts
│   └── useKeyboardShortcuts.ts
├── types/              # TypeScript 类型定义
│   └── index.ts
├── utils/              # 工具函数
│   └── helpers.ts
├── styles/             # 样式文件
│   └── index.css
├── App.tsx             # 主应用组件
└── main.tsx           # 应用入口
```

## 🔧 自定义配置

### 主题定制
编辑 `src/styles/index.css` 中的 CSS 变量来自定义主题颜色：

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #212529;
  --text-accent: #0066cc;
  /* 更多颜色变量... */
}
```

### 编辑器配置
在 `Editor.tsx` 组件中修改 Monaco Editor 的选项来自定义编辑器行为。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系

如有问题或建议，请提交 Issue。

---

⭐ 如果这个项目对你有帮助，请给它一个星标！