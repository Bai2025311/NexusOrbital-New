/**
 * NexusOrbital 移动端新闻动态功能
 * 版本: 2025.03.23
 * 作者: 星际人居技术设计团队
 */

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化新闻动态
    initNewsSection();
});

/**
 * 初始化新闻动态区域
 */
function initNewsSection() {
    // 模拟新闻数据 - 实际项目中应从API获取
    const newsData = [
        {
            id: 1,
            title: "NexusOrbital获选「星际人居创新计划」首批合作伙伴",
            date: "2025-03-20",
            category: "合作动态",
            excerpt: "作为首批入选的技术平台，NexusOrbital将为全球首个商业太空站提供人居系统设计方案..."
        },
        {
            id: 2,
            title: "穹顶生态系统V2.0测试成功，氧气循环效率提升35%",
            date: "2025-03-15",
            category: "技术突破",
            excerpt: "最新版穹顶生态系统在模拟月球环境中完成为期90天的闭环测试，各项指标均超预期..."
        },
        {
            id: 3,
            title: "第三届星际人居设计大赛正式启动，面向全球征集方案",
            date: "2025-03-10",
            category: "社区活动",
            excerpt: "本届大赛主题为「低重力环境下的模块化居住空间」，获奖方案将有机会实际应用于..."
        },
        {
            id: 4,
            title: "NexusOrbital与清华大学建筑学院达成战略合作",
            date: "2025-03-05",
            category: "教育合作",
            excerpt: "双方将共同开设「星际人居设计」课程，并建立联合实验室，培养跨学科太空设计人才..."
        }
    ];
    
    // 获取新闻列表容器
    const newsList = document.getElementById('newsList');
    
    // 清空现有内容
    if (newsList) {
        newsList.innerHTML = '';
        
        // 添加新闻项
        newsData.forEach(news => {
            const newsItem = createNewsItem(news);
            newsList.appendChild(newsItem);
        });
    }
    
    // 添加查看更多点击事件
    const viewMoreBtn = document.getElementById('viewMoreNews');
    if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadMoreNews();
        });
    }
}

/**
 * 创建新闻项元素
 * @param {Object} news 新闻数据对象
 * @returns {HTMLElement} 新闻项DOM元素
 */
function createNewsItem(news) {
    const item = document.createElement('li');
    item.classList.add('news-item');
    item.setAttribute('data-id', news.id);
    
    const html = `
        <h3 class="news-title">${news.title}</h3>
        <div class="news-meta">
            <span class="news-date"><i class="fas fa-calendar-alt"></i> ${news.date}</span>
            <span class="news-category">${news.category}</span>
        </div>
        <p class="news-excerpt">${news.excerpt}</p>
    `;
    
    item.innerHTML = html;
    
    // 添加点击事件
    item.addEventListener('click', function() {
        openNewsDetail(news.id);
    });
    
    return item;
}

/**
 * 打开新闻详情
 * @param {number} newsId 新闻ID
 */
function openNewsDetail(newsId) {
    // 实际项目中应跳转到详情页或打开模态窗口
    console.log(`打开新闻ID: ${newsId} 的详情`);
    
    // 简单的反馈效果
    const newsItem = document.querySelector(`.news-item[data-id="${newsId}"]`);
    if (newsItem) {
        newsItem.style.backgroundColor = 'rgba(58, 123, 213, 0.1)';
        setTimeout(() => {
            newsItem.style.backgroundColor = '';
        }, 300);
    }
}

/**
 * 加载更多新闻
 */
function loadMoreNews() {
    // 实际项目中应从API获取更多新闻
    console.log('加载更多新闻');
    
    // 简单的反馈效果
    const viewMoreBtn = document.getElementById('viewMoreNews');
    if (viewMoreBtn) {
        const originalText = viewMoreBtn.textContent;
        viewMoreBtn.textContent = '加载中...';
        viewMoreBtn.style.backgroundColor = 'rgba(58, 123, 213, 0.4)';
        
        // 模拟加载延迟
        setTimeout(() => {
            viewMoreBtn.textContent = originalText;
            viewMoreBtn.style.backgroundColor = '';
            
            // 显示提示消息
            showToast('暂无更多新闻');
        }, 1000);
    }
}

/**
 * 显示提示消息
 * @param {string} message 消息内容
 */
function showToast(message) {
    // 检查是否已存在toast元素
    let toast = document.getElementById('newsToast');
    
    if (!toast) {
        // 创建toast元素
        toast = document.createElement('div');
        toast.id = 'newsToast';
        toast.style.position = 'fixed';
        toast.style.bottom = '80px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        toast.style.color = '#fff';
        toast.style.padding = '8px 16px';
        toast.style.borderRadius = '20px';
        toast.style.fontSize = '0.9rem';
        toast.style.zIndex = '1000';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        
        document.body.appendChild(toast);
    }
    
    // 设置消息内容
    toast.textContent = message;
    
    // 显示toast
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        
        // 完全隐藏后移除元素
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}
