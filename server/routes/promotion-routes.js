/**
 * NexusOrbital 促销活动路由
 * 提供促销活动和优惠券相关的API接口
 */
const express = require('express');
const router = express.Router();
const promotionService = require('../services/promotion-service');
const { authenticateUser, authorizeAdmin } = require('../middleware/auth');
const { validatePromotionData, validateCouponData, validateCouponValidation } = require('../middleware/validators');

// ===== 促销活动相关路由 =====

/**
 * 创建促销活动
 * 需要管理员权限
 */
router.post('/promotions', authenticateUser, authorizeAdmin, validatePromotionData, async (req, res) => {
    try {
        const result = await promotionService.createPromotion(req.body);
        
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('创建促销活动失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 更新促销活动
 * 需要管理员权限
 */
router.put('/promotions/:id', authenticateUser, authorizeAdmin, async (req, res) => {
    try {
        const promotionId = req.params.id;
        const result = await promotionService.updatePromotion(promotionId, req.body);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('更新促销活动失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 获取所有促销活动
 * 普通用户只能获取活跃的促销活动
 * 管理员可以获取所有促销活动
 */
router.get('/promotions', authenticateUser, async (req, res) => {
    try {
        const isAdmin = req.user && req.user.role === 'admin';
        const activeOnly = !isAdmin || req.query.activeOnly === 'true';
        
        const result = await promotionService.getAllPromotions(activeOnly);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('获取促销活动失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 获取促销活动详情
 */
router.get('/promotions/:id', authenticateUser, async (req, res) => {
    try {
        const promotionId = req.params.id;
        const result = await promotionService.getPromotionById(promotionId);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('获取促销活动详情失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 删除促销活动
 * 需要管理员权限
 */
router.delete('/promotions/:id', authenticateUser, authorizeAdmin, async (req, res) => {
    try {
        const promotionId = req.params.id;
        const result = await promotionService.deletePromotion(promotionId);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('删除促销活动失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

// ===== 优惠券相关路由 =====

/**
 * 创建优惠券
 * 需要管理员权限
 */
router.post('/coupons', authenticateUser, authorizeAdmin, validateCouponData, async (req, res) => {
    try {
        const result = await promotionService.createCoupon(req.body);
        
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('创建优惠券失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 批量生成优惠券
 * 需要管理员权限
 */
router.post('/coupons/batch', authenticateUser, authorizeAdmin, async (req, res) => {
    try {
        const result = await promotionService.generateCouponsBatch(req.body);
        
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('批量生成优惠券失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 更新优惠券
 * 需要管理员权限
 */
router.put('/coupons/:id', authenticateUser, authorizeAdmin, async (req, res) => {
    try {
        const couponId = req.params.id;
        const result = await promotionService.updateCoupon(couponId, req.body);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('更新优惠券失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 获取所有优惠券
 * 需要管理员权限
 */
router.get('/coupons', authenticateUser, authorizeAdmin, async (req, res) => {
    try {
        const activeOnly = req.query.activeOnly === 'true';
        const result = await promotionService.getAllCoupons(activeOnly);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('获取优惠券失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 获取优惠券详情
 * 需要管理员权限
 */
router.get('/coupons/:id', authenticateUser, authorizeAdmin, async (req, res) => {
    try {
        const couponId = req.params.id;
        const result = await promotionService.getCouponById(couponId);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('获取优惠券详情失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 删除优惠券
 * 需要管理员权限
 */
router.delete('/coupons/:id', authenticateUser, authorizeAdmin, async (req, res) => {
    try {
        const couponId = req.params.id;
        const result = await promotionService.deleteCoupon(couponId);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('删除优惠券失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 验证优惠券
 */
router.post('/coupons/validate', authenticateUser, validateCouponValidation, async (req, res) => {
    try {
        const { code, amount, membershipId } = req.body;
        const userId = req.user.id;
        
        const result = await promotionService.validateCoupon(code, userId, amount, membershipId);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('验证优惠券失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 应用优惠券
 */
router.post('/coupons/apply', authenticateUser, async (req, res) => {
    try {
        const { couponId, orderId, amount, discountAmount } = req.body;
        const userId = req.user.id;
        
        if (!couponId || !orderId || !amount || discountAmount === undefined) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }
        
        const result = await promotionService.applyCoupon(couponId, userId, orderId, amount, discountAmount);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('应用优惠券失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 获取用户优惠券使用记录
 */
router.get('/coupons/usage/me', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await promotionService.getUserCouponUsage(userId);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('获取用户优惠券使用记录失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

/**
 * 获取用户优惠券使用历史
 * GET /api/promotion/coupons/usage/history
 */
router.get('/coupons/usage/history', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取用户优惠券使用历史
        const result = await promotionService.getUserCouponUsageHistory(userId);
        
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }
        
        res.json({ success: true, data: result.data });
    } catch (error) {
        console.error('获取用户优惠券使用历史失败:', error);
        res.status(500).json({ success: false, error: '获取用户优惠券使用历史失败' });
    }
});

/**
 * 获取所有优惠券使用记录（管理员专用）
 * GET /api/promotion/coupons/usage/all
 */
router.get('/coupons/usage/all', authenticateUser, async (req, res) => {
    try {
        // 验证用户是否为管理员
        if (!req.user.isAdmin) {
            return res.status(403).json({ 
                success: false, 
                error: '权限不足，只有管理员可以访问此接口' 
            });
        }
        
        // 获取所有优惠券使用记录
        const usageRecords = await promotionService.getAllCouponUsageRecords();
        
        // 获取所有优惠券信息
        const coupons = await promotionService.getAllCoupons();
        
        // 合并数据，添加优惠券代码等信息
        const enrichedRecords = usageRecords.map(record => {
            const coupon = coupons.find(c => c.id === record.couponId);
            return {
                ...record,
                couponCode: coupon ? coupon.code : '未知优惠券'
            };
        });
        
        res.json({ success: true, data: enrichedRecords });
    } catch (error) {
        console.error('获取所有优惠券使用记录失败:', error);
        res.status(500).json({ success: false, error: '获取所有优惠券使用记录失败' });
    }
});

module.exports = router;
