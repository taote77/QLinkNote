# 快速开始指南 - GitHub 发布

## 🎯 目标
将 `npm run electron:pack` 生成的安装包发布到 GitHub Releases，供用户下载。

## 📁 当前构建结果

运行 `npm run electron:pack` 后，在 `release/` 目录生成了以下文件：

```
release/
├── QLinkNote Setup 1.0.0.exe        # Windows 安装程序
├── QLinkNote 1.0.0.appx             # Microsoft Store 包  
├── win-unpacked/                     # 解压的应用文件
└── 其他构建文件...
```

## 🚀 三种发布方式

### 方式一：自动发布（推荐）⭐

1. **设置 GitHub 仓库**
   - 确保 `package.json` 中的 `repository.url` 正确
   - 推送代码到 GitHub

2. **创建版本标签**
   ```bash
   # 方法 A：使用 npm（推荐）
   npm run version:patch    # 1.0.0 -> 1.0.1
   
   # 方法 B：手动创建
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. **等待自动构建**
   - GitHub Actions 自动触发
   - 自动构建并发布到 Releases
   - 访问 `https://github.com/你的用户名/qlinknote/releases`

### 方式二：半自动发布 🔧

1. **安装 GitHub CLI**
   ```bash
   winget install GitHub.cli
   gh auth login
   ```

2. **运行发布脚本**
   ```bash
   # Windows 用户
   scripts\release-to-github.bat
   
   # 或命令行
   npm run release:manual
   ```

### 方式三：完全手动发布 ✋

1. **本地构建**
   ```bash
   npm run electron:pack
   ```

2. **访问 GitHub 网页**
   - 进入你的仓库
   - 点击 "Releases" → "Create a new release"
   - 创建标签（如 `v1.0.1`）
   - 上传 `release/` 目录中的 `.exe` 和 `.appx` 文件
   - 编写发布说明
   - 发布

## 📋 发布检查清单

- [ ] `package.json` 中的仓库地址正确
- [ ] 代码已推送到 GitHub
- [ ] 本地构建成功（`npm run release:check`）
- [ ] 版本号已更新
- [ ] 发布说明已准备

## 🔍 验证发布

发布成功后，用户可以：

1. 访问 `https://github.com/你的用户名/qlinknote/releases`
2. 下载对应文件：
   - Windows 用户：`QLinkNote-Setup-{版本}.exe`
   - 便携使用：`QLinkNote-win-x64-{版本}.zip`
   - 企业部署：`QLinkNote-{版本}.appx`

## ❓ 常见问题

**Q: 为什么推荐自动发布？**
A: 自动发布确保构建环境一致，减少人为错误，且自动生成便携版。

**Q: 如何修改发布说明模板？**
A: 编辑 `.github/workflows/build-and-release.yml` 中的 `body` 部分。

**Q: 构建失败怎么办？**
A: 检查 GitHub Actions 日志，常见问题包括依赖安装失败或磁盘空间不足。

**Q: 如何支持其他平台？**
A: 修改 `package.json` 的 `build` 配置和 GitHub Actions 工作流。

## 📞 获取帮助

- 详细文档：[GITHUB_RELEASE_GUIDE.md](GITHUB_RELEASE_GUIDE.md)
- GitHub Actions 日志：仓库 → Actions
- 提交问题：仓库 → Issues

---

🎉 **快速开始**: 运行 `npm run version:patch` 即可发布新版本！