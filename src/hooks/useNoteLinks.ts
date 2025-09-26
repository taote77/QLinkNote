import { useCallback } from 'react';
import { FileItem, NoteLink } from '../types';
import { generateId } from '../utils/helpers';

export const useNoteLinks = () => {
  
  // 解析笔记内容中的链接 [[文件名]] 格式
  const parseNoteLinks = useCallback((content: string, files: Record<string, FileItem>): { fileId: string | null; linkText: string }[] => {
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    const links: { fileId: string | null; linkText: string }[] = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkText = match[1].trim();
      
      // 查找对应的文件
      const targetFile = Object.values(files).find(file => {
        if (file.type !== 'file') return false;
        
        // 支持多种匹配方式
        const fileName = file.name.replace(/\.md$/, ''); // 移除.md扩展名
        return fileName === linkText || 
               file.name === linkText || 
               file.name === `${linkText}.md`;
      });

      links.push({
        fileId: targetFile?.id || null,
        linkText
      });
    }

    return links;
  }, []);

  // 更新文件的链接关系
  const updateFileLinks = useCallback((
    fileId: string, 
    content: string, 
    files: Record<string, FileItem>
  ): { updatedFiles: Record<string, FileItem>; noteLinks: Record<string, NoteLink> } => {
    const links = parseNoteLinks(content, files);
    const updatedFiles = { ...files };
    const noteLinks: Record<string, NoteLink> = {};

    // 清除该文件的所有旧链接
    Object.values(updatedFiles).forEach(file => {
      if (file.backlinks) {
        file.backlinks = file.backlinks.filter(id => id !== fileId);
      }
    });

    // 更新当前文件的链接
    const currentFile = updatedFiles[fileId];
    if (currentFile) {
      currentFile.links = links.map(link => link.fileId).filter(Boolean) as string[];
      
      // 为每个有效链接创建NoteLink对象
      links.forEach(link => {
        if (link.fileId) {
          const linkId = generateId();
          noteLinks[linkId] = {
            sourceFileId: fileId,
            targetFileId: link.fileId,
            linkText: link.linkText
          };

          // 更新目标文件的反向链接
          const targetFile = updatedFiles[link.fileId];
          if (targetFile) {
            if (!targetFile.backlinks) {
              targetFile.backlinks = [];
            }
            if (!targetFile.backlinks.includes(fileId)) {
              targetFile.backlinks.push(fileId);
            }
          }
        }
      });
    }

    return { updatedFiles, noteLinks };
  }, [parseNoteLinks]);

  // 渲染链接的Markdown内容（用于预览）
  const renderLinkedContent = useCallback((content: string, files: Record<string, FileItem>, _onLinkClick?: (fileId: string) => void): string => {
    return content.replace(/\[\[([^\]]+)\]\]/g, (_match, linkText) => {
      const targetFile = Object.values(files).find(file => {
        if (file.type !== 'file') return false;
        const fileName = file.name.replace(/\.md$/, '');
        return fileName === linkText || file.name === linkText || file.name === `${linkText}.md`;
      });

      if (targetFile) {
        // 如果找到对应文件，渲染为可点击的链接
        return `<a href="#" class="note-link" data-file-id="${targetFile.id}" title="打开：${targetFile.name}">${linkText}</a>`;
      } else {
        // 如果没找到对应文件，渲染为未解析的链接
        return `<span class="note-link-unresolved" title="文件不存在：${linkText}">${linkText}</span>`;
      }
    });
  }, []);

  // 获取文件的所有相关链接
  const getFileConnections = useCallback((fileId: string, files: Record<string, FileItem>) => {
    const file = files[fileId];
    if (!file) return { outgoing: [], incoming: [] };

    const outgoing = (file.links || []).map(linkId => files[linkId]).filter(Boolean);
    const incoming = (file.backlinks || []).map(linkId => files[linkId]).filter(Boolean);

    return { outgoing, incoming };
  }, []);

  // 建议可能的链接（基于文件名）
  const suggestLinks = useCallback((content: string, files: Record<string, FileItem>): string[] => {
    const suggestions: string[] = [];
    const words = content.toLowerCase().split(/\s+/);
    
    Object.values(files).forEach(file => {
      if (file.type !== 'file') return;
      
      const fileName = file.name.replace(/\.md$/, '').toLowerCase();
      const fileWords = fileName.split(/[-_\s]+/);
      
      // 检查文件名或其组成部分是否出现在内容中
      if (words.includes(fileName) || fileWords.some(word => word.length > 3 && words.includes(word))) {
        suggestions.push(file.name.replace(/\.md$/, ''));
      }
    });

    return [...new Set(suggestions)]; // 去重
  }, []);

  // 创建新的链接
  const createLink = useCallback((linkText: string): string => {
    return `[[${linkText}]]`;
  }, []);

  return {
    parseNoteLinks,
    updateFileLinks,
    renderLinkedContent,
    getFileConnections,
    suggestLinks,
    createLink
  };
};