/**
 * NexusOrbital 交易记录服务
 * 处理交易记录、账单管理等功能
 */
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

// 数据文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');

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

// 初始化交易记录和发票文件
initDataFile(TRANSACTIONS_FILE, []);
initDataFile(INVOICES_FILE, []);

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
 * 创建交易记录
 * @param {Object} transactionData - 交易数据
 * @returns {Promise<Object>} - 创建结果
 */
async function createTransaction(transactionData) {
    try {
        const { 
            userId, 
            orderId, 
            amount, 
            originalAmount,
            discountAmount,
            couponId,
            paymentMethod, 
            status, 
            membershipId, 
            description 
        } = transactionData;
        
        // 生成交易ID
        const transactionId = `tx_${uuidv4().replace(/-/g, '')}`;
        
        // 创建交易记录
        const transaction = {
            id: transactionId,
            userId,
            orderId,
            amount,
            originalAmount: originalAmount || amount,
            discountAmount: discountAmount || 0,
            couponId,
            paymentMethod,
            status,
            membershipId,
            description,
            createdAt: moment().toISOString(),
            updatedAt: moment().toISOString()
        };
        
        // 保存交易记录
        const transactions = readDataFile(TRANSACTIONS_FILE);
        transactions.push(transaction);
        writeDataFile(TRANSACTIONS_FILE, transactions);
        
        // 如果交易成功，创建发票
        if (status === 'paid' || status === 'success') {
            await createInvoice(transaction);
        }
        
        return {
            success: true,
            data: transaction
        };
    } catch (error) {
        console.error('创建交易记录失败:', error);
        return {
            success: false,
            error: error.message || '创建交易记录失败'
        };
    }
}

/**
 * 更新交易状态
 * @param {string} transactionId - 交易ID
 * @param {string} status - 新状态
 * @param {Object} additionalData - 额外数据
 * @returns {Promise<Object>} - 更新结果
 */
async function updateTransactionStatus(transactionId, status, additionalData = {}) {
    try {
        // 读取交易记录
        const transactions = readDataFile(TRANSACTIONS_FILE);
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            throw new Error(`交易记录不存在: ${transactionId}`);
        }
        
        // 更新交易状态
        transaction.status = status;
        transaction.updatedAt = moment().toISOString();
        
        // 更新额外数据
        Object.assign(transaction, additionalData);
        
        // 保存交易记录
        writeDataFile(TRANSACTIONS_FILE, transactions);
        
        // 如果交易成功，创建发票
        if (status === 'paid' || status === 'success') {
            await createInvoice(transaction);
        }
        
        return {
            success: true,
            data: transaction
        };
    } catch (error) {
        console.error('更新交易状态失败:', error);
        return {
            success: false,
            error: error.message || '更新交易状态失败'
        };
    }
}

/**
 * 创建发票
 * @param {Object} transaction - 交易记录
 * @returns {Promise<Object>} - 创建结果
 */
async function createInvoice(transaction) {
    try {
        // 生成发票ID
        const invoiceId = `inv_${uuidv4().replace(/-/g, '')}`;
        
        // 创建发票记录
        const invoice = {
            id: invoiceId,
            transactionId: transaction.id,
            userId: transaction.userId,
            amount: transaction.amount,
            originalAmount: transaction.originalAmount,
            discountAmount: transaction.discountAmount,
            couponId: transaction.couponId,
            paymentMethod: transaction.paymentMethod,
            membershipId: transaction.membershipId,
            description: transaction.description,
            status: 'issued',
            issueDate: moment().toISOString(),
            dueDate: moment().add(30, 'days').toISOString()
        };
        
        // 保存发票记录
        const invoices = readDataFile(INVOICES_FILE);
        invoices.push(invoice);
        writeDataFile(INVOICES_FILE, invoices);
        
        return {
            success: true,
            data: invoice
        };
    } catch (error) {
        console.error('创建发票失败:', error);
        return {
            success: false,
            error: error.message || '创建发票失败'
        };
    }
}

/**
 * 获取用户交易记录
 * @param {string} userId - 用户ID
 * @param {Object} filters - 过滤条件
 * @returns {Promise<Object>} - 交易记录列表
 */
async function getUserTransactions(userId, filters = {}) {
    try {
        // 读取交易记录
        const transactions = readDataFile(TRANSACTIONS_FILE);
        
        // 过滤用户交易记录
        let userTransactions = transactions.filter(t => t.userId === userId);
        
        // 应用过滤条件
        if (filters.status) {
            userTransactions = userTransactions.filter(t => t.status === filters.status);
        }
        
        if (filters.paymentMethod) {
            userTransactions = userTransactions.filter(t => t.paymentMethod === filters.paymentMethod);
        }
        
        if (filters.startDate) {
            const startDate = moment(filters.startDate);
            userTransactions = userTransactions.filter(t => moment(t.createdAt).isAfter(startDate));
        }
        
        if (filters.endDate) {
            const endDate = moment(filters.endDate);
            userTransactions = userTransactions.filter(t => moment(t.createdAt).isBefore(endDate));
        }
        
        // 排序
        userTransactions.sort((a, b) => moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf());
        
        return {
            success: true,
            data: userTransactions
        };
    } catch (error) {
        console.error('获取用户交易记录失败:', error);
        return {
            success: false,
            error: error.message || '获取用户交易记录失败'
        };
    }
}

/**
 * 获取交易详情
 * @param {string} transactionId - 交易ID
 * @returns {Promise<Object>} - 交易详情
 */
async function getTransactionDetail(transactionId) {
    try {
        // 读取交易记录
        const transactions = readDataFile(TRANSACTIONS_FILE);
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            throw new Error(`交易记录不存在: ${transactionId}`);
        }
        
        // 获取关联发票
        const invoices = readDataFile(INVOICES_FILE);
        const invoice = invoices.find(i => i.transactionId === transactionId);
        
        return {
            success: true,
            data: {
                transaction,
                invoice
            }
        };
    } catch (error) {
        console.error('获取交易详情失败:', error);
        return {
            success: false,
            error: error.message || '获取交易详情失败'
        };
    }
}

/**
 * 获取用户发票
 * @param {string} userId - 用户ID
 * @param {Object} filters - 过滤条件
 * @returns {Promise<Object>} - 发票列表
 */
async function getUserInvoices(userId, filters = {}) {
    try {
        // 读取发票记录
        const invoices = readDataFile(INVOICES_FILE);
        
        // 过滤用户发票
        let userInvoices = invoices.filter(i => i.userId === userId);
        
        // 应用过滤条件
        if (filters.status) {
            userInvoices = userInvoices.filter(i => i.status === filters.status);
        }
        
        if (filters.startDate) {
            const startDate = moment(filters.startDate);
            userInvoices = userInvoices.filter(i => moment(i.issueDate).isAfter(startDate));
        }
        
        if (filters.endDate) {
            const endDate = moment(filters.endDate);
            userInvoices = userInvoices.filter(i => moment(i.issueDate).isBefore(endDate));
        }
        
        // 排序
        userInvoices.sort((a, b) => moment(b.issueDate).valueOf() - moment(a.issueDate).valueOf());
        
        return {
            success: true,
            data: userInvoices
        };
    } catch (error) {
        console.error('获取用户发票失败:', error);
        return {
            success: false,
            error: error.message || '获取用户发票失败'
        };
    }
}

/**
 * 生成发票PDF
 * @param {string} invoiceId - 发票ID
 * @returns {Promise<Object>} - PDF数据
 */
async function generateInvoicePDF(invoiceId) {
    try {
        // 读取发票记录
        const invoices = readDataFile(INVOICES_FILE);
        const invoice = invoices.find(i => i.id === invoiceId);
        
        if (!invoice) {
            throw new Error(`发票不存在: ${invoiceId}`);
        }
        
        // 这里应该调用PDF生成服务
        // 在实际项目中，可以使用PDFKit等库生成PDF
        
        // 模拟PDF生成
        const pdfData = {
            id: invoice.id,
            fileName: `invoice_${invoice.id}.pdf`,
            content: `发票数据: ${JSON.stringify(invoice)}`
        };
        
        return {
            success: true,
            data: pdfData
        };
    } catch (error) {
        console.error('生成发票PDF失败:', error);
        return {
            success: false,
            error: error.message || '生成发票PDF失败'
        };
    }
}

module.exports = {
    createTransaction,
    updateTransactionStatus,
    getUserTransactions,
    getTransactionDetail,
    getUserInvoices,
    generateInvoicePDF
};
