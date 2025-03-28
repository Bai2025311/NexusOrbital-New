/**
 * NexusOrbital 自动续费路由
 * 处理自动续费相关的API请求
 */
const express = require('express');
const router = express.Router();
const autoRenewalService = require('../services/auto-renewal-service');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { validateAutoRenewalRequest } = require('../middleware/validators');
const securityMiddleware = require('../middleware/security-middleware');

/**
 * 启用自动续费
 * POST /api/auto-renewal/enable
 */
router.post('/enable', 
    authenticateUser, 
    validateAutoRenewalRequest,
    securityMiddleware.validateSensitiveOperation,
    async (req, res) => {
        try {
            const { membershipId, paymentMethod, paymentToken } = req.body;
            const userId = req.user.id;
            
            const result = await autoRenewalService.enableAutoRenewal({
                userId,
                membershipId,
                paymentMethod,
                paymentToken
            });
            
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
            
            res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('启用自动续费失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

/**
 * 禁用自动续费
 * POST /api/auto-renewal/disable
 */
router.post('/disable', 
    authenticateUser, 
    securityMiddleware.validateSensitiveOperation,
    async (req, res) => {
        try {
            const { membershipId } = req.body;
            const userId = req.user.id;
            
            if (!membershipId) {
                return res.status(400).json({
                    success: false,
                    error: '缺少必要参数'
                });
            }
            
            const result = await autoRenewalService.disableAutoRenewal(userId, membershipId);
            
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
            
            res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('禁用自动续费失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

/**
 * 获取用户的自动续费信息
 * GET /api/auto-renewal/user
 */
router.get('/user', 
    authenticateUser, 
    async (req, res) => {
        try {
            const userId = req.user.id;
            
            const result = await autoRenewalService.getUserAutoRenewals(userId);
            
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
            
            res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('获取用户自动续费信息失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

/**
 * 获取用户的自动续费日志
 * GET /api/auto-renewal/logs
 */
router.get('/logs', 
    authenticateUser, 
    async (req, res) => {
        try {
            const userId = req.user.id;
            
            const result = await autoRenewalService.getRenewalLogs(userId);
            
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
            
            res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('获取用户自动续费日志失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

/**
 * 管理员：获取即将到期的自动续费
 * GET /api/auto-renewal/admin/upcoming
 */
router.get('/admin/upcoming', 
    authenticateAdmin, 
    async (req, res) => {
        try {
            const { days = 3 } = req.query;
            
            const upcomingRenewals = await autoRenewalService.getUpcomingRenewals(parseInt(days));
            
            res.status(200).json({
                success: true,
                data: upcomingRenewals
            });
        } catch (error) {
            console.error('获取即将到期的自动续费失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

/**
 * 管理员：手动处理自动续费
 * POST /api/auto-renewal/admin/process
 */
router.post('/admin/process', 
    authenticateAdmin, 
    async (req, res) => {
        try {
            const { days = 3 } = req.body;
            
            const result = await autoRenewalService.processUpcomingRenewals(parseInt(days));
            
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
            
            res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('处理自动续费失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

/**
 * 管理员：发送续费提醒
 * POST /api/auto-renewal/admin/send-reminders
 */
router.post('/admin/send-reminders', 
    authenticateAdmin, 
    async (req, res) => {
        try {
            const { days = 7 } = req.body;
            
            const result = await autoRenewalService.sendRenewalReminders(parseInt(days));
            
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
            
            res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('发送续费提醒失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

module.exports = router;
