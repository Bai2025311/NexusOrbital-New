/**
 * NexusOrbital 安全中间件
 * 提供API请求安全检查和风险控制
 */
const securityService = require('../services/security-service');

/**
 * 支付风险控制中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
async function paymentRiskControl(req, res, next) {
    try {
        // 如果没有用户信息，跳过风险控制
        if (!req.user) {
            return next();
        }
        
        // 获取交易数据
        const transactionData = {
            id: req.body.orderId || `temp_${Date.now()}`,
            amount: parseFloat(req.body.amount) || 0,
            paymentMethod: req.body.paymentMethod,
            membershipId: req.body.membershipId
        };
        
        // 获取用户数据
        const userData = {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name
        };
        
        // 获取请求信息
        const requestInfo = {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            referer: req.headers.referer
        };
        
        // 进行风险评估
        const riskResult = await securityService.assessRisk(
            transactionData,
            userData,
            requestInfo
        );
        
        if (!riskResult.success) {
            return res.status(500).json({
                success: false,
                error: '风险评估失败，请稍后重试'
            });
        }
        
        // 如果风险评估不允许交易，返回错误
        if (!riskResult.data.allowTransaction) {
            return res.status(403).json({
                success: false,
                error: '交易被风险控制系统拦截',
                reasons: riskResult.data.reasons
            });
        }
        
        // 将风险评估结果添加到请求对象
        req.riskAssessment = riskResult.data;
        
        // 检测异常操作
        const abnormalResult = await securityService.detectAbnormalOperation(
            userData.id,
            'payment',
            transactionData,
            requestInfo
        );
        
        if (abnormalResult.success && abnormalResult.data.isAbnormal) {
            // 如果检测到异常操作，添加到请求对象
            req.abnormalOperation = abnormalResult.data;
            
            // 根据异常严重程度决定是否阻止请求
            if (abnormalResult.data.reasons.length > 1) {
                return res.status(403).json({
                    success: false,
                    error: '检测到异常支付行为，请稍后重试',
                    reasons: abnormalResult.data.reasons
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('支付风险控制中间件错误:', error);
        next();
    }
}

/**
 * 敏感操作验证中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function sensitiveOperationVerify(req, res, next) {
    try {
        // 获取验证令牌
        const verificationToken = req.headers['verification-token'];
        
        // 如果没有验证令牌，返回错误
        if (!verificationToken) {
            return res.status(403).json({
                success: false,
                error: '需要额外验证',
                requireVerification: true
            });
        }
        
        // 验证令牌
        const verifyResult = securityService.verifySecureToken(verificationToken);
        
        if (!verifyResult.success) {
            return res.status(403).json({
                success: false,
                error: '验证失败，请重新验证',
                requireVerification: true
            });
        }
        
        // 将验证结果添加到请求对象
        req.verificationData = verifyResult.data;
        
        next();
    } catch (error) {
        console.error('敏感操作验证中间件错误:', error);
        return res.status(500).json({
            success: false,
            error: '验证过程发生错误，请稍后重试'
        });
    }
}

/**
 * 请求签名验证中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function verifySignature(req, res, next) {
    try {
        // 获取签名和时间戳
        const signature = req.headers['x-signature'];
        const timestamp = req.headers['x-timestamp'];
        
        // 如果没有签名或时间戳，跳过验证
        if (!signature || !timestamp) {
            return next();
        }
        
        // 检查时间戳是否过期（5分钟有效期）
        const currentTime = Math.floor(Date.now() / 1000);
        const requestTime = parseInt(timestamp);
        
        if (isNaN(requestTime) || currentTime - requestTime > 300) {
            return res.status(403).json({
                success: false,
                error: '请求已过期，请重新发送'
            });
        }
        
        // 构建请求数据
        const requestData = {
            ...req.body,
            timestamp
        };
        
        // 获取密钥（实际项目中应该根据不同的API客户端使用不同的密钥）
        const secretKey = process.env.API_SECRET_KEY || 'nexusorbital-api-secret-key';
        
        // 验证签名
        const verifyResult = securityService.verifyRequestSignature(
            requestData,
            signature,
            secretKey
        );
        
        if (!verifyResult.success) {
            return res.status(500).json({
                success: false,
                error: '签名验证失败，请稍后重试'
            });
        }
        
        if (!verifyResult.data.isValid) {
            return res.status(403).json({
                success: false,
                error: '无效的请求签名'
            });
        }
        
        next();
    } catch (error) {
        console.error('请求签名验证中间件错误:', error);
        next();
    }
}

/**
 * 数据脱敏中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function dataMasking(req, res, next) {
    // 保存原始的res.json方法
    const originalJson = res.json;
    
    // 重写res.json方法
    res.json = function(data) {
        // 对响应数据进行脱敏处理
        const maskedData = maskSensitiveData(data);
        
        // 调用原始的json方法
        return originalJson.call(this, maskedData);
    };
    
    next();
}

/**
 * 脱敏敏感数据
 * @param {Object} data - 原始数据
 * @returns {Object} - 脱敏后的数据
 */
function maskSensitiveData(data) {
    // 如果不是对象，直接返回
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    // 创建数据副本
    const maskedData = Array.isArray(data) ? [...data] : { ...data };
    
    // 敏感字段及其脱敏规则
    const sensitiveFields = {
        'cardNumber': value => maskCardNumber(value),
        'phone': value => maskPhone(value),
        'idCard': value => maskIdCard(value),
        'email': value => maskEmail(value),
        'password': () => '******',
        'secretKey': () => '******',
        'privateKey': () => '******'
    };
    
    // 递归处理对象
    if (Array.isArray(maskedData)) {
        // 如果是数组，递归处理每个元素
        return maskedData.map(item => maskSensitiveData(item));
    } else {
        // 处理对象的每个属性
        for (const key in maskedData) {
            if (Object.prototype.hasOwnProperty.call(maskedData, key)) {
                // 如果是敏感字段，应用脱敏规则
                if (sensitiveFields[key] && maskedData[key]) {
                    maskedData[key] = sensitiveFields[key](maskedData[key]);
                }
                // 如果是嵌套对象，递归处理
                else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
                    maskedData[key] = maskSensitiveData(maskedData[key]);
                }
            }
        }
        return maskedData;
    }
}

/**
 * 脱敏卡号
 * @param {string} cardNumber - 卡号
 * @returns {string} - 脱敏后的卡号
 */
function maskCardNumber(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') {
        return cardNumber;
    }
    
    // 保留前4位和后4位，中间用*替代
    if (cardNumber.length > 8) {
        return cardNumber.slice(0, 4) + '*'.repeat(cardNumber.length - 8) + cardNumber.slice(-4);
    }
    
    return cardNumber;
}

/**
 * 脱敏手机号
 * @param {string} phone - 手机号
 * @returns {string} - 脱敏后的手机号
 */
function maskPhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return phone;
    }
    
    // 保留前3位和后4位，中间用*替代
    if (phone.length > 7) {
        return phone.slice(0, 3) + '*'.repeat(phone.length - 7) + phone.slice(-4);
    }
    
    return phone;
}

/**
 * 脱敏身份证号
 * @param {string} idCard - 身份证号
 * @returns {string} - 脱敏后的身份证号
 */
function maskIdCard(idCard) {
    if (!idCard || typeof idCard !== 'string') {
        return idCard;
    }
    
    // 保留前4位和后4位，中间用*替代
    if (idCard.length > 8) {
        return idCard.slice(0, 4) + '*'.repeat(idCard.length - 8) + idCard.slice(-4);
    }
    
    return idCard;
}

/**
 * 脱敏邮箱
 * @param {string} email - 邮箱
 * @returns {string} - 脱敏后的邮箱
 */
function maskEmail(email) {
    if (!email || typeof email !== 'string') {
        return email;
    }
    
    // 查找@符号的位置
    const atIndex = email.indexOf('@');
    
    if (atIndex <= 1) {
        return email;
    }
    
    // 保留第一个字符和@后面的部分，中间用*替代
    const username = email.slice(0, atIndex);
    const domain = email.slice(atIndex);
    
    return username.slice(0, 1) + '*'.repeat(username.length - 1) + domain;
}

module.exports = {
    paymentRiskControl,
    sensitiveOperationVerify,
    verifySignature,
    dataMasking
};
