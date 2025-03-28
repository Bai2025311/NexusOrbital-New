/**
 * NexusOrbital 会员升级/降级服务
 * 提供会员等级变更、价格计算和权益调整功能
 */
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const paymentService = require('../payment-integrations/payment-service');

// 数据文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const MEMBERSHIPS_FILE = path.join(DATA_DIR, 'memberships.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const UPGRADE_LOGS_FILE = path.join(DATA_DIR, 'membership_upgrade_logs.json');

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

// 初始化升级日志文件
initDataFile(UPGRADE_LOGS_FILE, { upgradeLogs: [] });

/**
 * 读取数据文件
 * @param {string} filePath - 文件路径
 * @returns {Object} - 解析后的数据
 */
function readDataFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return filePath.endsWith('membership_upgrade_logs.json') ? { upgradeLogs: [] } : {};
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件失败 ${filePath}:`, error);
        return filePath.endsWith('membership_upgrade_logs.json') ? { upgradeLogs: [] } : {};
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
 * 计算会员升级/降级价格
 * @param {Object} currentMembership - 当前会员信息
 * @param {Object} targetMembership - 目标会员信息
 * @returns {Object} - 计算结果
 */
function calculateUpgradePrice(currentMembership, targetMembership) {
    try {
        if (!currentMembership || !targetMembership) {
            return {
                success: false,
                error: '会员信息不完整'
            };
        }
        
        // 计算当前会员剩余价值
        const now = moment();
        const expiryDate = moment(currentMembership.expiryDate);
        
        // 如果已过期，剩余价值为0
        if (now.isAfter(expiryDate)) {
            return {
                success: true,
                data: {
                    currentMembershipId: currentMembership.id,
                    targetMembershipId: targetMembership.id,
                    remainingValue: 0,
                    upgradePrice: targetMembership.price,
                    isUpgrade: targetMembership.price > 0,
                    isDowngrade: false,
                    refundAmount: 0,
                    daysRemaining: 0
                }
            };
        }
        
        // 计算剩余天数
        const totalDays = moment(currentMembership.expiryDate).diff(moment(currentMembership.startDate), 'days');
        const daysRemaining = expiryDate.diff(now, 'days');
        
        // 计算剩余价值比例
        const remainingRatio = daysRemaining / totalDays;
        
        // 获取当前会员的完整信息
        const currentMembershipFull = getMembershipInfo(currentMembership.id);
        
        if (!currentMembershipFull) {
            return {
                success: false,
                error: '无法获取当前会员完整信息'
            };
        }
        
        // 计算剩余价值
        const remainingValue = currentMembershipFull.price * remainingRatio;
        
        // 计算升级/降级价格
        let upgradePrice = targetMembership.price - remainingValue;
        let isUpgrade = targetMembership.price > currentMembershipFull.price;
        let isDowngrade = targetMembership.price < currentMembershipFull.price;
        let refundAmount = 0;
        
        // 如果是降级且有剩余价值，可能需要退款
        if (isDowngrade && remainingValue > targetMembership.price) {
            refundAmount = remainingValue - targetMembership.price;
            upgradePrice = 0;
        } else if (upgradePrice < 0) {
            // 如果计算出的价格为负，设为0（不退款）
            upgradePrice = 0;
        }
        
        return {
            success: true,
            data: {
                currentMembershipId: currentMembership.id,
                targetMembershipId: targetMembership.id,
                remainingValue: parseFloat(remainingValue.toFixed(2)),
                upgradePrice: parseFloat(upgradePrice.toFixed(2)),
                isUpgrade,
                isDowngrade,
                refundAmount: parseFloat(refundAmount.toFixed(2)),
                daysRemaining
            }
        };
    } catch (error) {
        console.error('计算会员升级价格失败:', error);
        return {
            success: false,
            error: error.message || '计算会员升级价格失败'
        };
    }
}

/**
 * 执行会员升级/降级
 * @param {Object} upgradeData - 升级数据
 * @returns {Promise<Object>} - 操作结果
 */
async function executeMembershipChange(upgradeData) {
    try {
        const { userId, targetMembershipId, paymentMethod, paymentToken } = upgradeData;
        
        // 获取用户和会员信息
        const user = getUserInfo(userId);
        const targetMembership = getMembershipInfo(targetMembershipId);
        
        if (!user) {
            return {
                success: false,
                error: '用户不存在'
            };
        }
        
        if (!targetMembership) {
            return {
                success: false,
                error: '目标会员类型不存在'
            };
        }
        
        // 计算升级/降级价格
        const priceResult = calculateUpgradePrice(user.membership, targetMembership);
        
        if (!priceResult.success) {
            return priceResult;
        }
        
        const { upgradePrice, isUpgrade, isDowngrade, refundAmount } = priceResult.data;
        
        // 生成日志ID
        const logId = uuidv4();
        
        // 记录升级/降级日志
        const logData = {
            id: logId,
            userId,
            fromMembershipId: user.membership ? user.membership.id : null,
            toMembershipId: targetMembershipId,
            upgradePrice,
            refundAmount,
            isUpgrade,
            isDowngrade,
            status: 'pending',
            createdAt: moment().toISOString()
        };
        
        // 保存日志
        const logsData = readDataFile(UPGRADE_LOGS_FILE);
        logsData.upgradeLogs.push(logData);
        writeDataFile(UPGRADE_LOGS_FILE, logsData);
        
        // 如果需要支付
        if (upgradePrice > 0) {
            // 创建支付订单
            const paymentResult = await paymentService.createPaymentOrder({
                paymentMethod,
                amount: upgradePrice,
                membershipId: targetMembershipId,
                description: `会员${isUpgrade ? '升级' : '变更'}: ${user.membership ? user.membership.name : '无'} -> ${targetMembership.name}`,
                userId,
                metadata: {
                    userEmail: user.email,
                    userName: user.name,
                    upgradeLogId: logId
                },
                paymentToken
            });
            
            if (!paymentResult.success) {
                // 更新日志状态
                updateUpgradeLogStatus(logId, 'failed', paymentResult.error);
                
                return paymentResult;
            }
            
            // 更新日志状态和订单ID
            updateUpgradeLogStatus(logId, 'payment_completed', null, paymentResult.data.orderId);
            
            // 返回支付结果
            return {
                success: true,
                data: {
                    logId,
                    orderId: paymentResult.data.orderId,
                    status: 'payment_completed',
                    message: '支付成功，会员将在支付确认后更新'
                }
            };
        } else {
            // 无需支付，直接更新会员
            const membershipUpdateResult = await updateMembershipAfterChange(userId, targetMembershipId, logId);
            
            // 如果需要退款
            if (refundAmount > 0) {
                // 这里应该调用退款服务处理退款
                // 简化处理，仅记录日志
                updateUpgradeLogStatus(logId, 'refund_pending', null, null, refundAmount);
                
                return {
                    success: true,
                    data: {
                        logId,
                        status: 'refund_pending',
                        message: '会员已降级，退款正在处理中',
                        refundAmount
                    }
                };
            }
            
            return membershipUpdateResult;
        }
    } catch (error) {
        console.error('执行会员变更失败:', error);
        return {
            success: false,
            error: error.message || '执行会员变更失败'
        };
    }
}

/**
 * 更新升级日志状态
 * @param {string} logId - 日志ID
 * @param {string} status - 状态
 * @param {string} error - 错误信息
 * @param {string} orderId - 订单ID
 * @param {number} refundAmount - 退款金额
 */
function updateUpgradeLogStatus(logId, status, error = null, orderId = null, refundAmount = null) {
    try {
        const logsData = readDataFile(UPGRADE_LOGS_FILE);
        const logIndex = logsData.upgradeLogs.findIndex(log => log.id === logId);
        
        if (logIndex === -1) {
            return false;
        }
        
        logsData.upgradeLogs[logIndex].status = status;
        logsData.upgradeLogs[logIndex].updatedAt = moment().toISOString();
        
        if (error) {
            logsData.upgradeLogs[logIndex].error = error;
        }
        
        if (orderId) {
            logsData.upgradeLogs[logIndex].orderId = orderId;
        }
        
        if (refundAmount !== null) {
            logsData.upgradeLogs[logIndex].refundAmount = refundAmount;
        }
        
        writeDataFile(UPGRADE_LOGS_FILE, logsData);
        return true;
    } catch (error) {
        console.error('更新升级日志状态失败:', error);
        return false;
    }
}

/**
 * 支付确认后更新会员
 * @param {string} orderId - 订单ID
 * @returns {Promise<Object>} - 操作结果
 */
async function confirmMembershipChangeAfterPayment(orderId) {
    try {
        // 查找对应的升级日志
        const logsData = readDataFile(UPGRADE_LOGS_FILE);
        const log = logsData.upgradeLogs.find(log => log.orderId === orderId);
        
        if (!log) {
            return {
                success: false,
                error: '未找到对应的会员变更记录'
            };
        }
        
        // 更新会员
        return await updateMembershipAfterChange(log.userId, log.toMembershipId, log.id);
    } catch (error) {
        console.error('确认会员变更失败:', error);
        return {
            success: false,
            error: error.message || '确认会员变更失败'
        };
    }
}

/**
 * 更新会员信息
 * @param {string} userId - 用户ID
 * @param {string} membershipId - 会员ID
 * @param {string} logId - 日志ID
 * @returns {Promise<Object>} - 操作结果
 */
async function updateMembershipAfterChange(userId, membershipId, logId) {
    try {
        // 获取用户和会员信息
        const user = getUserInfo(userId);
        const membership = getMembershipInfo(membershipId);
        
        if (!user) {
            updateUpgradeLogStatus(logId, 'failed', '用户不存在');
            return {
                success: false,
                error: '用户不存在'
            };
        }
        
        if (!membership) {
            updateUpgradeLogStatus(logId, 'failed', '会员类型不存在');
            return {
                success: false,
                error: '会员类型不存在'
            };
        }
        
        // 计算新的到期日期
        let startDate = moment().toISOString();
        let expiryDate;
        
        // 如果用户有现有会员且未过期，从当前到期日期开始计算
        if (user.membership && user.membership.expiryDate && moment().isBefore(moment(user.membership.expiryDate))) {
            expiryDate = moment(user.membership.expiryDate).add(membership.duration, 'days').toISOString();
        } else {
            // 否则从当前日期开始计算
            expiryDate = moment().add(membership.duration, 'days').toISOString();
        }
        
        // 创建新的会员信息
        const membershipInfo = {
            id: membershipId,
            name: membership.name,
            startDate,
            expiryDate,
            // 保留自动续费设置（如果有）
            autoRenewal: user.membership && user.membership.autoRenewal ? true : false
        };
        
        // 更新用户会员信息
        const updateResult = updateUserMembership(userId, membershipInfo);
        
        if (!updateResult) {
            updateUpgradeLogStatus(logId, 'failed', '更新用户会员信息失败');
            return {
                success: false,
                error: '更新用户会员信息失败'
            };
        }
        
        // 更新日志状态
        updateUpgradeLogStatus(logId, 'completed');
        
        return {
            success: true,
            data: {
                logId,
                membershipId,
                membershipName: membership.name,
                startDate,
                expiryDate,
                status: 'completed',
                message: '会员变更成功'
            }
        };
    } catch (error) {
        console.error('更新会员信息失败:', error);
        updateUpgradeLogStatus(logId, 'failed', error.message || '更新会员信息失败');
        return {
            success: false,
            error: error.message || '更新会员信息失败'
        };
    }
}

/**
 * 获取用户的会员变更日志
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 日志数据
 */
async function getUserMembershipChangeLogs(userId) {
    try {
        const logsData = readDataFile(UPGRADE_LOGS_FILE);
        
        // 过滤用户的日志
        const userLogs = logsData.upgradeLogs.filter(log => log.userId === userId);
        
        // 按时间排序
        userLogs.sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)));
        
        return {
            success: true,
            data: userLogs
        };
    } catch (error) {
        console.error('获取用户会员变更日志失败:', error);
        return {
            success: false,
            error: error.message || '获取用户会员变更日志失败'
        };
    }
}

/**
 * 获取会员变更价格预览
 * @param {string} userId - 用户ID
 * @param {string} targetMembershipId - 目标会员ID
 * @returns {Promise<Object>} - 价格预览
 */
async function getMembershipChangePreview(userId, targetMembershipId) {
    try {
        // 获取用户和目标会员信息
        const user = getUserInfo(userId);
        const targetMembership = getMembershipInfo(targetMembershipId);
        
        if (!user) {
            return {
                success: false,
                error: '用户不存在'
            };
        }
        
        if (!targetMembership) {
            return {
                success: false,
                error: '目标会员类型不存在'
            };
        }
        
        // 如果用户当前没有会员，直接返回目标会员价格
        if (!user.membership) {
            return {
                success: true,
                data: {
                    currentMembershipId: null,
                    currentMembershipName: '无会员',
                    targetMembershipId,
                    targetMembershipName: targetMembership.name,
                    remainingValue: 0,
                    upgradePrice: targetMembership.price,
                    isUpgrade: true,
                    isDowngrade: false,
                    refundAmount: 0,
                    daysRemaining: 0
                }
            };
        }
        
        // 如果目标会员与当前会员相同，无需变更
        if (user.membership.id === targetMembershipId) {
            return {
                success: false,
                error: '目标会员与当前会员相同，无需变更'
            };
        }
        
        // 计算价格
        const priceResult = calculateUpgradePrice(user.membership, targetMembership);
        
        if (!priceResult.success) {
            return priceResult;
        }
        
        // 获取当前会员完整信息
        const currentMembership = getMembershipInfo(user.membership.id);
        
        // 返回价格预览
        return {
            success: true,
            data: {
                ...priceResult.data,
                currentMembershipName: currentMembership ? currentMembership.name : '未知会员',
                targetMembershipName: targetMembership.name
            }
        };
    } catch (error) {
        console.error('获取会员变更价格预览失败:', error);
        return {
            success: false,
            error: error.message || '获取会员变更价格预览失败'
        };
    }
}

module.exports = {
    calculateUpgradePrice,
    executeMembershipChange,
    confirmMembershipChangeAfterPayment,
    getUserMembershipChangeLogs,
    getMembershipChangePreview,
    updateMembershipAfterChange
};
