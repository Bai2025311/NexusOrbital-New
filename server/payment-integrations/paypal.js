/**
 * PayPal支付集成
 */
const paypal = require('paypal-rest-sdk');
const { paypalConfig } = require('./config');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// 配置PayPal SDK
paypal.configure({
  mode: paypalConfig.mode, // sandbox或live
  client_id: paypalConfig.clientId,
  client_secret: paypalConfig.clientSecret
});

/**
 * 创建PayPal支付订单
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Object>} - 支付订单结果
 */
async function createPaymentOrder(orderData) {
  return new Promise((resolve, reject) => {
    try {
      const { outTradeNo, totalAmount, subject, body, passbackParams } = orderData;
      
      // 创建支付JSON
      const paymentJson = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        redirect_urls: {
          return_url: `${paypalConfig.returnUrl}?order_id=${outTradeNo}`,
          cancel_url: `${paypalConfig.cancelUrl}?order_id=${outTradeNo}`
        },
        transactions: [{
          item_list: {
            items: [{
              name: subject,
              sku: outTradeNo,
              price: totalAmount,
              currency: 'USD',
              quantity: 1
            }]
          },
          amount: {
            currency: 'USD',
            total: totalAmount
          },
          description: body || subject,
          custom: passbackParams, // 用于存储会员ID等信息
          invoice_number: outTradeNo
        }]
      };
      
      // 调用PayPal创建支付接口
      paypal.payment.create(paymentJson, (error, payment) => {
        if (error) {
          console.error('PayPal支付创建失败:', error);
          return reject(error);
        }
        
        // 记录日志
        logPaymentRequest('paypal', outTradeNo, totalAmount, payment);
        
        // 获取支付链接
        let paymentUrl = '';
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === 'approval_url') {
            paymentUrl = payment.links[i].href;
            break;
          }
        }
        
        if (!paymentUrl) {
          return reject(new Error('未找到PayPal支付链接'));
        }
        
        resolve({
          success: true,
          data: {
            orderId: outTradeNo,
            paymentId: payment.id,
            paymentUrl: paymentUrl,
            paymentMethod: 'paypal',
            amount: totalAmount,
            status: 'created',
            expireTime: moment().add(30, 'minutes').toISOString()
          }
        });
      });
    } catch (error) {
      console.error('创建PayPal支付订单失败:', error);
      reject(error);
    }
  });
}

/**
 * 执行PayPal支付（确认支付）
 * @param {string} paymentId - PayPal支付ID
 * @param {string} payerId - 支付者ID
 * @returns {Promise<Object>} - 支付执行结果
 */
async function executePayment(paymentId, payerId) {
  return new Promise((resolve, reject) => {
    try {
      const executePaymentJson = {
        payer_id: payerId
      };
      
      // 执行支付
      paypal.payment.execute(paymentId, executePaymentJson, (error, payment) => {
        if (error) {
          console.error('PayPal支付执行失败:', error);
          return reject(error);
        }
        
        // 获取订单号
        const outTradeNo = payment.transactions[0].invoice_number;
        
        // 获取会员ID
        const membershipId = payment.transactions[0].custom;
        
        // 记录日志
        logPaymentCallback('paypal', outTradeNo, payment);
        
        resolve({
          success: true,
          data: {
            orderId: outTradeNo,
            paymentId: payment.id,
            status: convertPayPalStatus(payment.state),
            payTime: moment().toISOString(),
            amount: payment.transactions[0].amount.total,
            membershipId: membershipId
          }
        });
      });
    } catch (error) {
      console.error('执行PayPal支付失败:', error);
      reject(error);
    }
  });
}

/**
 * 查询PayPal订单状态
 * @param {string} paymentId - PayPal支付ID
 * @returns {Promise<Object>} - 订单状态查询结果
 */
async function queryOrderStatus(paymentId) {
  return new Promise((resolve, reject) => {
    try {
      // 查询支付详情
      paypal.payment.get(paymentId, (error, payment) => {
        if (error) {
          console.error('PayPal订单状态查询失败:', error);
          return reject(error);
        }
        
        // 获取订单号
        const outTradeNo = payment.transactions[0].invoice_number;
        
        resolve({
          success: true,
          data: {
            orderId: outTradeNo,
            paymentId: payment.id,
            status: convertPayPalStatus(payment.state),
            payTime: payment.update_time,
            amount: payment.transactions[0].amount.total
          }
        });
      });
    } catch (error) {
      console.error('查询PayPal订单状态失败:', error);
      reject(error);
    }
  });
}

/**
 * 处理PayPal支付回调通知（Webhook）
 * @param {Object} notifyData - 回调通知数据
 * @param {string} webhookId - Webhook ID
 * @param {Object} headers - 请求头
 * @returns {Promise<Object>} - 处理结果
 */
async function handlePaymentCallback(notifyData, webhookId, headers) {
  return new Promise((resolve, reject) => {
    try {
      // 验证Webhook签名
      const webhookEvent = notifyData;
      
      // 验证Webhook事件
      paypal.notification.webhookEvent.verify(webhookEvent, headers, webhookId, (error, response) => {
        if (error) {
          console.error('PayPal Webhook验证失败:', error);
          return reject(new Error('Webhook验证失败'));
        }
        
        // 处理不同类型的Webhook事件
        const eventType = webhookEvent.event_type;
        
        if (eventType === 'PAYMENT.SALE.COMPLETED') {
          // 支付完成事件
          const paymentId = webhookEvent.resource.parent_payment;
          
          // 查询支付详情
          paypal.payment.get(paymentId, (error, payment) => {
            if (error) {
              console.error('PayPal支付详情查询失败:', error);
              return reject(error);
            }
            
            // 获取订单号
            const outTradeNo = payment.transactions[0].invoice_number;
            
            // 获取会员ID
            const membershipId = payment.transactions[0].custom;
            
            // 记录回调日志
            logPaymentCallback('paypal', outTradeNo, webhookEvent);
            
            resolve({
              success: true,
              data: {
                orderId: outTradeNo,
                paymentId: paymentId,
                status: 'paid',
                payTime: webhookEvent.create_time,
                amount: payment.transactions[0].amount.total,
                membershipId: membershipId
              }
            });
          });
        } else if (eventType === 'PAYMENT.SALE.REFUNDED') {
          // 退款事件
          const refundId = webhookEvent.resource.id;
          const paymentId = webhookEvent.resource.parent_payment;
          
          // 查询支付详情
          paypal.payment.get(paymentId, (error, payment) => {
            if (error) {
              console.error('PayPal支付详情查询失败:', error);
              return reject(error);
            }
            
            // 获取订单号
            const outTradeNo = payment.transactions[0].invoice_number;
            
            // 记录回调日志
            logPaymentCallback('paypal', outTradeNo, webhookEvent);
            
            resolve({
              success: true,
              data: {
                orderId: outTradeNo,
                paymentId: paymentId,
                refundId: refundId,
                status: 'refunded',
                refundTime: webhookEvent.create_time,
                amount: webhookEvent.resource.amount.total
              }
            });
          });
        } else {
          // 其他事件类型
          resolve({
            success: true,
            data: {
              eventType: eventType,
              eventId: webhookEvent.id,
              createTime: webhookEvent.create_time
            }
          });
        }
      });
    } catch (error) {
      console.error('处理PayPal回调失败:', error);
      reject(error);
    }
  });
}

/**
 * 退款操作
 * @param {string} saleId - 交易ID
 * @param {string} refundAmount - 退款金额
 * @param {string} refundReason - 退款原因
 * @returns {Promise<Object>} - 退款结果
 */
async function refund(saleId, refundAmount, refundReason) {
  return new Promise((resolve, reject) => {
    try {
      // 构建退款数据
      const refundData = {
        amount: {
          currency: 'USD',
          total: refundAmount
        },
        description: refundReason || '退款'
      };
      
      // 执行退款
      paypal.sale.refund(saleId, refundData, (error, refund) => {
        if (error) {
          console.error('PayPal退款失败:', error);
          return reject(error);
        }
        
        resolve({
          success: true,
          data: {
            refundId: refund.id,
            status: convertPayPalStatus(refund.state),
            refundAmount: refund.amount.total,
            createTime: refund.create_time
          }
        });
      });
    } catch (error) {
      console.error('PayPal退款失败:', error);
      reject(error);
    }
  });
}

/**
 * 转换PayPal交易状态为统一状态
 * @param {string} paypalStatus - PayPal交易状态
 * @returns {string} - 统一状态
 */
function convertPayPalStatus(paypalStatus) {
  const statusMap = {
    'created': 'pending',
    'approved': 'pending',
    'completed': 'paid',
    'failed': 'failed',
    'canceled': 'cancelled',
    'pending': 'pending',
    'refunded': 'refunded',
    'partially_refunded': 'refunded'
  };
  
  return statusMap[paypalStatus.toLowerCase()] || 'unknown';
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
    requestData
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
    callbackData
  };
  
  fs.appendFileSync(logFile, JSON.stringify(logData) + '\n');
}

module.exports = {
  createPaymentOrder,
  executePayment,
  queryOrderStatus,
  handlePaymentCallback,
  refund
};
