import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';

/**
 * 图像同步钩子
 * 用于同步OpenSeaDragon图像查看器和Paper.js画布的状态
 */
export function useImageSync(options = {}) {
  // 同步状态
  const syncState = reactive({
    enabled: options.enabled !== false,
    isInitialized: false,
    syncZoom: options.syncZoom !== false,
    syncPan: options.syncPan !== false,
    syncRotation: options.syncRotation !== false,
    lastSyncTime: null
  });
  
  // 图像查看器引用
  const viewerRef = ref(null);
  
  // 画布引用
  const canvasRef = ref(null);
  
  // 当前视图状态
  const viewState = reactive({
    zoom: 1,
    center: { x: 0, y: 0 },
    rotation: 0,
    viewportWidth: 0,
    viewportHeight: 0
  });
  
  // 同步配置
  const syncConfig = reactive({
    // 防抖延迟时间（毫秒）
    debounceDelay: options.debounceDelay || 16,
    // 最小同步变化阈值
    minChangeThreshold: options.minChangeThreshold || 0.01,
    // 自动同步间隔（毫秒）
    autoSyncInterval: options.autoSyncInterval || null
  });
  
  // 防抖定时器
  let debounceTimer = null;
  
  // 自动同步定时器
  let autoSyncTimer = null;
  
  // 事件监听器
  const eventListeners = {};
  
  /**
   * 初始化同步
   * @param {Object} viewer - OpenSeaDragon查看器实例
   * @param {Object} canvas - Paper.js画布实例
   */
  const initialize = (viewer, canvas) => {
    if (!viewer || !canvas) {
      console.error('Viewer and canvas instances are required for initialization');
      return false;
    }
    
    viewerRef.value = viewer;
    canvasRef.value = canvas;
    
    // 注册事件监听
    registerEventListeners();
    
    // 设置初始状态
    updateViewStateFromViewer();
    
    // 启动自动同步（如果配置了）
    if (syncConfig.autoSyncInterval) {
      startAutoSync();
    }
    
    syncState.isInitialized = true;
    return true;
  };
  
  /**
   * 注册事件监听器
   */
  const registerEventListeners = () => {
    if (!viewerRef.value) return;
    
    // 注册OpenSeaDragon视图变化事件
    const viewer = viewerRef.value;
    
    // 视图变化事件
    eventListeners.viewerBoundsChange = (event) => {
      if (syncState.enabled && syncState.syncZoom && syncState.syncPan) {
        debounceSync(() => {
          updateViewStateFromViewer();
          syncViewStateToCanvas();
        });
      }
    };
    
    viewer.addHandler('animation', eventListeners.viewerBoundsChange);
    viewer.addHandler('zoom', eventListeners.viewerBoundsChange);
    viewer.addHandler('pan', eventListeners.viewerBoundsChange);
    viewer.addHandler('rotate', (event) => {
      if (syncState.enabled && syncState.syncRotation) {
        debounceSync(() => {
          updateViewStateFromViewer();
          syncViewStateToCanvas();
        });
      }
    });
    
    // 视口大小变化事件
    eventListeners.viewerResize = () => {
      debounceSync(() => {
        updateViewStateFromViewer();
        syncViewStateToCanvas();
      });
    };
    
    window.addEventListener('resize', eventListeners.viewerResize);
  };
  
  /**
   * 取消注册事件监听器
   */
  const unregisterEventListeners = () => {
    if (!viewerRef.value) return;
    
    const viewer = viewerRef.value;
    
    // 移除OpenSeaDragon事件监听器
    if (eventListeners.viewerBoundsChange) {
      viewer.removeHandler('animation', eventListeners.viewerBoundsChange);
      viewer.removeHandler('zoom', eventListeners.viewerBoundsChange);
      viewer.removeHandler('pan', eventListeners.viewerBoundsChange);
    }
    
    if (eventListeners.viewerResize) {
      window.removeEventListener('resize', eventListeners.viewerResize);
    }
    
    // 清空事件监听器对象
    Object.keys(eventListeners).forEach(key => {
      delete eventListeners[key];
    });
  };
  
  /**
   * 从图像查看器更新视图状态
   */
  const updateViewStateFromViewer = () => {
    if (!viewerRef.value) return;
    
    const viewer = viewerRef.value;
    const viewport = viewer.viewport;
    
    // 更新缩放、平移和旋转状态
    viewState.zoom = viewport.getZoom();
    viewState.center = viewport.getCenter();
    viewState.rotation = viewport.getRotation();
    
    // 更新视口尺寸
    viewState.viewportWidth = viewer.drawer.canvas.clientWidth;
    viewState.viewportHeight = viewer.drawer.canvas.clientHeight;
    
    // 更新最后同步时间
    syncState.lastSyncTime = Date.now();
  };
  
  /**
   * 将视图状态同步到画布
   */
  const syncViewStateToCanvas = () => {
    if (!canvasRef.value || !syncState.enabled) return;
    
    try {
      // 这里实现将视图状态应用到Paper.js画布的逻辑
      // 通常包括：缩放变换、平移变换、旋转变换等
      
      const canvas = canvasRef.value;
      
      // 应用变换到画布
      applyTransformations(canvas);
    } catch (error) {
      console.error('Error syncing view state to canvas:', error);
    }
  };
  
  /**
   * 应用变换到画布
   */
  const applyTransformations = (canvas) => {
    if (!canvas) return;
    
    // 获取Paper.js作用域
    const paperScope = canvas.paperScope;
    if (!paperScope) return;
    
    // 获取标注图层
    const annotationLayer = paperScope.project.layers.find(layer => layer.name === 'annotations');
    if (!annotationLayer) return;
    
    // 保存当前变换状态
    annotationLayer.save();
    
    // 重置变换
    annotationLayer.transform(new paperScope.Matrix());
    
    // 计算画布中心
    const canvasCenter = new paperScope.Point(
      viewState.viewportWidth / 2,
      viewState.viewportHeight / 2
    );
    
    // 应用变换：平移到中心 -> 缩放 -> 平移到指定位置 -> 旋转
    if (syncState.syncPan) {
      // 计算平移向量
      const centerPoint = new paperScope.Point(viewState.center.x, viewState.center.y);
      const panVector = canvasCenter.subtract(centerPoint.divide(viewState.zoom));
      
      // 应用平移
      annotationLayer.translate(panVector);
    }
    
    if (syncState.syncZoom) {
      // 应用缩放
      annotationLayer.scale(viewState.zoom);
    }
    
    if (syncState.syncRotation && viewState.rotation !== 0) {
      // 应用旋转
      annotationLayer.rotate(viewState.rotation, canvasCenter);
    }
    
    // 更新显示
    paperScope.view.update();
  };
  
  /**
   * 手动同步视图状态
   */
  const manualSync = () => {
    if (!syncState.isInitialized) return false;
    
    updateViewStateFromViewer();
    syncViewStateToCanvas();
    return true;
  };
  
  /**
   * 防抖同步
   */
  const debounceSync = (callback) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      callback();
      debounceTimer = null;
    }, syncConfig.debounceDelay);
  };
  
  /**
   * 启动自动同步
   */
  const startAutoSync = () => {
    if (autoSyncTimer || !syncConfig.autoSyncInterval) return;
    
    autoSyncTimer = setInterval(() => {
      if (syncState.enabled) {
        manualSync();
      }
    }, syncConfig.autoSyncInterval);
  };
  
  /**
   * 停止自动同步
   */
  const stopAutoSync = () => {
    if (!autoSyncTimer) return;
    
    clearInterval(autoSyncTimer);
    autoSyncTimer = null;
  };
  
  /**
   * 启用同步
   */
  const enableSync = () => {
    syncState.enabled = true;
    
    // 启用时立即同步一次
    manualSync();
  };
  
  /**
   * 禁用同步
   */
  const disableSync = () => {
    syncState.enabled = false;
  };
  
  /**
   * 切换同步状态
   */
  const toggleSync = () => {
    syncState.enabled = !syncState.enabled;
    
    if (syncState.enabled) {
      // 启用时立即同步一次
      manualSync();
    }
    
    return syncState.enabled;
  };
  
  /**
   * 设置同步配置
   */
  const setSyncConfig = (config) => {
    Object.assign(syncConfig, config);
    
    // 如果更新了自动同步间隔，重新启动自动同步
    if (config.autoSyncInterval !== undefined) {
      stopAutoSync();
      if (syncConfig.autoSyncInterval) {
        startAutoSync();
      }
    }
  };
  
  /**
   * 重置同步状态
   */
  const resetSync = () => {
    // 重置视图状态
    viewState.zoom = 1;
    viewState.center = { x: 0, y: 0 };
    viewState.rotation = 0;
    
    // 重置同步状态
    syncState.lastSyncTime = null;
    
    // 同步到画布
    syncViewStateToCanvas();
  };
  
  /**
   * 获取当前同步状态
   */
  const getSyncState = () => {
    return {
      syncState: { ...syncState },
      viewState: { ...viewState },
      syncConfig: { ...syncConfig }
    };
  };
  
  /**
   * 销毁同步
   */
  const destroy = () => {
    // 停止自动同步
    stopAutoSync();
    
    // 清除防抖定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    
    // 取消注册事件监听器
    unregisterEventListeners();
    
    // 重置状态
    syncState.isInitialized = false;
    viewerRef.value = null;
    canvasRef.value = null;
  };
  
  /**
   * 手动设置视图状态
   */
  const setViewState = (state) => {
    // 更新视图状态
    Object.assign(viewState, state);
    
    // 同步到画布
    syncViewStateToCanvas();
    
    return true;
  };
  
  /**
   * 计算两个点在视图变化前后的映射关系
   */
  const mapPoint = (point, fromState, toState) => {
    // 实现点映射逻辑
    // 将点从一个视图状态映射到另一个视图状态
    const from = fromState || viewState;
    const to = toState || viewState;
    
    // 这里实现点的坐标转换
    // 这通常涉及到反变换和正变换的组合
    return { x: point.x, y: point.y };
  };
  
  // 组件卸载时清理
  onUnmounted(() => {
    destroy();
  });
  
  // 监听同步配置变化
  watch(
    () => syncConfig.autoSyncInterval,
    (newVal) => {
      stopAutoSync();
      if (newVal) {
        startAutoSync();
      }
    }
  );
  
  // 返回公开的方法和状态
  return {
    // 状态
    syncState,
    viewState,
    syncConfig,
    
    // 初始化和销毁
    initialize,
    destroy,
    
    // 同步控制
    enableSync,
    disableSync,
    toggleSync,
    manualSync,
    resetSync,
    
    // 配置管理
    setSyncConfig,
    getSyncState,
    
    // 视图控制
    setViewState,
    mapPoint
  };
}

export default useImageSync;
