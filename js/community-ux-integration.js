/**
 * NexusOrbital - 社区页面用户体验优化集成
 * 
 * 该脚本整合了用户体验优化工具和A/B测试功能到社区页面
 * 包括性能监控、响应式优化、视觉一致性和用户反馈收集
 */

// 导入UX优化器和A/B测试模块
import uxOptimizer from './ux-optimizer.js';
import abTesting from './ab-testing.js';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('初始化社区页面用户体验优化...');
    
    // 初始化A/B测试
    const variant = initABTesting();
    
    // 根据A/B测试变体决定是否启用UX优化
    if (variant && variant.features.uxOptimizer) {
        // 初始化UX优化器
        initUXOptimizer();
    } else {
        console.log('当前用户被分配到对照组，不启用UX优化');
    }
    
    // 初始化反馈功能（无论是哪个变体都启用）
    initFeedbackSystem();
    
    // 添加性能标记点
    markPerformanceTimeline('community-page-ready');
});

/**
 * 初始化A/B测试
 * @returns {Object} 当前用户的测试变体
 */
function initABTesting() {
    console.log('初始化A/B测试...');
    
    try {
        // 初始化A/B测试
        const variant = abTesting.init();
        
        // 记录用户被分配的变体
        console.log(`用户被分配到变体: ${variant.name}`);
        console.log('变体特性配置:', variant.features);
        
        // 添加变体标识到body，用于CSS选择器
        document.body.setAttribute('data-variant', abTesting.getVariantId(variant));
        
        return variant;
    } catch (error) {
        console.error('初始化A/B测试失败:', error);
        
        // 出错时默认启用所有优化
        return {
            name: '默认配置',
            features: {
                uxOptimizer: true,
                responsiveOptimization: true,
                performanceOptimization: true,
                visualConsistency: true
            }
        };
    }
}

/**
 * 初始化UX优化器
 */
function initUXOptimizer() {
    console.log('初始化UX优化器...');
    
    try {
        // 获取A/B测试变体的特性配置
        const featureConfig = abTesting.getFeatureConfig() || {};
        
        // 初始化UX优化器，根据A/B测试变体配置特性
        uxOptimizer.init({
            debug: false,
            performance: {
                enabled: featureConfig.performanceOptimization !== false,
                monitoring: true,
                imageOptimization: true,
                resourceOptimization: true
            },
            responsive: {
                enabled: featureConfig.responsiveOptimization !== false,
                adaptNavigation: true,
                optimizeTouch: true,
                adaptFontSize: true
            },
            visualConsistency: {
                enabled: featureConfig.visualConsistency !== false,
                theme: {
                    enabled: true,
                    defaultTheme: 'light',
                    supportDarkMode: true,
                    respectUserPreference: true
                }
            }
        });
        
        // 优化图片加载
        optimizeImageLoading();
        
        // 优化交互元素
        enhanceInteractiveElements();
        
        console.log('UX优化器初始化成功');
    } catch (error) {
        console.error('初始化UX优化器失败:', error);
    }
}

/**
 * 优化图片加载
 */
function optimizeImageLoading() {
    // 使用Intersection Observer实现懒加载
    if ('IntersectionObserver' in window) {
        const imgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        // 获取所有带有data-src属性的图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            imgObserver.observe(img);
        });
    } else {
        // 降级处理：立即加载所有图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
    }
}

/**
 * 增强交互元素
 */
function enhanceInteractiveElements() {
    // 增强论坛卡片交互
    document.querySelectorAll('.forum-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            markUserInteraction('forum-card-hover');
        });
        
        card.addEventListener('click', () => {
            markUserInteraction('forum-card-click');
        });
    });
    
    // 增强专家卡片交互
    document.querySelectorAll('.expert-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            markUserInteraction('expert-card-hover');
        });
        
        card.addEventListener('click', () => {
            markUserInteraction('expert-card-click');
        });
    });
    
    // 增强活动卡片交互
    document.querySelectorAll('.event-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            markUserInteraction('event-card-hover');
        });
        
        card.addEventListener('click', () => {
            markUserInteraction('event-card-click');
        });
    });
    
    // 跟踪讨论项点击
    document.querySelectorAll('.discussion-item').forEach(item => {
        item.addEventListener('click', () => {
            markUserInteraction('discussion-item-click');
            
            // 记录转化
            if (abTesting && typeof abTesting.trackConversion === 'function') {
                abTesting.trackConversion('viewDiscussionDetails');
            }
        });
    });
    
    // 跟踪活动报名按钮点击
    document.querySelectorAll('.event-info .btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止触发父元素的点击事件
            markUserInteraction('event-signup-click');
            
            // 记录转化
            if (abTesting && typeof abTesting.trackConversion === 'function') {
                abTesting.trackConversion('eventSignup');
            }
        });
    });
}

/**
 * 初始化反馈系统
 */
function initFeedbackSystem() {
    console.log('初始化反馈系统...');
    
    const feedbackButton = document.getElementById('feedback-button');
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackClose = document.getElementById('feedback-close');
    const feedbackForm = document.getElementById('feedback-form');
    
    if (!feedbackButton || !feedbackModal || !feedbackClose || !feedbackForm) {
        console.error('反馈系统初始化失败: 缺少必要的DOM元素');
        return;
    }
    
    // 打开反馈模态框
    feedbackButton.addEventListener('click', () => {
        feedbackModal.classList.add('active');
        markUserInteraction('feedback-button-click');
    });
    
    // 关闭反馈模态框
    feedbackClose.addEventListener('click', () => {
        feedbackModal.classList.remove('active');
    });
    
    // 点击模态框外部关闭
    feedbackModal.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            feedbackModal.classList.remove('active');
        }
    });
    
    // 提交反馈表单
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 获取表单数据
        const formData = new FormData(feedbackForm);
        const feedbackData = {
            type: formData.get('feedback-type'),
            rating: formData.get('rating'),
            message: formData.get('feedback-message'),
            email: formData.get('feedback-email'),
            page: 'community',
            timestamp: new Date().toISOString(),
            // 添加A/B测试信息
            abTest: abTesting && abTesting.getVariantId ? {
                testId: abTesting.config.testId,
                variant: abTesting.getVariantId(abTesting.currentVariant)
            } : null,
            // 添加性能指标
            performance: collectPerformanceMetrics()
        };
        
        // 发送反馈数据
        submitFeedback(feedbackData);
    });
}

/**
 * 提交反馈数据
 * @param {Object} data - 反馈数据
 */
function submitFeedback(data) {
    console.log('提交反馈数据:', data);
    
    // 显示提交中状态
    const submitButton = document.getElementById('feedback-submit');
    const originalText = submitButton.textContent;
    submitButton.textContent = '提交中...';
    submitButton.disabled = true;
    
    // 发送数据到服务器
    fetch('/api/feedback-collector.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('提交反馈失败');
        }
        return response.json();
    })
    .then(result => {
        console.log('反馈提交成功:', result);
        
        // 重置表单
        document.getElementById('feedback-form').reset();
        
        // 关闭模态框
        document.getElementById('feedback-modal').classList.remove('active');
        
        // 显示成功消息
        alert('感谢您的反馈！');
        
        // 记录转化
        if (abTesting && typeof abTesting.trackConversion === 'function') {
            abTesting.trackConversion('submitFeedback');
        }
    })
    .catch(error => {
        console.error('提交反馈失败:', error);
        alert('提交反馈失败，请稍后再试。');
    })
    .finally(() => {
        // 恢复按钮状态
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

/**
 * 收集性能指标
 * @returns {Object} 性能指标对象
 */
function collectPerformanceMetrics() {
    const metrics = {};
    
    // 检查Performance API是否可用
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        
        // 计算关键性能指标
        metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
        metrics.firstPaint = timing.responseEnd - timing.navigationStart;
        metrics.backendTime = timing.responseEnd - timing.requestStart;
        metrics.frontendTime = timing.loadEventEnd - timing.responseEnd;
    }
    
    // 添加自定义性能标记
    if (window.performance && window.performance.getEntriesByType) {
        const marks = window.performance.getEntriesByType('mark');
        if (marks.length > 0) {
            metrics.customMarks = marks.map(mark => ({
                name: mark.name,
                startTime: mark.startTime
            }));
        }
    }
    
    return metrics;
}

/**
 * 添加性能标记点
 * @param {string} markName - 标记名称
 */
function markPerformanceTimeline(markName) {
    if (window.performance && window.performance.mark) {
        window.performance.mark(markName);
    }
}

/**
 * 记录用户交互
 * @param {string} interactionType - 交互类型
 */
function markUserInteraction(interactionType) {
    // 记录交互类型和时间
    console.log(`用户交互: ${interactionType}`);
    
    // 添加性能标记
    markPerformanceTimeline(`interaction-${interactionType}`);
    
    // 通知A/B测试模块
    if (abTesting && typeof abTesting.trackInteraction === 'function') {
        abTesting.trackInteraction();
    }
}

// 监听页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // 页面隐藏时保存指标
        if (abTesting && typeof abTesting.saveMetrics === 'function') {
            abTesting.saveMetrics();
        }
    }
});

// 导出模块
export default {
    markUserInteraction,
    collectPerformanceMetrics
};
