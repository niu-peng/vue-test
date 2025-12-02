<template>
  <div class="app-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <h1>Vue3 + OpenSeaDragon + Paper.js 图像查看与标注系统</h1>
      <div class="toolbar-controls">
        <label>
          <input type="checkbox" v-model="syncEnabled" @change="toggleSync">
          启用视图同步
        </label>
        <button @click="clearAnnotations" class="btn btn-warning">清除标注</button>
        <button @click="exportAnnotations" class="btn btn-success">导出标注</button>
        <input type="file" ref="fileInput" @change="importAnnotations" accept=".json" class="hidden">
        <button @click="triggerImport" class="btn btn-info">导入标注</button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="content-container">
      <!-- 左侧图像查看器 -->
      <div class="viewer-container">
        <h3>图像查看器</h3>
        <ImageViewer 
          ref="imageViewerRef"
          :image-url="imageUrl"
          :options="viewerOptions"
          @viewer-ready="onViewerReady"
          @view-change="onViewChange"
        />
      </div>

      <!-- 右侧标注画布 -->
      <div class="canvas-container">
        <h3>标注工具</h3>
        <PaperCanvas 
          ref="paperCanvasRef"
          :view-state="currentViewState"
          :sync-enabled="syncEnabled"
          @canvas-ready="onCanvasReady"
          @annotation-added="onAnnotationAdded"
          @annotation-updated="onAnnotationUpdated"
          @annotation-deleted="onAnnotationDeleted"
        />
      </div>
    </div>

    <!-- 状态信息 -->
    <div class="status-bar">
      <span>缩放级别: {{ currentViewState.zoom.toFixed(2) }}</span>
      <span>标注数量: {{ annotations.length }}</span>
      <span v-if="syncEnabled" class="sync-status">同步状态: 已启用</span>
      <span v-else class="sync-status">同步状态: 已禁用</span>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import ImageViewer from './components/ImageViewer';
import PaperCanvas from './components/PaperCanvas';
import { useImageSync } from './hooks/useImageSync';
import { serializeAnnotations, deserializeAnnotations } from './utils/annotationUtils';

export default {
  name: 'App',
  components: {
    ImageViewer,
    PaperCanvas
  },
  setup() {
    // 组件引用
    const imageViewerRef = ref(null);
    const paperCanvasRef = ref(null);
    const fileInput = ref(null);

    // 同步状态
    const syncEnabled = ref(true);

    // 标注数据
    const annotations = ref([]);

    // 图像URL
    const imageUrl = ref('https://github.com/openseadragon/example-images/tree/gh-pages/duomo/duomo_files/');

    // 查看器配置选项
    const viewerOptions = reactive({
      showNavigationControl: true,
      showZoomControl: true,
      showHomeControl: true,
      showFullPageControl: true,
      zoomPerClick: 1.2,
      zoomPerScroll: 1.1
    });

    // 当前视图状态
    const currentViewState = reactive({
      zoom: 1,
      center: { x: 0, y: 0 },
      rotation: 0,
      viewportWidth: 0,
      viewportHeight: 0
    });

    // 同步管理器
    const syncManager = useImageSync({
      enabled: true,
      syncZoom: true,
      syncPan: true,
      syncRotation: true,
      debounceDelay: 16
    });

    // 查看器准备就绪
    const onViewerReady = (viewer) => {
      console.log('Image viewer ready');
      // 初始化同步
      if (paperCanvasRef.value && paperCanvasRef.value.canvas) {
        syncManager.initialize(viewer, paperCanvasRef.value.canvas);
      }
    };

    // 画布准备就绪
    const onCanvasReady = (canvas) => {
      console.log('Paper canvas ready');
      // 初始化同步
      if (imageViewerRef.value && imageViewerRef.value.viewer) {
        syncManager.initialize(imageViewerRef.value.viewer, canvas);
      }
    };

    // 视图变化
    const onViewChange = (viewState) => {
      // 更新当前视图状态
      Object.assign(currentViewState, viewState);
      
      // 如果启用了同步，手动同步一次
      if (syncEnabled.value && syncManager.syncState.isInitialized) {
        syncManager.manualSync();
      }
    };

    // 切换同步状态
    const toggleSync = () => {
      if (syncEnabled.value) {
        syncManager.enableSync();
      } else {
        syncManager.disableSync();
      }
    };

    // 标注添加
    const onAnnotationAdded = (annotation) => {
      annotations.value.push(annotation);
      console.log('Annotation added:', annotation);
    };

    // 标注更新
    const onAnnotationUpdated = (annotation) => {
      const index = annotations.value.findIndex(a => a.id === annotation.id);
      if (index !== -1) {
        annotations.value[index] = annotation;
      }
      console.log('Annotation updated:', annotation);
    };

    // 标注删除
    const onAnnotationDeleted = (annotationId) => {
      const index = annotations.value.findIndex(a => a.id === annotationId);
      if (index !== -1) {
        annotations.value.splice(index, 1);
      }
      console.log('Annotation deleted:', annotationId);
    };

    // 清除所有标注
    const clearAnnotations = () => {
      if (paperCanvasRef.value) {
        paperCanvasRef.value.clearAnnotations();
        annotations.value = [];
      }
    };

    // 导出标注
    const exportAnnotations = () => {
      const data = serializeAnnotations(annotations.value);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `annotations_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    // 触发导入
    const triggerImport = () => {
      fileInput.value.click();
    };

    // 导入标注
    const importAnnotations = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedAnnotations = deserializeAnnotations(e.target.result);
          // 清除现有标注
          annotations.value = [];
          
          // 添加导入的标注
          if (paperCanvasRef.value) {
            paperCanvasRef.value.importAnnotations(e.target.result);
          }
        } catch (error) {
          console.error('Failed to import annotations:', error);
          alert('导入标注失败，请检查文件格式');
        }
      };
      reader.readAsText(file);
      
      // 重置文件输入，以便可以再次选择相同的文件
      event.target.value = '';
    };

    // 组件卸载时清理
    onUnmounted(() => {
      syncManager.destroy();
    });

    return {
      // 引用
      imageViewerRef,
      paperCanvasRef,
      fileInput,
      
      // 状态
      syncEnabled,
      annotations,
      imageUrl,
      viewerOptions,
      currentViewState,
      
      // 方法
      onViewerReady,
      onCanvasReady,
      onViewChange,
      toggleSync,
      onAnnotationAdded,
      onAnnotationUpdated,
      onAnnotationDeleted,
      clearAnnotations,
      exportAnnotations,
      triggerImport,
      importAnnotations
    };
  }
};
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

/* 应用容器 */
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 工具栏 */
.toolbar {
  background-color: #2c3e50;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar h1 {
  font-size: 1.5rem;
  margin: 0;
  font-weight: 600;
}

.toolbar-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.toolbar-controls label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.btn-success {
  background-color: #2ecc71;
  color: white;
}

.btn-warning {
  background-color: #f39c12;
  color: white;
}

.btn-info {
  background-color: #3498db;
  color: white;
}

/* 内容容器 */
.content-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px;
  gap: 20px;
}

/* 查看器和画布容器 */
.viewer-container,
.canvas-container {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.viewer-container h3,
.canvas-container h3 {
  padding: 10px 15px;
  background-color: #ecf0f1;
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
  border-bottom: 1px solid #ddd;
}

/* OpenSeaDragon容器样式 */
.osd-container {
  flex: 1;
  position: relative;
  background-color: #f0f0f0;
}

/* Paper.js画布容器样式 */
.paper-canvas-container {
  flex: 1;
  position: relative;
  background-color: #f0f0f0;
  overflow: hidden;
}

/* 隐藏的文件输入 */
.hidden {
  display: none;
}

/* 状态栏 */
.status-bar {
  background-color: #34495e;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  border-top: 1px solid #2c3e50;
}

.status-bar span {
  margin: 0 15px;
}

.sync-status {
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .content-container {
    flex-direction: column;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .toolbar-controls {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .toolbar h1 {
    text-align: center;
    font-size: 1.2rem;
  }
}

@media (max-width: 768px) {
  .content-container {
    padding: 10px;
    gap: 10px;
  }
  
  .status-bar {
    flex-direction: column;
    gap: 5px;
    align-items: flex-start;
  }
  
  .status-bar span {
    margin: 0;
  }
}
</style>
