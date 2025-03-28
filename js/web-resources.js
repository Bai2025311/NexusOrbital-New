/**
 * 导入API服务
 */
import apiService from './api-service.js';

/**
 * 获取默认资源数据
 */
function getDefaultResources() {
    return [
        {
            id: '1',
            title: '月球基地结构设计指南',
            description: '本指南详细介绍了月球基地的结构设计原则，包括辐射防护、温度控制和微重力环境适应的全面技术方案。内容涵盖了材料选择、结构稳定性分析、密封系统设计和能源分配等关键方面，为工程师提供了实用的设计参考。',
            type: '研究报告',
            category: '结构工程',
            tags: ['月球基地', '辐射防护', '结构设计', '微重力环境'],
            access: '会员专享',
            creatorId: 'admin',
            creatorName: 'NexusOrbital团队',
            createdAt: '2025-01-15T08:00:00.000Z',
            downloads: 156,
            views: 423,
            rating: 4.8,
            previewUrl: 'img/resources/moon-base-preview.jpg',
            downloadUrl: null
        },
        {
            id: '2',
            title: '太空舱室内部布局3D模型',
            description: '这是一套针对长期太空任务优化的模块化舱室内部布局3D模型。模型基于实际太空站数据设计，充分考虑了空间利用率、人体工程学和心理舒适度。包含可定制的生活区、工作区和休闲区模块，支持多种配置方案。',
            type: '3D模型',
            category: '空间设计',
            tags: ['3D模型', '舱室设计', '模块化', '人体工程学'],
            access: '部分开放',
            creatorId: 'designer1',
            creatorName: '张航',
            createdAt: '2025-02-10T10:30:00.000Z',
            downloads: 89,
            views: 267,
            rating: 4.5,
            previewUrl: 'img/resources/space-cabin-preview.jpg',
            downloadUrl: null
        },
        {
            id: '3',
            title: '太空农业系统研究报告',
            description: '本报告深入分析了封闭循环生态系统中的植物种植与养殖技术。研究涵盖了水培、气培和基质培养等多种无土栽培技术，以及LED光照系统、营养循环系统和微生物群落管理等关键技术点。报告还包含了多个成功案例分析和未来发展趋势预测。',
            type: '研究报告',
            category: '生命支持',
            tags: ['太空农业', '封闭生态系统', '无土栽培', '营养循环'],
            access: '免费',
            creatorId: 'researcher1',
            creatorName: '李明',
            createdAt: '2025-02-25T14:15:00.000Z',
            downloads: 215,
            views: 542,
            rating: 4.7,
            previewUrl: 'img/resources/space-agriculture-preview.jpg',
            downloadUrl: null
        },
        {
            id: '4',
            title: '太阳能电池板在极端温度下的性能测试数据',
            description: '这是一套关于不同类型太阳能电池板在模拟太空极端温度环境下的性能测试数据集。数据涵盖了-150°C至+150°C温度范围内的发电效率、耐久性和降解率等关键指标。包含原始测试数据和分析报告，可用于太空能源系统的设计和优化。',
            type: '数据集',
            category: '能源系统',
            tags: ['太阳能', '极端温度', '性能测试', '数据分析'],
            access: '部分开放',
            creatorId: 'engineer1',
            creatorName: '王强',
            createdAt: '2025-03-05T09:45:00.000Z',
            downloads: 78,
            views: 196,
            rating: 4.6,
            previewUrl: 'img/resources/solar-panel-preview.jpg',
            downloadUrl: null
        },
        {
            id: '5',
            title: '太空辐射防护材料比较分析',
            description: '本文档详细比较了各种太空辐射防护材料的性能、重量、成本和适用场景。分析了传统金属屏蔽、复合材料、水基屏蔽和新型纳米材料等多种选择，并提供了针对不同任务类型的最优材料组合推荐。包含详细的数据表格和案例分析。',
            type: '技术文档',
            category: '辐射防护',
            tags: ['辐射防护', '材料科学', '屏蔽技术', '纳米材料'],
            access: '会员专享',
            creatorId: 'scientist1',
            creatorName: '陈博士',
            createdAt: '2025-03-12T16:20:00.000Z',
            downloads: 112,
            views: 289,
            rating: 4.9,
            previewUrl: 'img/resources/radiation-shield-preview.jpg',
            downloadUrl: null
        },
        {
            id: '6',
            title: '3D打印月球基地建造教程',
            description: '这是一套关于如何使用月球表面材料进行3D打印建造的实用教程。教程涵盖了原材料处理、打印设备配置、结构优化和后期处理等全流程技术细节。包含详细的步骤说明、常见问题解决方案和实际案例分析，适合工程师和建筑师学习参考。',
            type: '教程',
            category: '材料科学',
            tags: ['3D打印', '月球基地', '原位资源利用', '建造技术'],
            access: '免费',
            creatorId: 'instructor1',
            creatorName: '赵教授',
            createdAt: '2025-03-18T11:30:00.000Z',
            downloads: 187,
            views: 456,
            rating: 4.7,
            previewUrl: 'img/resources/3d-printing-preview.jpg',
            downloadUrl: null
        },
        {
            id: '7',
            title: '月球土壤利用技术研究报告',
            type: '研究报告',
            category: '材料科学',
            access: '免费预览',
            description: `
                <p>本报告详细分析了月球土壤（月壤）的物理化学特性，以及在太空基地建设中的应用潜力：</p>
                <ul>
                    <li>月壤成分与结构分析</li>
                    <li>月壤作为建筑材料的可行性研究</li>
                    <li>3D打印月壤建筑的技术路线</li>
                    <li>月壤提取氧气和水的方法</li>
                    <li>月壤辐射屏蔽效能评估</li>
                </ul>
                <p>包含最新的实验数据和案例分析，适合从事太空建筑和材料研究的专业人员参考。</p>
            `,
            url: 'https://example.com/lunar-soil-research',
            previewUrl: 'img/resources/lunar-soil-report.jpg',
            tags: ['月壤', '材料研究', '资源利用', '3D打印'],
            createdAt: '2025-01-10T10:15:00Z',
            creatorId: 'researcher1',
            creatorName: '月球资源研究小组',
            downloads: 256,
            views: 892,
            rating: 4.7,
            comments: []
        },
        {
            id: '8',
            title: '太空辐射防护系统设计工具',
            type: '软件工具',
            category: '安全防护',
            access: '会员专享',
            description: `
                <p>这是一款专为太空环境设计的辐射防护系统计算与模拟工具，功能包括：</p>
                <ul>
                    <li>不同轨道和深空环境的辐射剂量计算</li>
                    <li>各类材料的辐射屏蔽效能数据库</li>
                    <li>多层防护结构优化设计</li>
                    <li>长期暴露下的人体健康风险评估</li>
                    <li>应急辐射事件响应模拟</li>
                </ul>
                <p>软件包含图形化界面，易于使用，并提供详细的使用手册和案例教程。</p>
            `,
            url: 'https://example.com/radiation-protection-tool',
            previewUrl: 'img/resources/radiation-tool.jpg',
            tags: ['辐射防护', '软件工具', '安全设计', '健康防护'],
            createdAt: '2024-10-05T16:40:00Z',
            creatorId: 'engineer1',
            creatorName: '太空安全工程实验室',
            downloads: 124,
            views: 415,
            rating: 4.6,
            comments: []
        },
        {
            id: '9',
            title: '太空农业系统设计与实施指南',
            type: '技术文档',
            category: '生命支持',
            access: '部分开放',
            description: `
                <p>本指南全面介绍了封闭环境中的太空农业系统设计与运行方法：</p>
                <ul>
                    <li>适合太空种植的作物筛选与评估</li>
                    <li>水培、气培和基质培养系统设计</li>
                    <li>光照、温度和湿度控制系统</li>
                    <li>营养循环与废物处理</li>
                    <li>微生物群落管理</li>
                    <li>自动化与智能监控系统</li>
                </ul>
                <p>包含实际案例分析和详细的技术参数，适合生命支持系统工程师和研究人员使用。</p>
            `,
            url: 'https://example.com/space-agriculture-guide',
            previewUrl: 'img/resources/space-agriculture.jpg',
            tags: ['太空农业', '生命支持', '可持续系统', '食物生产'],
            createdAt: '2025-02-18T09:25:00Z',
            creatorId: 'bioengineer1',
            creatorName: '生物圈工程中心',
            downloads: 198,
            views: 723,
            rating: 4.8,
            comments: []
        },
        {
            id: '10',
            title: '月球基地建设工艺流程教程视频',
            type: '教程视频',
            category: '建筑施工',
            access: '免费预览',
            description: `
                <p>这是一系列关于月球基地建设工艺流程的教程视频，内容涵盖：</p>
                <ul>
                    <li>月球环境下的施工准备与规划</li>
                    <li>自动化建筑设备的操作与维护</li>
                    <li>月壤3D打印建筑技术实操</li>
                    <li>预制模块的运输与组装</li>
                    <li>气密性测试与环境系统调试</li>
                    <li>建筑过程中的安全措施与应急处理</li>
                </ul>
                <p>视频包含详细的步骤演示和专家讲解，配有中英文字幕，适合工程技术人员学习参考。</p>
            `,
            url: 'https://example.com/lunar-construction-tutorial',
            previewUrl: 'img/resources/lunar-construction.jpg',
            tags: ['月球基地', '建筑施工', '3D打印', '教程视频'],
            createdAt: '2024-11-10T09:00:00Z',
            creatorId: 'instructor1',
            creatorName: '太空建筑学院',
            downloads: 278,
            views: 1056,
            rating: 4.8,
            comments: []
        },
        {
            id: '11',
            title: '太空栖息地通信系统设计指南',
            type: '技术文档',
            category: '通信系统',
            access: '部分开放',
            description: `
                <p>本指南详细介绍了太空栖息地内部和对外通信系统的设计方法：</p>
                <ul>
                    <li>栖息地内部无线网络规划</li>
                    <li>深空通信链路设计与优化</li>
                    <li>通信延迟补偿策略</li>
                    <li>数据压缩与优先级管理</li>
                    <li>通信安全与加密方案</li>
                    <li>应急通信备份系统</li>
                </ul>
                <p>包含详细的系统架构图、设备参数和配置方案，适合通信系统工程师参考使用。</p>
            `,
            url: 'https://example.com/space-communication-guide',
            previewUrl: 'img/resources/communication-system.jpg',
            tags: ['通信系统', '网络设计', '深空通信', '数据传输'],
            createdAt: '2025-02-25T11:20:00Z',
            creatorId: 'engineer5',
            creatorName: '太空通信实验室',
            downloads: 145,
            views: 567,
            rating: 4.7,
            comments: []
        },
        {
            id: '12',
            title: '太空医疗系统设计与应急处理',
            type: '研究报告',
            category: '医疗健康',
            access: '会员专享',
            description: `
                <p>本报告全面介绍了太空栖息地医疗系统的设计原则和应急处理方案：</p>
                <ul>
                    <li>微重力环境下的医疗设备设计</li>
                    <li>远程医疗技术与实施方案</li>
                    <li>常见太空健康问题的诊断与处理</li>
                    <li>医疗应急响应流程与设备配置</li>
                    <li>长期太空居住的健康监测系统</li>
                    <li>医疗废物处理与防污染措施</li>
                </ul>
                <p>报告基于国际空间站和模拟任务的实际经验，提供了详细的案例分析和技术方案。</p>
            `,
            url: 'https://example.com/space-medical-system',
            previewUrl: 'img/resources/medical-system.jpg',
            tags: ['医疗系统', '健康监测', '应急处理', '远程医疗'],
            createdAt: '2024-12-20T10:30:00Z',
            creatorId: 'doctor1',
            creatorName: '太空医学研究中心',
            downloads: 167,
            views: 623,
            rating: 4.9,
            comments: []
        }
    ];
}

/**
 * 加载资源列表
 * @param {number} page - 页码
 * @param {string} searchQuery - 搜索关键词
 * @param {string} typeFilter - 类型筛选
 * @param {string} categoryFilter - 分类筛选
 * @param {string} accessFilter - 权限筛选
 */
async function loadResources(page = 1, searchQuery = '', typeFilter = '', categoryFilter = '', accessFilter = '') {
    try {
        // 显示加载指示器
        const resourcesContainer = document.getElementById('resourcesList');
        resourcesContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> 加载资源中...</div>';
        
        // 获取排序选项
        const sortOption = document.getElementById('resourceSort').value;
        
        // 准备API请求参数
        const params = {
            page: page,
            limit: 6, // 每页显示6个资源
            search: searchQuery,
            type: typeFilter,
            category: categoryFilter,
            access: accessFilter,
            sort: sortOption
        };
        
        // 调用API获取资源
        const response = await apiService.getResources(params);
        
        // 清空资源列表容器
        resourcesContainer.innerHTML = '';
        
        // 如果没有资源，显示提示
        if (response.resources.length === 0) {
            resourcesContainer.innerHTML = '<div class="no-resources"><p>没有找到符合条件的资源</p></div>';
            
            // 隐藏分页
            document.getElementById('paginationControls').style.display = 'none';
            return;
        }
        
        // 显示资源
        response.resources.forEach(resource => {
            const card = createResourceCard(resource);
            resourcesContainer.appendChild(card);
        });
        
        // 更新分页控件
        updatePagination(page, response.pagination.totalPages);
        
        // 显示分页控件
        document.getElementById('paginationControls').style.display = 'flex';
        
    } catch (error) {
        console.error('加载资源失败:', error);
        // 显示错误信息
        const resourcesContainer = document.getElementById('resourcesList');
        resourcesContainer.innerHTML = `<div class="error-message"><p>加载资源失败: ${error.message}</p></div>`;
        
        // 隐藏分页
        document.getElementById('paginationControls').style.display = 'none';
        
        // 显示通知
        showNotification('加载资源失败，请稍后再试', 'error');
    }
}

/**
 * 加载收藏的资源
 */
async function loadSavedResources() {
    try {
        const savedResourcesContainer = document.getElementById('savedResourcesList');
        if (!savedResourcesContainer) return;
        
        // 显示加载指示器
        savedResourcesContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> 加载收藏资源中...</div>';
        
        // 检查用户是否已认证
        if (!apiService.isAuthenticated()) {
            savedResourcesContainer.innerHTML = '<div class="login-prompt"><p>请<a href="login.html">登录</a>查看您收藏的资源</p></div>';
            return;
        }
        
        // 调用API获取收藏的资源
        const response = await apiService.getSavedResources();
        
        // 清空容器
        savedResourcesContainer.innerHTML = '';
        
        // 如果没有收藏的资源，显示提示
        if (response.resources.length === 0) {
            savedResourcesContainer.innerHTML = '<div class="no-saved-resources"><p>您还没有收藏任何资源</p></div>';
            return;
        }
        
        // 显示收藏的资源
        response.resources.forEach(resource => {
            const card = createResourceCard(resource);
            savedResourcesContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('加载收藏资源失败:', error);
        
        // 显示错误信息
        const savedResourcesContainer = document.getElementById('savedResourcesList');
        if (savedResourcesContainer) {
            savedResourcesContainer.innerHTML = `<div class="error-message"><p>加载收藏资源失败: ${error.message}</p></div>`;
        }
        
        // 显示通知
        showNotification('加载收藏资源失败，请稍后再试', 'error');
    }
}

/**
 * 收藏资源
 * @param {string} resourceId - 资源ID
 */
async function saveResource(resourceId) {
    try {
        // 检查用户是否已认证
        if (!apiService.isAuthenticated()) {
            showNotification('请先登录后再收藏资源', 'warning');
            return false;
        }
        
        // 调用API收藏资源
        const response = await apiService.saveResource(resourceId);
        
        // 更新UI
        const saveBtn = document.querySelector(`.resource-save-btn[data-id="${resourceId}"]`);
        if (saveBtn) {
            saveBtn.classList.add('saved');
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> 已收藏';
            saveBtn.setAttribute('data-saved', 'true');
        }
        
        // 显示通知
        showNotification(response.message || '资源已收藏', 'success');
        
        // 重新加载收藏的资源列表（如果存在）
        if (document.getElementById('savedResourcesList')) {
            loadSavedResources();
        }
        
        return true;
    } catch (error) {
        console.error('收藏资源失败:', error);
        showNotification(`收藏资源失败: ${error.message}`, 'error');
        return false;
    }
}

/**
 * 取消收藏资源
 * @param {string} resourceId - 资源ID
 */
async function unsaveResource(resourceId) {
    try {
        // 检查用户是否已认证
        if (!apiService.isAuthenticated()) {
            showNotification('请先登录', 'warning');
            return false;
        }
        
        // 调用API取消收藏资源
        const response = await apiService.unsaveResource(resourceId);
        
        // 更新UI
        const saveBtn = document.querySelector(`.resource-save-btn[data-id="${resourceId}"]`);
        if (saveBtn) {
            saveBtn.classList.remove('saved');
            saveBtn.innerHTML = '<i class="far fa-bookmark"></i> 收藏';
            saveBtn.setAttribute('data-saved', 'false');
        }
        
        // 显示通知
        showNotification(response.message || '已取消收藏', 'success');
        
        // 重新加载收藏的资源列表（如果存在）
        if (document.getElementById('savedResourcesList')) {
            loadSavedResources();
        }
        
        return true;
    } catch (error) {
        console.error('取消收藏资源失败:', error);
        showNotification(`取消收藏资源失败: ${error.message}`, 'error');
        return false;
    }
}

/**
 * 加载相关资源推荐
 * @param {Object} resource - 当前资源
 */
async function loadRelatedResources(resource) {
    try {
        const relatedContainer = document.getElementById('relatedResources');
        if (!relatedContainer) return;
        
        // 显示加载指示器
        relatedContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> 加载相关资源中...</div>';
        
        // 调用API获取相关资源
        const relatedResources = await apiService.getRelatedResources(resource.id);
        
        // 如果没有相关资源，显示提示
        if (!relatedResources || relatedResources.length === 0) {
            relatedContainer.innerHTML = '<p class="no-related">暂无相关资源</p>';
            return;
        }
        
        // 清空容器
        relatedContainer.innerHTML = '';
        
        // 显示相关资源
        relatedResources.forEach(r => {
            const relatedItem = document.createElement('div');
            relatedItem.className = 'related-item';
            
            // 设置相关项内容
            relatedItem.innerHTML = `
                <div class="related-preview">
                    <img src="${r.previewUrl || 'images/resource-placeholder.jpg'}" alt="${r.title}" onerror="this.src='images/resource-placeholder.jpg'">
                </div>
                <div class="related-info">
                    <h4>${r.title}</h4>
                    <div class="related-meta">
                        <span>${r.type || '未知类型'}</span>
                        <span><i class="fas fa-star"></i> ${(r.rating || 0).toFixed(1)}</span>
                    </div>
                </div>
            `;
            
            // 添加点击事件
            relatedItem.addEventListener('click', function() {
                // 关闭当前模态框
                document.getElementById('resourceDetailModal').style.display = 'none';
                
                // 打开相关资源详情
                setTimeout(() => {
                    openResourceDetail(r.id);
                }, 100);
            });
            
            // 添加到容器
            relatedContainer.appendChild(relatedItem);
        });
    } catch (error) {
        console.error('加载相关资源失败:', error);
        
        // 显示错误信息
        const relatedContainer = document.getElementById('relatedResources');
        if (relatedContainer) {
            relatedContainer.innerHTML = '<p class="error-message">加载相关资源失败</p>';
        }
    }
}

/**
 * 打开资源详情
 * @param {string} resourceId - 资源ID
 */
async function openResourceDetail(resourceId) {
    try {
        // 显示加载指示器
        const modal = document.getElementById('resourceDetailModal');
        modal.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> 加载资源详情中...</div>';
        modal.style.display = 'block';
        
        // 调用API获取资源详情
        const resource = await apiService.getResourceDetail(resourceId);
        
        if (!resource) {
            modal.innerHTML = '<div class="error-message"><p>未找到资源</p><button class="close-btn">关闭</button></div>';
            modal.querySelector('.close-btn').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            return;
        }
        
        // 更新浏览历史
        updateResourceViewHistory(resourceId);
        
        // 设置模态框内容
        modal.innerHTML = `
            <div class="modal-content resource-detail-content">
                <span class="close">&times;</span>
                <div class="resource-detail-header">
                    <h2>${resource.title}</h2>
                    <div class="resource-meta">
                        <span class="resource-type">${resource.type || '未知类型'}</span>
                        <span class="resource-category">${resource.category || '未分类'}</span>
                        <span class="resource-date">发布于: ${formatDate(resource.createdAt)}</span>
                    </div>
                </div>
                
                <div class="resource-detail-body">
                    <div class="resource-preview">
                        <img src="${resource.previewUrl || 'images/resource-placeholder.jpg'}" alt="${resource.title}" onerror="this.src='images/resource-placeholder.jpg'">
                    </div>
                    
                    <div class="resource-info">
                        <div class="resource-description">
                            <h3>资源描述</h3>
                            <p>${resource.description || '暂无描述'}</p>
                        </div>
                        
                        <div class="resource-stats">
                            <div class="stat-item">
                                <i class="fas fa-eye"></i>
                                <span>${resource.views || 0}</span>
                                <label>浏览</label>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-download"></i>
                                <span>${resource.downloads || 0}</span>
                                <label>下载</label>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-star"></i>
                                <span id="detailRating">${(resource.rating || 0).toFixed(1)}</span>
                                <label>评分</label>
                            </div>
                        </div>
                        
                        <div class="resource-rating">
                            <h3>资源评分</h3>
                            <div class="rating-stars" id="detailRatingStars">
                                ${generateRatingStars(resource.rating || 0)}
                            </div>
                            <div class="rating-interactive" id="detailRatingInteractive"></div>
                        </div>
                        
                        <div class="resource-tags">
                            <h3>标签</h3>
                            <div class="tags-list">
                                ${resource.tags && Array.isArray(resource.tags) ? resource.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '<span class="no-tags">暂无标签</span>'}
                            </div>
                        </div>
                        
                        <div class="resource-actions">
                            <button id="downloadResourceBtn" class="btn primary-btn" data-id="${resource.id}">
                                <i class="fas fa-download"></i> 下载资源
                            </button>
                            <button id="saveResourceBtn" class="btn secondary-btn resource-save-btn ${resource.isSaved ? 'saved' : ''}" data-id="${resource.id}" data-saved="${resource.isSaved ? 'true' : 'false'}">
                                <i class="${resource.isSaved ? 'fas' : 'far'} fa-bookmark"></i> ${resource.isSaved ? '已收藏' : '收藏'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="resource-detail-footer">
                    <div class="related-resources">
                        <h3>相关资源</h3>
                        <div id="relatedResourcesList" class="related-list"></div>
                    </div>
                </div>
            </div>
        `;
        
        // 设置模态框ID
        modal.setAttribute('data-id', resourceId);
        
        // 添加下载按钮事件
        document.getElementById('downloadResourceBtn').addEventListener('click', function() {
            const resourceId = this.getAttribute('data-id');
            downloadResource(resourceId);
        });
        
        // 添加收藏按钮事件
        const saveBtn = document.getElementById('saveResourceBtn');
        saveBtn.addEventListener('click', function() {
            const resourceId = this.getAttribute('data-id');
            const isSaved = this.getAttribute('data-saved') === 'true';
            
            if (isSaved) {
                unsaveResource(resourceId);
            } else {
                saveResource(resourceId);
            }
        });
        
        // 添加关闭按钮事件
        document.querySelector('#resourceDetailModal .close').addEventListener('click', function() {
            document.getElementById('resourceDetailModal').style.display = 'none';
        });
        
        // 初始化评分星星
        initRatingStars();
        
        // 加载相关资源
        loadRelatedResources(resource);
        
    } catch (error) {
        console.error('加载资源详情失败:', error);
        
        // 显示错误信息
        const modal = document.getElementById('resourceDetailModal');
        modal.innerHTML = `<div class="modal-content error-content">
            <span class="close">&times;</span>
            <div class="error-message">
                <p>加载资源详情失败: ${error.message}</p>
            </div>
        </div>`;
        
        // 添加关闭按钮事件
        document.querySelector('#resourceDetailModal .close').addEventListener('click', function() {
            document.getElementById('resourceDetailModal').style.display = 'none';
        });
    }
}

/**
 * 订阅会员计划
 * @param {string} planName - 计划名称
 */
async function subscribeMembership(planName) {
    try {
        // 检查用户是否已认证
        if (!apiService.isAuthenticated()) {
            showNotification('请先登录后再订阅会员', 'warning');
            // 跳转到登录页面
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }
        
        // 显示处理中通知
        showNotification('正在处理您的订阅请求...', 'info');
        
        // 调用API订阅会员
        const response = await apiService.subscribeMembership(planName);
        
        // 关闭模态框
        closeAllModals();
        
        // 显示成功通知
        showNotification(`您已成功订阅${planName}会员计划`, 'success');
        
        // 如果有回调页面，跳转回去
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        if (returnUrl) {
            setTimeout(() => {
                window.location.href = returnUrl;
            }, 1500);
        }
    } catch (error) {
        console.error('订阅会员失败:', error);
        showNotification(`订阅会员失败: ${error.message}`, 'error');
    }
}

/**
 * 提交资源
 */
async function submitResource() {
    try {
        // 检查用户是否已认证
        if (!apiService.isAuthenticated()) {
            showNotification('请先登录后再提交资源', 'warning');
            return;
        }
        
        // 获取表单数据
        const title = document.getElementById('contributeTitle').value.trim();
        const type = document.getElementById('contributeType').value;
        const category = document.getElementById('contributeCategory').value;
        const description = document.getElementById('contributeDescription').value.trim();
        const tagsInput = document.getElementById('contributeTags').value.trim();
        const access = document.getElementById('contributeAccess').value;
        const fileInput = document.getElementById('contributeFile');
        const previewInput = document.getElementById('contributePreview');
        
        // 验证必填字段
        if (!title) {
            showNotification('请输入资源标题', 'error');
            return;
        }
        
        if (!description) {
            showNotification('请输入资源描述', 'error');
            return;
        }
        
        // 处理标签
        const tags = tagsInput.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        
        // 创建表单数据
        const formData = new FormData();
        formData.append('title', title);
        formData.append('type', type);
        formData.append('category', category);
        formData.append('description', description);
        formData.append('access', access);
        
        // 添加标签
        tags.forEach(tag => {
            formData.append('tags[]', tag);
        });
        
        // 添加文件
        if (fileInput.files.length > 0) {
            formData.append('file', fileInput.files[0]);
        }
        
        // 添加预览图
        if (previewInput.files.length > 0) {
            formData.append('preview', previewInput.files[0]);
        }
        
        // 显示提交中通知
        showNotification('正在提交资源...', 'info');
        
        // 调用API提交资源
        const response = await apiService.submitResource(formData);
        
        // 关闭模态框
        closeAllModals();
        
        // 重新加载资源列表
        loadResources();
        
        // 显示成功通知
        showNotification('资源提交成功，感谢您的贡献！', 'success');
        
        // 清空表单
        document.getElementById('contributeForm').reset();
        
    } catch (error) {
        console.error('提交资源失败:', error);
        showNotification(`提交资源失败: ${error.message}`, 'error');
    }
}

/**
 * 初始化资源页面
 */
async function initResourcesPage() {
    try {
        // 加载资源
        loadResources();
        
        // 加载标签云
        loadTagsCloud();
        
        // 加载推荐资源
        loadRecommendedResources();
        
        // 加载浏览历史
        loadViewHistory();
        
        // 加载收藏的资源
        loadSavedResources();
        
        // 检查URL参数
        checkUrlParams();
        
        // 添加搜索按钮事件
        document.getElementById('searchBtn').addEventListener('click', function() {
            const searchQuery = document.getElementById('resourceSearch').value.trim();
            const typeFilter = document.getElementById('resourceType').value;
            const categoryFilter = document.getElementById('resourceCategory').value;
            const accessFilter = document.getElementById('resourceAccess').value;
            
            // 更新筛选标签
            updateFilterTags(searchQuery, typeFilter, categoryFilter, accessFilter);
            
            // 重新加载资源
            loadResources(1, searchQuery, typeFilter, categoryFilter, accessFilter);
        });
        
        // 搜索框回车事件
        document.getElementById('resourceSearch').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('searchBtn').click();
            }
        });
        
        // 添加排序选择事件
        document.getElementById('resourceSort').addEventListener('change', function() {
            // 获取当前筛选条件
            const searchQuery = document.getElementById('resourceSearch').value.trim();
            const typeFilter = document.getElementById('resourceType').value;
            const categoryFilter = document.getElementById('resourceCategory').value;
            const accessFilter = document.getElementById('resourceAccess').value;
            
            // 重新加载资源
            loadResources(1, searchQuery, typeFilter, categoryFilter, accessFilter);
        });
        
        // 添加贡献按钮事件
        document.getElementById('contributeBtn').addEventListener('click', function() {
            openContributeModal();
        });
        
        // 添加模态框关闭事件
        document.querySelectorAll('.modal .close').forEach(function(closeBtn) {
            closeBtn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', function(event) {
            document.querySelectorAll('.modal').forEach(function(modal) {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // 按ESC键关闭模态框
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeAllModals();
            }
        });
        
        // 提交资源按钮事件
        const submitResourceBtn = document.getElementById('submitResourceBtn');
        if (submitResourceBtn) {
            submitResourceBtn.addEventListener('click', function() {
                submitResource();
            });
        }
        
        // 会员订阅按钮事件
        document.querySelectorAll('.membership-plan .subscribe-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const planName = this.getAttribute('data-plan');
                subscribeMembership(planName);
            });
        });
        
        // 检查用户登录状态并更新UI
        updateUserLoginStatus();
        
    } catch (error) {
        console.error('初始化资源页面失败:', error);
        showNotification('初始化页面失败，请刷新重试', 'error');
    }
}

/**
 * 更新用户登录状态
 */
async function updateUserLoginStatus() {
    try {
        // 检查用户是否已认证
        const isAuthenticated = apiService.isAuthenticated();
        
        // 获取用户信息元素
        const userInfoElement = document.getElementById('userInfo');
        if (!userInfoElement) return;
        
        if (isAuthenticated) {
            // 获取用户信息
            const userInfo = await apiService.getUserInfo();
            
            // 更新用户信息显示
            userInfoElement.innerHTML = `
                <div class="user-avatar">
                    <img src="${userInfo.avatar || 'images/avatar-placeholder.jpg'}" alt="${userInfo.username}">
                </div>
                <div class="user-name">
                    <span>${userInfo.username}</span>
                    ${userInfo.membership ? `<span class="membership-badge">${userInfo.membership.plan}</span>` : ''}
                </div>
                <div class="user-actions">
                    <a href="profile.html" class="btn small-btn">个人中心</a>
                    <button id="logoutBtn" class="btn small-btn">退出</button>
                </div>
            `;
            
            // 添加退出按钮事件
            document.getElementById('logoutBtn').addEventListener('click', function() {
                apiService.logout();
                window.location.reload();
            });
        } else {
            // 显示登录/注册按钮
            userInfoElement.innerHTML = `
                <div class="login-register">
                    <a href="login.html" class="btn small-btn">登录</a>
                    <a href="register.html" class="btn small-btn primary-btn">注册</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('更新用户登录状态失败:', error);
    }
}

// 当页面加载完成时初始化
document.addEventListener('DOMContentLoaded', function() {
    initResourcesPage();
});
