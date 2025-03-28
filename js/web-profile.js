/**
 * NexusOrbital 个人资料页面功能
 * 版本: 2025.03.25
 * 作者: 星际人居技术设计团队
 */

document.addEventListener('DOMContentLoaded', function() {
    // 检查用户是否已登录
    if (!isLoggedIn()) {
        // 未登录，重定向到登录页面
        window.location.href = 'login.html';
        return;
    }
    
    // 初始化个人资料页面
    initProfilePage();
});

/**
 * 初始化个人资料页面
 */
function initProfilePage() {
    // 加载用户数据
    loadUserData();
    
    // 初始化标签页切换
    initTabNavigation();
    
    // 初始化编辑按钮
    initEditButtons();
    
    // 初始化密码可见性切换
    initPasswordToggles();
    
    // 初始化密码强度检测
    initPasswordStrength();
    
    // 初始化表单提交
    initFormSubmissions();
    
    // 初始化通知设置
    initNotificationSettings();
    
    // 初始化项目数据
    initProjectsData();
    
    // 初始化登出功能
    initLogout();
}

/**
 * 从认证系统和localStorage加载用户数据
 */
function loadUserData() {
    // 首先尝试从认证系统获取用户数据
    const authUser = getCurrentUser();
    
    // 然后从localStorage获取扩展的用户数据
    let userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
    
    // 如果认证系统有用户数据，合并到userData中
    if (authUser) {
        userData = {
            ...userData,
            name: authUser.username || userData.name,
            email: authUser.email || userData.email,
            phone: authUser.phone || userData.phone,
            role: authUser.role || userData.role,
            isLoggedIn: true,
            avatarUrl: authUser.avatar || userData.avatarUrl
        };
        
        // 保存合并后的用户数据
        localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
    }
    
    // 如果没有用户数据或未登录，重定向到登录页面
    if (!userData.isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    // 显示用户信息
    displayUserInfo(userData);
    
    // 填充个人资料表单
    populateProfileForms(userData);
}

/**
 * 显示用户基本信息
 * @param {Object} userData - 用户数据对象
 */
function displayUserInfo(userData) {
    // 设置用户头像
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');
    if (avatarPlaceholder) {
        // 如果有头像URL则显示图片，否则显示首字母
        if (userData.avatarUrl) {
            avatarPlaceholder.innerHTML = `<img src="${userData.avatarUrl}" alt="${userData.name}" />`;
        } else {
            const initials = getInitials(userData.name || userData.email);
            avatarPlaceholder.textContent = initials;
        }
    }
    
    // 设置用户名称
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = userData.name || '未设置姓名';
    }
    
    // 设置用户角色
    const userRoleElement = document.querySelector('.user-role');
    if (userRoleElement) {
        userRoleElement.textContent = userData.role || '太空技术爱好者';
    }
    
    // 设置会员状态
    const userMembershipElement = document.querySelector('.user-membership');
    if (userMembershipElement) {
        userMembershipElement.textContent = userData.membership ? '创始会员' : '普通会员';
    }
}

/**
 * 填充个人资料表单
 * @param {Object} userData - 用户数据对象
 */
function populateProfileForms(userData) {
    // 填充个人信息表单
    const personalInfoForm = document.getElementById('personal-info-form');
    if (personalInfoForm) {
        const fields = ['name', 'email', 'phone', 'location', 'bio', 'company', 'jobTitle'];
        fields.forEach(field => {
            const input = personalInfoForm.querySelector(`[name="${field}"]`);
            if (input && userData[field]) {
                input.value = userData[field];
            }
        });
    }
    
    // 填充社交媒体表单
    const socialMediaForm = document.getElementById('social-media-form');
    if (socialMediaForm && userData.socialMedia) {
        const socialFields = ['website', 'github', 'twitter', 'linkedin', 'weibo', 'wechat'];
        socialFields.forEach(field => {
            const input = socialMediaForm.querySelector(`[name="${field}"]`);
            if (input && userData.socialMedia[field]) {
                input.value = userData.socialMedia[field];
            }
        });
    }
    
    // 填充专业领域表单
    const expertiseForm = document.getElementById('expertise-form');
    if (expertiseForm && userData.expertise) {
        const expertiseFields = ['skills', 'interests', 'experience'];
        expertiseFields.forEach(field => {
            const input = expertiseForm.querySelector(`[name="${field}"]`);
            if (input && userData.expertise[field]) {
                if (input.tagName === 'SELECT' && input.multiple) {
                    // 对于多选下拉框，需要设置选中的选项
                    const values = userData.expertise[field];
                    Array.from(input.options).forEach(option => {
                        option.selected = values.includes(option.value);
                    });
                } else {
                    input.value = userData.expertise[field];
                }
            }
        });
    }
    
    // 填充会员信息
    updateMembershipDisplay(userData);
}

/**
 * 更新会员信息显示
 * @param {Object} userData - 用户数据对象
 */
function updateMembershipDisplay(userData) {
    const membershipStatus = document.querySelector('.membership-status');
    if (!membershipStatus) return;
    
    const membershipDetails = membershipStatus.querySelector('.membership-details');
    if (membershipDetails) {
        const titleElement = membershipDetails.querySelector('h3');
        const descElement = membershipDetails.querySelector('p');
        
        if (userData.membership) {
            if (titleElement) titleElement.textContent = '创始会员';
            if (descElement) descElement.textContent = `有效期至 ${userData.membershipExpiry || '2026年3月25日'}`;
        } else {
            if (titleElement) titleElement.textContent = '普通会员';
            if (descElement) descElement.textContent = '升级到创始会员以获取更多功能';
        }
    }
}

/**
 * 初始化标签页导航
 */
function initTabNavigation() {
    const navLinks = document.querySelectorAll('.profile-nav a');
    const tabContents = document.querySelectorAll('.profile-tab');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 获取目标标签页ID
            const targetId = this.getAttribute('href').substring(1);
            
            // 移除所有活动类
            navLinks.forEach(link => {
                link.parentElement.classList.remove('active');
            });
            
            tabContents.forEach(tab => {
                tab.classList.remove('active');
            });
            
            // 添加活动类到当前项
            this.parentElement.classList.add('active');
            document.getElementById(targetId).classList.add('active');
            
            // 更新页面标题
            const contentHeader = document.querySelector('.content-header');
            if (contentHeader) {
                const title = this.textContent.trim();
                contentHeader.querySelector('h2').textContent = title;
                
                // 更新描述
                const description = getTabDescription(targetId);
                contentHeader.querySelector('p').textContent = description;
            }
        });
    });
    
    // 默认激活第一个标签页
    if (navLinks.length > 0 && !document.querySelector('.profile-nav li.active')) {
        navLinks[0].click();
    }
}

/**
 * 获取标签页描述
 * @param {string} tabId - 标签页ID
 * @return {string} 标签页描述
 */
function getTabDescription(tabId) {
    const descriptions = {
        'personal-info': '管理您的个人信息和联系方式',
        'account-security': '更新您的密码和登录方式',
        'social-profiles': '连接您的社交媒体账号',
        'expertise': '分享您的专业技能和兴趣领域',
        'membership': '查看和管理您的会员状态',
        'notifications': '自定义您的通知偏好设置'
    };
    
    return descriptions[tabId] || '';
}

/**
 * 初始化编辑按钮
 */
function initEditButtons() {
    const editButtons = document.querySelectorAll('.edit-btn');
    
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.profile-card');
            const form = card.querySelector('form');
            
            if (!form) return;
            
            const inputs = form.querySelectorAll('input, textarea, select');
            const isEditing = this.getAttribute('data-editing') === 'true';
            
            if (isEditing) {
                // 保存模式 -> 查看模式
                this.setAttribute('data-editing', 'false');
                this.innerHTML = '<i class="fas fa-edit"></i> 编辑';
                
                // 禁用所有输入
                inputs.forEach(input => {
                    input.setAttribute('disabled', 'disabled');
                });
                
                // 隐藏操作按钮
                const formActions = form.querySelector('.form-actions');
                if (formActions) {
                    formActions.style.display = 'none';
                }
            } else {
                // 查看模式 -> 编辑模式
                this.setAttribute('data-editing', 'true');
                this.innerHTML = '<i class="fas fa-times"></i> 取消';
                
                // 启用所有输入
                inputs.forEach(input => {
                    input.removeAttribute('disabled');
                });
                
                // 显示操作按钮
                const formActions = form.querySelector('.form-actions');
                if (formActions) {
                    formActions.style.display = 'flex';
                }
            }
        });
    });
}

/**
 * 初始化密码可见性切换
 */
function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // 更新图标
            this.innerHTML = type === 'password' ? 
                '<i class="fas fa-eye"></i>' : 
                '<i class="fas fa-eye-slash"></i>';
        });
    });
}

/**
 * 初始化密码强度检测
 */
function initPasswordStrength() {
    const passwordInput = document.getElementById('new-password');
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = checkPasswordStrength(password);
        
        updatePasswordStrengthUI(strength);
    });
}

/**
 * 检查密码强度
 * @param {string} password - 密码
 * @return {Object} 强度对象，包含得分和描述
 */
function checkPasswordStrength(password) {
    // 默认强度为弱
    let score = 0;
    let description = '弱';
    let color = '#ff6b6b';
    let percentage = '30%';
    
    if (!password) {
        return { score, description, color, percentage };
    }
    
    // 长度检查
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // 复杂性检查
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // 根据得分确定强度
    if (score >= 6) {
        description = '强';
        color = '#2ae9c9';
        percentage = '100%';
    } else if (score >= 4) {
        description = '中';
        color = '#ffbe0b';
        percentage = '65%';
    }
    
    return { score, description, color, percentage };
}

/**
 * 更新密码强度UI
 * @param {Object} strength - 强度对象
 */
function updatePasswordStrengthUI(strength) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (strengthBar) {
        strengthBar.style.width = strength.percentage;
        strengthBar.style.backgroundColor = strength.color;
    }
    
    if (strengthText) {
        strengthText.textContent = `密码强度: ${strength.description}`;
        strengthText.style.color = strength.color;
    }
}

/**
 * 初始化表单提交
 */
function initFormSubmissions() {
    const forms = document.querySelectorAll('.profile-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取表单数据
            const formData = new FormData(this);
            const formId = this.id;
            
            // 将表单数据转换为对象
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            // 保存数据
            saveFormData(formId, data);
            
            // 重置编辑状态
            const card = this.closest('.profile-card');
            const editButton = card.querySelector('.edit-btn');
            if (editButton) {
                editButton.click();
            }
            
            // 显示成功消息
            showNotification('保存成功', 'success');
        });
        
        // 取消按钮
        const cancelBtn = form.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 重置表单
                form.reset();
                
                // 重新加载用户数据
                loadUserData();
                
                // 重置编辑状态
                const card = form.closest('.profile-card');
                const editButton = card.querySelector('.edit-btn');
                if (editButton) {
                    editButton.click();
                }
            });
        }
    });
    
    // 密码更改表单特殊处理
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = this.querySelector('[name="current-password"]').value;
            const newPassword = this.querySelector('[name="new-password"]').value;
            const confirmPassword = this.querySelector('[name="confirm-password"]').value;
            
            // 验证当前密码
            const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
            if (userData.password !== currentPassword) {
                showNotification('当前密码不正确', 'error');
                return;
            }
            
            // 验证新密码与确认密码
            if (newPassword !== confirmPassword) {
                showNotification('新密码与确认密码不匹配', 'error');
                return;
            }
            
            // 验证密码强度
            const strength = checkPasswordStrength(newPassword);
            if (strength.score < 4) {
                showNotification('请设置更强的密码', 'error');
                return;
            }
            
            // 更新密码
            userData.password = newPassword;
            localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
            
            // 重置表单
            this.reset();
            
            // 显示成功消息
            showNotification('密码已成功更新', 'success');
            
            // 重置编辑状态
            const card = this.closest('.profile-card');
            const editButton = card.querySelector('.edit-btn');
            if (editButton) {
                editButton.click();
            }
        });
    }
}

/**
 * 保存表单数据
 * @param {string} formId - 表单ID
 * @param {Object} data - 表单数据
 */
function saveFormData(formId, data) {
    // 获取当前用户数据
    const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
    
    // 根据表单ID更新不同的数据部分
    switch (formId) {
        case 'personal-info-form':
            // 更新个人信息
            Object.assign(userData, {
                name: data.name,
                email: data.email,
                phone: data.phone,
                location: data.location,
                bio: data.bio,
                company: data.company,
                jobTitle: data.jobTitle
            });
            break;
            
        case 'social-media-form':
            // 更新社交媒体信息
            userData.socialMedia = {
                website: data.website,
                github: data.github,
                twitter: data.twitter,
                linkedin: data.linkedin,
                weibo: data.weibo,
                wechat: data.wechat
            };
            break;
            
        case 'expertise-form':
            // 更新专业领域信息
            userData.expertise = {
                skills: data.skills,
                interests: data.interests,
                experience: data.experience
            };
            break;
    }
    
    // 保存更新后的用户数据
    localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
    
    // 更新显示
    displayUserInfo(userData);
}

/**
 * 初始化通知设置
 */
function initNotificationSettings() {
    const toggleSwitches = document.querySelectorAll('.notification-option .toggle-switch input');
    
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const notificationType = this.getAttribute('data-type');
            const isEnabled = this.checked;
            
            // 获取当前用户数据
            const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
            
            // 确保通知设置对象存在
            if (!userData.notifications) {
                userData.notifications = {};
            }
            
            // 更新通知设置
            userData.notifications[notificationType] = isEnabled;
            
            // 保存更新后的用户数据
            localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
            
            // 显示成功消息
            showNotification('通知设置已更新', 'success');
        });
        
        // 设置初始状态
        const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
        if (userData.notifications) {
            const notificationType = toggle.getAttribute('data-type');
            toggle.checked = userData.notifications[notificationType] || false;
        }
    });
}

/**
 * 初始化项目数据
 */
function initProjectsData() {
    // 从localStorage获取用户数据
    const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
    
    // 如果用户数据中没有项目信息，则初始化
    if (!userData.projects) {
        userData.projects = {
            participating: [
                {
                    id: 'moon-base-life-support',
                    name: '月球基地生命支持系统',
                    description: '为长期月球居住设计的闭环生命支持系统方案',
                    image: 'images/projects/moon-base.jpg',
                    role: '系统工程师',
                    status: 'active'
                }
            ],
            following: [
                {
                    id: 'space-farm-design',
                    name: '太空农场模块化设计',
                    description: '适用于轨道空间站和月球基地的高效农业系统',
                    image: 'images/projects/space-farm.jpg',
                    members: 12,
                    status: 'active'
                },
                {
                    id: 'mars-habitat-concept',
                    name: '火星栖息地概念设计',
                    description: '利用当地资源建造的火星永久居住设施',
                    image: 'images/projects/mars-habitat.jpg',
                    members: 8,
                    status: 'planning'
                }
            ]
        };
        
        // 保存更新后的用户数据
        localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
    }
    
    // 显示参与的项目
    displayParticipatingProjects(userData.projects.participating);
    
    // 显示关注的项目
    displayFollowingProjects(userData.projects.following);
}

/**
 * 显示用户参与的项目
 * @param {Array} projects - 参与的项目数组
 */
function displayParticipatingProjects(projects) {
    const container = document.getElementById('participating-projects');
    const emptyState = container.querySelector('.empty-state');
    
    // 如果没有项目，显示空状态
    if (!projects || projects.length === 0) {
        // 移除所有项目项
        const projectItems = container.querySelectorAll('.project-item');
        projectItems.forEach(item => item.remove());
        
        // 显示空状态
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    // 隐藏空状态
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // 清除现有项目（除了空状态）
    const projectItems = container.querySelectorAll('.project-item');
    projectItems.forEach(item => item.remove());
    
    // 添加项目
    projects.forEach(project => {
        const projectElement = createProjectElement(project, 'participating');
        // 插入到容器的开头（在空状态之前）
        if (emptyState) {
            container.insertBefore(projectElement, emptyState);
        } else {
            container.appendChild(projectElement);
        }
    });
}

/**
 * 显示用户关注的项目
 * @param {Array} projects - 关注的项目数组
 */
function displayFollowingProjects(projects) {
    const container = document.getElementById('following-projects');
    const emptyState = container.querySelector('.empty-state');
    
    // 如果没有项目，显示空状态
    if (!projects || projects.length === 0) {
        // 移除所有项目项
        const projectItems = container.querySelectorAll('.project-item');
        projectItems.forEach(item => item.remove());
        
        // 显示空状态
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    // 隐藏空状态
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // 清除现有项目（除了空状态）
    const projectItems = container.querySelectorAll('.project-item');
    projectItems.forEach(item => item.remove());
    
    // 添加项目
    projects.forEach(project => {
        const projectElement = createProjectElement(project, 'following');
        // 插入到容器的开头（在空状态之前）
        if (emptyState) {
            container.insertBefore(projectElement, emptyState);
        } else {
            container.appendChild(projectElement);
        }
    });
}

/**
 * 创建项目元素
 * @param {Object} project - 项目数据
 * @param {string} type - 项目类型（participating或following）
 * @return {Element} 项目元素
 */
function createProjectElement(project, type) {
    const projectElement = document.createElement('div');
    projectElement.className = 'project-item';
    projectElement.dataset.id = project.id;
    
    // 项目图片
    const imageHtml = `
        <div class="project-image">
            <img src="${project.image}" alt="${project.name}">
        </div>
    `;
    
    // 项目信息
    let metaHtml = '';
    if (type === 'participating') {
        metaHtml = `
            <div class="project-meta">
                <span class="project-role"><i class="fas fa-user-cog"></i> ${project.role}</span>
                <span class="project-status ${project.status}"><i class="fas fa-circle"></i> ${getStatusText(project.status)}</span>
            </div>
        `;
    } else {
        metaHtml = `
            <div class="project-meta">
                <span class="project-members"><i class="fas fa-users"></i> ${project.members}名成员</span>
                <span class="project-status ${project.status}"><i class="fas fa-circle"></i> ${getStatusText(project.status)}</span>
            </div>
        `;
    }
    
    const infoHtml = `
        <div class="project-info">
            <h4>${project.name}</h4>
            <p>${project.description}</p>
            ${metaHtml}
        </div>
    `;
    
    // 项目操作
    const actionsHtml = `
        <div class="project-actions">
            <button class="action-btn" onclick="viewProject('${project.id}')">
                <i class="fas fa-external-link-alt"></i>
            </button>
        </div>
    `;
    
    projectElement.innerHTML = imageHtml + infoHtml + actionsHtml;
    return projectElement;
}

/**
 * 获取项目状态文本
 * @param {string} status - 状态代码
 * @return {string} 状态文本
 */
function getStatusText(status) {
    const statusMap = {
        'active': '进行中',
        'planning': '规划中',
        'completed': '已完成',
        'recruiting': '招募中'
    };
    
    return statusMap[status] || status;
}

/**
 * 查看项目详情
 * @param {string} projectId - 项目ID
 */
function viewProject(projectId) {
    // 在实际应用中，这里应该跳转到项目详情页面
    // 目前仅作为演示，显示通知
    showNotification(`正在查看项目: ${projectId}`, 'info');
}

/**
 * 发送测试通知
 */
function testNotification() {
    // 创建一个测试通知
    const notificationTypes = [
        {
            title: '项目更新通知',
            content: '月球基地生命支持系统项目有新的更新',
            icon: 'rocket'
        },
        {
            title: '评论回复通知',
            content: '张明回复了您在"太空农场模块化设计"项目中的评论',
            icon: 'comment'
        },
        {
            title: '资源更新通知',
            content: '技术资源库新增了3份关于"太空辐射防护"的研究报告',
            icon: 'book'
        },
        {
            title: '活动邀请通知',
            content: '您被邀请参加"太空人居技术前沿"线上研讨会',
            icon: 'calendar'
        }
    ];
    
    // 随机选择一个通知类型
    const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    
    // 显示通知
    showNotification(randomType.content, 'info', randomType.title, randomType.icon);
}

/**
 * 初始化登出功能
 */
function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

/**
 * 检查用户是否已登录
 * @return {boolean} 是否已登录
 */
function isLoggedIn() {
    // 首先检查认证系统的登录状态
    if (window.isLoggedIn && typeof window.isLoggedIn === 'function') {
        if (window.isLoggedIn()) {
            return true;
        }
    }
    
    // 如果认证系统没有登录，检查本地存储
    const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
    return userData.isLoggedIn === true;
}

/**
 * 获取当前用户
 * @return {Object} 当前用户数据
 */
function getCurrentUser() {
    // 首先尝试从认证系统获取用户数据
    if (window.getCurrentUser && typeof window.getCurrentUser === 'function') {
        const authUser = window.getCurrentUser();
        if (authUser) {
            return authUser;
        }
    }
    
    // 如果认证系统没有用户数据，返回本地存储的数据
    const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
    return userData.isLoggedIn ? userData : null;
}

/**
 * 登出
 */
function logout() {
    // 首先尝试使用认证系统的登出功能
    if (window.logout && typeof window.logout === 'function') {
        window.logout();
        return; // 认证系统的logout会处理重定向
    }
    
    // 如果认证系统没有登出功能，清除本地存储并重定向
    const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
    userData.isLoggedIn = false;
    localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
    
    // 显示登出成功消息
    showNotification('登出成功', 'success');
    
    // 延迟后重定向到登录页面
    setTimeout(function() {
        window.location.href = 'login.html';
    }, 1500);
}

/**
 * 显示通知消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型（success, error, info）
 * @param {string} title - 消息标题（可选）
 * @param {string} icon - 图标名称（可选）
 */
function showNotification(message, type = 'info', title = '', icon = '') {
    // 默认图标
    if (!icon) {
        switch (type) {
            case 'success':
                icon = 'check-circle';
                break;
            case 'error':
                icon = 'exclamation-circle';
                break;
            default:
                icon = 'info-circle';
        }
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // 设置通知内容
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="notification-content">
            ${title ? `<h5>${title}</h5>` : ''}
            <p>${message}</p>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 添加关闭按钮事件
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeNotification(notification);
        });
    }
    
    // 自动关闭（3秒后）
    setTimeout(() => {
        closeNotification(notification);
    }, 3000);
    
    // 显示通知（添加动画类）
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
}

/**
 * 关闭通知
 * @param {Element} notification - 通知元素
 */
function closeNotification(notification) {
    // 移除显示类
    notification.classList.remove('show');
    
    // 等待动画完成后移除元素
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/**
 * 获取姓名首字母
 * @param {string} name - 姓名
 * @return {string} 首字母
 */
function getInitials(name) {
    if (!name) return '?';
    
    return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

/**
 * 处理会员升级
 */
function upgradeToMembership() {
    // 这里应该连接到实际的支付系统
    // 目前仅作为演示，直接更新用户状态
    
    const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
    
    // 设置会员状态
    userData.membership = true;
    
    // 设置过期时间（一年后）
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    userData.membershipExpiry = expiryDate.toISOString().split('T')[0];
    
    // 保存更新后的用户数据
    localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
    
    // 更新显示
    updateMembershipDisplay(userData);
    displayUserInfo(userData);
    
    // 显示成功消息
    showNotification('恭喜！您已成功升级为创始会员', 'success', '会员升级成功', 'crown');
}

// 暴露给HTML的公共函数
window.upgradeToMembership = upgradeToMembership;
window.testNotification = testNotification;
window.viewProject = viewProject;
