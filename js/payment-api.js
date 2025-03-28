/**
 * NexusOrbital支付API模块
 * 用于处理各种支付方式的接口集成
 */

// 支付API配置
const PaymentAPIConfig = {
    // API基础URL
    apiBaseUrl: 'http://localhost:3000/api',
    
    // 支付宝配置
    alipay: {
        appId: 'YOUR_ALIPAY_APP_ID',
        merchantId: 'YOUR_ALIPAY_MERCHANT_ID',
        apiEndpoint: 'https://api.example.com/alipay',
        returnUrl: window.location.origin + '/payment-callback.html?method=alipay',
        notifyUrl: 'http://localhost:3000/api/payment/callback/alipay'
    },
    // 微信支付配置
    wechat: {
        appId: 'YOUR_WECHAT_APP_ID',
        merchantId: 'YOUR_WECHAT_MERCHANT_ID',
        apiEndpoint: 'https://api.example.com/wechatpay',
        notifyUrl: 'http://localhost:3000/api/payment/callback/wechat'
    },
    // 信用卡支付配置（使用Stripe作为示例）
    creditcard: {
        publishableKey: 'YOUR_STRIPE_PUBLISHABLE_KEY',
        apiEndpoint: 'https://api.example.com/stripe',
        returnUrl: window.location.origin + '/payment-callback.html?method=creditcard',
        notifyUrl: 'http://localhost:3000/api/payment/callback/creditcard'
    }
};

/**
 * 支付安全工具类
 */
class PaymentSecurity {
    /**
     * 生成随机交易号
     * @returns {string} 随机交易号
     */
    static generateTransactionId() {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000000);
        return `NO${timestamp}${random}`;
    }

    /**
     * 生成签名
     * @param {Object} params - 需要签名的参数
     * @param {string} secretKey - 密钥
     * @returns {string} 签名结果
     */
    static generateSignature(params, secretKey) {
        // 按照字母顺序排序参数
        const sortedKeys = Object.keys(params).sort();
        let signStr = '';
        
        // 构建签名字符串
        for (const key of sortedKeys) {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                signStr += `${key}=${params[key]}&`;
            }
        }
        
        // 添加密钥
        signStr += `key=${secretKey}`;
        
        // 使用MD5加密（实际项目中可能需要更安全的算法）
        return this.md5(signStr);
    }

    /**
     * 简单的MD5实现（实际项目中应使用专业的加密库）
     * @param {string} str - 需要加密的字符串
     * @returns {string} MD5结果
     */
    static md5(str) {
        // 注意：这只是一个示例，实际项目中应使用专业的加密库
        // 如crypto-js: const hash = CryptoJS.MD5(str).toString();
        return str; // 占位，实际项目中替换为真实的MD5实现
    }

    /**
     * 验证支付回调签名
     * @param {Object} callbackData - 回调数据
     * @param {string} signature - 回调签名
     * @param {string} secretKey - 密钥
     * @returns {boolean} 验证结果
     */
    static verifyCallbackSignature(callbackData, signature, secretKey) {
        const calculatedSignature = this.generateSignature(callbackData, secretKey);
        return calculatedSignature === signature;
    }
}

/**
 * 支付结果处理类
 */
class PaymentResult {
    /**
     * 处理支付成功
     * @param {Object} paymentData - 支付数据
     * @param {Function} callback - 回调函数
     */
    static async handleSuccess(paymentData, callback) {
        console.log('支付成功:', paymentData);
        
        try {
            // 获取用户令牌
            const userToken = localStorage.getItem('nexusorbital_token');
            
            if (!userToken) {
                throw new Error('用户未登录');
            }
            
            // 创建交易记录
            const response = await fetch(`${PaymentAPIConfig.apiBaseUrl}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    amount: paymentData.amount,
                    paymentMethod: paymentData.paymentMethod,
                    membershipId: paymentData.membershipType,
                    description: `升级到${formatMembershipType(paymentData.membershipType)}会员`
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || '创建交易记录失败');
            }
            
            // 更新用户会员信息
            const userResponse = await fetch(`${PaymentAPIConfig.apiBaseUrl}/user/membership`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    membershipId: paymentData.membershipType
                })
            });
            
            const userResult = await userResponse.json();
            
            if (!userResult.success) {
                throw new Error(userResult.message || '更新用户会员信息失败');
            }
            
            // 更新本地用户数据
            const user = JSON.parse(localStorage.getItem('nexusorbital_user') || '{}');
            
            user.membership = userResult.data.membership;
            
            // 保存更新后的用户信息
            localStorage.setItem('nexusorbital_user', JSON.stringify(user));
            
            // 记录支付交易到本地（备份）
            this.saveTransaction(paymentData);
            
            // 执行回调
            if (typeof callback === 'function') {
                callback(paymentData);
            }
        } catch (error) {
            console.error('处理支付成功时出错:', error);
            
            // 如果后端处理失败，仍然更新本地用户数据作为备份方案
            const user = JSON.parse(localStorage.getItem('nexusorbital_user') || '{}');
            
            // 根据支付的会员计划更新用户信息
            if (paymentData.membershipType === 'professional') {
                user.membership = {
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
                };
            } else if (paymentData.membershipType === 'enterprise') {
                user.membership = {
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
                };
            } else if (paymentData.membershipType === 'founder') {
                user.membership = {
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
                };
            }
            
            // 保存更新后的用户信息
            localStorage.setItem('nexusorbital_user', JSON.stringify(user));
            
            // 记录支付交易
            this.saveTransaction(paymentData);
            
            // 执行回调
            if (typeof callback === 'function') {
                callback(paymentData);
            }
        }
    }

    /**
     * 处理支付失败
     * @param {Object} error - 错误信息
     * @param {Function} callback - 回调函数
     */
    static handleFailure(error, callback) {
        console.error('支付失败:', error);
        
        // 执行回调
        if (typeof callback === 'function') {
            callback(null, error);
        }
    }

    /**
     * 保存交易记录
     * @param {Object} transaction - 交易数据
     */
    static saveTransaction(transaction) {
        // 获取现有交易记录
        const transactions = JSON.parse(localStorage.getItem('nexusorbital_transactions') || '[]');
        
        // 添加新交易
        transactions.push({
            ...transaction,
            timestamp: new Date().toISOString()
        });
        
        // 保存交易记录
        localStorage.setItem('nexusorbital_transactions', JSON.stringify(transactions));
    }
}

/**
 * 格式化会员类型
 * @param {string} type - 会员类型
 * @returns {string} 格式化后的会员类型
 */
function formatMembershipType(type) {
    const types = {
        'professional': '专业会员',
        'enterprise': '企业会员',
        'founder': '创始会员',
        'free': '免费用户'
    };
    
    return types[type] || type || '-';
}

/**
 * 支付API主类
 */
class PaymentAPI {
    /**
     * 创建支付
     * @param {string} method - 支付方式: alipay, wechat, creditcard
     * @param {Object} orderData - 订单数据
     * @param {Object} [extraData] - 额外数据，如信用卡信息
     * @returns {Promise<Object>} 支付结果
     */
    static async createPayment(method, orderData, extraData = {}) {
        try {
            let result;
            
            switch (method) {
                case 'alipay':
                    result = await AlipayPayment.createPayment(orderData);
                    break;
                case 'wechat':
                    result = await WechatPayment.createPayment(orderData);
                    break;
                case 'creditcard':
                    result = await CreditCardPayment.createPayment(orderData, extraData);
                    break;
                default:
                    throw new Error(`不支持的支付方式: ${method}`);
            }
            
            return result;
        } catch (error) {
            console.error('创建支付失败:', error);
            return {
                success: false,
                error: error.message || '创建支付失败'
            };
        }
    }

    /**
     * 处理支付回调
     * @param {string} method - 支付方式: alipay, wechat, creditcard
     * @param {Object} callbackData - 回调数据
     * @returns {Promise<Object>} 处理结果
     */
    static async handleCallback(method, callbackData) {
        try {
            let result;
            
            switch (method) {
                case 'alipay':
                    result = await AlipayPayment.handleCallback(callbackData);
                    break;
                case 'wechat':
                    result = await WechatPayment.handleCallback(callbackData);
                    break;
                case 'creditcard':
                    result = await CreditCardPayment.handleCallback(callbackData);
                    break;
                default:
                    throw new Error(`不支持的支付方式: ${method}`);
            }
            
            // 处理支付结果
            if (result.success) {
                PaymentResult.handleSuccess(result);
            } else {
                PaymentResult.handleFailure(result.error);
            }
            
            return result;
        } catch (error) {
            console.error('处理支付回调失败:', error);
            PaymentResult.handleFailure(error);
            return {
                success: false,
                error: error.message || '处理支付回调失败'
            };
        }
    }

    /**
     * 查询支付状态
     * @param {string} method - 支付方式: alipay, wechat, creditcard
     * @param {string} transactionId - 交易ID
     * @returns {Promise<Object>} 查询结果
     */
    static async queryPaymentStatus(method, transactionId) {
        try {
            // 实际项目中，这里应该发送请求到对应的支付平台查询状态
            // 这里模拟查询结果
            return {
                success: true,
                transactionId,
                status: 'PAID', // 可能的状态: PENDING, PAID, FAILED, REFUNDED
                paymentMethod: method,
                paidTime: new Date().toISOString()
            };
        } catch (error) {
            console.error('查询支付状态失败:', error);
            return {
                success: false,
                error: error.message || '查询支付状态失败'
            };
        }
    }
}

// 导出支付API
window.PaymentAPI = PaymentAPI;
