const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');

// 保持对窗口对象的全局引用，如果不这样做，当 JavaScript 对象被垃圾回收时，窗口会自动关闭
let mainWindow;

const isDev = !app.isPackaged;

// 禁用硬件加速以避免 GPU 错误（必须在 app.whenReady() 之前调用）
app.disableHardwareAcceleration();

function createWindow() {
  
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../assets/icon.png'), // 应用图标
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // 先不显示，等页面加载完成后再显示
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:3001');
    // 开发模式下打开 DevTools
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 当页面加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 当窗口被关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 这个方法将在 Electron 完成初始化并准备好创建浏览器窗口时调用
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  // 在 macOS 上，用户通常希望应用和其菜单栏保持激活状态，直到用户使用 Cmd + Q 显式退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建文件',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-file');
          }
        },
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Markdown Files', extensions: ['md', 'markdown'] },
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });

            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              try {
                const content = await fs.readFile(filePath, 'utf-8');
                const fileName = path.basename(filePath);
                mainWindow.webContents.send('menu-open-file', { fileName, content, filePath });
              } catch (error) {
                console.error('Error reading file:', error);
              }
            }
          }
        },
        {
          label: '保存文件',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-file');
          }
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-save-as');
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectall' },
        { type: 'separator' },
        {
          label: '查找',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow.webContents.send('menu-find');
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '切换预览模式',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('menu-toggle-preview');
          }
        },
        {
          label: '切换分屏模式',
          accelerator: 'CmdOrCtrl+\\',
          click: () => {
            mainWindow.webContents.send('menu-toggle-split');
          }
        },
        {
          label: '切换主题',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => {
            mainWindow.webContents.send('menu-toggle-theme');
          }
        },
        { type: 'separator' },
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: '切换开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '切换全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 QLinkNote',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 QLinkNote',
              message: 'QLinkNote',
              detail: '一个现代化的 Markdown 编辑器\\n版本: 1.0.0\\n基于 Electron 和 React 构建'
            });
          }
        }
      ]
    }
  ];

  // macOS 菜单调整
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: '关于 ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: '服务', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: '隐藏 ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: '隐藏其他', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: '显示全部', role: 'unhide' },
        { type: 'separator' },
        { label: '退出', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 处理程序
ipcMain.handle('save-file', async (event, { content, filePath }) => {
  try {
    if (filePath) {
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true, filePath };
    } else {
      // 另存为
      const result = await dialog.showSaveDialog(mainWindow, {
        filters: [
          { name: 'Markdown Files', extensions: ['md'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        defaultPath: 'untitled.md'
      });

      if (!result.canceled && result.filePath) {
        await fs.writeFile(result.filePath, content, 'utf-8');
        return { success: true, filePath: result.filePath };
      }
    }
    return { success: false };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
});

// 防止多个实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 当运行第二个实例时，将会聚焦到 mainWindow 这个窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}