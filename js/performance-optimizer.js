/**
 * NexusOrbital性能优化器
 * 整合所有性能优化工具，提供统一的接口
 */

import performanceMonitor from './performance-monitor.js';
import imageOptimizer from './image-optimizer.js';
import resourceOptimizer from './resource-optimizer.js';

class PerformanceOptimizer {
    constructor() {
        this.options = {
            // 全局选项
            enabled: true,
            debug: false,
            
            // 性能监控选项
            monitoring: {
                enabled: true,
                autoReport: true,
                reportInterval: 60000 // 1分钟
            },
            
            // 图片优化选项
            images: {
                enabled: true,
                lazyLoad: true,
                webpSupport: true,
                responsiveImages: true,
                lazyLoadThreshold: 200
            },
            
            // 资源优化选项
            resources: {
                enabled: true,
                deferNonCritical: true,
                preloadCriticalCSS: true,
                inlineSmallCSS: true,
                priorityScripts: [
                    'main.js',
                    'core.js',
                    'api-service.js'
                ]
            },
            
            // 缓存优化选项
            cache: {
                enabled: true,
                localStorageTTL: 86400, // 24小时
                sessionStorageTTL: 3600 // 1小时
            }
        };
        
        this.initialized = false;
        this.optimizationApplied = false;
        this.startTime = 0;
        this.reportTimer = null;
    }
    
    /**
     * 初始化性能优化器
     * @param {Object} options 配置选项
     */
    init(options = {}) {
        if (this.initialized) return;
        
        this.startTime = performance.now();
        
        // 合并选项（深度合并）
        this.mergeOptions(options);
        
        if (!this.options.enabled) {
            console.log('性能优化器已禁用');
            return;
        }
        
        this.log('性能优化器初始化中...');
        
        // 初始化性能监控
        if (this.options.monitoring.enabled) {
            performanceMonitor.init();
            this.log('性能监控已初始化');
            
            // 设置自动报告
            if (this.options.monitoring.autoReport) {
                this.setupAutoReporting();
            }
        }
        
        // 初始化图片优化
        if (this.options.images.enabled) {
            imageOptimizer.init({
                lazyLoadThreshold: this.options.images.lazyLoadThreshold,
                webpSupport: this.options.images.webpSupport
            });
            this.log('图片优化已初始化');
        }
        
        // 初始化资源优化
        if (this.options.resources.enabled) {
            resourceOptimizer.init({
                deferNonCritical: this.options.resources.deferNonCritical,
                preloadCriticalCSS: this.options.resources.preloadCriticalCSS,
                inlineSmallCSS: this.options.resources.inlineSmallCSS,
                priorityScripts: this.options.resources.priorityScripts
            });
            this.log('资源优化已初始化');
        }
        
        // 初始化缓存优化
        if (this.options.cache.enabled) {
            this.initCacheOptimization();
        }
        
        // 在DOM内容加载后应用优化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.applyOptimizations();
            });
        } else {
            // 如果DOM已经加载完成，直接应用优化
            this.applyOptimizations();
        }
        
        this.initialized = true;
        this.log('性能优化器初始化完成');
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
     * 应用所有优化
     */
    applyOptimizations() {
        if (this.optimizationApplied) return;
        
        this.log('应用性能优化...');
        
        // 优化图片
        if (this.options.images.enabled) {
            this.optimizeImages();
        }
        
        // 优化资源加载
        if (this.options.resources.enabled) {
            this.optimizeResourceLoading();
        }
        
        // 优化缓存
        if (this.options.cache.enabled) {
            this.optimizeCache();
        }
        
        this.optimizationApplied = true;
        
        const duration = performance.now() - this.startTime;
        this.log(`性能优化应用完成，耗时: ${duration.toFixed(2)}ms`);
        
        // 生成初始性能报告
        setTimeout(() => {
            this.generatePerformanceReport();
        }, 3000);
    }
    
    /**
     * 优化图片
     */
    optimizeImages() {
        // 查找所有图片
        const images = document.querySelectorAll('img:not([data-optimized="true"])');
        
        // 标记关键图片（首屏可见的图片）
        const criticalImages = Array.from(images).filter(img => {
            return this.isElementInViewport(img);
        });
        
        // 优先加载关键图片
        criticalImages.forEach(img => {
            img.dataset.critical = 'true';
            
            // 如果图片有data-src但在首屏，直接加载
            if (img.dataset.src && !img.src) {
                img.src = img.dataset.src;
            }
        });
        
        // 对于非关键图片，应用懒加载
        if (this.options.images.lazyLoad) {
            const nonCriticalImages = Array.from(images).filter(img => {
                return !img.dataset.critical;
            });
            
            nonCriticalImages.forEach(img => {
                // 如果图片没有data-src属性，添加它
                if (!img.dataset.src && img.src) {
                    img.dataset.src = img.src;
                    img.removeAttribute('src');
                }
                
                // 如果图片有srcset但没有data-srcset
                if (img.srcset && !img.dataset.srcset) {
                    img.dataset.srcset = img.srcset;
                    img.removeAttribute('srcset');
                }
                
                img.dataset.optimized = 'true';
            });
        }
        
        // 应用响应式图片优化
        if (this.options.images.responsiveImages) {
            const responsiveImages = Array.from(images).filter(img => {
                // 找出没有srcset但有固定宽高的图片
                return !img.srcset && !img.dataset.srcset && (img.width > 0 || img.height > 0);
            });
            
            responsiveImages.forEach(img => {
                // 为图片生成srcset
                if (!img.dataset.noResponsive) {
                    imageOptimizer.generateSrcSet(img);
                }
            });
        }
        
        this.log(`已优化 ${images.length} 张图片，其中 ${criticalImages.length} 张关键图片`);
    }
    
    /**
     * 优化资源加载
     */
    optimizeResourceLoading() {
        // 查找所有脚本和样式
        const scripts = document.querySelectorAll('script[src]:not([data-optimized="true"])');
        const styles = document.querySelectorAll('link[rel="stylesheet"]:not([data-optimized="true"])');
        
        // 标记关键资源
        this.markCriticalResources(scripts, 'script');
        this.markCriticalResources(styles, 'style');
        
        // 延迟加载非关键脚本
        if (this.options.resources.deferNonCritical) {
            const nonCriticalScripts = Array.from(scripts).filter(script => {
                return !script.dataset.critical;
            });
            
            nonCriticalScripts.forEach(script => {
                // 如果脚本没有async或defer属性，添加defer
                if (!script.async && !script.defer) {
                    script.defer = true;
                }
                
                script.dataset.optimized = 'true';
            });
        }
        
        // 预加载关键CSS
        if (this.options.resources.preloadCriticalCSS) {
            const criticalStyles = Array.from(styles).filter(style => {
                return style.dataset.critical === 'true';
            });
            
            criticalStyles.forEach(style => {
                resourceOptimizer.preloadResource(style.href, 'style');
                style.dataset.optimized = 'true';
            });
        }
        
        this.log(`已优化 ${scripts.length} 个脚本和 ${styles.length} 个样式表`);
    }
    
    /**
     * 标记关键资源
     * @param {NodeList} resources 资源节点列表
     * @param {string} type 资源类型
     */
    markCriticalResources(resources, type) {
        resources.forEach(resource => {
            let url = '';
            
            if (type === 'script') {
                url = resource.src;
            } else if (type === 'style') {
                url = resource.href;
            }
            
            // 检查是否是关键资源
            let isCritical = false;
            
            if (type === 'script') {
                // 检查脚本是否在优先列表中
                isCritical = this.options.resources.priorityScripts.some(pattern => {
                    return url.includes(pattern);
                });
            } else if (type === 'style') {
                // 检查样式是否是关键CSS
                isCritical = url.includes('critical') || url.includes('main') || url.includes('core');
            }
            
            // 标记关键资源
            if (isCritical) {
                resource.dataset.critical = 'true';
            }
        });
    }
    
    /**
     * 初始化缓存优化
     */
    initCacheOptimization() {
        // 清理过期的本地存储缓存
        this.cleanExpiredCache();
        
        // 设置缓存清理定时器
        setInterval(() => {
            this.cleanExpiredCache();
        }, 3600000); // 每小时清理一次
        
        this.log('缓存优化已初始化');
    }
    
    /**
     * 优化缓存
     */
    optimizeCache() {
        // 实现缓存优化逻辑
        // 例如，预缓存常用资源
        this.precacheCommonResources();
    }
    
    /**
     * 预缓存常用资源
     */
    precacheCommonResources() {
        // 这里可以实现预缓存逻辑
        // 例如，使用Service Worker缓存静态资源
        if ('serviceWorker' in navigator && this.options.cache.enabled) {
            // 注册Service Worker
            // 注意：这需要在服务器上运行，本地文件协议不支持
            if (location.protocol === 'https:' || location.hostname === 'localhost') {
                this.registerServiceWorker();
            }
        }
    }
    
    /**
     * 注册Service Worker
     */
    registerServiceWorker() {
        // 检查是否已经注册
        if (navigator.serviceWorker.controller) {
            this.log('Service Worker已激活');
            return;
        }
        
        // 尝试注册Service Worker
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                this.log('Service Worker注册成功:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker注册失败:', error);
            });
    }
    
    /**
     * 清理过期缓存
     */
    cleanExpiredCache() {
        // 清理localStorage
        this.cleanExpiredStorage(localStorage, this.options.cache.localStorageTTL);
        
        // 清理sessionStorage
        this.cleanExpiredStorage(sessionStorage, this.options.cache.sessionStorageTTL);
    }
    
    /**
     * 清理过期存储
     * @param {Storage} storage 存储对象
     * @param {number} ttl 过期时间（秒）
     */
    cleanExpiredStorage(storage, ttl) {
        const now = Date.now();
        let cleaned = 0;
        
        // 遍历所有项
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            
            // 跳过非缓存项
            if (!key.startsWith('cache:')) continue;
            
            try {
                const item = JSON.parse(storage.getItem(key));
                
                // 检查是否过期
                if (item.expires && item.expires < now) {
                    storage.removeItem(key);
                    cleaned++;
                    i--; // 调整索引，因为删除了一项
                }
            } catch (e) {
                // 如果解析失败，可能不是有效的缓存项，跳过
                continue;
            }
        }
        
        if (cleaned > 0) {
            this.log(`已清理 ${cleaned} 个过期缓存项`);
        }
    }
    
    /**
     * 缓存数据到存储
     * @param {string} key 缓存键
     * @param {any} data 缓存数据
     * @param {number} ttl 过期时间（秒）
     * @param {Storage} storage 存储对象，默认为localStorage
     */
    cacheData(key, data, ttl = 3600, storage = localStorage) {
        if (!this.options.cache.enabled) return;
        
        // 构建缓存项
        const cacheKey = `cache:${key}`;
        const cacheItem = {
            data: data,
            timestamp: Date.now(),
            expires: Date.now() + (ttl * 1000)
        };
        
        // 存储缓存项
        try {
            storage.setItem(cacheKey, JSON.stringify(cacheItem));
        } catch (e) {
            console.error('缓存数据失败:', e);
            
            // 如果存储失败（可能是存储已满），尝试清理一些旧缓存
            this.cleanOldestCache(storage);
            
            // 再次尝试存储
            try {
                storage.setItem(cacheKey, JSON.stringify(cacheItem));
            } catch (e) {
                console.error('再次尝试缓存数据失败:', e);
            }
        }
    }
    
    /**
     * 从存储获取缓存数据
     * @param {string} key 缓存键
     * @param {Storage} storage 存储对象，默认为localStorage
     * @returns {any} 缓存数据，如果不存在或已过期则返回null
     */
    getCachedData(key, storage = localStorage) {
        if (!this.options.cache.enabled) return null;
        
        // 构建缓存键
        const cacheKey = `cache:${key}`;
        
        // 获取缓存项
        try {
            const cacheItemStr = storage.getItem(cacheKey);
            if (!cacheItemStr) return null;
            
            const cacheItem = JSON.parse(cacheItemStr);
            
            // 检查是否过期
            if (cacheItem.expires && cacheItem.expires < Date.now()) {
                storage.removeItem(cacheKey);
                return null;
            }
            
            return cacheItem.data;
        } catch (e) {
            console.error('获取缓存数据失败:', e);
            return null;
        }
    }
    
    /**
     * 清理最旧的缓存
     * @param {Storage} storage 存储对象
     * @param {number} count 要清理的数量
     */
    cleanOldestCache(storage, count = 5) {
        // 获取所有缓存项
        const cacheItems = [];
        
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            
            // 只处理缓存项
            if (!key.startsWith('cache:')) continue;
            
            try {
                const item = JSON.parse(storage.getItem(key));
                cacheItems.push({
                    key: key,
                    timestamp: item.timestamp || 0
                });
            } catch (e) {
                // 跳过无效项
                continue;
            }
        }
        
        // 按时间戳排序
        cacheItems.sort((a, b) => a.timestamp - b.timestamp);
        
        // 删除最旧的几项
        const itemsToRemove = cacheItems.slice(0, count);
        itemsToRemove.forEach(item => {
            storage.removeItem(item.key);
        });
        
        this.log(`已清理 ${itemsToRemove.length} 个最旧的缓存项以释放空间`);
    }
    
    /**
     * 设置自动报告
     */
    setupAutoReporting() {
        // 清除现有定时器
        if (this.reportTimer) {
            clearInterval(this.reportTimer);
        }
        
        // 设置新定时器
        this.reportTimer = setInterval(() => {
            this.generatePerformanceReport();
        }, this.options.monitoring.reportInterval);
        
        this.log(`已设置性能自动报告，间隔: ${this.options.monitoring.reportInterval / 1000}秒`);
    }
    
    /**
     * 生成性能报告
     */
    generatePerformanceReport() {
        if (!this.options.monitoring.enabled) return;
        
        // 获取性能数据
        const report = performanceMonitor.collectFinalMetrics();
        
        // 获取图片优化统计
        const imageStats = imageOptimizer.getStats();
        
        // 获取资源优化统计
        const resourceStats = resourceOptimizer.getStats();
        
        // 合并报告
        const fullReport = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            performance: report.metrics,
            optimization: {
                images: imageStats,
                resources: resourceStats
            }
        };
        
        // 获取性能建议
        const recommendations = performanceMonitor.getPerformanceRecommendations();
        if (recommendations.length > 0) {
            fullReport.recommendations = recommendations;
        }
        
        // 输出报告
        if (this.options.debug) {
            console.log('性能报告:', fullReport);
            
            // 如果有建议，单独输出
            if (recommendations.length > 0) {
                console.log('性能优化建议:');
                recommendations.forEach(rec => {
                    console.log(`- [${rec.severity.toUpperCase()}] ${rec.metric}: ${rec.message} (当前值: ${rec.value})`);
                });
            }
        }
        
        // 这里可以添加将报告发送到服务器的代码
        
        return fullReport;
    }
    
    /**
     * 检查元素是否在视口内
     * @param {HTMLElement} el 要检查的元素
     * @param {number} threshold 阈值（像素）
     * @returns {boolean} 是否在视口内
     */
    isElementInViewport(el, threshold = 0) {
        const rect = el.getBoundingClientRect();
        
        return (
            rect.bottom >= -threshold &&
            rect.right >= -threshold &&
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
            rect.left <= (window.innerWidth || document.documentElement.clientWidth) + threshold
        );
    }
    
    /**
     * 输出日志
     * @param {string} message 日志消息
     */
    log(message) {
        if (this.options.debug) {
            console.log(`[性能优化器] ${message}`);
        }
    }
    
    /**
     * 清理性能优化器
     */
    cleanup() {
        // 清除报告定时器
        if (this.reportTimer) {
            clearInterval(this.reportTimer);
            this.reportTimer = null;
        }
        
        this.initialized = false;
        this.optimizationApplied = false;
        
        this.log('性能优化器已清理');
    }
}

// 创建并导出单例
const performanceOptimizer = new PerformanceOptimizer();
export default performanceOptimizer;

// 自动初始化（可以通过window.disableAutoOptimization = true禁用）
if (typeof window !== 'undefined' && !window.disableAutoOptimization) {
    // 在DOM内容加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            performanceOptimizer.init();
        });
    } else {
        // 如果DOM已经加载完成，直接初始化
        performanceOptimizer.init();
    }
}
