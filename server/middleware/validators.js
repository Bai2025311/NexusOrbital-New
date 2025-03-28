/**
 * NexusOrbital 请求验证中间件
 */

/**
 * 验证支付请求
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function validatePaymentRequest(req, res, next) {
  const { paymentMethod, amount, membershipId } = req.body;
  
  // 验证支付方式
  const validPaymentMethods = ['alipay', 'wechat', 'paypal', 'stripe'];
  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ error: '无效的支付方式' });
  }
  
  // 验证金额
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: '无效的支付金额' });
  }
  
  // 验证会员ID
  const validMembershipIds = ['basic', 'professional', 'enterprise', 'founder'];
  if (!membershipId || !validMembershipIds.includes(membershipId)) {
    return res.status(400).json({ error: '无效的会员类型' });
  }
  
  next();
}

/**
 * 验证用户注册请求
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function validateRegistrationRequest(req, res, next) {
  const { email, password, name } = req.body;
  
  // 验证邮箱
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: '无效的邮箱地址' });
  }
  
  // 验证密码
  if (!password || password.length < 8) {
    return res.status(400).json({ error: '密码长度必须至少为8个字符' });
  }
  
  // 验证姓名
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: '姓名不能为空' });
  }
  
  next();
}

/**
 * 验证登录请求
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function validateLoginRequest(req, res, next) {
  const { email, password } = req.body;
  
  // 验证邮箱
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: '无效的邮箱地址' });
  }
  
  // 验证密码
  if (!password) {
    return res.status(400).json({ error: '密码不能为空' });
  }
  
  next();
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} - 是否有效
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证退款请求
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function validateRefundRequest(req, res, next) {
  const { orderId, transactionId, amount, reason } = req.body;
  
  // 验证订单ID
  if (!orderId) {
    return res.status(400).json({ error: '订单ID不能为空' });
  }
  
  // 验证交易ID
  if (!transactionId) {
    return res.status(400).json({ error: '交易ID不能为空' });
  }
  
  // 验证金额
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: '无效的退款金额' });
  }
  
  // 验证退款原因
  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: '退款原因不能为空' });
  }
  
  next();
}

/**
 * 验证自动续费请求
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function validateAutoRenewalRequest(req, res, next) {
  const { membershipId, paymentMethod, paymentToken } = req.body;
  
  // 验证会员ID
  const validMembershipIds = ['basic', 'professional', 'enterprise', 'founder'];
  if (!membershipId || !validMembershipIds.includes(membershipId)) {
    return res.status(400).json({ 
      success: false,
      error: '无效的会员类型' 
    });
  }
  
  // 验证支付方式
  const validPaymentMethods = ['alipay', 'wechat', 'paypal', 'stripe'];
  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ 
      success: false,
      error: '无效的支付方式' 
    });
  }
  
  // 支付令牌对某些支付方式是必需的
  if ((paymentMethod === 'stripe' || paymentMethod === 'paypal') && !paymentToken) {
    return res.status(400).json({ 
      success: false,
      error: '支付令牌不能为空' 
    });
  }
  
  next();
}

/**
 * 验证促销活动数据
 */
function validatePromotionData(req, res, next) {
    const { name, type, value } = req.body;

    // 验证必要字段
    if (!name) {
        return res.status(400).json({
            success: false,
            error: '促销活动名称不能为空'
        });
    }

    if (!type) {
        return res.status(400).json({
            success: false,
            error: '促销活动类型不能为空'
        });
    }

    // 验证促销类型
    const validTypes = ['percentage', 'fixed', 'free_upgrade'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({
            success: false,
            error: '无效的促销类型'
        });
    }

    // 验证促销值
    if (value === undefined || value === null) {
        return res.status(400).json({
            success: false,
            error: '促销值不能为空'
        });
    }

    if (type === 'percentage' && (value <= 0 || value > 100)) {
        return res.status(400).json({
            success: false,
            error: '百分比折扣必须在0-100之间'
        });
    } else if (type === 'fixed' && value <= 0) {
        return res.status(400).json({
            success: false,
            error: '固定金额折扣必须大于0'
        });
    }

    next();
}

/**
 * 验证优惠券数据
 */
function validateCouponData(req, res, next) {
    const { code, promotionId } = req.body;

    // 验证必要字段
    if (!code) {
        return res.status(400).json({
            success: false,
            error: '优惠码不能为空'
        });
    }

    if (!promotionId) {
        return res.status(400).json({
            success: false,
            error: '关联的促销活动ID不能为空'
        });
    }

    next();
}

/**
 * 验证优惠券验证请求
 */
function validateCouponValidation(req, res, next) {
    const { code, amount } = req.body;

    // 验证必要字段
    if (!code) {
        return res.status(400).json({
            success: false,
            error: '优惠码不能为空'
        });
    }

    if (amount === undefined || amount === null) {
        return res.status(400).json({
            success: false,
            error: '订单金额不能为空'
        });
    }

    if (isNaN(amount) || amount < 0) {
        return res.status(400).json({
            success: false,
            error: '订单金额必须是非负数'
        });
    }

    next();
}

module.exports = {
  validatePaymentRequest,
  validateRegistrationRequest,
  validateLoginRequest,
  validateRefundRequest,
  validateAutoRenewalRequest,
  validatePromotionData,
  validateCouponData,
  validateCouponValidation
};
