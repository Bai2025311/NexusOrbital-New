/**
 * NexusOrbital 会员升级/降级路由
 * 处理会员等级变更相关的API请求
 */
const express = require('express');
const router = express.Router();
const membershipUpgradeService = require('../services/membership-upgrade-service');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const securityMiddleware = require('../middleware/security-middleware');

/**
 * 获取会员变更价格预览
 * GET /api/membership-upgrade/preview?targetMembershipId=xxx
 */
router.get('/preview', 
    authenticateUser, 
    async (req, res) => {
        try {
            const { targetMembershipId } = req.query;
            const userId = req.user.id;
            
            if (!targetMembershipId) {
                return res.status(400).json({
                    success: false,
                    error: '缺少目标会员ID'
                });
            }
            
            const result = await membershipUpgradeService.getMembershipChangePreview(userId, targetMembershipId);
            
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
            console.error('获取会员变更价格预览失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

/**
 * 执行会员升级/降级
 * POST /api/membership-upgrade/execute
 */
router.post('/execute', 
    authenticateUser, 
    securityMiddleware.validateSensitiveOperation,
    async (req, res) => {
        try {
            const { targetMembershipId, paymentMethod, paymentToken } = req.body;
            const userId = req.user.id;
            
            if (!targetMembershipId) {
                return res.status(400).json({
                    success: false,
                    error: '缺少目标会员ID'
                });
            }
            
            // 验证支付方式
            const validPaymentMethods = ['alipay', 'wechat', 'paypal', 'stripe'];
            if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
                return res.status(400).json({
                    success: false,
                    error: '无效的支付方式'
                });
            }
            
            const result = await membershipUpgradeService.executeMembershipChange({
                userId,
                targetMembershipId,
                paymentMethod: paymentMethod || 'alipay', // 默认支付方式
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
            console.error('执行会员变更失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

/**
 * 获取用户的会员变更日志
 * GET /api/membership-upgrade/logs
 */
router.get('/logs', 
    authenticateUser, 
    async (req, res) => {
        try {
            const userId = req.user.id;
            
            const result = await membershipUpgradeService.getUserMembershipChangeLogs(userId);
            
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
            console.error('获取用户会员变更日志失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

/**
 * 支付回调：确认会员变更
 * POST /api/membership-upgrade/confirm
 * 注意：实际项目中，这个应该是由支付系统回调，而不是直接暴露给客户端
 */
router.post('/confirm', 
    authenticateAdmin, 
    async (req, res) => {
        try {
            const { orderId } = req.body;
            
            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    error: '缺少订单ID'
                });
            }
            
            const result = await membershipUpgradeService.confirmMembershipChangeAfterPayment(orderId);
            
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
            console.error('确认会员变更失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

/**
 * 管理员：手动更新用户会员
 * POST /api/membership-upgrade/admin/update
 */
router.post('/admin/update', 
    authenticateAdmin, 
    async (req, res) => {
        try {
            const { userId, membershipId } = req.body;
            
            if (!userId || !membershipId) {
                return res.status(400).json({
                    success: false,
                    error: '缺少必要参数'
                });
            }
            
            // 创建日志ID
            const logId = require('uuid').v4();
            
            const result = await membershipUpgradeService.updateMembershipAfterChange(userId, membershipId, logId);
            
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
            console.error('管理员更新用户会员失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误，请稍后再试'
            });
        }
    }
);

module.exports = router;
