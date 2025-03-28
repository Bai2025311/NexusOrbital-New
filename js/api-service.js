/**
 * NexusOrbital API服务
 * 提供与后端API交互的方法
 */

class ApiService {
    constructor() {
        // API基础URL，生产环境中应替换为实际API地址
        this.baseUrl = 'https://api.nexusorbital.com/v1';
        
        // 开发环境使用模拟API
        this.useMock = true;
        
        // 获取存储的令牌
        this.token = localStorage.getItem('authToken');
    }

    /**
     * 设置认证令牌
     * @param {string} token - 认证令牌
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    /**
     * 清除认证令牌
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    /**
     * 检查用户是否已认证
     * @returns {boolean} - 是否已认证
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * 获取认证头信息
     * @returns {Object} - 包含认证信息的头部对象
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    /**
     * 发送API请求
     * @param {string} endpoint - API端点
     * @param {string} method - 请求方法 (GET, POST, PUT, DELETE)
     * @param {Object} data - 请求数据
     * @returns {Promise} - 请求Promise
     */
    async request(endpoint, method = 'GET', data = null) {
        // 如果使用模拟API且有对应的模拟方法，则调用模拟方法
        if (this.useMock && this.mockResponses[endpoint] && this.mockResponses[endpoint][method]) {
            console.log(`[Mock API] ${method} ${endpoint}`);
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 300));
            return this.mockResponses[endpoint][method](data);
        }
        
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: this.getAuthHeaders()
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            // 检查响应状态
            if (!response.ok) {
                // 处理认证错误
                if (response.status === 401) {
                    this.clearToken();
                    throw new Error('认证已过期，请重新登录');
                }
                
                const errorData = await response.json();
                throw new Error(errorData.message || '请求失败');
            }
            
            // 解析响应数据
            const responseData = await response.json();
            return responseData;
        } catch (error) {
            console.error(`API请求失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 用户登录
     * @param {string} email - 用户邮箱
     * @param {string} password - 用户密码
     * @returns {Promise} - 登录Promise
     */
    async login(email, password) {
        const response = await this.request('/auth/login', 'POST', { email, password });
        
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    /**
     * 用户注册
     * @param {Object} userData - 用户数据
     * @returns {Promise} - 注册Promise
     */
    async register(userData) {
        return this.request('/auth/register', 'POST', userData);
    }

    /**
     * 获取当前用户信息
     * @returns {Promise} - 用户信息Promise
     */
    async getCurrentUser() {
        return this.request('/users/me', 'GET');
    }

    /**
     * 获取资源列表
     * @param {Object} params - 查询参数
     * @returns {Promise} - 资源列表Promise
     */
    async getResources(params = {}) {
        // 构建查询字符串
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.type) queryParams.append('type', params.type);
        if (params.category) queryParams.append('category', params.category);
        if (params.access) queryParams.append('access', params.access);
        if (params.sort) queryParams.append('sort', params.sort);
        
        const queryString = queryParams.toString();
        const endpoint = `/resources${queryString ? `?${queryString}` : ''}`;
        
        return this.request(endpoint, 'GET');
    }

    /**
     * 获取资源详情
     * @param {string} resourceId - 资源ID
     * @returns {Promise} - 资源详情Promise
     */
    async getResourceDetail(resourceId) {
        return this.request(`/resources/${resourceId}`, 'GET');
    }

    /**
     * 获取相关资源
     * @param {string} resourceId - 资源ID
     * @returns {Promise} - 相关资源Promise
     */
    async getRelatedResources(resourceId) {
        return this.request(`/resources/${resourceId}/related`, 'GET');
    }

    /**
     * 提交资源评分
     * @param {string} resourceId - 资源ID
     * @param {number} rating - 评分 (1-5)
     * @returns {Promise} - 评分提交Promise
     */
    async submitRating(resourceId, rating) {
        return this.request(`/resources/${resourceId}/rate`, 'POST', { rating });
    }

    /**
     * 下载资源
     * @param {string} resourceId - 资源ID
     * @returns {Promise} - 下载信息Promise
     */
    async downloadResource(resourceId) {
        return this.request(`/resources/${resourceId}/download`, 'GET');
    }

    /**
     * 收藏资源
     * @param {string} resourceId - 资源ID
     * @returns {Promise} - 收藏操作Promise
     */
    async saveResource(resourceId) {
        return this.request(`/resources/${resourceId}/save`, 'POST');
    }

    /**
     * 取消收藏资源
     * @param {string} resourceId - 资源ID
     * @returns {Promise} - 取消收藏操作Promise
     */
    async unsaveResource(resourceId) {
        return this.request(`/resources/${resourceId}/unsave`, 'POST');
    }

    /**
     * 获取用户收藏的资源
     * @returns {Promise} - 收藏资源Promise
     */
    async getSavedResources() {
        return this.request('/users/me/saved-resources', 'GET');
    }

    /**
     * 获取用户浏览历史
     * @returns {Promise} - 浏览历史Promise
     */
    async getViewHistory() {
        return this.request('/users/me/view-history', 'GET');
    }

    /**
     * 添加资源浏览记录
     * @param {string} resourceId - 资源ID
     * @returns {Promise} - 添加浏览记录Promise
     */
    async addToViewHistory(resourceId) {
        return this.request('/users/me/view-history', 'POST', { resourceId });
    }

    /**
     * 提交新资源
     * @param {Object} resourceData - 资源数据
     * @returns {Promise} - 提交资源Promise
     */
    async submitResource(resourceData) {
        return this.request('/resources', 'POST', resourceData);
    }

    /**
     * 订阅会员计划
     * @param {string} planId - 计划ID
     * @returns {Promise} - 订阅操作Promise
     */
    async subscribeMembership(planId) {
        return this.request('/users/me/membership', 'POST', { planId });
    }

    /**
     * 获取会员计划列表
     * @returns {Promise} - 会员计划列表Promise
     */
    async getMembershipPlans() {
        return this.request('/memberships', 'GET');
    }

    /**
     * 获取当前用户会员信息
     * @returns {Promise} - 会员信息Promise
     */
    async getUserMembership() {
        return this.request('/user/membership', 'GET');
    }

    /**
     * 更新用户会员信息
     * @param {string} membershipId - 会员计划ID
     * @returns {Promise} - 更新结果Promise
     */
    async updateUserMembership(membershipId) {
        return this.request('/user/membership', 'POST', { membershipId });
    }

    /**
     * 创建交易记录
     * @param {Object} transactionData - 交易数据
     * @returns {Promise} - 创建结果Promise
     */
    async createTransaction(transactionData) {
        return this.request('/transactions', 'POST', transactionData);
    }

    /**
     * 获取交易记录列表
     * @param {Object} params - 查询参数
     * @returns {Promise} - 交易记录列表Promise
     */
    async getTransactions(params = {}) {
        // 构建查询字符串
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);
        if (params.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);
        if (params.timeFilter) queryParams.append('timeFilter', params.timeFilter);
        
        const queryString = queryParams.toString();
        const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;
        
        return this.request(endpoint, 'GET');
    }

    /**
     * 获取交易记录详情
     * @param {string} transactionId - 交易ID
     * @returns {Promise} - 交易记录详情Promise
     */
    async getTransactionDetail(transactionId) {
        return this.request(`/transactions/${transactionId}`, 'GET');
    }

    /**
     * 下载交易收据
     * @param {string} transactionId - 交易ID
     * @returns {Promise} - 收据下载Promise
     */
    async downloadReceipt(transactionId) {
        return this.request(`/transactions/${transactionId}/receipt`, 'GET');
    }

    /**
     * 创建支付订单
     * @param {Object} orderData - 订单数据
     * @returns {Promise} - 创建结果Promise
     */
    async createPaymentOrder(orderData) {
        return this.request('/payments/order', 'POST', orderData);
    }

    /**
     * 查询支付订单状态
     * @param {string} orderId - 订单ID
     * @returns {Promise} - 订单状态Promise
     */
    async queryPaymentOrderStatus(orderId) {
        return this.request(`/payments/order/${orderId}/status`, 'GET');
    }

    /**
     * 处理支付回调
     * @param {string} paymentMethod - 支付方式
     * @param {Object} callbackData - 回调数据
     * @returns {Promise} - 处理结果Promise
     */
    async handlePaymentCallback(paymentMethod, callbackData) {
        return this.request(`/payments/callback/${paymentMethod}`, 'POST', callbackData);
    }

    /**
     * 模拟API响应
     * 开发环境使用，模拟后端API响应
     */
    mockResponses = {
        '/auth/login': {
            POST: (data) => {
                // 简单的模拟登录逻辑
                if (data.email === 'test@example.com' && data.password === 'password') {
                    return {
                        success: true,
                        token: 'mock-jwt-token',
                        user: {
                            id: 'user_1',
                            name: '测试用户',
                            email: 'test@example.com',
                            membership: {
                                plan: '基础会员',
                                status: 'active',
                                expiresAt: '2025-12-31'
                            }
                        }
                    };
                } else {
                    throw new Error('邮箱或密码不正确');
                }
            }
        },
        
        '/auth/register': {
            POST: (data) => {
                return {
                    success: true,
                    message: '注册成功，请登录',
                    user: {
                        id: 'user_' + Date.now(),
                        name: data.name,
                        email: data.email
                    }
                };
            }
        },
        
        '/users/me': {
            GET: () => {
                return {
                    id: 'user_1',
                    name: '测试用户',
                    email: 'test@example.com',
                    membership: {
                        plan: '基础会员',
                        status: 'active',
                        expiresAt: '2025-12-31'
                    },
                    createdAt: '2024-01-01T00:00:00Z'
                };
            }
        },
        
        '/resources': {
            GET: (params) => {
                // 从本地存储获取资源数据
                const resources = JSON.parse(localStorage.getItem('resources')) || [];
                let filteredResources = [...resources];
                
                // 应用筛选条件
                if (params) {
                    if (params.search) {
                        const searchLower = params.search.toLowerCase();
                        filteredResources = filteredResources.filter(resource => 
                            resource.title.toLowerCase().includes(searchLower) || 
                            (resource.description && resource.description.toLowerCase().includes(searchLower)) ||
                            (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(searchLower)))
                        );
                    }
                    
                    if (params.type) {
                        filteredResources = filteredResources.filter(resource => 
                            resource.type === params.type
                        );
                    }
                    
                    if (params.category) {
                        filteredResources = filteredResources.filter(resource => 
                            resource.category === params.category
                        );
                    }
                    
                    if (params.access) {
                        filteredResources = filteredResources.filter(resource => 
                            resource.access === params.access
                        );
                    }
                    
                    // 排序
                    if (params.sort) {
                        switch (params.sort) {
                            case 'newest':
                                filteredResources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                                break;
                            case 'popular':
                                filteredResources.sort((a, b) => (b.views || 0) - (a.views || 0));
                                break;
                            case 'rating':
                                filteredResources.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                                break;
                            case 'downloads':
                                filteredResources.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
                                break;
                        }
                    }
                    
                    // 分页
                    const page = parseInt(params.page) || 1;
                    const limit = parseInt(params.limit) || 10;
                    const startIndex = (page - 1) * limit;
                    const endIndex = startIndex + limit;
                    
                    const paginatedResources = filteredResources.slice(startIndex, endIndex);
                    
                    return {
                        resources: paginatedResources,
                        pagination: {
                            total: filteredResources.length,
                            page: page,
                            limit: limit,
                            totalPages: Math.ceil(filteredResources.length / limit)
                        }
                    };
                }
                
                return {
                    resources: filteredResources,
                    pagination: {
                        total: filteredResources.length,
                        page: 1,
                        limit: filteredResources.length,
                        totalPages: 1
                    }
                };
            },
            POST: (data) => {
                // 创建新资源
                const resources = JSON.parse(localStorage.getItem('resources')) || [];
                const newResource = {
                    id: 'res_' + Date.now(),
                    ...data,
                    creatorId: 'user_1',
                    creatorName: '测试用户',
                    createdAt: new Date().toISOString(),
                    views: 0,
                    downloads: 0,
                    rating: 0
                };
                
                resources.unshift(newResource);
                localStorage.setItem('resources', JSON.stringify(resources));
                
                return {
                    success: true,
                    message: '资源提交成功',
                    resource: newResource
                };
            }
        },
        
        // 动态路径处理
        '/resources/': {
            GET: (resourceId) => {
                // 获取资源详情
                const resources = JSON.parse(localStorage.getItem('resources')) || [];
                const resource = resources.find(r => r.id === resourceId);
                
                if (!resource) {
                    throw new Error('资源不存在');
                }
                
                // 更新浏览量
                resource.views = (resource.views || 0) + 1;
                localStorage.setItem('resources', JSON.stringify(resources));
                
                return {
                    success: true,
                    resource
                };
            }
        },
        
        '/resources//related': {
            GET: (resourceId) => {
                // 获取相关资源
                const resources = JSON.parse(localStorage.getItem('resources')) || [];
                const currentResource = resources.find(r => r.id === resourceId);
                
                if (!currentResource) {
                    throw new Error('资源不存在');
                }
                
                // 基于标签、类型和分类查找相关资源
                let relatedResources = resources.filter(r => 
                    r.id !== resourceId && (
                        r.type === currentResource.type ||
                        r.category === currentResource.category ||
                        (r.tags && currentResource.tags && 
                         r.tags.some(tag => currentResource.tags.includes(tag)))
                    )
                );
                
                // 限制返回数量
                relatedResources = relatedResources.slice(0, 3);
                
                return {
                    success: true,
                    resources: relatedResources
                };
            }
        },
        
        '/resources//rate': {
            POST: (resourceId, data) => {
                // 提交评分
                const resources = JSON.parse(localStorage.getItem('resources')) || [];
                const resourceIndex = resources.findIndex(r => r.id === resourceId);
                
                if (resourceIndex === -1) {
                    throw new Error('资源不存在');
                }
                
                // 获取用户评分历史
                const userRatings = JSON.parse(localStorage.getItem('userRatings')) || [];
                const ratingIndex = userRatings.findIndex(r => r.resourceId === resourceId);
                
                if (ratingIndex !== -1) {
                    // 更新现有评分
                    userRatings[ratingIndex].rating = data.rating;
                } else {
                    // 添加新评分
                    userRatings.push({
                        resourceId,
                        rating: data.rating,
                        timestamp: new Date().toISOString()
                    });
                }
                
                // 保存用户评分
                localStorage.setItem('userRatings', JSON.stringify(userRatings));
                
                // 计算新的平均评分
                const resourceRatings = userRatings.filter(r => r.resourceId === resourceId);
                const totalRating = resourceRatings.reduce((sum, r) => sum + r.rating, 0);
                const averageRating = totalRating / resourceRatings.length;
                
                // 更新资源评分
                resources[resourceIndex].rating = averageRating;
                localStorage.setItem('resources', JSON.stringify(resources));
                
                return {
                    success: true,
                    message: '评分提交成功',
                    newRating: averageRating
                };
            }
        },
        
        '/resources//download': {
            GET: (resourceId) => {
                // 模拟下载资源
                const resources = JSON.parse(localStorage.getItem('resources')) || [];
                const resourceIndex = resources.findIndex(r => r.id === resourceId);
                
                if (resourceIndex === -1) {
                    throw new Error('资源不存在');
                }
                
                // 更新下载量
                resources[resourceIndex].downloads = (resources[resourceIndex].downloads || 0) + 1;
                localStorage.setItem('resources', JSON.stringify(resources));
                
                return {
                    success: true,
                    message: '下载开始',
                    downloadUrl: `https://example.com/download/${resourceId}`
                };
            }
        },
        
        '/resources//save': {
            POST: (resourceId) => {
                // 收藏资源
                const savedResources = JSON.parse(localStorage.getItem('savedResources')) || [];
                
                if (!savedResources.includes(resourceId)) {
                    savedResources.push(resourceId);
                    localStorage.setItem('savedResources', JSON.stringify(savedResources));
                }
                
                return {
                    success: true,
                    message: '资源已收藏'
                };
            }
        },
        
        '/resources//unsave': {
            POST: (resourceId) => {
                // 取消收藏资源
                let savedResources = JSON.parse(localStorage.getItem('savedResources')) || [];
                savedResources = savedResources.filter(id => id !== resourceId);
                localStorage.setItem('savedResources', JSON.stringify(savedResources));
                
                return {
                    success: true,
                    message: '已取消收藏'
                };
            }
        },
        
        '/users/me/saved-resources': {
            GET: () => {
                // 获取用户收藏的资源
                const savedResourceIds = JSON.parse(localStorage.getItem('savedResources')) || [];
                const resources = JSON.parse(localStorage.getItem('resources')) || [];
                
                const savedResources = resources.filter(resource => 
                    savedResourceIds.includes(resource.id)
                );
                
                return {
                    success: true,
                    resources: savedResources
                };
            }
        },
        
        '/users/me/view-history': {
            GET: () => {
                // 获取用户浏览历史
                const viewHistory = JSON.parse(localStorage.getItem('resourceViewHistory')) || [];
                const resources = JSON.parse(localStorage.getItem('resources')) || [];
                
                // 合并历史记录与资源详情
                const historyWithDetails = viewHistory.map(historyItem => {
                    const resource = resources.find(r => r.id === historyItem.resourceId);
                    return {
                        ...historyItem,
                        resource
                    };
                }).filter(item => item.resource); // 过滤掉不存在的资源
                
                return {
                    success: true,
                    history: historyWithDetails
                };
            },
            POST: (data) => {
                // 添加浏览记录
                const viewHistory = JSON.parse(localStorage.getItem('resourceViewHistory')) || [];
                
                // 检查是否已存在该资源的浏览记录
                const existingIndex = viewHistory.findIndex(item => item.resourceId === data.resourceId);
                
                if (existingIndex !== -1) {
                    // 更新现有记录
                    viewHistory[existingIndex].timestamp = new Date().toISOString();
                    viewHistory[existingIndex].count = (viewHistory[existingIndex].count || 1) + 1;
                } else {
                    // 添加新记录
                    viewHistory.push({
                        resourceId: data.resourceId,
                        timestamp: new Date().toISOString(),
                        count: 1
                    });
                }
                
                // 保存浏览历史
                localStorage.setItem('resourceViewHistory', JSON.stringify(viewHistory));
                
                return {
                    success: true,
                    message: '浏览记录已添加'
                };
            }
        },
        
        '/users/me/membership': {
            POST: (data) => {
                // 订阅会员计划
                const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
                
                // 设置会员信息
                userInfo.membership = {
                    plan: data.planId,
                    status: 'active',
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后
                };
                
                // 保存用户信息
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                
                return {
                    success: true,
                    message: `您已成功订阅${data.planId}会员计划`,
                    membership: userInfo.membership
                };
            }
        },
        
        '/user/membership': {
            'GET': () => ({
                success: true,
                data: {
                    id: 'founder',
                    name: '创始会员计划',
                    startDate: '2025-01-15',
                    endDate: '2026-01-15',
                    features: [
                        "无限访问所有技术资源",
                        "优先参与众筹项目",
                        "专家社区直接交流",
                        "每月专属线上活动",
                        "项目协作工具高级功能",
                        "创始会员专属徽章"
                    ]
                }
            }),
            'POST': (data) => {
                const membershipTypes = {
                    'professional': {
                        id: 'professional',
                        name: '专业会员计划',
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                        features: [
                            "创始会员所有权益",
                            "高级项目协作工具",
                            "专家一对一咨询（每月1次）",
                            "优先项目孵化支持",
                            "专属技术研讨会",
                            "API高级访问权限"
                        ]
                    },
                    'enterprise': {
                        id: 'enterprise',
                        name: '企业会员计划',
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                        features: [
                            "专业会员所有权益",
                            "定制化技术支持",
                            "企业级API访问",
                            "优先漏洞修复",
                            "专属技术顾问",
                            "企业品牌展示"
                        ]
                    },
                    'founder': {
                        id: 'founder',
                        name: '创始会员计划',
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                        features: [
                            "无限访问所有技术资源",
                            "优先参与众筹项目",
                            "专家社区直接交流",
                            "每月专属线上活动",
                            "项目协作工具高级功能",
                            "创始会员专属徽章"
                        ]
                    }
                };
                
                return {
                    success: true,
                    data: {
                        membership: membershipTypes[data.membershipId] || membershipTypes['founder']
                    }
                };
            }
        },
        
        '/transactions': {
            'GET': (params) => {
                // 模拟交易记录
                const transactions = [
                    {
                        id: 'txn_001',
                        transactionId: 'NO20250327001',
                        amount: 299.00,
                        paymentMethod: 'alipay',
                        membershipId: 'founder',
                        description: '升级到创始会员计划',
                        status: 'completed',
                        date: '2025-03-15T10:30:00Z'
                    },
                    {
                        id: 'txn_002',
                        transactionId: 'NO20250327002',
                        amount: 599.00,
                        paymentMethod: 'wechat',
                        membershipId: 'professional',
                        description: '升级到专业会员计划',
                        status: 'pending',
                        date: '2025-03-20T14:45:00Z'
                    },
                    {
                        id: 'txn_003',
                        transactionId: 'NO20250327003',
                        amount: 999.00,
                        paymentMethod: 'creditcard',
                        membershipId: 'enterprise',
                        description: '升级到企业会员计划',
                        status: 'failed',
                        date: '2025-03-25T09:15:00Z'
                    }
                ];
                
                // 应用筛选条件
                let filteredTransactions = [...transactions];
                
                if (params && params.status && params.status !== 'all') {
                    filteredTransactions = filteredTransactions.filter(t => t.status === params.status);
                }
                
                if (params && params.paymentMethod && params.paymentMethod !== 'all') {
                    filteredTransactions = filteredTransactions.filter(t => t.paymentMethod === params.paymentMethod);
                }
                
                // 分页
                const page = params && params.page ? parseInt(params.page) : 1;
                const limit = params && params.limit ? parseInt(params.limit) : 10;
                const total = filteredTransactions.length;
                const totalPages = Math.ceil(total / limit);
                const offset = (page - 1) * limit;
                const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);
                
                return {
                    success: true,
                    data: {
                        transactions: paginatedTransactions,
                        pagination: {
                            currentPage: page,
                            totalPages,
                            totalItems: total,
                            limit
                        }
                    }
                };
            },
            'POST': (data) => {
                // 生成交易ID
                const date = new Date();
                const transactionId = `NO${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                
                // 创建新交易记录
                const newTransaction = {
                    id: `txn_${Date.now()}`,
                    transactionId,
                    amount: parseFloat(data.amount),
                    paymentMethod: data.paymentMethod,
                    membershipId: data.membershipId,
                    description: data.description || `升级到${data.membershipId}会员`,
                    status: 'completed',
                    date: new Date().toISOString()
                };
                
                return {
                    success: true,
                    data: newTransaction
                };
            }
        },
        
        '/transactions/:id': {
            'GET': (id) => {
                // 模拟交易记录详情
                return {
                    success: true,
                    data: {
                        id: 'txn_001',
                        transactionId: 'NO20250327001',
                        amount: 299.00,
                        paymentMethod: 'alipay',
                        membershipId: 'founder',
                        description: '升级到创始会员计划',
                        status: 'completed',
                        date: '2025-03-15T10:30:00Z',
                        metadata: {
                            paymentId: '2025031510300001',
                            platform: 'web'
                        }
                    }
                };
            }
        },
        
        '/transactions/:id/receipt': {
            'GET': (id) => {
                // 模拟收据下载
                return {
                    success: true,
                    data: {
                        receipt: {
                            transactionId: 'NO20250327001',
                            date: '2025-03-15T10:30:00Z',
                            amount: 299.00,
                            paymentMethod: 'alipay',
                            description: '升级到创始会员计划',
                            membershipId: 'founder'
                        }
                    }
                };
            }
        },
        
        '/payments/order': {
            'POST': (data) => {
                // 模拟创建支付订单
                const orderId = `order_${Date.now()}`;
                
                let paymentUrl = '';
                let qrCodeUrl = '';
                
                if (data.paymentMethod === 'alipay') {
                    paymentUrl = 'https://example.com/alipay?orderId=' + orderId;
                } else if (data.paymentMethod === 'wechat') {
                    qrCodeUrl = 'https://example.com/wechat/qrcode?orderId=' + orderId;
                }
                
                return {
                    success: true,
                    data: {
                        orderId,
                        paymentMethod: data.paymentMethod,
                        amount: data.amount,
                        paymentUrl,
                        qrCodeUrl,
                        status: 'created',
                        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30分钟后过期
                    }
                };
            }
        },
        
        '/payments/order/:id/status': {
            'GET': (id) => {
                // 模拟查询支付订单状态
                return {
                    success: true,
                    data: {
                        orderId: id,
                        status: Math.random() > 0.3 ? 'paid' : 'pending', // 随机模拟支付状态
                        payTime: Math.random() > 0.3 ? new Date().toISOString() : null
                    }
                };
            }
        }
    };
}

// 创建API服务实例
const apiService = new ApiService();

// 导出API服务实例
export default apiService;
