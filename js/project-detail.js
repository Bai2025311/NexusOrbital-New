/**
 * 项目详情页面脚本
 * 用于加载和显示项目详情、团队成员、评论等信息
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取项目ID
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) {
        showMessage('项目ID不存在', 'error');
        return;
    }
    
    // 加载项目详情
    loadProjectDetail(projectId);
    
    // 加载项目评论
    loadComments(projectId);
    
    // 加载项目资源
    loadProjectResources(projectId);
    
    // 加载项目活动
    loadProjectActivities(projectId);
    
    // 检查资源上传权限
    checkResourceUploadPermission();
    
    // 初始化分享功能
    initShareFeature();
    
    // 初始化资源上传功能
    initResourceUpload();
    
    // 关注按钮点击事件
    const followBtn = document.getElementById('followBtn');
    if (followBtn) {
        followBtn.addEventListener('click', toggleFollowProject);
    }
    
    // 加入按钮点击事件
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', applyToJoinProject);
    }
    
    // 评论提交事件
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const commentContent = document.getElementById('commentContent').value.trim();
            if (commentContent) {
                submitComment(commentContent);
                document.getElementById('commentContent').value = '';
            }
        });
    }
});

/**
 * 加载项目资源
 * @param {string|Array} projectIdOrResources 项目ID或资源数组
 */
function loadProjectResources(projectIdOrResources) {
    const resourcesList = document.getElementById('resourcesList');
    
    if (!resourcesList) return;
    
    let resources;
    
    if (Array.isArray(projectIdOrResources)) {
        resources = projectIdOrResources;
    } else {
        // 获取项目数据
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        const project = projects.find(p => p.id == projectIdOrResources);
        
        if (!project || !project.resources) {
            resourcesList.innerHTML = '<p class="empty-message">暂无项目资源</p>';
            return;
        }
        
        resources = project.resources;
    }
    
    if (resources.length === 0) {
        resourcesList.innerHTML = '<p class="empty-message">暂无项目资源</p>';
        return;
    }
    
    resourcesList.innerHTML = '';
    
    // 按时间排序（最新的在前）
    const sortedResources = [...resources].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedResources.forEach(resource => {
        const resourceElement = createResourceElement(resource);
        resourcesList.appendChild(resourceElement);
    });
}

/**
 * 创建资源元素
 * @param {Object} resource 资源数据
 * @returns {HTMLElement} 资源元素
 */
function createResourceElement(resource) {
    const resourceElement = document.createElement('div');
    resourceElement.className = 'resource-item';
    resourceElement.dataset.id = resource.id;
    
    // 根据资源类型设置图标
    let iconClass = 'fa-file';
    switch (resource.type) {
        case 'document':
            iconClass = 'fa-file-pdf';
            break;
        case 'image':
            iconClass = 'fa-file-image';
            break;
        case 'video':
            iconClass = 'fa-file-video';
            break;
        case 'model':
            iconClass = 'fa-cube';
            break;
        case 'link':
            iconClass = 'fa-link';
            break;
    }
    
    // 构建资源元素HTML
    resourceElement.innerHTML = `
        <div class="resource-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="resource-info">
            <h4 class="resource-title">${resource.title}</h4>
            <p class="resource-description">${resource.description || '无描述'}</p>
            <div class="resource-meta">
                <span class="resource-uploader"><i class="fas fa-user"></i> ${resource.username}</span>
                <span class="resource-date"><i class="fas fa-calendar"></i> ${formatDate(resource.timestamp)}</span>
                <span class="resource-downloads"><i class="fas fa-download"></i> ${resource.downloads || 0}次下载</span>
            </div>
        </div>
        <div class="resource-actions">
            <button class="btn btn-outline download-btn" data-id="${resource.id}">
                <i class="fas fa-download"></i> 下载
            </button>
        </div>
    `;
    
    // 添加下载按钮点击事件
    const downloadBtn = resourceElement.querySelector('.download-btn');
    downloadBtn.addEventListener('click', function() {
        downloadResource(resource);
    });
    
    return resourceElement;
}

/**
 * 下载资源
 * @param {Object} resource 资源数据
 */
function downloadResource(resource) {
    // 获取项目ID
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) return;
    
    // 获取项目数据
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p.id == projectId);
    
    if (projectIndex === -1) return;
    
    // 查找资源
    const resourceIndex = projects[projectIndex].resources.findIndex(r => r.id === resource.id);
    
    if (resourceIndex === -1) return;
    
    // 增加下载次数
    projects[projectIndex].resources[resourceIndex].downloads = (projects[projectIndex].resources[resourceIndex].downloads || 0) + 1;
    
    // 保存项目数据
    localStorage.setItem('projects', JSON.stringify(projects));
    
    // 更新UI
    const resourceElement = document.querySelector(`.resource-item[data-id="${resource.id}"]`);
    if (resourceElement) {
        const downloadsElement = resourceElement.querySelector('.resource-downloads');
        if (downloadsElement) {
            downloadsElement.innerHTML = `<i class="fas fa-download"></i> ${projects[projectIndex].resources[resourceIndex].downloads}次下载`;
        }
    }
    
    // 如果是链接类型，打开链接
    if (resource.type === 'link' && resource.url) {
        window.open(resource.url, '_blank');
    } else {
        // 模拟文件下载
        showMessage('资源下载已开始', 'success');
    }
}

/**
 * 加载项目活动
 * @param {string|Array} projectIdOrActivities 项目ID或活动数组
 */
function loadProjectActivities(projectIdOrActivities) {
    const activityTimeline = document.getElementById('activityTimeline');
    
    if (!activityTimeline) return;
    
    let activities;
    
    if (Array.isArray(projectIdOrActivities)) {
        activities = projectIdOrActivities;
    } else {
        // 获取项目数据
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        const project = projects.find(p => p.id == projectIdOrActivities);
        
        if (!project || !project.activities) {
            activityTimeline.innerHTML = '<p class="empty-message">暂无项目活动</p>';
            return;
        }
        
        activities = project.activities;
    }
    
    if (activities.length === 0) {
        activityTimeline.innerHTML = '<p class="empty-message">暂无项目活动</p>';
        return;
    }
    
    activityTimeline.innerHTML = '';
    
    // 按时间排序（最新的在前）
    const sortedActivities = [...activities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 最多显示10条活动
    const recentActivities = sortedActivities.slice(0, 10);
    
    recentActivities.forEach(activity => {
        const activityElement = createActivityElement(activity);
        activityTimeline.appendChild(activityElement);
    });
}

/**
 * 初始化项目详情页面
 */
function initProjectDetail() {
    // 从URL获取项目ID
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) {
        showError('未找到项目ID，请返回项目列表页面');
        return;
    }
    
    // 加载项目数据
    loadProjectDetail(projectId);
    
    // 更新浏览次数
    updateProjectViews(projectId);
    
    // 初始化项目导航
    initProjectNav();
}

/**
 * 加载项目详情
 * @param {string} projectId 项目ID
 */
function loadProjectDetail(projectId) {
    // 从本地存储获取项目数据
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id == projectId);
    
    if (!project) {
        showError('未找到项目信息，请返回项目列表页面');
        return;
    }
    
    // 更新页面标题
    document.title = `${project.title} - NexusOrbital`;
    
    // 更新面包屑导航
    document.getElementById('projectCategory').textContent = project.category;
    document.getElementById('projectCategory').href = `projects.html?category=${encodeURIComponent(project.category)}`;
    document.getElementById('projectTitle').textContent = project.title;
    
    // 更新项目标题
    document.getElementById('projectTitleHeader').textContent = project.title;
    
    // 更新项目标签
    updateProjectTags(project.tags || []);
    
    // 更新项目描述
    document.getElementById('projectDescription').textContent = project.description || project.summary;
    
    // 更新项目元数据
    document.getElementById('projectDate').textContent = formatDate(project.createdAt);
    document.getElementById('projectMembers').textContent = (project.members || []).length;
    document.getElementById('projectViews').textContent = formatNumber(project.views || 0);
    document.getElementById('projectProgress').textContent = `${project.progress || 0}%`;
    
    // 更新进度条
    document.querySelector('.progress-fill').style.width = `${project.progress || 0}%`;
    
    // 更新关注按钮状态
    updateFollowButton(project);
    
    // 更新加入按钮状态
    updateJoinButton(project);
    
    // 加载团队成员
    loadTeamMembers(project.members || []);
    
    // 加载相关项目
    loadRelatedProjects(project);
    
    // 加载评论
    loadComments(project.comments || []);
    
    // 加载项目资源
    loadProjectResources(project.resources || []);
    
    // 加载项目活动
    loadProjectActivities(project.activities || []);
}

/**
 * 加载项目资源
 * @param {Array} resources 资源数组
 */
function loadProjectResources(resources) {
    const resourcesList = document.getElementById('resourcesList');
    
    if (!resources || resources.length === 0) {
        resourcesList.innerHTML = '<p class="empty-message">暂无项目资源</p>';
        return;
    }
    
    resourcesList.innerHTML = '';
    
    // 按时间排序（最新的在前）
    const sortedResources = [...resources].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedResources.forEach(resource => {
        const resourceElement = createResourceElement(resource);
        resourcesList.appendChild(resourceElement);
    });
    
    // 检查用户是否为项目成员，控制上传按钮显示
    checkResourceUploadPermission();
}

/**
 * 创建资源元素
 * @param {Object} resource 资源数据
 * @returns {HTMLElement} 资源元素
 */
function createResourceElement(resource) {
    const resourceElement = document.createElement('div');
    resourceElement.className = 'resource-item';
    resourceElement.dataset.id = resource.id;
    
    // 获取资源图标
    const iconClass = getResourceIconClass(resource.type);
    
    resourceElement.innerHTML = `
        <div class="resource-icon ${resource.type}">
            <i class="${iconClass}"></i>
        </div>
        <div class="resource-info">
            <h4>${resource.title}</h4>
            <p>${resource.description || ''}</p>
            <div class="resource-meta">
                <span><i class="fas fa-user"></i> ${resource.username}</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(resource.timestamp)}</span>
                <span><i class="fas fa-download"></i> ${formatNumber(resource.downloads || 0)}</span>
            </div>
        </div>
        <div class="resource-actions">
            ${resource.type === 'link' ? 
                `<a href="${resource.url}" target="_blank" class="btn btn-primary btn-sm">访问链接</a>` : 
                `<button class="btn btn-primary btn-sm download-btn" data-resource-id="${resource.id}">下载</button>`
            }
        </div>
    `;
    
    // 添加下载按钮事件
    const downloadBtn = resourceElement.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            downloadResource(resource.id);
        });
    }
    
    return resourceElement;
}

/**
 * 获取资源类型对应的图标类名
 * @param {string} type 资源类型
 * @returns {string} 图标类名
 */
function getResourceIconClass(type) {
    switch (type) {
        case 'document':
            return 'fas fa-file-alt';
        case 'image':
            return 'fas fa-image';
        case 'video':
            return 'fas fa-video';
        case 'model':
            return 'fas fa-cube';
        case 'link':
            return 'fas fa-link';
        case 'other':
        default:
            return 'fas fa-file';
    }
}

/**
 * 下载资源
 * @param {string} resourceId 资源ID
 */
function downloadResource(resourceId) {
    // 获取项目ID
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) return;
    
    // 获取项目数据
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p.id == projectId);
    
    if (projectIndex === -1) return;
    
    // 查找资源
    const resource = (projects[projectIndex].resources || []).find(r => r.id === resourceId);
    
    if (!resource) return;
    
    // 增加下载次数
    if (!resource.downloads) {
        resource.downloads = 0;
    }
    
    resource.downloads++;
    
    // 保存项目数据
    localStorage.setItem('projects', JSON.stringify(projects));
    
    // 更新资源列表
    loadProjectResources(projects[projectIndex].resources || []);
    
    // 在实际应用中，这里应该触发文件下载
    // 简化版本，仅显示提示
    showMessage(`正在下载：${resource.title}`, 'success');
}

/**
 * 检查资源上传权限
 */
function checkResourceUploadPermission() {
    const uploadBtn = document.getElementById('uploadResourceBtn');
    
    // 获取项目ID
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) return;
    
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) {
        // 用户未登录，隐藏上传按钮
        uploadBtn.style.display = 'none';
        return;
    }
    
    // 获取项目数据
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id == projectId);
    
    if (!project) return;
    
    // 检查用户是否为项目成员
    const isMember = project.members && project.members.some(member => member.id === currentUser.id);
    
    if (!isMember) {
        // 用户不是项目成员，隐藏上传按钮
        uploadBtn.style.display = 'none';
    } else {
        // 用户是项目成员，显示上传按钮
        uploadBtn.style.display = 'block';
    }
}

/**
 * 加载项目活动
 * @param {Array} activities 活动数组
 */
function loadProjectActivities(activities) {
    const activityTimeline = document.getElementById('activityTimeline');
    
    if (!activities || activities.length === 0) {
        activityTimeline.innerHTML = '<p class="empty-message">暂无项目活动</p>';
        return;
    }
    
    activityTimeline.innerHTML = '';
    
    // 按时间排序（最新的在前）
    const sortedActivities = [...activities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 最多显示10条活动
    const recentActivities = sortedActivities.slice(0, 10);
    
    recentActivities.forEach(activity => {
        const activityElement = createActivityElement(activity);
        activityTimeline.appendChild(activityElement);
    });
}

/**
 * 创建活动元素
 * @param {Object} activity 活动数据
 * @returns {HTMLElement} 活动元素
 */
function createActivityElement(activity) {
    const activityElement = document.createElement('div');
    activityElement.className = `activity-item ${activity.type}`;
    
    let activityContent = '';
    
    switch (activity.type) {
        case 'comment':
            activityContent = `发表了评论：${activity.content}`;
            break;
        case 'reply':
            activityContent = `回复了评论：${activity.content}`;
            break;
        case 'follow':
            activityContent = '关注了该项目';
            break;
        case 'apply':
            activityContent = '申请加入项目团队';
            break;
        case 'join':
            activityContent = '加入了项目团队';
            break;
        case 'resource':
            activityContent = `上传了资源：${activity.resourceTitle}`;
            break;
        default:
            activityContent = '进行了操作';
    }
    
    activityElement.innerHTML = `
        <div class="activity-header">
            <h4>${activity.username}</h4>
            <span class="activity-date">${formatDate(activity.timestamp)}</span>
        </div>
        <div class="activity-content">
            ${activityContent}
        </div>
    `;
    
    return activityElement;
}

/**
 * 初始化分享功能
 */
function initShareFeature() {
    const shareBtn = document.getElementById('shareBtn');
    const shareModal = document.getElementById('shareModal');
    const closeShareBtn = document.getElementById('closeShareBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const shareLinkInput = document.getElementById('shareLink');
    
    // 设置分享链接
    shareLinkInput.value = window.location.href;
    
    // 分享按钮点击事件
    shareBtn.addEventListener('click', function() {
        shareProject();
    });
    
    // 关闭按钮点击事件
    closeShareBtn.addEventListener('click', function() {
        shareModal.classList.remove('show');
    });
    
    // 复制链接按钮点击事件
    copyLinkBtn.addEventListener('click', function() {
        shareLinkInput.select();
        document.execCommand('copy');
        showMessage('链接已复制到剪贴板', 'success');
    });
    
    // 社交媒体分享按钮点击事件
    document.getElementById('shareWeixin').addEventListener('click', function(e) {
        e.preventDefault();
        showMessage('请使用微信扫一扫分享', 'info');
    });
    
    document.getElementById('shareWeibo').addEventListener('click', function(e) {
        e.preventDefault();
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        window.open(`http://service.weibo.com/share/share.php?url=${url}&title=${title}`, '_blank');
    });
    
    document.getElementById('shareQQ').addEventListener('click', function(e) {
        e.preventDefault();
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        window.open(`http://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`, '_blank');
    });
    
    document.getElementById('shareLinkedin').addEventListener('click', function(e) {
        e.preventDefault();
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`, '_blank');
    });
}

/**
 * 分享项目
 */
function shareProject() {
    const shareModal = document.getElementById('shareModal');
    shareModal.classList.add('show');
}

/**
 * 初始化资源上传功能
 */
function initResourceUpload() {
    const uploadBtn = document.getElementById('uploadResourceBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeUploadBtn = document.getElementById('closeUploadBtn');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    const resourceUploadForm = document.getElementById('resourceUploadForm');
    const resourceTypeSelect = document.getElementById('resourceType');
    const fileUploadGroup = document.getElementById('fileUploadGroup');
    const linkGroup = document.getElementById('linkGroup');
    
    // 上传按钮点击事件
    uploadBtn.addEventListener('click', function() {
        uploadModal.classList.add('show');
    });
    
    // 关闭按钮点击事件
    closeUploadBtn.addEventListener('click', function() {
        uploadModal.classList.remove('show');
    });
    
    // 取消按钮点击事件
    cancelUploadBtn.addEventListener('click', function() {
        uploadModal.classList.remove('show');
    });
    
    // 资源类型选择事件
    resourceTypeSelect.addEventListener('change', function() {
        if (this.value === 'link') {
            fileUploadGroup.style.display = 'none';
            linkGroup.style.display = 'block';
        } else {
            fileUploadGroup.style.display = 'block';
            linkGroup.style.display = 'none';
        }
    });
    
    // 表单提交事件
    resourceUploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const title = document.getElementById('resourceTitle').value.trim();
        const type = resourceTypeSelect.value;
        const description = document.getElementById('resourceDescription').value.trim();
        
        if (!title || !type) {
            showMessage('请填写必填字段', 'error');
            return;
        }
        
        // 如果是链接类型，检查链接
        if (type === 'link') {
            const link = document.getElementById('resourceLink').value.trim();
            if (!link) {
                showMessage('请输入有效的链接', 'error');
                return;
            }
            
            // 上传链接资源
            uploadLinkResource(title, description, link);
        } else {
            // 如果是文件类型，检查文件
            const fileInput = document.getElementById('resourceFile');
            if (!fileInput.files || fileInput.files.length === 0) {
                showMessage('请选择要上传的文件', 'error');
                return;
            }
            
            // 上传文件资源
            uploadFileResource(title, type, description, fileInput.files[0]);
        }
        
        // 关闭弹窗
        uploadModal.classList.remove('show');
        
        // 重置表单
        resourceUploadForm.reset();
        fileUploadGroup.style.display = 'block';
        linkGroup.style.display = 'none';
    });
}

/**
 * 上传链接资源
 * @param {string} title 资源标题
 * @param {string} description 资源描述
 * @param {string} url 资源链接
 */
function uploadLinkResource(title, description, url) {
    // 获取项目ID
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) return;
    
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) return;
    
    // 获取项目数据
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p.id == projectId);
    
    if (projectIndex === -1) return;
    
    // 初始化资源数组
    if (!projects[projectIndex].resources) {
        projects[projectIndex].resources = [];
    }
    
    // 创建新资源
    const newResource = {
        id: Date.now().toString(),
        title: title,
        type: 'link',
        description: description,
        url: url,
        userId: currentUser.id,
        username: currentUser.username,
        timestamp: new Date().toISOString(),
        downloads: 0
    };
    
    // 添加资源
    projects[projectIndex].resources.push(newResource);
    
    // 添加项目活动
    addProjectActivity(projectId, {
        type: 'resource',
        userId: currentUser.id,
        username: currentUser.username,
        timestamp: new Date().toISOString(),
        resourceTitle: title
    });
    
    // 保存项目数据
    localStorage.setItem('projects', JSON.stringify(projects));
    
    // 重新加载资源
    loadProjectResources(projects[projectIndex].resources);
    
    // 重新加载活动
    loadProjectActivities(projects[projectIndex].activities || []);
    
    // 显示成功消息
    showMessage('资源上传成功', 'success');
}

/**
 * 上传文件资源
 * @param {string} title 资源标题
 * @param {string} type 资源类型
 * @param {string} description 资源描述
 * @param {File} file 文件对象
 */
function uploadFileResource(title, type, description, file) {
    // 获取项目ID
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) return;
    
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) return;
    
    // 获取项目数据
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p.id == projectId);
    
    if (projectIndex === -1) return;
    
    // 初始化资源数组
    if (!projects[projectIndex].resources) {
        projects[projectIndex].resources = [];
    }
    
    // 创建新资源
    const newResource = {
        id: Date.now().toString(),
        title: title,
        type: type,
        description: description,
        fileName: file.name,
        fileSize: file.size,
        userId: currentUser.id,
        username: currentUser.username,
        timestamp: new Date().toISOString(),
        downloads: 0
    };
    
    // 添加资源
    projects[projectIndex].resources.push(newResource);
    
    // 添加项目活动
    addProjectActivity(projectId, {
        type: 'resource',
        userId: currentUser.id,
        username: currentUser.username,
        timestamp: new Date().toISOString(),
        resourceTitle: title
    });
    
    // 保存项目数据
    localStorage.setItem('projects', JSON.stringify(projects));
    
    // 重新加载资源
    loadProjectResources(projects[projectIndex].resources);
    
    // 重新加载活动
    loadProjectActivities(projects[projectIndex].activities || []);
    
    // 显示成功消息
    showMessage('资源上传成功', 'success');
}

/**
 * 添加项目活动
 * @param {string} projectId 项目ID
 * @param {Object} activity 活动数据
 */
function addProjectActivity(projectId, activity) {
    // 获取项目数据
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const projectIndex = projects.findIndex(p => p.id == projectId);
    
    if (projectIndex === -1) return;
    
    // 初始化activities数组（如果不存在）
    if (!projects[projectIndex].activities) {
        projects[projectIndex].activities = [];
    }
    
    // 添加活动
    projects[projectIndex].activities.unshift(activity);
    
    // 限制活动数量
    if (projects[projectIndex].activities.length > 50) {
        projects[projectIndex].activities = projects[projectIndex].activities.slice(0, 50);
    }
    
    // 保存项目数据
    localStorage.setItem('projects', JSON.stringify(projects));
}

// 事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 关注按钮点击事件
    const followBtn = document.getElementById('followBtn');
    if (followBtn) {
        followBtn.addEventListener('click', toggleFollowProject);
    }
    
    // 加入按钮点击事件
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', applyToJoinProject);
    }
});
