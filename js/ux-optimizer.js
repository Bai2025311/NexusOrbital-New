/**
 * NexusOrbital用户体验优化器
 * 整合所有优化工具，提供统一的接口
 */

import performanceOptimizer from './performance-optimizer.js';
import responsiveOptimizer from './responsive-optimizer.js';
import visualConsistencyOptimizer from './visual-consistency.js';
import ThemeManager from './theme-manager.js';

class UXOptimizer {
    constructor() {
        this.options = {
            // 全局选项
            enabled: true,
            debug: false,
            
            // 性能优化选项
            performance: {
                enabled: true,
                monitoring: true,
                imageOptimization: true,
                resourceOptimization: true
            },
            
            // 响应式优化选项
            responsive: {
                enabled: true,
                adaptNavigation: true,
                optimizeTouch: true,
                adaptFontSize: true
            },
            
            // 视觉一致性选项
            visualConsistency: {
                enabled: true,
                theme: {
                    enabled: true,
                    defaultTheme: 'light',
                    supportDarkMode: true
                }
            }
        };
        
        this.initialized = false;
        this.themeManager = null;
    }
    
    /**
     * 初始化用户体验优化器
     * @param {Object} options 配置选项
     */
    init(options = {}) {
        if (this.initialized) return;
        
        // 合并选项
        this.mergeOptions(options);
        
        if (!this.options.enabled) {
            console.log('用户体验优化器已禁用');
            return;
        }
        
        this.log('用户体验优化器初始化中...');
        
        // 初始化性能优化器
        if (this.options.performance.enabled) {
            performanceOptimizer.init({
                enabled: true,
                monitoring: {
                    enabled: this.options.performance.monitoring
                },
                images: {
                    enabled: this.options.performance.imageOptimization
                },
                resources: {
                    enabled: this.options.performance.resourceOptimization
                }
            });
            this.log('性能优化器已初始化');
        }
        
        // 初始化响应式优化器
        if (this.options.responsive.enabled) {
            responsiveOptimizer.init({
                adaptNavigation: this.options.responsive.adaptNavigation,
                optimizeTouch: this.options.responsive.optimizeTouch,
                adaptFontSize: this.options.responsive.adaptFontSize
            });
            this.log('响应式优化器已初始化');
        }
        
        // 初始化主题管理器
        if (this.options.visualConsistency.enabled && this.options.visualConsistency.theme.enabled) {
            this.themeManager = new ThemeManager(this.options.visualConsistency.theme);
            this.themeManager.init();
            this.log('主题管理器已初始化');
        }
        
        // 初始化视觉一致性优化器
        if (this.options.visualConsistency.enabled) {
            visualConsistencyOptimizer.init({
                enabled: true,
                theme: this.options.visualConsistency.theme
            });
            this.log('视觉一致性优化器已初始化');
        }
        
        this.initialized = true;
        this.log('用户体验优化器初始化完成');
        
        // 添加主题切换按钮
        if (this.options.visualConsistency.theme.enabled) {
            this.addThemeToggleButton();
        }
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
     * 添加主题切换按钮
     */
    addThemeToggleButton() {
        // 检查是否已经存在主题切换按钮
        if (document.querySelector('.theme-toggle-btn')) return;
        
        // 创建主题切换按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-toggle-btn';
        toggleBtn.setAttribute('aria-label', '切换主题');
        toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"></path></svg>';
        
        // 添加点击事件
        toggleBtn.addEventListener('click', () => {
            if (this.themeManager) {
                this.themeManager.toggleTheme();
            } else {
                visualConsistencyOptimizer.toggleTheme();
            }
        });
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .theme-toggle-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: var(--nexus-color-background-elevated, #ffffff);
                border: 1px solid var(--nexus-color-border, #dee2e6);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                transition: all 0.3s ease;
            }
            
            .theme-toggle-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
            }
            
            .theme-toggle-btn svg {
                color: var(--nexus-color-text-primary, #212529);
            }
            
            .theme-dark .theme-toggle-btn svg {
                color: var(--nexus-color-text-primary, #e0e0e0);
            }
        `;
        document.head.appendChild(style);
        
        // 添加到文档
        document.body.appendChild(toggleBtn);
    }
    
    /**
     * 获取性能报告
     * @returns {Object} 性能报告
     */
    getPerformanceReport() {
        if (!this.options.performance.enabled) {
            return { error: '性能优化器未启用' };
        }
        
        return performanceOptimizer.generatePerformanceReport();
    }
    
    /**
     * 切换主题
     * @param {string} theme 主题名称
     */
    toggleTheme(theme) {
        if (!this.options.visualConsistency.enabled || !this.options.visualConsistency.theme.enabled) {
            return;
        }
        
        if (this.themeManager) {
            if (theme) {
                this.themeManager.applyTheme(theme);
            } else {
                this.themeManager.toggleTheme();
            }
        } else {
            visualConsistencyOptimizer.toggleTheme(theme);
        }
    }
    
    /**
     * 获取当前主题
     * @returns {string} 当前主题名称
     */
    getCurrentTheme() {
        if (!this.options.visualConsistency.enabled || !this.options.visualConsistency.theme.enabled) {
            return null;
        }
        
        if (this.themeManager) {
            return this.themeManager.getCurrentTheme();
        } else {
            return localStorage.getItem('nexusorbital-theme') || this.options.visualConsistency.theme.defaultTheme;
        }
    }
    
    /**
     * 创建主题选择器
     * @param {HTMLElement} container 容器元素
     */
    createThemeSwitcher(container) {
        if (!this.options.visualConsistency.enabled || !this.options.visualConsistency.theme.enabled) {
            return;
        }
        
        if (this.themeManager) {
            this.themeManager.createThemeSwitcher(container);
        }
    }
    
    /**
     * 输出日志
     * @param {string} message 日志消息
     */
    log(message) {
        if (this.options.debug) {
            console.log(`[用户体验优化器] ${message}`);
        }
    }
}

// 创建并导出单例
const uxOptimizer = new UXOptimizer();
export default uxOptimizer;

// 自动初始化
if (typeof window !== 'undefined' && !window.disableUXOptimization) {
    // 在DOM内容加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            uxOptimizer.init();
        });
    } else {
        // 如果DOM已经加载完成，直接初始化
        uxOptimizer.init();
    }
}
