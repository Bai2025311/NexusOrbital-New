/**
 * 支付宝支付集成
 */
const AlipaySdk = require('alipay-sdk').default;
const AlipayFormData = require('alipay-sdk/lib/form').default;
const { alipayConfig } = require('./config');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// 创建支付宝SDK实例
const alipaySdk = new AlipaySdk({
  appId: alipayConfig.appId,
  privateKey: alipayConfig.privateKey,
  signType: 'RSA2',
  alipayPublicKey: alipayConfig.publicKey,
  gateway: alipayConfig.gateway,
  timeout: 5000,
  camelcase: true
});

/**
 * 创建支付宝支付订单
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Object>} - 支付订单结果
 */
async function createPaymentOrder(orderData) {
  try {
    const { outTradeNo, totalAmount, subject, body, passbackParams } = orderData;
    
    // 创建支付表单
    const formData = new AlipayFormData();
    formData.setMethod('get');
    formData.addField('bizContent', {
      outTradeNo: outTradeNo,
      productCode: 'FAST_INSTANT_TRADE_PAY',
      totalAmount: totalAmount,
      subject: subject,
      body: body,
      passbackParams: passbackParams
    });
    
    // 设置回调地址
    formData.addField('notifyUrl', alipayConfig.notifyUrl);
    formData.addField('returnUrl', alipayConfig.returnUrl);
    
    // 请求支付宝接口
    const result = await alipaySdk.exec(
      'alipay.trade.page.pay',
      {},
      { formData: formData }
    );
    
    // 记录日志
    logPaymentRequest('alipay', outTradeNo, totalAmount, result);
    
    return {
      success: true,
      data: {
        orderId: outTradeNo,
        paymentUrl: result,
        paymentMethod: 'alipay',
        amount: totalAmount,
        status: 'created',
        expireTime: moment().add(30, 'minutes').toISOString()
      }
    };
  } catch (error) {
    console.error('支付宝支付订单创建失败:', error);
    return {
      success: false,
      error: error.message || '支付宝支付订单创建失败'
    };
  }
}

/**
 * 查询支付宝订单状态
 * @param {string} outTradeNo - 商户订单号
 * @returns {Promise<Object>} - 订单状态查询结果
 */
async function queryOrderStatus(outTradeNo) {
  try {
    const result = await alipaySdk.exec('alipay.trade.query', {
      bizContent: {
        outTradeNo: outTradeNo
      }
    });
    
    // 解析响应
    const response = result.tradeQueryResponse;
    
    if (response.code === '10000') {
      return {
        success: true,
        data: {
          orderId: outTradeNo,
          status: convertAlipayStatus(response.tradeStatus),
          payTime: response.sendPayDate,
          amount: response.totalAmount,
          tradeNo: response.tradeNo
        }
      };
    } else {
      return {
        success: false,
        error: response.subMsg || '查询订单状态失败'
      };
    }
  } catch (error) {
    console.error('支付宝订单状态查询失败:', error);
    return {
      success: false,
      error: error.message || '支付宝订单状态查询失败'
    };
  }
}

/**
 * 处理支付宝支付回调通知
 * @param {Object} notifyData - 回调通知数据
 * @returns {Promise<Object>} - 处理结果
 */
async function handlePaymentCallback(notifyData) {
  try {
    // 验证签名
    const signVerified = alipaySdk.checkNotifySign(notifyData);
    
    if (!signVerified) {
      console.error('支付宝回调签名验证失败');
      return { success: false, error: '签名验证失败' };
    }
    
    // 处理回调数据
    const outTradeNo = notifyData.out_trade_no;
    const tradeStatus = notifyData.trade_status;
    
    // 记录回调日志
    logPaymentCallback('alipay', outTradeNo, notifyData);
    
    // 根据交易状态更新订单
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      // 支付成功，更新订单状态
      // 这里应该调用业务逻辑处理订单状态更新
      // 例如：updateOrderStatus(outTradeNo, 'paid');
      
      // 获取会员计划ID（从passback_params中）
      const membershipId = notifyData.passback_params;
      
      return {
        success: true,
        data: {
          orderId: outTradeNo,
          status: 'paid',
          payTime: moment().toISOString(),
          tradeNo: notifyData.trade_no,
          amount: notifyData.total_amount,
          membershipId: membershipId
        }
      };
    } else {
      // 其他状态处理
      return {
        success: true,
        data: {
          orderId: outTradeNo,
          status: convertAlipayStatus(tradeStatus),
          tradeNo: notifyData.trade_no
        }
      };
    }
  } catch (error) {
    console.error('处理支付宝回调失败:', error);
    return {
      success: false,
      error: error.message || '处理支付宝回调失败'
    };
  }
}

/**
 * 退款操作
 * @param {string} outTradeNo - 商户订单号
 * @param {string} refundAmount - 退款金额
 * @param {string} refundReason - 退款原因
 * @returns {Promise<Object>} - 退款结果
 */
async function refund(outTradeNo, refundAmount, refundReason) {
  try {
    const outRequestNo = `refund_${outTradeNo}_${Date.now()}`;
    
    const result = await alipaySdk.exec('alipay.trade.refund', {
      bizContent: {
        outTradeNo: outTradeNo,
        refundAmount: refundAmount,
        refundReason: refundReason,
        outRequestNo: outRequestNo
      }
    });
    
    const response = result.tradeRefundResponse;
    
    if (response.code === '10000') {
      return {
        success: true,
        data: {
          orderId: outTradeNo,
          refundId: outRequestNo,
          refundAmount: response.refundFee,
          status: 'refunded'
        }
      };
    } else {
      return {
        success: false,
        error: response.subMsg || '退款失败'
      };
    }
  } catch (error) {
    console.error('支付宝退款失败:', error);
    return {
      success: false,
      error: error.message || '支付宝退款失败'
    };
  }
}

/**
 * 关闭订单
 * @param {string} outTradeNo - 商户订单号
 * @returns {Promise<Object>} - 关闭订单结果
 */
async function closeOrder(outTradeNo) {
  try {
    const result = await alipaySdk.exec('alipay.trade.close', {
      bizContent: {
        outTradeNo: outTradeNo
      }
    });
    
    const response = result.tradeCloseResponse;
    
    if (response.code === '10000') {
      return {
        success: true,
        data: {
          orderId: outTradeNo,
          status: 'closed'
        }
      };
    } else {
      return {
        success: false,
        error: response.subMsg || '关闭订单失败'
      };
    }
  } catch (error) {
    console.error('支付宝关闭订单失败:', error);
    return {
      success: false,
      error: error.message || '支付宝关闭订单失败'
    };
  }
}

/**
 * 转换支付宝交易状态为统一状态
 * @param {string} alipayStatus - 支付宝交易状态
 * @returns {string} - 统一状态
 */
function convertAlipayStatus(alipayStatus) {
  const statusMap = {
    'WAIT_BUYER_PAY': 'pending',
    'TRADE_CLOSED': 'closed',
    'TRADE_SUCCESS': 'paid',
    'TRADE_FINISHED': 'completed'
  };
  
  return statusMap[alipayStatus] || 'unknown';
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
  queryOrderStatus,
  handlePaymentCallback,
  refund,
  closeOrder
};
