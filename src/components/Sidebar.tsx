import React, { useState, useRef } from 'react';
import { FileItem } from '../types';
import InputDialog from './InputDialog';
import { 
  Search, 
  FileText, 
  Folder, 
  Plus, 
  Moon, 
  Sun,
  Edit3,
  Trash2
} from 'lucide-react';

interface SidebarProps {
  files: Record<string, FileItem>;
  activeFileId: string | null;
  searchQuery: string;
  onFileSelect: (id: string) => void;
  onCreateFile: (name: string, parentId?: string) => void;
  onCreateFolder: (name: string, parentId?: string) => void;
  onDeleteItem: (id: string) => void;
  onSearchChange: (query: string) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  searchQuery,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDeleteItem,
  onSearchChange,
  onToggleTheme,
  isDarkMode
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [inputDialog, setInputDialog] = useState<{ isOpen: boolean; type: 'file' | 'folder'; title: string; placeholder: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const handleCreateFile = () => {
    setInputDialog({
      isOpen: true,
      type: 'file',
      title: '新建文件',
      placeholder: '请输入文件名'
    });
  };

  const handleCreateFolder = () => {
    setInputDialog({
      isOpen: true,
      type: 'folder',
      title: '新建文件夹',
      placeholder: '请输入文件夹名'
    });
  };

  const handleInputConfirm = (name: string) => {
    if (inputDialog) {
      if (inputDialog.type === 'file') {
        onCreateFile(name.endsWith('.md') ? name : `${name}.md`);
      } else {
        onCreateFolder(name);
      }
    }
    setInputDialog(null);
  };

  const handleInputCancel = () => {
    setInputDialog(null);
  };

  const handleRightClick = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
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
      // 此处需要在 App 组件中实现 rename 功能
      console.log('Rename file:', fileId, 'to:', editingName);
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

  // 获取根级文件和文件夹
  const rootItems = Object.values(files).filter(item => !item.parentId);

  // 过滤文件基于搜索查询
  const filteredItems = rootItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderFileItem = (item: FileItem) => {
    const isActive = item.id === activeFileId;
    const isEditing = editingId === item.id;
    
    return (
      <div
        key={item.id}
        className={`file-item ${isActive ? 'active' : ''}`}
        onClick={() => item.type === 'file' && !isEditing && onFileSelect(item.id)}
        onContextMenu={(e) => handleRightClick(e, item.id)}
        style={{ position: 'relative' }}
      >
        <div className="icon">
          {item.type === 'folder' ? (
            <Folder size={16} />
          ) : (
            <FileText size={16} />
          )}
        </div>
        
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
          <span>{item.name}</span>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>QLinkNote</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="button" onClick={onToggleTheme} title="切换主题">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="button" onClick={handleCreateFile} title="新建文件">
            <Plus size={16} />
            <FileText size={14} />
          </button>
          <button className="button" onClick={handleCreateFolder} title="新建文件夹">
            <Plus size={16} />
            <Folder size={14} />
          </button>
        </div>
      </div>
      
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
          filteredItems.map(renderFileItem)
        )}
      </div>

      {/* 右键上下文菜单 */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '120px'
          }}
        >
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