import React, { useState, useRef } from 'react';
import { FileItem, WorkspaceInfo } from '../types';
import InputDialog from './InputDialog';
import { 
  Search, 
  FileText, 
  Folder, 
  FolderOpen,
  Plus, 
  Moon, 
  Sun,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  X
} from 'lucide-react';

interface SidebarProps {
  files: Record<string, FileItem>;
  activeFileId: string | null;
  searchQuery: string;
  workspace: WorkspaceInfo | null;
  onFileSelect: (id: string) => void;
  onCreateFile: (name: string, parentId?: string) => void;
  onCreateFolder: (name: string, parentId?: string) => void;
  onDeleteItem: (id: string) => void;
  onRenameItem: (id: string, newName: string) => void;
  onSearchChange: (query: string) => void;
  onToggleTheme: () => void;
  onOpenWorkspace?: () => void;
  onCloseWorkspace?: () => void;
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  searchQuery,
  workspace,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDeleteItem,
  onRenameItem,
  onSearchChange,
  onToggleTheme,
  onOpenWorkspace,
  onCloseWorkspace,
  isDarkMode
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [inputDialog, setInputDialog] = useState<{ isOpen: boolean; type: 'file' | 'folder'; title: string; placeholder: string; parentId?: string } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const handleCreateFile = (parentId?: string) => {
    setInputDialog({
      isOpen: true,
      type: 'file',
      title: parentId ? '在文件夹中新建文件' : '新建文件',
      placeholder: '请输入文件名',
      parentId
    });
  };

  const handleCreateFolder = (parentId?: string) => {
    setInputDialog({
      isOpen: true,
      type: 'folder',
      title: parentId ? '在文件夹中新建子文件夹' : '新建文件夹',
      placeholder: '请输入文件夹名',
      parentId
    });
  };

  const handleInputConfirm = (name: string) => {
    if (inputDialog) {
      if (inputDialog.type === 'file') {
        onCreateFile(name.endsWith('.md') ? name : `${name}.md`, inputDialog.parentId);
      } else {
        onCreateFolder(name, inputDialog.parentId);
        // 自动展开新创建的文件夹的父文件夹
        if (inputDialog.parentId) {
          setExpandedFolders(prev => new Set([...prev, inputDialog.parentId!]));
        }
      }
    }
    setInputDialog(null);
  };

  const handleInputCancel = () => {
    setInputDialog(null);
  };

  const handleRightClick = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleAddFileToFolder = (folderId: string) => {
    handleCreateFile(folderId);
    setContextMenu(null);
  };

  const handleAddFolderToFolder = (folderId: string) => {
    handleCreateFolder(folderId);
    setContextMenu(null);
  };

  const handleRename = (fileId: string) => {
    const file = files[fileId];
    if (file) {
      setEditingId(fileId);
      setEditingName(file.name);
    }
    setContextMenu(null);
  };

  const handleRenameSubmit = (fileId: string) => {
    if (editingName.trim() && files[fileId]) {
      onRenameItem(fileId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (fileId: string) => {
    if (window.confirm('确定要删除这个文件吗？')) {
      onDeleteItem(fileId);
    }
    setContextMenu(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, fileId: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(fileId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingName('');
    }
  };

  // 点击其他地方关闭上下文菜单
  React.useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // 获取文件夹的子项
  const getChildItems = (parentId: string): FileItem[] => {
    return Object.values(files)
      .filter(item => item.parentId === parentId)
      .sort((a, b) => {
        // 文件夹排在前面，然后按名称排序
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  };

  // 获取根级文件和文件夹
  const rootItems = Object.values(files)
    .filter(item => !item.parentId)
    .sort((a, b) => {
      // 文件夹排在前面，然后按名称排序
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

  // 递归搜索函数
  const searchInItems = (items: FileItem[], query: string): FileItem[] => {
    const result: FileItem[] = [];
    
    for (const item of items) {
      const matchesName = item.name.toLowerCase().includes(query.toLowerCase());
      const matchesContent = item.content && item.content.toLowerCase().includes(query.toLowerCase());
      
      if (matchesName || matchesContent) {
        result.push(item);
      }
      
      // 如果是文件夹，递归搜索子项
      if (item.type === 'folder') {
        const childItems = getChildItems(item.id);
        const matchingChildren = searchInItems(childItems, query);
        result.push(...matchingChildren);
      }
    }
    
    return result;
  };

  // 过滤文件基于搜索查询
  const filteredItems = searchQuery 
    ? searchInItems(rootItems, searchQuery)
    : rootItems;

  const renderFileItem = (item: FileItem, depth: number = 0) => {
    const isActive = item.id === activeFileId;
    const isEditing = editingId === item.id;
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = item.type === 'folder' && getChildItems(item.id).length > 0;
    
    return (
      <div key={item.id}>
        <div
          className={`file-item ${isActive ? 'active' : ''}`}
          onClick={() => {
            if (item.type === 'file' && !isEditing) {
              onFileSelect(item.id);
            } else if (item.type === 'folder') {
              toggleFolder(item.id);
            }
          }}
          onContextMenu={(e) => handleRightClick(e, item.id)}
          style={{ 
            position: 'relative',
            paddingLeft: `${depth * 20 + 12}px`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {/* 展开/折叠箭头 */}
          {item.type === 'folder' && (
            <div
              style={{
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.id);
              }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown size={12} style={{ color: 'var(--text-secondary)' }} />
                ) : (
                  <ChevronRight size={12} style={{ color: 'var(--text-secondary)' }} />
                )
              ) : (
                <div style={{ width: '12px', height: '12px' }} />
              )}
            </div>
          )}
          
          {/* 文件/文件夹图标 */}
          <div className="icon" style={{ flexShrink: 0 }}>
            {item.type === 'folder' ? (
              isExpanded ? (
                <FolderOpen size={16} />
              ) : (
                <Folder size={16} />
              )
            ) : (
              <FileText size={16} />
            )}
          </div>
          
          {/* 名称或编辑输入框 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRenameSubmit(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                autoFocus
                style={{
                  background: 'transparent',
                  border: '1px solid var(--text-accent)',
                  color: 'var(--text-primary)',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  fontSize: '14px',
                  width: '100%'
                }}
              />
            ) : (
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}>
                {item.name}
              </span>
            )}
          </div>
        </div>
        
        {/* 渲染子项 */}
        {item.type === 'folder' && isExpanded && (
          <div>
            {getChildItems(item.id).map(child => renderFileItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>QLinkNote</h2>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button className="button" onClick={onToggleTheme} title="切换主题" style={{ padding: '6px' }}>
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="button" onClick={() => handleCreateFile()} title="新建文件" style={{ padding: '6px 8px' }}>
            <FileText size={16} />
          </button>
          <button className="button" onClick={() => handleCreateFolder()} title="新建文件夹" style={{ padding: '6px 8px' }}>
            <Folder size={16} />
          </button>
          {onOpenWorkspace && !workspace && (
            <button className="button" onClick={onOpenWorkspace} title="打开工作空间" style={{ padding: '6px 8px' }}>
              <FolderPlus size={16} />
            </button>
          )}
        </div>
      </div>
      
      {/* 工作空间信息 */}
      {workspace && (
        <div style={{ 
          padding: '8px 16px',
          backgroundColor: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FolderOpen size={14} />
            <span>工作空间: {workspace.name}</span>
          </div>
          {onCloseWorkspace && (
            <button 
              className="button" 
              onClick={onCloseWorkspace} 
              title="关闭工作空间"
              style={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}
      
      <div style={{ padding: '12px 16px' }}>
        <div style={{ position: 'relative' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '8px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }} 
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索文件..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
            style={{ paddingLeft: '32px' }}
          />
        </div>
      </div>

      <div className="file-tree">
        {filteredItems.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            {searchQuery ? '未找到匹配的文件' : '暂无文件'}
          </div>
        ) : (
          searchQuery ? (
            // 搜索模式：平铺显示所有匹配项
            filteredItems.map(item => renderFileItem(item, 0))
          ) : (
            // 正常模式：树形结构显示
            filteredItems.map(item => renderFileItem(item, 0))
          )
        )}
      </div>

      {/* 右键上下文菜单 */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '160px',
            overflow: 'hidden'
          }}
        >
          {/* 如果是文件夹，显示添加子项的选项 */}
          {files[contextMenu.fileId]?.type === 'folder' && (
            <>
              <div
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  transition: 'background-color 0.15s ease'
                }}
                onClick={() => handleAddFileToFolder(contextMenu.fileId)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-color)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Plus size={14} />
                <FileText size={14} />
                新建文件
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  transition: 'background-color 0.15s ease'
                }}
                onClick={() => handleAddFolderToFolder(contextMenu.fileId)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-color)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Plus size={14} />
                <Folder size={14} />
                新建文件夹
              </div>
              <div style={{
                height: '1px',
                backgroundColor: 'var(--border-color)',
                margin: '4px 0'
              }} />
            </>
          )}
          
          <div
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              transition: 'background-color 0.15s ease'
            }}
            onClick={() => handleRename(contextMenu.fileId)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-color)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Edit3 size={14} />
            重命名
          </div>
          <div
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#e74c3c',
              transition: 'background-color 0.15s ease'
            }}
            onClick={() => handleDelete(contextMenu.fileId)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-color)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Trash2 size={14} />
            删除
          </div>
        </div>
      )}

      {/* 输入对话框 */}
      <InputDialog
        isOpen={inputDialog?.isOpen || false}
        title={inputDialog?.title || ''}
        placeholder={inputDialog?.placeholder || ''}
        onConfirm={handleInputConfirm}
        onCancel={handleInputCancel}
      />
    </div>
  );
};

export default Sidebar;