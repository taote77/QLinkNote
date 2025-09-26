import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface SettingsPanelProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isDarkMode,
  onToggleTheme
}) => {
  return (
    <div className="settings-panel">
      <div className="settings-section">
        <h3>外观设置</h3>
        
        <div className="settings-item">
          <label className="settings-label">主题模式</label>
          <div className="theme-selector">
            <button 
              className={`theme-option ${!isDarkMode ? 'active' : ''}`}
              onClick={!isDarkMode ? undefined : onToggleTheme}
              title="浅色主题"
            >
              <Sun size={16} />
              <span>浅色</span>
            </button>
            <button 
              className={`theme-option ${isDarkMode ? 'active' : ''}`}
              onClick={isDarkMode ? undefined : onToggleTheme}
              title="深色主题"
            >
              <Moon size={16} />
              <span>深色</span>
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>编辑器设置</h3>
        
        <div className="settings-item">
          <label className="settings-label">
            字体大小
            <select className="settings-select">
              <option value="12">12px</option>
              <option value="13">13px</option>
              <option value="14" selected>14px (默认)</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
            </select>
          </label>
        </div>

        <div className="settings-item">
          <label className="settings-checkbox">
            <input type="checkbox" defaultChecked />
            <span className="checkmark"></span>
            自动保存
          </label>
        </div>

        <div className="settings-item">
          <label className="settings-checkbox">
            <input type="checkbox" defaultChecked />
            <span className="checkmark"></span>
            显示行号
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>链接设置</h3>
        
        <div className="settings-item">
          <label className="settings-checkbox">
            <input type="checkbox" defaultChecked />
            <span className="checkmark"></span>
            自动创建反向链接
          </label>
        </div>

        <div className="settings-item">
          <label className="settings-checkbox">
            <input type="checkbox" defaultChecked />
            <span className="checkmark"></span>
            显示链接预览
          </label>
        </div>

        <div className="settings-item">
          <label className="settings-checkbox">
            <input type="checkbox" />
            <span className="checkmark"></span>
            自动补全链接
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>图谱设置</h3>
        
        <div className="settings-item">
          <label className="settings-label">
            节点大小
            <input 
              type="range" 
              min="10" 
              max="30" 
              defaultValue="20"
              className="settings-range"
            />
          </label>
        </div>

        <div className="settings-item">
          <label className="settings-label">
            连接强度
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.1"
              defaultValue="0.5"
              className="settings-range"
            />
          </label>
        </div>

        <div className="settings-item">
          <label className="settings-checkbox">
            <input type="checkbox" defaultChecked />
            <span className="checkmark"></span>
            显示节点标签
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>关于</h3>
        <div className="about-info">
          <p><strong>QLinkNote</strong> v1.0.0</p>
          <p>基于 Electron 和 React 的知识管理工具</p>
          <p>参考 Obsidian 设计，支持双向链接和关系图谱</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;