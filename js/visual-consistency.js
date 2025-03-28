/**
 * NexusOrbital视觉一致性优化器
 * 用于确保网站在各个页面和组件中保持一致的视觉风格
 */

class VisualConsistencyOptimizer {
    constructor() {
        this.options = {
            // 全局选项
            enabled: true,
            debug: false,
            
            // 主题选项
            theme: {
                enabled: true,
                defaultTheme: 'light',
                supportDarkMode: true,
                respectUserPreference: true
            },
            
            // 组件选项
            components: {
                enabled: true,
                normalizeButtons: true,
                normalizeForms: true,
                normalizeCards: true,
                normalizeAlerts: true
            },
            
            // 布局选项
            layout: {
                enabled: true,
                enforceGrid: true,
                standardizeHeaders: true,
                standardizeFooters: true
            },
            
            // 动画选项
            animations: {
                enabled: true,
                standardizeTransitions: true,
                optimizePerformance: true
            },
            
            // 图标和图像选项
            iconAndImages: {
                enabled: true,
                standardizeIcons: true,
                optimizeImages: true
            }
        };
        
        this.initialized = false;
        this.themeManager = null;
        this.componentNormalizer = null;
        this.layoutOptimizer = null;
        this.animationStandardizer = null;
        this.iconImageOptimizer = null;
    }
    
    /**
     * 初始化视觉一致性优化器
     * @param {Object} options 配置选项
     */
    init(options = {}) {
        if (this.initialized) return;
        
        // 合并选项
        this.mergeOptions(options);
        
        if (!this.options.enabled) {
            console.log('视觉一致性优化器已禁用');
            return;
        }
        
        this.log('视觉一致性优化器初始化中...');
        
        // 初始化主题管理器
        if (this.options.theme.enabled) {
            this.initThemeManager();
        }
        
        // 初始化组件标准化器
        if (this.options.components.enabled) {
            this.initComponentNormalizer();
        }
        
        // 初始化布局优化器
        if (this.options.layout.enabled) {
            this.initLayoutOptimizer();
        }
        
        // 初始化动画标准化器
        if (this.options.animations.enabled) {
            this.initAnimationStandardizer();
        }
        
        // 初始化图标和图像优化器
        if (this.options.iconAndImages.enabled) {
            this.initIconImageOptimizer();
        }
        
        // 在DOM内容加载后应用优化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.applyConsistency();
            });
        } else {
            // 如果DOM已经加载完成，直接应用优化
            this.applyConsistency();
        }
        
        this.initialized = true;
        this.log('视觉一致性优化器初始化完成');
    }
    
    /**
     * 深度合并选项
     * @param {Object} options 要合并的选项
     */
    mergeOptions(options) {
        // 递归合并对象
        const merge = (target, source) => {
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (source[key] instanceof Object && key in target) {
                        merge(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
        
        this.options = merge(this.options, options);
    }
    
    /**
     * 初始化主题管理器
     */
    initThemeManager() {
        // 这里将在后续实现中导入主题管理器模块
        // this.themeManager = new ThemeManager(this.options.theme);
        
        // 临时实现基本主题检测和应用
        this.detectAndApplyTheme();
        
        this.log('主题管理器已初始化');
    }
    
    /**
     * 检测并应用主题
     */
    detectAndApplyTheme() {
        // 检测用户偏好
        if (this.options.theme.respectUserPreference && this.options.theme.supportDarkMode) {
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = prefersDarkMode ? 'dark' : 'light';
            
            // 应用主题
            this.applyTheme(theme);
            
            // 监听偏好变化
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                const newTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(newTheme);
            });
        } else {
            // 应用默认主题
            this.applyTheme(this.options.theme.defaultTheme);
        }
    }
    
    /**
     * 应用主题
     * @param {string} theme 主题名称
     */
    applyTheme(theme) {
        // 移除旧主题类
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        
        // 添加新主题类
        document.documentElement.classList.add(`theme-${theme}`);
        
        // 存储当前主题
        localStorage.setItem('nexusorbital-theme', theme);
        
        this.log(`已应用主题: ${theme}`);
    }
    
    /**
     * 初始化组件标准化器
     */
    initComponentNormalizer() {
        // 这里将在后续实现中导入组件标准化器模块
        // this.componentNormalizer = new ComponentNormalizer(this.options.components);
        
        this.log('组件标准化器已初始化');
    }
    
    /**
     * 初始化布局优化器
     */
    initLayoutOptimizer() {
        // 这里将在后续实现中导入布局优化器模块
        // this.layoutOptimizer = new LayoutOptimizer(this.options.layout);
        
        this.log('布局优化器已初始化');
    }
    
    /**
     * 初始化动画标准化器
     */
    initAnimationStandardizer() {
        // 这里将在后续实现中导入动画标准化器模块
        // this.animationStandardizer = new AnimationStandardizer(this.options.animations);
        
        this.log('动画标准化器已初始化');
    }
    
    /**
     * 初始化图标和图像优化器
     */
    initIconImageOptimizer() {
        // 这里将在后续实现中导入图标和图像优化器模块
        // this.iconImageOptimizer = new IconImageOptimizer(this.options.iconAndImages);
        
        this.log('图标和图像优化器已初始化');
    }
    
    /**
     * 应用视觉一致性
     */
    applyConsistency() {
        this.log('应用视觉一致性...');
        
        // 应用主题
        if (this.options.theme.enabled && this.themeManager) {
            this.themeManager.apply();
        }
        
        // 标准化组件
        if (this.options.components.enabled && this.componentNormalizer) {
            this.componentNormalizer.normalize();
        } else {
            // 临时实现基本组件标准化
            this.normalizeComponents();
        }
        
        // 优化布局
        if (this.options.layout.enabled && this.layoutOptimizer) {
            this.layoutOptimizer.optimize();
        }
        
        // 标准化动画
        if (this.options.animations.enabled && this.animationStandardizer) {
            this.animationStandardizer.standardize();
        }
        
        // 优化图标和图像
        if (this.options.iconAndImages.enabled && this.iconImageOptimizer) {
            this.iconImageOptimizer.optimize();
        }
        
        this.log('视觉一致性应用完成');
    }
    
    /**
     * 临时实现的组件标准化
     */
    normalizeComponents() {
        // 标准化按钮
        if (this.options.components.normalizeButtons) {
            this.normalizeButtons();
        }
        
        // 标准化表单
        if (this.options.components.normalizeForms) {
            this.normalizeForms();
        }
        
        // 标准化卡片
        if (this.options.components.normalizeCards) {
            this.normalizeCards();
        }
        
        // 标准化提示框
        if (this.options.components.normalizeAlerts) {
            this.normalizeAlerts();
        }
    }
    
    /**
     * 标准化按钮
     */
    normalizeButtons() {
        // 查找所有按钮
        const buttons = document.querySelectorAll('button, .btn, input[type="button"], input[type="submit"]');
        
        buttons.forEach(button => {
            // 跳过已经标准化的按钮
            if (button.classList.contains('normalized')) return;
            
            // 添加基本类
            button.classList.add('btn-normalized');
            
            // 检测按钮类型
            if (button.classList.contains('primary') || button.classList.contains('btn-primary')) {
                button.classList.add('btn-primary-normalized');
            } else if (button.classList.contains('secondary') || button.classList.contains('btn-secondary')) {
                button.classList.add('btn-secondary-normalized');
            } else if (button.classList.contains('danger') || button.classList.contains('btn-danger')) {
                button.classList.add('btn-danger-normalized');
            } else if (button.classList.contains('success') || button.classList.contains('btn-success')) {
                button.classList.add('btn-success-normalized');
            } else if (button.classList.contains('warning') || button.classList.contains('btn-warning')) {
                button.classList.add('btn-warning-normalized');
            } else if (button.classList.contains('info') || button.classList.contains('btn-info')) {
                button.classList.add('btn-info-normalized');
            } else {
                // 默认为次要按钮
                button.classList.add('btn-secondary-normalized');
            }
            
            // 标记为已标准化
            button.classList.add('normalized');
        });
    }
    
    /**
     * 标准化表单
     */
    normalizeForms() {
        // 查找所有表单
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // 跳过已经标准化的表单
            if (form.classList.contains('normalized')) return;
            
            // 添加基本类
            form.classList.add('form-normalized');
            
            // 标准化表单元素
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.classList.add('form-control-normalized');
            });
            
            // 标准化表单组
            const formGroups = form.querySelectorAll('.form-group');
            formGroups.forEach(group => {
                group.classList.add('form-group-normalized');
            });
            
            // 标记为已标准化
            form.classList.add('normalized');
        });
    }
    
    /**
     * 标准化卡片
     */
    normalizeCards() {
        // 查找所有卡片
        const cards = document.querySelectorAll('.card');
        
        cards.forEach(card => {
            // 跳过已经标准化的卡片
            if (card.classList.contains('normalized')) return;
            
            // 添加基本类
            card.classList.add('card-normalized');
            
            // 标准化卡片头部
            const cardHeaders = card.querySelectorAll('.card-header');
            cardHeaders.forEach(header => {
                header.classList.add('card-header-normalized');
            });
            
            // 标准化卡片内容
            const cardBodies = card.querySelectorAll('.card-body');
            cardBodies.forEach(body => {
                body.classList.add('card-body-normalized');
            });
            
            // 标准化卡片底部
            const cardFooters = card.querySelectorAll('.card-footer');
            cardFooters.forEach(footer => {
                footer.classList.add('card-footer-normalized');
            });
            
            // 标记为已标准化
            card.classList.add('normalized');
        });
    }
    
    /**
     * 标准化提示框
     */
    normalizeAlerts() {
        // 查找所有提示框
        const alerts = document.querySelectorAll('.alert');
        
        alerts.forEach(alert => {
            // 跳过已经标准化的提示框
            if (alert.classList.contains('normalized')) return;
            
            // 添加基本类
            alert.classList.add('alert-normalized');
            
            // 检测提示框类型
            if (alert.classList.contains('alert-primary')) {
                alert.classList.add('alert-primary-normalized');
            } else if (alert.classList.contains('alert-secondary')) {
                alert.classList.add('alert-secondary-normalized');
            } else if (alert.classList.contains('alert-danger')) {
                alert.classList.add('alert-danger-normalized');
            } else if (alert.classList.contains('alert-success')) {
                alert.classList.add('alert-success-normalized');
            } else if (alert.classList.contains('alert-warning')) {
                alert.classList.add('alert-warning-normalized');
            } else if (alert.classList.contains('alert-info')) {
                alert.classList.add('alert-info-normalized');
            } else {
                // 默认为信息提示框
                alert.classList.add('alert-info-normalized');
            }
            
            // 标记为已标准化
            alert.classList.add('normalized');
        });
    }
    
    /**
     * 切换主题
     * @param {string} theme 主题名称
     */
    toggleTheme(theme) {
        if (!this.options.theme.enabled) return;
        
        if (theme) {
            // 应用指定主题
            this.applyTheme(theme);
        } else {
            // 切换明暗主题
            const currentTheme = localStorage.getItem('nexusorbital-theme') || this.options.theme.defaultTheme;
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
        }
    }
    
    /**
     * 输出日志
     * @param {string} message 日志消息
     */
    log(message) {
        if (this.options.debug) {
            console.log(`[视觉一致性优化器] ${message}`);
        }
    }
}

// 创建并导出单例
const visualConsistencyOptimizer = new VisualConsistencyOptimizer();
export default visualConsistencyOptimizer;

// 自动初始化
if (typeof window !== 'undefined' && !window.disableVisualConsistency) {
    // 在DOM内容加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            visualConsistencyOptimizer.init();
        });
    } else {
        // 如果DOM已经加载完成，直接初始化
        visualConsistencyOptimizer.init();
    }
}
