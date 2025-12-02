<template>
  <div class="paper-canvas-container">
    <canvas 
      ref="paperCanvas"
      class="paper-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
    ></canvas>
    <h2 style="position: absolute; top: 0;">This is a work in progress (WIP). Please note that it may not be open source and its maintenance is not committed to the long term.</h2>
    <div class="canvas-tools">
      <button 
        v-for="tool in availableTools" 
        :key="tool.name"
        :class="['tool-btn', { active: currentTool === tool.name }]"
        @click="selectTool(tool.name)"
      >
        {{ tool.label }}
      </button>
      <button @click="clearCanvas" class="tool-btn clear-btn">清除</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

// PaperCanvas组件
export default {
  name: 'PaperCanvas',
  props: {
    // 画布尺寸
    width: {
      type: Number,
      default: 800
    },
    height: {
      type: Number,
      default: 600
    },
    // 初始工具
    initialTool: {
      type: String,
      default: 'select'
    },
    // 图像视图状态
    viewState: {
      type: Object,
      default: () => ({ zoom: 1, center: { x: 0, y: 0 } })
    },
    // 图像尺寸
    imageSize: {
      type: Object,
      default: () => ({ width: 800, height: 600 })
    }
  },
  emits: ['canvas-ready', 'annotation-created', 'annotation-updated', 'annotation-deleted'],
  setup(props, { emit }) {
    const paperCanvas = ref(null);
    const canvasWidth = ref(props.width);
    const canvasHeight = ref(props.height);
    const currentTool = ref(props.initialTool);
    let paper = null;
    let paperScope = null;
    
    // 可用工具列表
    const availableTools = [
      { name: 'select', label: '选择' },
      { name: 'pen', label: '画笔' },
      { name: 'rectangle', label: '矩形' },
      { name: 'circle', label: '圆形' },
      { name: 'line', label: '直线' }
    ];

    // 初始化Paper.js
    const initPaper = async () => {
      try {
        // 动态导入Paper.js
        const PaperModule = await import('paper');
        paper = PaperModule.default;

        if (!paperCanvas.value) return;

        // 设置Paper.js作用域
        paper.setup(paperCanvas.value);
        paperScope = paper.defaultScope;

        // 初始设置
        setupCanvas();

        // 通知父组件画布已准备就绪
        emit('canvas-ready', paperScope);

      } catch (error) {
        console.error('Failed to initialize Paper.js:', error);
      }
    };

    // 设置画布
    const setupCanvas = () => {
      if (!paperScope) return;

      // 清除现有内容
      paperScope.project.clear();

      // 创建图层
      const annotationLayer = new paperScope.Layer();
      annotationLayer.name = 'annotations';

      // 初始选择工具
      selectTool(currentTool.value);
    };

    // 选择工具
    const selectTool = (toolName) => {
      currentTool.value = toolName;
      if (!paperScope) return;

      // 清除现有工具
      paperScope.tools.length = 0;

      switch (toolName) {
        case 'select':
          setupSelectTool();
          break;
        case 'pen':
          setupPenTool();
          break;
        case 'rectangle':
          setupRectangleTool();
          break;
        case 'circle':
          setupCircleTool();
          break;
        case 'line':
          setupLineTool();
          break;
      }
    };

    // 设置选择工具
    const setupSelectTool = () => {
      const tool = new paperScope.Tool();
      let selectedItem = null;
      let initialPosition = null;

      tool.onMouseDown = (event) => {
        selectedItem = event.item;
        initialPosition = event.point;
      };

      tool.onMouseDrag = (event) => {
        if (selectedItem) {
          selectedItem.position = initialPosition.add(event.delta);
          emit('annotation-updated', {
            id: selectedItem.data.id,
            position: selectedItem.position
          });
        }
      };

      tool.onMouseUp = () => {
        selectedItem = null;
        initialPosition = null;
      };
    };

    // 设置画笔工具
    const setupPenTool = () => {
      const tool = new paperScope.Tool();
      let path = null;

      tool.onMouseDown = (event) => {
        path = new paperScope.Path();
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
          emit('annotation-created', {
            id: path.data.id,
            type: 'path',
            points: path.segments.map(s => ({ x: s.point.x, y: s.point.y })),
            style: {
              strokeColor: path.strokeColor.toCSS(),
              strokeWidth: path.strokeWidth
            }
          });
        }
      };
    };

    // 设置矩形工具
    const setupRectangleTool = () => {
      const tool = new paperScope.Tool();
      let rectangle = null;
      let startPoint = null;

      tool.onMouseDown = (event) => {
        startPoint = event.point;
        rectangle = new paperScope.Path.Rectangle(startPoint, new paperScope.Size(1, 1));
        rectangle.strokeColor = '#00ff00';
        rectangle.strokeWidth = 2;
        rectangle.fillColor = 'rgba(0, 255, 0, 0.1)';
        rectangle.data.id = generateId();
      };

      tool.onMouseDrag = (event) => {
        if (rectangle && startPoint) {
          const width = event.point.x - startPoint.x;
          const height = event.point.y - startPoint.y;
          rectangle.bounds = new paperScope.Rectangle(startPoint, new paperScope.Size(width, height));
        }
      };

      tool.onMouseUp = () => {
        if (rectangle) {
          emit('annotation-created', {
            id: rectangle.data.id,
            type: 'rectangle',
            position: { x: rectangle.position.x, y: rectangle.position.y },
            size: { width: rectangle.bounds.width, height: rectangle.bounds.height },
            style: {
              strokeColor: rectangle.strokeColor.toCSS(),
              strokeWidth: rectangle.strokeWidth,
              fillColor: rectangle.fillColor ? rectangle.fillColor.toCSS() : null
            }
          });
        }
        rectangle = null;
        startPoint = null;
      };
    };

    // 设置圆形工具
    const setupCircleTool = () => {
      const tool = new paperScope.Tool();
      let circle = null;
      let startPoint = null;

      tool.onMouseDown = (event) => {
        startPoint = event.point;
        circle = new paperScope.Path.Circle(startPoint, 1);
        circle.strokeColor = '#0000ff';
        circle.strokeWidth = 2;
        circle.fillColor = 'rgba(0, 0, 255, 0.1)';
        circle.data.id = generateId();
      };

      tool.onMouseDrag = (event) => {
        if (circle && startPoint) {
          const radius = startPoint.getDistance(event.point);
          circle.bounds = new paperScope.Rectangle(
            startPoint.subtract(new paperScope.Point(radius, radius)),
            startPoint.add(new paperScope.Point(radius, radius))
          );
        }
      };

      tool.onMouseUp = () => {
        if (circle) {
          emit('annotation-created', {
            id: circle.data.id,
            type: 'circle',
            position: { x: circle.position.x, y: circle.position.y },
            radius: circle.bounds.width / 2,
            style: {
              strokeColor: circle.strokeColor.toCSS(),
              strokeWidth: circle.strokeWidth,
              fillColor: circle.fillColor ? circle.fillColor.toCSS() : null
            }
          });
        }
        circle = null;
        startPoint = null;
      };
    };

    // 设置直线工具
    const setupLineTool = () => {
      const tool = new paperScope.Tool();
      let line = null;
      let startPoint = null;

      tool.onMouseDown = (event) => {
        startPoint = event.point;
        line = new paperScope.Path.Line(startPoint, startPoint);
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
          emit('annotation-created', {
            id: line.data.id,
            type: 'line',
            start: { x: line.segments[0].point.x, y: line.segments[0].point.y },
            end: { x: line.segments[1].point.x, y: line.segments[1].point.y },
            style: {
              strokeColor: line.strokeColor.toCSS(),
              strokeWidth: line.strokeWidth
            }
          });
        }
        line = null;
        startPoint = null;
      };
    };

    // 清除画布
    const clearCanvas = () => {
      if (paperScope) {
        // 只清除标注图层
        const annotationLayer = paperScope.project.layers.find(layer => layer.name === 'annotations');
        if (annotationLayer) {
          annotationLayer.removeChildren();
        }
      }
    };

    // 生成唯一ID
    const generateId = () => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    // 根据视图状态缩放画布内容
    const updateCanvasWithViewState = () => {
      if (!paperScope || !props.viewState) return;

      const { zoom, center } = props.viewState;
      const { width: imageWidth, height: imageHeight } = props.imageSize;

      // 计算缩放比例和位置
      const scaleFactor = zoom;
      const translateX = canvasWidth.value / 2 - center.x * scaleFactor;
      const translateY = canvasHeight.value / 2 - center.y * scaleFactor;

      // 应用变换到标注图层
      const annotationLayer = paperScope.project.layers.find(layer => layer.name === 'annotations');
      if (annotationLayer) {
        // 保存标注的相对位置
        const annotations = annotationLayer.children.slice();
        
        // 应用视图变换
        annotationLayer.transformContent = false;
        annotationLayer.applyMatrix = false;
        annotationLayer.scale(scaleFactor);
        annotationLayer.position.x += translateX / scaleFactor;
        annotationLayer.position.y += translateY / scaleFactor;
      }
    };

    // 监听视图状态变化
    watch(
      () => props.viewState,
      () => {
        nextTick(() => {
          updateCanvasWithViewState();
        });
      },
      { deep: true }
    );

    // 监听尺寸变化
    watch(
      [() => props.width, () => props.height],
      ([newWidth, newHeight]) => {
        canvasWidth.value = newWidth;
        canvasHeight.value = newHeight;
        if (paperScope) {
          paperScope.view.viewSize = new paperScope.Size(newWidth, newHeight);
        }
      }
    );

    onMounted(() => {
      initPaper();
    });

    onUnmounted(() => {
      if (paperScope) {
        paperScope.project.clear();
        paperScope = null;
      }
    });

    return {
      paperCanvas,
      canvasWidth,
      canvasHeight,
      currentTool,
      availableTools,
      selectTool,
      clearCanvas
    };
  }
};
</script>

<style scoped>
.paper-canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.paper-canvas {
  flex: 1;
  background-color: transparent;
  cursor: crosshair;
  border: 1px solid #ddd;
}

.canvas-tools {
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.tool-btn {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.tool-btn:hover {
  background-color: #e0e0e0;
}

.tool-btn.active {
  background-color: #4285f4;
  color: white;
  border-color: #4285f4;
}

.clear-btn {
  margin-left: auto;
  background-color: #ea4335;
  color: white;
  border-color: #ea4335;
}

.clear-btn:hover {
  background-color: #d3332a;
}
</style>
