import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';

/**
 * OpenSeaDragon图像查看器钩子
 * 用于管理OpenSeaDragon的状态和操作
 */
export function useImageViewer(options = {}) {
  // 查看器实例
  const viewer = ref(null);
  
  // 查看器状态
  const viewState = reactive({
    zoom: 1,
    center: { x: 0, y: 0 },
    rotation: 0,
    isOpen: false,
    isLoading: true
  });
  
  // 配置选项
  const config = reactive({
    prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
    showNavigationControl: true,
    showZoomControl: true,
    showHomeControl: true,
    showFullPageControl: true,
    defaultZoomLevel: 1,
    minZoomLevel: 0.5,
    maxZoomLevel: 10,
    ...options
  });
  
  // OpenSeaDragon库引用
  let OpenSeaDragon = null;
  
  /**
   * 初始化查看器
   * @param {HTMLElement} containerElement - 容器元素
   * @param {string|Object} tileSources - 图像源
   */
  const initViewer = async (containerElement, tileSources = null) => {
    if (!containerElement) {
      console.error('Container element is required');
      return;
    }
    
    try {
      // 动态导入OpenSeaDragon
      const OpenSeaDragonModule = await import('openseadragon');
      OpenSeaDragon = OpenSeaDragonModule.default;
      
      // 准备配置
      const viewerOptions = {
        ...config,
        element: containerElement
      };
      
      // 如果提供了图像源，添加到配置中
      if (tileSources) {
        viewerOptions.tileSources = tileSources;
      }
      
      // 创建查看器实例
      viewer.value = OpenSeaDragon(viewerOptions);
      
      // 设置事件监听器
      setupEventListeners();
      
      return viewer.value;
    } catch (error) {
      console.error('Failed to initialize OpenSeaDragon viewer:', error);
      return null;
    }
  };
  
  /**
   * 设置事件监听器
   */
  const setupEventListeners = () => {
    if (!viewer.value) return;
    
    // 图像打开事件
    viewer.value.addHandler('open', () => {
      viewState.isOpen = true;
      viewState.isLoading = false;
      updateViewState();
    });
    
    // 视图变换完成事件
    viewer.value.addHandler('animation-finish', () => {
      updateViewState();
    });
    
    // 缩放事件
    viewer.value.addHandler('zoom', (event) => {
      viewState.zoom = event.zoom;
    });
    
    // 平移事件
    viewer.value.addHandler('pan', () => {
      const center = viewer.value.viewport.getCenter();
      viewState.center = { x: center.x, y: center.y };
    });
    
    // 加载开始事件
    viewer.value.addHandler('tile-loading', () => {
      viewState.isLoading = true;
    });
    
    // 加载完成事件
    viewer.value.addHandler('tile-loaded', () => {
      // 检查是否还有加载中的瓦片
      if (viewer.value.world.getItemAt(0)?.getTileCache()?.getLoadingTiles().length === 0) {
        viewState.isLoading = false;
      }
    });
  };
  
  /**
   * 更新视图状态
   */
  const updateViewState = () => {
    if (!viewer.value) return;
    
    const viewport = viewer.value.viewport;
    const center = viewport.getCenter();
    
    viewState.zoom = viewport.getZoom();
    viewState.center = { x: center.x, y: center.y };
    viewState.rotation = viewport.getRotation();
  };
  
  /**
   * 打开图像
   * @param {string|Object} tileSources - 图像源
   */
  const openImage = (tileSources) => {
    if (!viewer.value) {
      console.error('Viewer is not initialized');
      return;
    }
    
    viewState.isLoading = true;
    viewer.value.open(tileSources);
  };
  
  /**
   * 放大
   * @param {number} factor - 缩放因子
   */
  const zoomIn = (factor = 1.2) => {
    if (!viewer.value) return;
    viewer.value.viewport.zoomBy(factor);
  };
  
  /**
   * 缩小
   * @param {number} factor - 缩放因子
   */
  const zoomOut = (factor = 0.8) => {
    if (!viewer.value) return;
    viewer.value.viewport.zoomBy(factor);
  };
  
  /**
   * 重置视图
   */
  const resetView = () => {
    if (!viewer.value) return;
    viewer.value.viewport.goHome();
  };
  
  /**
   * 设置缩放级别
   * @param {number} zoomLevel - 缩放级别
   */
  const setZoom = (zoomLevel) => {
    if (!viewer.value) return;
    viewer.value.viewport.zoomTo(zoomLevel);
  };
  
  /**
   * 设置中心点
   * @param {Object} centerPoint - 中心点坐标 {x, y}
   */
  const setCenter = (centerPoint) => {
    if (!viewer.value) return;
    viewer.value.viewport.center(centerPoint);
  };
  
  /**
   * 设置旋转角度
   * @param {number} rotation - 旋转角度（度）
   */
  const setRotation = (rotation) => {
    if (!viewer.value) return;
    viewer.value.viewport.setRotation(rotation);
  };
  
  /**
   * 定位到特定区域
   * @param {Object} rect - 矩形区域 {x, y, width, height}
   */
  const fitBounds = (rect) => {
    if (!viewer.value) return;
    
    const bounds = new OpenSeaDragon.Rect(rect.x, rect.y, rect.width, rect.height);
    viewer.value.viewport.fitBoundsWithConstraints(bounds);
  };
  
  /**
   * 获取当前视图状态
   * @returns {Object} 视图状态
   */
  const getViewState = () => {
    return {
      zoom: viewState.zoom,
      center: { ...viewState.center },
      rotation: viewState.rotation
    };
  };
  
  /**
   * 设置视图状态
   * @param {Object} state - 视图状态 {zoom, center, rotation}
   */
  const setViewState = (state) => {
    if (!viewer.value) return;
    
    nextTick(() => {
      if (state.zoom !== undefined) {
        viewer.value.viewport.zoomTo(state.zoom);
      }
      
      if (state.center) {
        viewer.value.viewport.center(state.center);
      }
      
      if (state.rotation !== undefined) {
        viewer.value.viewport.setRotation(state.rotation);
      }
    });
  };
  
  /**
   * 获取图像尺寸
   * @returns {Object|null} 图像尺寸 {width, height}
   */
  const getImageSize = () => {
    if (!viewer.value || !viewer.value.world || viewer.value.world.getItemCount() === 0) {
      return null;
    }
    
    const item = viewer.value.world.getItemAt(0);
    return {
      width: item.source.dimensions.x,
      height: item.source.dimensions.y
    };
  };
  
  /**
   * 销毁查看器
   */
  const destroy = () => {
    if (viewer.value) {
      viewer.value.destroy();
      viewer.value = null;
    }
    OpenSeaDragon = null;
  };
  
  // 组件卸载时清理
  onUnmounted(() => {
    destroy();
  });
  
  return {
    viewer,
    viewState,
    initViewer,
    openImage,
    zoomIn,
    zoomOut,
    resetView,
    setZoom,
    setCenter,
    setRotation,
    fitBounds,
    getViewState,
    setViewState,
    getImageSize,
    destroy
  };
}

export default useImageViewer;
