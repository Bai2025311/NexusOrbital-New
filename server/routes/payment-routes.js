/**
 * NexusOrbital 支付API路由
 */
const express = require('express');
const router = express.Router();
const paymentService = require('../payment-integrations/payment-service');
const { authenticateUser } = require('../middleware/auth');
const { validatePaymentRequest } = require('../middleware/validators');
const { 
  paymentRiskControl, 
  dataMasking, 
  verifySignature 
} = require('../middleware/security-middleware');

/**
 * 创建支付订单
 * POST /api/payment/create
 */
router.post('/create', 
  authenticateUser, 
  validatePaymentRequest, 
  verifySignature,
  paymentRiskControl,
  dataMasking,
  async (req, res) => {
  try {
    const { 
      paymentMethod, 
      amount, 
      membershipId, 
      description, 
      couponId, 
      discountAmount, 
      finalAmount 
    } = req.body;
    const userId = req.user.id;
    
    // 创建支付订单
    const result = await paymentService.createPaymentOrder({
      paymentMethod,
      amount,
      membershipId,
      description,
      userId,
      // 添加优惠券相关信息
      couponId,
      discountAmount,
      finalAmount,
      metadata: {
        userEmail: req.user.email,
        userName: req.user.name
      }
    });
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('创建支付订单失败:', error);
    res.status(500).json({ success: false, error: '创建支付订单失败' });
  }
});

/**
 * 查询支付订单状态
 * GET /api/payment/status/:orderId
 */
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.query;
    
    // 查询支付订单状态
    const result = await paymentService.queryPaymentOrderStatus(orderId, paymentMethod);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('查询支付订单状态失败:', error);
    res.status(500).json({ error: '查询支付订单状态失败' });
  }
});

/**
 * 支付宝支付回调
 * POST /api/payment/callback/alipay
 */
router.post('/callback/alipay', async (req, res) => {
  try {
    // 处理支付宝回调
    const result = await paymentService.handlePaymentCallback('alipay', req.body);
    
    if (!result.success) {
      return res.status(400).send('fail');
    }
    
    res.send('success');
  } catch (error) {
    console.error('处理支付宝回调失败:', error);
    res.status(500).send('fail');
  }
});

/**
 * 微信支付回调
 * POST /api/payment/callback/wechat
 */
router.post('/callback/wechat', async (req, res) => {
  try {
    // 处理微信支付回调
    const result = await paymentService.handlePaymentCallback('wechat', req.body, req.headers);
    
    if (!result.success) {
      return res.status(400).json({
        code: 'FAIL',
        message: result.error
      });
    }
    
    res.status(200).json({
      code: 'SUCCESS'
    });
  } catch (error) {
    console.error('处理微信支付回调失败:', error);
    res.status(500).json({
      code: 'FAIL',
      message: '处理回调失败'
    });
  }
});

/**
 * Stripe支付回调
 * POST /api/payment/callback/stripe
 */
router.post('/callback/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    // 获取Stripe签名
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({ error: '缺少Stripe签名' });
    }
    
    // 处理Stripe支付回调
    const result = await paymentService.handlePaymentCallback('stripe', req.body, req.headers);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    // Stripe要求返回200状态码
    res.status(200).send();
  } catch (error) {
    console.error('处理Stripe支付回调失败:', error);
    res.status(500).json({ error: '处理回调失败' });
  }
});

/**
 * PayPal支付回调
 * POST /api/payment/callback/paypal
 */
router.post('/callback/paypal', async (req, res) => {
  try {
    // 处理PayPal回调
    const result = await paymentService.handlePaymentCallback('paypal', req.body, req.headers);
    
    if (!result.success) {
      return res.status(400).send('fail');
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('处理PayPal回调失败:', error);
    res.status(500).send('fail');
  }
});

/**
 * PayPal支付执行（确认支付）
 * GET /api/payment/paypal/execute
 */
router.get('/paypal/execute', async (req, res) => {
  try {
    const { paymentId, PayerID } = req.query;
    
    if (!paymentId || !PayerID) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 执行PayPal支付
    const result = await paymentService.executePayment(paymentId, PayerID);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    // 重定向到成功页面
    res.redirect(`/payment/success?order_id=${result.data.orderId}`);
  } catch (error) {
    console.error('执行PayPal支付失败:', error);
    res.status(500).json({ error: '执行PayPal支付失败' });
  }
});

/**
 * 获取交易记录
 * GET /api/payment/transactions
 */
router.get('/transactions', authenticateUser, async (req, res) => {
  try {
    const { status, paymentMethod, page, limit, timeFilter } = req.query;
    const userId = req.user.id;
    
    // 获取交易记录
    const result = await paymentService.getTransactions({
      userId,
      status,
      paymentMethod,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      timeFilter
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('获取交易记录失败:', error);
    res.status(500).json({ error: '获取交易记录失败' });
  }
});

/**
 * 获取交易详情
 * GET /api/payment/transactions/:transactionId
 */
router.get('/transactions/:transactionId', authenticateUser, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // 获取交易详情
    const result = await paymentService.getTransactionDetail(transactionId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    // 检查是否是用户自己的交易
    if (result.data.userId !== req.user.id) {
      return res.status(403).json({ error: '没有权限查看此交易' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('获取交易详情失败:', error);
    res.status(500).json({ error: '获取交易详情失败' });
  }
});

/**
 * 下载交易收据
 * GET /api/payment/receipt/:transactionId
 */
router.get('/receipt/:transactionId', authenticateUser, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // 获取交易详情
    const transactionResult = await paymentService.getTransactionDetail(transactionId);
    
    if (!transactionResult.success) {
      return res.status(400).json({ error: transactionResult.error });
    }
    
    // 检查是否是用户自己的交易
    if (transactionResult.data.userId !== req.user.id) {
      return res.status(403).json({ error: '没有权限下载此收据' });
    }
    
    // 下载收据
    const result = await paymentService.downloadReceipt(transactionId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('下载交易收据失败:', error);
    res.status(500).json({ error: '下载交易收据失败' });
  }
});

/**
 * 退款操作
 * POST /api/payment/refund
 */
router.post('/refund', authenticateUser, async (req, res) => {
  try {
    const { transactionId, amount, reason } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 获取交易详情
    const transactionResult = await paymentService.getTransactionDetail(transactionId);
    
    if (!transactionResult.success) {
      return res.status(400).json({ error: transactionResult.error });
    }
    
    // 检查是否是管理员
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: '没有权限执行退款操作' });
    }
    
    // 执行退款
    const result = await paymentService.refund(transactionId, amount, reason);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('退款失败:', error);
    res.status(500).json({ error: '退款失败' });
  }
});

module.exports = router;
