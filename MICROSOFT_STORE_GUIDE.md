# 🏪 QLinkNote 微软应用商店上架指南

## 📋 准备清单

### ✅ 已完成
- [x] 项目元数据更新
- [x] Electron Builder 配置添加 APPX 支持
- [x] 图标文件夹创建

### 🔲 待完成
- [ ] 创建应用图标文件
- [ ] 申请开发者账户
- [ ] 配置应用证书
- [ ] 构建 APPX 包
- [ ] 创建应用商店页面
- [ ] 提交审核

## 🎯 第一步：图标制作

### 必需的图标文件
```
assets/
├── icon.ico                    # Windows 传统图标 (256x256)
├── appx/
│   ├── Square44x44Logo.png     # 44x44 - 任务栏和开始菜单
│   ├── Square150x150Logo.png   # 150x150 - 中等磁贴
│   ├── Wide310x150Logo.png     # 310x150 - 宽磁贴
│   ├── Square310x310Logo.png   # 310x310 - 大磁贴
│   └── StoreLogo.png           # 50x50 - 应用商店列表
```

### 制作工具
1. **在线工具（推荐）**
   - https://favicon.io/favicon-converter/
   - https://www.icoconverter.com/

2. **本地工具**
   - ImageMagick: `magick assets/icon.svg -resize 256x256 assets/icon.ico`
   - GIMP/Photoshop

3. **设计要求**
   - 背景透明或使用品牌色 #1e1e1e
   - 确保在不同尺寸下清晰可见
   - 遵循 Microsoft Design Guidelines

## 🏢 第二步：开发者账户

### 注册流程
1. 访问 [Microsoft Partner Center](https://partner.microsoft.com/)
2. 选择账户类型：
   - **个人账户**: $19/年
   - **公司账户**: $99/年（推荐，更专业）
3. 提供身份验证文件
4. 完成税务信息设置

### 账户优势
- 能发布到 Microsoft Store
- 获得开发者支持
- 访问分析数据
- 参与合作伙伴计划

## 🔧 第三步：配置构建

### 更新 package.json 配置
当前已配置的构建选项：
```json
{
  "build": {
    "win": {
      "target": [
        { "target": "nsis", "arch": ["x64"] },
        { "target": "appx", "arch": ["x64"] }
      ]
    },
    "appx": {
      "applicationId": "QLinkNote",
      "displayName": "QLinkNote - Markdown Editor",
      "publisherDisplayName": "QLinkNote Team",
      "identityName": "YourPublisherID.QLinkNote",
      "publisher": "CN=YourPublisherID"
    }
  }
}
```

### 需要更新的字段
- `identityName`: 替换为你的发布者ID
- `publisher`: 替换为你的证书DN
- `publisherDisplayName`: 你的公司/个人名称

## 📱 第四步：应用商店信息

### 应用描述模板
```
标题: QLinkNote - 现代化 Markdown 编辑器

简短描述:
功能强大的 Markdown 编辑器，灵感来自 Obsidian，支持实时预览、文件管理和主题切换。

详细描述:
QLinkNote 是一款现代化的 Markdown 编辑器，为知识工作者和内容创作者打造。

🌟 主要特性：
• 📝 实时 Markdown 编辑和预览
• 📁 完整的文件管理系统
• 🔍 强大的全文搜索功能
• 🌓 深色/浅色主题切换
• ⚡ 丰富的键盘快捷键
• 💾 自动保存和本地存储

🎯 适用场景：
• 技术文档编写
• 学习笔记整理
• 博客文章创作
• 知识库管理

QLinkNote 结合了专业编辑器的强大功能和现代化的用户界面，
让 Markdown 编辑变得更加高效和愉悦。
```

### 截图要求
- 至少 1 张，最多 10 张
- 尺寸: 1366x768, 1920x1080, 或 3840x2160
- 格式: PNG, JPG
- 展示核心功能和界面

### 分类建议
- **主要类别**: 生产力
- **子类别**: 文档 & 文本编辑器
- **年龄分级**: 适合所有年龄

## 🔐 第五步：代码签名证书

### 证书获取
1. **Microsoft Store 签名**
   - 通过 Partner Center 自动处理
   - 无需自己的证书

2. **侧载分发**（可选）
   - 需要购买代码签名证书
   - 推荐: DigiCert, Sectigo, GlobalSign

### 构建命令
```bash
# 构建应用商店版本
npm run build
npm run electron:pack

# 检查生成的文件
ls -la release/
```

## 📋 第六步：提交审核

### 审核要求
1. **功能完整性**
   - 应用必须功能完整，无崩溃
   - 所有功能按描述工作

2. **内容合规**
   - 无恶意代码
   - 遵循微软商店政策

3. **技术要求**
   - 支持 Windows 10/11
   - 通过 WACK 测试

### 审核时间
- 通常 2-7 个工作日
- 首次提交可能需要更长时间
- 更新版本审核较快

## 🚀 第七步：发布策略

### 定价策略
1. **免费模式**（推荐开始）
   - 获得更多用户
   - 建立用户基础
   - 收集反馈

2. **付费模式**
   - $2.99 - $9.99 合理区间
   - 可以后续调整

3. **免费试用**
   - 7-30 天试用期
   - 功能限制版本

### 营销建议
1. **应用商店优化（ASO）**
   - 关键词优化
   - 高质量截图
   - 用户评价管理

2. **社交媒体推广**
   - 技术博客文章
   - GitHub 开源推广
   - 社区分享

## 📊 监控和维护

### 分析数据
- Partner Center 提供详细分析
- 下载量、用户留存率
- 崩溃报告和反馈

### 持续更新
- 定期功能更新
- 安全补丁
- 用户反馈响应

## 🔗 有用链接

- [Microsoft Partner Center](https://partner.microsoft.com/)
- [应用商店政策](https://docs.microsoft.com/zh-cn/windows/uwp/publish/store-policies)
- [APPX 打包指南](https://docs.microsoft.com/zh-cn/windows/msix/)
- [设计指南](https://docs.microsoft.com/zh-cn/windows/apps/design/)

---

**下一步操作**: 完成图标制作，然后注册开发者账户开始上架流程！