/**
 * NexusOrbital 退款服务
 * 处理退款申请、审核和执行
 */
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const paymentService = require('../payment-integrations/payment-service');
const membershipService = require('./membership-service');
const transactionService = require('./transaction-service');

// 数据文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const REFUND_REQUESTS_FILE = path.join(DATA_DIR, 'refund_requests.json');

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

// 初始化退款请求文件
initDataFile(REFUND_REQUESTS_FILE, []);

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
 * 创建退款申请
 * @param {Object} requestData - 申请数据
 * @returns {Promise<Object>} - 创建结果
 */
async function createRefundRequest(requestData) {
    try {
        const { 
            userId, 
            orderId, 
            transactionId, 
            amount, 
            reason, 
            contactInfo 
        } = requestData;
        
        // 验证订单和交易
        const transactionResult = await transactionService.getTransactionDetail(transactionId);
        if (!transactionResult.success) {
            throw new Error(`交易记录不存在: ${transactionId}`);
        }
        
        const transaction = transactionResult.data.transaction;
        
        // 验证退款金额
        if (amount > transaction.amount) {
            throw new Error(`退款金额不能超过交易金额: ${transaction.amount}`);
        }
        
        // 验证交易状态
        if (transaction.status !== 'paid' && transaction.status !== 'success') {
            throw new Error(`只有已支付的交易才能申请退款，当前状态: ${transaction.status}`);
        }
        
        // 生成退款申请ID
        const refundRequestId = `refund_${uuidv4().replace(/-/g, '')}`;
        
        // 创建退款申请记录
        const refundRequest = {
            id: refundRequestId,
            userId,
            orderId,
            transactionId,
            amount,
            reason,
            contactInfo,
            status: 'pending',
            createdAt: moment().toISOString(),
            updatedAt: moment().toISOString()
        };
        
        // 保存退款申请记录
        const refundRequests = readDataFile(REFUND_REQUESTS_FILE);
        refundRequests.push(refundRequest);
        writeDataFile(REFUND_REQUESTS_FILE, refundRequests);
        
        return {
            success: true,
            data: refundRequest
        };
    } catch (error) {
        console.error('创建退款申请失败:', error);
        return {
            success: false,
            error: error.message || '创建退款申请失败'
        };
    }
}

/**
 * 审核退款申请
 * @param {string} refundRequestId - 退款申请ID
 * @param {string} action - 审核操作 (approve/reject)
 * @param {string} comment - 审核意见
 * @param {string} adminId - 管理员ID
 * @returns {Promise<Object>} - 审核结果
 */
async function reviewRefundRequest(refundRequestId, action, comment, adminId) {
    try {
        // 读取退款申请记录
        const refundRequests = readDataFile(REFUND_REQUESTS_FILE);
        const refundRequest = refundRequests.find(r => r.id === refundRequestId);
        
        if (!refundRequest) {
            throw new Error(`退款申请不存在: ${refundRequestId}`);
        }
        
        // 验证申请状态
        if (refundRequest.status !== 'pending') {
            throw new Error(`只有待处理的申请才能审核，当前状态: ${refundRequest.status}`);
        }
        
        // 更新申请状态
        refundRequest.status = action === 'approve' ? 'approved' : 'rejected';
        refundRequest.reviewComment = comment;
        refundRequest.reviewedBy = adminId;
        refundRequest.reviewedAt = moment().toISOString();
        refundRequest.updatedAt = moment().toISOString();
        
        // 保存退款申请记录
        writeDataFile(REFUND_REQUESTS_FILE, refundRequests);
        
        // 如果审核通过，执行退款
        if (action === 'approve') {
            const refundResult = await executeRefund(refundRequest);
            
            // 更新申请状态
            refundRequest.refundResult = refundResult;
            refundRequest.status = refundResult.success ? 'refunded' : 'refund_failed';
            refundRequest.updatedAt = moment().toISOString();
            
            // 保存退款申请记录
            writeDataFile(REFUND_REQUESTS_FILE, refundRequests);
            
            return {
                success: true,
                data: {
                    refundRequest,
                    refundResult
                }
            };
        }
        
        return {
            success: true,
            data: refundRequest
        };
    } catch (error) {
        console.error('审核退款申请失败:', error);
        return {
            success: false,
            error: error.message || '审核退款申请失败'
        };
    }
}

/**
 * 执行退款
 * @param {Object} refundRequest - 退款申请
 * @returns {Promise<Object>} - 退款结果
 */
async function executeRefund(refundRequest) {
    try {
        // 调用支付服务执行退款
        const refundResult = await paymentService.refund(
            refundRequest.orderId,
            refundRequest.amount,
            refundRequest.reason
        );
        
        if (refundResult.success) {
            // 如果是会员订阅，需要处理会员状态
            const transactionResult = await transactionService.getTransactionDetail(refundRequest.transactionId);
            if (transactionResult.success && transactionResult.data.transaction.membershipId) {
                // 取消会员
                await membershipService.cancelMembership(refundRequest.userId);
            }
            
            // 创建退款交易记录
            await transactionService.createTransaction({
                userId: refundRequest.userId,
                orderId: `refund_${refundRequest.orderId}`,
                amount: -refundRequest.amount, // 负数表示退款
                paymentMethod: transactionResult.data.transaction.paymentMethod,
                status: 'refunded',
                membershipId: transactionResult.data.transaction.membershipId,
                description: `退款: ${refundRequest.reason}`
            });
        }
        
        return refundResult;
    } catch (error) {
        console.error('执行退款失败:', error);
        return {
            success: false,
            error: error.message || '执行退款失败'
        };
    }
}

/**
 * 获取用户退款申请列表
 * @param {string} userId - 用户ID
 * @param {Object} filters - 过滤条件
 * @returns {Promise<Object>} - 退款申请列表
 */
async function getUserRefundRequests(userId, filters = {}) {
    try {
        // 读取退款申请记录
        const refundRequests = readDataFile(REFUND_REQUESTS_FILE);
        
        // 过滤用户退款申请
        let userRefundRequests = refundRequests.filter(r => r.userId === userId);
        
        // 应用过滤条件
        if (filters.status) {
            userRefundRequests = userRefundRequests.filter(r => r.status === filters.status);
        }
        
        if (filters.startDate) {
            const startDate = moment(filters.startDate);
            userRefundRequests = userRefundRequests.filter(r => moment(r.createdAt).isAfter(startDate));
        }
        
        if (filters.endDate) {
            const endDate = moment(filters.endDate);
            userRefundRequests = userRefundRequests.filter(r => moment(r.createdAt).isBefore(endDate));
        }
        
        // 排序
        userRefundRequests.sort((a, b) => moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf());
        
        return {
            success: true,
            data: userRefundRequests
        };
    } catch (error) {
        console.error('获取用户退款申请失败:', error);
        return {
            success: false,
            error: error.message || '获取用户退款申请失败'
        };
    }
}

/**
 * 获取所有退款申请（管理员用）
 * @param {Object} filters - 过滤条件
 * @returns {Promise<Object>} - 退款申请列表
 */
async function getAllRefundRequests(filters = {}) {
    try {
        // 读取退款申请记录
        const refundRequests = readDataFile(REFUND_REQUESTS_FILE);
        
        // 应用过滤条件
        let filteredRequests = [...refundRequests];
        
        if (filters.status) {
            filteredRequests = filteredRequests.filter(r => r.status === filters.status);
        }
        
        if (filters.userId) {
            filteredRequests = filteredRequests.filter(r => r.userId === filters.userId);
        }
        
        if (filters.startDate) {
            const startDate = moment(filters.startDate);
            filteredRequests = filteredRequests.filter(r => moment(r.createdAt).isAfter(startDate));
        }
        
        if (filters.endDate) {
            const endDate = moment(filters.endDate);
            filteredRequests = filteredRequests.filter(r => moment(r.createdAt).isBefore(endDate));
        }
        
        // 排序
        filteredRequests.sort((a, b) => moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf());
        
        // 分页
        if (filters.page && filters.limit) {
            const page = parseInt(filters.page);
            const limit = parseInt(filters.limit);
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            
            return {
                success: true,
                data: {
                    requests: filteredRequests.slice(startIndex, endIndex),
                    total: filteredRequests.length,
                    page,
                    limit,
                    totalPages: Math.ceil(filteredRequests.length / limit)
                }
            };
        }
        
        return {
            success: true,
            data: filteredRequests
        };
    } catch (error) {
        console.error('获取退款申请列表失败:', error);
        return {
            success: false,
            error: error.message || '获取退款申请列表失败'
        };
    }
}

/**
 * 获取退款申请详情
 * @param {string} refundRequestId - 退款申请ID
 * @returns {Promise<Object>} - 退款申请详情
 */
async function getRefundRequestDetail(refundRequestId) {
    try {
        // 读取退款申请记录
        const refundRequests = readDataFile(REFUND_REQUESTS_FILE);
        const refundRequest = refundRequests.find(r => r.id === refundRequestId);
        
        if (!refundRequest) {
            throw new Error(`退款申请不存在: ${refundRequestId}`);
        }
        
        // 获取关联交易记录
        const transactionResult = await transactionService.getTransactionDetail(refundRequest.transactionId);
        
        return {
            success: true,
            data: {
                refundRequest,
                transaction: transactionResult.success ? transactionResult.data : null
            }
        };
    } catch (error) {
        console.error('获取退款申请详情失败:', error);
        return {
            success: false,
            error: error.message || '获取退款申请详情失败'
        };
    }
}

module.exports = {
    createRefundRequest,
    reviewRefundRequest,
    executeRefund,
    getUserRefundRequests,
    getAllRefundRequests,
    getRefundRequestDetail
};
