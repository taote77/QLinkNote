const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * GitHub 发布脚本
 * 
 * 使用方法:
 * 1. 确保已安装 GitHub CLI: winget install GitHub.cli
 * 2. 确保已登录 GitHub CLI: gh auth login
 * 3. 运行脚本: node scripts/release-to-github.js [版本号]
 * 
 * 示例: node scripts/release-to-github.js 1.0.1
 */

class GitHubReleaser {
  constructor() {
    this.packageInfo = this.getPackageInfo();
    this.releaseDir = path.join(process.cwd(), 'release');
  }

  getPackageInfo() {
    const packagePath = path.join(process.cwd(), 'package.json');
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  }

  async run() {
    try {
      const version = process.argv[2] || this.packageInfo.version;
      const tag = `v${version}`;
      
      console.log(`🚀 开始发布 QLinkNote ${version}...`);
      
      // 1. 构建应用
      await this.build();
      
      // 2. 检查发布文件
      const releaseFiles = await this.checkReleaseFiles(version);
      
      // 3. 创建 Git 标签
      await this.createTag(tag);
      
      // 4. 创建 GitHub Release
      await this.createGitHubRelease(tag, version, releaseFiles);
      
      console.log(`✅ 发布完成！访问: https://github.com/${this.getRepoUrl()}/releases`);
      
    } catch (error) {
      console.error('❌ 发布失败:', error.message);
      process.exit(1);
    }
  }

  async build() {
    console.log('📦 构建应用...');
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      execSync('npm run electron:pack', { stdio: 'inherit' });
    } catch (error) {
      throw new Error('构建失败');
    }
  }

  async checkReleaseFiles(version) {
    console.log('📋 检查发布文件...');
    
    if (!fs.existsSync(this.releaseDir)) {
      throw new Error('release 目录不存在，请先运行构建');
    }

    const files = fs.readdirSync(this.releaseDir, { recursive: true });
    console.log('可用文件:', files);

    const releaseFiles = [];

    // 查找 Windows 安装程序
    const setupFile = files.find(f => 
      f.includes('Setup') && f.endsWith('.exe')
    );
    if (setupFile) {
      releaseFiles.push({
        path: path.join(this.releaseDir, setupFile),
        name: `QLinkNote-Setup-${version}.exe`,
        type: 'Windows 安装程序'
      });
    }

    // 查找 APPX 文件
    const appxFile = files.find(f => f.endsWith('.appx'));
    if (appxFile) {
      releaseFiles.push({
        path: path.join(this.releaseDir, appxFile),
        name: `QLinkNote-${version}.appx`,
        type: 'Microsoft Store 包'
      });
    }

    // 创建便携版
    const unpackedDir = this.findUnpackedDir(files);
    if (unpackedDir) {
      const zipPath = await this.createPortableVersion(unpackedDir, version);
      releaseFiles.push({
        path: zipPath,
        name: `QLinkNote-win-x64-${version}.zip`,
        type: '便携版'
      });
    }

    if (releaseFiles.length === 0) {
      throw new Error('未找到可发布的文件');
    }

    console.log('找到发布文件:');
    releaseFiles.forEach(file => {
      console.log(`  - ${file.type}: ${file.name}`);
    });

    return releaseFiles;
  }

  findUnpackedDir(files) {
    const patterns = [
      'win-unpacked',
      /QLinkNote.*win.*unpacked/i,
      /qlinknote.*win.*unpacked/i
    ];

    for (const pattern of patterns) {
      const found = files.find(f => {
        if (typeof pattern === 'string') {
          return f.includes(pattern);
        }
        return pattern.test(f);
      });
      if (found) {
        return path.join(this.releaseDir, found);
      }
    }
    
    return null;
  }

  async createPortableVersion(unpackedDir, version) {
    console.log('📦 创建便携版...');
    
    const zipPath = path.join(this.releaseDir, `QLinkNote-win-x64-${version}.zip`);
    
    try {
      // 使用 PowerShell 创建 ZIP
      const command = `powershell -Command "Compress-Archive -Path '${unpackedDir}\\*' -DestinationPath '${zipPath}' -Force"`;
      execSync(command, { stdio: 'inherit' });
      
      console.log(`✅ 便携版已创建: ${zipPath}`);
      return zipPath;
    } catch (error) {
      throw new Error(`创建便携版失败: ${error.message}`);
    }
  }

  async createTag(tag) {
    console.log(`🏷️  创建标签 ${tag}...`);
    
    try {
      // 检查标签是否已存在
      try {
        execSync(`git rev-parse ${tag}`, { stdio: 'pipe' });
        console.log(`标签 ${tag} 已存在，跳过创建`);
        return;
      } catch {
        // 标签不存在，继续创建
      }

      execSync(`git tag ${tag}`, { stdio: 'inherit' });
      execSync(`git push origin ${tag}`, { stdio: 'inherit' });
      
      console.log(`✅ 标签 ${tag} 已创建并推送`);
    } catch (error) {
      throw new Error(`创建标签失败: ${error.message}`);
    }
  }

  async createGitHubRelease(tag, version, releaseFiles) {
    console.log(`🎉 创建 GitHub Release ${tag}...`);
    
    const releaseBody = this.generateReleaseNotes(version);
    
    try {
      // 创建 Release
      const releaseCommand = [
        'gh', 'release', 'create', tag,
        '--title', `QLinkNote v${version}`,
        '--notes', `"${releaseBody}"`,
      ];
      
      // 添加文件
      releaseFiles.forEach(file => {
        releaseCommand.push(file.path);
      });
      
      execSync(releaseCommand.join(' '), { stdio: 'inherit' });
      
      console.log(`✅ GitHub Release 已创建`);
    } catch (error) {
      throw new Error(`创建 GitHub Release 失败: ${error.message}`);
    }
  }

  generateReleaseNotes(version) {
    return `🎉 QLinkNote 新版本发布！

## 📦 下载地址

### Windows 用户
- **安装版**: 下载 \`QLinkNote-Setup-${version}.exe\`
- **便携版**: 下载并解压 \`QLinkNote-win-x64-${version}.zip\`
- **Microsoft Store 版本**: 下载 \`QLinkNote-${version}.appx\`

## 🚀 主要特性
- 📝 实时 Markdown 编辑和预览
- 📁 完整的文件管理系统
- 🔍 强大的全文搜索功能
- 🌓 深色/浅色主题切换
- ⚡ 丰富的键盘快捷键
- 💾 自动保存功能
- 🗺️ 关系图谱可视化

## 📋 安装说明

### 安装版 (exe)
1. 下载 \`QLinkNote-Setup-${version}.exe\`
2. 双击运行安装程序
3. 按照向导完成安装

### 便携版 (zip)
1. 下载 \`QLinkNote-win-x64-${version}.zip\`
2. 解压到任意目录
3. 双击 \`QLinkNote.exe\` 运行

### Microsoft Store 版本 (appx)
1. 下载 \`QLinkNote-${version}.appx\`
2. 双击安装或使用 PowerShell: \`Add-AppxPackage -Path "QLinkNote-${version}.appx"\`

## 🐛 问题反馈
如果遇到问题，请在 [Issues](${this.getRepoUrl()}/issues) 中反馈。

---

**自动构建版本**: ${version}`;
  }

  getRepoUrl() {
    if (this.packageInfo.repository && this.packageInfo.repository.url) {
      return this.packageInfo.repository.url
        .replace('git+', '')
        .replace('.git', '')
        .replace('https://github.com/', '');
    }
    return 'yourusername/qlinknote';
  }
}

// 运行发布器
if (require.main === module) {
  const releaser = new GitHubReleaser();
  releaser.run().catch(console.error);
}

module.exports = GitHubReleaser;