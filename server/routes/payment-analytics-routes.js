/**
 * NexusOrbital 支付分析API路由
 */
const express = require('express');
const router = express.Router();
const paymentAnalyticsService = require('../services/payment-analytics-service');
const { authenticateUser, isAdmin } = require('../middleware/auth');
const { dataMasking } = require('../middleware/security-middleware');

/**
 * 获取支付分析概览
 * GET /api/payment-analytics/overview
 */
router.get('/overview', authenticateUser, isAdmin, dataMasking, async (req, res) => {
    try {
        const forceUpdate = req.query.force === 'true';
        const result = await paymentAnalyticsService.getPaymentAnalytics(forceUpdate);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || '获取支付分析数据失败'
            });
        }
        
        // 提取关键数据，减少响应大小
        const overview = {
            lastUpdated: result.data.lastUpdated,
            daily: {
                labels: result.data.dailyStats.map(item => item.date),
                successAmount: result.data.dailyStats.map(item => item.successAmount),
                refundAmount: result.data.dailyStats.map(item => item.refundAmount)
            },
            monthly: {
                labels: result.data.monthlyStats.map(item => `${item.year}-${String(item.month).padStart(2, '0')}`),
                successAmount: result.data.monthlyStats.map(item => item.successAmount),
                refundAmount: result.data.monthlyStats.map(item => item.refundAmount)
            },
            paymentMethods: result.data.paymentMethodStats.map(item => ({
                method: item.paymentMethod,
                amount: item.successAmount,
                count: item.successCount
            })),
            memberships: result.data.membershipStats.map(item => ({
                id: item.membershipId,
                amount: item.successAmount,
                count: item.successCount
            }))
        };
        
        res.json({
            success: true,
            data: overview,
            fromCache: result.fromCache
        });
    } catch (error) {
        console.error('获取支付分析概览失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '获取支付分析概览失败'
        });
    }
});

/**
 * 获取每日支付统计
 * GET /api/payment-analytics/daily
 */
router.get('/daily', authenticateUser, isAdmin, dataMasking, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const forceUpdate = req.query.force === 'true';
        
        const result = await paymentAnalyticsService.getDailyStats(days, forceUpdate);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || '获取每日支付统计失败'
            });
        }
        
        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('获取每日支付统计失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '获取每日支付统计失败'
        });
    }
});

/**
 * 获取每周支付统计
 * GET /api/payment-analytics/weekly
 */
router.get('/weekly', authenticateUser, isAdmin, dataMasking, async (req, res) => {
    try {
        const weeks = parseInt(req.query.weeks) || 12;
        const forceUpdate = req.query.force === 'true';
        
        const result = await paymentAnalyticsService.getWeeklyStats(weeks, forceUpdate);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || '获取每周支付统计失败'
            });
        }
        
        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('获取每周支付统计失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '获取每周支付统计失败'
        });
    }
});

/**
 * 获取每月支付统计
 * GET /api/payment-analytics/monthly
 */
router.get('/monthly', authenticateUser, isAdmin, dataMasking, async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 12;
        const forceUpdate = req.query.force === 'true';
        
        const result = await paymentAnalyticsService.getMonthlyStats(months, forceUpdate);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || '获取每月支付统计失败'
            });
        }
        
        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('获取每月支付统计失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '获取每月支付统计失败'
        });
    }
});

/**
 * 获取支付方式统计
 * GET /api/payment-analytics/payment-methods
 */
router.get('/payment-methods', authenticateUser, isAdmin, dataMasking, async (req, res) => {
    try {
        const forceUpdate = req.query.force === 'true';
        
        const result = await paymentAnalyticsService.getPaymentMethodStats(forceUpdate);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || '获取支付方式统计失败'
            });
        }
        
        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('获取支付方式统计失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '获取支付方式统计失败'
        });
    }
});

/**
 * 获取会员类型统计
 * GET /api/payment-analytics/memberships
 */
router.get('/memberships', authenticateUser, isAdmin, dataMasking, async (req, res) => {
    try {
        const forceUpdate = req.query.force === 'true';
        
        const result = await paymentAnalyticsService.getMembershipStats(forceUpdate);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || '获取会员类型统计失败'
            });
        }
        
        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('获取会员类型统计失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '获取会员类型统计失败'
        });
    }
});

/**
 * 获取自定义时间范围的支付统计
 * GET /api/payment-analytics/custom-range
 */
router.get('/custom-range', authenticateUser, isAdmin, dataMasking, async (req, res) => {
    try {
        const { startDate, endDate, groupBy } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: '开始日期和结束日期是必需的'
            });
        }
        
        const result = await paymentAnalyticsService.getCustomRangeStats(
            startDate,
            endDate,
            groupBy || 'day'
        );
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || '获取自定义时间范围的支付统计失败'
            });
        }
        
        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('获取自定义时间范围的支付统计失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '获取自定义时间范围的支付统计失败'
        });
    }
});

/**
 * 获取用户支付统计
 * GET /api/payment-analytics/user/:userId
 */
router.get('/user/:userId', authenticateUser, dataMasking, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // 检查权限：只有管理员或者用户本人可以查看
        if (!req.user.isAdmin && req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                error: '没有权限查看此用户的支付统计'
            });
        }
        
        const result = await paymentAnalyticsService.getUserPaymentStats(userId);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || '获取用户支付统计失败'
            });
        }
        
        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('获取用户支付统计失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '获取用户支付统计失败'
        });
    }
});

/**
 * 获取退款统计
 * GET /api/payment-analytics/refunds
 */
router.get('/refunds', authenticateUser, isAdmin, dataMasking, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        
        const result = await paymentAnalyticsService.getRefundStats(days);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || '获取退款统计失败'
            });
        }
        
        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('获取退款统计失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '获取退款统计失败'
        });
    }
});

module.exports = router;
