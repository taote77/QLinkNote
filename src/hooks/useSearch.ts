import { useState, useMemo } from 'react';
import { FileItem } from '../types';

export const useSearch = (files: Record<string, FileItem>) => {
  const [searchQuery, setSearchQuery] = useState('');

  // 搜索结果
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.values(files);
    }

    const query = searchQuery.toLowerCase();
    return Object.values(files).filter(file => {
      // 按文件名搜索
      if (file.name.toLowerCase().includes(query)) {
        return true;
      }
      
      // 按内容搜索（仅对文件类型）
      if (file.type === 'file' && file.content) {
        return file.content.toLowerCase().includes(query);
      }
      
      return false;
    });
  }, [files, searchQuery]);

  // 高亮搜索结果
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    highlightText
  };
};