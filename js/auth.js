/**
 * 用户认证脚本
 * 包括登录、注册、验证码、JWT处理等功能
 */

// API基础URL，生产环境应该使用相对路径或HTTPS
const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

document.addEventListener("DOMContentLoaded", function() {
    // 处理登录/注册选项卡切换
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // 移除所有活动状态
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // 添加活动状态到当前选项卡
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
    
    // 处理短信验证码
    const verificationButtons = document.querySelectorAll('.btn-verification-code');
    if (verificationButtons.length > 0) {
        verificationButtons.forEach(button => {
            button.addEventListener('click', function() {
                const phoneInput = this.closest('form').querySelector('[name="phone"]');
                const countryCode = this.closest('form').querySelector('[name="country-code"]');
                
                if (phoneInput && phoneInput.value) {
                    sendVerificationCode(countryCode.value, phoneInput.value);
                } else {
                    showMessage('请输入有效的手机号码');
                }
            });
        });
    }
    
    // 处理登录表单提交
    const loginForm = document.querySelector('.auth-form');
    if (loginForm && window.location.href.includes('login.html')) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 判断当前活动的登录选项卡
            const activeTab = document.querySelector('.tab-content.active');
            
            if (activeTab.id === 'email-tab') {
                // 邮箱登录
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                if (email && password) {
                    loginWithEmail(email, password);
                } else {
                    showMessage('请填写所有必填字段');
                }
            } else if (activeTab.id === 'phone-tab') {
                // 手机号登录
                const countryCode = document.getElementById('country-code').value;
                const phone = document.getElementById('phone').value;
                const code = document.getElementById('verification-code').value;
                
                if (countryCode && phone && code) {
                    loginWithPhone(countryCode, phone, code);
                } else {
                    showMessage('请填写所有必填字段');
                }
            }
        });
    }
    
    // 处理注册表单提交
    if (loginForm && window.location.href.includes('register.html')) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 判断当前活动的注册选项卡
            const activeTab = document.querySelector('.tab-content.active');
            
            if (activeTab.id === 'email-tab') {
                // 邮箱注册
                const username = document.getElementById('username').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                if (username && email && password && confirmPassword) {
                    if (password === confirmPassword) {
                        registerWithEmail(username, email, password);
                    } else {
                        showMessage('两次输入的密码不一致');
                    }
                } else {
                    showMessage('请填写所有必填字段');
                }
            } else if (activeTab.id === 'phone-tab') {
                // 手机号注册
                const username = document.getElementById('phone-username').value;
                const countryCode = document.getElementById('country-code').value;
                const phone = document.getElementById('phone').value;
                const code = document.getElementById('verification-code').value;
                const password = document.getElementById('phone-password').value;
                
                if (username && countryCode && phone && code && password) {
                    registerWithPhone(username, countryCode, phone, code, password);
                } else {
                    showMessage('请填写所有必填字段');
                }
            } else if (activeTab.id === 'social-tab') {
                // 社交媒体注册
                const socialType = document.querySelector('.btn-social.active').classList.contains('weixin') ? 'weixin' : 
                                   document.querySelector('.btn-social.active').classList.contains('weibo') ? 'weibo' : 
                                   document.querySelector('.btn-social.active').classList.contains('xiaohongshu') ? 'xiaohongshu' : '';
                
                if (socialType) {
                    registerWithSocial(socialType);
                }
            }
        });
    }
    
    // 处理社交登录按钮
    const socialButtons = document.querySelectorAll('.btn-social');
    if (socialButtons.length > 0) {
        socialButtons.forEach(button => {
            button.addEventListener('click', function() {
                const socialType = this.classList.contains('weixin') ? 'weixin' : 
                                   this.classList.contains('weibo') ? 'weibo' : 
                                   this.classList.contains('xiaohongshu') ? 'xiaohongshu' : '';
                                   
                if (socialType) {
                    loginWithSocial(socialType);
                }
            });
        });
    }
    
    // 更新认证UI
    updateAuthUI();
});

/**
 * 发送短信验证码
 * @param {string} countryCode 国家代码
 * @param {string} phone 手机号码
 */
function sendVerificationCode(countryCode, phone) {
    // 验证手机号格式
    if (!phone || !/^\d{5,15}$/.test(phone)) {
        showMessage('请输入有效的手机号码');
        return;
    }
    
    // 显示发送中状态
    const sendButton = document.querySelector('.send-code-btn');
    if (sendButton) {
        const originalText = sendButton.textContent;
        sendButton.disabled = true;
        sendButton.textContent = '发送中...';
        
        // 调用API发送验证码
        fetch(`${API_BASE_URL}/sms/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ countryCode, phone })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('验证码已发送，请查收');
                
                // 倒计时禁用按钮
                let countdown = 60;
                sendButton.textContent = `重新发送(${countdown}s)`;
                
                const timer = setInterval(() => {
                    countdown--;
                    sendButton.textContent = `重新发送(${countdown}s)`;
                    
                    if (countdown <= 0) {
                        clearInterval(timer);
                        sendButton.disabled = false;
                        sendButton.textContent = originalText;
                    }
                }, 1000);
            } else {
                showMessage(data.message || '验证码发送失败');
                sendButton.disabled = false;
                sendButton.textContent = originalText;
            }
        })
        .catch(error => {
            console.error('发送验证码出错:', error);
            showMessage('网络错误，请稍后重试');
            sendButton.disabled = false;
            sendButton.textContent = originalText;
        });
    }
}

/**
 * 邮箱登录
 * @param {string} email 邮箱
 * @param {string} password 密码
 */
function loginWithEmail(email, password) {
    // 验证邮箱格式
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage('请输入有效的邮箱地址');
        return;
    }
    
    // 显示登录中状态
    const loginButton = document.querySelector('button[type="submit"]');
    if (loginButton) {
        const originalText = loginButton.textContent;
        loginButton.disabled = true;
        loginButton.textContent = '登录中...';
        
        // 模拟API调用
        setTimeout(() => {
            // 生成模拟用户数据和JWT令牌
            const username = email.split('@')[0];
            const token = generateFakeJWT(username);
            
            // 存储令牌和用户信息
            storeAuthToken(token);
            localStorage.setItem('nexus_user', JSON.stringify({
                username: username,
                email: email,
                avatar: null,
                role: '太空技术爱好者',
                createdAt: new Date().toISOString()
            }));
            
            // 同时更新NexusOrbital用户数据
            const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
            userData.name = username;
            userData.email = email;
            userData.isLoggedIn = true;
            localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
            
            // 显示成功消息并跳转
            showMessage('登录成功，正在跳转...');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
        }, 1500);
    }
}

/**
 * 手机号登录
 * @param {string} countryCode 国家代码
 * @param {string} phone 手机号码
 * @param {string} code 验证码
 */
function loginWithPhone(countryCode, phone, code) {
    // 验证手机号格式
    if (!phone || !/^\d{5,15}$/.test(phone)) {
        showMessage('请输入有效的手机号码');
        return;
    }
    
    // 验证验证码格式
    if (!code || !/^\d{4,6}$/.test(code)) {
        showMessage('请输入有效的验证码');
        return;
    }
    
    // 显示登录中状态
    const loginButton = document.querySelector('button[type="submit"]');
    if (loginButton) {
        const originalText = loginButton.textContent;
        loginButton.disabled = true;
        loginButton.textContent = '登录中...';
        
        // 模拟API调用
        setTimeout(() => {
            // 生成模拟用户数据和JWT令牌
            const username = `user_${phone.substring(phone.length - 4)}`;
            const token = generateFakeJWT(username);
            
            // 存储令牌和用户信息
            storeAuthToken(token);
            localStorage.setItem('nexus_user', JSON.stringify({
                username: username,
                phone: `${countryCode}${phone}`,
                avatar: null,
                role: '太空技术爱好者',
                createdAt: new Date().toISOString()
            }));
            
            // 同时更新NexusOrbital用户数据
            const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
            userData.name = username;
            userData.phone = `${countryCode}${phone}`;
            userData.isLoggedIn = true;
            localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
            
            // 显示成功消息并跳转
            showMessage('登录成功，正在跳转...');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
        }, 1500);
    }
}

/**
 * 社交媒体登录
 * @param {string} socialType 社交媒体类型 (weixin, weibo, xiaohongshu)
 */
function loginWithSocial(socialType) {
    // 显示登录中状态
    const socialButton = document.querySelector(`.btn-social.${socialType}`);
    if (socialButton) {
        const originalHTML = socialButton.innerHTML;
        socialButton.disabled = true;
        socialButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 登录中...`;
        
        if (socialType === 'weixin') {
            // 显示微信二维码登录界面
            showWeixinQrCodeLogin();
            socialButton.innerHTML = originalHTML;
            return;
        }
        
        // 模拟API调用
        setTimeout(() => {
            // 生成模拟用户数据和JWT令牌
            const username = `${socialType}_user_${Math.floor(Math.random() * 10000)}`;
            const token = generateFakeJWT(username);
            
            // 存储令牌和用户信息
            storeAuthToken(token);
            localStorage.setItem('nexus_user', JSON.stringify({
                username: username,
                socialType: socialType,
                avatar: null,
                role: '太空技术爱好者',
                createdAt: new Date().toISOString()
            }));
            
            // 同时更新NexusOrbital用户数据
            const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
            userData.name = username;
            userData.socialType = socialType;
            userData.isLoggedIn = true;
            localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
            
            // 显示成功消息并跳转
            showMessage('登录成功，正在跳转...');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
        }, 1500);
    }
}

/**
 * 社交媒体注册
 * @param {string} socialType 社交媒体类型 (weixin, weibo, xiaohongshu)
 */
function registerWithSocial(socialType) {
    // 社交媒体注册与登录流程相同
    loginWithSocial(socialType);
}

/**
 * 邮箱注册
 * @param {string} username 用户名
 * @param {string} email 邮箱
 * @param {string} password 密码
 */
function registerWithEmail(username, email, password) {
    // 验证邮箱格式
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage('请输入有效的邮箱地址');
        return;
    }
    
    // 验证密码强度
    if (password.length < 8) {
        showMessage('密码长度至少为8位');
        return;
    }
    
    // 显示注册中状态
    const registerButton = document.querySelector('button[type="submit"]');
    if (registerButton) {
        const originalText = registerButton.textContent;
        registerButton.disabled = true;
        registerButton.textContent = '注册中...';
        
        // 模拟API调用
        setTimeout(() => {
            // 生成模拟用户数据和JWT令牌
            const token = generateFakeJWT(username);
            
            // 存储令牌和用户信息
            storeAuthToken(token);
            localStorage.setItem('nexus_user', JSON.stringify({
                username: username,
                email: email,
                avatar: null,
                role: '太空技术爱好者',
                createdAt: new Date().toISOString()
            }));
            
            // 同时更新NexusOrbital用户数据
            const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
            userData.name = username;
            userData.email = email;
            userData.isLoggedIn = true;
            localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
            
            // 显示成功消息并跳转
            showMessage('注册成功，正在跳转...');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
        }, 1500);
    }
}

/**
 * 手机号注册
 * @param {string} username 用户名
 * @param {string} countryCode 国家代码
 * @param {string} phone 手机号码
 * @param {string} code 验证码
 * @param {string} password 密码
 */
function registerWithPhone(username, countryCode, phone, code, password) {
    // 验证手机号格式
    if (!phone || !/^\d{5,15}$/.test(phone)) {
        showMessage('请输入有效的手机号码');
        return;
    }
    
    // 验证验证码格式
    if (!code || !/^\d{4,6}$/.test(code)) {
        showMessage('请输入有效的验证码');
        return;
    }
    
    // 验证密码强度
    if (password.length < 8) {
        showMessage('密码长度至少为8位');
        return;
    }
    
    // 显示注册中状态
    const registerButton = document.querySelector('button[type="submit"]');
    if (registerButton) {
        const originalText = registerButton.textContent;
        registerButton.disabled = true;
        registerButton.textContent = '注册中...';
        
        // 模拟API调用
        setTimeout(() => {
            // 生成模拟用户数据和JWT令牌
            const token = generateFakeJWT(username);
            
            // 存储令牌和用户信息
            storeAuthToken(token);
            localStorage.setItem('nexus_user', JSON.stringify({
                username: username,
                phone: `${countryCode}${phone}`,
                avatar: null,
                role: '太空技术爱好者',
                createdAt: new Date().toISOString()
            }));
            
            // 同时更新NexusOrbital用户数据
            const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
            userData.name = username;
            userData.phone = `${countryCode}${phone}`;
            userData.isLoggedIn = true;
            localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
            
            // 显示成功消息并跳转
            showMessage('注册成功，正在跳转...');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
        }, 1500);
    }
}

/**
 * 生成UUID
 * @returns {string} UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 生成模拟JWT令牌
 * @param {string} username 用户名
 * @returns {string} JWT令牌
 */
function generateFakeJWT(username) {
    // 创建JWT头部
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };
    
    // 创建JWT载荷
    const payload = {
        sub: generateUUID(),
        name: username,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7天过期
    };
    
    // 编码JWT（仅用于演示，实际应该由服务器生成）
    return btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.fake_signature';
}

/**
 * 存储认证令牌
 * @param {string} token JWT令牌
 */
function storeAuthToken(token) {
    localStorage.setItem('nexus_auth_token', token);
}

/**
 * 获取认证令牌
 * @returns {string|null} JWT令牌
 */
function getAuthToken() {
    return localStorage.getItem('nexus_auth_token');
}

/**
 * 检查是否已登录
 * @returns {boolean} 是否已登录
 */
function isLoggedIn() {
    const token = getAuthToken();
    if (!token) return false;
    
    // 验证令牌是否过期
    try {
        // 解析JWT令牌，获取过期时间
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp;
        
        // 如果已过期，清除令牌并返回false
        if (exp && exp * 1000 < Date.now()) {
            clearAuthToken();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('验证令牌出错', error);
        clearAuthToken();
        return false;
    }
}

/**
 * 清除认证令牌
 */
function clearAuthToken() {
    localStorage.removeItem('nexus_auth_token');
    localStorage.removeItem('nexus_user');
}

/**
 * 退出登录
 */
function logout() {
    clearAuthToken();
    
    // 同时清除NexusOrbital用户数据的登录状态
    const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
    userData.isLoggedIn = false;
    localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
    
    showMessage('已退出登录');
    window.location.href = 'login.html';
}

/**
 * 获取当前用户信息
 * @returns {Object|null} 用户信息
 */
function getCurrentUser() {
    // 从本地存储获取用户信息
    const userJson = localStorage.getItem('nexus_user');
    if (userJson) {
        try {
            return JSON.parse(userJson);
        } catch (e) {
            console.error('解析用户信息出错:', e);
            return null;
        }
    }
    return null;
}

/**
 * 验证令牌
 * @returns {Promise<boolean>} 是否有效
 */
function verifyToken() {
    const token = getAuthToken();
    if (!token) return Promise.resolve(false);
    
    return fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.user) {
            // 更新存储的用户信息
            localStorage.setItem('nexus_user', JSON.stringify(data.user));
            return true;
        }
        
        // 如果验证失败，清除令牌
        clearAuthToken();
        return false;
    })
    .catch(error => {
        console.error('令牌验证错误:', error);
        // 出错时不要立即清除令牌，可能是网络问题
        return false;
    });
}

/**
 * 显示自定义消息
 * @param {string} message 消息内容
 */
function showMessage(message) {
    // 检查是否已存在消息框
    let messageBox = document.querySelector('.nexus-message-box');
    
    if (!messageBox) {
        // 创建消息框
        messageBox = document.createElement('div');
        messageBox.className = 'nexus-message-box';
        messageBox.innerHTML = `
            <div class="nexus-message-content">
                <div class="nexus-message-header">
                    <span>nexusorbital.com 提示</span>
                </div>
                <div class="nexus-message-body">
                    <p></p>
                </div>
                <div class="nexus-message-footer">
                    <button class="nexus-btn-confirm">确定</button>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .nexus-message-box {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                animation: fadeIn 0.2s ease;
            }
            .nexus-message-content {
                background: linear-gradient(135deg, #1e293b, #0f172a);
                border-radius: 10px;
                width: 300px;
                max-width: 90%;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            }
            .nexus-message-header {
                padding: 12px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .nexus-message-header span {
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
            }
            .nexus-message-body {
                padding: 20px;
                color: white;
                text-align: center;
            }
            .nexus-message-body p {
                margin: 0;
                line-height: 1.5;
            }
            .nexus-message-footer {
                padding: 10px 15px 15px;
                display: flex;
                justify-content: center;
            }
            .nexus-btn-confirm {
                background: linear-gradient(135deg, #3a7bd5, #00d2ff);
                border: none;
                border-radius: 5px;
                color: white;
                padding: 8px 20px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .nexus-btn-confirm:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        
        // 添加到页面
        document.head.appendChild(style);
        document.body.appendChild(messageBox);
        
        // 绑定事件
        const confirmBtn = messageBox.querySelector('.nexus-btn-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                document.body.removeChild(messageBox);
            });
        }
    }
    
    // 更新消息内容
    const messageBody = messageBox.querySelector('.nexus-message-body p');
    if (messageBody) {
        messageBody.textContent = message;
    }
}

/**
 * 更新认证UI
 * 根据用户登录状态更新页面UI元素
 */
function updateAuthUI() {
    const isUserLoggedIn = isLoggedIn();
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    
    if (authButtons && userProfile) {
        if (isUserLoggedIn) {
            // 用户已登录，显示用户资料
            authButtons.style.display = 'none';
            userProfile.style.display = 'flex';
            
            // 获取当前用户信息并更新UI
            const currentUser = getCurrentUser();
            if (currentUser) {
                // 如果有用户头像，则显示
                const userAvatar = userProfile.querySelector('.avatar');
                if (userAvatar && currentUser.avatar) {
                    userAvatar.src = currentUser.avatar;
                }
            }
            
            // 绑定退出登录按钮事件
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    logout();
                    window.location.href = 'index.html';
                });
            }
        } else {
            // 用户未登录，显示登录/注册按钮
            authButtons.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    }
    
    // 处理项目创建按钮
    const createProjectBtns = document.querySelectorAll('a[href="create-project.html"]');
    if (createProjectBtns.length > 0) {
        createProjectBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                if (!isUserLoggedIn) {
                    e.preventDefault();
                    window.location.href = 'login.html?redirect=create-project.html';
                }
            });
        });
    }
    
    // 处理项目关注/申请加入按钮
    const followProjectBtn = document.getElementById('followProjectBtn');
    const joinProjectBtn = document.getElementById('joinProjectBtn');
    
    if (followProjectBtn) {
        followProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!isUserLoggedIn) {
                const projectId = new URLSearchParams(window.location.search).get('id');
                window.location.href = `login.html?redirect=project-detail.html?id=${projectId}`;
            } else {
                toggleFollowProject();
            }
        });
    }
    
    if (joinProjectBtn) {
        joinProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!isUserLoggedIn) {
                const projectId = new URLSearchParams(window.location.search).get('id');
                window.location.href = `login.html?redirect=project-detail.html?id=${projectId}`;
            } else {
                applyToJoinProject();
            }
        });
    }
}

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    // 全局标志，控制社区页面是否需要登录检查
    window.disableCommunityLoginCheck = true;
    
    // 检查是否需要进行登录检查
    const needLoginCheck = !window.disableCommunityLoginCheck && 
                          !window.location.href.includes('login.html') && 
                          !window.location.href.includes('register.html');
    
    if (needLoginCheck) {
        // 检查登录状态
        if (!isLoggedIn()) {
            // 未登录，重定向到登录页面
            window.location.href = 'login.html';
            return;
        }
        
        // 验证令牌
        verifyToken().then(valid => {
            if (!valid) {
                // 令牌无效，重定向到登录页面
                window.location.href = 'login.html';
            }
        });
    }
    
    // 处理登录表单重定向
    if (window.location.href.includes('login.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        
        if (redirectUrl) {
            const loginForm = document.querySelector('.auth-form');
            if (loginForm) {
                const redirectInput = document.createElement('input');
                redirectInput.type = 'hidden';
                redirectInput.name = 'redirect';
                redirectInput.value = redirectUrl;
                loginForm.appendChild(redirectInput);
            }
        }
    }
    
    // 处理登录成功后的重定向
    if (isLoggedIn() && window.location.href.includes('login.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = 'index.html';
        }
    }
});

/**
 * 显示微信二维码登录界面
 */
function showWeixinQrCodeLogin() {
    // 创建二维码登录对话框
    const qrCodeDialog = document.createElement('div');
    qrCodeDialog.className = 'weixin-qrcode-dialog';
    qrCodeDialog.innerHTML = `
        <div class="qrcode-container">
            <div class="qrcode-header">
                <h3>微信扫码登录</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="qrcode-content">
                <div class="qrcode-image">
                    <!-- 这里应该是动态生成的二维码 -->
                    <div class="placeholder-qrcode">
                        <i class="fab fa-weixin"></i>
                    </div>
                </div>
                <p class="qrcode-tip">请使用微信扫描二维码登录</p>
                <div class="qrcode-status">
                    <div class="status-icon"><i class="fas fa-spinner fa-spin"></i></div>
                    <div class="status-text">等待扫描...</div>
                </div>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .weixin-qrcode-dialog {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        }
        .qrcode-container {
            background: linear-gradient(135deg, #1e293b, #0f172a);
            border-radius: 12px;
            width: 320px;
            max-width: 90%;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .qrcode-header {
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .qrcode-header h3 {
            color: white;
            margin: 0;
            font-size: 16px;
        }
        .close-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            font-size: 16px;
            transition: color 0.3s ease;
        }
        .close-btn:hover {
            color: white;
        }
        .qrcode-content {
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .qrcode-image {
            width: 180px;
            height: 180px;
            background-color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
        }
        .placeholder-qrcode {
            font-size: 80px;
            color: #2aae67;
        }
        .qrcode-tip {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 15px;
            font-size: 14px;
        }
        .qrcode-status {
            display: flex;
            align-items: center;
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
        }
        .status-icon {
            margin-right: 8px;
            color: #3a7bd5;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    
    // 添加到页面
    document.head.appendChild(style);
    document.body.appendChild(qrCodeDialog);
    
    // 绑定关闭按钮事件
    const closeBtn = qrCodeDialog.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(qrCodeDialog);
        });
    }
    
    // 模拟二维码扫描过程
    setTimeout(() => {
        const statusIcon = qrCodeDialog.querySelector('.status-icon');
        const statusText = qrCodeDialog.querySelector('.status-text');
        
        if (statusIcon && statusText) {
            statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            statusText.textContent = '扫描成功，等待确认...';
            
            setTimeout(() => {
                statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
                statusText.textContent = '登录成功，正在跳转...';
                
                // 生成模拟用户数据和JWT令牌
                const username = `weixin_user_${Math.floor(Math.random() * 10000)}`;
                const token = generateFakeJWT(username);
                
                // 存储令牌和用户信息
                storeAuthToken(token);
                localStorage.setItem('nexus_user', JSON.stringify({
                    username: username,
                    socialType: 'weixin',
                    avatar: null,
                    role: '太空技术爱好者',
                    createdAt: new Date().toISOString()
                }));
                
                // 同时更新NexusOrbital用户数据
                const userData = JSON.parse(localStorage.getItem('nexusOrbitalUser')) || {};
                userData.name = username;
                userData.socialType = 'weixin';
                userData.isLoggedIn = true;
                localStorage.setItem('nexusOrbitalUser', JSON.stringify(userData));
                
                setTimeout(() => {
                    document.body.removeChild(qrCodeDialog);
                    window.location.href = 'profile.html';
                }, 1000);
            }, 1500);
        }
    }, 2000);
}

// 暴露全局函数
window.logout = logout;
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
