import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FileItem, NoteLink } from '../types';

interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string;
  target: string;
  sourceNode?: GraphNode;
  targetNode?: GraphNode;
}

interface GraphViewProps {
  files: Record<string, FileItem>;
  noteLinks: Record<string, NoteLink>;
  onNodeClick?: (fileId: string) => void;
  isDarkMode?: boolean;
  width?: number;
  height?: number;
}

const GraphView: React.FC<GraphViewProps> = ({
  files,
  noteLinks,
  onNodeClick,
  isDarkMode = false,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [devicePixelRatio, setDevicePixelRatio] = useState(window.devicePixelRatio || 1);

  // 设置高分辨率Canvas
  const setupHighDPICanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = devicePixelRatio;
    
    // 设置实际尺寸
    const displayWidth = width || rect.width;
    const displayHeight = height || rect.height;
    
    // 设置Canvas的实际像素尺寸
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    // 设置Canvas的显示尺寸
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // 缩放上下文以匹配设备像素比
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      // 启用抗锯齿
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
  }, [devicePixelRatio, width, height]);

  // 转换文件和链接数据为图形数据（改进版）
  const prepareGraphData = useCallback(() => {
    const fileNodes: GraphNode[] = [];
    const graphLinks: GraphLink[] = [];
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const displayWidth = canvas.style.width ? parseInt(canvas.style.width) : canvas.width;
    const displayHeight = canvas.style.height ? parseInt(canvas.style.height) : canvas.height;
    
    // 创建节点（更好的初始化位置）
    Object.values(files).forEach((file, index) => {
      if (file.type === 'file') {
        // 使用更好的初始化算法，避免节点重叠
        const angle = (index / Object.values(files).length) * 2 * Math.PI;
        const radius = Math.min(displayWidth, displayHeight) * 0.2;
        const centerX = displayWidth / 2;
        const centerY = displayHeight / 2;
        
        fileNodes.push({
          id: file.id,
          name: file.name.replace(/\.md$/, ''),
          x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
          y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
          vx: 0,
          vy: 0
        });
      }
    });

    // 创建链接
    Object.values(noteLinks).forEach(link => {
      const sourceExists = fileNodes.find(n => n.id === link.sourceFileId);
      const targetExists = fileNodes.find(n => n.id === link.targetFileId);
      
      if (sourceExists && targetExists) {
        graphLinks.push({
          source: link.sourceFileId,
          target: link.targetFileId
        });
      }
    });

    // 为链接添加节点引用
    graphLinks.forEach(link => {
      link.sourceNode = fileNodes.find(n => n.id === link.source);
      link.targetNode = fileNodes.find(n => n.id === link.target);
    });

    setNodes(fileNodes);
    setLinks(graphLinks);
  }, [files, noteLinks]);

  // 力导向布局算法（优化版）
  const updateLayout = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const displayWidth = canvas.style.width ? parseInt(canvas.style.width) : canvas.width;
    const displayHeight = canvas.style.height ? parseInt(canvas.style.height) : canvas.height;
    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;

    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      
      // 应用力
      newNodes.forEach(node => {
        if (node.fx !== undefined && node.fy !== undefined) return; // 固定节点
        
        // 重力向中心（较弱）
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          const force = 0.005; // 降低重力
          node.vx = (node.vx || 0) + (dx / distance) * force;
          node.vy = (node.vy || 0) + (dy / distance) * force;
        }

        // 节点之间的排斥力（增强）
        newNodes.forEach(other => {
          if (other.id === node.id) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 0 && distance < 150) { // 增加作用范围
            const force = 2000 / (distance * distance);
            node.vx = (node.vx || 0) + (dx / distance) * force * 0.02;
            node.vy = (node.vy || 0) + (dy / distance) * force * 0.02;
          }
        });
      });

      // 链接的吸引力（优化）
      links.forEach(link => {
        const source = newNodes.find(n => n.id === link.source);
        const target = newNodes.find(n => n.id === link.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const idealDistance = 120; // 理想距离
          
          if (distance > 0) {
            const force = (distance - idealDistance) * 0.003;
            const forceX = (dx / distance) * force;
            const forceY = (dy / distance) * force;
            
            source.vx = (source.vx || 0) + forceX;
            source.vy = (source.vy || 0) + forceY;
            target.vx = (target.vx || 0) - forceX;
            target.vy = (target.vy || 0) - forceY;
          }
        }
      });

      // 更新位置
      newNodes.forEach(node => {
        if (node.fx !== undefined && node.fy !== undefined) {
          node.x = node.fx;
          node.y = node.fy;
          node.vx = 0;
          node.vy = 0;
        } else {
          // 增强阻尼
          node.vx = (node.vx || 0) * 0.85;
          node.vy = (node.vy || 0) * 0.85;
          
          // 限制最大速度
          const maxSpeed = 5;
          const speed = Math.sqrt((node.vx || 0) ** 2 + (node.vy || 0) ** 2);
          if (speed > maxSpeed) {
            node.vx = (node.vx || 0) * (maxSpeed / speed);
            node.vy = (node.vy || 0) * (maxSpeed / speed);
          }
          
          node.x += node.vx || 0;
          node.y += node.vy || 0;
          
          // 边界检查（留更多空间）
          const margin = 40;
          node.x = Math.max(margin, Math.min(displayWidth - margin, node.x));
          node.y = Math.max(margin, Math.min(displayHeight - margin, node.y));
        }
      });

      return newNodes;
    });
  }, [links, nodes.length]);

  // 绘制图形（高质量版）
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = canvas.style.width ? parseInt(canvas.style.width) : canvas.width / devicePixelRatio;
    const displayHeight = canvas.style.height ? parseInt(canvas.style.height) : canvas.height / devicePixelRatio;

    // 清空画布
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // 设置高质量渲染
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 设置样式
    const linkColor = isDarkMode ? '#4fc3f7' : '#2196f3';
    const nodeColor = isDarkMode ? '#2d2d30' : '#f8f9fa';
    const nodeBorderColor = isDarkMode ? '#4fc3f7' : '#2196f3';
    const textColor = isDarkMode ? '#cccccc' : '#212529';
    const hoverColor = isDarkMode ? '#4fc3f7' : '#1976d2';
    const shadowColor = isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)';

    // 绘制链接（改进样式）
    ctx.strokeStyle = linkColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.lineCap = 'round';
    
    // 添加链接阴影
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      if (source && target) {
        const distance = Math.sqrt((target.x - source.x) ** 2 + (target.y - source.y) ** 2);
        
        if (distance > 0) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      }
    });

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.globalAlpha = 1;

    // 绘制节点（改进样式）
    nodes.forEach(node => {
      const isHovered = hoveredNode?.id === node.id;
      const radius = isHovered ? 28 : 22;
      
      // 节点阴影
      if (isHovered) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
      }
      
      // 节点背景
      ctx.fillStyle = isHovered ? hoverColor : nodeColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // 节点边框
      ctx.strokeStyle = isHovered ? hoverColor : nodeBorderColor;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();
      
      // 重置阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 节点文本（高质量渲染）
      ctx.fillStyle = isHovered ? '#ffffff' : textColor;
      ctx.font = `${isHovered ? 'bold 13px' : '12px'} -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 更好的文本裁剪
      let displayName = node.name;
      const maxWidth = radius * 1.8;
      const metrics = ctx.measureText(displayName);
      
      if (metrics.width > maxWidth) {
        // 使用二分法找到合适的文本长度
        let left = 0;
        let right = displayName.length;
        
        while (left < right) {
          const mid = Math.floor((left + right + 1) / 2);
          const testText = displayName.slice(0, mid) + '...';
          if (ctx.measureText(testText).width <= maxWidth) {
            left = mid;
          } else {
            right = mid - 1;
          }
        }
        
        displayName = displayName.slice(0, left) + '...';
      }
      
      // 文本阴影（提高可读性）
      if (!isHovered) {
        ctx.fillStyle = isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(displayName, node.x + 0.5, node.y + 0.5);
      }
      
      ctx.fillStyle = isHovered ? '#ffffff' : textColor;
      ctx.fillText(displayName, node.x, node.y);
    });
  }, [nodes, links, hoveredNode, isDarkMode, devicePixelRatio]);

  // 处理鼠标事件（高DPI适配）
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / devicePixelRatio / rect.width;
    const scaleY = canvas.height / devicePixelRatio / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (draggedNode) {
      draggedNode.fx = x;
      draggedNode.fy = y;
      return;
    }

    // 检查鼠标悬停（增大点击区域）
    const hoveredNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < 30; // 增大点击区域
    });

    setHoveredNode(hoveredNode || null);
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  }, [nodes, draggedNode, devicePixelRatio]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / devicePixelRatio / rect.width;
    const scaleY = canvas.height / devicePixelRatio / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < 30;
    });

    if (clickedNode) {
      setDraggedNode(clickedNode);
      clickedNode.fx = x;
      clickedNode.fy = y;
    }
  }, [nodes, devicePixelRatio]);

  const handleMouseUp = useCallback(() => {
    if (draggedNode) {
      draggedNode.fx = undefined;
      draggedNode.fy = undefined;
      setDraggedNode(null);
    }
  }, [draggedNode]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNode) return; // 如果在拖拽，不触发点击

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / devicePixelRatio / rect.width;
    const scaleY = canvas.height / devicePixelRatio / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < 30;
    });

    if (clickedNode && onNodeClick) {
      onNodeClick(clickedNode.id);
    }
  }, [nodes, onNodeClick, draggedNode, devicePixelRatio]);

  // 初始化和更新（高DPI支持）
  useEffect(() => {
    prepareGraphData();
  }, [prepareGraphData]);

  useEffect(() => {
    const updateDevicePixelRatio = () => {
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };
    
    // 监听设备像素比变化
    window.addEventListener('resize', updateDevicePixelRatio);
    return () => window.removeEventListener('resize', updateDevicePixelRatio);
  }, []);

  useEffect(() => {
    setupHighDPICanvas();
    
    const handleResize = () => {
      setupHighDPICanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setupHighDPICanvas]);

  // 动画循环（优化性能）
  useEffect(() => {
    let animationId: number;
    let lastTime = 0;
    const fps = 60;
    const interval = 1000 / fps;
    
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= interval) {
        updateLayout();
        draw();
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [updateLayout, draw]);

  if (nodes.length === 0) {
    return (
      <div className="graph-view-empty">
        <div className="graph-view-empty-content">
          <div className="graph-view-empty-icon">🕸️</div>
          <h3>还没有链接关系</h3>
          <p>在笔记中使用 [[文件名]] 语法创建链接后，这里会显示关系图谱</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="graph-view">
      <div className="graph-view-controls">
        <div className="graph-view-info">
          <span>{nodes.length} 个节点</span>
          <span>{links.length} 个连接</span>
        </div>
        <div className="graph-view-actions">
          <button 
            className="graph-action-btn"
            onClick={() => {
              // 重置节点位置
              setNodes(prev => prev.map(node => ({
                ...node,
                fx: undefined,
                fy: undefined,
                vx: 0,
                vy: 0
              })));
            }}
            title="重置布局"
          >
            🔄
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="graph-canvas"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%',
          display: 'block'
        }}
      />
    </div>
  );
};

export default GraphView;