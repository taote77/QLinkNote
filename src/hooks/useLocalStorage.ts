import { useState, useEffect } from 'react';
import { FileItem } from '../types';

const STORAGE_KEY = 'qlinknote-files';

export const useLocalStorage = () => {
  const [files, setFiles] = useState<Record<string, FileItem>>({});

  // 从本地存储加载文件
  const loadFiles = () => {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || !window.localStorage) {
        return {};
      }
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedFiles = JSON.parse(stored);
        setFiles(parsedFiles);
        return parsedFiles;
      }
    } catch (error) {
      console.error('Failed to load files from localStorage:', error);
    }
    return {};
  };

  // 保存文件到本地存储
  const saveFiles = (filesToSave: Record<string, FileItem>) => {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('localStorage not available');
        return;
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filesToSave));
      setFiles(filesToSave);
    } catch (error) {
      console.error('Failed to save files to localStorage:', error);
    }
  };

  // 保存单个文件
  const saveFile = (file: FileItem) => {
    const updatedFiles = {
      ...files,
      [file.id]: file
    };
    saveFiles(updatedFiles);
  };

  // 删除文件
  const deleteFile = (fileId: string) => {
    const updatedFiles = { ...files };
    delete updatedFiles[fileId];
    saveFiles(updatedFiles);
  };

  // 初始化时加载文件
  useEffect(() => {
    // 延迟加载，确保在客户端环境中
    const timer = setTimeout(() => {
      loadFiles();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return {
    files,
    loadFiles,
    saveFiles,
    saveFile,
    deleteFile
  };
};