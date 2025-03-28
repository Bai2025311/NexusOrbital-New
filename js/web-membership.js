/**
 * NexusOrbital 会员系统功能
 * 包含用户注册、登录、会员中心功能
 */

// 模拟用户数据 - 实际项目中应从后端获取
const mockUsers = [
    {
        id: 1,
        name: "张明",
        email: "zhangming@example.com",
        password: "password123", // 实际项目中应使用加密存储
        avatar: "../images/avatars/avatar-1.jpg",
        level: "创始会员",
        joinDate: "2023-05-15",
        bio: "太空建筑工程师，专注于月球基地结构设计",
        company: "星际建筑集团",
        location: "上海",
        phone: "13800138000",
        website: "https://example.com",
        github: "zhangming",
        twitter: "zhangming_space",
        linkedin: "zhangming-space",
        projects: [
            {
                id: 101,
                title: "月球居住舱设计",
                description: "针对月球环境特点设计的长期居住舱，解决辐射防护和温度控制问题",
                image: "../images/projects/lunar-habitat.jpg",
                progress: 75,
                contributors: 8,
                likes: 42,
                lastUpdate: "2023-11-20"
            },
            {
                id: 102,
                title: "火星土壤建材研究",
                description: "研究利用火星土壤制作建筑材料的可行性，降低太空建筑的物资运输成本",
                image: "../images/projects/mars-soil.jpg",
                progress: 45,
                contributors: 5,
                likes: 28,
                lastUpdate: "2023-12-05"
            }
        ],
        activities: [
            {
                id: 1001,
                type: "project",
                action: "创建了新项目",
                target: "月球居住舱设计",
                time: "2023-11-15 14:30"
            },
            {
                id: 1002,
                type: "comment",
                action: "评论了项目",
                target: "太空电梯概念设计",
                time: "2023-11-18 09:45"
            },
            {
                id: 1003,
                type: "resource",
                action: "分享了资源",
                target: "太空辐射防护材料研究报告",
                time: "2023-11-25 16:20"
            },
            {
                id: 1004,
                type: "project",
                action: "更新了项目",
                target: "月球居住舱设计",
                time: "2023-12-01 11:10"
            }
        ],
        subscription: {
            plan: "创始会员计划",
            startDate: "2023-05-15",
            nextBilling: "2024-05-15",
            features: [
                "无限访问所有技术资源",
                "优先参与众筹项目",
                "专家社区直接交流",
                "每月专属线上活动",
                "项目协作工具高级功能",
                "创始会员专属徽章"
            ]
        },
        stats: {
            projects: 2,
            contributions: 15,
            resources: 8,
            connections: 47
        }
    }
];

// 当前登录用户
let currentUser = null;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initAuthForms();
    initMemberDashboard();
    checkLoginStatus();
    initFAQInteraction();
    initMembershipTierButtons();
});

/**
 * 初始化认证表单
 */
function initAuthForms() {
    // 登录表单提交
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('remember-me').checked;
            
            loginUser(email, password, rememberMe);
        });
    }
    
    // 注册表单提交
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const agreeTerms = document.getElementById('agree-terms').checked;
            
            if (password !== confirmPassword) {
                showNotification('两次输入的密码不一致', 'error');
                return;
            }
            
            if (!agreeTerms) {
                showNotification('请同意用户协议和隐私政策', 'error');
                return;
            }
            
            registerUser(name, email, password);
        });
    }
    
    // 切换登录/注册表单
    const authToggleLinks = document.querySelectorAll('.auth-alt a');
    authToggleLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const loginContainer = document.getElementById('login-container');
            const registerContainer = document.getElementById('register-container');
            
            if (loginContainer && registerContainer) {
                loginContainer.classList.toggle('hidden');
                registerContainer.classList.toggle('hidden');
            }
        });
    });
}

/**
 * 用户登录
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @param {boolean} rememberMe - 是否记住登录状态
 */
function loginUser(email, password, rememberMe) {
    // 模拟API请求 - 实际项目中应使用后端验证
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        // 登录成功
        currentUser = user;
        
        // 存储登录状态 - 实际项目中应使用更安全的方式如JWT
        if (rememberMe) {
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                level: user.level
            }));
        } else {
            sessionStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                level: user.level
            }));
        }
        
        showNotification('登录成功，欢迎回来！', 'success');
        
        // 显示会员中心，隐藏登录表单
        const authSection = document.getElementById('auth-section');
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (authSection && dashboardSection) {
            authSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            
            // 加载用户数据到会员中心
            loadUserDashboard(user);
        }
    } else {
        // 登录失败
        showNotification('邮箱或密码错误，请重试', 'error');
    }
}

/**
 * 用户注册
 * @param {string} name - 用户名
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 */
function registerUser(name, email, password) {
    // 检查邮箱是否已被注册
    const existingUser = mockUsers.find(u => u.email === email);
    
    if (existingUser) {
        showNotification('该邮箱已被注册', 'error');
        return;
    }
    
    // 模拟API请求 - 实际项目中应发送到后端
    const newUser = {
        id: mockUsers.length + 1,
        name: name,
        email: email,
        password: password, // 实际项目中应加密存储
        avatar: "../images/avatars/default-avatar.jpg",
        level: "普通会员",
        joinDate: new Date().toISOString().split('T')[0],
        bio: "",
        company: "",
        location: "",
        phone: "",
        website: "",
        github: "",
        twitter: "",
        linkedin: "",
        projects: [],
        activities: [
            {
                id: 1001,
                type: "account",
                action: "注册成为会员",
                target: "NexusOrbital平台",
                time: new Date().toLocaleString('zh-CN')
            }
        ],
        subscription: {
            plan: "免费计划",
            startDate: new Date().toISOString().split('T')[0],
            nextBilling: "-",
            features: [
                "基础技术资源访问",
                "参与公开项目讨论",
                "浏览专家目录"
            ]
        },
        stats: {
            projects: 0,
            contributions: 0,
            resources: 0,
            connections: 0
        }
    };
    
    // 添加新用户到模拟数据库
    mockUsers.push(newUser);
    
    // 自动登录新用户
    currentUser = newUser;
    sessionStorage.setItem('currentUser', JSON.stringify({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        level: newUser.level
    }));
    
    showNotification('注册成功，欢迎加入NexusOrbital！', 'success');
    
    // 显示会员中心，隐藏注册表单
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (authSection && dashboardSection) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        
        // 加载用户数据到会员中心
        loadUserDashboard(newUser);
    }
}

/**
 * 检查用户登录状态
 */
function checkLoginStatus() {
    // 从本地存储或会话存储中获取用户信息
    const storedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        // 根据ID获取完整用户数据 - 实际项目中应从后端获取
        const user = mockUsers.find(u => u.id === userData.id);
        
        if (user) {
            currentUser = user;
            
            // 显示会员中心，隐藏登录表单
            const authSection = document.getElementById('auth-section');
            const dashboardSection = document.getElementById('dashboard-section');
            
            if (authSection && dashboardSection) {
                authSection.classList.add('hidden');
                dashboardSection.classList.remove('hidden');
                
                // 加载用户数据到会员中心
                loadUserDashboard(user);
            }
        }
    }
}

/**
 * 用户登出
 */
function logoutUser() {
    // 清除登录状态
    currentUser = null;
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    
    // 显示登录表单，隐藏会员中心
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (authSection && dashboardSection) {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        
        // 显示登录表单，隐藏注册表单
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');
        
        if (loginContainer && registerContainer) {
            loginContainer.classList.remove('hidden');
            registerContainer.classList.add('hidden');
        }
    }
    
    showNotification('您已成功登出', 'success');
}

/**
 * 初始化会员中心
 */
function initMemberDashboard() {
    // 菜单切换
    const menuItems = document.querySelectorAll('.dashboard-menu li');
    const panels = document.querySelectorAll('.dashboard-panel');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // 移除所有菜单项的active类
            menuItems.forEach(i => i.classList.remove('active'));
            
            // 添加当前菜单项的active类
            item.classList.add('active');
            
            // 获取目标面板ID
            const targetPanelId = item.getAttribute('data-panel');
            
            // 隐藏所有面板
            panels.forEach(panel => panel.classList.remove('active'));
            
            // 显示目标面板
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
    
    // 个人资料表单提交
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!currentUser) return;
            
            // 获取表单数据
            currentUser.name = document.getElementById('profile-name').value;
            currentUser.bio = document.getElementById('profile-bio').value;
            currentUser.company = document.getElementById('profile-company').value;
            currentUser.location = document.getElementById('profile-location').value;
            currentUser.phone = document.getElementById('profile-phone').value;
            currentUser.website = document.getElementById('profile-website').value;
            currentUser.github = document.getElementById('profile-github').value;
            currentUser.twitter = document.getElementById('profile-twitter').value;
            currentUser.linkedin = document.getElementById('profile-linkedin').value;
            
            // 更新存储的用户信息
            const storedUserData = {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                level: currentUser.level
            };
            
            if (localStorage.getItem('currentUser')) {
                localStorage.setItem('currentUser', JSON.stringify(storedUserData));
            } else {
                sessionStorage.setItem('currentUser', JSON.stringify(storedUserData));
            }
            
            // 更新用户信息显示
            document.querySelector('.user-info h3').textContent = currentUser.name;
            
            showNotification('个人资料已更新', 'success');
        });
    }
    
    // 登出按钮
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logoutUser();
        });
    }
}

/**
 * 加载用户数据到会员中心
 * @param {Object} user - 用户数据
 */
function loadUserDashboard(user) {
    if (!user) return;
    
    // 更新用户基本信息
    const userAvatar = document.querySelector('.user-avatar img');
    const userName = document.querySelector('.user-info h3');
    const userEmail = document.querySelector('.user-info p');
    const userLevel = document.querySelector('.level-badge');
    
    if (userAvatar) userAvatar.src = user.avatar;
    if (userName) userName.textContent = user.name;
    if (userEmail) userEmail.textContent = user.email;
    if (userLevel) userLevel.textContent = user.level;
    
    // 更新统计数据
    const projectsCount = document.getElementById('projects-count');
    const contributionsCount = document.getElementById('contributions-count');
    const resourcesCount = document.getElementById('resources-count');
    const connectionsCount = document.getElementById('connections-count');
    
    if (projectsCount) projectsCount.textContent = user.stats.projects;
    if (contributionsCount) contributionsCount.textContent = user.stats.contributions;
    if (resourcesCount) resourcesCount.textContent = user.stats.resources;
    if (connectionsCount) connectionsCount.textContent = user.stats.connections;
    
    // 加载最近活动
    loadRecentActivities(user.activities);
    
    // 加载项目
    loadUserProjects(user.projects);
    
    // 加载个人资料表单
    const profileName = document.getElementById('profile-name');
    const profileBio = document.getElementById('profile-bio');
    const profileCompany = document.getElementById('profile-company');
    const profileLocation = document.getElementById('profile-location');
    const profilePhone = document.getElementById('profile-phone');
    const profileWebsite = document.getElementById('profile-website');
    const profileGithub = document.getElementById('profile-github');
    const profileTwitter = document.getElementById('profile-twitter');
    const profileLinkedin = document.getElementById('profile-linkedin');
    
    if (profileName) profileName.value = user.name;
    if (profileBio) profileBio.value = user.bio;
    if (profileCompany) profileCompany.value = user.company;
    if (profileLocation) profileLocation.value = user.location;
    if (profilePhone) profilePhone.value = user.phone;
    if (profileWebsite) profileWebsite.value = user.website;
    if (profileGithub) profileGithub.value = user.github;
    if (profileTwitter) profileTwitter.value = user.twitter;
    if (profileLinkedin) profileLinkedin.value = user.linkedin;
    
    // 加载订阅信息
    loadSubscriptionInfo(user.subscription);
}

/**
 * 加载用户最近活动
 * @param {Array} activities - 活动数据
 */
function loadRecentActivities(activities) {
    const activityList = document.querySelector('.activity-list');
    if (!activityList || !activities) return;
    
    // 清空现有活动
    activityList.innerHTML = '';
    
    // 按时间排序，最新的在前
    const sortedActivities = [...activities].sort((a, b) => {
        return new Date(b.time) - new Date(a.time);
    });
    
    // 最多显示5条
    const recentActivities = sortedActivities.slice(0, 5);
    
    // 添加活动项
    recentActivities.forEach(activity => {
        const iconClass = getActivityIconClass(activity.type);
        
        const activityItem = document.createElement('li');
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="activity-info">
                <p>${activity.action} <a href="#">${activity.target}</a></p>
                <span class="activity-time">${activity.time}</span>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

/**
 * 根据活动类型获取图标类名
 * @param {string} type - 活动类型
 * @returns {string} 图标类名
 */
function getActivityIconClass(type) {
    switch (type) {
        case 'project':
            return 'fas fa-project-diagram';
        case 'comment':
            return 'fas fa-comment';
        case 'resource':
            return 'fas fa-file-alt';
        case 'account':
            return 'fas fa-user';
        default:
            return 'fas fa-star';
    }
}

/**
 * 加载用户项目
 * @param {Array} projects - 项目数据
 */
function loadUserProjects(projects) {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid || !projects) return;
    
    // 清空现有项目
    projectsGrid.innerHTML = '';
    
    if (projects.length === 0) {
        projectsGrid.innerHTML = '<p class="text-center">您还没有创建或参与任何项目</p>';
        return;
    }
    
    // 添加项目卡片
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
            <div class="project-header">
                <img src="${project.image}" alt="${project.title}">
                <div class="project-actions">
                    <button class="action-btn" title="编辑项目">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" title="分享项目">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
            <div class="project-body">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="project-meta">
                    <span><i class="fas fa-users"></i> ${project.contributors} 贡献者</span>
                    <span><i class="fas fa-heart"></i> ${project.likes} 赞</span>
                </div>
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${project.progress}%"></div>
                    </div>
                    <span>${project.progress}%</span>
                </div>
            </div>
            <div class="project-footer">
                <button class="btn-secondary">查看详情</button>
            </div>
        `;
        
        projectsGrid.appendChild(projectCard);
    });
}

/**
 * 加载订阅信息
 * @param {Object} subscription - 订阅数据
 */
function loadSubscriptionInfo(subscription) {
    if (!subscription) return;
    
    // 更新当前计划信息
    const currentPlanBadge = document.getElementById('current-plan-badge');
    const startDateElement = document.getElementById('subscription-start-date');
    const renewalDateElement = document.getElementById('subscription-renewal-date');
    
    if (currentPlanBadge) {
        currentPlanBadge.textContent = subscription.plan;
    }
    
    if (startDateElement) {
        startDateElement.textContent = subscription.startDate;
    }
    
    if (renewalDateElement) {
        renewalDateElement.textContent = subscription.nextBilling;
    }
    
    // 加载会员权益列表
    const benefitsList = document.getElementById('benefits-list');
    if (benefitsList && subscription.features && subscription.features.length > 0) {
        benefitsList.innerHTML = '';
        
        subscription.features.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check-circle"></i> ${feature}`;
            benefitsList.appendChild(li);
        });
    }
    
    // 为订阅相关按钮添加事件监听
    setupSubscriptionActions();
}

/**
 * 设置订阅相关按钮的事件监听
 */
function setupSubscriptionActions() {
    // 管理订阅按钮
    const manageSubscriptionBtn = document.querySelector('.subscription-actions .btn-outline');
    if (manageSubscriptionBtn) {
        manageSubscriptionBtn.addEventListener('click', () => {
            showNotification('订阅管理功能即将上线，敬请期待！', 'info');
        });
    }
    
    // 查看账单历史按钮
    const viewBillingHistoryBtn = document.querySelector('.subscription-actions .btn-text');
    if (viewBillingHistoryBtn) {
        viewBillingHistoryBtn.addEventListener('click', () => {
            showNotification('账单历史功能即将上线，敬请期待！', 'info');
        });
    }
    
    // 升级到专业会员按钮
    const upgradeBtn = document.querySelector('.btn-upgrade');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            showUpgradeConfirmation();
        });
    }
    
    // 联系客服链接
    const contactSupportLink = document.querySelector('.contact-support');
    if (contactSupportLink) {
        contactSupportLink.addEventListener('click', (e) => {
            e.preventDefault();
            showContactSupportForm();
        });
    }
}

/**
 * 显示升级确认对话框
 */
function showUpgradeConfirmation() {
    // 创建模态对话框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h3>升级到专业会员</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <p>您确定要升级到专业会员计划吗？</p>
                <div class="upgrade-details">
                    <div class="upgrade-detail">
                        <span class="detail-label">计划:</span>
                        <span class="detail-value">专业会员</span>
                    </div>
                    <div class="upgrade-detail">
                        <span class="detail-label">价格:</span>
                        <span class="detail-value">¥599/年</span>
                    </div>
                    <div class="upgrade-detail">
                        <span class="detail-label">当前计划:</span>
                        <span class="detail-value">创始会员 (¥299/年)</span>
                    </div>
                    <div class="upgrade-detail">
                        <span class="detail-label">差价:</span>
                        <span class="detail-value">¥300</span>
                    </div>
                </div>
                <div class="payment-methods">
                    <h4>选择支付方式</h4>
                    <div class="payment-options">
                        <label class="payment-option">
                            <input type="radio" name="payment-method" value="alipay" checked>
                            <span class="payment-icon"><i class="fab fa-alipay"></i></span>
                            <span class="payment-name">支付宝</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment-method" value="wechat">
                            <span class="payment-icon"><i class="fab fa-weixin"></i></span>
                            <span class="payment-name">微信支付</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment-method" value="creditcard">
                            <span class="payment-icon"><i class="fas fa-credit-card"></i></span>
                            <span class="payment-name">信用卡</span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">取消</button>
                <button class="btn-primary modal-confirm">确认升级</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加事件监听
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const confirmBtn = modal.querySelector('.modal-confirm');
    
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
        const selectedPayment = modal.querySelector('input[name="payment-method"]:checked').value;
        processUpgrade(selectedPayment);
        closeModal();
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

/**
 * 处理升级请求
 * @param {string} paymentMethod - 支付方式
 */
function processUpgrade(paymentMethod) {
    // 模拟支付处理
    showNotification('正在处理您的升级请求...', 'info');
    
    // 模拟支付流程
    setTimeout(() => {
        // 显示支付二维码或表单
        showPaymentInterface(paymentMethod);
    }, 1000);
}

/**
 * 显示支付界面
 * @param {string} paymentMethod - 支付方式
 */
function showPaymentInterface(paymentMethod) {
    // 创建模态对话框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    let paymentIcon, paymentTitle;
    
    switch(paymentMethod) {
        case 'alipay':
            paymentIcon = 'fab fa-alipay';
            paymentTitle = '支付宝支付';
            break;
        case 'wechat':
            paymentIcon = 'fab fa-weixin';
            paymentTitle = '微信支付';
            break;
        case 'creditcard':
            paymentIcon = 'fas fa-credit-card';
            paymentTitle = '信用卡支付';
            break;
        default:
            paymentIcon = 'fas fa-money-bill-wave';
            paymentTitle = '在线支付';
    }
    
    // 生成随机订单号
    const orderNumber = 'NO' + Date.now().toString().substring(5) + Math.floor(Math.random() * 1000);
    
    // 支付内容
    let paymentContent;
    
    if (paymentMethod === 'creditcard') {
        paymentContent = `
            <div class="credit-card-form">
                <div class="form-group">
                    <label>卡号</label>
                    <input type="text" class="form-control" placeholder="1234 5678 9012 3456">
                </div>
                <div class="form-row">
                    <div class="form-group col-6">
                        <label>有效期</label>
                        <input type="text" class="form-control" placeholder="MM/YY">
                    </div>
                    <div class="form-group col-6">
                        <label>CVV</label>
                        <input type="text" class="form-control" placeholder="123">
                    </div>
                </div>
                <div class="form-group">
                    <label>持卡人姓名</label>
                    <input type="text" class="form-control" placeholder="姓名">
                </div>
            </div>
        `;
    } else {
        // 二维码支付
        paymentContent = `
            <div class="qr-payment">
                <div class="qr-code">
                    <img src="images/payment-qr-${paymentMethod}.png" alt="${paymentTitle}二维码" onerror="this.src='images/mock-qr-code.png'">
                </div>
                <p class="qr-tip">请使用${paymentTitle}扫描二维码完成支付</p>
                <div class="payment-amount">¥300.00</div>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-container payment-modal">
            <div class="modal-header">
                <h3><i class="${paymentIcon}"></i> ${paymentTitle}</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="payment-details">
                    <div class="payment-detail">
                        <span class="detail-label">订单号:</span>
                        <span class="detail-value">${orderNumber}</span>
                    </div>
                    <div class="payment-detail">
                        <span class="detail-label">商品:</span>
                        <span class="detail-value">NexusOrbital专业会员升级</span>
                    </div>
                    <div class="payment-detail">
                        <span class="detail-label">金额:</span>
                        <span class="detail-value">¥300.00</span>
                    </div>
                </div>
                
                ${paymentContent}
                
                <div class="payment-timer">
                    <p>请在 <span id="payment-countdown">15:00</span> 内完成支付</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">取消支付</button>
                <button class="btn-primary modal-confirm">
                    ${paymentMethod === 'creditcard' ? '确认支付' : '已完成支付'}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加事件监听
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const confirmBtn = modal.querySelector('.modal-confirm');
    
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
        closeModal();
        completeUpgrade();
    });
    
    // 倒计时
    let timeLeft = 15 * 60; // 15分钟
    const countdownElement = document.getElementById('payment-countdown');
    
    const countdownTimer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            closeModal();
            showNotification('支付超时，请重新尝试', 'error');
        }
    }, 1000);
    
    // 模拟自动支付成功（仅用于演示）
    if (paymentMethod !== 'creditcard') {
        setTimeout(() => {
            clearInterval(countdownTimer);
            closeModal();
            completeUpgrade();
        }, 5000);
    }
}

/**
 * 完成升级流程
 */
function completeUpgrade() {
    showNotification('正在处理您的订单...', 'info');
    
    // 模拟API请求延迟
    setTimeout(() => {
        // 模拟成功响应
        showNotification('恭喜！您已成功升级为专业会员', 'success');
        
        // 更新用户数据
        if (currentUser) {
            currentUser.subscription.plan = '专业会员计划';
            currentUser.subscription.features = [
                "创始会员所有权益",
                "高级项目协作工具",
                "专家一对一咨询（每月1次）",
                "优先项目孵化支持",
                "专属技术研讨会",
                "API高级访问权限"
            ];
            
            // 更新本地存储
            localStorage.setItem('nexusorbital_user', JSON.stringify(currentUser));
            
            // 重新加载订阅信息
            loadSubscriptionInfo(currentUser.subscription);
        }
        
        // 更新UI
        updateUIAfterUpgrade();
        
        // 显示成功对话框
        showUpgradeSuccessModal();
    }, 2000);
}

/**
 * 更新升级后的UI
 */
function updateUIAfterUpgrade() {
    // 更新当前计划标识
    const currentPlanBadge = document.getElementById('current-plan-badge');
    if (currentPlanBadge) {
        currentPlanBadge.textContent = '专业会员计划';
    }
    
    // 隐藏升级按钮
    const upgradeBtn = document.querySelector('.btn-upgrade');
    if (upgradeBtn) {
        upgradeBtn.style.display = 'none';
    }
    
    // 更新计划卡片样式
    const currentPlanCard = document.querySelector('.plan-card.current');
    const premiumPlanCard = document.querySelector('.plan-card.premium');
    
    if (currentPlanCard) {
        currentPlanCard.classList.remove('current');
    }
    
    if (premiumPlanCard) {
        premiumPlanCard.classList.add('current');
        const planTag = premiumPlanCard.querySelector('.plan-tag');
        if (planTag) {
            planTag.textContent = '当前计划';
            planTag.classList.remove('premium-tag');
        }
    }
}

/**
 * 显示升级成功对话框
 */
function showUpgradeSuccessModal() {
    // 创建模态对话框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-container success-modal">
            <div class="modal-header">
                <h3>升级成功</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h4>欢迎成为专业会员！</h4>
                <p>您现在可以享受所有专业会员特权：</p>
                <ul class="premium-features">
                    <li><i class="fas fa-check"></i> 创始会员所有权益</li>
                    <li><i class="fas fa-check"></i> 高级项目协作工具</li>
                    <li><i class="fas fa-check"></i> 专家一对一咨询（每月1次）</li>
                    <li><i class="fas fa-check"></i> 优先项目孵化支持</li>
                    <li><i class="fas fa-check"></i> 专属技术研讨会</li>
                    <li><i class="fas fa-check"></i> API高级访问权限</li>
                </ul>
                <div class="next-steps">
                    <p>下一步您可以：</p>
                    <div class="next-step-buttons">
                        <button class="btn-secondary" id="explore-tools-btn">
                            <i class="fas fa-tools"></i> 探索高级工具
                        </button>
                        <button class="btn-secondary" id="schedule-consultation-btn">
                            <i class="fas fa-calendar-alt"></i> 预约专家咨询
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary modal-confirm">开始体验</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加事件监听
    const closeBtn = modal.querySelector('.modal-close');
    const confirmBtn = modal.querySelector('.modal-confirm');
    const exploreToolsBtn = document.getElementById('explore-tools-btn');
    const scheduleConsultationBtn = document.getElementById('schedule-consultation-btn');
    
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', closeModal);
    
    if (exploreToolsBtn) {
        exploreToolsBtn.addEventListener('click', () => {
            closeModal();
            showNotification('高级工具功能即将上线，敬请期待！', 'info');
        });
    }
    
    if (scheduleConsultationBtn) {
        scheduleConsultationBtn.addEventListener('click', () => {
            closeModal();
            showNotification('专家咨询预约功能即将上线，敬请期待！', 'info');
        });
    }
}

/**
 * 显示联系客服表单
 */
function showContactSupportForm() {
    // 创建模态对话框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h3>联系客服</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <p>请填写以下信息，我们的客户经理将在1-2个工作日内与您联系</p>
                
                <div class="enterprise-contact-form">
                    <div class="form-group">
                        <label>企业名称 <span class="required">*</span></label>
                        <input type="text" class="form-control" id="enterprise-name" placeholder="请输入企业名称">
                    </div>
                    
                    <div class="form-group">
                        <label>联系人 <span class="required">*</span></label>
                        <input type="text" class="form-control" id="contact-name" placeholder="请输入联系人姓名">
                    </div>
                    
                    <div class="form-group">
                        <label>联系电话 <span class="required">*</span></label>
                        <input type="text" class="form-control" id="contact-phone" placeholder="请输入联系电话">
                    </div>
                    
                    <div class="form-group">
                        <label>电子邮箱 <span class="required">*</span></label>
                        <input type="email" class="form-control" id="contact-email" placeholder="请输入电子邮箱">
                    </div>
                    
                    <div class="form-group">
                        <label>企业规模</label>
                        <select class="form-control" id="enterprise-size">
                            <option value="">请选择</option>
                            <option value="1-50">1-50人</option>
                            <option value="51-200">51-200人</option>
                            <option value="201-500">201-500人</option>
                            <option value="501-1000">501-1000人</option>
                            <option value="1000+">1000人以上</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>需求描述</label>
                        <textarea class="form-control" id="requirements" rows="4" placeholder="请简要描述您的需求和期望"></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">取消</button>
                <button class="btn-primary modal-confirm">提交申请</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加事件监听
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const confirmBtn = modal.querySelector('.modal-confirm');
    
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
        // 获取表单数据
        const enterpriseName = document.getElementById('enterprise-name').value;
        const contactName = document.getElementById('contact-name').value;
        const contactPhone = document.getElementById('contact-phone').value;
        const contactEmail = document.getElementById('contact-email').value;
        
        // 简单验证
        if (!enterpriseName || !contactName || !contactPhone || !contactEmail) {
            showNotification('请填写所有必填字段', 'error');
            return;
        }
        
        // 模拟提交
        closeModal();
        showNotification('您的企业会员申请已提交，我们将尽快与您联系', 'success');
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

/**
 * 初始化FAQ交互功能
 */
function initFAQInteraction() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', () => {
                // 切换当前项的激活状态
                item.classList.toggle('active');
                
                // 关闭其他打开的FAQ项
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
            });
        }
    });
}

/**
 * 初始化会员计划按钮
 */
function initMembershipTierButtons() {
    // 获取所有会员计划按钮
    const tierButtons = document.querySelectorAll('.tier-button');
    
    tierButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tierType = this.closest('.tier-card').classList.contains('free') ? 'free' : 
                            this.closest('.tier-card').classList.contains('founder') ? 'founder' :
                            this.closest('.tier-card').classList.contains('professional') ? 'professional' : 'enterprise';
            
            // 根据不同的会员类型执行不同的操作
            switch(tierType) {
                case 'free':
                    // 免费用户不需要操作
                    break;
                case 'founder':
                    // 显示创始会员支付流程
                    showTierUpgradeModal('founder');
                    break;
                case 'professional':
                    // 显示专业会员支付流程
                    showTierUpgradeModal('professional');
                    break;
                case 'enterprise':
                    // 显示企业会员联系表单
                    showEnterpriseContactForm();
                    break;
            }
        });
    });
}

/**
 * 显示会员升级模态框
 * @param {string} tierType - 会员类型
 */
function showTierUpgradeModal(tierType) {
    // 创建模态对话框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    let tierName, tierPrice, tierFeatures;
    
    if (tierType === 'founder') {
        tierName = '创始会员';
        tierPrice = '¥299';
        tierFeatures = [
            '整合优质开源资源',
            '太空人居技术研究报告',
            '创始团队在线答疑',
            '创始会员专属徽章',
            '优先参与线上活动',
            '资源优先获取权'
        ];
    } else {
        tierName = '专业会员';
        tierPrice = '¥599';
        tierFeatures = [
            '创始会员所有权益',
            '高级项目协作工具',
            '专家一对一咨询（每月1次）',
            '优先项目孵化支持',
            '专属技术研讨会',
            'API高级访问权限'
        ];
    }
    
    // 生成特权列表HTML
    let featuresHTML = '';
    tierFeatures.forEach(feature => {
        featuresHTML += `<li><i class="fas fa-check"></i> ${feature}</li>`;
    });
    
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h3>升级到${tierName}</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <p>成为${tierName}，享受更多专属权益</p>
                
                <div class="tier-details">
                    <div class="tier-price-display">
                        <span class="price">${tierPrice}</span>
                        <span class="period">/年</span>
                    </div>
                    
                    <div class="tier-features-list">
                        <h4>会员特权</h4>
                        <ul>
                            ${featuresHTML}
                        </ul>
                    </div>
                </div>
                
                <div class="payment-methods">
                    <h4>选择支付方式</h4>
                    <div class="payment-options">
                        <label class="payment-option">
                            <input type="radio" name="payment-method" value="alipay" checked>
                            <span class="payment-icon"><i class="fab fa-alipay"></i></span>
                            <span class="payment-name">支付宝</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment-method" value="wechat">
                            <span class="payment-icon"><i class="fab fa-weixin"></i></span>
                            <span class="payment-name">微信支付</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment-method" value="creditcard">
                            <span class="payment-icon"><i class="fas fa-credit-card"></i></span>
                            <span class="payment-name">信用卡</span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">取消</button>
                <button class="btn-primary modal-confirm">确认支付</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加事件监听
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const confirmBtn = modal.querySelector('.modal-confirm');
    
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
        const selectedPayment = modal.querySelector('input[name="payment-method"]:checked').value;
        closeModal();
        processUpgrade(selectedPayment);
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

/**
 * 显示企业会员联系表单
 */
function showEnterpriseContactForm() {
    // 创建模态对话框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h3>企业会员咨询</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <p>请填写以下信息，我们的客户经理将在1-2个工作日内与您联系</p>
                
                <div class="enterprise-contact-form">
                    <div class="form-group">
                        <label>企业名称 <span class="required">*</span></label>
                        <input type="text" class="form-control" id="enterprise-name" placeholder="请输入企业名称">
                    </div>
                    
                    <div class="form-group">
                        <label>联系人 <span class="required">*</span></label>
                        <input type="text" class="form-control" id="contact-name" placeholder="请输入联系人姓名">
                    </div>
                    
                    <div class="form-group">
                        <label>联系电话 <span class="required">*</span></label>
                        <input type="text" class="form-control" id="contact-phone" placeholder="请输入联系电话">
                    </div>
                    
                    <div class="form-group">
                        <label>电子邮箱 <span class="required">*</span></label>
                        <input type="email" class="form-control" id="contact-email" placeholder="请输入电子邮箱">
                    </div>
                    
                    <div class="form-group">
                        <label>企业规模</label>
                        <select class="form-control" id="enterprise-size">
                            <option value="">请选择</option>
                            <option value="1-50">1-50人</option>
                            <option value="51-200">51-200人</option>
                            <option value="201-500">201-500人</option>
                            <option value="501-1000">501-1000人</option>
                            <option value="1000+">1000人以上</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>需求描述</label>
                        <textarea class="form-control" id="requirements" rows="4" placeholder="请简要描述您的需求和期望"></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">取消</button>
                <button class="btn-primary modal-confirm">提交申请</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加事件监听
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const confirmBtn = modal.querySelector('.modal-confirm');
    
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
        // 获取表单数据
        const enterpriseName = document.getElementById('enterprise-name').value;
        const contactName = document.getElementById('contact-name').value;
        const contactPhone = document.getElementById('contact-phone').value;
        const contactEmail = document.getElementById('contact-email').value;
        
        // 简单验证
        if (!enterpriseName || !contactName || !contactPhone || !contactEmail) {
            showNotification('请填写所有必填字段', 'error');
            return;
        }
        
        // 模拟提交
        closeModal();
        showNotification('您的企业会员申请已提交，我们将尽快与您联系', 'success');
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

/**
 * 处理支付方式选择
 */
function handlePaymentMethodSelection() {
    const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
    const paymentForms = document.querySelectorAll('.payment-form');
    
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // 隐藏所有支付表单
            paymentForms.forEach(form => {
                form.classList.remove('active');
            });
            
            // 显示选中的支付表单
            const selectedMethod = this.value;
            document.getElementById(`${selectedMethod}-payment-form`).classList.add('active');
            
            // 更新确认按钮文本
            const confirmBtn = document.getElementById('confirm-payment-btn');
            confirmBtn.disabled = false;
            confirmBtn.textContent = '确认支付';
        });
    });
}

/**
 * 处理支付提交
 */
function handlePaymentSubmit() {
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', function() {
            const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
            const planName = document.getElementById('payment-plan-name').textContent;
            const planPrice = document.getElementById('payment-plan-price').textContent;
            
            // 根据支付方式处理
            switch (selectedMethod) {
                case 'wechat':
                    processWechatPayment(planName, planPrice);
                    break;
                case 'stripe':
                    // 检查是否已加载Stripe集成
                    if (window.stripeIntegration && typeof window.stripeIntegration.processStripePayment === 'function') {
                        window.stripeIntegration.processStripePayment(planName, planPrice);
                    } else {
                        processStripePayment(planName, planPrice);
                    }
                    break;
                case 'alipay':
                    showNotification('支付宝支付功能即将上线，敬请期待！', 'info');
                    break;
                default:
                    showNotification('请选择支付方式', 'error');
            }
        });
    }
    
    // 刷新微信支付状态按钮
    const checkStatusBtn = document.getElementById('check-payment-status-btn');
    if (checkStatusBtn) {
        checkStatusBtn.addEventListener('click', function() {
            const orderId = document.getElementById('wechat-order-id').textContent;
            if (orderId) {
                checkWechatPaymentStatus(orderId);
            }
        });
    }
}

/**
 * 处理微信支付
 * @param {string} planName - 计划名称
 * @param {number} planPrice - 计划价格
 */
function processWechatPayment(planName, planPrice) {
    // 显示加载状态
    const confirmBtn = document.getElementById('confirm-payment-btn');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
    
    // 生成订单数据
    const orderData = {
        outTradeNo: 'WX' + Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
        totalAmount: parseFloat(planPrice),
        subject: `NexusOrbital ${planName}订阅`,
        body: `订阅${planName}计划，享受更多高级功能`,
        attach: 'membership_' + planName.replace(/\s+/g, '_').toLowerCase()
    };
    
    // 模拟API请求 - 实际项目中应调用后端API
    setTimeout(() => {
        // 模拟成功响应
        const response = {
            success: true,
            data: {
                orderId: orderData.outTradeNo,
                qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAACkCAYAAAAZtYVBAAAAAklEQVR4AewaftIAAAYcSURBVO3BQY4cSRLAQDLQ//8yV0c/JZCoailm4Wb2B2td4rDWRQ5rXeSw1kUOa13ksNZFDmtd5LDWRQ5rXeSw1kUOa13ksNZFDmtd5LDWRQ5rXeSw1kU+fEjJb6qYlExKpopOyaRkqpiUTEomJZ2SqWJS8psqPnFY6yKHtS5yWOsiH76s4puUPFMyKZmUTBWTkknJVDEpmSomJVPFpGSq6JR0SqaKTslU8U1KvnFY6yKHtS5yWOsiH36Zkicqnql4QslUMSmZKp5QMlVMSp5QMlV0SjolU8WkZFLyRMVvOqx1kcNaFzmsdZEP/+dUTEqeUDIpmSomJVPFpGRS0imZKiYlk5Kp4v/JYa2LHNa6yGGti3z4ZRX/JiWTkqmiUzIpmSomJZ2SqaJTMlVMSqaKTsmk5N90WOsih7UucljrIh++TMm/ScmkZKqYlExKJiWTkk7JVDEpmZRMFZOSTsmkZFIyKZkqJiX/ZYe1LnJY6yKHtS7y4UNKpopJSadkqpiUTEqmiqliUjJVTEomJVPFpKRTMlV0SiYlU8WkZFIyVUxKOiVTxaRkqpiUTEomJVPFpGRSMlVMSiYlU8WkZFIyVUxKJiVTxaRkUjIpmZRMFZOSScmk5DcNa13ksNZFDmtdxP7gA0omJVPFpGRSMlVMSiYlU8WkZFIyVUxKJiVTxScOa13ksNZFDmtd5MOHlPymiknJpGRSMlVMSiYlU8WkZFIyKZkqJiWTkknJpGSqmJRMSiYlU8WkZFIyKfnGYa2LHNa6yGGti3z4kJJOyaRkqpiUTEqmik7JpGRSMlVMSiYlU8WkZFIyKZmUTBWTkknJpGSqmJRMSiYlU8WkZFL+0mGtixzWushhrYt8+GVKnqiYlExKJiVTxaRkqpiUTEqmik7JVDEpmSomJZ2SqWJSMimZKiYlk5KpYlIyKZkqJiWTkqliUjIpmSomJZ2SqeITh7UucljrIoe1LvLhQ0qmiqliUjIpmSomJZOSTsmkZFIyKZkqnlDSKZmUTBWTkknJpGRS0imZlExKJiWTkqliUjIpmZRMSv5Nh7UucljrIoe1LvLhy5T8JiVTxaRkUjJVTEomJZOSqWJSMlVMSiYlU8WkZFIyKZmUTBWTkknJpGSqmJRMSiYlU8Wk5BOHtS5yWOsih7UuYn+w1iUOa13ksNZFDmtd5LDWRQ5rXeSw1kUOa13ksNZFDmtd5LDWRQ5rXeSw1kUOa13ksNZFDmtd5H8AoXVjJwLsGYcAAAAASUVORK5CYII=',
                codeUrl: 'weixin://wxpay/bizpayurl?pr=XZl8OBCzz',
                paymentMethod: 'wechat',
                amount: parseFloat(planPrice),
                status: 'created',
                expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                merchantName: '忠间居住设计研究院'
            }
        };
        
        // 恢复按钮状态
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
        
        if (response.success) {
            // 隐藏支付确认模态框
            $('#paymentModal').modal('hide');
            
            // 显示微信支付二维码模态框
            showWechatQRCode(response.data.qrCodeUrl, response.data.orderId, response.data.amount);
        } else {
            showNotification('创建支付订单失败，请稍后重试', 'error');
        }
    }, 1500);
}

/**
 * 处理Stripe支付
 * @param {string} planName - 计划名称
 * @param {number} planPrice - 计划价格
 */
function processStripePayment(planName, planPrice) {
    // 显示加载状态
    const confirmBtn = document.getElementById('confirm-payment-btn');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
    
    // 模拟Stripe支付处理
    setTimeout(() => {
        // 模拟成功响应
        const response = {
            success: true,
            data: {
                transactionId: 'ch_' + Math.random().toString(36).substring(2, 15),
                paymentMethod: 'stripe',
                amount: parseFloat(planPrice),
                status: 'paid',
                paymentTime: new Date().toISOString()
            }
        };
        
        // 恢复按钮状态
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
        
        if (response.success) {
            // 隐藏支付确认模态框
            $('#paymentModal').modal('hide');
            
            // 显示支付成功模态框
            showPaymentSuccessModal(planName, response.data);
        } else {
            showNotification('支付处理失败，请稍后重试', 'error');
        }
    }, 2000);
}

/**
 * 处理支付宝支付
 * @param {string} planName - 计划名称
 * @param {number} planPrice - 计划价格
 */
function processAlipayPayment(planName, planPrice) {
    // 模拟支付宝支付处理
    showNotification('支付宝支付功能即将上线，敬请期待！', 'info');
}

/**
 * 显示微信支付二维码
 * @param {string} qrCodeUrl - 二维码URL
 * @param {string} orderId - 订单ID
 * @param {number} amount - 支付金额
 */
function showWechatQRCode(qrCodeUrl, orderId, amount) {
    // 设置二维码图片
    const qrcodeImage = document.getElementById('wechat-qrcode-image');
    qrcodeImage.innerHTML = `<img src="${qrCodeUrl}" alt="微信支付二维码">`;
    
    // 设置订单信息
    document.getElementById('wechat-order-id').textContent = orderId;
    document.getElementById('wechat-payment-amount').textContent = amount.toFixed(2);
    
    // 重置支付状态
    document.getElementById('status-pending').classList.add('active');
    document.getElementById('status-processing').classList.remove('active');
    document.getElementById('status-success').classList.remove('active');
    document.getElementById('status-failed').classList.remove('active');
    document.getElementById('payment-status-text').textContent = '等待扫码支付...';
    
    // 显示微信支付二维码模态框
    $('#wechatQRCodeModal').modal('show');
    
    // 自动查询支付状态
    startPaymentStatusCheck(orderId);
}

/**
 * 开始自动查询支付状态
 * @param {string} orderId - 订单ID
 */
function startPaymentStatusCheck(orderId) {
    let checkCount = 0;
    const maxChecks = 10; // 最多查询10次
    
    const statusCheck = setInterval(() => {
        checkCount++;
        
        if (checkCount > maxChecks) {
            clearInterval(statusCheck);
            return;
        }
        
        checkWechatPaymentStatus(orderId);
    }, 5000); // 每5秒查询一次
    
    // 存储定时器ID，以便在关闭模态框时清除
    window.paymentStatusTimer = statusCheck;
    
    // 模态框关闭时清除定时器
    $('#wechatQRCodeModal').on('hidden.bs.modal', function() {
        if (window.paymentStatusTimer) {
            clearInterval(window.paymentStatusTimer);
        }
    });
}

/**
 * 查询微信支付状态
 * @param {string} orderId - 订单ID
 */
function checkWechatPaymentStatus(orderId) {
    // 更新状态指示器
    document.getElementById('status-pending').classList.remove('active');
    document.getElementById('status-processing').classList.add('active');
    document.getElementById('status-success').classList.remove('active');
    document.getElementById('status-failed').classList.remove('active');
    document.getElementById('payment-status-text').textContent = '正在查询支付状态...';
    
    // 模拟API请求 - 实际项目中应调用后端API
    setTimeout(() => {
        // 模拟随机状态
        const statuses = ['pending', 'processing', 'paid', 'failed'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        // 更新状态显示
        document.getElementById('status-pending').classList.remove('active');
        document.getElementById('status-processing').classList.remove('active');
        document.getElementById('status-success').classList.remove('active');
        document.getElementById('status-failed').classList.remove('active');
        
        let statusText = '';
        
        switch (randomStatus) {
            case 'pending':
                document.getElementById('status-pending').classList.add('active');
                statusText = '等待扫码支付...';
                break;
            case 'processing':
                document.getElementById('status-processing').classList.add('active');
                statusText = '支付处理中...';
                break;
            case 'paid':
                document.getElementById('status-success').classList.add('active');
                statusText = '支付成功！';
                
                // 如果支付成功，3秒后显示成功页面
                setTimeout(() => {
                    $('#wechatQRCodeModal').modal('hide');
                    
                    // 显示支付成功模态框
                    const planName = document.getElementById('payment-plan-name').textContent;
                    const amount = parseFloat(document.getElementById('wechat-payment-amount').textContent);
                    
                    showPaymentSuccessModal(planName, {
                        transactionId: orderId,
                        paymentMethod: 'wechat',
                        amount: amount,
                        status: 'paid',
                        paymentTime: new Date().toISOString()
                    });
                    
                    // 清除状态查询定时器
                    if (window.paymentStatusTimer) {
                        clearInterval(window.paymentStatusTimer);
                    }
                }, 3000);
                break;
            case 'failed':
                document.getElementById('status-failed').classList.add('active');
                statusText = '支付失败，请重新扫码';
                break;
        }
        
        document.getElementById('payment-status-text').textContent = statusText;
    }, 1000);
}

/**
 * 显示支付成功模态框
 * @param {string} planName - 计划名称
 * @param {Object} paymentData - 支付数据
 */
function showPaymentSuccessModal(planName, paymentData) {
    // 设置支付成功信息
    document.getElementById('success-plan-name').textContent = planName;
    document.getElementById('transaction-id').textContent = paymentData.transactionId;
    document.getElementById('payment-method-used').textContent = 
        paymentData.paymentMethod === 'wechat' ? '微信支付' : 
        paymentData.paymentMethod === 'stripe' ? '信用卡支付' : 
        paymentData.paymentMethod === 'alipay' ? '支付宝支付' : 
        paymentData.paymentMethod;
    document.getElementById('payment-amount-paid').textContent = paymentData.amount.toFixed(2) + ' 元';
    
    const paymentTime = new Date(paymentData.paymentTime);
    document.getElementById('payment-time').textContent = paymentTime.toLocaleString('zh-CN');
    
    // 显示支付成功模态框
    $('#paymentSuccessModal').modal('show');
    
    // 支付成功后更新会员状态
    updateMembershipStatus(planName);
}

/**
 * 更新会员状态
 * @param {string} planName - 计划名称
 */
function updateMembershipStatus(planName) {
    // 模拟更新会员状态 - 实际项目中应调用后端API
    setTimeout(() => {
        // 更新当前用户的会员级别
        if (currentUser) {
            currentUser.level = planName;
            
            // 更新会员级别显示
            const userLevelElements = document.querySelectorAll('.user-level .level-badge');
            userLevelElements.forEach(element => {
                element.textContent = planName;
            });
            
            // 更新会员订阅信息
            if (currentUser.subscription) {
                currentUser.subscription.plan = planName + '计划';
                currentUser.subscription.startDate = new Date().toISOString().split('T')[0];
                currentUser.subscription.nextBilling = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                
                // 更新订阅信息显示
                loadSubscriptionInfo(currentUser.subscription);
            }
            
            // 更新本地存储
            if (localStorage.getItem('currentUser')) {
                const storedUser = JSON.parse(localStorage.getItem('currentUser'));
                storedUser.level = planName;
                localStorage.setItem('currentUser', JSON.stringify(storedUser));
            } else if (sessionStorage.getItem('currentUser')) {
                const storedUser = JSON.parse(sessionStorage.getItem('currentUser'));
                storedUser.level = planName;
                sessionStorage.setItem('currentUser', JSON.stringify(storedUser));
            }
            
            // 显示成功通知
            showNotification(`您已成功升级为${planName}，享受更多高级功能！`, 'success');
        }
    }, 2000);
}

// 初始化支付相关功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化支付方式选择
    handlePaymentMethodSelection();
    
    // 初始化支付提交
    handlePaymentSubmit();
    
    // 初始化支付模态框事件
    $('#paymentModal').on('show.bs.modal', function(event) {
        const button = $(event.relatedTarget);
        const planName = button.data('plan-name');
        const planPrice = button.data('plan-price');
        const planFeatures = button.data('plan-features');
        
        // 设置计划信息
        document.getElementById('payment-plan-name').textContent = planName;
        document.getElementById('payment-plan-price').textContent = planPrice;
        
        // 设置计划特性
        const featuresContainer = document.getElementById('payment-plan-features');
        if (featuresContainer && planFeatures) {
            const featuresList = planFeatures.split(',');
            let featuresHTML = '<ul>';
            featuresList.forEach(feature => {
                featuresHTML += `<li>${feature.trim()}</li>`;
            });
            featuresHTML += '</ul>';
            featuresContainer.innerHTML = featuresHTML;
        }
    });
});

/**
 * 显示通知消息
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 (success, error, info)
 */
function showNotification(message, type = 'info') {
    // 检查是否已有通知容器
    let notificationContainer = document.querySelector('.notification-container');
    
    // 如果没有，创建一个
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            }
            
            .notification {
                background: rgba(25, 35, 65, 0.95);
                color: #fff;
                padding: 15px 20px;
                margin-bottom: 10px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                min-width: 300px;
                max-width: 400px;
                transform: translateX(120%);
                transition: transform 0.3s ease;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification-icon {
                margin-right: 15px;
                font-size: 1.2rem;
            }
            
            .notification-success .notification-icon {
                color: #2ae9c9;
            }
            
            .notification-error .notification-icon {
                color: #ff4a6b;
            }
            
            .notification-info .notification-icon {
                color: #4a6bff;
            }
            
            .notification-message {
                flex: 1;
            }
            
            .notification-close {
                color: rgba(255, 255, 255, 0.6);
                background: none;
                border: none;
                font-size: 1rem;
                cursor: pointer;
                padding: 0;
                margin-left: 10px;
            }
            
            .notification-close:hover {
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // 设置图标
    let iconClass = 'fas fa-info-circle';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    
    // 设置通知内容
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // 添加到容器
    notificationContainer.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 添加关闭按钮事件
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // 自动关闭
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}
