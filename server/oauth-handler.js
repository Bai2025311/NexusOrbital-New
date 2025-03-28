/**
 * NexusOrbital OAuth服务器端处理模块
 * 版本: 2025.03.27
 * 作者: 星际人居技术设计团队
 */

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'nexusorbital-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// OAuth配置
const oauthConfig = {
    wechat: {
        appId: process.env.WECHAT_APP_ID,
        appSecret: process.env.WECHAT_APP_SECRET,
        redirectUri: process.env.WECHAT_REDIRECT_URI || 'http://localhost:8080/wechat-callback.html',
        tokenUrl: 'https://api.weixin.qq.com/sns/oauth2/access_token',
        userInfoUrl: 'https://api.weixin.qq.com/sns/userinfo'
    },
    github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:8080/github-callback.html',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user'
    }
};

// 用户数据存储（在实际应用中应使用数据库）
const users = [];

/**
 * 微信OAuth回调处理
 */
app.get('/api/oauth/wechat/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        
        // 验证状态（防止CSRF攻击）
        if (state !== req.session.oauthState) {
            return res.status(400).json({ error: '状态验证失败，可能存在安全风险' });
        }
        
        // 清除会话中的状态
        delete req.session.oauthState;
        
        // 获取访问令牌
        const tokenResponse = await axios.get(oauthConfig.wechat.tokenUrl, {
            params: {
                appid: oauthConfig.wechat.appId,
                secret: oauthConfig.wechat.appSecret,
                code,
                grant_type: 'authorization_code'
            }
        });
        
        if (tokenResponse.data.errcode) {
            throw new Error(`微信API错误: ${tokenResponse.data.errmsg}`);
        }
        
        const { access_token, openid } = tokenResponse.data;
        
        // 获取用户信息
        const userInfoResponse = await axios.get(oauthConfig.wechat.userInfoUrl, {
            params: {
                access_token,
                openid,
                lang: 'zh_CN'
            }
        });
        
        if (userInfoResponse.data.errcode) {
            throw new Error(`微信API错误: ${userInfoResponse.data.errmsg}`);
        }
        
        // 处理用户信息
        const userInfo = {
            id: openid,
            name: userInfoResponse.data.nickname,
            avatar: userInfoResponse.data.headimgurl,
            provider: 'wechat'
        };
        
        // 查找或创建用户
        const user = findOrCreateUser(userInfo);
        
        // 返回用户信息
        res.json({ success: true, user });
    } catch (error) {
        console.error('微信登录处理错误:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GitHub OAuth回调处理
 */
app.get('/api/oauth/github/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        
        // 验证状态（防止CSRF攻击）
        if (state !== req.session.oauthState) {
            return res.status(400).json({ error: '状态验证失败，可能存在安全风险' });
        }
        
        // 清除会话中的状态
        delete req.session.oauthState;
        
        // 获取访问令牌
        const tokenResponse = await axios.post(oauthConfig.github.tokenUrl, {
            client_id: oauthConfig.github.clientId,
            client_secret: oauthConfig.github.clientSecret,
            code,
            redirect_uri: oauthConfig.github.redirectUri
        }, {
            headers: {
                Accept: 'application/json'
            }
        });
        
        const { access_token } = tokenResponse.data;
        
        // 获取用户信息
        const userInfoResponse = await axios.get(oauthConfig.github.userInfoUrl, {
            headers: {
                Authorization: `token ${access_token}`
            }
        });
        
        // 获取用户邮箱
        let email = userInfoResponse.data.email;
        
        // 如果GitHub未返回公开邮箱，尝试获取用户的邮箱列表
        if (!email) {
            const emailsResponse = await axios.get('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `token ${access_token}`
                }
            });
            
            // 查找主要邮箱
            const primaryEmail = emailsResponse.data.find(e => e.primary);
            if (primaryEmail) {
                email = primaryEmail.email;
            }
        }
        
        // 处理用户信息
        const userInfo = {
            id: userInfoResponse.data.id.toString(),
            name: userInfoResponse.data.name || userInfoResponse.data.login,
            email: email,
            avatar: userInfoResponse.data.avatar_url,
            provider: 'github'
        };
        
        // 查找或创建用户
        const user = findOrCreateUser(userInfo);
        
        // 返回用户信息
        res.json({ success: true, user });
    } catch (error) {
        console.error('GitHub登录处理错误:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 生成OAuth状态并存储在会话中
 */
app.get('/api/oauth/state', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;
    res.json({ state });
});

/**
 * 关联第三方账号与现有账号
 */
app.post('/api/user/link-account', (req, res) => {
    try {
        const { userId, oauthProvider, oauthId, email, password } = req.body;
        
        // 验证用户凭据
        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        
        // 验证密码（实际应用中应使用加密比较）
        if (user.password !== hashPassword(password)) {
            return res.status(401).json({ error: '密码错误' });
        }
        
        // 检查是否已有其他用户关联了此第三方账号
        const existingUser = users.find(u => 
            u.oauthAccounts && 
            u.oauthAccounts.some(a => a.provider === oauthProvider && a.id === oauthId)
        );
        
        if (existingUser && existingUser.id !== userId) {
            return res.status(409).json({ error: '此第三方账号已被其他用户关联' });
        }
        
        // 添加或更新第三方账号关联
        if (!user.oauthAccounts) {
            user.oauthAccounts = [];
        }
        
        const existingAccount = user.oauthAccounts.find(a => a.provider === oauthProvider);
        if (existingAccount) {
            existingAccount.id = oauthId;
        } else {
            user.oauthAccounts.push({
                provider: oauthProvider,
                id: oauthId
            });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        console.error('账号关联错误:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 查找或创建用户
 * @param {Object} userInfo - 第三方登录提供的用户信息
 * @returns {Object} - 用户对象
 */
function findOrCreateUser(userInfo) {
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
                id: generateUserId(),
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
        }
    }
    
    // 更新最后登录时间
    user.lastLogin = new Date().toISOString();
    
    return user;
}

/**
 * 生成用户ID
 * @returns {string} - 用户ID
 */
function generateUserId() {
    return 'user_' + crypto.randomBytes(8).toString('hex');
}

/**
 * 简单的密码哈希（仅用于演示，实际应用中应使用更安全的方式）
 * @param {string} password - 原始密码
 * @returns {string} - 哈希后的密码
 */
function hashPassword(password) {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`NexusOrbital OAuth服务器运行在端口 ${PORT}`);
});

module.exports = app;
