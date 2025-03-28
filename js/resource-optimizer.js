/**
 * NexusOrbital资源加载优化器
 * 用于优化JavaScript和CSS资源的加载性能
 */

class ResourceOptimizer {
    constructor() {
        this.options = {
            priorityScripts: [],      // 优先加载的脚本
            deferNonCritical: true,   // 延迟加载非关键脚本
            preloadCriticalCSS: true, // 预加载关键CSS
            inlineSmallCSS: true,     // 内联小型CSS
            minifyInlineJS: true,     // 压缩内联JS
            minifyInlineCSS: true,    // 压缩内联CSS
            useCDN: false,            // 使用CDN
            cdnUrl: '',               // CDN基础URL
            cacheVersion: new Date().getTime() // 缓存版本号
        };
        
        this.initialized = false;
        this.resourcesOptimized = {
            scripts: 0,
            styles: 0,
            inlined: 0,
            deferred: 0,
            preloaded: 0
        };
    }
    
    /**
     * 初始化资源优化器
     * @param {Object} options 配置选项
     */
    init(options = {}) {
        if (this.initialized) return;
        
        // 合并选项
        this.options = { ...this.options, ...options };
        
        // 优化现有资源
        this.optimizeExistingResources();
        
        // 监听动态添加的资源
        this.observeDynamicResources();
        
        this.initialized = true;
        console.log('资源优化器已初始化', this.options);
    }
    
    /**
     * 优化现有资源
     */
    optimizeExistingResources() {
        // 优化脚本
        this.optimizeScripts();
        
        // 优化样式
        this.optimizeStyles();
        
        // 优化内联资源
        this.optimizeInlineResources();
        
        console.log('现有资源优化完成', this.resourcesOptimized);
    }
    
    /**
     * 优化脚本资源
     */
    optimizeScripts() {
        // 获取所有脚本标签
        const scripts = document.querySelectorAll('script[src]');
        
        scripts.forEach(script => {
            // 跳过已经优化过的脚本
            if (script.dataset.optimized === 'true') return;
            
            // 获取脚本URL
            const src = script.src;
            
            // 检查是否是优先脚本
            const isPriority = this.isPriorityScript(src);
            
            if (isPriority) {
                // 对优先脚本进行预加载
                this.preloadResource(src, 'script');
                
                // 确保优先脚本不被延迟或异步加载
                script.removeAttribute('defer');
                script.removeAttribute('async');
            } else if (this.options.deferNonCritical) {
                // 对非优先脚本进行延迟加载
                script.defer = true;
                this.resourcesOptimized.deferred++;
            }
            
            // 如果启用了CDN，替换URL
            if (this.options.useCDN && this.options.cdnUrl) {
                const cdnUrl = this.getCDNUrl(src);
                if (cdnUrl !== src) {
                    script.src = cdnUrl;
                }
            }
            
            // 添加缓存破坏参数
            script.src = this.addCacheBuster(script.src);
            
            // 标记为已优化
            script.dataset.optimized = 'true';
            this.resourcesOptimized.scripts++;
        });
    }
    
    /**
     * 优化样式资源
     */
    optimizeStyles() {
        // 获取所有样式标签
        const styles = document.querySelectorAll('link[rel="stylesheet"]');
        
        styles.forEach(style => {
            // 跳过已经优化过的样式
            if (style.dataset.optimized === 'true') return;
            
            // 获取样式URL
            const href = style.href;
            
            // 检查是否是关键CSS
            const isCritical = this.isCriticalCSS(href);
            
            if (isCritical && this.options.preloadCriticalCSS) {
                // 对关键CSS进行预加载
                this.preloadResource(href, 'style');
                this.resourcesOptimized.preloaded++;
            }
            
            // 如果是小型CSS且启用了内联选项，尝试内联
            if (this.options.inlineSmallCSS) {
                this.tryInlineCSS(style);
            }
            
            // 如果启用了CDN，替换URL
            if (this.options.useCDN && this.options.cdnUrl) {
                const cdnUrl = this.getCDNUrl(href);
                if (cdnUrl !== href) {
                    style.href = cdnUrl;
                }
            }
            
            // 添加缓存破坏参数
            style.href = this.addCacheBuster(style.href);
            
            // 标记为已优化
            style.dataset.optimized = 'true';
            this.resourcesOptimized.styles++;
        });
    }
    
    /**
     * 优化内联资源
     */
    optimizeInlineResources() {
        // 优化内联脚本
        if (this.options.minifyInlineJS) {
            const inlineScripts = document.querySelectorAll('script:not([src])');
            
            inlineScripts.forEach(script => {
                // 跳过已经优化过的脚本
                if (script.dataset.optimized === 'true') return;
                
                // 获取脚本内容
                const content = script.textContent;
                
                // 简单的压缩（实际应用中应使用更复杂的压缩算法）
                const minified = this.minifyJS(content);
                
                // 更新脚本内容
                script.textContent = minified;
                
                // 标记为已优化
                script.dataset.optimized = 'true';
                this.resourcesOptimized.inlined++;
            });
        }
        
        // 优化内联样式
        if (this.options.minifyInlineCSS) {
            const inlineStyles = document.querySelectorAll('style');
            
            inlineStyles.forEach(style => {
                // 跳过已经优化过的样式
                if (style.dataset.optimized === 'true') return;
                
                // 获取样式内容
                const content = style.textContent;
                
                // 简单的压缩（实际应用中应使用更复杂的压缩算法）
                const minified = this.minifyCSS(content);
                
                // 更新样式内容
                style.textContent = minified;
                
                // 标记为已优化
                style.dataset.optimized = 'true';
                this.resourcesOptimized.inlined++;
            });
        }
    }
    
    /**
     * 监听动态添加的资源
     */
    observeDynamicResources() {
        // 使用MutationObserver监听DOM变化
        const observer = new MutationObserver(mutations => {
            let newScripts = false;
            let newStyles = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        // 检查新添加的脚本
                        if (node.nodeName === 'SCRIPT') {
                            newScripts = true;
                        }
                        // 检查新添加的样式
                        else if (node.nodeName === 'LINK' && node.rel === 'stylesheet') {
                            newStyles = true;
                        }
                        // 检查新添加的内联样式
                        else if (node.nodeName === 'STYLE') {
                            newStyles = true;
                        }
                        // 检查包含脚本或样式的容器元素
                        else if (node.nodeType === 1) { // 元素节点
                            if (node.querySelector('script, link[rel="stylesheet"], style')) {
                                newScripts = true;
                                newStyles = true;
                            }
                        }
                    });
                }
            });
            
            // 如果有新的资源，重新优化
            if (newScripts) {
                this.optimizeScripts();
            }
            
            if (newStyles) {
                this.optimizeStyles();
                this.optimizeInlineResources();
            }
        });
        
        // 开始观察整个文档
        observer.observe(document, { childList: true, subtree: true });
        
        // 保存观察器引用以便清理
        this.resourceObserver = observer;
    }
    
    /**
     * 检查脚本是否为优先脚本
     * @param {string} src 脚本URL
     * @returns {boolean} 是否为优先脚本
     */
    isPriorityScript(src) {
        // 检查是否在优先脚本列表中
        return this.options.priorityScripts.some(pattern => {
            if (typeof pattern === 'string') {
                return src.includes(pattern);
            } else if (pattern instanceof RegExp) {
                return pattern.test(src);
            }
            return false;
        });
    }
    
    /**
     * 检查CSS是否为关键CSS
     * @param {string} href CSS URL
     * @returns {boolean} 是否为关键CSS
     */
    isCriticalCSS(href) {
        // 这里可以实现检查CSS是否关键的逻辑
        // 例如，检查URL是否包含"critical"关键字
        return href.includes('critical') || href.includes('main') || href.includes('core');
    }
    
    /**
     * 预加载资源
     * @param {string} url 资源URL
     * @param {string} type 资源类型（script或style）
     */
    preloadResource(url, type) {
        // 检查是否已经有预加载链接
        const existingPreload = document.querySelector(`link[rel="preload"][href="${url}"]`);
        if (existingPreload) return;
        
        // 创建预加载链接
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        
        // 设置as属性
        if (type === 'script') {
            link.as = 'script';
        } else if (type === 'style') {
            link.as = 'style';
        }
        
        // 添加到head
        document.head.appendChild(link);
        this.resourcesOptimized.preloaded++;
        
        console.log(`预加载资源: ${url}`);
    }
    
    /**
     * 尝试内联CSS
     * @param {HTMLLinkElement} linkElement 样式链接元素
     */
    tryInlineCSS(linkElement) {
        // 获取样式URL
        const href = linkElement.href;
        
        // 创建XMLHttpRequest获取CSS内容
        const xhr = new XMLHttpRequest();
        xhr.open('GET', href, true);
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                // 获取CSS内容
                let content = xhr.responseText;
                
                // 检查内容大小
                if (content.length < 4096) { // 小于4KB的CSS内联
                    // 如果启用了压缩，压缩CSS
                    if (this.options.minifyInlineCSS) {
                        content = this.minifyCSS(content);
                    }
                    
                    // 创建style元素
                    const style = document.createElement('style');
                    style.textContent = content;
                    style.dataset.optimized = 'true';
                    style.dataset.inlined = 'true';
                    style.dataset.originalHref = href;
                    
                    // 替换link元素
                    linkElement.parentNode.replaceChild(style, linkElement);
                    
                    this.resourcesOptimized.inlined++;
                    console.log(`内联CSS: ${href}`);
                }
            }
        };
        
        xhr.send();
    }
    
    /**
     * 获取CDN URL
     * @param {string} originalUrl 原始URL
     * @returns {string} CDN URL
     */
    getCDNUrl(originalUrl) {
        // 检查URL是否已经是CDN URL
        if (originalUrl.includes(this.options.cdnUrl)) {
            return originalUrl;
        }
        
        // 解析原始URL
        try {
            const url = new URL(originalUrl);
            const path = url.pathname;
            
            // 构建CDN URL
            return `${this.options.cdnUrl}${path}`;
        } catch (e) {
            console.warn(`无法解析URL: ${originalUrl}`, e);
            return originalUrl;
        }
    }
    
    /**
     * 添加缓存破坏参数
     * @param {string} url 原始URL
     * @returns {string} 带有缓存破坏参数的URL
     */
    addCacheBuster(url) {
        // 检查URL是否已经有查询参数
        if (url.includes('?')) {
            // 检查是否已经有v参数
            if (url.includes('v=')) {
                return url;
            }
            return `${url}&v=${this.options.cacheVersion}`;
        } else {
            return `${url}?v=${this.options.cacheVersion}`;
        }
    }
    
    /**
     * 简单的JavaScript压缩
     * @param {string} code JavaScript代码
     * @returns {string} 压缩后的代码
     */
    minifyJS(code) {
        // 这是一个非常简单的压缩实现
        // 实际应用中应使用专业的压缩工具如Terser
        
        // 移除注释
        code = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
        
        // 移除多余空白
        code = code.replace(/\s+/g, ' ');
        
        // 移除行首和行尾空白
        code = code.trim();
        
        return code;
    }
    
    /**
     * 简单的CSS压缩
     * @param {string} code CSS代码
     * @returns {string} 压缩后的代码
     */
    minifyCSS(code) {
        // 这是一个非常简单的压缩实现
        // 实际应用中应使用专业的压缩工具如cssnano
        
        // 移除注释
        code = code.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // 移除多余空白
        code = code.replace(/\s+/g, ' ');
        
        // 移除规则之间的空白
        code = code.replace(/\s*{\s*/g, '{');
        code = code.replace(/\s*}\s*/g, '}');
        code = code.replace(/\s*:\s*/g, ':');
        code = code.replace(/\s*;\s*/g, ';');
        code = code.replace(/\s*,\s*/g, ',');
        
        // 移除最后一个分号
        code = code.replace(/;}/g, '}');
        
        // 移除行首和行尾空白
        code = code.trim();
        
        return code;
    }
    
    /**
     * 动态加载脚本
     * @param {string} src 脚本URL
     * @param {boolean} async 是否异步加载
     * @param {Function} callback 加载完成回调
     * @returns {HTMLScriptElement} 脚本元素
     */
    loadScript(src, async = true, callback = null) {
        // 检查脚本是否已经加载
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            if (callback) callback();
            return existingScript;
        }
        
        // 创建脚本元素
        const script = document.createElement('script');
        script.src = src;
        
        // 设置异步属性
        if (async) {
            script.async = true;
        }
        
        // 设置加载完成回调
        if (callback) {
            script.onload = callback;
        }
        
        // 设置错误处理
        script.onerror = () => {
            console.error(`脚本加载失败: ${src}`);
            if (callback) callback(new Error(`脚本加载失败: ${src}`));
        };
        
        // 标记为已优化
        script.dataset.optimized = 'true';
        script.dataset.dynamicallyLoaded = 'true';
        
        // 添加到文档
        document.head.appendChild(script);
        
        return script;
    }
    
    /**
     * 动态加载样式
     * @param {string} href 样式URL
     * @param {Function} callback 加载完成回调
     * @returns {HTMLLinkElement} 样式元素
     */
    loadStyle(href, callback = null) {
        // 检查样式是否已经加载
        const existingStyle = document.querySelector(`link[rel="stylesheet"][href="${href}"]`);
        if (existingStyle) {
            if (callback) callback();
            return existingStyle;
        }
        
        // 创建样式元素
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        
        // 设置加载完成回调
        if (callback) {
            link.onload = callback;
        }
        
        // 设置错误处理
        link.onerror = () => {
            console.error(`样式加载失败: ${href}`);
            if (callback) callback(new Error(`样式加载失败: ${href}`));
        };
        
        // 标记为已优化
        link.dataset.optimized = 'true';
        link.dataset.dynamicallyLoaded = 'true';
        
        // 添加到文档
        document.head.appendChild(link);
        
        return link;
    }
    
    /**
     * 批量加载资源
     * @param {Array<Object>} resources 资源数组，每个元素包含type和url
     * @param {Function} callback 全部加载完成回调
     */
    loadResources(resources, callback = null) {
        if (!resources || !resources.length) {
            if (callback) callback();
            return;
        }
        
        let loaded = 0;
        const total = resources.length;
        
        // 加载完成处理
        const handleLoad = (err) => {
            loaded++;
            
            // 触发进度事件
            const event = new CustomEvent('resourceLoadProgress', { 
                detail: { loaded, total, progress: loaded / total } 
            });
            document.dispatchEvent(event);
            
            // 全部加载完成
            if (loaded === total && callback) {
                callback(err);
            }
        };
        
        // 加载每个资源
        resources.forEach(resource => {
            if (resource.type === 'script') {
                this.loadScript(resource.url, true, handleLoad);
            } else if (resource.type === 'style') {
                this.loadStyle(resource.url, handleLoad);
            } else {
                console.warn(`未知资源类型: ${resource.type}`);
                handleLoad();
            }
        });
    }
    
    /**
     * 获取资源优化统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        return {
            scriptsOptimized: this.resourcesOptimized.scripts,
            stylesOptimized: this.resourcesOptimized.styles,
            resourcesInlined: this.resourcesOptimized.inlined,
            resourcesDeferred: this.resourcesOptimized.deferred,
            resourcesPreloaded: this.resourcesOptimized.preloaded,
            totalOptimized: this.resourcesOptimized.scripts + 
                           this.resourcesOptimized.styles + 
                           this.resourcesOptimized.inlined
        };
    }
    
    /**
     * 清理资源优化器
     */
    cleanup() {
        // 停止资源观察
        if (this.resourceObserver) {
            this.resourceObserver.disconnect();
        }
        
        this.initialized = false;
        console.log('资源优化器已清理');
    }
}

// 创建并导出单例
const resourceOptimizer = new ResourceOptimizer();
export default resourceOptimizer;
