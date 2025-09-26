import { useState, useCallback, useEffect } from 'react';
import { FileItem, EditorState } from './types';
import ActivityBar, { ActivityBarItem } from './components/ActivityBar';
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
import { useWorkspace } from './hooks/useWorkspace';
import { useNoteLinks } from './hooks/useNoteLinks';

const initialFiles: Record<string, FileItem> = {
  'welcome': {
    id: 'welcome',
    name: 'Welcome.md',
    type: 'file',
    content: `# 欢迎使用 QLinkNote

这是一个参考 [[Obsidian]] 设计的 Markdown 编辑器。

## 特性

- 📝 实时 Markdown 编辑和预览
- 📁 文件管理系统
- 🔍 全文搜索功能
- 🌓 深色/浅色主题切换
- ⚡ 快捷键支持
- 💾 自动保存功能
- 🔗 **笔记链接系统** - 支持 [[文件名]] 链接语法

## 快捷键

- \`Ctrl + N\`: 新建文件
- \`Ctrl + S\`: 保存文件
- \`Ctrl + F\`: 搜索
- \`Ctrl + P\`: 切换预览模式
- \`Ctrl + \\\`: 切换分屏模式

## 开始使用

1. 尝试创建新文件
2. 使用 [[文件名]] 语法创建链接
3. 在预览模式中点击链接进行跳转

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
  const { 
    workspace,
    openWorkspace,
    closeWorkspace,
    refreshWorkspace,
    createFileInWorkspace,
    createFolderInWorkspace
  } = useWorkspace();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const {
    updateFileLinks,
    renderLinkedContent,
    getFileConnections,
    suggestLinks
  } = useNoteLinks();
  
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
      isSplitView: true,
      workspace: null,
      noteLinks: {}
    };
  });

  const [activeActivityItem, setActiveActivityItem] = useState<ActivityBarItem>('files');
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);

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

  // 同步工作空间状态
  useEffect(() => {
    setState(prev => ({
      ...prev,
      workspace
    }));
  }, [workspace]);

  // 创建新文件
  const createFile = useCallback(async (name: string, parentId?: string) => {
    // 检查是否是在工作空间文件夹中创建
    const parentItem = parentId ? state.files[parentId] : null;
    const isInWorkspace = parentItem?.isWorkspaceFile || (state.workspace && !parentId);
    
    if (isInWorkspace && state.workspace) {
      // 在工作空间中创建文件
      const parentPath = parentItem?.filePath;
      const result = await createFileInWorkspace(name, parentPath);
      if (result.success) {
        // 刷新工作空间
        const refreshResult = await refreshWorkspace();
        if (refreshResult.success && refreshResult.files) {
          setState(prev => {
            const newFiles = { ...prev.files };
            // 移除旧的工作空间文件
            Object.keys(newFiles).forEach(id => {
              if (newFiles[id].isWorkspaceFile) {
                delete newFiles[id];
              }
            });
            // 添加新的工作空间文件
            return {
              ...prev,
              files: { ...newFiles, ...refreshResult.files }
            };
          });
        }
        showSuccess(`文件已创建: ${name}`);
      } else {
        showError(result.error || '创建文件失败');
      }
    } else {
      // 在应用内创建文件
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
    }
  }, [state.files, state.workspace, createFileInWorkspace, refreshWorkspace, saveFiles, showSuccess, showError]);

  // 创建新文件夹
  const createFolder = useCallback(async (name: string, parentId?: string) => {
    // 检查是否是在工作空间文件夹中创建
    const parentItem = parentId ? state.files[parentId] : null;
    const isInWorkspace = parentItem?.isWorkspaceFile || (state.workspace && !parentId);
    
    if (isInWorkspace && state.workspace) {
      // 在工作空间中创建文件夹
      const parentPath = parentItem?.filePath;
      const result = await createFolderInWorkspace(name, parentPath);
      if (result.success) {
        // 刷新工作空间
        const refreshResult = await refreshWorkspace();
        if (refreshResult.success && refreshResult.files) {
          setState(prev => {
            const newFiles = { ...prev.files };
            // 移除旧的工作空间文件
            Object.keys(newFiles).forEach(id => {
              if (newFiles[id].isWorkspaceFile) {
                delete newFiles[id];
              }
            });
            // 添加新的工作空间文件
            return {
              ...prev,
              files: { ...newFiles, ...refreshResult.files }
            };
          });
        }
        showSuccess(`文件夹已创建: ${name}`);
      } else {
        showError(result.error || '创建文件夹失败');
      }
    } else {
      // 在应用内创建文件夹
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
    }
  }, [state.files, state.workspace, createFolderInWorkspace, refreshWorkspace, saveFiles, showSuccess, showError]);

  // 打开工作空间
  const handleOpenWorkspace = useCallback(async () => {
    const result = await openWorkspace();
    if (result.success && result.files && result.workspace) {
      setState(prev => ({
        ...prev,
        files: { ...prev.files, ...result.files },
        workspace: result.workspace || null
      }));
      showSuccess(`工作空间已打开: ${result.workspace.name}`);
    } else {
      showError(result.error || '打开工作空间失败');
    }
  }, [openWorkspace, showSuccess, showError]);

  // 关闭工作空间
  const handleCloseWorkspace = useCallback(() => {
    // 移除工作空间文件
    setState(prev => {
      const newFiles = { ...prev.files };
      Object.keys(newFiles).forEach(id => {
        if (newFiles[id].isWorkspaceFile) {
          delete newFiles[id];
        }
      });
      
      return {
        ...prev,
        files: newFiles,
        workspace: null,
        openFiles: prev.openFiles.filter(id => newFiles[id]),
        activeFileId: prev.activeFileId && newFiles[prev.activeFileId] ? prev.activeFileId : 
          (Object.keys(newFiles).find(id => prev.openFiles.includes(id)) || null)
      };
    });
    
    closeWorkspace();
    showSuccess('工作空间已关闭');
  }, [closeWorkspace, showSuccess]);

  // 重命名文件/文件夹
  const renameItem = useCallback((id: string, newName: string) => {
    const item = state.files[id];
    if (!item || !newName.trim()) return;

    // 如果是文件，确保有 .md 后缀
    const finalName = item.type === 'file' && !newName.endsWith('.md') ? `${newName}.md` : newName;
    
    const updatedItem = {
      ...item,
      name: finalName
    };

    const updatedFiles = {
      ...state.files,
      [id]: updatedItem
    };

    setState(prev => ({
      ...prev,
      files: updatedFiles
    }));

    // 保存到本地存储
    saveFile(updatedItem);
    saveFiles(updatedFiles);
    
    showSuccess(`${item.type === 'folder' ? '文件夹' : '文件'}已重命名为: ${finalName}`);
  }, [state.files, saveFile, saveFiles, showSuccess]);

  // 删除文件/文件夹
  const deleteItem = useCallback((id: string) => {
    const item = state.files[id];
    if (!item) return;
    
    // 递归删除文件夹及其子项
    const deleteRecursive = (itemId: string, files: Record<string, FileItem>) => {
      const itemToDelete = files[itemId];
      if (!itemToDelete) return files;
      
      let updatedFiles = { ...files };
      
      // 如果是文件夹，先删除所有子项
      if (itemToDelete.type === 'folder') {
        const children = Object.values(files).filter(f => f.parentId === itemId);
        children.forEach(child => {
          updatedFiles = deleteRecursive(child.id, updatedFiles);
        });
      }
      
      // 删除项目本身
      delete updatedFiles[itemId];
      return updatedFiles;
    };
    
    const updatedFiles = deleteRecursive(id, state.files);
    
    setState(prev => ({
      ...prev,
      files: updatedFiles,
      openFiles: prev.openFiles.filter(fileId => updatedFiles[fileId]),
      activeFileId: !updatedFiles[prev.activeFileId!] ? 
        (prev.openFiles.find(fId => updatedFiles[fId]) || null) : 
        prev.activeFileId
    }));

    // 从本地存储删除
    deleteFile(id);
    saveFiles(updatedFiles);
    
    showSuccess(`${item.type === 'folder' ? '文件夹' : '文件'}已删除`);
  }, [state.files, deleteFile, saveFiles, showSuccess]);

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

    // 更新链接关系
    const { updatedFiles, noteLinks } = updateFileLinks(id, content, {
      ...state.files,
      [id]: updatedFile
    });

    setState(prev => ({
      ...prev,
      files: updatedFiles,
      noteLinks: { ...prev.noteLinks, ...noteLinks }
    }));

    // 保存到本地存储
    saveFile(updatedFile);
    saveFiles(updatedFiles);
  }, [state.files, updateFileLinks, saveFile, saveFiles]);

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
    onOpenWorkspace: handleOpenWorkspace,
    onCloseWorkspace: handleCloseWorkspace,
    onFind: () => {
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      searchInput?.focus();
    },
    onTogglePreview: togglePreviewMode,
    onToggleSplit: toggleSplitView,
    onToggleTheme: toggleTheme
  });

  // 处理侧边栏拖拽调整大小
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.max(200, Math.min(500, e.clientX - 48)); // 48是ActivityBar的宽度
    setSidebarWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

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
        <ActivityBar
          activeItem={activeActivityItem}
          onItemChange={setActiveActivityItem}
          isDarkMode={state.isDarkMode}
        />
        <div className="main-layout">
          <div 
            className="sidebar-container"
            style={{ width: sidebarWidth }}
          >
            <Sidebar
              files={state.files}
              activeFileId={state.activeFileId}
              searchQuery={state.searchQuery}
              workspace={state.workspace}
              activeActivityItem={activeActivityItem}
              onFileSelect={setActiveFile}
              onCreateFile={createFile}
              onCreateFolder={createFolder}
              onDeleteItem={deleteItem}
              onRenameItem={renameItem}
              onSearchChange={setSearchQuery}
              onToggleTheme={toggleTheme}
              onOpenWorkspace={handleOpenWorkspace}
              onCloseWorkspace={handleCloseWorkspace}
              isDarkMode={state.isDarkMode}
            />
          </div>
          <div 
            className="sidebar-resizer"
            onMouseDown={handleMouseDown}
            style={{ cursor: isResizing ? 'col-resize' : 'col-resize' }}
          />
          <div className="editor-container">
            <Editor
              files={state.files}
              activeFileId={state.activeFileId}
              isPreviewMode={state.isPreviewMode}
              isSplitView={state.isSplitView}
              isDarkMode={state.isDarkMode}
              noteLinks={state.noteLinks}
              onContentChange={updateFileContent}
              onTogglePreview={togglePreviewMode}
              onToggleSplitView={toggleSplitView}
              onSaveFile={saveCurrentFile}
              onSaveAs={saveAsCurrentFile}
              onNoteLink={setActiveFile}
              renderLinkedContent={renderLinkedContent}
              getFileConnections={getFileConnections}
              suggestLinks={suggestLinks}
            />
          </div>
        </div>
      </div>
      <ToastManager toasts={toasts} onRemoveToast={removeToast} />
    </ErrorBoundary>
  );
}

export default App;