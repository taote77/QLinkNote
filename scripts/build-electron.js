const { build } = require('vite');
const fs = require('fs');
const path = require('path');

async function buildElectron() {
  try {
    console.log('Building React app...');
    
    // 构建 React 应用
    await build();
    
    console.log('Copying Electron files...');
    
    // 创建 dist-electron 目录
    const distElectronDir = path.join(__dirname, '../dist-electron');
    if (!fs.existsSync(distElectronDir)) {
      fs.mkdirSync(distElectronDir, { recursive: true });
    }
    
    // 复制 Electron 文件
    const electronDir = path.join(__dirname, '../electron');
    const files = ['main.js', 'preload.js'];
    
    for (const file of files) {
      const src = path.join(electronDir, file);
      const dest = path.join(distElectronDir, file);
      
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file}`);
      }
    }
    
    console.log('Electron build completed!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildElectron();