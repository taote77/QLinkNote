import React, { useState } from 'react';
import { FileItem } from '../types';
import { Search, X } from 'lucide-react';

interface SearchPanelProps {
  files: Record<string, FileItem>;
  onFileSelect: (fileId: string) => void;
  isDarkMode?: boolean;
}

interface SearchResult {
  fileId: string;
  fileName: string;
  matches: {
    line: number;
    text: string;
    startIndex: number;
    endIndex: number;
  }[];
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  files,
  onFileSelect
  // isDarkMode 暂时未使用
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // 执行搜索
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();

    Object.values(files).forEach(file => {
      if (file.type !== 'file' || !file.content) return;

      const matches: SearchResult['matches'] = [];
      const lines = file.content.split('\n');

      lines.forEach((line, lineIndex) => {
        const lowerLine = line.toLowerCase();
        let startIndex = 0;
        
        while (true) {
          const index = lowerLine.indexOf(searchTerm, startIndex);
          if (index === -1) break;
          
          matches.push({
            line: lineIndex + 1,
            text: line,
            startIndex: index,
            endIndex: index + searchTerm.length
          });
          
          startIndex = index + 1;
        }
      });

      if (matches.length > 0) {
        results.push({
          fileId: file.id,
          fileName: file.name,
          matches
        });
      }
    });

    setSearchResults(results);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const highlightMatch = (text: string, startIndex: number, endIndex: number) => {
    const before = text.substring(0, startIndex);
    const match = text.substring(startIndex, endIndex);
    const after = text.substring(endIndex);
    
    return (
      <span>
        {before}
        <mark className="search-highlight">{match}</mark>
        {after}
      </span>
    );
  };

  return (
    <div className="search-panel">
      <div className="search-panel-header">
        <div className="search-input-container">
          <Search size={16} className="search-input-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="搜索文件内容..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button
              className="search-clear-button"
              onClick={clearSearch}
              title="清除搜索"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="search-results">
        {searchQuery && searchResults.length === 0 && (
          <div className="search-no-results">
            <p>未找到包含 "{searchQuery}" 的文件</p>
          </div>
        )}

        {searchResults.map(result => (
          <div key={result.fileId} className="search-result">
            <div 
              className="search-result-header"
              onClick={() => onFileSelect(result.fileId)}
            >
              <span className="search-result-filename">{result.fileName}</span>
              <span className="search-result-count">{result.matches.length} 处匹配</span>
            </div>
            
            <div className="search-result-matches">
              {result.matches.slice(0, 5).map((match, index) => (
                <div 
                  key={index}
                  className="search-result-match"
                  onClick={() => onFileSelect(result.fileId)}
                >
                  <span className="search-result-line-number">第 {match.line} 行:</span>
                  <span className="search-result-text">
                    {highlightMatch(match.text.trim(), match.startIndex, match.endIndex)}
                  </span>
                </div>
              ))}
              {result.matches.length > 5 && (
                <div className="search-result-more">
                  还有 {result.matches.length - 5} 处匹配...
                </div>
              )}
            </div>
          </div>
        ))}

        {!searchQuery && (
          <div className="search-panel-empty">
            <div className="search-panel-empty-content">
              <Search size={48} style={{ opacity: 0.3 }} />
              <h3>全局搜索</h3>
              <p>输入关键词搜索所有文件的内容</p>
              <div className="search-tips">
                <h4>搜索技巧:</h4>
                <ul>
                  <li>支持部分匹配</li>
                  <li>不区分大小写</li>
                  <li>显示匹配行的上下文</li>
                  <li>点击结果可直接跳转到文件</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;