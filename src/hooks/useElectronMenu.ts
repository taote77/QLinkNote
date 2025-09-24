import { useEffect, useCallback } from 'react';

interface MenuCallbacks {
  onNewFile?: () => void;
  onOpenFile?: (fileName: string, content: string, filePath: string) => void;
  onSaveFile?: () => void;
  onSaveAs?: () => void;
  onOpenWorkspace?: () => void;
  onCloseWorkspace?: () => void;
  onFind?: () => void;
  onTogglePreview?: () => void;
  onToggleSplit?: () => void;
  onToggleTheme?: () => void;
}

export const useElectronMenu = (callbacks: MenuCallbacks) => {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  const setupMenuListeners = useCallback(() => {
    if (!isElectron || !window.electronAPI) return;

    const { electronAPI } = window;

    // 新建文件
    if (callbacks.onNewFile) {
      electronAPI.onMenuNewFile(callbacks.onNewFile);
    }

    // 打开文件
    if (callbacks.onOpenFile) {
      electronAPI.onMenuOpenFile((_, data) => {
        callbacks.onOpenFile!(data.fileName, data.content, data.filePath);
      });
    }

    // 保存文件
    if (callbacks.onSaveFile) {
      electronAPI.onMenuSaveFile(callbacks.onSaveFile);
    }

    // 另存为
    if (callbacks.onSaveAs) {
      electronAPI.onMenuSaveAs(callbacks.onSaveAs);
    }

    // 打开工作空间
    if (callbacks.onOpenWorkspace) {
      electronAPI.onMenuOpenWorkspace(callbacks.onOpenWorkspace);
    }

    // 关闭工作空间
    if (callbacks.onCloseWorkspace) {
      electronAPI.onMenuCloseWorkspace(callbacks.onCloseWorkspace);
    }

    // 查找
    if (callbacks.onFind) {
      electronAPI.onMenuFind(callbacks.onFind);
    }

    // 切换预览
    if (callbacks.onTogglePreview) {
      electronAPI.onMenuTogglePreview(callbacks.onTogglePreview);
    }

    // 切换分屏
    if (callbacks.onToggleSplit) {
      electronAPI.onMenuToggleSplit(callbacks.onToggleSplit);
    }

    // 切换主题
    if (callbacks.onToggleTheme) {
      electronAPI.onMenuToggleTheme(callbacks.onToggleTheme);
    }
  }, [callbacks, isElectron]);

  const cleanupMenuListeners = useCallback(() => {
    if (!isElectron || !window.electronAPI) return;

    const { electronAPI } = window;
    
    // 清理所有监听器
    electronAPI.removeAllListeners('menu-new-file');
    electronAPI.removeAllListeners('menu-open-file');
    electronAPI.removeAllListeners('menu-save-file');
    electronAPI.removeAllListeners('menu-save-as');
    electronAPI.removeAllListeners('menu-open-workspace');
    electronAPI.removeAllListeners('menu-close-workspace');
    electronAPI.removeAllListeners('menu-find');
    electronAPI.removeAllListeners('menu-toggle-preview');
    electronAPI.removeAllListeners('menu-toggle-split');
    electronAPI.removeAllListeners('menu-toggle-theme');
  }, [isElectron]);

  useEffect(() => {
    setupMenuListeners();
    
    return () => {
      cleanupMenuListeners();
    };
  }, [setupMenuListeners, cleanupMenuListeners]);

  return {
    isElectron
  };
};