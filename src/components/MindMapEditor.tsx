import React, { useEffect, useRef, useState, useCallback } from 'react';

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isEditing?: boolean;
  level: number;
  color?: string;
  parentId?: string;
  children?: string[];
}

interface MindMapEdge {
  id: string;
  sourceId: string;
  targetId: string;
}

interface MindMapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  isDarkMode?: boolean;
  width?: number;
  height?: number;
}

const MindMapEditor: React.FC<MindMapEditorProps> = ({
  content = '',
  onChange,
  isDarkMode = false,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [edges, setEdges] = useState<MindMapEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [devicePixelRatio, setDevicePixelRatio] = useState(window.devicePixelRatio || 1);

  // 默认的思维导图数据
  const initializeDefaultMindMap = useCallback(() => {
    const rootNode: MindMapNode = {
      id: 'root',
      text: '主要思想',
      x: 300,
      y: 200,
      width: 120,
      height: 40,
      level: 0,
      color: '#4fc3f7',
      children: []
    };

    setNodes([rootNode]);
    setEdges([]);
  }, []);

  // 从内容解析思维导图数据
  const parseContent = useCallback((content: string) => {
    if (!content.trim()) {
      initializeDefaultMindMap();
      return;
    }

    try {
      const data = JSON.parse(content);
      if (data.nodes && data.edges) {
        setNodes(data.nodes);
        setEdges(data.edges);
      } else {
        initializeDefaultMindMap();
      }
    } catch (error) {
      // 如果不是JSON格式，尝试解析为简单文本
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const rootNode: MindMapNode = {
          id: 'root',
          text: lines[0].trim(),
          x: 300,
          y: 200,
          width: 120,
          height: 40,
          level: 0,
          color: '#4fc3f7',
          children: []
        };

        const newNodes = [rootNode];
        const newEdges: MindMapEdge[] = [];

        // 简单解析后续行作为子节点
        lines.slice(1).forEach((line, index) => {
          const childNode: MindMapNode = {
            id: `child_${index}`,
            text: line.trim(),
            x: 300 + (index % 2 === 0 ? 200 : -200),
            y: 200 + (index + 1) * 80,
            width: 120,
            height: 40,
            level: 1,
            parentId: 'root',
            children: []
          };

          newNodes.push(childNode);
          newEdges.push({
            id: `edge_${index}`,
            sourceId: 'root',
            targetId: childNode.id
          });
        });

        setNodes(newNodes);
        setEdges(newEdges);
      } else {
        initializeDefaultMindMap();
      }
    }
  }, [initializeDefaultMindMap]);

  // 保存思维导图数据
  const saveMindMapData = useCallback(() => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    onChange?.(data);
  }, [nodes, edges, onChange]);

  // 设置高分辨率Canvas
  const setupHighDPICanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = devicePixelRatio;
    
    const displayWidth = width || rect.width;
    const displayHeight = height || rect.height;
    
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
  }, [devicePixelRatio, width, height]);

  // 绘制思维导图
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = canvas.style.width ? parseInt(canvas.style.width) : canvas.width / devicePixelRatio;
    const displayHeight = canvas.style.height ? parseInt(canvas.style.height) : canvas.height / devicePixelRatio;

    // 清空画布
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // 设置样式
    const nodeColor = isDarkMode ? '#2d2d30' : '#ffffff';
    const nodeBorderColor = isDarkMode ? '#4fc3f7' : '#2196f3';
    const textColor = isDarkMode ? '#cccccc' : '#212529';
    const edgeColor = isDarkMode ? '#4fc3f7' : '#2196f3';
    const selectedColor = isDarkMode ? '#ff9800' : '#ff5722';
    const shadowColor = isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)';

    // 绘制连接线
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.sourceId);
      const targetNode = nodes.find(n => n.id === edge.targetId);
      
      if (sourceNode && targetNode) {
        const startX = sourceNode.x + sourceNode.width / 2;
        const startY = sourceNode.y + sourceNode.height / 2;
        const endX = targetNode.x + targetNode.width / 2;
        const endY = targetNode.y + targetNode.height / 2;

        // 绘制曲线连接
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        const controlX1 = startX + (endX - startX) * 0.3;
        const controlY1 = startY;
        const controlX2 = endX - (endX - startX) * 0.3;
        const controlY2 = endY;
        
        ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
        ctx.stroke();
      }
    });

    // 绘制节点
    nodes.forEach(node => {
      const isSelected = selectedNode === node.id;
      const isEditing = editingNode === node.id;

      // 节点阴影
      if (isSelected) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
      }

      // 节点背景
      ctx.fillStyle = node.color || nodeColor;
      ctx.strokeStyle = isSelected ? selectedColor : nodeBorderColor;
      ctx.lineWidth = isSelected ? 3 : 2;

      const radius = 8;
      ctx.beginPath();
      ctx.roundRect(node.x, node.y, node.width, node.height, radius);
      ctx.fill();
      ctx.stroke();

      // 重置阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 节点文本
      if (!isEditing) {
        ctx.fillStyle = textColor;
        ctx.font = `${node.level === 0 ? 'bold 14px' : '12px'} -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textX = node.x + node.width / 2;
        const textY = node.y + node.height / 2;

        // 文本裁剪
        let displayText = node.text;
        const maxWidth = node.width - 16;
        const metrics = ctx.measureText(displayText);
        
        if (metrics.width > maxWidth) {
          let left = 0;
          let right = displayText.length;
          
          while (left < right) {
            const mid = Math.floor((left + right + 1) / 2);
            const testText = displayText.slice(0, mid) + '...';
            if (ctx.measureText(testText).width <= maxWidth) {
              left = mid;
            } else {
              right = mid - 1;
            }
          }
          
          displayText = displayText.slice(0, left) + '...';
        }

        ctx.fillText(displayText, textX, textY);
      }
    });
  }, [nodes, edges, selectedNode, editingNode, isDarkMode, devicePixelRatio]);

  // 获取节点在坐标点
  const getNodeAtPoint = useCallback((x: number, y: number) => {
    return nodes.find(node => 
      x >= node.x && x <= node.x + node.width &&
      y >= node.y && y <= node.y + node.height
    );
  }, [nodes]);

  // 创建新节点
  const createNode = useCallback((parentId: string, text: string = '新节点') => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newNodeId = `node_${Date.now()}`;
    const childCount = edges.filter(e => e.sourceId === parentId).length;
    
    const angle = (childCount * Math.PI * 2) / Math.max(8, childCount + 2);
    const radius = 150 + parentNode.level * 50;
    
    const newNode: MindMapNode = {
      id: newNodeId,
      text,
      x: parentNode.x + Math.cos(angle) * radius,
      y: parentNode.y + Math.sin(angle) * radius,
      width: 120,
      height: 40,
      level: parentNode.level + 1,
      parentId,
      children: []
    };

    const newEdge: MindMapEdge = {
      id: `edge_${Date.now()}`,
      sourceId: parentId,
      targetId: newNodeId
    };

    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [...prev, newEdge]);
    setSelectedNode(newNodeId);
    
    return newNodeId;
  }, [nodes, edges]);

  // 删除节点
  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'root') return; // 不能删除根节点

    // 递归删除子节点
    const deleteRecursive = (id: string) => {
      const childEdges = edges.filter(e => e.sourceId === id);
      childEdges.forEach(edge => deleteRecursive(edge.targetId));
      
      setNodes(prev => prev.filter(n => n.id !== id));
      setEdges(prev => prev.filter(e => e.sourceId !== id && e.targetId !== id));
    };

    deleteRecursive(nodeId);
    setSelectedNode(null);
  }, [edges]);

  // 开始编辑节点
  const startEditingNode = useCallback((nodeId: string) => {
    setEditingNode(nodeId);
    setSelectedNode(nodeId);
    
    setTimeout(() => {
      if (inputRef.current) {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          inputRef.current.value = node.text;
          inputRef.current.focus();
          inputRef.current.select();
        }
      }
    }, 0);
  }, [nodes]);

  // 完成编辑节点
  const finishEditingNode = useCallback(() => {
    if (!editingNode || !inputRef.current) return;

    const newText = inputRef.current.value.trim() || '未命名';
    
    setNodes(prev => prev.map(node => 
      node.id === editingNode 
        ? { ...node, text: newText }
        : node
    ));
    
    setEditingNode(null);
  }, [editingNode]);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / devicePixelRatio / rect.width;
    const scaleY = canvas.height / devicePixelRatio / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const node = getNodeAtPoint(x, y);
    
    if (node) {
      setSelectedNode(node.id);
      setDraggedNode(node.id);
      setDragOffset({
        x: x - node.x,
        y: y - node.y
      });
    } else {
      setSelectedNode(null);
    }
  }, [getNodeAtPoint, devicePixelRatio]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / devicePixelRatio / rect.width;
    const scaleY = canvas.height / devicePixelRatio / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setNodes(prev => prev.map(node => 
      node.id === draggedNode
        ? { 
            ...node, 
            x: x - dragOffset.x,
            y: y - dragOffset.y
          }
        : node
    ));
  }, [draggedNode, dragOffset, devicePixelRatio]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / devicePixelRatio / rect.width;
    const scaleY = canvas.height / devicePixelRatio / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const node = getNodeAtPoint(x, y);
    
    if (node) {
      startEditingNode(node.id);
    }
  }, [getNodeAtPoint, startEditingNode, devicePixelRatio]);

  // 键盘事件处理
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editingNode) return;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (selectedNode) {
          createNode(selectedNode);
        }
        break;
      case 'Enter':
        if (selectedNode) {
          startEditingNode(selectedNode);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (selectedNode) {
          deleteNode(selectedNode);
        }
        break;
    }
  }, [selectedNode, editingNode, createNode, startEditingNode, deleteNode]);

  // 初始化
  useEffect(() => {
    parseContent(content);
  }, [content, parseContent]);

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
    return () => window.removeEventListener('resize', handleResize);
  }, [setupHighDPICanvas]);

  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    saveMindMapData();
  }, [nodes, edges, saveMindMapData]);

  return (
    <div ref={containerRef} className="mindmap-editor">
      <div className="mindmap-toolbar">
        <div className="mindmap-info">
          <span>{nodes.length} 个节点</span>
        </div>
        <div className="mindmap-actions">
          <button 
            className="mindmap-action-btn"
            onClick={() => selectedNode && createNode(selectedNode)}
            disabled={!selectedNode}
            title="添加子节点 (Tab)"
          >
            ➕ 添加节点
          </button>
          <button 
            className="mindmap-action-btn"
            onClick={() => selectedNode && startEditingNode(selectedNode)}
            disabled={!selectedNode}
            title="编辑节点 (Enter)"
          >
            ✏️ 编辑
          </button>
          <button 
            className="mindmap-action-btn"
            onClick={() => selectedNode && deleteNode(selectedNode)}
            disabled={!selectedNode || selectedNode === 'root'}
            title="删除节点 (Delete)"
          >
            🗑️ 删除
          </button>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        className="mindmap-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'calc(100% - 50px)',
          display: 'block'
        }}
      />
      
      {editingNode && (
        <input
          ref={inputRef}
          className="mindmap-edit-input"
          onBlur={finishEditingNode}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              finishEditingNode();
            } else if (e.key === 'Escape') {
              setEditingNode(null);
            }
          }}
          style={{
            position: 'absolute',
            left: -9999,
            top: -9999,
            opacity: 0
          }}
        />
      )}
    </div>
  );
};

export default MindMapEditor;