import React from 'react';
import { 
  Files, 
  Search, 
  Settings
} from 'lucide-react';

export type ActivityBarItem = 'files' | 'search' | 'settings';

interface ActivityBarProps {
  activeItem: ActivityBarItem;
  onItemChange: (item: ActivityBarItem) => void;
  isDarkMode?: boolean;
}

const ActivityBar: React.FC<ActivityBarProps> = ({
  activeItem,
  onItemChange
  // isDarkMode 暂时未使用
}) => {
  const items = [
    {
      id: 'files' as ActivityBarItem,
      icon: Files,
      title: '文件管理',
      tooltip: '文件和文件夹管理'
    },
    {
      id: 'search' as ActivityBarItem,
      icon: Search,
      title: '搜索',
      tooltip: '全局搜索文件内容'
    },
    {
      id: 'settings' as ActivityBarItem,
      icon: Settings,
      title: '设置',
      tooltip: '应用程序设置'
    }
  ];

  return (
    <div className="activity-bar">
      <div className="activity-bar-items">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <div
              key={item.id}
              className={`activity-bar-item ${isActive ? 'active' : ''}`}
              onClick={() => onItemChange(item.id)}
              title={item.tooltip}
            >
              <Icon size={24} />
              <span className="activity-bar-item-label">{item.title}</span>
            </div>
          );
        })}
      </div>
      
      <div className="activity-bar-bottom">
        {/* 可以在这里添加用户头像或其他底部项目 */}
      </div>
    </div>
  );
};

export default ActivityBar;