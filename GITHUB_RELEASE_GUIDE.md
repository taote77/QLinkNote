# GitHub 发布指南

本文档说明如何将 QLinkNote 的打包结果发布到 GitHub Releases。

## 📋 目录

- [前置要求](#前置要求)
- [自动发布（推荐）](#自动发布推荐)
- [手动发布](#手动发布)
- [发布文件说明](#发布文件说明)
- [故障排除](#故障排除)

## 前置要求

### 1. GitHub 仓库设置

确保你的 `package.json` 中的仓库信息正确：

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/你的用户名/qlinknote.git"
  }
}
```

### 2. GitHub CLI 安装（手动发布需要）

```bash
# Windows
winget install GitHub.cli

# macOS
brew install gh

# Linux
# 参考 https://github.com/cli/cli/blob/trunk/docs/install_linux.md
```

### 3. 登录 GitHub CLI

```bash
gh auth login
```

## 自动发布（推荐）

### 工作流程

1. **代码提交**: 将代码推送到 GitHub
2. **创建标签**: 创建版本标签触发自动构建
3. **自动构建**: GitHub Actions 自动构建并发布

### 操作步骤

1. **更新版本号**

```bash
# 更新 package.json 中的版本号
npm version patch  # 补丁版本 (1.0.0 -> 1.0.1)
npm version minor  # 次要版本 (1.0.0 -> 1.1.0)
npm version major  # 主要版本 (1.0.0 -> 2.0.0)
```

2. **推送代码和标签**

```bash
git push
git push --tags
```

3. **等待构建完成**

- 访问你的仓库的 Actions 页面
- 查看构建进度
- 构建完成后自动创建 Release

### 手动触发

如果需要手动触发构建：

1. 访问仓库的 Actions 页面
2. 选择 "Build and Release" workflow
3. 点击 "Run workflow"
4. 选择分支并点击 "Run workflow"

## 手动发布

### 使用批处理脚本（Windows）

1. 双击运行 `scripts\release-to-github.bat`
2. 输入版本号（如 `1.0.1`）
3. 等待构建和发布完成

### 使用 Node.js 脚本

```bash
# 使用默认版本号（package.json 中的版本）
node scripts/release-to-github.js

# 指定版本号
node scripts/release-to-github.js 1.0.1
```

### 完全手动操作

1. **构建应用**

```bash
npm run build
npm run electron:pack
```

2. **创建标签**

```bash
git tag v1.0.1
git push origin v1.0.1
```

3. **创建 Release**

```bash
gh release create v1.0.1 \
  --title "QLinkNote v1.0.1" \
  --notes "发布说明..." \
  release/QLinkNote\ Setup\ 1.0.1.exe \
  release/QLinkNote-1.0.1.appx
```

## 发布文件说明

### 自动生成的文件

| 文件类型 | 文件名格式 | 说明 |
|---------|-----------|------|
| Windows 安装程序 | `QLinkNote Setup {版本}.exe` | NSIS 安装程序 |
| Microsoft Store 包 | `QLinkNote-{版本}.appx` | APPX 包文件 |
| 便携版 | `QLinkNote-win-x64-{版本}.zip` | 免安装版本 |

### 下载建议

- **普通用户**: 下载 `.exe` 安装程序
- **便携使用**: 下载 `.zip` 便携版
- **企业部署**: 下载 `.appx` 包

## 故障排除

### 1. 构建失败

**问题**: `npm run electron:pack` 失败

**解决方案**:
- 检查 Node.js 版本（推荐 18+）
- 清理依赖: `rm -rf node_modules package-lock.json && npm install`
- 检查磁盘空间是否充足

### 2. GitHub CLI 问题

**问题**: `gh` 命令找不到

**解决方案**:
```bash
# 重新安装 GitHub CLI
winget install GitHub.cli

# 重新登录
gh auth login
```

### 3. 权限问题

**问题**: 上传文件失败，权限不足

**解决方案**:
- 确保 GitHub token 有正确权限
- 检查仓库是否为私有（可能需要付费账户）

### 4. 文件找不到

**问题**: 找不到打包文件

**解决方案**:
- 检查 `release/` 目录是否存在
- 确认打包过程没有错误
- 查看 electron-builder 配置

### 5. 自动发布不触发

**问题**: 推送标签后 GitHub Actions 没有运行

**解决方案**:
- 检查 `.github/workflows/build-and-release.yml` 文件是否存在
- 确认标签格式正确（必须以 `v` 开头，如 `v1.0.1`）
- 检查 Actions 是否被禁用

## 🔧 高级配置

### 代码签名

如果要对应用进行代码签名，需要在 GitHub 仓库的 Secrets 中添加：

- `WIN_CSC_LINK`: 证书文件的 base64 编码
- `WIN_CSC_KEY_PASSWORD`: 证书密码

### 多平台构建

目前配置仅支持 Windows 构建。如需支持 macOS 和 Linux：

1. 修改 `.github/workflows/build-and-release.yml`
2. 添加对应的 jobs
3. 配置相应的构建环境

## 📞 获取帮助

如果遇到问题：

1. 查看 [GitHub Actions 日志](../../actions)
2. 在 [Issues](../../issues) 中搜索类似问题
3. 创建新的 Issue 描述问题

---

**提示**: 首次发布建议先使用手动方式测试，确认流程正常后再使用自动发布。