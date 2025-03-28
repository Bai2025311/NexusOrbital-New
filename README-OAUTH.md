# NexusOrbital 第三方登录集成指南

## 概述

本文档提供了NexusOrbital平台微信和GitHub第三方登录功能的实现说明和部署指南。

## 实现架构

系统采用前后端分离架构：

1. **前端**：处理用户界面和OAuth流程的发起
2. **后端**：处理OAuth回调、用户信息获取和账号关联

## 配置步骤

### 1. 申请第三方应用

#### 微信登录
1. 访问[微信开放平台](https://open.weixin.qq.com/)
2. 注册开发者账号并创建网站应用
3. 获取AppID和AppSecret
4. 设置授权回调域名为您的网站域名

#### GitHub登录
1. 访问[GitHub开发者设置](https://github.com/settings/developers)
2. 创建新的OAuth应用
3. 获取Client ID和Client Secret
4. 设置回调URL为`https://您的域名/github-callback.html`

### 2. 配置服务器

1. 安装依赖：
```bash
cd server
npm install
```

2. 设置环境变量：
```bash
# 微信配置
export WECHAT_APP_ID=您的微信AppID
export WECHAT_APP_SECRET=您的微信AppSecret
export WECHAT_REDIRECT_URI=https://您的域名/wechat-callback.html

# GitHub配置
export GITHUB_CLIENT_ID=您的GitHub客户端ID
export GITHUB_CLIENT_SECRET=您的GitHub客户端密钥
export GITHUB_REDIRECT_URI=https://您的域名/github-callback.html

# 服务器配置
export FRONTEND_URL=https://您的域名
export SESSION_SECRET=您的会话密钥
```

3. 启动服务器：
```bash
npm start
```

### 3. 配置前端

1. 修改`js/oauth-providers.js`中的API基础URL：
```javascript
const API_BASE_URL = 'https://您的API域名/api';
```

2. 修改OAuth配置：
```javascript
// 微信登录配置
wechat: {
    appId: '您的微信AppID',
    redirectUri: encodeURIComponent(window.location.origin + '/wechat-callback.html'),
    scope: 'snsapi_userinfo',
    state: ''
},

// GitHub登录配置
github: {
    clientId: '您的GitHub客户端ID',
    redirectUri: encodeURIComponent(window.location.origin + '/github-callback.html'),
    scope: 'user:email',
    state: ''
}
```

## 功能说明

### 用户数据合并

系统支持将第三方账号与现有账号关联：

1. 当用户使用第三方账号登录时，系统会检查该邮箱是否已存在账号
2. 如果存在，会提示用户选择关联现有账号或创建新账号
3. 选择关联时，需要验证现有账号的密码
4. 关联成功后，用户可以使用任一方式登录

### 安全考虑

1. 使用状态参数(state)防止CSRF攻击
2. 所有敏感操作都需要验证用户密码
3. 服务器端处理OAuth回调，避免在前端暴露密钥

## 测试流程

1. 点击登录页面的"微信登录"或"GitHub登录"按钮
2. 在弹出窗口中完成第三方授权
3. 授权成功后自动返回平台并登录

## 注意事项

1. 在生产环境中，请使用HTTPS保护所有通信
2. 定期更新依赖包以修复潜在安全漏洞
3. 考虑实现访问令牌刷新机制，延长用户会话时间

## 故障排除

1. 如果授权失败，检查应用配置和回调URL是否正确
2. 如果无法获取用户信息，检查权限范围(scope)设置
3. 如果账号关联失败，确保用户密码正确

## 后续优化

1. 添加更多第三方登录选项（如微博、QQ等）
2. 实现用户资料同步功能
3. 添加多因素认证支持
