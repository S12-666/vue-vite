export function loadIcon(iconName) {
    // 明确定义逻辑名到文件名的映射，避免 import.meta.glob 用法导致的不可预期返回值
    const map = {
        analysis: 'analysis.svg',
        // visual: 'analysis.svg',
        user: 'user.svg',
        dataoverview: 'data_overview.svg',
        monitoring: 'monitoring_logs.svg',
        heating: 'heating.svg',
        rolling: 'rolling.svg',
        cooling: 'cooling.svg',
        limits: 'limits_of_authority.svg',
        settings: 'settings.svg'
    };

    const filename = map[iconName];
    if (!filename) return null;

    try {
        // 从此文件 (src/utils/icons_utils) 到 src/assets/icons 的相对路径是 ../../assets/icons
        return new URL(`../../assets/icons/${filename}`, import.meta.url).href;
    } catch (e) {
        return null;
    }
}
