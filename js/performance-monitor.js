/**
 * NexusOrbital性能监控工具
 * 用于收集和分析关键性能指标
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            navigationStart: 0,
            fcp: 0,         // First Contentful Paint
            lcp: 0,         // Largest Contentful Paint
            fid: 0,         // First Input Delay
            cls: 0,         // Cumulative Layout Shift
            ttfb: 0,        // Time to First Byte
            domComplete: 0, // DOM完成时间
            resourceLoads: [], // 资源加载时间
            jsExecutionTime: 0, // JS执行时间
            apiCalls: []    // API调用时间
        };
        
        this.initialized = false;
    }
    
    /**
     * 初始化性能监控
     */
    init() {
        if (this.initialized) return;
        
        // 确保Performance API可用
        if (!window.performance || !window.performance.timing) {
            console.warn('Performance API不可用，性能监控将被禁用');
            return;
        }
        
        this.initialized = true;
        this.metrics.navigationStart = performance.timing.navigationStart;
        
        // 监控基本导航时间
        this.monitorNavigationTiming();
        
        // 监控Web Vitals
        this.monitorWebVitals();
        
        // 监控资源加载
        this.monitorResourceTiming();
        
        // 监控JS执行时间
        this.monitorJSExecution();
        
        // 监控API调用
        this.monitorApiCalls();
        
        // 页面完全加载后收集完整指标
        window.addEventListener('load', () => {
            // 给浏览器一些时间完成最终计算
            setTimeout(() => {
                this.collectFinalMetrics();
            }, 1000);
        });
        
        console.log('性能监控已初始化');
    }
    
    /**
     * 监控基本导航时间
     */
    monitorNavigationTiming() {
        window.addEventListener('DOMContentLoaded', () => {
            const timing = performance.timing;
            
            this.metrics.ttfb = timing.responseStart - timing.navigationStart;
            this.metrics.domComplete = timing.domComplete - timing.navigationStart;
            
            console.log(`TTFB: ${this.metrics.ttfb}ms, DOM完成: ${this.metrics.domComplete}ms`);
        });
    }
    
    /**
     * 监控Web Vitals指标
     */
    monitorWebVitals() {
        // 监控FCP (First Contentful Paint)
        const fcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
                this.metrics.fcp = entries[0].startTime;
                console.log(`FCP: ${this.metrics.fcp}ms`);
            }
        });
        
        try {
            fcpObserver.observe({ type: 'paint', buffered: true });
        } catch (e) {
            console.warn('FCP监控不可用:', e);
        }
        
        // 监控LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                this.metrics.lcp = lastEntry.startTime;
                console.log(`LCP: ${this.metrics.lcp}ms`);
            }
        });
        
        try {
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
            console.warn('LCP监控不可用:', e);
        }
        
        // 监控FID (First Input Delay)
        const fidObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
                this.metrics.fid = entries[0].processingStart - entries[0].startTime;
                console.log(`FID: ${this.metrics.fid}ms`);
            }
        });
        
        try {
            fidObserver.observe({ type: 'first-input', buffered: true });
        } catch (e) {
            console.warn('FID监控不可用:', e);
        }
        
        // 监控CLS (Cumulative Layout Shift)
        let clsValue = 0;
        let clsEntries = [];
        
        const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                // 只有不是由用户交互引起的布局偏移才计入CLS
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    clsEntries.push(entry);
                }
            }
            this.metrics.cls = clsValue;
            console.log(`当前CLS: ${clsValue.toFixed(4)}`);
        });
        
        try {
            clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
            console.warn('CLS监控不可用:', e);
        }
    }
    
    /**
     * 监控资源加载时间
     */
    monitorResourceTiming() {
        const resourceObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            
            for (const entry of entries) {
                // 只关注关键资源类型
                if (['script', 'link', 'img', 'css', 'fetch', 'xmlhttprequest'].includes(entry.initiatorType)) {
                    this.metrics.resourceLoads.push({
                        name: entry.name,
                        type: entry.initiatorType,
                        duration: entry.duration,
                        size: entry.transferSize || 0,
                        startTime: entry.startTime
                    });
                }
            }
        });
        
        try {
            resourceObserver.observe({ type: 'resource', buffered: true });
        } catch (e) {
            console.warn('资源监控不可用:', e);
        }
    }
    
    /**
     * 监控JS执行时间
     */
    monitorJSExecution() {
        const originalFetch = window.fetch;
        const originalXHR = window.XMLHttpRequest.prototype.open;
        
        // 监控所有API调用
        window.fetch = async (...args) => {
            const startTime = performance.now();
            try {
                const response = await originalFetch.apply(window, args);
                const endTime = performance.now();
                
                this.metrics.apiCalls.push({
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    duration: endTime - startTime,
                    status: response.status,
                    timestamp: new Date().toISOString()
                });
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                
                this.metrics.apiCalls.push({
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    duration: endTime - startTime,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                throw error;
            }
        };
        
        window.XMLHttpRequest.prototype.open = function(...args) {
            const xhr = this;
            const method = args[0];
            const url = args[1];
            
            const startTime = performance.now();
            
            xhr.addEventListener('loadend', () => {
                const endTime = performance.now();
                
                performanceMonitor.metrics.apiCalls.push({
                    url: url,
                    method: method,
                    duration: endTime - startTime,
                    status: xhr.status,
                    timestamp: new Date().toISOString()
                });
            });
            
            return originalXHR.apply(xhr, args);
        };
        
        // 监控长任务
        const longTaskObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            
            for (const entry of entries) {
                this.metrics.jsExecutionTime += entry.duration;
                console.log(`检测到长任务: ${entry.duration}ms`);
            }
        });
        
        try {
            longTaskObserver.observe({ type: 'longtask', buffered: true });
        } catch (e) {
            console.warn('长任务监控不可用:', e);
        }
    }
    
    /**
     * 监控API调用
     */
    monitorApiCalls() {
        // 已在monitorJSExecution中实现
    }
    
    /**
     * 收集最终性能指标
     */
    collectFinalMetrics() {
        // 计算关键资源的加载时间
        const resourcesByType = {
            script: [],
            style: [],
            image: [],
            font: [],
            api: []
        };
        
        // 分类资源
        this.metrics.resourceLoads.forEach(resource => {
            if (resource.type === 'script') {
                resourcesByType.script.push(resource);
            } else if (resource.type === 'link' || resource.type === 'css') {
                resourcesByType.style.push(resource);
            } else if (resource.type === 'img') {
                resourcesByType.image.push(resource);
            } else if (resource.type === 'font') {
                resourcesByType.font.push(resource);
            }
        });
        
        // API调用归类
        resourcesByType.api = this.metrics.apiCalls;
        
        // 计算每种资源的总加载时间和大小
        const summary = {
            script: this.calculateResourceSummary(resourcesByType.script),
            style: this.calculateResourceSummary(resourcesByType.style),
            image: this.calculateResourceSummary(resourcesByType.image),
            font: this.calculateResourceSummary(resourcesByType.font),
            api: this.calculateApiSummary(resourcesByType.api)
        };
        
        // 找出最慢的资源
        const slowestResources = this.findSlowestResources();
        
        // 找出最大的资源
        const largestResources = this.findLargestResources();
        
        // 生成性能报告
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
            metrics: {
                navigation: {
                    ttfb: this.metrics.ttfb,
                    domComplete: this.metrics.domComplete
                },
                webVitals: {
                    fcp: this.metrics.fcp,
                    lcp: this.metrics.lcp,
                    fid: this.metrics.fid,
                    cls: this.metrics.cls
                },
                resources: summary,
                jsExecutionTime: this.metrics.jsExecutionTime,
                slowestResources: slowestResources,
                largestResources: largestResources
            }
        };
        
        console.log('性能报告:', report);
        
        // 发送性能报告到控制台或服务器
        this.sendReport(report);
        
        return report;
    }
    
    /**
     * 计算资源加载摘要
     */
    calculateResourceSummary(resources) {
        if (resources.length === 0) {
            return { count: 0, totalDuration: 0, avgDuration: 0, totalSize: 0, avgSize: 0 };
        }
        
        const totalDuration = resources.reduce((sum, res) => sum + res.duration, 0);
        const totalSize = resources.reduce((sum, res) => sum + (res.size || 0), 0);
        
        return {
            count: resources.length,
            totalDuration: totalDuration,
            avgDuration: totalDuration / resources.length,
            totalSize: totalSize,
            avgSize: totalSize / resources.length
        };
    }
    
    /**
     * 计算API调用摘要
     */
    calculateApiSummary(apiCalls) {
        if (apiCalls.length === 0) {
            return { count: 0, totalDuration: 0, avgDuration: 0, successRate: 100 };
        }
        
        const totalDuration = apiCalls.reduce((sum, call) => sum + call.duration, 0);
        const successfulCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300).length;
        
        return {
            count: apiCalls.length,
            totalDuration: totalDuration,
            avgDuration: totalDuration / apiCalls.length,
            successRate: (successfulCalls / apiCalls.length) * 100
        };
    }
    
    /**
     * 找出最慢的资源
     */
    findSlowestResources(limit = 5) {
        // 合并所有资源
        const allResources = [...this.metrics.resourceLoads];
        
        // 按加载时间排序
        allResources.sort((a, b) => b.duration - a.duration);
        
        // 返回最慢的N个资源
        return allResources.slice(0, limit);
    }
    
    /**
     * 找出最大的资源
     */
    findLargestResources(limit = 5) {
        // 合并所有资源
        const allResources = [...this.metrics.resourceLoads].filter(res => res.size > 0);
        
        // 按大小排序
        allResources.sort((a, b) => b.size - a.size);
        
        // 返回最大的N个资源
        return allResources.slice(0, limit);
    }
    
    /**
     * 发送性能报告
     */
    sendReport(report) {
        // 在控制台显示报告
        console.table({
            'TTFB': `${report.metrics.navigation.ttfb}ms`,
            'DOM完成': `${report.metrics.navigation.domComplete}ms`,
            'FCP': `${report.metrics.webVitals.fcp}ms`,
            'LCP': `${report.metrics.webVitals.lcp}ms`,
            'FID': `${report.metrics.webVitals.fid}ms`,
            'CLS': report.metrics.webVitals.cls.toFixed(4),
            'JS执行时间': `${report.metrics.jsExecutionTime}ms`,
            '脚本资源': `${report.metrics.resources.script.count}个 (${(report.metrics.resources.script.totalSize / 1024).toFixed(2)}KB)`,
            '样式资源': `${report.metrics.resources.style.count}个 (${(report.metrics.resources.style.totalSize / 1024).toFixed(2)}KB)`,
            '图片资源': `${report.metrics.resources.image.count}个 (${(report.metrics.resources.image.totalSize / 1024).toFixed(2)}KB)`,
            'API调用': `${report.metrics.resources.api.count}个 (成功率: ${report.metrics.resources.api.successRate.toFixed(1)}%)`
        });
        
        // 这里可以添加将报告发送到服务器的代码
        // 例如:
        /*
        fetch('/api/performance-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(report)
        }).catch(err => console.error('发送性能报告失败:', err));
        */
        
        // 存储到localStorage以便后续分析
        try {
            const reports = JSON.parse(localStorage.getItem('performanceReports') || '[]');
            reports.push(report);
            // 只保留最近的10个报告
            if (reports.length > 10) {
                reports.shift();
            }
            localStorage.setItem('performanceReports', JSON.stringify(reports));
        } catch (e) {
            console.error('存储性能报告失败:', e);
        }
    }
    
    /**
     * 获取性能建议
     */
    getPerformanceRecommendations() {
        const report = this.collectFinalMetrics();
        const recommendations = [];
        
        // FCP建议
        if (report.metrics.webVitals.fcp > 1800) {
            recommendations.push({
                metric: 'FCP',
                severity: 'high',
                message: 'First Contentful Paint过慢，考虑优化关键渲染路径、减少阻塞资源',
                value: `${report.metrics.webVitals.fcp}ms`
            });
        }
        
        // LCP建议
        if (report.metrics.webVitals.lcp > 2500) {
            recommendations.push({
                metric: 'LCP',
                severity: 'high',
                message: 'Largest Contentful Paint过慢，考虑优化最大内容元素的加载时间、使用预加载',
                value: `${report.metrics.webVitals.lcp}ms`
            });
        }
        
        // FID建议
        if (report.metrics.webVitals.fid > 100) {
            recommendations.push({
                metric: 'FID',
                severity: 'medium',
                message: 'First Input Delay过长，考虑拆分长任务、优化JavaScript执行',
                value: `${report.metrics.webVitals.fid}ms`
            });
        }
        
        // CLS建议
        if (report.metrics.webVitals.cls > 0.1) {
            recommendations.push({
                metric: 'CLS',
                severity: 'medium',
                message: 'Cumulative Layout Shift过高，考虑为图片和视频设置尺寸、避免动态插入内容',
                value: report.metrics.webVitals.cls.toFixed(4)
            });
        }
        
        // 资源加载建议
        if (report.metrics.resources.image.totalSize > 1000 * 1024) {
            recommendations.push({
                metric: '图片资源',
                severity: 'medium',
                message: '图片资源总大小过大，考虑使用WebP格式、懒加载、响应式图片',
                value: `${(report.metrics.resources.image.totalSize / 1024).toFixed(2)}KB`
            });
        }
        
        if (report.metrics.resources.script.totalSize > 500 * 1024) {
            recommendations.push({
                metric: 'JavaScript资源',
                severity: 'high',
                message: 'JavaScript资源总大小过大，考虑代码分割、延迟加载、移除未使用代码',
                value: `${(report.metrics.resources.script.totalSize / 1024).toFixed(2)}KB`
            });
        }
        
        // API调用建议
        if (report.metrics.resources.api.avgDuration > 500) {
            recommendations.push({
                metric: 'API响应时间',
                severity: 'medium',
                message: 'API平均响应时间过长，考虑优化后端、使用缓存、合并请求',
                value: `${report.metrics.resources.api.avgDuration.toFixed(0)}ms`
            });
        }
        
        // 最慢资源建议
        if (report.metrics.slowestResources.length > 0 && report.metrics.slowestResources[0].duration > 1000) {
            const slowest = report.metrics.slowestResources[0];
            recommendations.push({
                metric: '最慢资源',
                severity: 'medium',
                message: `最慢的资源加载时间过长: ${slowest.name}`,
                value: `${slowest.duration.toFixed(0)}ms`
            });
        }
        
        return recommendations;
    }
}

// 创建并导出单例
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
