/**
 * NexusOrbital 退款API路由
 */
const express = require('express');
const router = express.Router();
const refundService = require('../services/refund-service');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { validateRefundRequest } = require('../middleware/validators');

/**
 * 创建退款申请
 * POST /api/refund/request
 */
router.post('/request', authenticateUser, validateRefundRequest, async (req, res) => {
  try {
    const { orderId, transactionId, amount, reason, contactInfo } = req.body;
    const userId = req.user.id;
    
    // 创建退款申请
    const result = await refundService.createRefundRequest({
      userId,
      orderId,
      transactionId,
      amount,
      reason,
      contactInfo
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('创建退款申请失败:', error);
    res.status(500).json({ error: '创建退款申请失败' });
  }
});

/**
 * 获取用户退款申请列表
 * GET /api/refund/user
 */
router.get('/user', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, startDate, endDate } = req.query;
    
    // 获取用户退款申请列表
    const result = await refundService.getUserRefundRequests(userId, {
      status,
      startDate,
      endDate
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('获取用户退款申请列表失败:', error);
    res.status(500).json({ error: '获取用户退款申请列表失败' });
  }
});

/**
 * 获取退款申请详情
 * GET /api/refund/:id
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 获取退款申请详情
    const result = await refundService.getRefundRequestDetail(id);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    // 验证用户权限
    if (result.data.refundRequest.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: '无权查看此退款申请' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('获取退款申请详情失败:', error);
    res.status(500).json({ error: '获取退款申请详情失败' });
  }
});

/**
 * 获取所有退款申请（管理员用）
 * GET /api/refund/admin/all
 */
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const { status, userId, startDate, endDate, page, limit } = req.query;
    
    // 获取所有退款申请
    const result = await refundService.getAllRefundRequests({
      status,
      userId,
      startDate,
      endDate,
      page: page || 1,
      limit: limit || 10
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('获取所有退款申请失败:', error);
    res.status(500).json({ error: '获取所有退款申请失败' });
  }
});

/**
 * 审核退款申请（管理员用）
 * POST /api/refund/admin/review/:id
 */
router.post('/admin/review/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    const adminId = req.user.id;
    
    // 验证操作
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: '无效的操作，必须是 approve 或 reject' });
    }
    
    // 审核退款申请
    const result = await refundService.reviewRefundRequest(id, action, comment, adminId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('审核退款申请失败:', error);
    res.status(500).json({ error: '审核退款申请失败' });
  }
});

module.exports = router;
