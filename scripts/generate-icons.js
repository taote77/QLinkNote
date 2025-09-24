/**
 * 图标生成脚本
 * 从 SVG 生成各种尺寸和格式的图标
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconSizes = {
  // Windows 应用商店需要的图标
  appx: [
    '44x44',   // Square44x44Logo
    '50x50',   // StoreLogo  
    '150x150', // Square150x150Logo
    '310x150', // Wide310x150Logo
    '310x310', // Square310x310Logo
  ],
  // 传统 ICO 格式
  ico: ['16', '24', '32', '48', '64', '128', '256'],
  // PNG 格式
  png: ['16', '24', '32', '48', '64', '128', '256', '512', '1024']
};

console.log('📋 图标生成需求分析');
console.log('===================');
console.log('');

console.log('🎯 微软应用商店图标要求:');
console.log('• Square44x44Logo: 44x44 像素 (任务栏和开始菜单)');
console.log('• Square150x150Logo: 150x150 像素 (开始菜单中等磁贴)');
console.log('• Wide310x150Logo: 310x150 像素 (开始菜单宽磁贴)');
console.log('• Square310x310Logo: 310x310 像素 (开始菜单大磁贴)');
console.log('• StoreLogo: 50x50 像素 (应用商店列表)');
console.log('');

console.log('📁 建议的文件结构:');
console.log('assets/');
console.log('├── icon.svg          # 源图标 (当前已有)');
console.log('├── icon.ico          # Windows 传统图标');
console.log('├── icon.png          # Linux 图标');
console.log('├── icon.icns         # macOS 图标');
console.log('└── appx/             # Windows 应用商店图标');
iconSizes.appx.forEach(size => {
  console.log(`    ├── Square${size}Logo.png`);
});
console.log('    └── StoreLogo.png');
console.log('');

console.log('🛠️ 推荐工具:');
console.log('• 在线工具: https://favicon.io/favicon-converter/');
console.log('• 本地工具: ImageMagick, GIMP, Photoshop');
console.log('• VS Code 扩展: SVG to ICO/PNG converter');
console.log('');

console.log('⚡ 快速生成命令 (需要 ImageMagick):');
console.log('# 从 SVG 生成 ICO');
console.log('magick assets/icon.svg -resize 256x256 assets/icon.ico');
console.log('');
console.log('# 生成应用商店图标');
iconSizes.appx.forEach(size => {
  const [w, h] = size.split('x');
  const filename = size === '50x50' ? 'StoreLogo' : `Square${size}Logo`;
  console.log(`magick assets/icon.svg -resize ${w}x${h || w} assets/appx/${filename}.png`);
});
console.log('');

console.log('📋 手动创建步骤:');
console.log('1. 创建 assets/appx/ 目录');
console.log('2. 使用设计工具将 SVG 转换为所需尺寸');
console.log('3. 确保图标背景透明或使用品牌色');
console.log('4. 验证图标在不同尺寸下的清晰度');

// 创建必要的目录
const appxDir = path.join(__dirname, '../assets/appx');
if (!fs.existsSync(appxDir)) {
  fs.mkdirSync(appxDir, { recursive: true });
  console.log('✅ 已创建 assets/appx/ 目录');
}