import React, { useCallback, useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { FileItem, NoteLink } from '../types';
import { ActivityBarItem } from './ActivityBar';
import GraphView from './GraphView';
import MindMapEditor from './MindMapEditor';
import { 
  Eye, 
  EyeOff, 
  Columns, 
  Save,
  FileText,
  Link,
  Network,
  GitBranch
} from 'lucide-react';

interface EditorProps {
  files: Record<string, FileItem>;
  activeFileId: string | null;
  isPreviewMode: boolean;
  isSplitView: boolean;
  isDarkMode?: boolean;
  noteLinks: Record<string, NoteLink>;
  activeActivityItem?: ActivityBarItem;
  onContentChange: (id: string, content: string) => void;
  onTogglePreview: () => void;
  onToggleSplitView: () => void;
  onSaveFile?: () => void;
  onSaveAs?: () => void;
  onNoteLink?: (fileId: string) => void;
  renderLinkedContent?: (content: string, files: Record<string, FileItem>, onLinkClick?: (fileId: string) => void) => string;
  getFileConnections?: (fileId: string, files: Record<string, FileItem>) => { outgoing: FileItem[]; incoming: FileItem[] };
  suggestLinks?: (content: string, files: Record<string, FileItem>) => string[];
}

const Editor: React.FC<EditorProps> = ({
  files,
  activeFileId,
  isPreviewMode,
  isSplitView,
  isDarkMode = false,
  noteLinks,
  // activeActivityItem, // 暂时未使用
  onContentChange,
  onTogglePreview,
  onToggleSplitView,
  onSaveFile,
  onSaveAs,
  onNoteLink,
  renderLinkedContent,
  getFileConnections
  // suggestLinks 暂时未使用，注释掉避免编译警告
}) => {
  const [showGraph, setShowGraph] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);

  const editorRef = useRef<any>(null);
  
  const activeFile = activeFileId ? files[activeFileId] : null;
  
  // 判断当前文件是否为思维导图文件
  const isMindMapFile = activeFile?.name.endsWith('.mindmap.md') || false;
  
  // 如果是思维导图文件，自动显示思维导图
  useEffect(() => {
    if (isMindMapFile) {
      setShowMindMap(true);
      setShowGraph(false);
    } else {
      setShowMindMap(false);
    }
  }, [isMindMapFile]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    try {
      editorRef.current = editor;
      
      // 添加快捷键
      editor.addCommand(
        // Ctrl+S
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          if (onSaveFile) {
            onSaveFile();
          }
        }
      );
      
      // Ctrl+Shift+S 另存为
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS,
        () => {
          if (onSaveAs) {
            onSaveAs();
          }
        }
      );
    } catch (error) {
      console.warn('Editor setup warning:', error);
    }
  };

  const handleContentChange = useCallback((value: string | undefined) => {
    if (activeFileId && value !== undefined) {
      onContentChange(activeFileId, value);
    }
  }, [activeFileId, onContentChange]);

  const renderMarkdown = (content: string) => {
    try {
      let processedContent = content;
      
      // 如果有链接渲染函数，使用它处理内容
      if (renderLinkedContent && onNoteLink) {
        processedContent = renderLinkedContent(content, files, onNoteLink);
      }
      
      const html = marked(processedContent);
      return DOMPurify.sanitize(html as string);
    } catch (error) {
      console.error('Markdown rendering error:', error);
      return '<p>渲染错误</p>';
    }
  };

  // 处理预览面板中的链接点击
  const handlePreviewClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('note-link')) {
      e.preventDefault();
      const fileId = target.getAttribute('data-file-id');
      if (fileId && onNoteLink) {
        onNoteLink(fileId);
      }
    }
  }, [onNoteLink]);

  // 获取当前文件的连接信息
  const connections = activeFileId && getFileConnections ? 
    getFileConnections(activeFileId, files) : 
    { outgoing: [], incoming: [] };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'p':
            e.preventDefault();
            onTogglePreview();
            break;
          case '\\':
            e.preventDefault();
            onToggleSplitView();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [onTogglePreview, onToggleSplitView]);

  if (!activeFile) {
    return (
      <div className="main-content">
        <div className="welcome-message">
          <FileText size={64} style={{ opacity: 0.3 }} />
          <h2>欢迎使用 QLinkNote</h2>
          <p>选择一个文件开始编辑，或创建一个新文件</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <FileText size={16} />
          <span style={{ fontWeight: 500 }}>{activeFile.name}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`button ${isPreviewMode ? 'primary' : ''}`}
            onClick={onTogglePreview}
            title="切换预览模式 (Ctrl+P)"
          >
            {isPreviewMode ? <EyeOff size={16} /> : <Eye size={16} />}
            预览
          </button>
          
          <button 
            className={`button ${showGraph ? 'primary' : ''}`}
            onClick={() => {
              setShowGraph(!showGraph);
              if (!showGraph) setShowMindMap(false);
            }}
            title="关系图谱"
          >
            <Network size={16} />
            图谱
          </button>
          
          <button 
            className={`button ${showMindMap ? 'primary' : ''}`}
            onClick={() => {
              setShowMindMap(!showMindMap);
              if (!showMindMap) setShowGraph(false);
            }}
            title="思维导图"
          >
            <GitBranch size={16} />
            导图
          </button>
          
          <button 
            className={`button ${isSplitView ? 'primary' : ''}`}
            onClick={onToggleSplitView}
            title="切换分屏模式 (Ctrl+\\)"
          >
            <Columns size={16} />
            分屏
          </button>
          
          <button 
            className="button"
            onClick={() => onSaveFile && onSaveFile()}
            title="保存文件 (Ctrl+S)"
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>

      <div className="editor-container">
        {/* 编辑器面板 */}
        {(!isPreviewMode || isSplitView) && (
          <div className="editor-pane">
            <MonacoEditor
              height="100%"
              language="markdown"
              theme={isDarkMode ? 'vs-dark' : 'vs-light'}
              value={activeFile.content || ''}
              onChange={handleContentChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
                roundedSelection: false,
                readOnly: false,
                cursorStyle: 'line',
                matchBrackets: 'always',
                glyphMargin: true,
                folding: true,
                foldingStrategy: 'indentation',
                showFoldingControls: 'mouseover',
                disableLayerHinting: true,

                renderControlCharacters: false,

                renderWhitespace: 'boundary',
                rulers: [],
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: false,
                  verticalHasArrows: false,
                  horizontalHasArrows: false,
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10
                }
              }}
            />
          </div>
        )}

        {/* 预览面板 */}
        {(isPreviewMode || isSplitView) && (
          <div className="preview-pane">
            {showGraph ? (
              // 关系图谱视图
              <div className="graph-container">
                <div className="graph-header">
                  <h3><Network size={20} /> 关系图谱</h3>
                </div>
                <GraphView
                  files={files}
                  noteLinks={noteLinks}
                  onNodeClick={onNoteLink}
                  isDarkMode={isDarkMode}
                />
              </div>
            ) : showMindMap ? (
              // 思维导图视图
              <div className="mindmap-container">
                <div className="mindmap-header">
                  <h3><GitBranch size={20} /> 思维导图</h3>
                </div>
                <MindMapEditor
                  content={activeFile.content || ''}
                  onChange={(content) => activeFileId && onContentChange(activeFileId, content)}
                  isDarkMode={isDarkMode}
                />
              </div>
            ) : (
              // 正常预览内容
              <>
                <div 
                  className="preview-content"
                  onClick={handlePreviewClick}
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdown(activeFile.content || '') 
                  }}
                />
                
                {/* 链接信息面板 */}
                {(connections.outgoing.length > 0 || connections.incoming.length > 0) && (
                  <div className="connections-panel">
                    <h4><Link size={16} /> 连接</h4>
                    
                    {connections.outgoing.length > 0 && (
                      <div className="connections-section">
                        <h5>引用链接 ({connections.outgoing.length})</h5>
                        <ul className="connections-list">
                          {connections.outgoing.map(file => (
                            <li key={file.id}>
                              <button 
                                className="connection-link"
                                onClick={() => onNoteLink && onNoteLink(file.id)}
                              >
                                {file.name.replace(/\.md$/, '')}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {connections.incoming.length > 0 && (
                      <div className="connections-section">
                        <h5>反向链接 ({connections.incoming.length})</h5>
                        <ul className="connections-list">
                          {connections.incoming.map(file => (
                            <li key={file.id}>
                              <button 
                                className="connection-link"
                                onClick={() => onNoteLink && onNoteLink(file.id)}
                              >
                                {file.name.replace(/\.md$/, '')}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;