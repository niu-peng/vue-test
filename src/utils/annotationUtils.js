/**
 * 标注工具函数
 * 提供标注数据的处理、序列化、反序列化等功能
 */

/**
 * 生成唯一ID
 * @returns {string} 唯一ID字符串
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 创建矩形标注对象
 * @param {Object} props - 矩形属性
 * @returns {Object} 标注对象
 */
export function createRectangleAnnotation(props = {}) {
  return {
    id: props.id || generateId(),
    type: 'rectangle',
    position: props.position || { x: 0, y: 0 },
    size: props.size || { width: 100, height: 100 },
    style: {
      strokeColor: props.strokeColor || '#ff0000',
      strokeWidth: props.strokeWidth || 2,
      fillColor: props.fillColor || 'rgba(255, 0, 0, 0.1)',
      ...(props.style || {})
    },
    metadata: props.metadata || {},
    createdAt: props.createdAt || new Date().toISOString(),
    updatedAt: props.updatedAt || new Date().toISOString()
  };
}

/**
 * 创建圆形标注对象
 * @param {Object} props - 圆形属性
 * @returns {Object} 标注对象
 */
export function createCircleAnnotation(props = {}) {
  return {
    id: props.id || generateId(),
    type: 'circle',
    position: props.position || { x: 0, y: 0 },
    radius: props.radius || 50,
    style: {
      strokeColor: props.strokeColor || '#00ff00',
      strokeWidth: props.strokeWidth || 2,
      fillColor: props.fillColor || 'rgba(0, 255, 0, 0.1)',
      ...(props.style || {})
    },
    metadata: props.metadata || {},
    createdAt: props.createdAt || new Date().toISOString(),
    updatedAt: props.updatedAt || new Date().toISOString()
  };
}

/**
 * 创建路径标注对象
 * @param {Object} props - 路径属性
 * @returns {Object} 标注对象
 */
export function createPathAnnotation(props = {}) {
  return {
    id: props.id || generateId(),
    type: 'path',
    points: props.points || [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    style: {
      strokeColor: props.strokeColor || '#0000ff',
      strokeWidth: props.strokeWidth || 2,
      fillColor: props.fillColor || null,
      closed: props.closed || false,
      ...(props.style || {})
    },
    metadata: props.metadata || {},
    createdAt: props.createdAt || new Date().toISOString(),
    updatedAt: props.updatedAt || new Date().toISOString()
  };
}

/**
 * 创建直线标注对象
 * @param {Object} props - 直线属性
 * @returns {Object} 标注对象
 */
export function createLineAnnotation(props = {}) {
  return {
    id: props.id || generateId(),
    type: 'line',
    start: props.start || { x: 0, y: 0 },
    end: props.end || { x: 100, y: 100 },
    style: {
      strokeColor: props.strokeColor || '#ffff00',
      strokeWidth: props.strokeWidth || 2,
      ...(props.style || {})
    },
    metadata: props.metadata || {},
    createdAt: props.createdAt || new Date().toISOString(),
    updatedAt: props.updatedAt || new Date().toISOString()
  };
}

/**
 * 创建文本标注对象
 * @param {Object} props - 文本属性
 * @returns {Object} 标注对象
 */
export function createTextAnnotation(props = {}) {
  return {
    id: props.id || generateId(),
    type: 'text',
    position: props.position || { x: 0, y: 0 },
    content: props.content || '',
    style: {
      fontSize: props.fontSize || 12,
      fontFamily: props.fontFamily || 'Arial',
      fillColor: props.fillColor || '#000000',
      ...(props.style || {})
    },
    metadata: props.metadata || {},
    createdAt: props.createdAt || new Date().toISOString(),
    updatedAt: props.updatedAt || new Date().toISOString()
  };
}

/**
 * 序列化标注数据
 * @param {Array<Object>} annotations - 标注数组
 * @returns {string} JSON字符串
 */
export function serializeAnnotations(annotations) {
  try {
    return JSON.stringify(annotations, null, 2);
  } catch (error) {
    console.error('Failed to serialize annotations:', error);
    return '[]';
  }
}

/**
 * 反序列化标注数据
 * @param {string} jsonData - JSON字符串
 * @returns {Array<Object>} 标注数组
 */
export function deserializeAnnotations(jsonData) {
  try {
    const annotations = JSON.parse(jsonData);
    // 验证是否为数组
    if (!Array.isArray(annotations)) {
      throw new Error('Invalid annotations format: not an array');
    }
    return annotations;
  } catch (error) {
    console.error('Failed to deserialize annotations:', error);
    return [];
  }
}

/**
 * 验证标注对象的有效性
 * @param {Object} annotation - 标注对象
 * @returns {boolean} 是否有效
 */
export function isValidAnnotation(annotation) {
  if (!annotation || typeof annotation !== 'object') {
    return false;
  }
  
  // 检查必要字段
  const requiredFields = ['id', 'type', 'createdAt', 'updatedAt'];
  for (const field of requiredFields) {
    if (!annotation[field]) {
      return false;
    }
  }
  
  // 检查类型
  const validTypes = ['rectangle', 'circle', 'path', 'line', 'text'];
  if (!validTypes.includes(annotation.type)) {
    return false;
  }
  
  // 根据类型检查特定字段
  switch (annotation.type) {
    case 'rectangle':
      return checkRectangleFields(annotation);
    case 'circle':
      return checkCircleFields(annotation);
    case 'path':
      return checkPathFields(annotation);
    case 'line':
      return checkLineFields(annotation);
    case 'text':
      return checkTextFields(annotation);
    default:
      return false;
  }
}

// 类型特定的验证辅助函数
function checkRectangleFields(annotation) {
  return (
    annotation.position && typeof annotation.position.x === 'number' && typeof annotation.position.y === 'number' &&
    annotation.size && typeof annotation.size.width === 'number' && typeof annotation.size.height === 'number'
  );
}

function checkCircleFields(annotation) {
  return (
    annotation.position && typeof annotation.position.x === 'number' && typeof annotation.position.y === 'number' &&
    typeof annotation.radius === 'number'
  );
}

function checkPathFields(annotation) {
  return (
    Array.isArray(annotation.points) &&
    annotation.points.every(point => point && typeof point.x === 'number' && typeof point.y === 'number')
  );
}

function checkLineFields(annotation) {
  return (
    annotation.start && typeof annotation.start.x === 'number' && typeof annotation.start.y === 'number' &&
    annotation.end && typeof annotation.end.x === 'number' && typeof annotation.end.y === 'number'
  );
}

function checkTextFields(annotation) {
  return (
    annotation.position && typeof annotation.position.x === 'number' && typeof annotation.position.y === 'number' &&
    typeof annotation.content === 'string'
  );
}

/**
 * 过滤标注数组
 * @param {Array<Object>} annotations - 标注数组
 * @param {Object} filters - 过滤条件
 * @returns {Array<Object>} 过滤后的标注数组
 */
export function filterAnnotations(annotations, filters = {}) {
  return annotations.filter(annotation => {
    // 按类型过滤
    if (filters.type && annotation.type !== filters.type) {
      return false;
    }
    
    // 按时间范围过滤
    if (filters.startTime && new Date(annotation.createdAt) < new Date(filters.startTime)) {
      return false;
    }
    
    if (filters.endTime && new Date(annotation.createdAt) > new Date(filters.endTime)) {
      return false;
    }
    
    // 按ID过滤
    if (filters.ids && Array.isArray(filters.ids) && !filters.ids.includes(annotation.id)) {
      return false;
    }
    
    // 按元数据过滤
    if (filters.metadata) {
      for (const [key, value] of Object.entries(filters.metadata)) {
        if (annotation.metadata?.[key] !== value) {
          return false;
        }
      }
    }
    
    return true;
  });
}

/**
 * 转换标注坐标系统
 * @param {Object} annotation - 标注对象
 * @param {Function} transformFn - 坐标转换函数
 * @returns {Object} 转换后的标注对象
 */
export function transformAnnotationCoordinates(annotation, transformFn) {
  if (!annotation || !transformFn) {
    return annotation;
  }
  
  // 深拷贝标注对象
  const transformed = JSON.parse(JSON.stringify(annotation));
  
  switch (transformed.type) {
    case 'rectangle':
      transformed.position = transformFn(transformed.position);
      break;
    
    case 'circle':
      transformed.position = transformFn(transformed.position);
      break;
    
    case 'path':
      transformed.points = transformed.points.map(point => transformFn(point));
      break;
    
    case 'line':
      transformed.start = transformFn(transformed.start);
      transformed.end = transformFn(transformed.end);
      break;
    
    case 'text':
      transformed.position = transformFn(transformed.position);
      break;
  }
  
  // 更新修改时间
  transformed.updatedAt = new Date().toISOString();
  
  return transformed;
}

/**
 * 合并多个标注数组
 * @param {Array<Array<Object>>} annotationArrays - 标注数组的数组
 * @returns {Array<Object>} 合并后的标注数组
 */
export function mergeAnnotations(annotationArrays) {
  const merged = [];
  const idSet = new Set();
  
  annotationArrays.forEach(annotations => {
    annotations.forEach(annotation => {
      // 避免重复
      if (!idSet.has(annotation.id)) {
        idSet.add(annotation.id);
        merged.push(annotation);
      }
    });
  });
  
  return merged;
}

/**
 * 计算标注的边界框
 * @param {Object} annotation - 标注对象
 * @returns {Object|null} 边界框对象 {x, y, width, height}
 */
export function getAnnotationBounds(annotation) {
  if (!annotation) {
    return null;
  }
  
  switch (annotation.type) {
    case 'rectangle':
      return {
        x: annotation.position.x,
        y: annotation.position.y,
        width: annotation.size.width,
        height: annotation.size.height
      };
    
    case 'circle':
      return {
        x: annotation.position.x - annotation.radius,
        y: annotation.position.y - annotation.radius,
        width: annotation.radius * 2,
        height: annotation.radius * 2
      };
    
    case 'path':
      if (!annotation.points || annotation.points.length === 0) {
        return null;
      }
      
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      annotation.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
      
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    
    case 'line':
      return {
        x: Math.min(annotation.start.x, annotation.end.x),
        y: Math.min(annotation.start.y, annotation.end.y),
        width: Math.abs(annotation.end.x - annotation.start.x),
        height: Math.abs(annotation.end.y - annotation.start.y)
      };
    
    case 'text':
      // 简化处理，实际应根据字体大小和内容计算
      return {
        x: annotation.position.x,
        y: annotation.position.y - (annotation.style?.fontSize || 12),
        width: (annotation.content || '').length * 8,
        height: annotation.style?.fontSize || 12
      };
    
    default:
      return null;
  }
}

/**
 * 创建标注工厂函数
 * @returns {Object} 包含各种标注创建方法的对象
 */
export function createAnnotationFactory() {
  return {
    rectangle: createRectangleAnnotation,
    circle: createCircleAnnotation,
    path: createPathAnnotation,
    line: createLineAnnotation,
    text: createTextAnnotation
  };
}

export default {
  generateId,
  createRectangleAnnotation,
  createCircleAnnotation,
  createPathAnnotation,
  createLineAnnotation,
  createTextAnnotation,
  serializeAnnotations,
  deserializeAnnotations,
  isValidAnnotation,
  filterAnnotations,
  transformAnnotationCoordinates,
  mergeAnnotations,
  getAnnotationBounds,
  createAnnotationFactory
};
