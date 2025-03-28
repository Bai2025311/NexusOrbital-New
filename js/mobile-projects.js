/**
 * NexusOrbital 移动端项目展示功能
 * 版本: 2025.03.23
 * 作者: 星际人居技术设计团队
 */

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化项目展示
    initProjectsSection();
});

/**
 * 初始化项目展示区域
 */
function initProjectsSection() {
    // 模拟项目数据 - 实际项目中应从API获取
    const projectsData = [
        {
            id: 1,
            title: "月球基地穹顶生态系统",
            image: "../images/project-lunar-dome.jpg",
            status: "active",
            location: "月球",
            progress: 75,
            category: "生态系统"
        },
        {
            id: 2,
            title: "火星前哨站模块化居住单元",
            image: "../images/project-mars-habitat.jpg",
            status: "planning",
            location: "火星",
            progress: 30,
            category: "居住空间"
        },
        {
            id: 3,
            title: "低重力环境人体工学家具系统",
            image: "../images/project-furniture.jpg",
            status: "completed",
            location: "太空站",
            progress: 100,
            category: "家居设计"
        },
        {
            id: 4,
            title: "太空农业垂直种植系统",
            image: "../images/project-agriculture.jpg",
            status: "active",
            location: "地球轨道",
            progress: 60,
            category: "食物系统"
        }
    ];
    
    // 获取项目网格容器
    const projectsGrid = document.getElementById('projectsGrid');
    
    // 清空现有内容
    if (projectsGrid) {
        projectsGrid.innerHTML = '';
        
        // 添加项目卡片
        projectsData.forEach(project => {
            const projectCard = createProjectCard(project);
            projectsGrid.appendChild(projectCard);
        });
    }
    
    // 初始化筛选标签
    initFilterTags();
    
    // 添加查看全部点击事件
    const viewAllBtn = document.getElementById('viewAllProjects');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navigateToProjectsPage();
        });
    }
}

/**
 * 创建项目卡片元素
 * @param {Object} project 项目数据对象
 * @returns {HTMLElement} 项目卡片DOM元素
 */
function createProjectCard(project) {
    const card = document.createElement('div');
    card.classList.add('project-card');
    card.setAttribute('data-id', project.id);
    card.setAttribute('data-category', project.category);
    
    // 获取状态类名和文本
    let statusClass = '';
    let statusText = '';
    
    switch (project.status) {
        case 'active':
            statusClass = 'status-active';
            statusText = '进行中';
            break;
        case 'planning':
            statusClass = 'status-planning';
            statusText = '规划中';
            break;
        case 'completed':
            statusClass = 'status-completed';
            statusText = '已完成';
            break;
    }
    
    // 使用占位图片（如果没有实际图片）
    const imageSrc = project.image || `https://via.placeholder.com/150x100?text=${encodeURIComponent(project.title)}`;
    
    const html = `
        <div class="project-image" style="background-image: url('${imageSrc}')">
            <div class="project-status ${statusClass}">${statusText}</div>
        </div>
        <div class="project-content">
            <h3 class="project-title">${project.title}</h3>
            <div class="project-meta">
                <span class="project-location"><i class="fas fa-map-marker-alt"></i> ${project.location}</span>
                <span>${project.progress}%</span>
            </div>
            <div class="project-progress">
                <div class="progress-fill" style="width: ${project.progress}%"></div>
            </div>
        </div>
    `;
    
    card.innerHTML = html;
    
    // 添加点击事件
    card.addEventListener('click', function() {
        openProjectDetail(project.id);
    });
    
    return card;
}

/**
 * 初始化筛选标签
 */
function initFilterTags() {
    const filterContainer = document.getElementById('projectsFilter');
    if (!filterContainer) return;
    
    // 筛选类别
    const categories = [
        { id: 'all', name: '全部' },
        { id: 'ecosystem', name: '生态系统' },
        { id: 'habitat', name: '居住空间' },
        { id: 'furniture', name: '家居设计' },
        { id: 'food', name: '食物系统' }
    ];
    
    // 清空现有内容
    filterContainer.innerHTML = '';
    
    // 添加筛选标签
    categories.forEach((category, index) => {
        const tag = document.createElement('div');
        tag.classList.add('filter-tag');
        if (index === 0) tag.classList.add('active');
        tag.setAttribute('data-category', category.id);
        tag.textContent = category.name;
        
        // 添加点击事件
        tag.addEventListener('click', function() {
            // 更新活跃状态
            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 筛选项目
            filterProjects(category.id);
        });
        
        filterContainer.appendChild(tag);
    });
}

/**
 * 筛选项目
 * @param {string} category 筛选类别
 */
function filterProjects(category) {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category').toLowerCase().includes(category.toLowerCase())) {
            card.style.display = '';
            // 重新触发动画
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = '';
            }, 10);
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * 打开项目详情
 * @param {number} projectId 项目ID
 */
function openProjectDetail(projectId) {
    // 实际项目中应跳转到详情页或打开模态窗口
    console.log(`打开项目ID: ${projectId} 的详情`);
    
    // 简单的反馈效果
    const projectCard = document.querySelector(`.project-card[data-id="${projectId}"]`);
    if (projectCard) {
        projectCard.style.transform = 'scale(0.95)';
        setTimeout(() => {
            projectCard.style.transform = '';
        }, 300);
    }
}

/**
 * 导航到项目页面
 */
function navigateToProjectsPage() {
    // 实际项目中应跳转到项目列表页
    console.log('导航到项目列表页');
    
    // 简单的反馈效果
    const viewAllBtn = document.getElementById('viewAllProjects');
    if (viewAllBtn) {
        const originalText = viewAllBtn.textContent;
        viewAllBtn.textContent = '加载中...';
        viewAllBtn.style.backgroundColor = 'rgba(58, 123, 213, 0.4)';
        
        // 模拟加载延迟
        setTimeout(() => {
            viewAllBtn.textContent = originalText;
            viewAllBtn.style.backgroundColor = '';
            
            // 显示提示消息
            showToast('项目页面开发中');
        }, 1000);
    }
}

/**
 * 显示提示消息
 * @param {string} message 消息内容
 */
function showToast(message) {
    // 检查是否已存在toast元素
    let toast = document.getElementById('projectsToast');
    
    if (!toast) {
        // 创建toast元素
        toast = document.createElement('div');
        toast.id = 'projectsToast';
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
