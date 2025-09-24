import { useState, useCallback } from 'react';

// 检查是否在 Electron 环境中
const isElectron = typeof window !== 'undefined' && window.electronAPI;

// 扩展 Window 接口以包含 electronAPI
declare global {
  interface Window {
    electronAPI?: {
      saveFile: (content: string, filePath?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      onMenuNewFile: (callback: () => void) => void;
      onMenuOpenFile: (callback: (event: any, data: { fileName: string; content: string; filePath: string }) => void) => void;
      onMenuSaveFile: (callback: () => void) => void;
      onMenuSaveAs: (callback: () => void) => void;
      onMenuFind: (callback: () => void) => void;
      onMenuTogglePreview: (callback: () => void) => void;
      onMenuToggleSplit: (callback: () => void) => void;
      onMenuToggleTheme: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
      platform: string;
      getVersion: () => string;
    };
  }
}

export const useElectronFileSystem = () => {
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('未命名文件.md');

  // 保存文件到本地文件系统
  const saveFileToSystem = useCallback(async (content: string, filePath?: string) => {
    if (!isElectron) {
      console.warn('Not in Electron environment, using localStorage fallback');
      return { success: false, error: 'Not in Electron environment' };
    }

    try {
      const result = await window.electronAPI!.saveFile(content, filePath);
      if (result.success && result.filePath) {
        setCurrentFilePath(result.filePath);
        const fileName = result.filePath.split(/[\\/]/).pop() || '未命名文件.md';
        setCurrentFileName(fileName);
      }
      return result;
    } catch (error) {
      console.error('Error saving file:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  // 从本地文件系统读取文件
  const readFileFromSystem = useCallback(async (filePath: string) => {
    if (!isElectron) {
      console.warn('Not in Electron environment');
      return { success: false, error: 'Not in Electron environment' };
    }

    try {
      const result = await window.electronAPI!.readFile(filePath);
      if (result.success) {
        setCurrentFilePath(filePath);
        const fileName = filePath.split(/[\\/]/).pop() || '未命名文件.md';
        setCurrentFileName(fileName);
      }
      return result;
    } catch (error) {
      console.error('Error reading file:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  // 新建文件
  const newFile = useCallback(() => {
    setCurrentFilePath(null);
    setCurrentFileName('未命名文件.md');
  }, []);

  // 另存为
  const saveAs = useCallback(async (content: string) => {
    return await saveFileToSystem(content); // 不传 filePath，触发另存为对话框
  }, [saveFileToSystem]);

  return {
    isElectron,
    currentFilePath,
    currentFileName,
    saveFileToSystem,
    readFileFromSystem,
    newFile,
    saveAs,
    setCurrentFilePath,
    setCurrentFileName
  };
};