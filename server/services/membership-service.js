/**
 * NexusOrbital 会员服务
 * 处理会员状态更新、权益管理等功能
 */
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// 数据文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MEMBERSHIPS_FILE = path.join(DATA_DIR, 'memberships.json');
const MEMBERSHIP_RECORDS_FILE = path.join(DATA_DIR, 'membership_records.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
function initDataFile(filePath, initialData = []) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    }
}

// 初始化会员记录文件
initDataFile(MEMBERSHIP_RECORDS_FILE, []);

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
        return [];
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
 * 更新用户会员状态
 * @param {string} userId - 用户ID
 * @param {string} membershipId - 会员计划ID
 * @param {Object} paymentData - 支付数据
 * @returns {Promise<Object>} - 更新结果
 */
async function updateMembership(userId, membershipId, paymentData = {}) {
    try {
        // 读取用户数据
        const users = readDataFile(USERS_FILE);
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            throw new Error(`用户不存在: ${userId}`);
        }
        
        // 读取会员计划数据
        const memberships = readDataFile(MEMBERSHIPS_FILE);
        const membership = memberships.find(m => m.id === membershipId);
        
        if (!membership) {
            throw new Error(`会员计划不存在: ${membershipId}`);
        }
        
        // 计算会员有效期（默认1年）
        const startDate = moment().toISOString();
        const endDate = moment().add(1, 'year').toISOString();
        
        // 更新用户会员信息
        user.membership = {
            id: membershipId,
            name: membership.name,
            startDate: startDate,
            endDate: endDate,
            status: 'active',
            paymentId: paymentData.transactionId || paymentData.orderId
        };
        
        // 保存用户数据
        writeDataFile(USERS_FILE, users);
        
        // 创建会员记录
        const membershipRecord = {
            id: `mr_${Date.now()}`,
            userId: userId,
            membershipId: membershipId,
            startDate: startDate,
            endDate: endDate,
            status: 'active',
            paymentData: {
                transactionId: paymentData.transactionId || paymentData.orderId,
                amount: paymentData.amount,
                paymentMethod: paymentData.paymentMethod,
                payTime: paymentData.payTime || moment().toISOString()
            },
            createdAt: moment().toISOString()
        };
        
        // 保存会员记录
        const membershipRecords = readDataFile(MEMBERSHIP_RECORDS_FILE);
        membershipRecords.push(membershipRecord);
        writeDataFile(MEMBERSHIP_RECORDS_FILE, membershipRecords);
        
        // 发送会员欢迎邮件
        // 这里应该调用邮件服务发送欢迎邮件
        // await emailService.sendMembershipWelcomeEmail(user.email, membership.name);
        
        return {
            success: true,
            data: {
                userId: userId,
                membership: user.membership
            }
        };
    } catch (error) {
        console.error('更新会员状态失败:', error);
        return {
            success: false,
            error: error.message || '更新会员状态失败'
        };
    }
}

/**
 * 获取用户会员信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 会员信息
 */
async function getMembershipInfo(userId) {
    try {
        // 读取用户数据
        const users = readDataFile(USERS_FILE);
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            throw new Error(`用户不存在: ${userId}`);
        }
        
        // 如果用户没有会员信息，默认为免费用户
        if (!user.membership) {
            return {
                success: true,
                data: {
                    id: 'free',
                    name: '免费用户',
                    status: 'active',
                    startDate: user.createdAt,
                    endDate: null // 免费会员无过期时间
                }
            };
        }
        
        // 检查会员是否过期
        const isExpired = moment(user.membership.endDate).isBefore(moment());
        
        // 如果会员已过期，更新状态
        if (isExpired && user.membership.status === 'active') {
            user.membership.status = 'expired';
            
            // 保存用户数据
            writeDataFile(USERS_FILE, users);
        }
        
        return {
            success: true,
            data: user.membership
        };
    } catch (error) {
        console.error('获取会员信息失败:', error);
        return {
            success: false,
            error: error.message || '获取会员信息失败'
        };
    }
}

/**
 * 获取用户会员记录
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 会员记录列表
 */
async function getMembershipRecords(userId) {
    try {
        // 读取会员记录
        const records = readDataFile(MEMBERSHIP_RECORDS_FILE);
        const userRecords = records.filter(r => r.userId === userId);
        
        return {
            success: true,
            data: userRecords
        };
    } catch (error) {
        console.error('获取会员记录失败:', error);
        return {
            success: false,
            error: error.message || '获取会员记录失败'
        };
    }
}

/**
 * 取消会员
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 取消结果
 */
async function cancelMembership(userId) {
    try {
        // 读取用户数据
        const users = readDataFile(USERS_FILE);
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            throw new Error(`用户不存在: ${userId}`);
        }
        
        // 如果用户没有会员信息或已经是免费用户
        if (!user.membership || user.membership.id === 'free') {
            return {
                success: true,
                data: {
                    message: '用户当前是免费会员，无需取消'
                }
            };
        }
        
        // 更新会员状态
        user.membership.status = 'cancelled';
        user.membership.cancelDate = moment().toISOString();
        
        // 保存用户数据
        writeDataFile(USERS_FILE, users);
        
        // 更新会员记录
        const records = readDataFile(MEMBERSHIP_RECORDS_FILE);
        const activeRecord = records.find(r => 
            r.userId === userId && 
            r.status === 'active' && 
            r.membershipId === user.membership.id
        );
        
        if (activeRecord) {
            activeRecord.status = 'cancelled';
            activeRecord.cancelDate = moment().toISOString();
            writeDataFile(MEMBERSHIP_RECORDS_FILE, records);
        }
        
        return {
            success: true,
            data: {
                message: '会员已成功取消',
                membership: user.membership
            }
        };
    } catch (error) {
        console.error('取消会员失败:', error);
        return {
            success: false,
            error: error.message || '取消会员失败'
        };
    }
}

module.exports = {
    updateMembership,
    getMembershipInfo,
    getMembershipRecords,
    cancelMembership
};
