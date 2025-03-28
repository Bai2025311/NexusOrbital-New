/**
 * NexusOrbital 支付分析服务
 * 提供支付数据分析和报表生成功能
 */
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// 数据文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const ANALYTICS_CACHE_FILE = path.join(DATA_DIR, 'payment_analytics_cache.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 读取交易数据
 * @returns {Array} 交易数据列表
 */
function readTransactions() {
    try {
        if (!fs.existsSync(TRANSACTIONS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(TRANSACTIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取交易数据失败:', error);
        return [];
    }
}

/**
 * 读取分析缓存
 * @returns {Object} 分析缓存数据
 */
function readAnalyticsCache() {
    try {
        if (!fs.existsSync(ANALYTICS_CACHE_FILE)) {
            return {
                lastUpdated: null,
                dailyStats: {},
                weeklyStats: {},
                monthlyStats: {},
                paymentMethodStats: {},
                membershipStats: {}
            };
        }
        const data = fs.readFileSync(ANALYTICS_CACHE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取分析缓存失败:', error);
        return {
            lastUpdated: null,
            dailyStats: {},
            weeklyStats: {},
            monthlyStats: {},
            paymentMethodStats: {},
            membershipStats: {}
        };
    }
}

/**
 * 写入分析缓存
 * @param {Object} data 缓存数据
 */
function writeAnalyticsCache(data) {
    try {
        fs.writeFileSync(ANALYTICS_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('写入分析缓存失败:', error);
    }
}

/**
 * 生成每日支付统计
 * @param {Array} transactions 交易数据
 * @param {number} days 天数
 * @returns {Object} 每日统计数据
 */
function generateDailyStats(transactions, days = 30) {
    const stats = {};
    const startDate = moment().subtract(days, 'days').startOf('day');
    
    // 初始化每一天的数据
    for (let i = 0; i <= days; i++) {
        const date = moment(startDate).add(i, 'days').format('YYYY-MM-DD');
        stats[date] = {
            date,
            count: 0,
            amount: 0,
            successCount: 0,
            successAmount: 0,
            failureCount: 0,
            refundCount: 0,
            refundAmount: 0
        };
    }
    
    // 统计交易数据
    transactions.forEach(transaction => {
        const date = moment(transaction.createdAt).format('YYYY-MM-DD');
        if (stats[date]) {
            stats[date].count++;
            stats[date].amount += parseFloat(transaction.amount) || 0;
            
            if (transaction.status === 'success') {
                stats[date].successCount++;
                stats[date].successAmount += parseFloat(transaction.amount) || 0;
            } else if (transaction.status === 'failed') {
                stats[date].failureCount++;
            }
            
            if (transaction.refunded) {
                stats[date].refundCount++;
                stats[date].refundAmount += parseFloat(transaction.refundAmount) || 0;
            }
        }
    });
    
    // 转换为数组并按日期排序
    return Object.values(stats).sort((a, b) => moment(a.date).diff(moment(b.date)));
}

/**
 * 生成每周支付统计
 * @param {Array} transactions 交易数据
 * @param {number} weeks 周数
 * @returns {Object} 每周统计数据
 */
function generateWeeklyStats(transactions, weeks = 12) {
    const stats = {};
    const startDate = moment().subtract(weeks, 'weeks').startOf('week');
    
    // 初始化每一周的数据
    for (let i = 0; i <= weeks; i++) {
        const weekStart = moment(startDate).add(i, 'weeks');
        const weekEnd = moment(weekStart).endOf('week');
        const weekKey = `${weekStart.format('YYYY-MM-DD')}~${weekEnd.format('YYYY-MM-DD')}`;
        
        stats[weekKey] = {
            weekKey,
            weekNumber: weekStart.week(),
            year: weekStart.year(),
            count: 0,
            amount: 0,
            successCount: 0,
            successAmount: 0,
            failureCount: 0,
            refundCount: 0,
            refundAmount: 0
        };
    }
    
    // 统计交易数据
    transactions.forEach(transaction => {
        const transactionDate = moment(transaction.createdAt);
        const weekStart = moment(transactionDate).startOf('week');
        const weekEnd = moment(weekStart).endOf('week');
        const weekKey = `${weekStart.format('YYYY-MM-DD')}~${weekEnd.format('YYYY-MM-DD')}`;
        
        if (stats[weekKey]) {
            stats[weekKey].count++;
            stats[weekKey].amount += parseFloat(transaction.amount) || 0;
            
            if (transaction.status === 'success') {
                stats[weekKey].successCount++;
                stats[weekKey].successAmount += parseFloat(transaction.amount) || 0;
            } else if (transaction.status === 'failed') {
                stats[weekKey].failureCount++;
            }
            
            if (transaction.refunded) {
                stats[weekKey].refundCount++;
                stats[weekKey].refundAmount += parseFloat(transaction.refundAmount) || 0;
            }
        }
    });
    
    // 转换为数组并按周排序
    return Object.values(stats).sort((a, b) => {
        if (a.year !== b.year) {
            return a.year - b.year;
        }
        return a.weekNumber - b.weekNumber;
    });
}

/**
 * 生成每月支付统计
 * @param {Array} transactions 交易数据
 * @param {number} months 月数
 * @returns {Object} 每月统计数据
 */
function generateMonthlyStats(transactions, months = 12) {
    const stats = {};
    const startDate = moment().subtract(months, 'months').startOf('month');
    
    // 初始化每一月的数据
    for (let i = 0; i <= months; i++) {
        const date = moment(startDate).add(i, 'months');
        const monthKey = date.format('YYYY-MM');
        
        stats[monthKey] = {
            monthKey,
            year: date.year(),
            month: date.month() + 1,
            count: 0,
            amount: 0,
            successCount: 0,
            successAmount: 0,
            failureCount: 0,
            refundCount: 0,
            refundAmount: 0
        };
    }
    
    // 统计交易数据
    transactions.forEach(transaction => {
        const monthKey = moment(transaction.createdAt).format('YYYY-MM');
        
        if (stats[monthKey]) {
            stats[monthKey].count++;
            stats[monthKey].amount += parseFloat(transaction.amount) || 0;
            
            if (transaction.status === 'success') {
                stats[monthKey].successCount++;
                stats[monthKey].successAmount += parseFloat(transaction.amount) || 0;
            } else if (transaction.status === 'failed') {
                stats[monthKey].failureCount++;
            }
            
            if (transaction.refunded) {
                stats[monthKey].refundCount++;
                stats[monthKey].refundAmount += parseFloat(transaction.refundAmount) || 0;
            }
        }
    });
    
    // 转换为数组并按月排序
    return Object.values(stats).sort((a, b) => {
        if (a.year !== b.year) {
            return a.year - b.year;
        }
        return a.month - b.month;
    });
}

/**
 * 生成支付方式统计
 * @param {Array} transactions 交易数据
 * @returns {Object} 支付方式统计数据
 */
function generatePaymentMethodStats(transactions) {
    const stats = {};
    
    // 统计交易数据
    transactions.forEach(transaction => {
        const paymentMethod = transaction.paymentMethod || 'unknown';
        
        if (!stats[paymentMethod]) {
            stats[paymentMethod] = {
                paymentMethod,
                count: 0,
                amount: 0,
                successCount: 0,
                successAmount: 0,
                failureCount: 0,
                refundCount: 0,
                refundAmount: 0
            };
        }
        
        stats[paymentMethod].count++;
        stats[paymentMethod].amount += parseFloat(transaction.amount) || 0;
        
        if (transaction.status === 'success') {
            stats[paymentMethod].successCount++;
            stats[paymentMethod].successAmount += parseFloat(transaction.amount) || 0;
        } else if (transaction.status === 'failed') {
            stats[paymentMethod].failureCount++;
        }
        
        if (transaction.refunded) {
            stats[paymentMethod].refundCount++;
            stats[paymentMethod].refundAmount += parseFloat(transaction.refundAmount) || 0;
        }
    });
    
    // 转换为数组并按成功金额排序
    return Object.values(stats).sort((a, b) => b.successAmount - a.successAmount);
}

/**
 * 生成会员类型统计
 * @param {Array} transactions 交易数据
 * @returns {Object} 会员类型统计数据
 */
function generateMembershipStats(transactions) {
    const stats = {};
    
    // 统计交易数据
    transactions.forEach(transaction => {
        const membershipId = transaction.membershipId || 'unknown';
        
        if (!stats[membershipId]) {
            stats[membershipId] = {
                membershipId,
                count: 0,
                amount: 0,
                successCount: 0,
                successAmount: 0,
                failureCount: 0,
                refundCount: 0,
                refundAmount: 0
            };
        }
        
        stats[membershipId].count++;
        stats[membershipId].amount += parseFloat(transaction.amount) || 0;
        
        if (transaction.status === 'success') {
            stats[membershipId].successCount++;
            stats[membershipId].successAmount += parseFloat(transaction.amount) || 0;
        } else if (transaction.status === 'failed') {
            stats[membershipId].failureCount++;
        }
        
        if (transaction.refunded) {
            stats[membershipId].refundCount++;
            stats[membershipId].refundAmount += parseFloat(transaction.refundAmount) || 0;
        }
    });
    
    // 转换为数组并按成功金额排序
    return Object.values(stats).sort((a, b) => b.successAmount - a.successAmount);
}

/**
 * 更新支付分析数据
 * @param {boolean} force 是否强制更新
 * @returns {Promise<Object>} 更新结果
 */
async function updatePaymentAnalytics(force = false) {
    try {
        const cache = readAnalyticsCache();
        const now = moment();
        
        // 如果缓存存在且不强制更新，检查是否需要更新
        if (cache.lastUpdated && !force) {
            const lastUpdated = moment(cache.lastUpdated);
            // 如果上次更新在1小时内，不更新
            if (now.diff(lastUpdated, 'hours') < 1) {
                return {
                    success: true,
                    data: cache,
                    fromCache: true
                };
            }
        }
        
        // 读取交易数据
        const transactions = readTransactions();
        
        // 生成统计数据
        const dailyStats = generateDailyStats(transactions);
        const weeklyStats = generateWeeklyStats(transactions);
        const monthlyStats = generateMonthlyStats(transactions);
        const paymentMethodStats = generatePaymentMethodStats(transactions);
        const membershipStats = generateMembershipStats(transactions);
        
        // 更新缓存
        const newCache = {
            lastUpdated: now.toISOString(),
            dailyStats,
            weeklyStats,
            monthlyStats,
            paymentMethodStats,
            membershipStats
        };
        
        writeAnalyticsCache(newCache);
        
        return {
            success: true,
            data: newCache,
            fromCache: false
        };
    } catch (error) {
        console.error('更新支付分析数据失败:', error);
        return {
            success: false,
            error: error.message || '更新支付分析数据失败'
        };
    }
}

/**
 * 获取支付分析数据
 * @param {boolean} forceUpdate 是否强制更新
 * @returns {Promise<Object>} 分析数据
 */
async function getPaymentAnalytics(forceUpdate = false) {
    return updatePaymentAnalytics(forceUpdate);
}

/**
 * 获取每日支付统计
 * @param {number} days 天数
 * @param {boolean} forceUpdate 是否强制更新
 * @returns {Promise<Object>} 每日统计数据
 */
async function getDailyStats(days = 30, forceUpdate = false) {
    const result = await updatePaymentAnalytics(forceUpdate);
    
    if (!result.success) {
        return result;
    }
    
    // 如果请求的天数与缓存的天数不同，重新生成
    if (days !== 30 && result.data.dailyStats.length !== days + 1) {
        const transactions = readTransactions();
        const dailyStats = generateDailyStats(transactions, days);
        
        return {
            success: true,
            data: dailyStats
        };
    }
    
    return {
        success: true,
        data: result.data.dailyStats
    };
}

/**
 * 获取每周支付统计
 * @param {number} weeks 周数
 * @param {boolean} forceUpdate 是否强制更新
 * @returns {Promise<Object>} 每周统计数据
 */
async function getWeeklyStats(weeks = 12, forceUpdate = false) {
    const result = await updatePaymentAnalytics(forceUpdate);
    
    if (!result.success) {
        return result;
    }
    
    // 如果请求的周数与缓存的周数不同，重新生成
    if (weeks !== 12 && result.data.weeklyStats.length !== weeks + 1) {
        const transactions = readTransactions();
        const weeklyStats = generateWeeklyStats(transactions, weeks);
        
        return {
            success: true,
            data: weeklyStats
        };
    }
    
    return {
        success: true,
        data: result.data.weeklyStats
    };
}

/**
 * 获取每月支付统计
 * @param {number} months 月数
 * @param {boolean} forceUpdate 是否强制更新
 * @returns {Promise<Object>} 每月统计数据
 */
async function getMonthlyStats(months = 12, forceUpdate = false) {
    const result = await updatePaymentAnalytics(forceUpdate);
    
    if (!result.success) {
        return result;
    }
    
    // 如果请求的月数与缓存的月数不同，重新生成
    if (months !== 12 && result.data.monthlyStats.length !== months + 1) {
        const transactions = readTransactions();
        const monthlyStats = generateMonthlyStats(transactions, months);
        
        return {
            success: true,
            data: monthlyStats
        };
    }
    
    return {
        success: true,
        data: result.data.monthlyStats
    };
}

/**
 * 获取支付方式统计
 * @param {boolean} forceUpdate 是否强制更新
 * @returns {Promise<Object>} 支付方式统计数据
 */
async function getPaymentMethodStats(forceUpdate = false) {
    const result = await updatePaymentAnalytics(forceUpdate);
    
    if (!result.success) {
        return result;
    }
    
    return {
        success: true,
        data: result.data.paymentMethodStats
    };
}

/**
 * 获取会员类型统计
 * @param {boolean} forceUpdate 是否强制更新
 * @returns {Promise<Object>} 会员类型统计数据
 */
async function getMembershipStats(forceUpdate = false) {
    const result = await updatePaymentAnalytics(forceUpdate);
    
    if (!result.success) {
        return result;
    }
    
    return {
        success: true,
        data: result.data.membershipStats
    };
}

/**
 * 生成自定义时间范围的支付统计
 * @param {string} startDate 开始日期 (YYYY-MM-DD)
 * @param {string} endDate 结束日期 (YYYY-MM-DD)
 * @param {string} groupBy 分组方式 (day, week, month)
 * @returns {Promise<Object>} 统计数据
 */
async function getCustomRangeStats(startDate, endDate, groupBy = 'day') {
    try {
        const transactions = readTransactions();
        const start = moment(startDate).startOf('day');
        const end = moment(endDate).endOf('day');
        
        // 过滤时间范围内的交易
        const filteredTransactions = transactions.filter(transaction => {
            const date = moment(transaction.createdAt);
            return date.isBetween(start, end, null, '[]');
        });
        
        let stats = [];
        
        // 根据分组方式生成统计
        if (groupBy === 'week') {
            // 计算周数
            const weeks = Math.ceil(end.diff(start, 'weeks', true));
            stats = generateWeeklyStats(filteredTransactions, weeks);
        } else if (groupBy === 'month') {
            // 计算月数
            const months = Math.ceil(end.diff(start, 'months', true));
            stats = generateMonthlyStats(filteredTransactions, months);
        } else {
            // 计算天数
            const days = end.diff(start, 'days');
            stats = generateDailyStats(filteredTransactions, days);
        }
        
        return {
            success: true,
            data: stats
        };
    } catch (error) {
        console.error('生成自定义时间范围的支付统计失败:', error);
        return {
            success: false,
            error: error.message || '生成自定义时间范围的支付统计失败'
        };
    }
}

/**
 * 生成用户支付统计
 * @param {string} userId 用户ID
 * @returns {Promise<Object>} 用户支付统计
 */
async function getUserPaymentStats(userId) {
    try {
        const transactions = readTransactions();
        
        // 过滤用户交易
        const userTransactions = transactions.filter(transaction => transaction.userId === userId);
        
        // 基本统计
        const totalCount = userTransactions.length;
        const successTransactions = userTransactions.filter(transaction => transaction.status === 'success');
        const successCount = successTransactions.length;
        const totalAmount = successTransactions.reduce((sum, transaction) => sum + (parseFloat(transaction.amount) || 0), 0);
        const refundedTransactions = userTransactions.filter(transaction => transaction.refunded);
        const refundCount = refundedTransactions.length;
        const refundAmount = refundedTransactions.reduce((sum, transaction) => sum + (parseFloat(transaction.refundAmount) || 0), 0);
        
        // 支付方式统计
        const paymentMethods = {};
        successTransactions.forEach(transaction => {
            const method = transaction.paymentMethod || 'unknown';
            if (!paymentMethods[method]) {
                paymentMethods[method] = {
                    count: 0,
                    amount: 0
                };
            }
            paymentMethods[method].count++;
            paymentMethods[method].amount += parseFloat(transaction.amount) || 0;
        });
        
        // 会员类型统计
        const memberships = {};
        successTransactions.forEach(transaction => {
            const membershipId = transaction.membershipId || 'unknown';
            if (!memberships[membershipId]) {
                memberships[membershipId] = {
                    count: 0,
                    amount: 0
                };
            }
            memberships[membershipId].count++;
            memberships[membershipId].amount += parseFloat(transaction.amount) || 0;
        });
        
        // 最近交易
        const recentTransactions = [...userTransactions]
            .sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)))
            .slice(0, 5);
        
        return {
            success: true,
            data: {
                userId,
                totalCount,
                successCount,
                totalAmount,
                refundCount,
                refundAmount,
                paymentMethods: Object.entries(paymentMethods).map(([method, stats]) => ({
                    method,
                    ...stats
                })),
                memberships: Object.entries(memberships).map(([membershipId, stats]) => ({
                    membershipId,
                    ...stats
                })),
                recentTransactions
            }
        };
    } catch (error) {
        console.error('生成用户支付统计失败:', error);
        return {
            success: false,
            error: error.message || '生成用户支付统计失败'
        };
    }
}

/**
 * 生成退款统计
 * @param {number} days 天数
 * @returns {Promise<Object>} 退款统计
 */
async function getRefundStats(days = 30) {
    try {
        const transactions = readTransactions();
        const startDate = moment().subtract(days, 'days').startOf('day');
        
        // 过滤退款交易
        const refundTransactions = transactions.filter(transaction => 
            transaction.refunded && moment(transaction.refundedAt).isAfter(startDate)
        );
        
        // 按日期分组
        const dailyStats = {};
        for (let i = 0; i <= days; i++) {
            const date = moment(startDate).add(i, 'days').format('YYYY-MM-DD');
            dailyStats[date] = {
                date,
                count: 0,
                amount: 0
            };
        }
        
        // 统计每日退款
        refundTransactions.forEach(transaction => {
            const date = moment(transaction.refundedAt).format('YYYY-MM-DD');
            if (dailyStats[date]) {
                dailyStats[date].count++;
                dailyStats[date].amount += parseFloat(transaction.refundAmount) || 0;
            }
        });
        
        // 退款原因统计
        const reasonStats = {};
        refundTransactions.forEach(transaction => {
            const reason = transaction.refundReason || '未指定原因';
            if (!reasonStats[reason]) {
                reasonStats[reason] = {
                    reason,
                    count: 0,
                    amount: 0
                };
            }
            reasonStats[reason].count++;
            reasonStats[reason].amount += parseFloat(transaction.refundAmount) || 0;
        });
        
        // 总计
        const totalCount = refundTransactions.length;
        const totalAmount = refundTransactions.reduce((sum, transaction) => sum + (parseFloat(transaction.refundAmount) || 0), 0);
        
        return {
            success: true,
            data: {
                totalCount,
                totalAmount,
                dailyStats: Object.values(dailyStats).sort((a, b) => moment(a.date).diff(moment(b.date))),
                reasonStats: Object.values(reasonStats).sort((a, b) => b.count - a.count)
            }
        };
    } catch (error) {
        console.error('生成退款统计失败:', error);
        return {
            success: false,
            error: error.message || '生成退款统计失败'
        };
    }
}

module.exports = {
    getPaymentAnalytics,
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getPaymentMethodStats,
    getMembershipStats,
    getCustomRangeStats,
    getUserPaymentStats,
    getRefundStats
};
