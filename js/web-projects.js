/**
 * 加载项目列表
 */
function loadProjects() {
    // 获取项目列表容器
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;
    
    // 清空项目列表
    projectsGrid.innerHTML = '';
    
    // 获取项目数据
    let projects = getProjectsFromStorage();
    
    // 如果没有项目数据，则加载默认项目数据
    if (projects.length === 0) {
        projects = getDefaultProjects();
        // 保存到本地存储
        localStorage.setItem('projects', JSON.stringify(projects));
    }
    
    // 获取当前筛选条件
    const currentFilter = sessionStorage.getItem('currentFilter') || 'all';
    const searchQuery = document.getElementById('projectSearch')?.value.toLowerCase() || '';
    const sortOption = document.getElementById('projectSort')?.value || 'newest';
    const selectedTags = JSON.parse(sessionStorage.getItem('selectedTags') || '[]');
    
    // 筛选项目
    let filteredProjects = filterProjectsByCategory(projects, currentFilter);
    
    // 按标签筛选
    filteredProjects = filterProjectsByTags(filteredProjects, selectedTags);
    
    // 搜索项目
    if (searchQuery) {
        filteredProjects = searchProjects(filteredProjects, searchQuery);
    }
    
    // 排序项目
    filteredProjects = sortProjects(filteredProjects, sortOption);
    
    // 显示项目
    if (filteredProjects.length > 0) {
        filteredProjects.forEach(project => {
            const projectCard = createProjectCard(project);
            projectsGrid.appendChild(projectCard);
        });
        
        // 隐藏空结果提示
        const emptyMessage = document.querySelector('.projects-empty');
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
    } else {
        // 显示空结果提示
        const emptyMessage = document.querySelector('.projects-empty');
        if (emptyMessage) {
            emptyMessage.style.display = 'flex';
        }
    }
    
    // 更新筛选标签
    updateFilterTags(currentFilter);
    updateTagsFilter(projects);
}

/**
 * 按类别筛选项目
 * @param {Array} projects 项目数组
 * @param {string} category 类别
 * @returns {Array} 筛选后的项目数组
 */
function filterProjectsByCategory(projects, category) {
    if (category === 'all') {
        return projects;
    }
    return projects.filter(project => project.category === category);
}

/**
 * 按标签筛选项目
 * @param {Array} projects 项目数组
 * @param {Array} selectedTags 选中的标签数组
 * @returns {Array} 筛选后的项目数组
 */
function filterProjectsByTags(projects, selectedTags) {
    if (!selectedTags || selectedTags.length === 0) {
        return projects;
    }
    return projects.filter(project => {
        if (!project.tags) return false;
        return selectedTags.some(tag => project.tags.includes(tag));
    });
}

/**
 * 搜索项目
 * @param {Array} projects 项目数组
 * @param {string} query 搜索关键词
 * @returns {Array} 搜索结果
 */
function searchProjects(projects, query) {
    return projects.filter(project => {
        const titleMatch = project.title.toLowerCase().includes(query);
        const summaryMatch = project.summary.toLowerCase().includes(query);
        const descriptionMatch = project.description.toLowerCase().includes(query);
        const tagsMatch = project.tags ? project.tags.some(tag => tag.toLowerCase().includes(query)) : false;
        
        return titleMatch || summaryMatch || descriptionMatch || tagsMatch;
    });
}

/**
 * 排序项目
 * @param {Array} projects 项目数组
 * @param {string} sortOption 排序选项
 * @returns {Array} 排序后的项目数组
 */
function sortProjects(projects, sortOption) {
    switch (sortOption) {
        case 'newest':
            return projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'popular':
            return projects.sort((a, b) => {
                const aFollowers = a.followers ? a.followers.length : 0;
                const bFollowers = b.followers ? b.followers.length : 0;
                return bFollowers - aFollowers;
            });
        case 'progress':
            return projects.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        default:
            return projects;
    }
}

/**
 * 更新筛选标签
 * @param {string} currentFilter 当前筛选条件
 */
function updateFilterTags(currentFilter) {
    const filterContainer = document.querySelector('.projects-filter');
    if (!filterContainer) return;
    
    // 清空筛选标签
    filterContainer.innerHTML = '';
    
    // 添加筛选标签
    const categories = [
        { id: 'all', name: '全部' },
        { id: '月球项目', name: '月球项目' },
        { id: '火星项目', name: '火星项目' },
        { id: '轨道站', name: '轨道站' },
        { id: '生命支持', name: '生命支持' },
        { id: '资源利用', name: '资源利用' },
        { id: '能源系统', name: '能源系统' }
    ];
    
    categories.forEach(category => {
        const tag = document.createElement('div');
        tag.className = `filter-tag ${category.id === currentFilter ? 'active' : ''}`;
        tag.textContent = category.name;
        tag.dataset.filter = category.id;
        
        tag.addEventListener('click', () => {
            filterProjects(category.id);
        });
        
        filterContainer.appendChild(tag);
    });
}

/**
 * 筛选项目
 * @param {string} category 类别
 */
function filterProjects(category) {
    // 保存当前筛选条件
    sessionStorage.setItem('currentFilter', category);
    
    // 重新加载项目
    loadProjects();
}

/**
 * 获取所有项目标签
 * @param {Array} projects 项目数组
 * @returns {Array} 所有标签数组
 */
function getAllProjectTags(projects) {
    const tagsSet = new Set();
    
    projects.forEach(project => {
        if (project.tags && Array.isArray(project.tags)) {
            project.tags.forEach(tag => tagsSet.add(tag));
        }
    });
    
    return Array.from(tagsSet).sort();
}

/**
 * 更新标签筛选器
 * @param {Array} projects 项目数组
 */
function updateTagsFilter(projects) {
    const tagsContainer = document.querySelector('.tags-filter');
    if (!tagsContainer) return;
    
    // 清空标签筛选器
    tagsContainer.innerHTML = '';
    
    // 获取所有标签
    const allTags = getAllProjectTags(projects);
    
    // 获取已选标签
    const selectedTags = JSON.parse(sessionStorage.getItem('selectedTags') || '[]');
    
    // 添加标签筛选选项
    allTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = `tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`;
        tagElement.textContent = tag;
        
        tagElement.addEventListener('click', () => {
            toggleTagFilter(tag);
        });
        
        tagsContainer.appendChild(tagElement);
    });
}

/**
 * 切换标签筛选
 * @param {string} tag 标签
 */
function toggleTagFilter(tag) {
    // 获取已选标签
    let selectedTags = JSON.parse(sessionStorage.getItem('selectedTags') || '[]');
    
    // 切换标签选中状态
    if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
    } else {
        selectedTags.push(tag);
    }
    
    // 保存已选标签
    sessionStorage.setItem('selectedTags', JSON.stringify(selectedTags));
    
    // 重新加载项目
    loadProjects();
}

/**
 * 设置筛选功能
 */
function setupFilters() {
    // 筛选标签事件已在updateFilterTags中设置
    
    // 排序选择事件
    const sortSelect = document.getElementById('projectSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            loadProjects();
        });
    }
}

/**
 * 设置搜索功能
 */
function setupSearch() {
    const searchInput = document.getElementById('projectSearch');
    const searchButton = searchInput?.nextElementSibling;
    
    if (searchInput) {
        // 输入事件
        searchInput.addEventListener('input', debounce(() => {
            loadProjects();
        }, 500));
        
        // 回车事件
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadProjects();
            }
        });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            loadProjects();
        });
    }
}

/**
 * 防抖函数
 * @param {Function} func 要执行的函数
 * @param {number} delay 延迟时间
 * @returns {Function} 防抖后的函数
 */
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

/**
 * 获取默认项目数据
 * @returns {Array} 默认项目数据
 */
function getDefaultProjects() {
    return [
        {
            id: 1,
            title: '月球基地居住舱',
            summary: '针对月球环境设计的模块化居住舱，采用3D打印技术与月球土壤结合，提供辐射防护与温度调节功能。',
            description: `<p>月球基地居住舱项目旨在为未来月球基地提供安全、舒适的居住环境。项目采用最新的3D打印技术，结合月球原位资源利用(ISRU)理念，使用月球土壤（月壤）作为主要建筑材料。</p>
                <p>主要技术特点：</p>
                <ul>
                    <li>模块化设计，便于运输和组装</li>
                    <li>多层结构，提供有效的辐射防护</li>
                    <li>闭环环境控制与生命支持系统(ECLSS)</li>
                    <li>智能温度调节系统，适应月球极端温差</li>
                    <li>可扩展设计，支持基地规模逐步扩大</li>
                </ul>
                <p>目前项目已完成概念设计和初步材料测试，正在进行结构优化和系统集成工作。</p>`,
            category: '月球项目',
            tags: ['3D打印', '模块化', '辐射防护', '温度调节', 'ISRU'],
            image: 'images/projects/lunar-habitat.jpg',
            gallery: [
                'images/projects/lunar-habitat.jpg',
                'images/projects/lunar-habitat-2.jpg',
                'images/projects/lunar-habitat-3.jpg'
            ],
            progress: 78,
            createdAt: '2025-02-15T08:00:00.000Z',
            members: [1, 2, 3, 4, 5, 6, 7, 8],
            followers: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            creator: 1
        },
        {
            id: 2,
            title: '火星表面栖息地',
            summary: '适应火星环境的半地下式栖息地，结合火星土壤制砖技术和膨胀式舱体，提供全面的生命保障系统。',
            description: `<p>火星表面栖息地项目致力于解决人类在火星长期居住的挑战。项目采用半地下式设计，充分利用火星土壤提供的辐射和温度保护。</p>
                <p>主要技术特点：</p>
                <ul>
                    <li>火星土壤制砖技术，就地取材</li>
                    <li>膨胀式舱体，减少发射体积</li>
                    <li>地下水冰提取系统，保障水资源供应</li>
                    <li>火星大气处理系统，提取氧气</li>
                    <li>高效能源系统，结合太阳能和RTG技术</li>
                </ul>
                <p>项目目前处于概念验证阶段，正在进行材料测试和系统设计。</p>`,
            category: '火星项目',
            tags: ['半地下', '土壤制砖', '膨胀式舱体', '辐射防护', '水冰提取'],
            image: 'images/projects/mars-habitat.jpg',
            gallery: [
                'images/projects/mars-habitat.jpg',
                'images/projects/mars-habitat-2.jpg'
            ],
            progress: 45,
            createdAt: '2025-01-20T10:30:00.000Z',
            members: [3, 5, 7, 9, 11],
            followers: [2, 4, 6, 8, 10, 12, 14, 16],
            creator: 3
        },
        {
            id: 3,
            title: '太空农业系统',
            summary: '零重力环境下的植物培育系统，采用水培与LED光照技术，优化空间利用率，为太空站提供新鲜食物。',
            description: `<p>太空农业系统项目旨在解决长期太空任务中的食物供应问题。系统采用先进的水培技术和定制LED光照，在微重力环境下高效种植各类蔬菜和水果。</p>
                <p>主要技术特点：</p>
                <ul>
                    <li>多层立体种植架构，最大化空间利用</li>
                    <li>闭环水循环系统，节约水资源</li>
                    <li>可调谱LED光照，优化植物生长</li>
                    <li>自动化营养液配比系统</li>
                    <li>微重力适应型根部固定装置</li>
                </ul>
                <p>项目已完成多轮地面测试，并在国际空间站进行了初步验证，效果良好。</p>`,
            category: '生命支持',
            tags: ['水培', 'LED光照', '空间利用', '自动化', '微重力'],
            image: 'images/projects/space-agriculture.jpg',
            gallery: [
                'images/projects/space-agriculture.jpg',
                'images/projects/space-agriculture-2.jpg',
                'images/projects/space-agriculture-3.jpg',
                'images/projects/space-agriculture-4.jpg'
            ],
            progress: 92,
            createdAt: '2024-11-05T14:15:00.000Z',
            members: [2, 6, 10, 14, 18],
            followers: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
            creator: 2
        },
        {
            id: 4,
            title: '太空辐射防护服',
            summary: '新一代太空辐射防护服，采用多层复合材料和主动防护技术，大幅提升宇航员在太空环境中的安全性。',
            description: `<p>太空辐射防护服项目致力于解决宇航员在太空活动中面临的辐射威胁。项目结合被动防护材料和主动防护技术，提供全方位的辐射防护解决方案。</p>
                <p>主要技术特点：</p>
                <ul>
                    <li>多层复合防护材料，轻量化设计</li>
                    <li>个人剂量监测系统，实时预警</li>
                    <li>局部增强防护，保护关键器官</li>
                    <li>主动电磁防护系统，应对太阳粒子事件</li>
                    <li>舒适性优化设计，减少宇航员负担</li>
                </ul>
                <p>项目已完成原型设计，正在进行地面模拟测试。</p>`,
            category: '生命支持',
            tags: ['辐射防护', '复合材料', '主动防护', '剂量监测', '轻量化'],
            image: 'images/projects/radiation-suit.jpg',
            gallery: [
                'images/projects/radiation-suit.jpg',
                'images/projects/radiation-suit-2.jpg'
            ],
            progress: 63,
            createdAt: '2024-12-18T09:45:00.000Z',
            members: [4, 8, 12, 16, 20],
            followers: [1, 2, 3, 5, 7, 9],
            creator: 4
        },
        {
            id: 5,
            title: '小行星采矿系统',
            summary: '自主化小行星资源开采系统，包括识别、附着、钻探和材料分离模块，为太空建设提供原材料。',
            description: `<p>小行星采矿系统项目旨在开发一套完整的小行星资源利用解决方案。系统包括多个协同工作的模块，能够自主完成从目标识别到资源提取的全过程。</p>
                <p>主要技术特点：</p>
                <ul>
                    <li>高精度光谱分析系统，远程识别资源</li>
                    <li>微重力环境下的稳定附着系统</li>
                    <li>模块化钻探装置，适应不同硬度</li>
                    <li>原位资源提取和初步加工</li>
                    <li>自主导航和操作系统</li>
                </ul>
                <p>项目处于概念设计阶段，正在进行关键技术攻关。</p>`,
            category: '资源利用',
            tags: ['小行星采矿', '自主系统', '资源提取', '微重力操作', '光谱分析'],
            image: 'images/projects/asteroid-mining.jpg',
            gallery: [
                'images/projects/asteroid-mining.jpg'
            ],
            progress: 35,
            createdAt: '2025-03-10T11:20:00.000Z',
            members: [5, 10, 15],
            followers: [2, 4, 6, 8],
            creator: 5
        },
        {
            id: 6,
            title: '太空太阳能电站',
            summary: '轨道太阳能发电系统，采用轻量化太阳能电池阵列和微波能量传输技术，为地球和太空基础设施提供清洁能源。',
            description: `<p>太空太阳能电站项目致力于开发一种革命性的能源解决方案，通过在地球轨道部署大型太阳能电池阵列，收集太阳能并将其转换为电能，然后通过微波或激光技术传输到地球或其他太空设施。</p>
                <p>主要技术特点：</p>
                <ul>
                    <li>超轻薄高效太阳能电池阵列</li>
                    <li>大型可展开结构技术</li>
                    <li>高效率微波能量传输系统</li>
                    <li>精确瞄准和跟踪技术</li>
                    <li>模块化设计，支持渐进式部署</li>
                </ul>
                <p>项目已完成概念验证，正在开发小型演示系统。</p>`,
            category: '能源系统',
            tags: ['太阳能', '能量传输', '轨道电站', '清洁能源', '微波技术'],
            image: 'images/projects/space-solar.jpg',
            gallery: [
                'images/projects/space-solar.jpg',
                'images/projects/space-solar-2.jpg'
            ],
            progress: 52,
            createdAt: '2024-10-25T16:40:00.000Z',
            members: [7, 14, 21],
            followers: [3, 6, 9, 12, 15, 18],
            creator: 7
        },
        {
            id: 7,
            title: '月球冰提取系统',
            summary: '针对月球极地永久阴影区的水冰资源提取系统，结合热能和机械方法，高效获取水资源用于生命支持和燃料生产。',
            description: `<p>月球冰提取系统项目专注于开发一套能够在月球极地永久阴影区高效提取水冰资源的技术方案。该系统将为月球基地提供宝贵的水资源，用于生命支持系统和火箭燃料生产。</p>
                <p>主要技术特点：</p>
                <ul>
                    <li>低温环境适应性设计</li>
                    <li>定向热能提取技术</li>
                    <li>原位水分离和纯化系统</li>
                    <li>自主导航和操作能力</li>
                    <li>高效能源利用设计</li>
                </ul>
                <p>项目正在进行关键技术验证和系统集成设计。</p>`,
            category: '月球项目',
            tags: ['水冰提取', '极地资源', '原位资源利用', '生命支持', '燃料生产'],
            image: 'images/projects/lunar-ice.jpg',
            gallery: [
                'images/projects/lunar-ice.jpg'
            ],
            progress: 48,
            createdAt: '2025-02-05T13:10:00.000Z',
            members: [1, 8, 15],
            followers: [2, 5, 9, 12, 16],
            creator: 8
        },
        {
            id: 8,
            title: '太空3D打印建筑系统',
            summary: '大型太空结构3D打印系统，使用原位资源或回收材料，能够在轨道或行星表面自主构建各类基础设施。',
            description: `<p>太空3D打印建筑系统项目旨在开发一种能够在太空环境中进行大规模建筑结构打印的技术。该系统可以使用月球或火星土壤、小行星材料或回收材料作为原料，在轨道或行星表面自主构建各类基础设施。</p>
                <p>主要技术特点：</p>
                <ul>
                    <li>大尺寸自由移动打印头</li>
                    <li>多种材料适应性</li>
                    <li>微重力/低重力环境打印技术</li>
                    <li>结构强度实时监测系统</li>
                    <li>自修复材料技术</li>
                </ul>
                <p>项目已完成小型原型测试，正在扩展系统规模和功能。</p>`,
            category: '资源利用',
            tags: ['3D打印', '大型结构', '原位资源', '自主建造', '多材料'],
            image: 'images/projects/space-3d-printing.jpg',
            gallery: [
                'images/projects/space-3d-printing.jpg',
                'images/projects/space-3d-printing-2.jpg'
            ],
            progress: 67,
            createdAt: '2024-11-30T15:25:00.000Z',
            members: [3, 9, 15, 21],
            followers: [1, 4, 7, 10, 13, 16, 19],
            creator: 9
        }
    ];
}

/**
 * 初始化创建项目页面
 */
function initCreateProject() {
    // 获取表单元素
    const projectForm = document.getElementById('projectForm');
    if (!projectForm) return;
    
    // 提交表单事件
    projectForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 检查用户是否登录
        if (!isLoggedIn()) {
            showMessage('请先登录后再创建项目', 'error');
            setTimeout(() => {
                window.location.href = 'login.html?redirect=create-project.html';
            }, 2000);
            return;
        }
        
        // 获取表单数据
        const formData = new FormData(projectForm);
        const projectData = {
            id: Date.now(), // 使用时间戳作为临时ID
            title: formData.get('title'),
            category: formData.get('category'),
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
            summary: formData.get('summary'),
            description: formData.get('description'),
            teamSize: formData.get('teamSize'),
            requiredSkills: formData.get('skills'),
            openToCollaboration: formData.has('openToCollaboration'),
            seekingFunding: formData.has('seekingFunding'),
            openSource: formData.has('openSource'),
            progress: 0,
            createdAt: new Date().toISOString(),
            members: [getCurrentUser().id], // 创建者自动成为成员
            followers: [],
            creator: getCurrentUser().id,
            // 图片处理在实际应用中需要上传到服务器
            // 这里简化处理，使用默认图片
            image: 'images/projects/default-project.jpg',
            gallery: []
        };
        
        // 获取现有项目
        let projects = getProjectsFromStorage();
        
        // 添加新项目
        projects.push(projectData);
        
        // 保存到本地存储
        localStorage.setItem('projects', JSON.stringify(projects));
        
        // 显示成功消息
        showMessage('项目创建成功！', 'success');
        
        // 跳转到项目详情页
        setTimeout(() => {
            window.location.href = `project-detail.html?id=${projectData.id}`;
        }, 2000);
    });
    
    // 保存为草稿按钮事件
    const saveAsDraftBtn = document.getElementById('saveAsDraft');
    if (saveAsDraftBtn) {
        saveAsDraftBtn.addEventListener('click', function() {
            // 检查用户是否登录
            if (!isLoggedIn()) {
                showMessage('请先登录后再保存草稿', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html?redirect=create-project.html';
                }, 2000);
                return;
            }
            
            // 获取表单数据
            const formData = new FormData(projectForm);
            const draftData = {
                id: 'draft_' + Date.now(),
                title: formData.get('title') || '未命名项目',
                category: formData.get('category') || '',
                tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
                summary: formData.get('summary') || '',
                description: formData.get('description') || '',
                isDraft: true,
                savedAt: new Date().toISOString(),
                creator: getCurrentUser().id
            };
            
            // 获取现有草稿
            let drafts = JSON.parse(localStorage.getItem('projectDrafts') || '[]');
            
            // 添加新草稿
            drafts.push(draftData);
            
            // 保存到本地存储
            localStorage.setItem('projectDrafts', JSON.stringify(drafts));
            
            // 显示成功消息
            showMessage('草稿保存成功！', 'success');
        });
    }
}

/**
 * 关注/取消关注项目
 */
function toggleFollowProject() {
    // 获取当前项目ID
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (!projectId) return;
    
    // 获取当前用户
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = `login.html?redirect=project-detail.html?id=${projectId}`;
        return;
    }
    
    // 获取关注按钮
    const followBtn = document.getElementById('followProjectBtn');
    if (!followBtn) return;
    
    // 获取所有项目数据
    let projects = getProjectsFromStorage();
    
    // 查找当前项目
    const projectIndex = projects.findIndex(p => p.id == projectId);
    if (projectIndex === -1) return;
    
    // 如果项目没有followers属性，添加一个空数组
    if (!projects[projectIndex].followers) {
        projects[projectIndex].followers = [];
    }
    
    // 检查用户是否已关注该项目
    const isFollowing = projects[projectIndex].followers.includes(currentUser.id);
    
    if (isFollowing) {
        // 取消关注
        projects[projectIndex].followers = projects[projectIndex].followers.filter(id => id !== currentUser.id);
        followBtn.innerHTML = '<i class="fas fa-star"></i> 关注项目';
        followBtn.classList.remove('following');
        showMessage('已取消关注此项目');
    } else {
        // 关注项目
        projects[projectIndex].followers.push(currentUser.id);
        followBtn.innerHTML = '<i class="fas fa-star"></i> 已关注';
        followBtn.classList.add('following');
        showMessage('已成功关注此项目');
    }
    
    // 更新本地存储
    localStorage.setItem('projects', JSON.stringify(projects));
    
    // 更新关注者数量显示
    const followersCount = document.getElementById('followersCount');
    if (followersCount) {
        followersCount.textContent = projects[projectIndex].followers.length;
    }
}

/**
 * 申请加入项目
 */
function applyToJoinProject() {
    // 获取当前项目ID
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (!projectId) return;
    
    // 获取当前用户
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = `login.html?redirect=project-detail.html?id=${projectId}`;
        return;
    }
    
    // 获取加入按钮
    const joinBtn = document.getElementById('joinProjectBtn');
    if (!joinBtn) return;
    
    // 获取所有项目数据
    let projects = getProjectsFromStorage();
    
    // 查找当前项目
    const projectIndex = projects.findIndex(p => p.id == projectId);
    if (projectIndex === -1) return;
    
    // 如果项目没有applicants属性，添加一个空数组
    if (!projects[projectIndex].applicants) {
        projects[projectIndex].applicants = [];
    }
    
    // 如果项目没有members属性，添加一个空数组
    if (!projects[projectIndex].members) {
        projects[projectIndex].members = [];
    }
    
    // 检查用户是否已是项目成员
    const isMember = projects[projectIndex].members.includes(currentUser.id);
    if (isMember) {
        showMessage('您已经是项目成员');
        joinBtn.innerHTML = '<i class="fas fa-users"></i> 已加入';
        joinBtn.classList.add('joined');
        return;
    }
    
    // 检查用户是否已申请加入
    const hasApplied = projects[projectIndex].applicants.includes(currentUser.id);
    
    if (hasApplied) {
        showMessage('您已提交申请，请等待项目管理员审核');
        return;
    }
    
    // 添加申请
    projects[projectIndex].applicants.push(currentUser.id);
    joinBtn.innerHTML = '<i class="fas fa-clock"></i> 申请审核中';
    joinBtn.classList.add('pending');
    
    // 更新本地存储
    localStorage.setItem('projects', JSON.stringify(projects));
    
    // 显示成功消息
    showMessage('已成功提交加入申请，请等待项目管理员审核');
    
    // 模拟发送通知给项目创建者
    console.log(`用户 ${currentUser.username} 申请加入项目 ${projects[projectIndex].title}`);
}

/**
 * 检查并更新项目关注和加入状态
 */
function updateProjectActionStatus() {
    // 获取当前项目ID
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (!projectId) return;
    
    // 获取当前用户
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // 获取关注按钮和加入按钮
    const followBtn = document.getElementById('followProjectBtn');
    const joinBtn = document.getElementById('joinProjectBtn');
    
    // 获取所有项目数据
    let projects = getProjectsFromStorage();
    
    // 查找当前项目
    const project = projects.find(p => p.id == projectId);
    if (!project) return;
    
    // 更新关注状态
    if (followBtn && project.followers && project.followers.includes(currentUser.id)) {
        followBtn.innerHTML = '<i class="fas fa-star"></i> 已关注';
        followBtn.classList.add('following');
    }
    
    // 更新加入状态
    if (joinBtn) {
        if (project.members && project.members.includes(currentUser.id)) {
            joinBtn.innerHTML = '<i class="fas fa-users"></i> 已加入';
            joinBtn.classList.add('joined');
        } else if (project.applicants && project.applicants.includes(currentUser.id)) {
            joinBtn.innerHTML = '<i class="fas fa-clock"></i> 申请审核中';
            joinBtn.classList.add('pending');
        }
    }
}

/**
 * 初始化项目详情页面
 */
function initProjectDetailPage() {
    // 获取当前项目ID
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (!projectId) {
        showMessage('项目ID不存在', 'error');
        setTimeout(() => {
            window.location.href = 'projects.html';
        }, 2000);
        return;
    }
    
    // 获取项目数据
    const projects = getProjectsFromStorage();
    const project = projects.find(p => p.id == projectId);
    
    if (!project) {
        showMessage('项目不存在', 'error');
        setTimeout(() => {
            window.location.href = 'projects.html';
        }, 2000);
        return;
    }
    
    // 设置页面标题
    document.title = `${project.title} - 项目详情 - NexusOrbital`;
    
    // 填充项目基本信息
    document.getElementById('projectTitle').textContent = project.title || '未命名项目';
    document.getElementById('projectCategory').textContent = project.category || '未分类';
    document.getElementById('projectTitleHeader').textContent = project.title || '未命名项目';
    
    // 填充项目描述
    const descriptionElement = document.getElementById('projectDescription');
    if (descriptionElement) {
        descriptionElement.innerHTML = project.description || '暂无项目描述';
    }
    
    // 填充项目标签
    const tagsContainer = document.getElementById('projectTags');
    if (tagsContainer && project.tags && project.tags.length > 0) {
        tagsContainer.innerHTML = '';
        project.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'project-tag';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
    } else if (tagsContainer) {
        tagsContainer.innerHTML = '<span class="text-muted">暂无标签</span>';
    }
    
    // 更新统计数据
    updateProjectStats(project);
    
    // 更新项目进度
    updateProjectProgress(project);
    
    // 更新团队成员
    updateProjectTeam(project);
    
    // 更新项目动态
    updateProjectActivities(project);
    
    // 加载项目评论
    loadProjectComments(projectId);
    
    // 更新关注和加入状态
    updateProjectActionStatus();
    
    // 添加事件监听器
    addProjectDetailEventListeners();
}

/**
 * 更新项目统计数据
 */
function updateProjectStats(project) {
    // 确保followers, members, applicants存在
    if (!project.followers) project.followers = [];
    if (!project.members) project.members = [];
    if (!project.applicants) project.applicants = [];
    
    // 更新关注者数量
    const followersCount = document.getElementById('followersCount');
    if (followersCount) {
        followersCount.textContent = project.followers.length;
    }
    
    // 更新成员数量
    const membersCount = document.getElementById('membersCount');
    if (membersCount) {
        membersCount.textContent = project.members.length;
    }
    
    // 更新申请者数量（仅项目创建者可见）
    const applicantsCount = document.getElementById('applicantsCount');
    if (applicantsCount) {
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === project.creatorId) {
            applicantsCount.textContent = project.applicants.length;
            // 显示申请者管理区域
            const applicantsSection = document.getElementById('applicantsManagement');
            if (applicantsSection) {
                applicantsSection.classList.remove('d-none');
            }
        } else {
            // 隐藏申请者管理区域
            const applicantsSection = document.getElementById('applicantsManagement');
            if (applicantsSection) {
                applicantsSection.classList.add('d-none');
            }
        }
    }
}

/**
 * 更新项目进度
 */
function updateProjectProgress(project) {
    const progressBar = document.getElementById('projectProgress');
    const progressText = document.getElementById('progressText');
    
    if (progressBar && progressText) {
        const progress = project.progress || 0;
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
        progressText.textContent = `${progress}%`;
        
        // 根据进度设置颜色
        if (progress < 30) {
            progressBar.className = 'progress-bar bg-danger';
        } else if (progress < 70) {
            progressBar.className = 'progress-bar bg-warning';
        } else {
            progressBar.className = 'progress-bar bg-success';
        }
    }
}

/**
 * 更新项目团队成员
 */
function updateProjectTeam(project) {
    const teamContainer = document.getElementById('projectTeam');
    if (!teamContainer) return;
    
    // 清空团队容器
    teamContainer.innerHTML = '';
    
    // 如果没有成员
    if (!project.members || project.members.length === 0) {
        teamContainer.innerHTML = '<p class="text-muted">暂无团队成员</p>';
        return;
    }
    
    // 获取所有用户
    const users = getUsersFromStorage();
    
    // 添加团队成员
    project.members.forEach(memberId => {
        const member = users.find(u => u.id == memberId);
        if (!member) return;
        
        const memberCard = document.createElement('div');
        memberCard.className = 'col-md-4 mb-3';
        memberCard.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                        <img src="${member.avatar || 'img/default-avatar.png'}" alt="${member.username}" class="rounded-circle me-2" width="40" height="40">
                        <h5 class="card-title mb-0">${member.username}</h5>
                        ${member.id === project.creatorId ? '<span class="badge bg-success ms-2">创建者</span>' : ''}
                    </div>
                    <p class="card-text">${member.bio || '暂无简介'}</p>
                    <div class="d-flex justify-content-end">
                        <a href="profile.html?id=${member.id}" class="btn btn-sm btn-outline-primary">查看资料</a>
                    </div>
                </div>
            </div>
        `;
        teamContainer.appendChild(memberCard);
    });
}

/**
 * 更新项目动态
 */
function updateProjectActivities(project) {
    const activitiesContainer = document.getElementById('projectActivities');
    if (!activitiesContainer) return;
    
    // 清空动态容器
    activitiesContainer.innerHTML = '';
    
    // 如果没有动态
    if (!project.activities || project.activities.length === 0) {
        activitiesContainer.innerHTML = '<p class="text-muted">暂无项目动态</p>';
        return;
    }
    
    // 获取所有用户
    const users = getUsersFromStorage();
    
    // 添加项目动态
    project.activities.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(activity => {
        const user = users.find(u => u.id == activity.userId) || { username: '匿名用户', avatar: 'images/default-avatar.jpg' };
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item mb-3 p-3 border-bottom';
        activityItem.innerHTML = `
            <div class="d-flex align-items-center mb-2">
                <img src="${user.avatar || 'images/default-avatar.jpg'}" alt="${user.username}" class="rounded-circle me-2" width="32" height="32">
                <strong>${user.username}</strong>
                <span class="text-muted ms-2">${formatDate(activity.date)}</span>
            </div>
            <p>${activity.content}</p>
        `;
        activitiesContainer.appendChild(activityItem);
    });
}

/**
 * 加载项目评论
 * @param {string} projectId 项目ID
 */
function loadProjectComments(projectId) {
    const commentsContainer = document.getElementById('commentsList');
    if (!commentsContainer) return;
    
    // 清空评论容器
    commentsContainer.innerHTML = '';
    
    // 获取评论数据
    const comments = getProjectComments(projectId);
    
    // 如果没有评论
    if (comments.length === 0) {
        commentsContainer.innerHTML = '<div class="no-comments"><i class="fas fa-comments"></i><p>暂无评论，成为第一个评论者吧！</p></div>';
        return;
    }
    
    // 获取所有用户
    const users = getUsersFromStorage();
    
    // 添加评论
    comments.forEach(comment => {
        const user = users.find(u => u.id === comment.userId) || { username: '匿名用户', avatar: 'images/default-avatar.jpg' };
        const commentElement = createCommentElement(comment, user);
        commentsContainer.appendChild(commentElement);
    });
}

/**
 * 创建评论元素
 * @param {Object} comment 评论数据
 * @param {Object} user 用户数据
 * @returns {HTMLElement} 评论元素
 */
function createCommentElement(comment, user) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';
    
    commentDiv.innerHTML = `
        <div class="comment-user">
            <img src="${user.avatar || 'images/default-avatar.jpg'}" alt="${user.username}" class="user-avatar">
            <div class="user-info">
                <h4>${user.username}</h4>
                <span class="comment-date">${formatDate(comment.date)}</span>
            </div>
        </div>
        <div class="comment-content">
            <p>${comment.content}</p>
        </div>
    `;
    
    return commentDiv;
}

/**
 * 提交项目评论
 */
function submitProjectComment() {
    const commentText = document.getElementById('commentText');
    if (!commentText || !commentText.value.trim()) {
        showMessage('请输入评论内容', 'warning');
        return;
    }
    
    // 获取当前用户
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showMessage('请先登录后再评论', 'warning');
        return;
    }
    
    // 获取项目ID
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (!projectId) {
        showMessage('项目ID无效', 'error');
        return;
    }
    
    // 创建评论对象
    const newComment = {
        id: Date.now().toString(),
        userId: currentUser.id,
        content: commentText.value.trim(),
        date: new Date().toISOString()
    };
    
    // 获取并更新评论
    const comments = getProjectComments(projectId);
    comments.push(newComment);
    saveProjectComments(projectId, comments);
    
    // 重新加载评论
    loadProjectComments(projectId);
    
    // 清空评论框
    commentText.value = '';
    
    // 显示成功消息
    showMessage('评论发布成功', 'success');
    
    // 更新项目动态
    updateProjectActivity(projectId, `发表了评论: "${newComment.content.substring(0, 30)}${newComment.content.length > 30 ? '...' : ''}"`);
}

/**
 * 获取项目评论
 * @param {string} projectId 项目ID
 * @returns {Array} 评论数组
 */
function getProjectComments(projectId) {
    const commentsData = localStorage.getItem(`project_comments_${projectId}`);
    return commentsData ? JSON.parse(commentsData) : [];
}

/**
 * 保存项目评论
 * @param {string} projectId 项目ID
 * @param {Array} comments 评论数组
 */
function saveProjectComments(projectId, comments) {
    localStorage.setItem(`project_comments_${projectId}`, JSON.stringify(comments));
}

/**
 * 添加项目详情页面的事件监听器
 */
function addProjectDetailEventListeners() {
    // 关注项目按钮
    const followBtn = document.getElementById('followProjectBtn');
    if (followBtn) {
        followBtn.addEventListener('click', toggleFollowProject);
    }
    
    // 加入项目按钮
    const joinBtn = document.getElementById('joinProjectBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', applyToJoinProject);
    }
    
    // 返回按钮
    const backBtn = document.getElementById('backToProjects');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'projects.html';
        });
    }
    
    // 编辑项目按钮
    const editBtn = document.getElementById('editProjectBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const projectId = new URLSearchParams(window.location.search).get('id');
            window.location.href = `edit-project.html?id=${projectId}`;
        });
        
        // 检查当前用户是否是项目创建者
        const projectId = new URLSearchParams(window.location.search).get('id');
        const projects = getProjectsFromStorage();
        const project = projects.find(p => p.id == projectId);
        const currentUser = getCurrentUser();
        
        if (project && currentUser && project.creatorId === currentUser.id) {
            editBtn.classList.remove('d-none');
        } else {
            editBtn.classList.add('d-none');
        }
    }
    
    // 提交评论按钮
    const submitCommentBtn = document.getElementById('submitComment');
    if (submitCommentBtn) {
        submitCommentBtn.addEventListener('click', submitProjectComment);
    }
    
    // 刷新评论按钮
    const refreshCommentsBtn = document.getElementById('refreshComments');
    if (refreshCommentsBtn) {
        refreshCommentsBtn.addEventListener('click', refreshProjectComments);
    }
}

/**
 * 刷新项目评论
 */
function refreshProjectComments() {
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (projectId) {
        loadProjectComments(projectId);
        showMessage('评论已刷新', 'info');
    }
}

/**
 * 格式化日期
 */
function formatDate(dateString) {
    if (!dateString) return '未知时间';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 获取当前用户
 */
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

/**
 * 获取所有用户
 */
function getUsersFromStorage() {
    const usersData = localStorage.getItem('users');
    return usersData ? JSON.parse(usersData) : [];
}

/**
 * 显示消息提示
 */
function showMessage(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '1050';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);
    
    // 3秒后自动关闭
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(alertDiv);
        }, 150);
    }, 3000);
}

// 当文档加载完成时初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 检查当前页面
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'projects.html') {
        // 初始化项目列表页面
        loadProjects();
        
        // 添加搜索框事件监听器
        const searchInput = document.getElementById('projectSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function() {
                loadProjects();
            }, 300));
        }
        
        // 添加排序选择器事件监听器
        const sortSelect = document.getElementById('projectSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                loadProjects();
            });
        }
        
        // 更新筛选标签
        updateFilterTags();
    } else if (currentPage === 'project-detail.html') {
        // 初始化项目详情页面
        initProjectDetailPage();
    }
});

/**
 * 获取项目评论
 * @param {string} projectId 项目ID
 * @returns {Array} 评论数组
 */
function getProjectComments(projectId) {
    const commentsData = localStorage.getItem(`project_comments_${projectId}`);
    return commentsData ? JSON.parse(commentsData) : [];
}

/**
 * 保存项目评论
 * @param {string} projectId 项目ID
 * @param {Array} comments 评论数组
 */
function saveProjectComments(projectId, comments) {
    localStorage.setItem(`project_comments_${projectId}`, JSON.stringify(comments));
}

/**
 * 加载项目评论
 * @param {string} projectId 项目ID
 */
function loadProjectComments(projectId) {
    const commentsContainer = document.getElementById('commentsList');
    if (!commentsContainer) return;
    
    // 清空评论容器
    commentsContainer.innerHTML = '';
    
    // 获取评论数据
    const comments = getProjectComments(projectId);
    
    // 如果没有评论
    if (comments.length === 0) {
        commentsContainer.innerHTML = '<div class="no-comments"><i class="fas fa-comments"></i><p>暂无评论，成为第一个评论者吧！</p></div>';
        return;
    }
    
    // 获取所有用户
    const users = getUsersFromStorage();
    
    // 添加评论
    comments.forEach(comment => {
        const user = users.find(u => u.id === comment.userId) || { username: '匿名用户', avatar: 'images/default-avatar.jpg' };
        const commentElement = createCommentElement(comment, user);
        commentsContainer.appendChild(commentElement);
    });
}

/**
 * 创建评论元素
 * @param {Object} comment 评论数据
 * @param {Object} user 用户数据
 * @returns {HTMLElement} 评论元素
 */
function createCommentElement(comment, user) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';
    
    commentDiv.innerHTML = `
        <div class="comment-user">
            <img src="${user.avatar || 'images/default-avatar.jpg'}" alt="${user.username}" class="user-avatar">
            <div class="user-info">
                <h4>${user.username}</h4>
                <span class="comment-date">${formatDate(comment.date)}</span>
            </div>
        </div>
        <div class="comment-content">
            <p>${comment.content}</p>
        </div>
    `;
    
    return commentDiv;
}

/**
 * 提交项目评论
 */
function submitProjectComment() {
    const commentText = document.getElementById('commentText');
    if (!commentText || !commentText.value.trim()) {
        showMessage('请输入评论内容', 'warning');
        return;
    }
    
    // 获取当前用户
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showMessage('请先登录后再评论', 'warning');
        return;
    }
    
    // 获取项目ID
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (!projectId) {
        showMessage('项目ID无效', 'error');
        return;
    }
    
    // 创建评论对象
    const newComment = {
        id: Date.now().toString(),
        userId: currentUser.id,
        content: commentText.value.trim(),
        date: new Date().toISOString()
    };
    
    // 获取并更新评论
    const comments = getProjectComments(projectId);
    comments.push(newComment);
    saveProjectComments(projectId, comments);
    
    // 重新加载评论
    loadProjectComments(projectId);
    
    // 清空评论框
    commentText.value = '';
    
    // 显示成功消息
    showMessage('评论发布成功', 'success');
    
    // 更新项目动态
    updateProjectActivity(projectId, `发表了评论: "${newComment.content.substring(0, 30)}${newComment.content.length > 30 ? '...' : ''}"`);
}

/**
 * 更新项目动态
 * @param {string} projectId 项目ID
 * @param {string} activityContent 动态内容
 */
function updateProjectActivity(projectId, activityContent) {
    // 获取当前用户
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // 获取项目
    const projects = getProjectsFromStorage();
    const projectIndex = projects.findIndex(p => p.id == projectId);
    if (projectIndex === -1) return;
    
    // 确保项目有activities数组
    if (!projects[projectIndex].activities) {
        projects[projectIndex].activities = [];
    }
    
    // 添加新动态
    projects[projectIndex].activities.push({
        id: Date.now().toString(),
        userId: currentUser.id,
        content: activityContent,
        date: new Date().toISOString()
    });
    
    // 保存项目
    localStorage.setItem('projects', JSON.stringify(projects));
    
    // 如果在项目详情页面，更新动态显示
    if (window.location.pathname.includes('project-detail.html')) {
        updateProjectActivities(projects[projectIndex]);
    }
}

/**
 * 刷新项目评论
 */
function refreshProjectComments() {
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (projectId) {
        loadProjectComments(projectId);
        showMessage('评论已刷新', 'info');
    }
}

/**
 * 创建项目卡片
 * @param {Object} project 项目数据
 * @returns {HTMLElement} 项目卡片元素
 */
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    // 检查用户是否已关注项目
    const isFollowing = currentUser && project.followers && project.followers.includes(currentUser.id);
    
    // 检查用户是否已参与项目
    const isMember = currentUser && project.members && project.members.some(member => member.id === currentUser.id);
    
    // 格式化标签
    let tagsHTML = '';
    if (project.tags && project.tags.length > 0) {
        tagsHTML = project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('');
    }
    
    // 计算统计数据
    const membersCount = project.members ? project.members.length : 0;
    const followersCount = project.followers ? project.followers.length : 0;
    const progress = project.progress || 0;
    
    card.innerHTML = `
        <div class="project-image">
            <img src="${project.image}" alt="${project.title}">
            <div class="project-category">${project.category}</div>
            <div class="project-actions">
                <button class="action-btn follow-btn ${isFollowing ? 'active' : ''}" data-project-id="${project.id}">
                    <i class="fas ${isFollowing ? 'fa-star' : 'fa-star-o'}"></i>
                </button>
                <button class="action-btn share-btn" data-project-id="${project.id}">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
        <div class="project-content">
            <h3>${project.title}</h3>
            <p>${project.summary}</p>
            <div class="project-tags">
                ${tagsHTML}
            </div>
            <div class="project-stats">
                <div class="stat">
                    <i class="fas fa-users"></i>
                    <span>${membersCount}人</span>
                </div>
                <div class="stat">
                    <i class="fas fa-tasks"></i>
                    <span>${progress}%</span>
                </div>
                <div class="stat">
                    <i class="fas fa-star"></i>
                    <span>${followersCount}</span>
                </div>
            </div>
            <div class="project-buttons">
                <a href="project-detail.html?id=${project.id}" class="btn btn-primary">查看详情</a>
                ${!isMember ? `<button class="btn btn-outline join-btn" data-project-id="${project.id}">申请参与</button>` : ''}
            </div>
        </div>
    `;
    
    // 添加关注按钮事件
    const followBtn = card.querySelector('.follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFollowProject(project.id);
        });
    }
    
    // 添加分享按钮事件
    const shareBtn = card.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            shareProject(project.id);
        });
    }
    
    // 添加参与按钮事件
    const joinBtn = card.querySelector('.join-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            joinProject(project.id);
        });
    }
    
    return card;
}

/**
 * 切换关注项目状态
 * @param {number} projectId 项目ID
 */
function toggleFollowProject(projectId) {
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    // 如果用户未登录，提示登录
    if (!currentUser) {
        showLoginPrompt('关注项目');
        return;
    }
    
    // 获取项目数据
    const projects = getProjectsFromStorage();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) return;
    
    // 初始化followers数组（如果不存在）
    if (!projects[projectIndex].followers) {
        projects[projectIndex].followers = [];
    }
    
    // 检查用户是否已关注项目
    const followerIndex = projects[projectIndex].followers.indexOf(currentUser.id);
    
    if (followerIndex === -1) {
        // 添加关注
        projects[projectIndex].followers.push(currentUser.id);
        
        // 添加项目活动
        addProjectActivity(projectId, {
            type: 'follow',
            userId: currentUser.id,
            username: currentUser.username,
            timestamp: new Date().toISOString()
        });
        
        showMessage('已成功关注项目', 'success');
    } else {
        // 取消关注
        projects[projectIndex].followers.splice(followerIndex, 1);
        showMessage('已取消关注项目', 'info');
    }
    
    // 保存项目数据
    localStorage.setItem('projects', JSON.stringify(projects));
    
    // 重新加载项目
    loadProjects();
}

/**
 * 申请参与项目
 * @param {number} projectId 项目ID
 */
function joinProject(projectId) {
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    // 如果用户未登录，提示登录
    if (!currentUser) {
        showLoginPrompt('参与项目');
        return;
    }
    
    // 获取项目数据
    const projects = getProjectsFromStorage();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) return;
    
    // 初始化申请列表（如果不存在）
    if (!projects[projectIndex].applications) {
        projects[projectIndex].applications = [];
    }
    
    // 检查用户是否已申请参与
    const existingApplication = projects[projectIndex].applications.find(app => app.userId === currentUser.id);
    
    if (existingApplication) {
        showMessage('您已申请参与该项目，请等待审核', 'info');
        return;
    }
    
    // 添加申请
    projects[projectIndex].applications.push({
        userId: currentUser.id,
        username: currentUser.username,
        status: 'pending',
        timestamp: new Date().toISOString()
    });
    
    // 添加项目活动
    addProjectActivity(projectId, {
        type: 'apply',
        userId: currentUser.id,
        username: currentUser.username,
        timestamp: new Date().toISOString()
    });
    
    // 保存项目数据
    localStorage.setItem('projects', JSON.stringify(projects));
    
    showMessage('已成功申请参与项目，请等待审核', 'success');
}

/**
 * 分享项目
 * @param {number} projectId 项目ID
 */
function shareProject(projectId) {
    // 获取项目数据
    const projects = getProjectsFromStorage();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    // 创建分享链接
    const shareUrl = `${window.location.origin}/project-detail.html?id=${projectId}`;
    
    // 创建分享弹窗
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    
    modal.innerHTML = `
        <div class="share-content">
            <div class="share-header">
                <h3>分享项目</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="share-body">
                <p>分享 "${project.title}" 到：</p>
                <div class="share-options">
                    <button class="share-option" data-platform="weixin">
                        <i class="fab fa-weixin"></i>
                        <span>微信</span>
                    </button>
                    <button class="share-option" data-platform="weibo">
                        <i class="fab fa-weibo"></i>
                        <span>微博</span>
                    </button>
                    <button class="share-option" data-platform="qq">
                        <i class="fab fa-qq"></i>
                        <span>QQ</span>
                    </button>
                    <button class="share-option" data-platform="linkedin">
                        <i class="fab fa-linkedin"></i>
                        <span>LinkedIn</span>
                    </button>
                </div>
                <div class="share-link">
                    <p>或复制链接：</p>
                    <div class="link-input">
                        <input type="text" value="${shareUrl}" readonly>
                        <button class="copy-btn">复制</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 显示弹窗
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // 关闭按钮事件
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    // 复制链接按钮事件
    const copyBtn = modal.querySelector('.copy-btn');
    const linkInput = modal.querySelector('input');
    
    copyBtn.addEventListener('click', () => {
        linkInput.select();
        document.execCommand('copy');
        copyBtn.textContent = '已复制';
        setTimeout(() => {
            copyBtn.textContent = '复制';
        }, 2000);
    });
    
    // 分享选项事件
    const shareOptions = modal.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
        option.addEventListener('click', () => {
            const platform = option.dataset.platform;
            // 这里可以根据不同平台实现不同的分享逻辑
            // 简化版本，仅显示提示
            showMessage(`已分享到${option.querySelector('span').textContent}`, 'success');
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
    });
}

/**
 * 显示登录提示
 * @param {string} action 操作名称
 */
function showLoginPrompt(action) {
    // 创建登录提示弹窗
    const modal = document.createElement('div');
    modal.className = 'login-modal';
    
    modal.innerHTML = `
        <div class="login-content">
            <div class="login-header">
                <h3>需要登录</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="login-body">
                <p>您需要登录才能${action}。</p>
                <div class="login-buttons">
                    <a href="login.html" class="btn btn-primary">登录</a>
                    <a href="register.html" class="btn btn-outline">注册</a>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 显示弹窗
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // 关闭按钮事件
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
}

/**
 * 添加项目活动
 * @param {number} projectId 项目ID
 * @param {Object} activity 活动数据
 */
function addProjectActivity(projectId, activity) {
    // 获取项目数据
    const projects = getProjectsFromStorage();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
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

/**
 * 显示消息提示
 * @param {string} message 消息内容
 * @param {string} type 消息类型（success, error, info, warning）
 */
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.innerHTML = `
        <div class="message-content">
            <i class="fas ${getIconForMessageType(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加到页面
    const messagesContainer = document.querySelector('.messages-container');
    if (!messagesContainer) {
        // 如果不存在消息容器，则创建一个
        const container = document.createElement('div');
        container.className = 'messages-container';
        container.appendChild(messageElement);
        document.body.appendChild(container);
    } else {
        messagesContainer.appendChild(messageElement);
    }
    
    // 显示消息
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 10);
    
    // 自动关闭消息
    setTimeout(() => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            messageElement.remove();
            // 如果消息容器为空，则移除容器
            const container = document.querySelector('.messages-container');
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * 获取消息类型对应的图标
 * @param {string} type 消息类型
 * @returns {string} 图标类名
 */
function getIconForMessageType(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-times-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        case 'info':
        default:
            return 'fa-info-circle';
    }
}
