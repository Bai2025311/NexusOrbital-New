/**
 * NexusOrbital 安全服务
 * 提供支付安全、风险控制和数据保护功能
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

// 数据文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const RISK_LOGS_FILE = path.join(DATA_DIR, 'risk_logs.json');
const SECURITY_CONFIG_FILE = path.join(DATA_DIR, 'security_config.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
function initDataFile(filePath, initialData = {}) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    }
}

// 初始化风险日志和安全配置文件
initDataFile(RISK_LOGS_FILE, []);
initDataFile(SECURITY_CONFIG_FILE, {
    // 交易风险控制配置
    transactionRiskControl: {
        enabled: true,
        maxAmountPerDay: 10000, // 每日最大交易金额
        maxTransactionsPerDay: 10, // 每日最大交易次数
        suspiciousIpCountries: ['US', 'RU', 'KR'], // 可疑IP国家/地区
        highRiskAmount: 5000 // 高风险交易金额阈值
    },
    // IP白名单和黑名单
    ipLists: {
        whitelist: [], // IP白名单
        blacklist: [] // IP黑名单
    },
    // 敏感操作验证配置
    sensitiveOperations: {
        requireVerification: true, // 是否需要额外验证
        verificationMethods: ['email', 'sms'] // 验证方式
    },
    // 数据加密配置
    encryption: {
        algorithm: 'aes-256-gcm', // 加密算法
        keyRotationDays: 90 // 密钥轮换周期（天）
    }
});

/**
 * 读取数据文件
 * @param {string} filePath - 文件路径
 * @returns {Array|Object} - 解析后的数据
 */
function readDataFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件失败 ${filePath}:`, error);
        return filePath.endsWith('risk_logs.json') ? [] : {};
    }
}

/**
 * 写入数据文件
 * @param {string} filePath - 文件路径
 * @param {Array|Object} data - 要写入的数据
 */
function writeDataFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`写入文件失败 ${filePath}:`, error);
    }
}

/**
 * 风险评估
 * @param {Object} transactionData - 交易数据
 * @param {Object} userData - 用户数据
 * @param {Object} requestInfo - 请求信息
 * @returns {Promise<Object>} - 风险评估结果
 */
async function assessRisk(transactionData, userData, requestInfo) {
    try {
        const config = readDataFile(SECURITY_CONFIG_FILE);
        const riskControl = config.transactionRiskControl;
        
        if (!riskControl.enabled) {
            return {
                success: true,
                data: {
                    riskLevel: 'low',
                    allowTransaction: true,
                    reasons: []
                }
            };
        }
        
        const reasons = [];
        let riskLevel = 'low';
        let allowTransaction = true;
        
        // 检查交易金额
        if (transactionData.amount > riskControl.highRiskAmount) {
            reasons.push('交易金额超过高风险阈值');
            riskLevel = 'high';
        }
        
        // 检查IP是否在黑名单中
        if (requestInfo.ip && config.ipLists.blacklist.includes(requestInfo.ip)) {
            reasons.push('IP地址在黑名单中');
            riskLevel = 'critical';
            allowTransaction = false;
        }
        
        // 检查用户当日交易次数和金额
        const userDailyTransactions = await getUserDailyTransactions(userData.id);
        
        if (userDailyTransactions.count >= riskControl.maxTransactionsPerDay) {
            reasons.push('超过每日最大交易次数限制');
            riskLevel = 'high';
            allowTransaction = false;
        }
        
        if (userDailyTransactions.totalAmount + transactionData.amount > riskControl.maxAmountPerDay) {
            reasons.push('超过每日最大交易金额限制');
            riskLevel = 'high';
            allowTransaction = false;
        }
        
        // 记录风险评估日志
        logRiskAssessment({
            userId: userData.id,
            transactionId: transactionData.id,
            amount: transactionData.amount,
            ip: requestInfo.ip,
            userAgent: requestInfo.userAgent,
            riskLevel,
            reasons,
            allowTransaction,
            timestamp: moment().toISOString()
        });
        
        return {
            success: true,
            data: {
                riskLevel,
                allowTransaction,
                reasons
            }
        };
    } catch (error) {
        console.error('风险评估失败:', error);
        return {
            success: false,
            error: error.message || '风险评估失败'
        };
    }
}

/**
 * 获取用户当日交易统计
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 当日交易统计
 */
async function getUserDailyTransactions(userId) {
    try {
        // 实际项目中应该从数据库查询
        // 这里简化处理，返回模拟数据
        return {
            count: 0,
            totalAmount: 0
        };
    } catch (error) {
        console.error('获取用户当日交易统计失败:', error);
        return {
            count: 0,
            totalAmount: 0
        };
    }
}

/**
 * 记录风险评估日志
 * @param {Object} logData - 日志数据
 */
function logRiskAssessment(logData) {
    try {
        const logs = readDataFile(RISK_LOGS_FILE);
        logs.push(logData);
        writeDataFile(RISK_LOGS_FILE, logs);
    } catch (error) {
        console.error('记录风险评估日志失败:', error);
    }
}

/**
 * 加密敏感数据
 * @param {string} data - 要加密的数据
 * @param {string} purpose - 加密目的（用于选择不同的密钥）
 * @returns {Object} - 加密结果
 */
function encryptData(data, purpose = 'general') {
    try {
        const config = readDataFile(SECURITY_CONFIG_FILE);
        const { algorithm } = config.encryption;
        
        // 生成随机初始化向量
        const iv = crypto.randomBytes(16);
        
        // 获取或生成密钥
        const key = getEncryptionKey(purpose);
        
        // 创建加密器
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        
        // 加密数据
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // 获取认证标签（仅适用于GCM模式）
        const authTag = algorithm.includes('gcm') ? cipher.getAuthTag() : null;
        
        return {
            success: true,
            data: {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag ? authTag.toString('hex') : null,
                algorithm
            }
        };
    } catch (error) {
        console.error('加密数据失败:', error);
        return {
            success: false,
            error: error.message || '加密数据失败'
        };
    }
}

/**
 * 解密数据
 * @param {Object} encryptedData - 加密的数据
 * @param {string} purpose - 加密目的（用于选择不同的密钥）
 * @returns {Object} - 解密结果
 */
function decryptData(encryptedData, purpose = 'general') {
    try {
        const { encrypted, iv, authTag, algorithm } = encryptedData;
        
        // 获取密钥
        const key = getEncryptionKey(purpose);
        
        // 创建解密器
        const decipher = crypto.createDecipheriv(
            algorithm,
            key,
            Buffer.from(iv, 'hex')
        );
        
        // 设置认证标签（仅适用于GCM模式）
        if (algorithm.includes('gcm') && authTag) {
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        }
        
        // 解密数据
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return {
            success: true,
            data: decrypted
        };
    } catch (error) {
        console.error('解密数据失败:', error);
        return {
            success: false,
            error: error.message || '解密数据失败'
        };
    }
}

/**
 * 获取加密密钥
 * @param {string} purpose - 加密目的
 * @returns {Buffer} - 加密密钥
 */
function getEncryptionKey(purpose) {
    // 实际项目中应该使用安全的密钥管理系统
    // 这里简化处理，使用环境变量或配置文件中的密钥
    const keyMap = {
        'general': process.env.ENCRYPTION_KEY_GENERAL,
        'payment': process.env.ENCRYPTION_KEY_PAYMENT,
        'user': process.env.ENCRYPTION_KEY_USER
    };
    
    const key = keyMap[purpose] || process.env.ENCRYPTION_KEY || 'nexusorbital-default-encryption-key-2025';
    
    // 使用SHA-256生成固定长度的密钥
    return crypto.createHash('sha256').update(key).digest();
}

/**
 * 生成安全令牌
 * @param {Object} data - 令牌数据
 * @param {number} expiresIn - 过期时间（秒）
 * @returns {Object} - 生成结果
 */
function generateSecureToken(data, expiresIn = 3600) {
    try {
        // 创建令牌数据
        const tokenData = {
            ...data,
            exp: Math.floor(Date.now() / 1000) + expiresIn,
            iat: Math.floor(Date.now() / 1000),
            jti: uuidv4()
        };
        
        // 序列化数据
        const payload = JSON.stringify(tokenData);
        
        // 加密数据
        const encryptResult = encryptData(payload, 'general');
        
        if (!encryptResult.success) {
            throw new Error(encryptResult.error);
        }
        
        // 生成令牌
        const token = Buffer.from(JSON.stringify(encryptResult.data)).toString('base64');
        
        return {
            success: true,
            data: {
                token,
                expiresIn
            }
        };
    } catch (error) {
        console.error('生成安全令牌失败:', error);
        return {
            success: false,
            error: error.message || '生成安全令牌失败'
        };
    }
}

/**
 * 验证安全令牌
 * @param {string} token - 安全令牌
 * @returns {Object} - 验证结果
 */
function verifySecureToken(token) {
    try {
        // 解码令牌
        const encryptedData = JSON.parse(Buffer.from(token, 'base64').toString());
        
        // 解密数据
        const decryptResult = decryptData(encryptedData, 'general');
        
        if (!decryptResult.success) {
            throw new Error(decryptResult.error);
        }
        
        // 解析令牌数据
        const tokenData = JSON.parse(decryptResult.data);
        
        // 检查令牌是否过期
        if (tokenData.exp < Math.floor(Date.now() / 1000)) {
            throw new Error('令牌已过期');
        }
        
        return {
            success: true,
            data: tokenData
        };
    } catch (error) {
        console.error('验证安全令牌失败:', error);
        return {
            success: false,
            error: error.message || '验证安全令牌失败'
        };
    }
}

/**
 * 验证请求签名
 * @param {Object} requestData - 请求数据
 * @param {string} signature - 请求签名
 * @param {string} secretKey - 密钥
 * @returns {Object} - 验证结果
 */
function verifyRequestSignature(requestData, signature, secretKey) {
    try {
        // 按字母顺序排序参数
        const sortedParams = Object.keys(requestData).sort().reduce((result, key) => {
            result[key] = requestData[key];
            return result;
        }, {});
        
        // 构建签名字符串
        const signString = Object.entries(sortedParams)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
        
        // 计算签名
        const calculatedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(signString)
            .digest('hex');
        
        // 验证签名
        const isValid = calculatedSignature === signature;
        
        return {
            success: true,
            data: {
                isValid,
                calculatedSignature
            }
        };
    } catch (error) {
        console.error('验证请求签名失败:', error);
        return {
            success: false,
            error: error.message || '验证请求签名失败'
        };
    }
}

/**
 * 检测异常操作
 * @param {string} userId - 用户ID
 * @param {string} operationType - 操作类型
 * @param {Object} operationData - 操作数据
 * @param {Object} requestInfo - 请求信息
 * @returns {Promise<Object>} - 检测结果
 */
async function detectAbnormalOperation(userId, operationType, operationData, requestInfo) {
    try {
        // 实际项目中应该实现更复杂的异常检测算法
        // 这里简化处理，根据操作类型和基本规则检测
        
        const abnormalPatterns = {
            'payment': [
                // 短时间内多次支付
                async () => {
                    const userTransactions = await getUserRecentOperations(userId, 'payment', 5 * 60); // 5分钟内
                    return userTransactions.length > 3;
                },
                // 支付金额异常
                async () => {
                    const userAvgAmount = await getUserAveragePaymentAmount(userId);
                    return operationData.amount > userAvgAmount * 5;
                }
            ],
            'login': [
                // 异常登录位置
                async () => {
                    const lastLoginIp = await getLastLoginIp(userId);
                    return lastLoginIp && lastLoginIp !== requestInfo.ip;
                },
                // 短时间内多次登录失败
                async () => {
                    const loginFailures = await getRecentLoginFailures(userId, 30 * 60); // 30分钟内
                    return loginFailures > 5;
                }
            ],
            'profile_update': [
                // 短时间内多次修改敏感信息
                async () => {
                    const sensitiveUpdates = await getSensitiveInfoUpdates(userId, 24 * 60 * 60); // 24小时内
                    return sensitiveUpdates > 2;
                }
            ]
        };
        
        // 如果没有该操作类型的检测规则，返回正常
        if (!abnormalPatterns[operationType]) {
            return {
                success: true,
                data: {
                    isAbnormal: false,
                    reasons: []
                }
            };
        }
        
        // 执行检测规则
        const reasons = [];
        for (const checkFn of abnormalPatterns[operationType]) {
            if (await checkFn()) {
                reasons.push(`异常${operationType}操作`);
            }
        }
        
        const isAbnormal = reasons.length > 0;
        
        // 记录异常操作
        if (isAbnormal) {
            logAbnormalOperation({
                userId,
                operationType,
                reasons,
                requestInfo,
                timestamp: moment().toISOString()
            });
        }
        
        return {
            success: true,
            data: {
                isAbnormal,
                reasons
            }
        };
    } catch (error) {
        console.error('检测异常操作失败:', error);
        return {
            success: false,
            error: error.message || '检测异常操作失败'
        };
    }
}

/**
 * 记录异常操作
 * @param {Object} logData - 日志数据
 */
function logAbnormalOperation(logData) {
    try {
        // 实际项目中应该将日志保存到数据库
        // 这里简化处理，记录到日志文件
        const logFilePath = path.join(DATA_DIR, 'abnormal_operations.json');
        
        let logs = [];
        if (fs.existsSync(logFilePath)) {
            logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
        }
        
        logs.push(logData);
        fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf8');
    } catch (error) {
        console.error('记录异常操作失败:', error);
    }
}

/**
 * 获取用户最近操作
 * @param {string} userId - 用户ID
 * @param {string} operationType - 操作类型
 * @param {number} timeWindow - 时间窗口（秒）
 * @returns {Promise<Array>} - 操作列表
 */
async function getUserRecentOperations(userId, operationType, timeWindow) {
    // 实际项目中应该从数据库查询
    // 这里简化处理，返回空数组
    return [];
}

/**
 * 获取用户平均支付金额
 * @param {string} userId - 用户ID
 * @returns {Promise<number>} - 平均支付金额
 */
async function getUserAveragePaymentAmount(userId) {
    // 实际项目中应该从数据库查询
    // 这里简化处理，返回默认值
    return 1000;
}

/**
 * 获取最后一次登录IP
 * @param {string} userId - 用户ID
 * @returns {Promise<string|null>} - IP地址
 */
async function getLastLoginIp(userId) {
    // 实际项目中应该从数据库查询
    // 这里简化处理，返回null
    return null;
}

/**
 * 获取最近登录失败次数
 * @param {string} userId - 用户ID
 * @param {number} timeWindow - 时间窗口（秒）
 * @returns {Promise<number>} - 失败次数
 */
async function getRecentLoginFailures(userId, timeWindow) {
    // 实际项目中应该从数据库查询
    // 这里简化处理，返回0
    return 0;
}

/**
 * 获取敏感信息更新次数
 * @param {string} userId - 用户ID
 * @param {number} timeWindow - 时间窗口（秒）
 * @returns {Promise<number>} - 更新次数
 */
async function getSensitiveInfoUpdates(userId, timeWindow) {
    // 实际项目中应该从数据库查询
    // 这里简化处理，返回0
    return 0;
}

module.exports = {
    assessRisk,
    encryptData,
    decryptData,
    generateSecureToken,
    verifySecureToken,
    verifyRequestSignature,
    detectAbnormalOperation
};
