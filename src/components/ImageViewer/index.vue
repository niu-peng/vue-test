<template>
  <div class="image-viewer-container">
    <div ref="viewerContainer" class="viewer-container"></div>
    <div class="viewer-controls">
      <button @click="zoomIn" class="control-btn">放大</button>
      <button @click="zoomOut" class="control-btn">缩小</button>
      <button @click="resetView" class="control-btn">重置</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';

// 动态导入OpenSeaDragon，避免SSR问题
export default {
  name: 'ImageViewer',
  props: {
    // 图像URL或配置
    imageUrl: {
      type: String,
      default: ''
    },
    // 配置项
    options: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['viewer-ready', 'view-changed'],
  setup(props, { emit }) {
    const viewerContainer = ref(null);
    let viewer = null;
    let OpenSeaDragon = null;

    // 初始化查看器
    const initViewer = async () => {
      try {
        // 动态导入OpenSeaDragon
        const OpenSeaDragonModule = await import('openseadragon');
        OpenSeaDragon = OpenSeaDragonModule.default;

        if (!viewerContainer.value) return;

        // 默认配置
        const defaultOptions = {
          element: viewerContainer.value,
          prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
          tileSources: {
                        Image: {
                            xmlns: "http://schemas.microsoft.com/deepzoom/2008",
                            Url: "http://openseadragon.github.io/example-images/duomo/duomo_files/",
                            Format: "jpg",
                            Overlap: "0",
                            TileSize: "256",
                            Size: {
                                Height: "9221",
                                Width:  "7026"
                            }
                        }
                    },
          showNavigationControl: true,
          showZoomControl: true,
          showHomeControl: true,
          showFullPageControl: true,
          defaultZoomLevel: 1,
          minZoomLevel: 0.5,
          maxZoomLevel: 10
        };

        // 合并用户配置
        const config = { ...defaultOptions, ...props.options };

        // 创建查看器实例
        viewer = OpenSeaDragon(config);

        // 监听查看器事件
        viewer.addHandler('open', () => {
          console.log('Image viewer opened');
          // emit('viewer-ready', viewer);
        });

        viewer.addHandler('animation-finish', () => {
          // const viewport = viewer.viewport;
          // emit('view-changed', {
          //   zoom: viewport.getZoom(),
          //   center: viewport.getCenter()
          // });
        });

      } catch (error) {
        console.error('Failed to initialize OpenSeaDragon viewer:', error);
      }
    };

    // 放大
    const zoomIn = () => {
      if (viewer) {
        viewer.viewport.zoomBy(1.2);
      }
    };

    // 缩小
    const zoomOut = () => {
      if (viewer) {
        viewer.viewport.zoomBy(0.8);
      }
    };

    // 重置视图
    const resetView = () => {
      if (viewer) {
        viewer.viewport.goHome();
      }
    };

    // 获取当前视图状态
    const getViewState = () => {
      if (viewer) {
        const viewport = viewer.viewport;
        return {
          zoom: viewport.getZoom(),
          center: viewport.getCenter(),
          rotation: viewport.getRotation()
        };
      }
      return null;
    };

    // 设置视图状态
    const setViewState = (state) => {
      if (viewer && state) {
        if (state.zoom !== undefined) viewer.viewport.zoomTo(state.zoom);
        if (state.center) viewer.viewport.center(state.center);
        if (state.rotation !== undefined) viewer.viewport.setRotation(state.rotation);
      }
    };

    // 监听imageUrl变化
    watch(
      () => props.imageUrl,
      (newUrl) => {
        if (viewer && newUrl) {
          viewer.open(newUrl);
        }
      }
    );

    onMounted(() => {
      initViewer();
    });

    onUnmounted(() => {
      if (viewer) {
        viewer.destroy();
        viewer = null;
      }
    });

    return {
      viewerContainer,
      zoomIn,
      zoomOut,
      resetView,
      getViewState,
      setViewState
    };
  }
};
</script>

<style scoped>
.image-viewer-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.viewer-container {
  flex: 1;
  min-height: 0;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  overflow: hidden;
}

.viewer-controls {
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.control-btn {
  padding: 8px 16px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.control-btn:hover {
  background-color: #3367d6;
}

.control-btn:active {
  background-color: #2c5fc8;
}
</style>
