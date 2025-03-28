/**
 * NexusOrbital - 用户反馈分析脚本
 * 
 * 该脚本负责加载、分析和可视化用户反馈数据
 */

// 全局变量
let allFeedbacks = [];
let filteredFeedbacks = [];
let currentPage = 1;
const itemsPerPage = 10;
let charts = {};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 初始化函数
async function init() {
    try {
        // 加载反馈数据
        await loadFeedbacks();
        
        // 初始化筛选器
        setupFilters();
        
        // 初始化导出功能
        setupExport();
        
        console.log('反馈分析页面初始化完成');
    } catch (error) {
        console.error('初始化反馈分析页面时出错:', error);
        showError('加载反馈数据失败，请刷新页面重试');
    }
}

// 加载反馈数据
async function loadFeedbacks() {
    try {
        // 在实际项目中，这里应该从服务器API获取数据
        const response = await fetch('../data/feedbacks/feedbacks.json');
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            allFeedbacks = data;
            filteredFeedbacks = [...allFeedbacks];
            
            // 更新统计信息
            updateStats(allFeedbacks);
            
            // 创建图表
            createCharts(allFeedbacks);
            
            // 显示反馈列表
            displayFeedbacks(filteredFeedbacks);
        } else {
            throw new Error('无效的反馈数据格式');
        }
    } catch (error) {
        console.error('加载反馈数据失败:', error);
        
        // 显示错误消息
        document.getElementById('feedback-items').innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-circle"></i>
                <p>加载反馈数据失败: ${error.message}</p>
                <button onclick="loadFeedbacks()">重试</button>
            </div>
        `;
        
        // 重新抛出错误以便调用者处理
        throw error;
    }
}

// 更新统计信息
function updateStats(feedbacks) {
    // 更新总反馈数
    document.getElementById('total-count').textContent = feedbacks.length;
    
    // 计算平均评分
    const ratings = feedbacks.map(f => parseInt(f.rating) || 0).filter(r => r > 0);
    const avgRating = ratings.length > 0 
        ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) 
        : '0.0';
    document.getElementById('avg-rating').textContent = avgRating;
    
    // 计算性能相关反馈数量
    const performanceCount = feedbacks.filter(f => f.type === 'performance').length;
    document.getElementById('performance-count').textContent = performanceCount;
    
    // 计算视觉设计反馈数量
    const visualCount = feedbacks.filter(f => f.type === 'visual').length;
    document.getElementById('visual-count').textContent = visualCount;
}

// 创建图表
function createCharts(feedbacks) {
    createFeedbackTypeChart(feedbacks);
    createRatingChart(feedbacks);
    createFeedbackTrendChart(feedbacks);
    createPageChart(feedbacks);
}

// 创建反馈类型分布图表
function createFeedbackTypeChart(feedbacks) {
    const typeCount = {};
    const typeNames = {
        'general': '一般反馈',
        'performance': '性能相关',
        'visual': '视觉设计',
        'responsive': '响应式设计',
        'projects': '项目相关',
        'resources': '资源相关',
        'bug': '问题报告'
    };
    
    // 统计各类型反馈数量
    feedbacks.forEach(feedback => {
        const type = feedback.type || 'unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    // 准备图表数据
    const labels = Object.keys(typeCount).map(type => typeNames[type] || type);
    const data = Object.values(typeCount);
    const backgroundColors = [
        '#1e88e5', '#28a745', '#ffc107', '#dc3545', 
        '#17a2b8', '#6610f2', '#fd7e14', '#6c757d'
    ];
    
    // 获取图表容器
    const ctx = document.getElementById('feedback-type-chart');
    
    // 如果已存在图表，则销毁
    if (charts.typeChart) {
        charts.typeChart.destroy();
    }
    
    // 创建新图表
    charts.typeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, data.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 创建评分分布图表
function createRatingChart(feedbacks) {
    // 统计各评分数量
    const ratingCount = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    
    feedbacks.forEach(feedback => {
        const rating = parseInt(feedback.rating) || 0;
        if (rating >= 1 && rating <= 5) {
            ratingCount[rating]++;
        }
    });
    
    // 准备图表数据
    const labels = ['1星', '2星', '3星', '4星', '5星'];
    const data = [
        ratingCount[1], ratingCount[2], ratingCount[3], 
        ratingCount[4], ratingCount[5]
    ];
    const backgroundColors = [
        '#dc3545', '#fd7e14', '#ffc107', '#5cb85c', '#28a745'
    ];
    
    // 获取图表容器
    const ctx = document.getElementById('rating-chart');
    
    // 如果已存在图表，则销毁
    if (charts.ratingChart) {
        charts.ratingChart.destroy();
    }
    
    // 创建新图表
    charts.ratingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '评分分布',
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// 创建反馈趋势图表
function createFeedbackTrendChart(feedbacks) {
    // 按日期分组
    const dateGroups = {};
    
    feedbacks.forEach(feedback => {
        let date = '';
        
        if (feedback.timestamp) {
            date = new Date(feedback.timestamp).toISOString().split('T')[0];
        } else if (feedback.server_timestamp) {
            date = feedback.server_timestamp.split(' ')[0];
        } else {
            return; // 跳过没有时间戳的反馈
        }
        
        if (!dateGroups[date]) {
            dateGroups[date] = {
                total: 0,
                ratings: []
            };
        }
        
        dateGroups[date].total++;
        
        const rating = parseInt(feedback.rating) || 0;
        if (rating > 0) {
            dateGroups[date].ratings.push(rating);
        }
    });
    
    // 准备图表数据
    const dates = Object.keys(dateGroups).sort();
    const counts = dates.map(date => dateGroups[date].total);
    const avgRatings = dates.map(date => {
        const ratings = dateGroups[date].ratings;
        return ratings.length > 0 
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
            : null;
    });
    
    // 获取图表容器
    const ctx = document.getElementById('feedback-trend-chart');
    
    // 如果已存在图表，则销毁
    if (charts.trendChart) {
        charts.trendChart.destroy();
    }
    
    // 创建新图表
    charts.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: '反馈数量',
                    data: counts,
                    borderColor: '#1e88e5',
                    backgroundColor: 'rgba(30, 136, 229, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: '平均评分',
                    data: avgRatings,
                    borderColor: '#28a745',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '日期'
                    }
                },
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '反馈数量'
                    },
                    ticks: {
                        precision: 0
                    }
                },
                y1: {
                    beginAtZero: true,
                    max: 5,
                    position: 'right',
                    title: {
                        display: true,
                        text: '平均评分'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// 创建页面反馈分布图表
function createPageChart(feedbacks) {
    // 统计各页面反馈数量
    const pageCount = {};
    const pageNames = {
        'index': '首页',
        'projects': '项目页',
        'resources': '资源页',
        'experts': '专家页',
        'about': '关于我们'
    };
    
    feedbacks.forEach(feedback => {
        const page = feedback.page || 'unknown';
        pageCount[page] = (pageCount[page] || 0) + 1;
    });
    
    // 准备图表数据
    const labels = Object.keys(pageCount).map(page => pageNames[page] || page);
    const data = Object.values(pageCount);
    const backgroundColors = [
        '#1e88e5', '#28a745', '#ffc107', '#dc3545', 
        '#17a2b8', '#6610f2', '#fd7e14', '#6c757d'
    ];
    
    // 获取图表容器
    const ctx = document.getElementById('page-chart');
    
    // 如果已存在图表，则销毁
    if (charts.pageChart) {
        charts.pageChart.destroy();
    }
    
    // 创建新图表
    charts.pageChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, data.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 显示反馈列表
function displayFeedbacks(feedbacks) {
    const feedbackItems = document.getElementById('feedback-items');
    
    // 如果没有反馈数据
    if (feedbacks.length === 0) {
        feedbackItems.innerHTML = `
            <div class="no-data">
                <i class="fas fa-search"></i>
                <p>没有找到符合条件的反馈数据</p>
            </div>
        `;
        
        // 清空分页
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    // 按时间倒序排列
    const sortedFeedbacks = [...feedbacks].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : 
                     (a.server_timestamp ? new Date(a.server_timestamp) : new Date(0));
        const dateB = b.timestamp ? new Date(b.timestamp) : 
                     (b.server_timestamp ? new Date(b.server_timestamp) : new Date(0));
        return dateB - dateA;
    });
    
    // 计算分页
    const totalPages = Math.ceil(sortedFeedbacks.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedFeedbacks.length);
    const currentFeedbacks = sortedFeedbacks.slice(startIndex, endIndex);
    
    // 生成反馈项HTML
    let html = '';
    
    currentFeedbacks.forEach((feedback, index) => {
        // 获取反馈类型名称
        const typeClass = feedback.type || 'general';
        const typeName = getFeedbackTypeName(feedback.type);
        
        // 获取评分星星
        const rating = parseInt(feedback.rating) || 0;
        const ratingStars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        
        // 获取日期
        let date = '';
        if (feedback.timestamp) {
            date = new Date(feedback.timestamp).toLocaleString('zh-CN');
        } else if (feedback.server_timestamp) {
            date = feedback.server_timestamp;
        }
        
        // 生成反馈卡片HTML
        html += `
            <div class="feedback-card" data-index="${startIndex + index}">
                <div class="feedback-header">
                    <span class="feedback-type ${typeClass}">${typeName}</span>
                    <span class="feedback-rating rating-${rating}">${ratingStars}</span>
                </div>
                <div class="feedback-content">${feedback.content || '无内容'}</div>
                <div class="feedback-meta">
                    <span><i class="fas fa-globe"></i> 页面: ${feedback.page || '未知'}</span>
                    <span><i class="fas fa-palette"></i> 主题: ${feedback.theme || '未知'}</span>
                    <span><i class="fas fa-calendar"></i> 时间: ${date || '未知'}</span>
                    ${feedback.email ? `<span><i class="fas fa-envelope"></i> 邮箱: ${feedback.email}</span>` : ''}
                </div>
                <div class="feedback-details" style="display: none;">
                    <h4>详细信息</h4>
                    <pre>${JSON.stringify({
                        userAgent: feedback.userAgent,
                        screenSize: `${feedback.screenWidth || '?'} x ${feedback.screenHeight || '?'}`,
                        performance: feedback.performance || {},
                        ip_hash: feedback.ip_hash || '未知'
                    }, null, 2)}</pre>
                </div>
                <button class="toggle-details" onclick="toggleDetails(${startIndex + index})">
                    <i class="fas fa-chevron-down"></i> 查看详情
                </button>
            </div>
        `;
    });
    
    // 更新反馈列表
    feedbackItems.innerHTML = html;
    
    // 更新分页
    updatePagination(totalPages);
}

// 获取反馈类型名称
function getFeedbackTypeName(type) {
    const types = {
        'general': '一般反馈',
        'performance': '性能相关',
        'visual': '视觉设计',
        'responsive': '响应式设计',
        'projects': '项目相关',
        'resources': '资源相关',
        'bug': '问题报告'
    };
    
    return types[type] || type || '未知类型';
}

// 更新分页
function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // 上一页按钮
    html += `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // 页码按钮
    const maxPageButtons = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // 第一页按钮
    if (startPage > 1) {
        html += `<button onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span>...</span>`;
        }
    }
    
    // 中间页码按钮
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">
                ${i}
            </button>
        `;
    }
    
    // 最后一页按钮
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span>...</span>`;
        }
        html += `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // 下一页按钮
    html += `
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    // 更新分页HTML
    pagination.innerHTML = html;
}

// 切换详情显示
window.toggleDetails = function(index) {
    const card = document.querySelector(`.feedback-card[data-index="${index}"]`);
    if (!card) return;
    
    const details = card.querySelector('.feedback-details');
    const button = card.querySelector('.toggle-details');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        button.innerHTML = '<i class="fas fa-chevron-up"></i> 隐藏详情';
    } else {
        details.style.display = 'none';
        button.innerHTML = '<i class="fas fa-chevron-down"></i> 查看详情';
    }
};

// 切换页码
window.changePage = function(page) {
    if (page < 1 || page > Math.ceil(filteredFeedbacks.length / itemsPerPage)) return;
    
    currentPage = page;
    displayFeedbacks(filteredFeedbacks);
    
    // 滚动到顶部
    document.querySelector('.feedback-list').scrollIntoView({ behavior: 'smooth' });
};

// 设置筛选器
function setupFilters() {
    const typeFilter = document.getElementById('type-filter');
    const ratingFilter = document.getElementById('rating-filter');
    const pageFilter = document.getElementById('page-filter');
    const dateFromFilter = document.getElementById('date-from');
    const dateToFilter = document.getElementById('date-to');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    
    // 应用筛选
    applyFiltersBtn.addEventListener('click', () => {
        let filtered = [...allFeedbacks];
        
        // 类型筛选
        if (typeFilter.value) {
            filtered = filtered.filter(f => f.type === typeFilter.value);
        }
        
        // 评分筛选
        if (ratingFilter.value) {
            filtered = filtered.filter(f => f.rating === ratingFilter.value);
        }
        
        // 页面筛选
        if (pageFilter.value) {
            filtered = filtered.filter(f => f.page === pageFilter.value);
        }
        
        // 日期范围筛选
        if (dateFromFilter.value) {
            const fromDate = new Date(dateFromFilter.value);
            filtered = filtered.filter(f => {
                const feedbackDate = f.timestamp ? new Date(f.timestamp) : 
                                    (f.server_timestamp ? new Date(f.server_timestamp) : null);
                return feedbackDate && feedbackDate >= fromDate;
            });
        }
        
        if (dateToFilter.value) {
            const toDate = new Date(dateToFilter.value);
            toDate.setHours(23, 59, 59, 999); // 设置为当天结束时间
            filtered = filtered.filter(f => {
                const feedbackDate = f.timestamp ? new Date(f.timestamp) : 
                                    (f.server_timestamp ? new Date(f.server_timestamp) : null);
                return feedbackDate && feedbackDate <= toDate;
            });
        }
        
        // 更新筛选结果
        filteredFeedbacks = filtered;
        currentPage = 1;
        
        // 更新统计和图表
        updateStats(filtered);
        createCharts(filtered);
        
        // 显示筛选后的反馈
        displayFeedbacks(filtered);
    });
    
    // 重置筛选
    resetFiltersBtn.addEventListener('click', () => {
        typeFilter.value = '';
        ratingFilter.value = '';
        pageFilter.value = '';
        dateFromFilter.value = '';
        dateToFilter.value = '';
        
        filteredFeedbacks = [...allFeedbacks];
        currentPage = 1;
        
        updateStats(allFeedbacks);
        createCharts(allFeedbacks);
        displayFeedbacks(allFeedbacks);
    });
}

// 设置导出功能
function setupExport() {
    const exportBtn = document.getElementById('export-data');
    
    exportBtn.addEventListener('click', () => {
        // 准备导出数据
        const dataToExport = filteredFeedbacks.map(f => ({
            type: getFeedbackTypeName(f.type),
            content: f.content,
            rating: f.rating,
            page: f.page,
            email: f.email || '',
            theme: f.theme || '',
            timestamp: f.timestamp || f.server_timestamp || '',
            userAgent: f.userAgent || '',
            screenSize: `${f.screenWidth || '?'} x ${f.screenHeight || '?'}`
        }));
        
        // 转换为CSV
        const headers = ['类型', '内容', '评分', '页面', '邮箱', '主题', '时间', '浏览器', '屏幕尺寸'];
        const csvContent = [
            headers.join(','),
            ...dataToExport.map(row => 
                [
                    row.type,
                    `"${(row.content || '').replace(/"/g, '""')}"`,
                    row.rating,
                    row.page,
                    row.email,
                    row.theme,
                    row.timestamp,
                    `"${(row.userAgent || '').replace(/"/g, '""')}"`,
                    row.screenSize
                ].join(',')
            )
        ].join('\n');
        
        // 创建下载链接
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `nexusorbital-feedback-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// 显示错误消息
function showError(message) {
    const feedbackItems = document.getElementById('feedback-items');
    
    feedbackItems.innerHTML = `
        <div class="no-data">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}
