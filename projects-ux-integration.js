/**
 * 项目页面用户体验优化集成脚本
 * 
 * 该脚本负责将UX优化工具集成到项目页面，并提供用户反馈收集功能
 */

// 导入UX优化器
import uxOptimizer from './js/ux-optimizer.js';

// 初始化UX优化器
function initUxOptimizer() {
    uxOptimizer.init({
        debug: false,
        performance: {
            enabled: true,
            monitoring: true,
            imageOptimization: true,
            resourceOptimization: true
        },
        responsive: {
            enabled: true,
            adaptNavigation: true,
            optimizeTouch: true,
            adaptFontSize: true
        },
        visualConsistency: {
            enabled: true,
            theme: {
                enabled: true,
                defaultTheme: 'light',
                supportDarkMode: true,
                respectUserPreference: true
            }
        }
    });

    // 项目页面特定优化
    if (uxOptimizer.pageSpecificOptimizations) {
        uxOptimizer.pageSpecificOptimizations.projects = {
            lazyLoadProjectImages: true,
            optimizeProjectFilters: true,
            enhanceProjectCardInteractions: true
        };
    }

    console.log('UX优化器已初始化 - 项目页面');
}

// 创建用户反馈按钮和表单
function createFeedbackComponents() {
    // 创建反馈按钮
    const feedbackButton = document.createElement('div');
    feedbackButton.className = 'feedback-button';
    feedbackButton.id = 'feedback-button';
    feedbackButton.innerHTML = '<i class="fas fa-comment"></i>';
    document.body.appendChild(feedbackButton);

    // 创建反馈表单模态框
    const feedbackModal = document.createElement('div');
    feedbackModal.className = 'feedback-modal';
    feedbackModal.id = 'feedback-modal';
    
    feedbackModal.innerHTML = `
        <div class="feedback-form">
            <h3>用户体验反馈</h3>
            <div class="form-group">
                <label for="feedback-type">反馈类型</label>
                <select id="feedback-type">
                    <option value="general">一般反馈</option>
                    <option value="performance">性能相关</option>
                    <option value="visual">视觉设计相关</option>
                    <option value="responsive">响应式设计相关</option>
                    <option value="projects">项目内容相关</option>
                    <option value="bug">问题报告</option>
                </select>
            </div>
            <div class="form-group">
                <label for="feedback-content">您的反馈</label>
                <textarea id="feedback-content" placeholder="请输入您的反馈内容..."></textarea>
            </div>
            <div class="form-group">
                <label for="feedback-email">电子邮箱（可选）</label>
                <input type="email" id="feedback-email" placeholder="您的电子邮箱，用于我们回复您">
            </div>
            <div class="form-group">
                <label for="feedback-rating">体验评分</label>
                <select id="feedback-rating">
                    <option value="5">非常满意</option>
                    <option value="4">满意</option>
                    <option value="3">一般</option>
                    <option value="2">不满意</option>
                    <option value="1">非常不满意</option>
                </select>
            </div>
            <div class="feedback-success" id="feedback-success">
                感谢您的反馈！我们将认真考虑您的建议。
            </div>
            <div class="buttons">
                <button class="cancel-btn" id="feedback-cancel">取消</button>
                <button class="submit-btn" id="feedback-submit">提交反馈</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(feedbackModal);

    // 添加样式
    addFeedbackStyles();
}

// 添加反馈组件样式
function addFeedbackStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* 用户反馈浮动按钮 */
        .feedback-button {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: var(--nexus-color-primary, #1e88e5);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 999;
            transition: all 0.3s ease;
        }
        
        .feedback-button:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        
        /* 反馈表单 */
        .feedback-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        
        .feedback-modal.active {
            display: flex;
        }
        
        .feedback-form {
            background-color: var(--nexus-color-background, white);
            border-radius: 10px;
            padding: 20px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        }
        
        .feedback-form h3 {
            margin-top: 0;
            color: var(--nexus-color-primary, #1e88e5);
        }
        
        .feedback-form .form-group {
            margin-bottom: 15px;
        }
        
        .feedback-form label {
            display: block;
            margin-bottom: 5px;
            color: var(--nexus-color-text-primary, #333);
        }
        
        .feedback-form input,
        .feedback-form textarea,
        .feedback-form select {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--nexus-color-border, #ddd);
            border-radius: 5px;
            background-color: var(--nexus-color-background, white);
            color: var(--nexus-color-text-primary, #333);
        }
        
        .feedback-form textarea {
            height: 100px;
            resize: vertical;
        }
        
        .feedback-form .buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 15px;
        }
        
        .feedback-form button {
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .feedback-form .submit-btn {
            background-color: var(--nexus-color-primary, #1e88e5);
            color: white;
        }
        
        .feedback-form .cancel-btn {
            background-color: var(--nexus-color-secondary, #6c757d);
            color: white;
        }
        
        /* 反馈成功消息 */
        .feedback-success {
            display: none;
            background-color: var(--nexus-color-success, #28a745);
            color: white;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            text-align: center;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// 设置反馈表单事件监听
function setupFeedbackEvents() {
    const feedbackButton = document.getElementById('feedback-button');
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackCancel = document.getElementById('feedback-cancel');
    const feedbackSubmit = document.getElementById('feedback-submit');
    const feedbackSuccess = document.getElementById('feedback-success');
    
    // 打开反馈表单
    feedbackButton.addEventListener('click', () => {
        feedbackModal.classList.add('active');
    });
    
    // 关闭反馈表单
    feedbackCancel.addEventListener('click', () => {
        feedbackModal.classList.remove('active');
        feedbackSuccess.style.display = 'none';
    });
    
    // 提交反馈
    feedbackSubmit.addEventListener('click', () => {
        const feedbackType = document.getElementById('feedback-type').value;
        const feedbackContent = document.getElementById('feedback-content').value;
        const feedbackEmail = document.getElementById('feedback-email').value;
        const feedbackRating = document.getElementById('feedback-rating').value;
        
        if (!feedbackContent.trim()) {
            alert('请输入反馈内容');
            return;
        }
        
        // 收集性能数据（如果可用）
        let performanceData = {};
        if (uxOptimizer.getPerformanceReport) {
            const report = uxOptimizer.getPerformanceReport();
            if (report && report.performance) {
                performanceData = report.performance;
            }
        }
        
        // 收集当前主题
        let currentTheme = 'unknown';
        if (uxOptimizer.getCurrentTheme) {
            currentTheme = uxOptimizer.getCurrentTheme();
        }
        
        // 收集项目特定数据
        const projectSpecificData = {
            visibleProjects: document.querySelectorAll('.project-card').length,
            currentFilters: getCurrentFilters(),
            deviceType: getDeviceType()
        };
        
        // 准备反馈数据
        const feedbackData = {
            type: feedbackType,
            content: feedbackContent,
            email: feedbackEmail,
            rating: feedbackRating,
            theme: currentTheme,
            performance: performanceData,
            projectData: projectSpecificData,
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            page: 'projects',
            timestamp: new Date().toISOString()
        };
        
        // 在实际项目中，这里应该发送到服务器
        console.log('用户反馈数据:', feedbackData);
        
        // 模拟发送成功
        feedbackSuccess.style.display = 'block';
        
        // 清空表单
        document.getElementById('feedback-content').value = '';
        document.getElementById('feedback-email').value = '';
        
        // 5秒后关闭反馈表单
        setTimeout(() => {
            feedbackModal.classList.remove('active');
            feedbackSuccess.style.display = 'none';
        }, 5000);
    });
    
    // 点击模态框外部关闭
    feedbackModal.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            feedbackModal.classList.remove('active');
            feedbackSuccess.style.display = 'none';
        }
    });
}

// 获取当前筛选条件
function getCurrentFilters() {
    // 这里应该根据实际项目页面的筛选器实现来获取当前筛选条件
    // 以下是示例实现
    const filters = {};
    
    // 获取类别筛选
    const categoryFilter = document.querySelector('.category-filter .active');
    if (categoryFilter) {
        filters.category = categoryFilter.textContent.trim();
    }
    
    // 获取排序方式
    const sortOption = document.querySelector('.sort-select');
    if (sortOption) {
        filters.sort = sortOption.value;
    }
    
    return filters;
}

// 获取设备类型
function getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) {
        return 'mobile';
    } else if (width < 1024) {
        return 'tablet';
    } else {
        return 'desktop';
    }
}

// 项目页面特定优化
function optimizeProjectsPage() {
    // 延迟加载项目图片
    lazyLoadProjectImages();
    
    // 优化项目卡片交互
    enhanceProjectCardInteractions();
    
    // 优化筛选器性能
    optimizeProjectFilters();
}

// 延迟加载项目图片
function lazyLoadProjectImages() {
    // 检查是否支持IntersectionObserver
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                    
                    observer.unobserve(img);
                }
            });
        });
        
        // 获取所有项目图片
        const projectImages = document.querySelectorAll('.project-card img[data-src]');
        projectImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // 如果不支持IntersectionObserver，则立即加载所有图片
        const projectImages = document.querySelectorAll('.project-card img[data-src]');
        projectImages.forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
                img.src = src;
                img.removeAttribute('data-src');
            }
        });
    }
}

// 优化项目卡片交互
function enhanceProjectCardInteractions() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        // 添加悬停效果
        card.addEventListener('mouseenter', () => {
            card.classList.add('hover');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hover');
        });
        
        // 添加点击效果
        card.addEventListener('click', (e) => {
            // 如果点击的是卡片内的按钮或链接，不执行卡片点击效果
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || 
                e.target.closest('button') || e.target.closest('a')) {
                return;
            }
            
            // 获取项目ID
            const projectId = card.getAttribute('data-project-id');
            if (projectId) {
                // 这里可以实现项目详情查看逻辑
                console.log('查看项目详情:', projectId);
            }
        });
    });
}

// 优化项目筛选器
function optimizeProjectFilters() {
    const categoryFilters = document.querySelectorAll('.category-filter button');
    const sortSelect = document.querySelector('.sort-select');
    
    // 优化类别筛选器
    if (categoryFilters.length > 0) {
        // 使用事件委托优化多个筛选按钮的事件监听
        const filterContainer = categoryFilters[0].parentElement;
        
        filterContainer.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            
            // 移除所有活动状态
            categoryFilters.forEach(btn => btn.classList.remove('active'));
            
            // 添加当前活动状态
            target.classList.add('active');
            
            // 执行筛选
            const category = target.getAttribute('data-category');
            filterProjects(category);
        });
    }
    
    // 优化排序选择器
    if (sortSelect) {
        // 使用防抖优化排序变化事件
        let sortTimeout;
        sortSelect.addEventListener('change', () => {
            clearTimeout(sortTimeout);
            sortTimeout = setTimeout(() => {
                const sortValue = sortSelect.value;
                sortProjects(sortValue);
            }, 300);
        });
    }
}

// 筛选项目
function filterProjects(category) {
    const projectCards = document.querySelectorAll('.project-card');
    
    if (category === 'all') {
        // 显示所有项目
        projectCards.forEach(card => {
            card.style.display = 'block';
        });
    } else {
        // 筛选特定类别的项目
        projectCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            if (cardCategory === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// 排序项目
function sortProjects(sortValue) {
    const projectsContainer = document.querySelector('.projects-grid');
    const projectCards = Array.from(document.querySelectorAll('.project-card'));
    
    if (!projectsContainer || projectCards.length === 0) return;
    
    // 根据排序值对项目卡片进行排序
    projectCards.sort((a, b) => {
        switch (sortValue) {
            case 'newest':
                const dateA = new Date(a.getAttribute('data-date') || 0);
                const dateB = new Date(b.getAttribute('data-date') || 0);
                return dateB - dateA;
            case 'popular':
                const likesA = parseInt(a.getAttribute('data-likes') || 0);
                const likesB = parseInt(b.getAttribute('data-likes') || 0);
                return likesB - likesA;
            case 'name':
                const nameA = a.querySelector('.project-title').textContent.trim();
                const nameB = b.querySelector('.project-title').textContent.trim();
                return nameA.localeCompare(nameB);
            default:
                return 0;
        }
    });
    
    // 清空容器
    projectsContainer.innerHTML = '';
    
    // 重新添加排序后的卡片
    projectCards.forEach(card => {
        projectsContainer.appendChild(card);
    });
}

// 初始化函数
function init() {
    // 初始化UX优化器
    initUxOptimizer();
    
    // 创建反馈组件
    createFeedbackComponents();
    
    // 设置反馈事件
    setupFeedbackEvents();
    
    // 优化项目页面
    optimizeProjectsPage();
    
    console.log('项目页面UX优化集成完成');
}

// 当DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

export default {
    init,
    optimizeProjectsPage
};
