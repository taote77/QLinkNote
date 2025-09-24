export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileItem[];
  parentId?: string;
  filePath?: string; // 实际文件系统路径
  isWorkspaceFile?: boolean; // 是否来自工作空间
}

export interface WorkspaceInfo {
  path: string;
  name: string;
  isOpen: boolean;
}

export interface EditorState {
  activeFileId: string | null;
  files: Record<string, FileItem>;
  openFiles: string[];
  searchQuery: string;
  isDarkMode: boolean;
  isPreviewMode: boolean;
  isSplitView: boolean;
  workspace: WorkspaceInfo | null;
}