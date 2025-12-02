// 基础工具类 - 所有绘图工具的基类

class BaseTool {
  constructor(paperScope) {
    this.paperScope = paperScope;
    this.tool = null;
    this.name = 'base';
    this.label = '基础工具';
  }

  /**
   * 初始化工具
   */
  initialize() {
    if (!this.paperScope) {
      console.error('Paper.js scope is not available');
      return;
    }

    // 创建Paper.js工具实例
    this.tool = new this.paperScope.Tool();
    
    // 设置基础事件处理
    this.setupEventHandlers();
    
    return this.tool;
  }

  /**
   * 设置事件处理器
   * 子类应该重写此方法来实现具体的工具行为
   */
  setupEventHandlers() {
    // 基础鼠标事件框架
    if (this.tool) {
      this.tool.onMouseDown = this.onMouseDown.bind(this);
      this.tool.onMouseDrag = this.onMouseDrag.bind(this);
      this.tool.onMouseUp = this.onMouseUp.bind(this);
      this.tool.onMouseMove = this.onMouseMove.bind(this);
    }
  }

  /**
   * 鼠标按下事件
   */
  onMouseDown(event) {
    // 子类应该重写此方法
    console.log('BaseTool: Mouse down', event);
  }

  /**
   * 鼠标拖动事件
   */
  onMouseDrag(event) {
    // 子类应该重写此方法
    console.log('BaseTool: Mouse drag', event);
  }

  /**
   * 鼠标释放事件
   */
  onMouseUp(event) {
    // 子类应该重写此方法
    console.log('BaseTool: Mouse up', event);
  }

  /**
   * 鼠标移动事件
   */
  onMouseMove(event) {
    // 子类应该重写此方法
  }

  /**
   * 激活工具
   */
  activate() {
    if (this.tool) {
      this.tool.activate();
    }
  }

  /**
   * 停用工具
   */
  deactivate() {
    // 可以在这里清理工具相关的资源
  }

  /**
   * 设置工具选项
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.tool) {
      // 从Paper.js工具列表中移除
      const toolIndex = this.paperScope.tools.indexOf(this.tool);
      if (toolIndex !== -1) {
        this.paperScope.tools.splice(toolIndex, 1);
      }
      this.tool = null;
    }
  }
}

export default BaseTool;
