/**
 * NexusOrbital图片优化工具
 * 用于优化网站图片加载性能
 */

class ImageOptimizer {
    constructor() {
        this.options = {
            lazyLoadThreshold: 200,  // 懒加载阈值（像素）
            placeholderColor: '#f0f0f0', // 占位符颜色
            defaultQuality: 80,      // 默认图片质量
            webpSupport: false,      // 是否支持WebP
            lowBandwidth: false      // 是否低带宽模式
        };
        
        this.initialized = false;
    }
    
    /**
     * 初始化图片优化器
     * @param {Object} options 配置选项
     */
    init(options = {}) {
        if (this.initialized) return;
        
        // 合并选项
        this.options = { ...this.options, ...options };
        
        // 检测WebP支持
        this.detectWebPSupport();
        
        // 检测网络状况
        this.detectNetworkCondition();
        
        // 设置懒加载
        this.setupLazyLoading();
        
        // 设置响应式图片
        this.setupResponsiveImages();
        
        this.initialized = true;
        console.log('图片优化器已初始化', this.options);
    }
    
    /**
     * 检测浏览器是否支持WebP
     */
    detectWebPSupport() {
        const webP = new Image();
        webP.onload = () => {
            this.options.webpSupport = true;
            console.log('浏览器支持WebP格式');
            
            // 更新已有图片为WebP格式（如果有WebP版本）
            this.updateImagesToWebP();
        };
        webP.onerror = () => {
            this.options.webpSupport = false;
            console.log('浏览器不支持WebP格式');
        };
        webP.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    }
    
    /**
     * 检测网络状况
     */
    detectNetworkCondition() {
        // 使用Navigator.connection API（如果可用）
        if (navigator.connection) {
            const connection = navigator.connection;
            
            // 监听网络变化
            connection.addEventListener('change', () => {
                this.handleNetworkChange(connection);
            });
            
            // 初始检测
            this.handleNetworkChange(connection);
        } else {
            // 回退方案：使用图片加载时间估计网络状况
            this.estimateNetworkCondition();
        }
    }
    
    /**
     * 处理网络变化
     * @param {NetworkInformation} connection 网络信息对象
     */
    handleNetworkChange(connection) {
        // 检查网络类型和有效类型
        const effectiveType = connection.effectiveType; // 2g, 3g, 4g
        const type = connection.type; // wifi, cellular, etc.
        const saveData = connection.saveData; // 是否开启数据节省模式
        
        console.log(`网络状况变化: 类型=${type}, 有效类型=${effectiveType}, 数据节省=${saveData}`);
        
        // 根据网络状况调整图片加载策略
        if (effectiveType === '2g' || effectiveType === 'slow-2g' || saveData) {
            this.options.lowBandwidth = true;
            this.options.defaultQuality = 60; // 降低质量
            
            // 对于低带宽，可以考虑更激进的优化
            this.applyLowBandwidthOptimizations();
        } else {
            this.options.lowBandwidth = false;
            this.options.defaultQuality = 80;
            
            // 恢复正常加载
            this.resetLowBandwidthOptimizations();
        }
    }
    
    /**
     * 估计网络状况（当NetworkInformation API不可用时）
     */
    estimateNetworkCondition() {
        const startTime = performance.now();
        const testImage = new Image();
        
        testImage.onload = () => {
            const loadTime = performance.now() - startTime;
            
            // 根据加载时间估计网络状况
            if (loadTime > 1000) { // 1秒以上认为是慢网络
                this.options.lowBandwidth = true;
                this.options.defaultQuality = 60;
                this.applyLowBandwidthOptimizations();
                console.log('检测到慢网络，已启用低带宽优化');
            } else {
                this.options.lowBandwidth = false;
                this.options.defaultQuality = 80;
                console.log('检测到快速网络');
            }
        };
        
        testImage.onerror = () => {
            // 加载失败，可能是网络问题
            this.options.lowBandwidth = true;
            this.options.defaultQuality = 60;
            this.applyLowBandwidthOptimizations();
            console.log('网络测试失败，已启用低带宽优化');
        };
        
        // 加载一个小图片进行测试
        testImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
    
    /**
     * 应用低带宽优化
     */
    applyLowBandwidthOptimizations() {
        // 1. 停止预加载非关键图片
        this.stopNonCriticalPreloads();
        
        // 2. 替换为低质量图片
        this.replaceWithLowQualityImages();
        
        // 3. 增加懒加载阈值，使图片更晚加载
        this.options.lazyLoadThreshold = 50;
        
        // 4. 更新懒加载配置
        this.updateLazyLoadingConfig();
    }
    
    /**
     * 重置低带宽优化
     */
    resetLowBandwidthOptimizations() {
        // 恢复默认懒加载阈值
        this.options.lazyLoadThreshold = 200;
        
        // 更新懒加载配置
        this.updateLazyLoadingConfig();
        
        // 恢复正常质量图片（如果页面刷新或重新访问）
    }
    
    /**
     * 停止非关键图片的预加载
     */
    stopNonCriticalPreloads() {
        // 查找所有带有preload的link标签
        const preloads = document.querySelectorAll('link[rel="preload"][as="image"]:not([data-critical="true"])');
        
        // 移除非关键图片的预加载
        preloads.forEach(link => {
            link.remove();
            console.log(`已停止预加载: ${link.href}`);
        });
    }
    
    /**
     * 替换为低质量图片
     */
    replaceWithLowQualityImages() {
        // 查找所有未加载的图片（不在视口内的）
        const images = document.querySelectorAll('img:not([data-loaded="true"]):not([data-critical="true"])');
        
        images.forEach(img => {
            // 如果图片有低质量版本
            if (img.dataset.lowSrc) {
                // 保存原始src以便网络恢复时使用
                if (!img.dataset.originalSrc) {
                    img.dataset.originalSrc = img.src;
                }
                
                // 替换为低质量版本
                img.src = img.dataset.lowSrc;
                console.log(`已替换为低质量图片: ${img.src}`);
            }
            // 如果没有指定低质量版本，但有高质量版本，可以动态生成低质量URL
            else if (img.src && !img.src.includes('data:image')) {
                // 保存原始src
                if (!img.dataset.originalSrc) {
                    img.dataset.originalSrc = img.src;
                }
                
                // 这里假设有一个图片处理服务可以动态调整质量
                // 例如: example.com/image.jpg?quality=60
                const lowQualitySrc = this.getLowQualityUrl(img.src);
                img.src = lowQualitySrc;
                console.log(`已动态替换为低质量图片: ${lowQualitySrc}`);
            }
        });
    }
    
    /**
     * 获取低质量图片URL
     * @param {string} originalUrl 原始图片URL
     * @returns {string} 低质量图片URL
     */
    getLowQualityUrl(originalUrl) {
        // 这里实现根据原始URL生成低质量URL的逻辑
        // 例如添加quality参数或使用特定的图片处理服务
        
        // 如果URL已经包含参数
        if (originalUrl.includes('?')) {
            return `${originalUrl}&quality=${this.options.defaultQuality}`;
        } else {
            return `${originalUrl}?quality=${this.options.defaultQuality}`;
        }
        
        // 注意：这是一个简化的实现，实际应用中可能需要更复杂的URL处理
        // 或者使用专门的图片CDN服务（如Cloudinary、Imgix等）
    }
    
    /**
     * 更新图片为WebP格式（如果支持）
     */
    updateImagesToWebP() {
        if (!this.options.webpSupport) return;
        
        // 查找所有未加载的图片
        const images = document.querySelectorAll('img:not([data-loaded="true"])');
        
        images.forEach(img => {
            // 如果图片有WebP版本
            if (img.dataset.webpSrc) {
                // 保存原始src以便回退
                if (!img.dataset.originalSrc) {
                    img.dataset.originalSrc = img.src;
                }
                
                // 替换为WebP版本
                img.src = img.dataset.webpSrc;
                console.log(`已替换为WebP格式: ${img.src}`);
            }
            // 如果没有指定WebP版本，但可以动态生成WebP URL
            else if (img.src && !img.src.includes('data:image') && this.canConvertToWebP(img.src)) {
                // 保存原始src
                if (!img.dataset.originalSrc) {
                    img.dataset.originalSrc = img.src;
                }
                
                // 转换为WebP URL
                const webpSrc = this.getWebPUrl(img.src);
                img.src = webpSrc;
                console.log(`已动态替换为WebP格式: ${webpSrc}`);
            }
        });
    }
    
    /**
     * 检查URL是否可以转换为WebP
     * @param {string} url 原始URL
     * @returns {boolean} 是否可以转换
     */
    canConvertToWebP(url) {
        // 检查URL是否指向可转换为WebP的图片格式
        const supportedExtensions = ['.jpg', '.jpeg', '.png'];
        return supportedExtensions.some(ext => url.toLowerCase().endsWith(ext));
    }
    
    /**
     * 获取WebP格式的URL
     * @param {string} originalUrl 原始图片URL
     * @returns {string} WebP格式的URL
     */
    getWebPUrl(originalUrl) {
        // 这里实现根据原始URL生成WebP URL的逻辑
        // 有多种可能的实现方式，取决于服务器端的支持
        
        // 方法1：更改文件扩展名（如果服务器支持）
        // return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        
        // 方法2：添加格式参数（如果使用图片处理服务）
        if (originalUrl.includes('?')) {
            return `${originalUrl}&format=webp`;
        } else {
            return `${originalUrl}?format=webp`;
        }
    }
    
    /**
     * 设置懒加载
     */
    setupLazyLoading() {
        // 如果浏览器支持IntersectionObserver，使用现代懒加载
        if ('IntersectionObserver' in window) {
            this.setupModernLazyLoading();
        } else {
            // 回退到传统的滚动事件懒加载
            this.setupLegacyLazyLoading();
        }
    }
    
    /**
     * 设置现代懒加载（使用IntersectionObserver）
     */
    setupModernLazyLoading() {
        // 创建观察器配置
        const options = {
            root: null, // 使用视口作为根
            rootMargin: `${this.options.lazyLoadThreshold}px 0px`, // 提前加载阈值
            threshold: 0.01 // 当1%的元素可见时触发
        };
        
        // 创建观察器
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    observer.unobserve(img); // 加载后停止观察
                }
            });
        }, options);
        
        // 查找所有带有data-src属性的图片
        const lazyImages = document.querySelectorAll('img[data-src]:not([data-loaded="true"])');
        
        // 开始观察每个图片
        lazyImages.forEach(img => {
            // 设置占位符背景
            this.setPlaceholder(img);
            
            // 观察图片
            observer.observe(img);
        });
        
        // 保存观察器引用以便更新
        this.lazyLoadObserver = observer;
        
        console.log(`已设置现代懒加载，阈值: ${this.options.lazyLoadThreshold}px`);
    }
    
    /**
     * 设置传统懒加载（使用滚动事件）
     */
    setupLegacyLazyLoading() {
        // 查找所有带有data-src属性的图片
        const lazyImages = document.querySelectorAll('img[data-src]:not([data-loaded="true"])');
        
        // 设置占位符
        lazyImages.forEach(img => {
            this.setPlaceholder(img);
        });
        
        // 检查图片是否在视口内的函数
        const checkImages = () => {
            lazyImages.forEach(img => {
                if (img.dataset.loaded) return; // 已加载的图片跳过
                
                if (this.isInViewport(img, this.options.lazyLoadThreshold)) {
                    this.loadImage(img);
                }
            });
        };
        
        // 初始检查
        checkImages();
        
        // 添加滚动事件监听
        const throttledCheck = this.throttle(checkImages, 200);
        window.addEventListener('scroll', throttledCheck);
        window.addEventListener('resize', throttledCheck);
        window.addEventListener('orientationchange', throttledCheck);
        
        // 保存引用以便清理
        this.legacyLazyLoadHandler = throttledCheck;
        
        console.log(`已设置传统懒加载，阈值: ${this.options.lazyLoadThreshold}px`);
    }
    
    /**
     * 更新懒加载配置
     */
    updateLazyLoadingConfig() {
        // 如果使用现代懒加载，更新IntersectionObserver
        if (this.lazyLoadObserver) {
            // 由于IntersectionObserver的配置不能直接更新，需要重新创建
            this.lazyLoadObserver.disconnect();
            this.setupModernLazyLoading();
        }
        // 对于传统懒加载，不需要特殊处理，因为阈值会在下次检查时使用
    }
    
    /**
     * 加载图片
     * @param {HTMLImageElement} img 图片元素
     */
    loadImage(img) {
        // 如果已经加载，跳过
        if (img.dataset.loaded === 'true') return;
        
        // 获取真实图片URL
        const src = img.dataset.src;
        
        // 如果没有data-src，跳过
        if (!src) return;
        
        // 根据网络和浏览器支持选择最佳格式
        let bestSrc = src;
        
        // 如果支持WebP且有WebP版本
        if (this.options.webpSupport && img.dataset.webpSrc) {
            bestSrc = img.dataset.webpSrc;
        }
        // 如果是低带宽且有低质量版本
        else if (this.options.lowBandwidth && img.dataset.lowSrc) {
            bestSrc = img.dataset.lowSrc;
        }
        
        // 设置图片源
        img.src = bestSrc;
        
        // 如果有srcset，也设置
        if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
        }
        
        // 图片加载完成后移除占位符样式
        img.onload = () => {
            img.style.backgroundColor = '';
            img.style.transition = 'opacity 0.3s ease-in';
            img.style.opacity = '1';
            img.dataset.loaded = 'true';
            
            // 触发自定义事件
            const event = new CustomEvent('imageLoaded', { detail: { img } });
            document.dispatchEvent(event);
        };
        
        // 图片加载失败处理
        img.onerror = () => {
            console.warn(`图片加载失败: ${bestSrc}`);
            
            // 如果使用的是WebP或低质量版本，尝试回退到原始版本
            if (bestSrc !== src) {
                console.log(`尝试回退到原始图片: ${src}`);
                img.src = src;
            } else {
                // 设置为错误占位符
                img.style.backgroundColor = '#f8d7da'; // 错误颜色
                img.dataset.loaded = 'error';
                
                // 触发自定义事件
                const event = new CustomEvent('imageError', { detail: { img, src: bestSrc } });
                document.dispatchEvent(event);
            }
        };
    }
    
    /**
     * 设置图片占位符
     * @param {HTMLImageElement} img 图片元素
     */
    setPlaceholder(img) {
        // 设置占位符背景色
        img.style.backgroundColor = this.options.placeholderColor;
        img.style.opacity = '0.1';
        
        // 如果有尺寸信息，设置宽高以防止布局偏移
        if (img.width && img.height) {
            img.style.aspectRatio = `${img.width} / ${img.height}`;
        } else if (img.dataset.width && img.dataset.height) {
            img.style.aspectRatio = `${img.dataset.width} / ${img.dataset.height}`;
        }
    }
    
    /**
     * 检查元素是否在视口内
     * @param {HTMLElement} el 要检查的元素
     * @param {number} threshold 阈值（像素）
     * @returns {boolean} 是否在视口内
     */
    isInViewport(el, threshold = 0) {
        const rect = el.getBoundingClientRect();
        
        return (
            rect.bottom >= -threshold &&
            rect.right >= -threshold &&
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
            rect.left <= (window.innerWidth || document.documentElement.clientWidth) + threshold
        );
    }
    
    /**
     * 设置响应式图片
     */
    setupResponsiveImages() {
        // 查找所有没有srcset但有data-srcset的图片
        const responsiveImages = document.querySelectorAll('img[data-srcset]:not([srcset])');
        
        responsiveImages.forEach(img => {
            // 如果图片不是懒加载的，直接设置srcset
            if (!img.dataset.src) {
                img.srcset = img.dataset.srcset;
                
                // 如果有sizes属性
                if (img.dataset.sizes) {
                    img.sizes = img.dataset.sizes;
                } else {
                    // 自动计算sizes
                    this.calculateAndSetSizes(img);
                }
            }
            // 对于懒加载图片，srcset会在加载时设置
        });
    }
    
    /**
     * 计算并设置图片的sizes属性
     * @param {HTMLImageElement} img 图片元素
     */
    calculateAndSetSizes(img) {
        // 获取图片在页面中的宽度
        const width = img.offsetWidth;
        
        // 如果宽度为0（可能是隐藏的或尚未渲染），使用默认值
        if (width === 0) {
            img.sizes = '100vw'; // 假设图片宽度为视口宽度
            return;
        }
        
        // 计算图片相对于视口的宽度百分比
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const percentage = Math.round((width / viewportWidth) * 100);
        
        // 设置sizes属性
        img.sizes = `${percentage}vw`;
    }
    
    /**
     * 节流函数
     * @param {Function} func 要节流的函数
     * @param {number} limit 时间限制（毫秒）
     * @returns {Function} 节流后的函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * 预加载关键图片
     * @param {Array<string>} urls 要预加载的图片URL数组
     */
    preloadCriticalImages(urls) {
        if (!urls || !urls.length) return;
        
        // 如果是低带宽模式，只预加载前几张
        const imagesToPreload = this.options.lowBandwidth ? urls.slice(0, 2) : urls;
        
        imagesToPreload.forEach(url => {
            // 创建link标签进行预加载
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            link.dataset.critical = 'true'; // 标记为关键资源
            
            // 添加到head
            document.head.appendChild(link);
            
            console.log(`预加载关键图片: ${url}`);
        });
    }
    
    /**
     * 优化特定图片
     * @param {HTMLImageElement} img 要优化的图片元素
     */
    optimizeImage(img) {
        // 如果图片已加载，跳过
        if (img.complete || img.dataset.loaded === 'true') return;
        
        // 设置懒加载
        if (!img.dataset.src && !img.dataset.loaded) {
            img.dataset.src = img.src;
            img.removeAttribute('src'); // 移除src以防止立即加载
            
            // 设置占位符
            this.setPlaceholder(img);
            
            // 如果使用现代懒加载
            if (this.lazyLoadObserver) {
                this.lazyLoadObserver.observe(img);
            }
            // 否则在下次滚动检查时会处理
        }
        
        // 设置响应式
        if (img.dataset.srcset && !img.srcset) {
            // 懒加载图片的srcset会在加载时设置
            // 这里不需要额外处理
        } else if (!img.dataset.srcset && !img.srcset) {
            // 如果没有srcset，可以考虑自动生成
            this.generateSrcSet(img);
        }
    }
    
    /**
     * 为图片生成srcset
     * @param {HTMLImageElement} img 图片元素
     */
    generateSrcSet(img) {
        // 只为没有srcset的图片生成
        if (img.srcset || img.dataset.srcset) return;
        
        // 获取原始src
        const src = img.src || img.dataset.src;
        if (!src || src.startsWith('data:')) return;
        
        // 生成不同宽度的图片URL
        // 这里假设有一个图片处理服务可以通过width参数调整宽度
        // 例如: example.com/image.jpg?width=300
        
        // 常用的响应式宽度
        const widths = [300, 600, 900, 1200, 1800];
        
        // 生成srcset字符串
        const srcset = widths.map(width => {
            const url = this.getResizedImageUrl(src, width);
            return `${url} ${width}w`;
        }).join(', ');
        
        // 设置srcset
        if (img.dataset.src) {
            // 对于懒加载图片，设置data-srcset
            img.dataset.srcset = srcset;
        } else {
            // 对于普通图片，直接设置srcset
            img.srcset = srcset;
            
            // 自动计算sizes
            this.calculateAndSetSizes(img);
        }
    }
    
    /**
     * 获取调整大小后的图片URL
     * @param {string} originalUrl 原始图片URL
     * @param {number} width 目标宽度
     * @returns {string} 调整大小后的URL
     */
    getResizedImageUrl(originalUrl, width) {
        // 这里实现根据原始URL生成调整大小的URL的逻辑
        // 具体实现取决于你的图片处理服务
        
        // 如果URL已经包含参数
        if (originalUrl.includes('?')) {
            return `${originalUrl}&width=${width}`;
        } else {
            return `${originalUrl}?width=${width}`;
        }
    }
    
    /**
     * 获取图片优化统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        // 所有图片
        const allImages = document.querySelectorAll('img');
        
        // 已加载的图片
        const loadedImages = document.querySelectorAll('img[data-loaded="true"]');
        
        // 懒加载的图片
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        // 响应式图片
        const responsiveImages = document.querySelectorAll('img[srcset], img[data-srcset]');
        
        // WebP图片
        const webpImages = document.querySelectorAll('img[src*=".webp"], img[data-webp-src]');
        
        // 计算总图片大小（如果有transferSize）
        let totalSize = 0;
        let optimizedSize = 0;
        
        if (window.performance && window.performance.getEntriesByType) {
            const resources = window.performance.getEntriesByType('resource');
            
            resources.forEach(resource => {
                if (resource.initiatorType === 'img') {
                    totalSize += resource.transferSize || 0;
                    
                    // 如果是WebP或响应式图片，计入优化大小
                    const url = resource.name;
                    if (url.includes('.webp') || url.includes('format=webp') || 
                        url.includes('width=') || url.includes('quality=')) {
                        optimizedSize += resource.transferSize || 0;
                    }
                }
            });
        }
        
        return {
            totalImages: allImages.length,
            loadedImages: loadedImages.length,
            lazyLoadedImages: lazyImages.length,
            responsiveImages: responsiveImages.length,
            webpImages: webpImages.length,
            totalSize: totalSize,
            optimizedSize: optimizedSize,
            estimatedSavings: totalSize > 0 ? (1 - (optimizedSize / totalSize)) * 100 : 0
        };
    }
}

// 创建并导出单例
const imageOptimizer = new ImageOptimizer();
export default imageOptimizer;
