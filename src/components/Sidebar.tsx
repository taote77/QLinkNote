import React, { useState, useRef } from 'react';
import { FileItem, WorkspaceInfo, NoteLink } from '../types';
import { ActivityBarItem } from './ActivityBar';
// import GraphView from './GraphView'; // 暂时未使用
import SearchPanel from './SearchPanel';
import SettingsPanel from './SettingsPanel';
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
  FolderPlus
} from 'lucide-react';

interface SidebarProps {
  files: Record<string, FileItem>;
  activeFileId: string | null;
  searchQuery: string;
  workspace: WorkspaceInfo | null;
  noteLinks?: Record<string, NoteLink>;
  activeActivityItem: ActivityBarItem;
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
  // noteLinks, // 暂时未使用
  activeActivityItem,
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

  // 获取文件夹的子项（优化排序）
  const getChildItems = (parentId: string): FileItem[] => {
    return Object.values(files)
      .filter(item => item.parentId === parentId)
      .sort((a, b) => {
        // 文件夹排在前面
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        // 然后按名称排序（不区分大小写）
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
  };

  // 获取根级文件和文件夹（优化排序）
  const rootItems = Object.values(files)
    .filter(item => !item.parentId)
    .sort((a, b) => {
      // 文件夹排在前面
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      // 然后按名称排序（不区分大小写）
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

  // 递归搜索函数（改进搜索算法）
  const searchInItems = (items: FileItem[], query: string): FileItem[] => {
    const result: FileItem[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const item of items) {
      const matchesName = item.name.toLowerCase().includes(lowerQuery);
      const matchesContent = item.content && item.content.toLowerCase().includes(lowerQuery);
      
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

  const renderFileItem = (item: FileItem, depth: number = 0, isSearchMode: boolean = false) => {
    const isActive = item.id === activeFileId;
    const isEditing = editingId === item.id;
    const isExpanded = expandedFolders.has(item.id) || (isSearchMode && item.type === 'folder');
    const hasChildren = item.type === 'folder' && getChildItems(item.id).length > 0;
    
    // 在搜索模式下自动展开匹配的文件夹
    const shouldShowChildren = isExpanded || (isSearchMode && hasChildren);
    
    const handleItemClick = () => {
      if (item.type === 'file' && !isEditing) {
        onFileSelect(item.id);
      } else if (item.type === 'folder' && !isSearchMode) {
        toggleFolder(item.id);
      }
    };
    
    const handleArrowClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFolder(item.id);
    };
    
    return (
      <div key={item.id} className="file-tree-item">
        <div
          className={`file-item ${isActive ? 'active' : ''} ${item.type === 'folder' ? 'folder' : ''}`}
          onClick={handleItemClick}
          onContextMenu={(e) => handleRightClick(e, item.id)}
          style={{ 
            position: 'relative',
            paddingLeft: `${depth * 20 + 12}px`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            minHeight: '32px'
          }}
        >
          {/* 展开/折叠箭头 */}
          {item.type === 'folder' && (
            <div
              className="folder-arrow"
              style={{
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: hasChildren ? 1 : 0.3
              }}
              onClick={handleArrowClick}
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
          
          {/* 非文件夹的缩进占位符 */}
          {item.type === 'file' && (
            <div style={{ width: '16px', height: '16px' }} />
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
          <div className="file-name" style={{ flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRenameSubmit(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                autoFocus
                className="file-name-input"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--text-accent)',
                  color: 'var(--text-primary)',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  fontSize: '14px'
                }}
              />
            ) : (
              <span className="file-name-text" style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                fontSize: '14px'
              }}>
                {item.name}
              </span>
            )}
          </div>
          
          {/* 工作空间文件标识 */}
          {item.isWorkspaceFile && (
            <div 
              className="workspace-indicator"
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'var(--text-accent)',
                opacity: 0.6
              }}
              title="工作空间文件"
            />
          )}
        </div>
        
        {/* 渲染子项 */}
        {item.type === 'folder' && shouldShowChildren && (
          <div className="file-tree-children">
            {getChildItems(item.id).map(child => 
              renderFileItem(child, depth + 1, isSearchMode)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFileTree = () => {
    const isSearchMode = !!searchQuery;
    
    return (
      <div className="file-tree">
        {filteredItems.length === 0 ? (
          <div className="file-tree-empty" style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            {searchQuery ? '未找到匹配的文件' : '暂无文件'}
            {!searchQuery && !workspace && (
              <div style={{ marginTop: '12px', fontSize: '12px' }}>
                <div>可以点击上方按钮创建文件</div>
                <div>或者打开工作空间文件夹</div>
              </div>
            )}
          </div>
        ) : (
          <div className="file-tree-content">
            {isSearchMode ? (
              // 搜索模式：展开显示所有匹配的项目
              <div className="search-results">
                <div className="search-results-header" style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '4px'
                }}>
                  找到 {filteredItems.length} 个结果
                </div>
                {filteredItems.map(item => renderFileItem(item, 0, true))}
              </div>
            ) : (
              // 正常模式：树形结构显示
              <div className="file-tree-normal">
                {filteredItems.map(item => renderFileItem(item, 0, false))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 渲染不同面板的内容
  const renderContent = () => {
    switch (activeActivityItem) {
      case 'files':
        return (
          <>
            <div className="sidebar-header">
              <h2>文件管理</h2>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className="button"
                  onClick={() => handleCreateFile()}
                  title="新建文件"
                >
                  <FileText size={16} />
                </button>
                <button
                  className="button"
                  onClick={() => handleCreateFolder()}
                  title="新建文件夹"
                >
                  <FolderPlus size={16} />
                </button>
                <button
                  className="button"
                  onClick={onToggleTheme}
                  title="切换主题"
                >
                  {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>
            </div>

            <div style={{ padding: '0 16px', marginBottom: '12px' }}>
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="搜索文件..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>

            {workspace && (
              <div className="workspace-info">
                <div className="workspace-header">
                  <span className="workspace-name">{workspace.name}</span>
                  <button
                    className="workspace-close-button"
                    onClick={onCloseWorkspace}
                    title="关闭工作空间"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {!workspace && (
              <div className="workspace-section">
                <button className="workspace-open-button" onClick={onOpenWorkspace}>
                  📁 打开工作空间
                </button>
              </div>
            )}

            <div className="file-tree">
              {renderFileTree()}
            </div>
          </>
        );

      case 'search':
        return (
          <>
            <div className="sidebar-header">
              <h2>全局搜索</h2>
            </div>
            <SearchPanel
              files={files}
              onFileSelect={onFileSelect}
              isDarkMode={isDarkMode}
            />
          </>
        );

      case 'settings':
        return (
          <>
            <div className="sidebar-header">
              <h2>设置</h2>
            </div>
            <SettingsPanel
              isDarkMode={isDarkMode}
              onToggleTheme={onToggleTheme}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="sidebar">
      {renderContent()}

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