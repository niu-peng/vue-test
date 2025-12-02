/**
 * 图像工具函数
 * 提供图像加载、缩放、裁剪等常用操作
 */

/**
 * 加载图像
 * @param {string} url - 图像URL
 * @returns {Promise<HTMLImageElement>} 加载完成的图像元素
 */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 允许跨域访问
    
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    
    img.src = url;
  });
}

/**
 * 获取图像尺寸信息
 * @param {HTMLImageElement} img - 图像元素
 * @returns {Object} 包含宽度和高度的对象
 */
export function getImageSize(img) {
  if (!img || !(img instanceof HTMLImageElement)) {
    throw new Error('Invalid image element');
  }
  
  return {
    width: img.naturalWidth,
    height: img.naturalHeight
  };
}

/**
 * 计算图像的合适缩放比例
 * @param {number} imgWidth - 图像原始宽度
 * @param {number} imgHeight - 图像原始高度
 * @param {number} containerWidth - 容器宽度
 * @param {number} containerHeight - 容器高度
 * @param {Object} options - 配置选项
 * @returns {number} 合适的缩放比例
 */
export function calculateFitScale(
  imgWidth,
  imgHeight,
  containerWidth,
  containerHeight,
  options = {}
) {
  const {
    fit = 'contain', // 'contain' | 'cover' | 'fill'
    maintainAspectRatio = true
  } = options;
  
  // 如果不需要保持宽高比，直接返回填满容器的缩放比例
  if (!maintainAspectRatio) {
    return 1;
  }
  
  const imgAspectRatio = imgWidth / imgHeight;
  const containerAspectRatio = containerWidth / containerHeight;
  
  let scale;
  
  switch (fit) {
    case 'cover':
      // 覆盖模式：图像完全覆盖容器，可能会裁剪
      if (imgAspectRatio > containerAspectRatio) {
        scale = containerHeight / imgHeight;
      } else {
        scale = containerWidth / imgWidth;
      }
      break;
    
    case 'fill':
      // 填充模式：图像完全填充容器，可能会变形
      return 1;
    
    case 'contain':
    default:
      // 包含模式：图像完全包含在容器内，可能会有空白区域
      if (imgAspectRatio > containerAspectRatio) {
        scale = containerWidth / imgWidth;
      } else {
        scale = containerHeight / imgHeight;
      }
      break;
  }
  
  return scale;
}

/**
 * 裁剪图像
 * @param {HTMLImageElement} img - 图像元素
 * @param {Object} cropArea - 裁剪区域 {x, y, width, height}
 * @returns {HTMLCanvasElement} 裁剪后的画布
 */
export function cropImage(img, cropArea) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;
  
  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );
  
  return canvas;
}

/**
 * 将图像转换为DataURL
 * @param {HTMLImageElement|HTMLCanvasElement} imageElement - 图像元素或画布
 * @param {Object} options - 配置选项
 * @returns {string} DataURL字符串
 */
export function imageToDataUrl(imageElement, options = {}) {
  const {
    format = 'png',
    quality = 0.92
  } = options;
  
  let canvas;
  
  if (imageElement instanceof HTMLCanvasElement) {
    canvas = imageElement;
  } else {
    canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;
    
    ctx.drawImage(imageElement, 0, 0);
  }
  
  return canvas.toDataURL(`image/${format}`, quality);
}

/**
 * 调整图像大小
 * @param {HTMLImageElement} img - 图像元素
 * @param {number} targetWidth - 目标宽度
 * @param {number} targetHeight - 目标高度
 * @param {Object} options - 配置选项
 * @returns {HTMLCanvasElement} 调整大小后的画布
 */
export function resizeImage(img, targetWidth, targetHeight, options = {}) {
  const {
    maintainAspectRatio = true,
    quality = 0.92
  } = options;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  let width = targetWidth;
  let height = targetHeight;
  
  // 如果需要保持宽高比
  if (maintainAspectRatio) {
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    const imgAspectRatio = imgWidth / imgHeight;
    
    if (width / height > imgAspectRatio) {
      width = height * imgAspectRatio;
    } else {
      height = width / imgAspectRatio;
    }
  }
  
  // 设置画布尺寸
  canvas.width = width;
  canvas.height = height;
  
  // 绘制调整大小后的图像
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  
  return canvas;
}

/**
 * 计算两点之间的距离
 * @param {Object} point1 - 第一个点 {x, y}
 * @param {Object} point2 - 第二个点 {x, y}
 * @returns {number} 距离值
 */
export function calculateDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 检查点是否在矩形内
 * @param {Object} point - 点 {x, y}
 * @param {Object} rect - 矩形 {x, y, width, height}
 * @returns {boolean} 是否在矩形内
 */
export function isPointInRectangle(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * 检查点是否在圆形内
 * @param {Object} point - 点 {x, y}
 * @param {Object} circle - 圆形 {center: {x, y}, radius}
 * @returns {boolean} 是否在圆形内
 */
export function isPointInCircle(point, circle) {
  const distance = calculateDistance(point, circle.center);
  return distance <= circle.radius;
}

/**
 * 将坐标从一个坐标系转换到另一个坐标系
 * @param {Object} point - 原始坐标点 {x, y}
 * @param {Object} fromBounds - 源边界 {x, y, width, height}
 * @param {Object} toBounds - 目标边界 {x, y, width, height}
 * @param {boolean} maintainRatio - 是否保持比例
 * @returns {Object} 转换后的坐标点
 */
export function transformCoordinates(point, fromBounds, toBounds, maintainRatio = true) {
  if (!maintainRatio) {
    return {
      x: toBounds.x + (point.x - fromBounds.x) * (toBounds.width / fromBounds.width),
      y: toBounds.y + (point.y - fromBounds.y) * (toBounds.height / fromBounds.height)
    };
  }
  
  // 计算源和目标的比例
  const fromAspectRatio = fromBounds.width / fromBounds.height;
  const toAspectRatio = toBounds.width / toBounds.height;
  
  let scale, offsetX, offsetY;
  
  if (fromAspectRatio > toAspectRatio) {
    // 源更宽，以宽度为基准
    scale = toBounds.width / fromBounds.width;
    const scaledHeight = fromBounds.height * scale;
    offsetX = toBounds.x;
    offsetY = toBounds.y + (toBounds.height - scaledHeight) / 2;
  } else {
    // 源更高，以高度为基准
    scale = toBounds.height / fromBounds.height;
    const scaledWidth = fromBounds.width * scale;
    offsetX = toBounds.x + (toBounds.width - scaledWidth) / 2;
    offsetY = toBounds.y;
  }
  
  return {
    x: offsetX + (point.x - fromBounds.x) * scale,
    y: offsetY + (point.y - fromBounds.y) * scale
  };
}

/**
 * 预加载图像列表
 * @param {Array<string>} urls - 图像URL数组
 * @returns {Promise<Array<HTMLImageElement>>} 加载完成的图像元素数组
 */
export function preloadImages(urls) {
  return Promise.all(urls.map(url => loadImage(url)));
}

/**
 * 检测图像格式
 * @param {string} url - 图像URL或DataURL
 * @returns {string} 图像格式
 */
export function detectImageFormat(url) {
  // 从DataURL检测
  if (url.startsWith('data:image/')) {
    const match = url.match(/data:image\/(\w+);/);
    return match ? match[1].toLowerCase() : 'unknown';
  }
  
  // 从URL后缀检测
  const extension = url.split('.').pop().toLowerCase();
  const validFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  
  return validFormats.includes(extension) ? extension : 'unknown';
}

export default {
  loadImage,
  getImageSize,
  calculateFitScale,
  cropImage,
  imageToDataUrl,
  resizeImage,
  calculateDistance,
  isPointInRectangle,
  isPointInCircle,
  transformCoordinates,
  preloadImages,
  detectImageFormat
};
