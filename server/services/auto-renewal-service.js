/**
 * NexusOrbital 自动续费服务
 * 提供会员自动续费功能
 */
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const paymentService = require('../payment-integrations/payment-service');
const securityService = require('./security-service');

// 数据文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const MEMBERSHIPS_FILE = path.join(DATA_DIR, 'memberships.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const AUTO_RENEWAL_FILE = path.join(DATA_DIR, 'auto_renewal.json');
const RENEWAL_LOGS_FILE = path.join(DATA_DIR, 'renewal_logs.json');

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

// 初始化自动续费和日志文件
initDataFile(AUTO_RENEWAL_FILE, { autoRenewals: [] });
initDataFile(RENEWAL_LOGS_FILE, { renewalLogs: [] });

/**
 * 读取数据文件
 * @param {string} filePath - 文件路径
 * @returns {Object} - 解析后的数据
 */
function readDataFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return filePath.endsWith('auto_renewal.json') ? { autoRenewals: [] } : 
                   filePath.endsWith('renewal_logs.json') ? { renewalLogs: [] } : {};
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件失败 ${filePath}:`, error);
        return filePath.endsWith('auto_renewal.json') ? { autoRenewals: [] } : 
               filePath.endsWith('renewal_logs.json') ? { renewalLogs: [] } : {};
    }
}

/**
 * 写入数据文件
 * @param {string} filePath - 文件路径
 * @param {Object} data - 要写入的数据
 */
function writeDataFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`写入文件失败 ${filePath}:`, error);
    }
}

/**
 * 获取会员信息
 * @param {string} membershipId - 会员ID
 * @returns {Object|null} - 会员信息
 */
function getMembershipInfo(membershipId) {
    try {
        const membershipsData = readDataFile(MEMBERSHIPS_FILE);
        const membership = membershipsData.memberships.find(m => m.id === membershipId);
        return membership || null;
    } catch (error) {
        console.error('获取会员信息失败:', error);
        return null;
    }
}

/**
 * 获取用户信息
 * @param {string} userId - 用户ID
 * @returns {Object|null} - 用户信息
 */
function getUserInfo(userId) {
    try {
        const usersData = readDataFile(USERS_FILE);
        const user = usersData.users.find(u => u.id === userId);
        return user || null;
    } catch (error) {
        console.error('获取用户信息失败:', error);
        return null;
    }
}

/**
 * 更新用户会员信息
 * @param {string} userId - 用户ID
 * @param {Object} membershipInfo - 会员信息
 * @returns {boolean} - 更新结果
 */
function updateUserMembership(userId, membershipInfo) {
    try {
        const usersData = readDataFile(USERS_FILE);
        const userIndex = usersData.users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return false;
        }
        
        usersData.users[userIndex].membership = membershipInfo;
        writeDataFile(USERS_FILE, usersData);
        return true;
    } catch (error) {
        console.error('更新用户会员信息失败:', error);
        return false;
    }
}

/**
 * 启用自动续费
 * @param {Object} renewalData - 续费数据
 * @returns {Promise<Object>} - 操作结果
 */
async function enableAutoRenewal(renewalData) {
    try {
        const { userId, membershipId, paymentMethod, paymentToken } = renewalData;
        
        // 验证用户和会员信息
        const user = getUserInfo(userId);
        const membership = getMembershipInfo(membershipId);
        
        if (!user) {
            return {
                success: false,
                error: '用户不存在'
            };
        }
        
        if (!membership) {
            return {
                success: false,
                error: '会员类型不存在'
            };
        }
        
        // 加密支付令牌
        let encryptedPaymentToken = null;
        if (paymentToken) {
            const encryptResult = securityService.encryptData(
                JSON.stringify(paymentToken),
                'payment'
            );
            
            if (!encryptResult.success) {
                return {
                    success: false,
                    error: '加密支付信息失败'
                };
            }
            
            encryptedPaymentToken = encryptResult.data;
        }
        
        // 读取自动续费数据
        const autoRenewalData = readDataFile(AUTO_RENEWAL_FILE);
        
        // 检查是否已存在
        const existingIndex = autoRenewalData.autoRenewals.findIndex(r => 
            r.userId === userId && r.membershipId === membershipId
        );
        
        const renewalId = existingIndex !== -1 ? 
            autoRenewalData.autoRenewals[existingIndex].id : uuidv4();
        
        const newRenewalData = {
            id: renewalId,
            userId,
            membershipId,
            paymentMethod,
            paymentToken: encryptedPaymentToken,
            status: 'active',
            nextRenewalDate: calculateNextRenewalDate(user.membership),
            createdAt: existingIndex !== -1 ? 
                autoRenewalData.autoRenewals[existingIndex].createdAt : moment().toISOString(),
            updatedAt: moment().toISOString()
        };
        
        if (existingIndex !== -1) {
            autoRenewalData.autoRenewals[existingIndex] = newRenewalData;
        } else {
            autoRenewalData.autoRenewals.push(newRenewalData);
        }
        
        writeDataFile(AUTO_RENEWAL_FILE, autoRenewalData);
        
        // 记录日志
        logRenewalAction({
            renewalId,
            userId,
            membershipId,
            action: existingIndex !== -1 ? 'update' : 'enable',
            status: 'success',
            timestamp: moment().toISOString()
        });
        
        return {
            success: true,
            data: {
                renewalId,
                nextRenewalDate: newRenewalData.nextRenewalDate
            }
        };
    } catch (error) {
        console.error('启用自动续费失败:', error);
        return {
            success: false,
            error: error.message || '启用自动续费失败'
        };
    }
}

/**
 * 禁用自动续费
 * @param {string} userId - 用户ID
 * @param {string} membershipId - 会员ID
 * @returns {Promise<Object>} - 操作结果
 */
async function disableAutoRenewal(userId, membershipId) {
    try {
        // 读取自动续费数据
        const autoRenewalData = readDataFile(AUTO_RENEWAL_FILE);
        
        // 查找对应的自动续费记录
        const renewalIndex = autoRenewalData.autoRenewals.findIndex(r => 
            r.userId === userId && r.membershipId === membershipId && r.status === 'active'
        );
        
        if (renewalIndex === -1) {
            return {
                success: false,
                error: '未找到活跃的自动续费记录'
            };
        }
        
        const renewalId = autoRenewalData.autoRenewals[renewalIndex].id;
        
        // 更新状态
        autoRenewalData.autoRenewals[renewalIndex].status = 'disabled';
        autoRenewalData.autoRenewals[renewalIndex].updatedAt = moment().toISOString();
        
        writeDataFile(AUTO_RENEWAL_FILE, autoRenewalData);
        
        // 记录日志
        logRenewalAction({
            renewalId,
            userId,
            membershipId,
            action: 'disable',
            status: 'success',
            timestamp: moment().toISOString()
        });
        
        return {
            success: true,
            data: {
                renewalId
            }
        };
    } catch (error) {
        console.error('禁用自动续费失败:', error);
        return {
            success: false,
            error: error.message || '禁用自动续费失败'
        };
    }
}

/**
 * 获取用户的自动续费信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 自动续费信息
 */
async function getUserAutoRenewals(userId) {
    try {
        const autoRenewalData = readDataFile(AUTO_RENEWAL_FILE);
        
        // 过滤用户的自动续费记录
        const userRenewals = autoRenewalData.autoRenewals.filter(r => r.userId === userId);
        
        // 获取会员信息
        const userRenewalsWithDetails = await Promise.all(userRenewals.map(async (renewal) => {
            const membership = getMembershipInfo(renewal.membershipId);
            
            // 不返回敏感信息
            const { paymentToken, ...safeRenewal } = renewal;
            
            return {
                ...safeRenewal,
                membershipName: membership ? membership.name : '未知会员',
                membershipPrice: membership ? membership.price : 0,
                membershipDuration: membership ? membership.duration : 0
            };
        }));
        
        return {
            success: true,
            data: userRenewalsWithDetails
        };
    } catch (error) {
        console.error('获取用户自动续费信息失败:', error);
        return {
            success: false,
            error: error.message || '获取用户自动续费信息失败'
        };
    }
}

/**
 * 获取即将到期的自动续费
 * @param {number} daysThreshold - 天数阈值
 * @returns {Promise<Array>} - 即将到期的自动续费列表
 */
async function getUpcomingRenewals(daysThreshold = 3) {
    try {
        const autoRenewalData = readDataFile(AUTO_RENEWAL_FILE);
        const now = moment();
        const thresholdDate = moment().add(daysThreshold, 'days');
        
        // 过滤即将到期的自动续费
        const upcomingRenewals = autoRenewalData.autoRenewals.filter(renewal => {
            if (renewal.status !== 'active') {
                return false;
            }
            
            const renewalDate = moment(renewal.nextRenewalDate);
            return renewalDate.isBetween(now, thresholdDate, null, '[]');
        });
        
        return upcomingRenewals;
    } catch (error) {
        console.error('获取即将到期的自动续费失败:', error);
        return [];
    }
}

/**
 * 执行自动续费
 * @param {Object} renewal - 自动续费记录
 * @returns {Promise<Object>} - 续费结果
 */
async function executeRenewal(renewal) {
    try {
        const { id, userId, membershipId, paymentMethod, paymentToken } = renewal;
        
        // 获取用户和会员信息
        const user = getUserInfo(userId);
        const membership = getMembershipInfo(membershipId);
        
        if (!user || !membership) {
            return {
                success: false,
                error: '用户或会员信息不存在'
            };
        }
        
        // 解密支付令牌
        let decryptedPaymentToken = null;
        if (paymentToken) {
            const decryptResult = securityService.decryptData(paymentToken, 'payment');
            
            if (!decryptResult.success) {
                return {
                    success: false,
                    error: '解密支付信息失败'
                };
            }
            
            try {
                decryptedPaymentToken = JSON.parse(decryptResult.data);
            } catch (e) {
                return {
                    success: false,
                    error: '支付信息格式错误'
                };
            }
        }
        
        // 创建支付订单
        const paymentResult = await paymentService.createPaymentOrder({
            paymentMethod,
            amount: membership.price,
            membershipId,
            description: `自动续费 ${membership.name}`,
            userId,
            metadata: {
                userEmail: user.email,
                userName: user.name,
                autoRenewal: true,
                renewalId: id
            },
            paymentToken: decryptedPaymentToken
        });
        
        if (!paymentResult.success) {
            // 记录失败日志
            logRenewalAction({
                renewalId: id,
                userId,
                membershipId,
                action: 'renewal',
                status: 'failed',
                error: paymentResult.error,
                timestamp: moment().toISOString()
            });
            
            return paymentResult;
        }
        
        // 更新会员到期日期
        const currentExpiry = user.membership && user.membership.expiryDate ? 
            moment(user.membership.expiryDate) : moment();
        
        const newExpiry = currentExpiry.isAfter(moment()) ? 
            currentExpiry.add(membership.duration, 'days') : 
            moment().add(membership.duration, 'days');
        
        const membershipInfo = {
            id: membershipId,
            name: membership.name,
            startDate: moment().toISOString(),
            expiryDate: newExpiry.toISOString(),
            autoRenewal: true
        };
        
        // 更新用户会员信息
        const updateResult = updateUserMembership(userId, membershipInfo);
        
        if (!updateResult) {
            return {
                success: false,
                error: '更新用户会员信息失败'
            };
        }
        
        // 更新自动续费记录
        const autoRenewalData = readDataFile(AUTO_RENEWAL_FILE);
        const renewalIndex = autoRenewalData.autoRenewals.findIndex(r => r.id === id);
        
        if (renewalIndex !== -1) {
            autoRenewalData.autoRenewals[renewalIndex].nextRenewalDate = 
                newExpiry.toISOString();
            autoRenewalData.autoRenewals[renewalIndex].lastRenewalDate = 
                moment().toISOString();
            autoRenewalData.autoRenewals[renewalIndex].updatedAt = 
                moment().toISOString();
            
            writeDataFile(AUTO_RENEWAL_FILE, autoRenewalData);
        }
        
        // 记录成功日志
        logRenewalAction({
            renewalId: id,
            userId,
            membershipId,
            action: 'renewal',
            status: 'success',
            orderId: paymentResult.data.orderId,
            amount: membership.price,
            timestamp: moment().toISOString()
        });
        
        return {
            success: true,
            data: {
                renewalId: id,
                orderId: paymentResult.data.orderId,
                membershipId,
                expiryDate: newExpiry.toISOString(),
                nextRenewalDate: newExpiry.toISOString()
            }
        };
    } catch (error) {
        console.error('执行自动续费失败:', error);
        
        // 记录错误日志
        logRenewalAction({
            renewalId: renewal.id,
            userId: renewal.userId,
            membershipId: renewal.membershipId,
            action: 'renewal',
            status: 'failed',
            error: error.message || '执行自动续费失败',
            timestamp: moment().toISOString()
        });
        
        return {
            success: false,
            error: error.message || '执行自动续费失败'
        };
    }
}

/**
 * 处理所有即将到期的自动续费
 * @param {number} daysThreshold - 天数阈值
 * @returns {Promise<Object>} - 处理结果
 */
async function processUpcomingRenewals(daysThreshold = 3) {
    try {
        const upcomingRenewals = await getUpcomingRenewals(daysThreshold);
        
        if (upcomingRenewals.length === 0) {
            return {
                success: true,
                data: {
                    processed: 0,
                    successful: 0,
                    failed: 0
                }
            };
        }
        
        let successful = 0;
        let failed = 0;
        
        // 处理每个即将到期的自动续费
        for (const renewal of upcomingRenewals) {
            const result = await executeRenewal(renewal);
            
            if (result.success) {
                successful++;
            } else {
                failed++;
            }
        }
        
        return {
            success: true,
            data: {
                processed: upcomingRenewals.length,
                successful,
                failed
            }
        };
    } catch (error) {
        console.error('处理即将到期的自动续费失败:', error);
        return {
            success: false,
            error: error.message || '处理即将到期的自动续费失败'
        };
    }
}

/**
 * 获取自动续费日志
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 日志数据
 */
async function getRenewalLogs(userId) {
    try {
        const logsData = readDataFile(RENEWAL_LOGS_FILE);
        
        // 过滤用户的日志
        const userLogs = logsData.renewalLogs.filter(log => log.userId === userId);
        
        // 按时间排序
        userLogs.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));
        
        return {
            success: true,
            data: userLogs
        };
    } catch (error) {
        console.error('获取自动续费日志失败:', error);
        return {
            success: false,
            error: error.message || '获取自动续费日志失败'
        };
    }
}

/**
 * 记录自动续费操作日志
 * @param {Object} logData - 日志数据
 */
function logRenewalAction(logData) {
    try {
        const logsData = readDataFile(RENEWAL_LOGS_FILE);
        logsData.renewalLogs.push(logData);
        writeDataFile(RENEWAL_LOGS_FILE, logsData);
    } catch (error) {
        console.error('记录自动续费操作日志失败:', error);
    }
}

/**
 * 计算下次续费日期
 * @param {Object} membershipInfo - 会员信息
 * @returns {string} - 下次续费日期
 */
function calculateNextRenewalDate(membershipInfo) {
    if (!membershipInfo || !membershipInfo.expiryDate) {
        return moment().add(30, 'days').toISOString();
    }
    
    return membershipInfo.expiryDate;
}

/**
 * 发送续费提醒
 * @param {number} daysThreshold - 天数阈值
 * @returns {Promise<Object>} - 处理结果
 */
async function sendRenewalReminders(daysThreshold = 7) {
    try {
        const autoRenewalData = readDataFile(AUTO_RENEWAL_FILE);
        const now = moment();
        const thresholdDate = moment().add(daysThreshold, 'days');
        
        // 过滤需要提醒的自动续费
        const remindRenewals = autoRenewalData.autoRenewals.filter(renewal => {
            if (renewal.status !== 'active') {
                return false;
            }
            
            const renewalDate = moment(renewal.nextRenewalDate);
            return renewalDate.isBetween(now, thresholdDate, null, '[]');
        });
        
        if (remindRenewals.length === 0) {
            return {
                success: true,
                data: {
                    reminded: 0
                }
            };
        }
        
        let reminded = 0;
        
        // 处理每个需要提醒的自动续费
        for (const renewal of remindRenewals) {
            // 在实际项目中，这里应该发送邮件或短信提醒
            // 这里简化处理，只记录日志
            logRenewalAction({
                renewalId: renewal.id,
                userId: renewal.userId,
                membershipId: renewal.membershipId,
                action: 'reminder',
                status: 'success',
                timestamp: moment().toISOString()
            });
            
            reminded++;
        }
        
        return {
            success: true,
            data: {
                reminded
            }
        };
    } catch (error) {
        console.error('发送续费提醒失败:', error);
        return {
            success: false,
            error: error.message || '发送续费提醒失败'
        };
    }
}

module.exports = {
    enableAutoRenewal,
    disableAutoRenewal,
    getUserAutoRenewals,
    getUpcomingRenewals,
    executeRenewal,
    processUpcomingRenewals,
    getRenewalLogs,
    sendRenewalReminders
};
