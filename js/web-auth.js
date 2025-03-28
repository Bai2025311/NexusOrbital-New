/**
 * NexusOrbital 用户认证脚本
 * 版本: 2025.03.27
 * 作者: 星际人居技术设计团队
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 检查当前页面类型
    const isLoginPage = document.getElementById('loginForm');
    const isRegisterPage = document.getElementById('registerForm');
    const isForgotPasswordPage = document.getElementById('forgotPasswordForm');
    
    // 初始化密码可见性切换
    initPasswordToggle();
    
    // 初始化第三方登录按钮（如果存在）
    if (window.OAuthProviders && typeof window.OAuthProviders.initOAuthButtons === 'function') {
        window.OAuthProviders.initOAuthButtons();
    }
    
    // 根据页面类型初始化表单
    if (isLoginPage) {
        initLoginForm();
    } else if (isRegisterPage) {
        initRegisterForm();
    } else if (isForgotPasswordPage) {
        initForgotPasswordForm();
    }
    
    // 检查用户登录状态并更新UI
    updateAuthUI();
});

/**
 * 初始化密码可见性切换功能
 */
function initPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            // 切换密码可见性
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

/**
 * 初始化登录表单
 */
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const loginMessage = document.getElementById('loginMessage');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 重置错误信息
        resetErrors();
        
        // 获取表单数据
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = document.getElementById('remember').checked;
        
        // 验证表单
        let isValid = true;
        
        if (!validateEmail(email)) {
            emailError.textContent = '请输入有效的邮箱地址';
            isValid = false;
        }
        
        if (password.length < 8) {
            passwordError.textContent = '密码至少需要8个字符';
            isValid = false;
        }
        
        if (isValid) {
            // 尝试登录
            const loginResult = attemptLogin(email, password);
            
            if (loginResult.success) {
                // 登录成功
                loginMessage.textContent = '登录成功，正在跳转...';
                loginMessage.classList.remove('error');
                
                // 如果选择记住我，设置持久化登录状态
                if (rememberMe) {
                    localStorage.setItem('nexusorbital_remember', 'true');
                } else {
                    localStorage.removeItem('nexusorbital_remember');
                }
                
                // 延迟跳转到首页
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                // 登录失败
                loginMessage.textContent = loginResult.message;
                loginMessage.classList.add('error');
            }
        }
    });
    
    // 重置错误信息
    function resetErrors() {
        emailError.textContent = '';
        passwordError.textContent = '';
        loginMessage.textContent = '';
        loginMessage.classList.remove('error');
    }
}

/**
 * 初始化注册表单
 */
function initRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    const nameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('termsAgree');
    
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const termsError = document.getElementById('termsError');
    const registerMessage = document.getElementById('registerMessage');
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 重置错误信息
        resetErrors();
        
        // 获取表单数据
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const userRole = document.querySelector('input[name="userRole"]:checked').value;
        const termsAgreed = termsCheckbox.checked;
        const newsletterAgreed = document.getElementById('newsletterAgree').checked;
        
        // 验证表单
        let isValid = true;
        
        if (name.length < 2) {
            nameError.textContent = '请输入有效的姓名';
            isValid = false;
        }
        
        if (!validateEmail(email)) {
            emailError.textContent = '请输入有效的邮箱地址';
            isValid = false;
        }
        
        if (password.length < 8) {
            passwordError.textContent = '密码至少需要8个字符';
            isValid = false;
        }
        
        if (password !== confirmPassword) {
            confirmPasswordError.textContent = '两次输入的密码不一致';
            isValid = false;
        }
        
        if (!termsAgreed) {
            termsError.textContent = '您必须同意服务条款和隐私政策';
            isValid = false;
        }
        
        if (isValid) {
            // 检查邮箱是否已注册
            if (isEmailRegistered(email)) {
                emailError.textContent = '该邮箱已被注册';
                return;
            }
            
            // 创建用户
            const userData = {
                name: name,
                email: email,
                password: hashPassword(password), // 实际应用中应使用更安全的加密方式
                role: userRole,
                newsletter: newsletterAgreed,
                registrationDate: new Date().toISOString(),
                membershipType: 'free', // 默认为免费会员
                lastLogin: new Date().toISOString()
            };
            
            // 保存用户数据
            registerUser(userData);
            
            // 显示成功消息
            registerMessage.textContent = '注册成功，正在跳转到登录页面...';
            
            // 延迟跳转到登录页面
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    });
    
    // 重置错误信息
    function resetErrors() {
        nameError.textContent = '';
        emailError.textContent = '';
        passwordError.textContent = '';
        confirmPasswordError.textContent = '';
        termsError.textContent = '';
        registerMessage.textContent = '';
    }
}

/**
 * 初始化忘记密码表单
 */
function initForgotPasswordForm() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const forgotPasswordMessage = document.getElementById('forgotPasswordMessage');
    
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 重置错误信息
        resetErrors();
        
        // 获取表单数据
        const email = emailInput.value.trim();
        
        // 验证表单
        let isValid = true;
        
        if (!validateEmail(email)) {
            emailError.textContent = '请输入有效的邮箱地址';
            isValid = false;
        }
        
        if (isValid) {
            // 检查邮箱是否存在
            if (!isEmailRegistered(email)) {
                emailError.textContent = '该邮箱未注册';
                return;
            }
            
            // 模拟发送重置密码邮件
            forgotPasswordMessage.textContent = '重置密码链接已发送到您的邮箱，请查收';
            forgotPasswordMessage.classList.remove('error');
            
            // 在实际应用中，这里应该调用后端API发送重置密码邮件
            // 由于这是MVP阶段，我们只模拟这个过程
            
            // 禁用提交按钮，防止重复提交
            const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = '已发送';
            
            // 延迟后重新启用按钮
            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.textContent = '重新发送';
            }, 30000); // 30秒后可重新发送
        }
    });
    
    // 重置错误信息
    function resetErrors() {
        emailError.textContent = '';
        forgotPasswordMessage.textContent = '';
        forgotPasswordMessage.classList.remove('error');
    }
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} - 是否有效
 */
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

/**
 * 检查邮箱是否已注册
 * @param {string} email - 邮箱地址
 * @returns {boolean} - 是否已注册
 */
function isEmailRegistered(email) {
    const users = JSON.parse(localStorage.getItem('nexusorbital_users') || '[]');
    return users.some(user => user.email === email);
}

/**
 * 简单的密码哈希（仅用于演示，实际应用中应使用更安全的方式）
 * @param {string} password - 原始密码
 * @returns {string} - 哈希后的密码
 */
function hashPassword(password) {
    // 实际应用中应使用更安全的哈希算法，如bcrypt
    // 这里仅用简单方式模拟
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

/**
 * 注册新用户
 * @param {Object} userData - 用户数据
 */
function registerUser(userData) {
    // 获取现有用户列表
    const users = JSON.parse(localStorage.getItem('nexusorbital_users') || '[]');
    
    // 添加新用户
    users.push(userData);
    
    // 保存更新后的用户列表
    localStorage.setItem('nexusorbital_users', JSON.stringify(users));
}

/**
 * 尝试登录
 * @param {string} email - 邮箱地址
 * @param {string} password - 密码
 * @returns {Object} - 登录结果
 */
function attemptLogin(email, password) {
    // 获取用户列表
    const users = JSON.parse(localStorage.getItem('nexusorbital_users') || '[]');
    
    // 查找匹配的用户
    const user = users.find(user => user.email === email);
    
    if (!user) {
        return {
            success: false,
            message: '用户不存在，请检查邮箱地址'
        };
    }
    
    // 验证密码
    if (user.password !== hashPassword(password)) {
        return {
            success: false,
            message: '密码错误，请重试'
        };
    }
    
    // 更新最后登录时间
    user.lastLogin = new Date().toISOString();
    localStorage.setItem('nexusorbital_users', JSON.stringify(users));
    
    // 设置登录状态
    setLoggedInUser(user);
    
    return {
        success: true,
        message: '登录成功'
    };
}

/**
 * 设置登录用户状态
 * @param {Object} user - 用户数据
 */
function setLoggedInUser(user) {
    // 存储用户会话信息（不包含敏感数据如密码）
    const sessionUser = {
        name: user.name,
        email: user.email,
        role: user.role || 'member',
        membershipType: user.membershipType || 'basic',
        avatar: user.avatar || null,
        oauthProvider: user.oauthProvider || null
    };
    
    localStorage.setItem('nexusorbital_current_user', JSON.stringify(sessionUser));
}

/**
 * 获取当前登录用户
 * @returns {Object|null} - 当前登录用户或null
 */
function getCurrentUser() {
    const userJson = localStorage.getItem('nexusorbital_current_user');
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * 退出登录
 */
function logout() {
    localStorage.removeItem('nexusorbital_current_user');
    localStorage.removeItem('nexusorbital_remember');
    
    // 重定向到首页
    window.location.href = 'index.html';
}

/**
 * 更新认证相关UI元素
 */
function updateAuthUI() {
    const currentUser = getCurrentUser();
    const loginButtons = document.querySelectorAll('.login-button');
    const joinButtons = document.querySelectorAll('.join-button');
    
    if (currentUser) {
        // 用户已登录
        loginButtons.forEach(button => {
            // 更新登录按钮为用户信息
            button.textContent = currentUser.name;
            button.classList.add('logged-in');
            
            // 如果没有用户菜单，添加一个
            if (!button.nextElementSibling || !button.nextElementSibling.classList.contains('user-menu')) {
                const userMenu = document.createElement('div');
                userMenu.className = 'user-menu';
                userMenu.innerHTML = `
                    <ul>
                        <li><a href="membership.html#profile-panel"><i class="fas fa-user-circle"></i> 个人资料</a></li>
                        <li><a href="membership.html#resources-panel"><i class="fas fa-folder"></i> 我的资源</a></li>
                        <li><a href="membership.html#subscription-panel"><i class="fas fa-crown"></i> 会员订阅</a></li>
                        <li><a href="membership.html#messages-panel"><i class="fas fa-envelope"></i> 消息中心</a></li>
                        <li class="divider"></li>
                        <li><a href="#" class="logout-link"><i class="fas fa-sign-out-alt"></i> 退出登录</a></li>
                    </ul>
                `;
                
                // 在登录按钮后插入用户菜单
                button.parentNode.insertBefore(userMenu, button.nextSibling);
                
                // 添加点击事件切换菜单显示
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    userMenu.classList.toggle('active');
                });
                
                // 添加退出登录事件
                userMenu.querySelector('.logout-link').addEventListener('click', function(e) {
                    e.preventDefault();
                    logout();
                });
            }
        });
        
        // 更新加入按钮
        joinButtons.forEach(button => {
            if (currentUser.membershipType === 'premium') {
                button.textContent = '会员中心';
                button.href = 'membership.html';
            } else {
                button.textContent = '升级为创始会员';
            }
        });
    } else {
        // 用户未登录
        loginButtons.forEach(button => {
            button.textContent = '登录';
            button.classList.remove('logged-in');
            
            // 移除用户菜单
            const nextSibling = button.nextElementSibling;
            if (nextSibling && nextSibling.classList.contains('user-menu')) {
                nextSibling.remove();
            }
            
            // 添加登录页面链接
            button.addEventListener('click', function() {
                window.location.href = 'login.html';
            });
        });
        
        // 更新加入按钮
        joinButtons.forEach(button => {
            button.textContent = '成为创始会员';
            button.addEventListener('click', function() {
                window.location.href = 'register.html';
            });
        });
    }
}
