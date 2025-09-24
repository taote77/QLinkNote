const { contextBridge, ipcRenderer } = require('electron');

// 检查是否已经绑定了 API，避免重复绑定
if (!window.electronAPI) {
  // 向渲染进程暴露安全的 API
  contextBridge.exposeInMainWorld('electronAPI', {
    // 文件操作
    saveFile: (content, filePath, suggestedName) => ipcRenderer.invoke('save-file', { content, filePath, suggestedName }),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    
    // 工作空间操作
    openWorkspace: () => ipcRenderer.invoke('open-workspace'),
    readWorkspaceFiles: (workspacePath) => ipcRenderer.invoke('read-workspace-files', workspacePath),
    createFileInWorkspace: (workspacePath, fileName, parentPath) => ipcRenderer.invoke('create-file-in-workspace', { workspacePath, fileName, parentPath }),
    createFolderInWorkspace: (workspacePath, folderName, parentPath) => ipcRenderer.invoke('create-folder-in-workspace', { workspacePath, folderName, parentPath }),
    
    // 菜单事件监听
    onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
    onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
    onMenuSaveFile: (callback) => ipcRenderer.on('menu-save-file', callback),
    onMenuSaveAs: (callback) => ipcRenderer.on('menu-save-as', callback),
    onMenuOpenWorkspace: (callback) => ipcRenderer.on('menu-open-workspace', callback),
    onMenuCloseWorkspace: (callback) => ipcRenderer.on('menu-close-workspace', callback),
    onMenuFind: (callback) => ipcRenderer.on('menu-find', callback),
    onMenuTogglePreview: (callback) => ipcRenderer.on('menu-toggle-preview', callback),
    onMenuToggleSplit: (callback) => ipcRenderer.on('menu-toggle-split', callback),
    onMenuToggleTheme: (callback) => ipcRenderer.on('menu-toggle-theme', callback),
    
    // 移除监听器
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    
    // 平台信息
    platform: process.platform,
    
    // 获取版本信息
    getVersion: () => process.versions.electron
  });
}

// 检查是否已经绑定了 console API
if (!window.electronConsole) {
  // 日志输出到主进程（使用不同的名称避免冲突）
  contextBridge.exposeInMainWorld('electronConsole', {
    log: (...args) => console.log(...args),
    error: (...args) => console.error(...args),
    warn: (...args) => console.warn(...args)
  });
}