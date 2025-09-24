import { useState, useCallback, useEffect } from 'react';
import { FileItem, EditorState } from './types';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastManager } from './components/Toast';
import { generateId } from './utils/helpers';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useElectronFileSystem } from './hooks/useElectronFileSystem';
import { useElectronMenu } from './hooks/useElectronMenu';
import { useToast } from './hooks/useToast';

const initialFiles: Record<string, FileItem> = {
  'welcome': {
    id: 'welcome',
    name: 'Welcome.md',
    type: 'file',
    content: `# 欢迎使用 QLinkNote

这是一个参考 Obsidian 设计的 Markdown 编辑器。

## 特性

- 📝 实时 Markdown 编辑和预览
- 📁 文件管理系统
- 🔍 全文搜索功能
- 🌓 深色/浅色主题切换
- ⚡ 快捷键支持
- 💾 自动保存功能

## 快捷键

- \`Ctrl + N\`: 新建文件
- \`Ctrl + S\`: 保存文件
- \`Ctrl + F\`: 搜索
- \`Ctrl + P\`: 切换预览模式
- \`Ctrl + \\\`: 切换分屏模式

开始编辑你的第一个 Markdown 文件吧！
`
  }
};

function App() {
  const { files: storedFiles, saveFiles, saveFile, deleteFile } = useLocalStorage();
  const { 
    isElectron, 
    currentFilePath, 
    saveFileToSystem, 
    newFile, 
    saveAs,
    setCurrentFilePath,
    setCurrentFileName 
  } = useElectronFileSystem();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  const [state, setState] = useState<EditorState>(() => {
    const hasStoredFiles = Object.keys(storedFiles).length > 0;
    let isDarkMode = false;
    
    // 安全地访问 localStorage
    try {
      isDarkMode = localStorage.getItem('qlinknote-theme') === 'dark';
    } catch (error) {
      console.warn('Unable to access localStorage:', error);
    }
    
    return {
      activeFileId: hasStoredFiles ? Object.keys(storedFiles)[0] : 'welcome',
      files: hasStoredFiles ? storedFiles : initialFiles,
      openFiles: hasStoredFiles ? [Object.keys(storedFiles)[0]] : ['welcome'],
      searchQuery: '',
      isDarkMode,
      isPreviewMode: false,
      isSplitView: true
    };
  });

  // 同步本地存储的文件到状态
  useEffect(() => {
    if (Object.keys(storedFiles).length > 0) {
      setState(prev => ({
        ...prev,
        files: storedFiles
      }));
    } else if (!isElectron) {
      // 只在非 Electron 环境下保存默认文件
      saveFiles(initialFiles);
    }
  }, [storedFiles, saveFiles, isElectron]);

  // 创建新文件
  const createFile = useCallback((name: string, parentId?: string) => {
    const id = generateId();
    const newFile: FileItem = {
      id,
      name,
      type: 'file',
      content: '',
      parentId
    };

    const updatedFiles = {
      ...state.files,
      [id]: newFile
    };

    setState(prev => ({
      ...prev,
      files: updatedFiles,
      activeFileId: id,
      openFiles: [...prev.openFiles, id]
    }));

    // 保存到本地存储
    saveFiles(updatedFiles);
  }, [state.files, saveFiles]);

  // 创建新文件夹
  const createFolder = useCallback((name: string, parentId?: string) => {
    const id = generateId();
    const newFolder: FileItem = {
      id,
      name,
      type: 'folder',
      children: [],
      parentId
    };

    const updatedFiles = {
      ...state.files,
      [id]: newFolder
    };

    setState(prev => ({
      ...prev,
      files: updatedFiles
    }));

    // 保存到本地存储
    saveFiles(updatedFiles);
  }, [state.files, saveFiles]);

  // 删除文件/文件夹
  const deleteItem = useCallback((id: string) => {
    const updatedFiles = { ...state.files };
    delete updatedFiles[id];
    
    setState(prev => ({
      ...prev,
      files: updatedFiles,
      openFiles: prev.openFiles.filter(fileId => fileId !== id),
      activeFileId: prev.activeFileId === id ? 
        (prev.openFiles.find(fileId => fileId !== id) || null) : 
        prev.activeFileId
    }));

    // 从本地存储删除
    deleteFile(id);
    saveFiles(updatedFiles);
  }, [state.files, deleteFile, saveFiles]);

  // 保存当前文件
  const saveCurrentFile = useCallback(async () => {
    if (!state.activeFileId || !state.files[state.activeFileId]) {
      return;
    }

    const activeFile = state.files[state.activeFileId];
    
    if (isElectron) {
      // Electron 环境：保存到文件系统
      try {
        const result = await saveFileToSystem(activeFile.content || '', currentFilePath || undefined);
        if (result.success) {
          const fileName = result.filePath?.split(/[\\\//]/). pop() || activeFile.name;
          showSuccess(`文件已保存: ${fileName}`);
        } else {
          showError(`保存失败: ${result.error || '未知错误'}`);
        }
      } catch (error) {
        showError(`保存错误: ${(error as Error).message}`);
      }
    } else {
      // Web 环境：保存到 localStorage
      saveFile(activeFile);
      showSuccess(`文件已保存: ${activeFile.name}`);
    }
  }, [state.activeFileId, state.files, isElectron, saveFileToSystem, currentFilePath, saveFile, showSuccess, showError]);

  // 另存为功能
  const saveAsCurrentFile = useCallback(async () => {
    if (!state.activeFileId || !state.files[state.activeFileId]) {
      return;
    }

    const activeFile = state.files[state.activeFileId];
    
    if (isElectron) {
      try {
        const result = await saveAs(activeFile.content || '');
        if (result.success) {
          const fileName = result.filePath?.split(/[\\\//]/).pop() || activeFile.name;
          showSuccess(`文件已另存为: ${fileName}`);
        } else {
          showError(`另存为失败: ${result.error || '未知错误'}`);
        }
      } catch (error) {
        showError(`另存为错误: ${(error as Error).message}`);
      }
    } else {
      // Web 环境下的另存为逻辑（可以实现下载功能）
      const blob = new Blob([activeFile.content || ''], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(`文件已下载: ${activeFile.name}`);
    }
  }, [state.activeFileId, state.files, isElectron, saveAs, showSuccess, showError]);

  // 设置活动文件
  const setActiveFile = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      activeFileId: id,
      openFiles: prev.openFiles.includes(id) ? 
        prev.openFiles : 
        [...prev.openFiles, id]
    }));
  }, []);

  // 切换主题
  const toggleTheme = useCallback(() => {
    setState(prev => {
      const newIsDarkMode = !prev.isDarkMode;
      localStorage.setItem('qlinknote-theme', newIsDarkMode ? 'dark' : 'light');
      return {
        ...prev,
        isDarkMode: newIsDarkMode
      };
    });
  }, []);

  // 切换预览模式
  const togglePreviewMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPreviewMode: !prev.isPreviewMode
    }));
  }, []);

  // 切换分屏模式
  const toggleSplitView = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSplitView: !prev.isSplitView
    }));
  }, []);

  // 设置搜索查询
  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query
    }));
  }, []);

  // 更新文件内容
  const updateFileContent = useCallback((id: string, content: string) => {
    const updatedFile = {
      ...state.files[id],
      content
    };

    const updatedFiles = {
      ...state.files,
      [id]: updatedFile
    };

    setState(prev => ({
      ...prev,
      files: updatedFiles
    }));

    // 保存到本地存储
    saveFile(updatedFile);
  }, [state.files, saveFile]);

  // 另存为功能
  const saveAsFile = useCallback(async () => {
    if (state.activeFileId && state.files[state.activeFileId]) {
      const file = state.files[state.activeFileId];
      
      if (isElectron) {
        const result = await saveAs(file.content || '');
        if (result.success && result.filePath) {
          console.log('文件已另存为:', result.filePath);
        }
      }
    }
  }, [state.activeFileId, state.files, isElectron, saveAs]);

  // 打开文件功能
  const openFile = useCallback((fileName: string, content: string, filePath: string) => {
    const id = generateId();
    const newFile: FileItem = {
      id,
      name: fileName,
      type: 'file',
      content,
    };

    setState(prev => ({
      ...prev,
      files: {
        ...prev.files,
        [id]: newFile
      },
      activeFileId: id,
      openFiles: [...prev.openFiles.filter(fId => fId !== id), id]
    }));

    setCurrentFilePath(filePath);
    setCurrentFileName(fileName);
  }, [setCurrentFilePath, setCurrentFileName]);

  // Electron 菜单事件处理
  useElectronMenu({
    onNewFile: () => {
      newFile();
      createFile('新文件.md');
    },
    onOpenFile: openFile,
    onSaveFile: saveCurrentFile,
    onSaveAs: saveAsFile,
    onFind: () => {
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      searchInput?.focus();
    },
    onTogglePreview: togglePreviewMode,
    onToggleSplit: toggleSplitView,
    onToggleTheme: toggleTheme
  });

  // 键盘快捷键
  useKeyboardShortcuts({
    onSave: saveCurrentFile,
    onNewFile: () => createFile('新文件.md'),
    onSearch: () => {
      // 聚焦到搜索框
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      searchInput?.focus();
    },
    onTogglePreview: togglePreviewMode,
    onToggleSplitView: toggleSplitView,
    onToggleTheme: toggleTheme
  });

  return (
    <ErrorBoundary>
      <div className="app" data-theme={state.isDarkMode ? 'dark' : 'light'}>
        <Sidebar
          files={state.files}
          activeFileId={state.activeFileId}
          searchQuery={state.searchQuery}
          onFileSelect={setActiveFile}
          onCreateFile={createFile}
          onCreateFolder={createFolder}
          onDeleteItem={deleteItem}
          onSearchChange={setSearchQuery}
          onToggleTheme={toggleTheme}
          isDarkMode={state.isDarkMode}
        />
        <Editor
          files={state.files}
          activeFileId={state.activeFileId}
          isPreviewMode={state.isPreviewMode}
          isSplitView={state.isSplitView}
          isDarkMode={state.isDarkMode}
          onContentChange={updateFileContent}
          onTogglePreview={togglePreviewMode}
          onToggleSplitView={toggleSplitView}
          onSaveFile={saveCurrentFile}
          onSaveAs={saveAsCurrentFile}
        />
      </div>
      <ToastManager toasts={toasts} onRemoveToast={removeToast} />
    </ErrorBoundary>
  );
}

export default App;