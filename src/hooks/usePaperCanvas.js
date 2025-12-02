import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue';

/**
 * Paper.js画布钩子
 * 用于管理Paper.js画布的状态和操作
 */
export function usePaperCanvas(options = {}) {
  // 画布引用
  const canvasRef = ref(null);
  
  // Paper.js作用域
  const paperScope = ref(null);
  
  // 画布状态
  const canvasState = reactive({
    width: options.width || 800,
    height: options.height || 600,
    isReady: false,
    currentTool: options.initialTool || 'select',
    annotations: []
  });
  
  // 可用工具列表
  const availableTools = reactive([
    { name: 'select', label: '选择' },
    { name: 'pen', label: '画笔' },
    { name: 'rectangle', label: '矩形' },
    { name: 'circle', label: '圆形' },
    { name: 'line', label: '直线' }
  ]);
  
  // 视图状态同步
  const viewState = reactive({
    zoom: 1,
    center: { x: 0, y: 0 },
    rotation: 0
  });
  
  // Paper.js库引用
  let Paper = null;
  
  // 当前活动的工具实例
  let activeTool = null;
  
  /**
   * 初始化Paper.js
   * @param {HTMLCanvasElement} canvasElement - 画布元素
   */
  const initPaper = async (canvasElement) => {
    if (!canvasElement) {
      console.error('Canvas element is required');
      return;
    }
    
    try {
      // 动态导入Paper.js
      const PaperModule = await import('paper');
      Paper = PaperModule.default;
      
      // 设置Paper.js
      Paper.setup(canvasElement);
      paperScope.value = Paper.defaultScope;
      
      // 初始化画布
      setupCanvas();
      
      // 设置初始工具
      selectTool(canvasState.currentTool);
      
      // 设置画布已准备就绪
      canvasState.isReady = true;
      
      return paperScope.value;
    } catch (error) {
      console.error('Failed to initialize Paper.js:', error);
      return null;
    }
  };
  
  /**
   * 设置画布
   */
  const setupCanvas = () => {
    if (!paperScope.value) return;
    
    // 清除现有内容
    paperScope.value.project.clear();
    
    // 创建标注图层
    const annotationLayer = new paperScope.value.Layer();
    annotationLayer.name = 'annotations';
    
    // 创建背景图层（可选）
    const backgroundLayer = new paperScope.value.Layer();
    backgroundLayer.name = 'background';
    backgroundLayer.sendToBack();
  };
  
  /**
   * 选择工具
   * @param {string} toolName - 工具名称
   */
  const selectTool = (toolName) => {
    if (!paperScope.value) return;
    
    // 检查工具是否存在
    const toolExists = availableTools.some(tool => tool.name === toolName);
    if (!toolExists) {
      console.warn(`Tool '${toolName}' is not available`);
      return;
    }
    
    // 更新当前工具
    canvasState.currentTool = toolName;
    
    // 清除现有工具
    paperScope.value.tools.length = 0;
    
    // 创建新工具
    createTool(toolName);
  };
  
  /**
   * 创建工具实例
   * @param {string} toolName - 工具名称
   */
  const createTool = (toolName) => {
    if (!paperScope.value) return;
    
    const tool = new paperScope.value.Tool();
    activeTool = tool;
    
    switch (toolName) {
      case 'select':
        setupSelectTool(tool);
        break;
      case 'pen':
        setupPenTool(tool);
        break;
      case 'rectangle':
        setupRectangleTool(tool);
        break;
      case 'circle':
        setupCircleTool(tool);
        break;
      case 'line':
        setupLineTool(tool);
        break;
    }
    
    // 激活工具
    tool.activate();
  };
  
  /**
   * 设置选择工具
   */
  const setupSelectTool = (tool) => {
    let selectedItem = null;
    let initialPosition = null;
    
    tool.onMouseDown = (event) => {
      selectedItem = event.item;
      initialPosition = event.point;
    };
    
    tool.onMouseDrag = (event) => {
      if (selectedItem) {
        selectedItem.position = initialPosition.add(event.delta);
        updateAnnotation(selectedItem);
      }
    };
    
    tool.onMouseUp = () => {
      selectedItem = null;
      initialPosition = null;
    };
  };
  
  /**
   * 设置画笔工具
   */
  const setupPenTool = (tool) => {
    let path = null;
    
    tool.onMouseDown = (event) => {
      path = new paperScope.value.Path();
      path.strokeColor = '#ff0000';
      path.strokeWidth = 2;
      path.add(event.point);
      path.data.id = generateId();
    };
    
    tool.onMouseDrag = (event) => {
      if (path) {
        path.add(event.point);
      }
    };
    
    tool.onMouseUp = () => {
      if (path) {
        path.simplify();
        const annotation = createAnnotationFromPath(path, 'path');
        addAnnotation(annotation);
      }
    };
  };
  
  /**
   * 设置矩形工具
   */
  const setupRectangleTool = (tool) => {
    let rectangle = null;
    let startPoint = null;
    
    tool.onMouseDown = (event) => {
      startPoint = event.point;
      rectangle = new paperScope.value.Path.Rectangle(startPoint, new paperScope.value.Size(1, 1));
      rectangle.strokeColor = '#00ff00';
      rectangle.strokeWidth = 2;
      rectangle.fillColor = 'rgba(0, 255, 0, 0.1)';
      rectangle.data.id = generateId();
    };
    
    tool.onMouseDrag = (event) => {
      if (rectangle && startPoint) {
        const width = event.point.x - startPoint.x;
        const height = event.point.y - startPoint.y;
        rectangle.bounds = new paperScope.value.Rectangle(startPoint, new paperScope.value.Size(width, height));
      }
    };
    
    tool.onMouseUp = () => {
      if (rectangle) {
        const annotation = createAnnotationFromRectangle(rectangle);
        addAnnotation(annotation);
      }
      rectangle = null;
      startPoint = null;
    };
  };
  
  /**
   * 设置圆形工具
   */
  const setupCircleTool = (tool) => {
    let circle = null;
    let startPoint = null;
    
    tool.onMouseDown = (event) => {
      startPoint = event.point;
      circle = new paperScope.value.Path.Circle(startPoint, 1);
      circle.strokeColor = '#0000ff';
      circle.strokeWidth = 2;
      circle.fillColor = 'rgba(0, 0, 255, 0.1)';
      circle.data.id = generateId();
    };
    
    tool.onMouseDrag = (event) => {
      if (circle && startPoint) {
        const radius = startPoint.getDistance(event.point);
        circle.bounds = new paperScope.value.Rectangle(
          startPoint.subtract(new paperScope.value.Point(radius, radius)),
          startPoint.add(new paperScope.value.Point(radius, radius))
        );
      }
    };
    
    tool.onMouseUp = () => {
      if (circle) {
        const annotation = createAnnotationFromCircle(circle);
        addAnnotation(annotation);
      }
      circle = null;
      startPoint = null;
    };
  };
  
  /**
   * 设置直线工具
   */
  const setupLineTool = (tool) => {
    let line = null;
    let startPoint = null;
    
    tool.onMouseDown = (event) => {
      startPoint = event.point;
      line = new paperScope.value.Path.Line(startPoint, startPoint);
      line.strokeColor = '#ffff00';
      line.strokeWidth = 2;
      line.data.id = generateId();
    };
    
    tool.onMouseDrag = (event) => {
      if (line && startPoint) {
        line.removeSegments();
        line.add(startPoint);
        line.add(event.point);
      }
    };
    
    tool.onMouseUp = () => {
      if (line) {
        const annotation = createAnnotationFromLine(line);
        addAnnotation(annotation);
      }
      line = null;
      startPoint = null;
    };
  };
  
  /**
   * 创建路径标注
   */
  const createAnnotationFromPath = (path, type = 'path') => {
    return {
      id: path.data.id,
      type,
      points: path.segments.map(s => ({ x: s.point.x, y: s.point.y })),
      style: {
        strokeColor: path.strokeColor ? path.strokeColor.toCSS() : null,
        strokeWidth: path.strokeWidth
      },
      createdAt: new Date().toISOString()
    };
  };
  
  /**
   * 创建矩形标注
   */
  const createAnnotationFromRectangle = (rectangle) => {
    return {
      id: rectangle.data.id,
      type: 'rectangle',
      position: { x: rectangle.position.x, y: rectangle.position.y },
      size: { width: rectangle.bounds.width, height: rectangle.bounds.height },
      style: {
        strokeColor: rectangle.strokeColor ? rectangle.strokeColor.toCSS() : null,
        strokeWidth: rectangle.strokeWidth,
        fillColor: rectangle.fillColor ? rectangle.fillColor.toCSS() : null
      },
      createdAt: new Date().toISOString()
    };
  };
  
  /**
   * 创建圆形标注
   */
  const createAnnotationFromCircle = (circle) => {
    return {
      id: circle.data.id,
      type: 'circle',
      position: { x: circle.position.x, y: circle.position.y },
      radius: circle.bounds.width / 2,
      style: {
        strokeColor: circle.strokeColor ? circle.strokeColor.toCSS() : null,
        strokeWidth: circle.strokeWidth,
        fillColor: circle.fillColor ? circle.fillColor.toCSS() : null
      },
      createdAt: new Date().toISOString()
    };
  };
  
  /**
   * 创建直线标注
   */
  const createAnnotationFromLine = (line) => {
    return {
      id: line.data.id,
      type: 'line',
      start: { x: line.segments[0].point.x, y: line.segments[0].point.y },
      end: { x: line.segments[1].point.x, y: line.segments[1].point.y },
      style: {
        strokeColor: line.strokeColor ? line.strokeColor.toCSS() : null,
        strokeWidth: line.strokeWidth
      },
      createdAt: new Date().toISOString()
    };
  };
  
  /**
   * 添加标注
   */
  const addAnnotation = (annotation) => {
    canvasState.annotations.push(annotation);
    // 可以在这里触发事件通知父组件
  };
  
  /**
   * 更新标注
   */
  const updateAnnotation = (item) => {
    if (!item || !item.data.id) return;
    
    const annotationIndex = canvasState.annotations.findIndex(a => a.id === item.data.id);
    if (annotationIndex === -1) return;
    
    // 根据类型更新标注
    switch (item.data.type || canvasState.annotations[annotationIndex].type) {
      case 'rectangle':
        canvasState.annotations[annotationIndex].position = {
          x: item.position.x,
          y: item.position.y
        };
        canvasState.annotations[annotationIndex].size = {
          width: item.bounds.width,
          height: item.bounds.height
        };
        break;
      case 'circle':
        canvasState.annotations[annotationIndex].position = {
          x: item.position.x,
          y: item.position.y
        };
        canvasState.annotations[annotationIndex].radius = item.bounds.width / 2;
        break;
      case 'path':
        canvasState.annotations[annotationIndex].points = item.segments.map(s => ({
          x: s.point.x,
          y: s.point.y
        }));
        break;
      case 'line':
        canvasState.annotations[annotationIndex].start = {
          x: item.segments[0].point.x,
          y: item.segments[0].point.y
        };
        canvasState.annotations[annotationIndex].end = {
          x: item.segments[1].point.x,
          y: item.segments[1].point.y
        };
        break;
    }
    
    canvasState.annotations[annotationIndex].updatedAt = new Date().toISOString();
  };
  
  /**
   * 删除标注
   */
  const deleteAnnotation = (id) => {
    const annotationIndex = canvasState.annotations.findIndex(a => a.id === id);
    if (annotationIndex === -1) return;
    
    // 从画布中移除对应的项
    if (paperScope.value) {
      const annotationLayer = paperScope.value.project.layers.find(layer => layer.name === 'annotations');
      if (annotationLayer) {
        const item = annotationLayer.children.find(child => child.data.id === id);
        if (item) {
          item.remove();
        }
      }
    }
    
    // 从状态中移除
    canvasState.annotations.splice(annotationIndex, 1);
  };
  
  /**
   * 清除所有标注
   */
  const clearAnnotations = () => {
    // 清空画布
    if (paperScope.value) {
      const annotationLayer = paperScope.value.project.layers.find(layer => layer.name === 'annotations');
      if (annotationLayer) {
        annotationLayer.removeChildren();
      }
    }
    
    // 清空状态
    canvasState.annotations = [];
  };
  
  /**
   * 更新画布尺寸
   */
  const updateSize = (width, height) => {
    canvasState.width = width;
    canvasState.height = height;
    
    if (paperScope.value) {
      paperScope.value.view.viewSize = new paperScope.value.Size(width, height);
    }
  };
  
  /**
   * 同步视图状态
   */
  const syncViewState = (state) => {
    Object.assign(viewState, state);
    
    // 应用视图变换到标注图层
    if (paperScope.value) {
      const annotationLayer = paperScope.value.project.layers.find(layer => layer.name === 'annotations');
      if (annotationLayer) {
        // 这里可以实现标注与视图的同步逻辑
      }
    }
  };
  
  /**
   * 生成唯一ID
   */
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };
  
  /**
   * 导出标注数据
   */
  const exportAnnotations = () => {
    return JSON.stringify(canvasState.annotations, null, 2);
  };
  
  /**
   * 导入标注数据
   */
  const importAnnotations = (jsonData) => {
    try {
      const annotations = JSON.parse(jsonData);
      // 清空现有标注
      clearAnnotations();
      
      // 添加新标注
      annotations.forEach(annotation => {
        drawAnnotation(annotation);
        canvasState.annotations.push(annotation);
      });
      
      return true;
    } catch (error) {
      console.error('Failed to import annotations:', error);
      return false;
    }
  };
  
  /**
   * 绘制标注
   */
  const drawAnnotation = (annotation) => {
    if (!paperScope.value) return;
    
    switch (annotation.type) {
      case 'rectangle':
        drawRectangle(annotation);
        break;
      case 'circle':
        drawCircle(annotation);
        break;
      case 'path':
        drawPath(annotation);
        break;
      case 'line':
        drawLine(annotation);
        break;
    }
  };
  
  // 绘制各种类型的辅助方法
  const drawRectangle = (annotation) => {
    // 实现绘制矩形逻辑
  };
  
  const drawCircle = (annotation) => {
    // 实现绘制圆形逻辑
  };
  
  const drawPath = (annotation) => {
    // 实现绘制路径逻辑
  };
  
  const drawLine = (annotation) => {
    // 实现绘制直线逻辑
  };
  
  /**
   * 销毁画布
   */
  const destroy = () => {
    if (paperScope.value) {
      paperScope.value.project.clear();
      paperScope.value = null;
    }
    activeTool = null;
    Paper = null;
  };
  
  // 组件卸载时清理
  onUnmounted(() => {
    destroy();
  });
  
  return {
    canvasRef,
    paperScope,
    canvasState,
    availableTools,
    initPaper,
    selectTool,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAnnotations,
    updateSize,
    syncViewState,
    exportAnnotations,
    importAnnotations,
    destroy
  };
}

export default usePaperCanvas;
