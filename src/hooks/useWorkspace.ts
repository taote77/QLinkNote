import { useState, useCallback } from 'react';
import { FileItem, WorkspaceInfo } from '../types';
import { generateId } from '../utils/helpers';

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export const useWorkspace = () => {
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);

  // 打开工作空间文件夹
  const openWorkspace = useCallback(async (): Promise<{ success: boolean; files?: Record<string, FileItem>; workspace?: WorkspaceInfo; error?: string }> => {
    if (!isElectron) {
      return { success: false, error: '工作空间功能仅在桌面版中可用' };
    }

    try {
      const result = await window.electronAPI!.openWorkspace();
      if (result.success && result.path && result.files) {
        const workspaceInfo: WorkspaceInfo = {
          path: result.path,
          name: result.path.split(/[\\/]/).pop() || '工作空间',
          isOpen: true
        };
        
        setWorkspace(workspaceInfo);
        
        // 将文件系统文件转换为FileItem格式
        const convertedFiles = convertFSFilesToFileItems(result.files);
        
        return { 
          success: true, 
          files: convertedFiles, 
          workspace: workspaceInfo 
        };
      }
      
      return { success: false, error: result.error || '打开工作空间失败' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, []);

  // 关闭工作空间
  const closeWorkspace = useCallback(() => {
    setWorkspace(null);
  }, []);

  // 刷新工作空间文件
  const refreshWorkspace = useCallback(async (): Promise<{ success: boolean; files?: Record<string, FileItem>; error?: string }> => {
    if (!workspace || !isElectron) {
      return { success: false, error: '没有打开的工作空间' };
    }

    try {
      const result = await window.electronAPI!.readWorkspaceFiles(workspace.path);
      if (result.success && result.files) {
        const convertedFiles = convertFSFilesToFileItems(result.files);
        return { success: true, files: convertedFiles };
      }
      
      return { success: false, error: result.error || '刷新工作空间失败' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, [workspace]);

  // 在工作空间中创建新文件
  const createFileInWorkspace = useCallback(async (fileName: string, parentPath?: string): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    if (!workspace || !isElectron) {
      return { success: false, error: '没有打开的工作空间' };
    }

    try {
      const result = await window.electronAPI!.createFileInWorkspace(workspace.path, fileName, parentPath);
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, [workspace]);

  // 在工作空间中创建新文件夹
  const createFolderInWorkspace = useCallback(async (folderName: string, parentPath?: string): Promise<{ success: boolean; folderPath?: string; error?: string }> => {
    if (!workspace || !isElectron) {
      return { success: false, error: '没有打开的工作空间' };
    }

    try {
      const result = await window.electronAPI!.createFolderInWorkspace(workspace.path, folderName, parentPath);
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, [workspace]);

  return {
    workspace,
    openWorkspace,
    closeWorkspace,
    refreshWorkspace,
    createFileInWorkspace,
    createFolderInWorkspace
  };
};

// 将文件系统文件转换为FileItem格式
function convertFSFilesToFileItems(fsFiles: any[]): Record<string, FileItem> {
  const files: Record<string, FileItem> = {};
  
  function processFile(fsFile: any, parentId?: string): FileItem {
    const id = generateId();
    // const relativePath = fsFile.path.replace(workspacePath, '').replace(/^[\\/]/, '');
    
    const fileItem: FileItem = {
      id,
      name: fsFile.name,
      type: fsFile.type,
      filePath: fsFile.path,
      isWorkspaceFile: true,
      parentId
    };

    if (fsFile.type === 'file' && fsFile.content !== undefined) {
      fileItem.content = fsFile.content;
    }

    files[id] = fileItem;

    // 处理子文件和文件夹
    if (fsFile.children && fsFile.children.length > 0) {
      fileItem.children = [];
      fsFile.children.forEach((child: any) => {
        const childItem = processFile(child, id);
        fileItem.children!.push(childItem);
      });
    }

    return fileItem;
  }

  fsFiles.forEach(fsFile => {
    processFile(fsFile);
  });

  return files;
}