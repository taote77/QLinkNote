export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileItem[];
  parentId?: string;
  filePath?: string; // 实际文件系统路径
  isWorkspaceFile?: boolean; // 是否来自工作空间
  links?: string[]; // 链接到其他文件的ID列表
  backlinks?: string[]; // 被其他文件链接的文件ID列表
  isExpanded?: boolean; // 文件夹是否展开
}

export interface NoteLink {
  sourceFileId: string;
  targetFileId: string;
  linkText: string;
  lineNumber?: number;
}

export interface WorkspaceMetadata {
  name: string;
  createdAt: string;
  lastOpened: string;
  version: string;
  settings?: {
    theme?: string;
    layout?: any;
  };
}

export interface WorkspaceInfo {
  path: string;
  name: string;
  isOpen: boolean;
  metadata?: WorkspaceMetadata;
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
  noteLinks: Record<string, NoteLink>; // 笔记链接映射
}