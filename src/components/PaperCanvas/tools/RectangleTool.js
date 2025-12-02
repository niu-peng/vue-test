// 矩形工具类 - 继承自BaseTool
import BaseTool from './BaseTool.js';

class RectangleTool extends BaseTool {
  constructor(paperScope, options = {}) {
    super(paperScope);
    this.name = 'rectangle';
    this.label = '矩形';
    
    // 默认选项
    this.options = {
      strokeColor: '#00ff00',
      strokeWidth: 2,
      fillColor: 'rgba(0, 255, 0, 0.1)',
      ...options
    };
    
    // 工具状态
    this.rectangle = null;
    this.startPoint = null;
    this.onAnnotationCreated = null;
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    super.setupEventHandlers();
    
    // 添加自定义事件处理
    if (this.tool) {
      this.tool.onMouseDown = this.onMouseDown.bind(this);
      this.tool.onMouseDrag = this.onMouseDrag.bind(this);
      this.tool.onMouseUp = this.onMouseUp.bind(this);
    }
  }

  /**
   * 鼠标按下事件 - 开始绘制矩形
   */
  onMouseDown(event) {
    const { PaperScope } = this.paperScope;
    this.startPoint = event.point;
    
    // 创建初始矩形
    this.rectangle = new this.paperScope.Path.Rectangle(
      this.startPoint,
      new this.paperScope.Size(1, 1)
    );
    
    // 设置矩形样式
    this.rectangle.strokeColor = this.options.strokeColor;
    this.rectangle.strokeWidth = this.options.strokeWidth;
    
    if (this.options.fillColor) {
      this.rectangle.fillColor = this.options.fillColor;
    }
    
    // 添加唯一标识
    this.rectangle.data.id = this.generateId();
    this.rectangle.data.type = 'rectangle';
  }

  /**
   * 鼠标拖动事件 - 更新矩形大小
   */
  onMouseDrag(event) {
    if (!this.rectangle || !this.startPoint) return;
    
    // 计算矩形尺寸
    const width = event.point.x - this.startPoint.x;
    const height = event.point.y - this.startPoint.y;
    
    // 更新矩形边界
    this.rectangle.bounds = new this.paperScope.Rectangle(
      this.startPoint,
      new this.paperScope.Size(width, height)
    );
  }

  /**
   * 鼠标释放事件 - 完成矩形绘制
   */
  onMouseUp() {
    if (!this.rectangle) return;
    
    // 创建标注数据对象
    const annotationData = {
      id: this.rectangle.data.id,
      type: 'rectangle',
      position: {
        x: this.rectangle.position.x,
        y: this.rectangle.position.y
      },
      size: {
        width: this.rectangle.bounds.width,
        height: this.rectangle.bounds.height
      },
      style: {
        strokeColor: this.options.strokeColor,
        strokeWidth: this.options.strokeWidth,
        fillColor: this.options.fillColor
      },
      createdAt: new Date().toISOString()
    };
    
    // 触发回调
    if (this.onAnnotationCreated) {
      this.onAnnotationCreated(annotationData);
    }
    
    // 重置状态
    this.rectangle = null;
    this.startPoint = null;
  }

  /**
   * 设置标注创建回调
   */
  setOnAnnotationCreated(callback) {
    this.onAnnotationCreated = callback;
  }

  /**
   * 清理资源
   */
  destroy() {
    super.destroy();
    this.rectangle = null;
    this.startPoint = null;
    this.onAnnotationCreated = null;
  }
}

export default RectangleTool;
