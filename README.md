# Vue3 + OpenSeaDragon + Paper.js 集成项目

这是一个基于 Vue3 的集成项目，结合了 OpenSeaDragon（高性能图像查看器）和 Paper.js（矢量图形脚本框架），用于创建交互式的图像查看和标注应用。

## 项目特性

- 基于 Vue3 Composition API 构建的现代化前端应用
- 集成 OpenSeaDragon 提供高分辨率图像的无缝缩放和平移
- 结合 Paper.js 实现矢量图形绘制和标注功能
- 响应式设计，适配不同设备屏幕
- 模块化架构，便于扩展和维护

## 技术栈

- **前端框架**: Vue 3.2+
- **图像查看**: OpenSeaDragon
- **矢量图形**: Paper.js
- **构建工具**: Vue CLI
- **CSS 预处理器**: (可根据需求添加)

## 开始使用

### 安装依赖

首先，确保你已安装 Node.js 和 npm，然后运行以下命令安装项目依赖：

```bash
npm install
# 安装 OpenSeaDragon 和 Paper.js
npm install openseadragon paper
```

### 开发环境启动

```bash
npm run serve
```

应用将在 [http://localhost:8080](http://localhost:8080) 启动开发服务器。

### 生产环境构建

```bash
npm run build
```

构建后的文件将位于 `dist` 目录中，可部署到任何静态文件服务器。

### 代码规范检查

```bash
npm run lint
```

## 项目结构

```
src/
├── assets/           # 静态资源
├── components/       # 可复用组件
│   ├── ImageViewer/  # OpenSeaDragon 图像查看器组件
│   └── PaperCanvas/  # Paper.js 画布组件
├── hooks/            # 自定义 Vue 钩子
├── utils/            # 工具函数
├── App.vue           # 应用主组件
└── main.js           # 应用入口文件
```

## 核心功能实现

### OpenSeaDragon 图像查看器集成

OpenSeaDragon 组件用于展示和交互高分辨率图像，支持缩放、平移和旋转等操作。

### Paper.js 矢量绘图集成

PaperCanvas 组件将 Paper.js 集成到 Vue3 中，提供矢量图形绘制能力，可以在图像上创建标注、形状和路径。

### 两者结合使用

通过精心设计的通信机制，实现 OpenSeaDragon 视图状态与 Paper.js 画布状态的同步，确保标注能够准确地叠加在图像上，即使在缩放和平移操作后也能保持正确的位置关系。

## 配置说明

### 图像源配置

可以在组件中配置 OpenSeaDragon 的图像源，支持多种格式，包括静态图像、DZI（Deep Zoom Images）等。

### 绘图工具配置

可以配置 Paper.js 提供的绘图工具，如选择工具、画笔、矩形、圆形等。

## 扩展指南

### 添加新工具

1. 在 `src/components/PaperCanvas/tools/` 目录下创建新的工具类
2. 在工具管理器中注册新工具
3. 更新 UI 以添加新工具按钮

### 自定义标注类型

可以扩展基础标注类，创建自定义的标注类型，支持不同的样式和交互行为。

## 浏览器兼容性

- Chrome (最新 2 个版本)
- Firefox (最新 2 个版本)
- Safari (最新 2 个版本)
- Edge (最新 2 个版本)

## License

[MIT](LICENSE)
