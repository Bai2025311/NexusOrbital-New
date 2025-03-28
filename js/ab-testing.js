/**
 * NexusOrbital A/B测试模块
 * 
 * 该模块用于设置和管理A/B测试，比较优化前后的用户体验
 * 收集关键指标，如页面加载时间、用户停留时间、转化率等
 */

// A/B测试配置
const ABTestingConfig = {
    // 是否启用A/B测试
    enabled: true,
    
    // 测试ID，用于区分不同的测试
    testId: 'ux-optimization-test-' + new Date().toISOString().split('T')[0],
    
    // 测试变体
    variants: {
        // 原始版本（对照组）
        'control': {
            name: '原始版本',
            weight: 25, // 权重，决定用户被分配到该变体的概率
            features: {
                uxOptimizer: false,
                responsiveOptimization: false,
                performanceOptimization: false,
                visualConsistency: false
            }
        },
        // 性能优化版本
        'performance': {
            name: '性能优化版本',
            weight: 25,
            features: {
                uxOptimizer: true,
                responsiveOptimization: false,
                performanceOptimization: true,
                visualConsistency: false
            }
        },
        // 响应式优化版本
        'responsive': {
            name: '响应式优化版本',
            weight: 25,
            features: {
                uxOptimizer: true,
                responsiveOptimization: true,
                performanceOptimization: false,
                visualConsistency: false
            }
        },
        // 全面优化版本（实验组）
        'optimized': {
            name: '全面优化版本',
            weight: 25,
            features: {
                uxOptimizer: true,
                responsiveOptimization: true,
                performanceOptimization: true,
                visualConsistency: true
            }
        }
    },
    
    // 测试目标（要测量的指标）
    metrics: {
        // 页面加载时间
        pageLoadTime: {
            name: '页面加载时间',
            description: '从导航开始到页面完全加载的时间',
            unit: 'ms',
            lowerIsBetter: true
        },
        // 首次内容绘制时间
        firstContentfulPaint: {
            name: '首次内容绘制时间',
            description: '从导航开始到页面内容的第一部分被渲染的时间',
            unit: 'ms',
            lowerIsBetter: true
        },
        // 用户停留时间
        timeOnPage: {
            name: '用户停留时间',
            description: '用户在页面上停留的总时间',
            unit: 's',
            lowerIsBetter: false
        },
        // 交互次数
        interactionCount: {
            name: '交互次数',
            description: '用户与页面元素交互的次数',
            unit: '次',
            lowerIsBetter: false
        },
        // 转化率
        conversionRate: {
            name: '转化率',
            description: '完成特定目标操作的用户比例',
            unit: '%',
            lowerIsBetter: false
        }
    },
    
    // 转化目标（用于计算转化率）
    conversionGoals: {
        // 项目详情查看
        viewProjectDetails: {
            name: '查看项目详情',
            selector: '.project-card',
            event: 'click'
        },
        // 资源下载
        downloadResource: {
            name: '下载资源',
            selector: '.resource-download-btn',
            event: 'click'
        },
        // 注册/登录
        userRegistration: {
            name: '用户注册/登录',
            selector: '.auth-btn, .register-btn, .login-btn',
            event: 'click'
        },
        // 提交反馈
        submitFeedback: {
            name: '提交反馈',
            selector: '#feedback-submit',
            event: 'click'
        },
        // 社区页面特定转化目标
        viewDiscussionDetails: {
            name: '查看讨论详情',
            selector: '.discussion-item',
            event: 'click'
        },
        eventSignup: {
            name: '活动报名',
            selector: '.event-signup-btn',
            event: 'click'
        },
        viewExpertProfile: {
            name: '查看专家资料',
            selector: '.expert-card',
            event: 'click'
        },
        forumParticipation: {
            name: '参与论坛',
            selector: '.forum-card',
            event: 'click'
        }
    }
};

// A/B测试类
class ABTesting {
    constructor(config) {
        this.config = config;
        this.currentVariant = null;
        this.startTime = null;
        this.interactionCount = 0;
        this.conversionGoals = {};
        this.metrics = {};
        
        // 初始化本地存储键
        this.storageKey = 'nexusorbital_ab_testing';
        
        // 绑定方法
        this.trackInteraction = this.trackInteraction.bind(this);
        this.trackConversion = this.trackConversion.bind(this);
    }
    
    // 初始化A/B测试
    init() {
        if (!this.config.enabled) {
            console.log('A/B测试已禁用');
            return;
        }
        
        console.log('初始化A/B测试:', this.config.testId);
        
        // 分配用户到测试变体
        this.assignUserToVariant();
        
        // 初始化性能指标收集
        this.initPerformanceMetrics();
        
        // 初始化用户交互跟踪
        this.initInteractionTracking();
        
        // 初始化转化目标跟踪
        this.initConversionTracking();
        
        // 记录会话开始时间
        this.startTime = new Date();
        
        // 设置页面离开事件
        window.addEventListener('beforeunload', () => {
            this.trackTimeOnPage();
            this.saveMetrics();
        });
        
        console.log('用户被分配到变体:', this.currentVariant.name);
        
        return this.currentVariant;
    }
    
    // 分配用户到测试变体
    assignUserToVariant() {
        // 检查用户是否已经被分配到变体
        const storedData = this.getStoredData();
        
        if (storedData && storedData.testId === this.config.testId && storedData.variant) {
            // 使用已存储的变体
            this.currentVariant = this.config.variants[storedData.variant];
            console.log('用户已被分配到变体:', this.currentVariant.name);
        } else {
            // 随机分配用户到变体
            this.currentVariant = this.getRandomVariant();
            
            // 存储分配结果
            this.storeData({
                testId: this.config.testId,
                variant: this.getVariantId(this.currentVariant),
                assignedAt: new Date().toISOString()
            });
            
            console.log('用户被随机分配到变体:', this.currentVariant.name);
        }
    }
    
    // 随机获取变体，基于权重
    getRandomVariant() {
        const variants = this.config.variants;
        const variantIds = Object.keys(variants);
        
        // 计算总权重
        const totalWeight = variantIds.reduce((sum, id) => sum + variants[id].weight, 0);
        
        // 生成随机数
        const random = Math.random() * totalWeight;
        
        // 基于权重选择变体
        let weightSum = 0;
        for (const id of variantIds) {
            weightSum += variants[id].weight;
            if (random <= weightSum) {
                return variants[id];
            }
        }
        
        // 默认返回第一个变体
        return variants[variantIds[0]];
    }
    
    // 获取变体ID
    getVariantId(variant) {
        for (const id in this.config.variants) {
            if (this.config.variants[id] === variant) {
                return id;
            }
        }
        return null;
    }
    
    // 初始化性能指标收集
    initPerformanceMetrics() {
        // 确保Performance API可用
        if (!window.performance || !window.performance.timing) {
            console.warn('Performance API不可用，无法收集性能指标');
            return;
        }
        
        // 页面加载完成后收集性能指标
        window.addEventListener('load', () => {
            // 等待一段时间确保所有指标都已可用
            setTimeout(() => {
                this.collectPerformanceMetrics();
            }, 0);
        });
    }
    
    // 收集性能指标
    collectPerformanceMetrics() {
        const timing = window.performance.timing;
        
        // 计算页面加载时间
        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        this.metrics.pageLoadTime = pageLoadTime;
        
        // 计算首次内容绘制时间
        let firstContentfulPaint = 0;
        
        // 尝试从Paint Timing API获取FCP
        if (window.performance && window.performance.getEntriesByType) {
            const paintMetrics = window.performance.getEntriesByType('paint');
            const fcpEntry = paintMetrics.find(entry => entry.name === 'first-contentful-paint');
            
            if (fcpEntry) {
                firstContentfulPaint = fcpEntry.startTime;
            }
        }
        
        // 如果无法获取FCP，使用DOMContentLoaded作为近似值
        if (!firstContentfulPaint) {
            firstContentfulPaint = timing.domContentLoadedEventEnd - timing.navigationStart;
        }
        
        this.metrics.firstContentfulPaint = firstContentfulPaint;
        
        console.log('性能指标:', {
            pageLoadTime: `${pageLoadTime}ms`,
            firstContentfulPaint: `${firstContentfulPaint}ms`
        });
    }
    
    // 初始化用户交互跟踪
    initInteractionTracking() {
        // 跟踪点击事件
        document.addEventListener('click', this.trackInteraction);
        
        // 跟踪滚动事件（使用节流以减少事件数量）
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(() => {
                    this.trackInteraction();
                    scrollTimeout = null;
                }, 1000); // 1秒节流
            }
        });
    }
    
    // 跟踪用户交互
    trackInteraction() {
        this.interactionCount++;
        this.metrics.interactionCount = this.interactionCount;
    }
    
    // 跟踪用户停留时间
    trackTimeOnPage() {
        if (!this.startTime) return;
        
        const endTime = new Date();
        const timeOnPage = Math.round((endTime - this.startTime) / 1000); // 转换为秒
        
        this.metrics.timeOnPage = timeOnPage;
        
        console.log('用户停留时间:', `${timeOnPage}秒`);
    }
    
    // 初始化转化目标跟踪
    initConversionTracking() {
        const goals = this.config.conversionGoals;
        
        // 初始化转化目标计数
        for (const goalId in goals) {
            this.conversionGoals[goalId] = 0;
        }
        
        // 为每个转化目标添加事件监听器
        for (const goalId in goals) {
            const goal = goals[goalId];
            
            // 查找匹配的元素
            const elements = document.querySelectorAll(goal.selector);
            
            if (elements.length > 0) {
                elements.forEach(element => {
                    element.addEventListener(goal.event, () => {
                        this.trackConversion(goalId);
                    });
                });
                
                console.log(`已为转化目标 "${goal.name}" 设置跟踪`);
            } else {
                console.warn(`未找到转化目标 "${goal.name}" 的元素:`, goal.selector);
            }
        }
    }
    
    // 跟踪转化
    trackConversion(goalId) {
        if (this.conversionGoals.hasOwnProperty(goalId)) {
            this.conversionGoals[goalId]++;
            
            // 更新总转化率
            const totalConversions = Object.values(this.conversionGoals).reduce((sum, count) => sum + count, 0);
            this.metrics.conversionRate = totalConversions;
            
            const goalName = this.config.conversionGoals[goalId].name;
            console.log(`转化目标 "${goalName}" 已完成`);
            
            // 保存指标
            this.saveMetrics();
        }
    }
    
    // 获取存储的数据
    getStoredData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('读取A/B测试数据失败:', error);
            return null;
        }
    }
    
    // 存储数据
    storeData(data) {
        try {
            const currentData = this.getStoredData() || {};
            const newData = { ...currentData, ...data };
            localStorage.setItem(this.storageKey, JSON.stringify(newData));
        } catch (error) {
            console.error('存储A/B测试数据失败:', error);
        }
    }
    
    // 保存指标
    saveMetrics() {
        // 添加当前变体信息
        const metricsData = {
            ...this.metrics,
            variant: this.getVariantId(this.currentVariant),
            timestamp: new Date().toISOString(),
            conversionGoals: this.conversionGoals,
            page: window.location.pathname,
            testId: this.config.testId
        };
        
        // 存储指标
        this.storeData({ metrics: metricsData });
        
        // 如果有服务器端API，也可以发送到服务器
        this.sendMetricsToServer(metricsData);
    }
    
    // 发送指标到服务器
    sendMetricsToServer(metricsData) {
        // 在实际项目中，这里应该发送到服务器API
        // 这里仅做演示，将数据输出到控制台
        console.log('发送指标到服务器:', metricsData);
        
        // 实际实现可能类似：
        /*
        fetch('/api/ab-testing/metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metricsData)
        })
        .then(response => response.json())
        .then(data => console.log('指标已发送到服务器:', data))
        .catch(error => console.error('发送指标失败:', error));
        */
    }
    
    // 获取当前变体的特性配置
    getFeatureConfig() {
        return this.currentVariant ? this.currentVariant.features : null;
    }
    
    // 检查特性是否启用
    isFeatureEnabled(featureName) {
        if (!this.currentVariant || !this.currentVariant.features) {
            return false;
        }
        
        return !!this.currentVariant.features[featureName];
    }
    
    // 获取收集的指标
    getMetrics() {
        return { ...this.metrics };
    }
}

// 创建A/B测试实例
const abTesting = new ABTesting(ABTestingConfig);

// 导出A/B测试模块
export default abTesting;
