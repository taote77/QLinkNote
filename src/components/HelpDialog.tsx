import React from 'react';
import { X, Keyboard, FileText, Search, Palette } from 'lucide-react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            使用指南
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <Keyboard size={18} color="var(--text-accent)" />
              <h3 style={{ margin: 0, fontSize: '16px' }}>快捷键</h3>
            </div>
            <div style={{ paddingLeft: '26px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', fontSize: '14px' }}>
                <code>Ctrl + N</code><span>新建文件</span>
                <code>Ctrl + S</code><span>保存文件</span>
                <code>Ctrl + F</code><span>搜索文件</span>
                <code>Ctrl + P</code><span>切换预览模式</span>
                <code>Ctrl + \</code><span>切换分屏模式</span>
                <code>Ctrl + Shift + K</code><span>切换主题</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <FileText size={18} color="var(--text-accent)" />
              <h3 style={{ margin: 0, fontSize: '16px' }}>文件管理</h3>
            </div>
            <div style={{ paddingLeft: '26px', fontSize: '14px', lineHeight: '1.6' }}>
              <p>• 点击侧边栏的 + 按钮创建新文件或文件夹</p>
              <p>• 右键文件或文件夹进行重命名、删除等操作</p>
              <p>• 文件内容会自动保存到浏览器本地存储</p>
              <p>• 支持 Markdown 文件的实时预览</p>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <Search size={18} color="var(--text-accent)" />
              <h3 style={{ margin: 0, fontSize: '16px' }}>搜索功能</h3>
            </div>
            <div style={{ paddingLeft: '26px', fontSize: '14px', lineHeight: '1.6' }}>
              <p>• 在搜索框中输入关键词进行全文搜索</p>
              <p>• 支持搜索文件名和文件内容</p>
              <p>• 搜索结果实时更新</p>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <Palette size={18} color="var(--text-accent)" />
              <h3 style={{ margin: 0, fontSize: '16px' }}>主题与界面</h3>
            </div>
            <div style={{ paddingLeft: '26px', fontSize: '14px', lineHeight: '1.6' }}>
              <p>• 支持深色和浅色主题切换</p>
              <p>• 编辑器和预览区域可以分屏显示</p>
              <p>• 界面设计参考了 Obsidian 的简洁风格</p>
              <p>• 响应式设计，适配不同屏幕尺寸</p>
            </div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '6px',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            <strong>提示：</strong> 所有文件都会自动保存到浏览器的本地存储中，下次打开时会恢复之前的工作状态。
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpDialog;