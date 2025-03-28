/**
 * Stripe支付集成
 */
const stripe = require('stripe');
const { stripeConfig } = require('./config');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// 添加调试信息
console.log('Stripe配置信息:', {
  secretKeyLength: stripeConfig.secretKey ? stripeConfig.secretKey.length : 0,
  secretKeyPrefix: stripeConfig.secretKey ? stripeConfig.secretKey.substring(0, 7) : 'undefined',
  publishableKeyPrefix: stripeConfig.publishableKey ? stripeConfig.publishableKey.substring(0, 7) : 'undefined'
});

// 创建Stripe实例
let stripeClient;
try {
  stripeClient = stripe(stripeConfig.secretKey);
  console.log('Stripe客户端创建成功');
} catch (error) {
  console.error('Stripe客户端创建失败:', error.message);
}

/**
 * 创建Stripe支付订单
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Object>} - 支付订单结果
 */
async function createPaymentOrder(orderData) {
  try {
    console.log('创建Stripe支付订单，参数:', JSON.stringify(orderData, null, 2));
    
    if (!stripeClient) {
      throw new Error('Stripe客户端未初始化');
    }
    
    const { outTradeNo, totalAmount, subject, body, metadata } = orderData;
    
    // 创建支付意向
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe金额单位为分
      currency: 'usd',
      description: body || subject,
      metadata: {
        order_id: outTradeNo,
        membership_id: metadata?.membershipId || '',
        ...metadata
      }
    });
    
    // 创建Checkout会话
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: subject,
              description: body || '太空技术协作平台会员订阅'
            },
            unit_amount: Math.round(totalAmount * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
      client_reference_id: outTradeNo,
      payment_intent_data: {
        metadata: {
          order_id: outTradeNo,
          membership_id: metadata?.membershipId || '',
          ...metadata
        }
      }
    });
    
    // 记录日志
    logPaymentRequest('stripe', outTradeNo, totalAmount, { paymentIntent, session });
    
    return {
      success: true,
      data: {
        orderId: outTradeNo,
        paymentIntentId: paymentIntent.id,
        sessionId: session.id,
        paymentUrl: session.url,
        paymentMethod: 'stripe',
        amount: totalAmount,
        status: convertStripeStatus(paymentIntent.status),
        expireTime: moment().add(30, 'minutes').toISOString(),
        clientSecret: paymentIntent.client_secret
      }
    };
  } catch (error) {
    console.error('Stripe支付订单创建失败:', error);
    return {
      success: false,
      error: error.message || 'Stripe支付订单创建失败'
    };
  }
}

/**
 * 查询Stripe订单状态
 * @param {string} paymentIntentId - 支付意向ID
 * @returns {Promise<Object>} - 订单状态查询结果
 */
async function queryOrderStatus(paymentIntentId) {
  try {
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    
    // 获取订单号
    const outTradeNo = paymentIntent.metadata.order_id;
    
    return {
      success: true,
      data: {
        orderId: outTradeNo,
        paymentIntentId: paymentIntent.id,
        status: convertStripeStatus(paymentIntent.status),
        payTime: paymentIntent.created ? moment.unix(paymentIntent.created).toISOString() : null,
        amount: paymentIntent.amount / 100,
        membershipId: paymentIntent.metadata.membership_id
      }
    };
  } catch (error) {
    console.error('Stripe订单状态查询失败:', error);
    return {
      success: false,
      error: error.message || 'Stripe订单状态查询失败'
    };
  }
}

/**
 * 处理Stripe支付回调通知（Webhook）
 * @param {Object} payload - 回调通知数据
 * @param {string} signature - 请求签名
 * @returns {Promise<Object>} - 处理结果
 */
async function handlePaymentCallback(payload, signature) {
  try {
    // 验证Webhook签名
    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      stripeConfig.webhookSecret
    );
    
    // 处理不同类型的事件
    switch (event.type) {
      case 'payment_intent.succeeded':
        // 支付成功
        const paymentIntent = event.data.object;
        const outTradeNo = paymentIntent.metadata.order_id;
        const membershipId = paymentIntent.metadata.membership_id;
        
        // 记录回调日志
        logPaymentCallback('stripe', outTradeNo, event);
        
        return {
          success: true,
          data: {
            orderId: outTradeNo,
            paymentIntentId: paymentIntent.id,
            status: 'paid',
            payTime: moment.unix(paymentIntent.created).toISOString(),
            amount: paymentIntent.amount / 100,
            membershipId: membershipId
          }
        };
      
      case 'payment_intent.payment_failed':
        // 支付失败
        const failedPaymentIntent = event.data.object;
        const failedOrderId = failedPaymentIntent.metadata.order_id;
        
        // 记录回调日志
        logPaymentCallback('stripe', failedOrderId, event);
        
        return {
          success: true,
          data: {
            orderId: failedOrderId,
            paymentIntentId: failedPaymentIntent.id,
            status: 'failed',
            error: failedPaymentIntent.last_payment_error?.message || '支付失败'
          }
        };
      
      case 'charge.refunded':
        // 退款成功
        const charge = event.data.object;
        const refundedOrderId = charge.metadata.order_id;
        
        // 记录回调日志
        logPaymentCallback('stripe', refundedOrderId, event);
        
        return {
          success: true,
          data: {
            orderId: refundedOrderId,
            chargeId: charge.id,
            status: 'refunded',
            refundAmount: charge.amount_refunded / 100,
            refundTime: moment.unix(charge.created).toISOString()
          }
        };
      
      default:
        // 其他事件类型
        return {
          success: true,
          data: {
            eventType: event.type,
            eventId: event.id
          }
        };
    }
  } catch (error) {
    console.error('处理Stripe回调失败:', error);
    return {
      success: false,
      error: error.message || '处理Stripe回调失败'
    };
  }
}

/**
 * 退款操作
 * @param {string} paymentIntentId - 支付意向ID
 * @param {number} refundAmount - 退款金额
 * @param {string} refundReason - 退款原因
 * @returns {Promise<Object>} - 退款结果
 */
async function refund(paymentIntentId, refundAmount, refundReason) {
  try {
    // 获取支付意向
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    
    // 获取订单号
    const outTradeNo = paymentIntent.metadata.order_id;
    
    // 获取支付意向的支付ID
    const charges = await stripeClient.charges.list({
      payment_intent: paymentIntentId
    });
    
    if (charges.data.length === 0) {
      throw new Error('未找到相关支付记录');
    }
    
    const chargeId = charges.data[0].id;
    
    // 创建退款
    const refund = await stripeClient.refunds.create({
      charge: chargeId,
      amount: refundAmount ? Math.round(refundAmount * 100) : undefined, // 如果不指定金额，则全额退款
      reason: refundReason ? 'requested_by_customer' : undefined,
      metadata: {
        order_id: outTradeNo,
        reason: refundReason || '客户申请退款'
      }
    });
    
    return {
      success: true,
      data: {
        orderId: outTradeNo,
        refundId: refund.id,
        status: convertStripeRefundStatus(refund.status),
        refundAmount: refund.amount / 100,
        createTime: moment.unix(refund.created).toISOString()
      }
    };
  } catch (error) {
    console.error('Stripe退款失败:', error);
    return {
      success: false,
      error: error.message || 'Stripe退款失败'
    };
  }
}

/**
 * 关闭Stripe支付订单
 * @param {string} paymentIntentId - 支付意向ID
 * @returns {Promise<Object>} - 关闭结果
 */
async function closeOrder(paymentIntentId) {
  try {
    if (!stripeClient) {
      throw new Error('Stripe客户端未初始化');
    }
    
    // 获取支付意向
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    
    // 只有未完成的支付才能取消
    if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'canceled') {
      // 取消支付意向
      const canceledIntent = await stripeClient.paymentIntents.cancel(paymentIntentId);
      
      // 获取订单号
      const outTradeNo = canceledIntent.metadata.order_id;
      
      return {
        success: true,
        data: {
          orderId: outTradeNo,
          paymentIntentId: canceledIntent.id,
          status: 'closed',
          closeTime: moment().toISOString()
        }
      };
    } else if (paymentIntent.status === 'succeeded') {
      return {
        success: false,
        error: '已支付成功的订单不能关闭'
      };
    } else {
      return {
        success: true,
        data: {
          orderId: paymentIntent.metadata.order_id,
          paymentIntentId: paymentIntent.id,
          status: 'closed',
          closeTime: moment().toISOString()
        }
      };
    }
  } catch (error) {
    console.error('关闭Stripe支付订单失败:', error);
    return {
      success: false,
      error: error.message || '关闭Stripe支付订单失败'
    };
  }
}

/**
 * 创建Stripe客户
 * @param {Object} customerData - 客户数据
 * @returns {Promise<Object>} - 创建结果
 */
async function createCustomer(customerData) {
  try {
    const { email, name, phone, metadata } = customerData;
    
    const customer = await stripeClient.customers.create({
      email,
      name,
      phone,
      metadata
    });
    
    return {
      success: true,
      data: {
        customerId: customer.id,
        email: customer.email,
        name: customer.name
      }
    };
  } catch (error) {
    console.error('创建Stripe客户失败:', error);
    return {
      success: false,
      error: error.message || '创建Stripe客户失败'
    };
  }
}

/**
 * 创建订阅
 * @param {Object} subscriptionData - 订阅数据
 * @returns {Promise<Object>} - 创建结果
 */
async function createSubscription(subscriptionData) {
  try {
    const { customerId, priceId, metadata } = subscriptionData;
    
    const subscription = await stripeClient.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId
        }
      ],
      metadata
    });
    
    return {
      success: true,
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        currentPeriodEnd: moment.unix(subscription.current_period_end).toISOString()
      }
    };
  } catch (error) {
    console.error('创建Stripe订阅失败:', error);
    return {
      success: false,
      error: error.message || '创建Stripe订阅失败'
    };
  }
}

/**
 * 转换Stripe支付状态为统一状态
 * @param {string} stripeStatus - Stripe支付状态
 * @returns {string} - 统一状态
 */
function convertStripeStatus(stripeStatus) {
  const statusMap = {
    'requires_payment_method': 'pending',
    'requires_confirmation': 'pending',
    'requires_action': 'pending',
    'processing': 'processing',
    'requires_capture': 'authorized',
    'canceled': 'cancelled',
    'succeeded': 'paid'
  };
  
  return statusMap[stripeStatus] || 'unknown';
}

/**
 * 转换Stripe退款状态为统一状态
 * @param {string} stripeRefundStatus - Stripe退款状态
 * @returns {string} - 统一状态
 */
function convertStripeRefundStatus(stripeRefundStatus) {
  switch (stripeRefundStatus) {
    case 'succeeded':
      return 'success';
    case 'pending':
      return 'processing';
    case 'failed':
      return 'failed';
    default:
      return 'unknown';
  }
}

/**
 * 记录支付请求日志
 * @param {string} paymentMethod - 支付方式
 * @param {string} orderId - 订单ID
 * @param {number} amount - 金额
 * @param {Object} requestData - 请求数据
 */
function logPaymentRequest(paymentMethod, orderId, amount, requestData) {
  const logDir = path.join(__dirname, '../logs');
  
  // 确保日志目录存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `payment_requests.log`);
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logData = {
    timestamp,
    paymentMethod,
    orderId,
    amount,
    requestData: {
      paymentIntentId: requestData.paymentIntent?.id,
      sessionId: requestData.session?.id,
      clientSecret: requestData.paymentIntent?.client_secret
    }
  };
  
  fs.appendFileSync(logFile, JSON.stringify(logData) + '\n');
}

/**
 * 记录支付回调日志
 * @param {string} paymentMethod - 支付方式
 * @param {string} orderId - 订单ID
 * @param {Object} callbackData - 回调数据
 */
function logPaymentCallback(paymentMethod, orderId, callbackData) {
  const logDir = path.join(__dirname, '../logs');
  
  // 确保日志目录存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `payment_callbacks.log`);
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logData = {
    timestamp,
    paymentMethod,
    orderId,
    eventType: callbackData.type,
    eventId: callbackData.id
  };
  
  fs.appendFileSync(logFile, JSON.stringify(logData) + '\n');
}

module.exports = {
  createPaymentOrder,
  queryOrderStatus,
  handlePaymentCallback,
  refund,
  closeOrder,
  createCustomer,
  createSubscription
};
