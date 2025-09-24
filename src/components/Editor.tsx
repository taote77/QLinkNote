import React, { useCallback, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { FileItem } from '../types';
import { 
  Eye, 
  EyeOff, 
  Columns, 
  Save,
  FileText
} from 'lucide-react';

interface EditorProps {
  files: Record<string, FileItem>;
  activeFileId: string | null;
  isPreviewMode: boolean;
  isSplitView: boolean;
  isDarkMode?: boolean;
  onContentChange: (id: string, content: string) => void;
  onTogglePreview: () => void;
  onToggleSplitView: () => void;
  onSaveFile?: () => void;
  onSaveAs?: () => void;
}

const Editor: React.FC<EditorProps> = ({
  files,
  activeFileId,
  isPreviewMode,
  isSplitView,
  isDarkMode = false,
  onContentChange,
  onTogglePreview,
  onToggleSplitView,
  onSaveFile,
  onSaveAs
}) => {
  const editorRef = useRef<any>(null);
  
  const activeFile = activeFileId ? files[activeFileId] : null;

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
      const html = marked(content);
      return DOMPurify.sanitize(html as string);
    } catch (error) {
      console.error('Markdown rendering error:', error);
      return '<p>渲染错误</p>';
    }
  };

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
            <div 
              className="preview-content"
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(activeFile.content || '') 
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;