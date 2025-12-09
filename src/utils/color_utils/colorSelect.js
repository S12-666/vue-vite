export function getStatusClass(value) {
    if (value === 0) return 'bg-red'   // 红色
    if (value === 1) return 'bg-blue'  // 蓝色
    if (value === 2) return 'bg-gray'  // 灰色
    return 'bg-gray' // 默认兜底
}