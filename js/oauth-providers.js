/**
 * NexusOrbital 第三方登录提供商集成
 * 版本: 2025.03.27
 * 作者: 星际人居技术设计团队
 */

// API基础URL - 使用模拟模式，不需要实际服务器
const API_BASE_URL = 'mock';
// 是否使用模拟模式（无需真实API）
const USE_MOCK_MODE = true;

// OAuth配置
const OAuthConfig = {
    // 微信登录配置
    wechat: {
        appId: 'wx_nexusorbital_demo', // 模拟AppID
        redirectUri: encodeURIComponent(window.location.origin + '/wechat-callback.html'),
        scope: 'snsapi_userinfo',
        state: '' // 将从服务器获取
    },
    
    // GitHub登录配置
    github: {
        clientId: 'gh_nexusorbital_demo', // 模拟Client ID
        redirectUri: encodeURIComponent(window.location.origin + '/github-callback.html'),
        scope: 'user:email',
        state: '' // 将从服务器获取
    }
};

/**
 * 初始化第三方登录按钮
 */
function initOAuthButtons() {
    // 微信登录按钮
    const wechatBtn = document.querySelector('.social-btn.wechat');
    if (wechatBtn) {
        wechatBtn.addEventListener('click', initiateWechatLogin);
    }
    
    // GitHub登录按钮
    const githubBtn = document.querySelector('.social-btn.github');
    if (githubBtn) {
        githubBtn.addEventListener('click', initiateGithubLogin);
    }
}

/**
 * 获取OAuth状态
 * @returns {Promise<string>} - 状态字符串
 */
async function getOAuthState() {
    if (USE_MOCK_MODE) {
        // 模拟模式下直接生成状态
        const state = generateRandomState();
        // 存储状态以供回调验证
        localStorage.setItem('nexusorbital_oauth_state', state);
        return state;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/oauth/state`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('获取OAuth状态失败');
        }
        
        const data = await response.json();
        return data.state;
    } catch (error) {
        console.error('获取OAuth状态错误:', error);
        // 如果API请求失败，回退到本地生成的状态
        return generateRandomState();
    }
}

/**
 * 生成随机状态字符串，用于防止CSRF攻击
 * @returns {string} - 随机状态字符串
 */
function generateRandomState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

/**
 * 启动微信登录流程
 */
async function initiateWechatLogin() {
    try {
        // 获取状态
        OAuthConfig.wechat.state = await getOAuthState();
        
        if (USE_MOCK_MODE) {
            // 模拟模式下直接打开回调页面进行模拟登录
            window.open(`wechat-callback.html?code=mock_auth_code&state=${OAuthConfig.wechat.state}`, '_blank', 'width=800,height=600');
            return;
        }
        
        // 构建授权URL
        const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${OAuthConfig.wechat.appId}&redirect_uri=${OAuthConfig.wechat.redirectUri}&response_type=code&scope=${OAuthConfig.wechat.scope}&state=${OAuthConfig.wechat.state}#wechat_redirect`;
        
        // 在新窗口中打开授权页面
        window.open(authUrl, '_blank', 'width=800,height=600');
    } catch (error) {
        console.error('启动微信登录错误:', error);
        alert('启动微信登录失败，请稍后重试');
    }
}

/**
 * 启动GitHub登录流程
 */
async function initiateGithubLogin() {
    try {
        // 获取状态
        OAuthConfig.github.state = await getOAuthState();
        
        if (USE_MOCK_MODE) {
            // 模拟模式下直接打开回调页面进行模拟登录
            window.open(`github-callback.html?code=mock_auth_code&state=${OAuthConfig.github.state}`, '_blank', 'width=800,height=600');
            return;
        }
        
        // 构建授权URL
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${OAuthConfig.github.clientId}&redirect_uri=${OAuthConfig.github.redirectUri}&scope=${OAuthConfig.github.scope}&state=${OAuthConfig.github.state}`;
        
        // 在新窗口中打开授权页面
        window.open(authUrl, '_blank', 'width=800,height=600');
    } catch (error) {
        console.error('启动GitHub登录错误:', error);
        alert('启动GitHub登录失败，请稍后重试');
    }
}

/**
 * 处理OAuth回调
 * @param {string} provider - 提供商名称（wechat或github）
 * @param {string} code - 授权码
 * @param {string} state - 状态码
 * @returns {Promise} - 包含用户信息的Promise
 */
async function handleOAuthCallback(provider, code, state) {
    try {
        // 验证状态以防止CSRF攻击
        const savedState = localStorage.getItem('nexusorbital_oauth_state');
        if (state !== savedState) {
            throw new Error('状态验证失败，可能存在安全风险');
        }
        
        // 清除存储的状态
        localStorage.removeItem('nexusorbital_oauth_state');
        
        if (USE_MOCK_MODE) {
            // 模拟模式下返回模拟用户数据
            if (provider === 'wechat') {
                return {
                    id: 'wx_' + Math.random().toString(36).substring(2, 10),
                    name: '微信用户' + Math.floor(Math.random() * 1000),
                    avatar: 'https://example.com/default-avatar.png',
                    provider: 'wechat',
                    // 随机决定是否需要账号关联
                    needsLinking: Math.random() > 0.5,
                    existingUserId: 'user_existing',
                    email: 'existing@example.com'
                };
            } else if (provider === 'github') {
                return {
                    id: 'gh_' + Math.random().toString(36).substring(2, 10),
                    name: 'GitHub用户' + Math.floor(Math.random() * 1000),
                    email: `github${Math.floor(Math.random() * 1000)}@example.com`,
                    avatar: 'https://example.com/default-avatar.png',
                    provider: 'github',
                    // 随机决定是否需要账号关联
                    needsLinking: Math.random() > 0.5,
                    existingUserId: 'user_existing',
                    email: 'existing@example.com'
                };
            }
        }
        
        // 调用服务器API处理OAuth回调
        const response = await fetch(`${API_BASE_URL}/oauth/${provider}/callback?code=${code}&state=${state}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '登录处理失败');
        }
        
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error(`处理${provider}回调错误:`, error);
        throw error;
    }
}

/**
 * 使用第三方登录信息注册/登录用户
 * @param {Object} userInfo - 第三方登录提供的用户信息
 * @returns {Object} - 登录结果
 */
function loginWithOAuth(userInfo) {
    // 获取用户列表
    const users = JSON.parse(localStorage.getItem('nexusorbital_users') || '[]');
    
    // 查找是否已存在使用此第三方账号登录的用户
    let user = users.find(u => 
        (u.oauthAccounts && u.oauthAccounts.some(a => a.provider === userInfo.provider && a.id === userInfo.id)) ||
        (u.oauthProvider === userInfo.provider && u.oauthId === userInfo.id)
    );
    
    if (!user) {
        // 如果提供了邮箱，检查是否有使用此邮箱的现有用户
        if (userInfo.email) {
            user = users.find(u => u.email === userInfo.email);
            
            if (user) {
                // 将第三方账号关联到现有用户
                if (!user.oauthAccounts) {
                    user.oauthAccounts = [];
                }
                
                user.oauthAccounts.push({
                    provider: userInfo.provider,
                    id: userInfo.id
                });
            }
        }
        
        if (!user) {
            // 创建新用户
            user = {
                id: 'user_' + Math.random().toString(36).substring(2, 10),
                name: userInfo.name,
                email: userInfo.email || `${userInfo.provider}_${userInfo.id}@nexusorbital.example`,
                avatar: userInfo.avatar,
                role: 'member',
                membershipType: 'basic',
                registrationDate: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                oauthAccounts: [{
                    provider: userInfo.provider,
                    id: userInfo.id
                }]
            };
            
            users.push(user);
            localStorage.setItem('nexusorbital_users', JSON.stringify(users));
        } else {
            // 更新现有用户
            localStorage.setItem('nexusorbital_users', JSON.stringify(users));
        }
    }
    
    // 更新最后登录时间
    user.lastLogin = new Date().toISOString();
    localStorage.setItem('nexusorbital_users', JSON.stringify(users));
    
    // 设置登录状态
    setLoggedInUser(user);
    
    return {
        success: true,
        message: '登录成功',
        isNewUser: !user
    };
}

/**
 * 关联第三方账号与现有账号
 * @param {string} userId - 用户ID
 * @param {string} oauthProvider - 提供商名称
 * @param {string} oauthId - 第三方账号ID
 * @param {string} password - 用户密码（用于验证）
 * @returns {Promise} - 包含结果的Promise
 */
async function linkAccount(userId, oauthProvider, oauthId, password) {
    if (USE_MOCK_MODE) {
        // 模拟模式下，任何密码都视为正确
        if (password.length > 0) {
            return {
                success: true,
                user: {
                    id: userId,
                    name: '已关联用户',
                    email: 'existing@example.com',
                    avatar: 'https://example.com/default-avatar.png',
                    role: 'member',
                    membershipType: 'basic',
                    oauthAccounts: [{
                        provider: oauthProvider,
                        id: oauthId
                    }]
                }
            };
        } else {
            throw new Error('密码不能为空');
        }
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/link-account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                oauthProvider,
                oauthId,
                password
            }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '账号关联失败');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('账号关联错误:', error);
        throw error;
    }
}

// 导出函数供其他模块使用
window.OAuthProviders = {
    initOAuthButtons,
    handleOAuthCallback,
    loginWithOAuth,
    linkAccount
};
