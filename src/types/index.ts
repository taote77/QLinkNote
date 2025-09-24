export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileItem[];
  parentId?: string;
}

export interface EditorState {
  activeFileId: string | null;
  files: Record<string, FileItem>;
  openFiles: string[];
  searchQuery: string;
  isDarkMode: boolean;
  isPreviewMode: boolean;
  isSplitView: boolean;
}