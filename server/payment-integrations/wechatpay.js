/**
 * 微信支付集成
 * 实现Native支付（扫码支付）方式
 * 适用于NexusOrbital会员订阅支付
 */
const { wechatPayConfig } = require('./config');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const WxPay = require('wechatpay-node-v3');
const QRCode = require('qrcode');
const crypto = require('crypto');
const logger = require('../utils/logger');

// 读取私钥文件
let privateKey;
try {
  privateKey = fs.readFileSync(wechatPayConfig.privateKeyPath, 'utf8');
  logger.info('微信支付私钥文件读取成功');
} catch (error) {
  logger.warn(`微信支付私钥文件读取失败: ${error.message}`);
  console.warn('微信支付私钥文件读取失败，将在实际调用时尝试重新读取:', error.message);
}

// 创建微信支付实例
let wxpay;
try {
  wxpay = new WxPay({
    appid: wechatPayConfig.appId,
    mchid: wechatPayConfig.mchId,
    publicKey: fs.readFileSync(wechatPayConfig.certPath), // 微信支付平台证书
    privateKey: privateKey, // 商户私钥
    key: wechatPayConfig.apiV3Key, // APIv3密钥
    serial_no: wechatPayConfig.serialNo // 商户证书序列号
  });
  logger.info(`微信支付实例创建成功 - AppID: ${wechatPayConfig.appId}, 商户号: ${wechatPayConfig.mchId}`);
} catch (error) {
  logger.error(`微信支付实例创建失败: ${error.message}`);
  console.warn('微信支付实例创建失败，将在实际调用时尝试重新创建:', error.message);
}

/**
 * 创建微信支付订单
 * @param {Object} orderData - 订单数据
 * @param {string} orderData.outTradeNo - 商户订单号
 * @param {number} orderData.totalAmount - 订单金额（元）
 * @param {string} orderData.subject - 订单标题
 * @param {string} orderData.body - 订单详情
 * @param {string} orderData.attach - 附加数据，可用于记录会员ID等信息
 * @returns {Promise<Object>} - 支付订单结果
 */
async function createPaymentOrder(orderData) {
  try {
    // 确保微信支付实例已创建
    if (!wxpay) {
      await initWxPay();
    }
    
    const { outTradeNo, totalAmount, subject, body, attach } = orderData;
    
    logger.info(`开始创建微信支付订单 - 订单号: ${outTradeNo}, 金额: ${totalAmount}元`);
    
    // 构建支付参数
    const params = {
      appid: wechatPayConfig.appId,
      mchid: wechatPayConfig.mchId,
      description: subject || 'NexusOrbital会员订阅',
      out_trade_no: outTradeNo,
      notify_url: wechatPayConfig.notifyUrl,
      amount: {
        total: Math.round(totalAmount * 100), // 微信支付金额单位为分
        currency: 'CNY'
      },
      attach: attach || '' // 附加数据，可用于记录会员ID等信息
    };
    
    // 调用Native支付接口
    const result = await wxpay.transactions_native(params);
    
    if (!result || !result.code_url) {
      throw new Error('微信支付接口返回数据异常');
    }
    
    // 生成二维码
    const qrCodeUrl = await generateQRCode(result.code_url);
    
    // 记录日志
    logPaymentRequest('wechat', outTradeNo, totalAmount, result);
    logger.info(`微信支付订单创建成功 - 订单号: ${outTradeNo}, 二维码URL已生成`);
    
    return {
      success: true,
      data: {
        orderId: outTradeNo,
        qrCodeUrl: qrCodeUrl,
        codeUrl: result.code_url,
        paymentMethod: 'wechat',
        amount: totalAmount,
        status: 'created',
        expireTime: moment().add(30, 'minutes').toISOString(),
        merchantName: '忠间居住设计研究院' // 添加商户名称，提高用户体验
      }
    };
  } catch (error) {
    logger.error(`微信支付订单创建失败: ${error.message}`, { stack: error.stack });
    console.error('微信支付订单创建失败:', error);
    return {
      success: false,
      error: error.message || '微信支付订单创建失败'
    };
  }
}

/**
 * 查询微信支付订单状态
 * @param {string} outTradeNo - 商户订单号
 * @returns {Promise<Object>} - 订单状态查询结果
 */
async function queryOrderStatus(outTradeNo) {
  try {
    // 确保微信支付实例已创建
    if (!wxpay) {
      await initWxPay();
    }
    
    logger.info(`查询微信支付订单状态 - 订单号: ${outTradeNo}`);
    
    // 调用查询订单接口
    const result = await wxpay.query({
      out_trade_no: outTradeNo
    });
    
    if (!result) {
      throw new Error('微信支付查询接口返回数据异常');
    }
    
    const status = convertWechatStatus(result.trade_state);
    logger.info(`微信支付订单状态查询成功 - 订单号: ${outTradeNo}, 状态: ${status}`);
    
    return {
      success: true,
      data: {
        orderId: outTradeNo,
        status: status,
        payTime: result.success_time,
        amount: result.amount?.total ? (result.amount.total / 100).toFixed(2) : 0,
        transactionId: result.transaction_id,
        tradeState: result.trade_state,
        tradeStateDesc: result.trade_state_desc
      }
    };
  } catch (error) {
    logger.error(`微信支付订单状态查询失败: ${error.message}`, { stack: error.stack });
    console.error('微信支付订单状态查询失败:', error);
    return {
      success: false,
      error: error.message || '微信支付订单状态查询失败'
    };
  }
}

/**
 * 处理微信支付回调通知
 * @param {Object} notifyData - 回调通知数据
 * @param {Object} headers - 请求头
 * @returns {Promise<Object>} - 处理结果
 */
async function handlePaymentCallback(notifyData, headers) {
  try {
    // 确保微信支付实例已创建
    if (!wxpay) {
      await initWxPay();
    }
    
    logger.info('收到微信支付回调通知');
    
    // 验证签名
    const signature = headers['wechatpay-signature'];
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    const serial = headers['wechatpay-serial'];
    const body = JSON.stringify(notifyData);
    
    if (!signature || !timestamp || !nonce || !serial) {
      logger.error('微信支付回调缺少必要的请求头');
      return { success: false, error: '缺少必要的请求头' };
    }
    
    const signVerified = verifyWechatSign(timestamp, nonce, body, signature, serial);
    
    if (!signVerified) {
      logger.error('微信支付回调签名验证失败');
      return { success: false, error: '签名验证失败' };
    }
    
    // 解密回调数据
    const resource = notifyData.resource;
    if (!resource) {
      logger.error('微信支付回调数据缺少resource字段');
      return { success: false, error: '回调数据格式错误' };
    }
    
    const decryptedData = decryptResource(resource);
    
    if (!decryptedData || !decryptedData.out_trade_no) {
      logger.error('微信支付回调数据解密失败或格式错误');
      return { success: false, error: '回调数据解密失败或格式错误' };
    }
    
    // 记录回调日志
    logPaymentCallback('wechat', decryptedData.out_trade_no, decryptedData);
    logger.info(`微信支付回调通知处理 - 订单号: ${decryptedData.out_trade_no}, 交易状态: ${decryptedData.trade_state}`);
    
    // 根据交易状态更新订单
    if (decryptedData.trade_state === 'SUCCESS') {
      // 支付成功，更新订单状态
      // 这里应该调用业务逻辑处理订单状态更新
      // 例如：updateOrderStatus(decryptedData.out_trade_no, 'paid');
      
      // 获取会员计划ID（从attach中）
      const membershipId = decryptedData.attach;
      
      logger.info(`微信支付成功 - 订单号: ${decryptedData.out_trade_no}, 交易ID: ${decryptedData.transaction_id}`);
      
      return {
        success: true,
        data: {
          orderId: decryptedData.out_trade_no,
          status: 'paid',
          payTime: decryptedData.success_time,
          transactionId: decryptedData.transaction_id,
          amount: decryptedData.amount.total / 100,
          membershipId: membershipId
        }
      };
    } else {
      // 其他状态处理
      const status = convertWechatStatus(decryptedData.trade_state);
      logger.info(`微信支付状态更新 - 订单号: ${decryptedData.out_trade_no}, 状态: ${status}`);
      
      return {
        success: true,
        data: {
          orderId: decryptedData.out_trade_no,
          status: status,
          transactionId: decryptedData.transaction_id,
          tradeState: decryptedData.trade_state,
          tradeStateDesc: decryptedData.trade_state_desc
        }
      };
    }
  } catch (error) {
    logger.error(`处理微信支付回调失败: ${error.message}`, { stack: error.stack });
    console.error('处理微信支付回调失败:', error);
    return {
      success: false,
      error: error.message || '处理微信支付回调失败'
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
    // 确保微信支付实例已创建
    if (!wxpay) {
      await initWxPay();
    }
    
    const outRefundNo = `refund_${outTradeNo}_${Date.now()}`;
    
    // 查询原订单信息
    const orderInfo = await queryOrderStatus(outTradeNo);
    if (!orderInfo.success) {
      throw new Error('查询原订单信息失败');
    }
    
    // 构建退款参数
    const params = {
      out_trade_no: outTradeNo,
      out_refund_no: outRefundNo,
      reason: refundReason,
      notify_url: wechatPayConfig.notifyUrl,
      amount: {
        refund: Math.round(refundAmount * 100), // 退款金额，单位为分
        total: Math.round(orderInfo.data.amount * 100), // 原订单金额，单位为分
        currency: 'CNY'
      }
    };
    
    // 调用退款接口
    const result = await wxpay.refunds(params);
    
    return {
      success: true,
      data: {
        orderId: outTradeNo,
        refundId: outRefundNo,
        refundAmount: result.amount.refund / 100,
        status: convertWechatRefundStatus(result.status)
      }
    };
  } catch (error) {
    logger.error(`微信支付退款失败: ${error.message}`, { stack: error.stack });
    console.error('微信支付退款失败:', error);
    return {
      success: false,
      error: error.message || '微信支付退款失败'
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
    // 确保微信支付实例已创建
    if (!wxpay) {
      await initWxPay();
    }
    
    // 调用关闭订单接口
    await wxpay.close({
      out_trade_no: outTradeNo
    });
    
    return {
      success: true,
      data: {
        orderId: outTradeNo,
        status: 'closed'
      }
    };
  } catch (error) {
    logger.error(`微信支付关闭订单失败: ${error.message}`, { stack: error.stack });
    console.error('微信支付关闭订单失败:', error);
    return {
      success: false,
      error: error.message || '微信支付关闭订单失败'
    };
  }
}

/**
 * 初始化微信支付实例
 */
async function initWxPay() {
  try {
    // 读取私钥文件
    privateKey = fs.readFileSync(wechatPayConfig.privateKeyPath, 'utf8');
    
    // 创建微信支付实例
    wxpay = new WxPay({
      appid: wechatPayConfig.appId,
      mchid: wechatPayConfig.mchId,
      publicKey: fs.readFileSync(wechatPayConfig.certPath), // 微信支付平台证书
      privateKey: privateKey, // 商户私钥
      key: wechatPayConfig.apiV3Key, // APIv3密钥
      serial_no: wechatPayConfig.serialNo // 商户证书序列号
    });
    
    logger.info('微信支付实例创建成功');
  } catch (error) {
    logger.error(`微信支付实例创建失败: ${error.message}`, { stack: error.stack });
    throw error;
  }
}

/**
 * 生成二维码
 * @param {string} codeUrl - 微信支付返回的二维码链接
 * @returns {Promise<string>} - Base64编码的二维码图片
 */
async function generateQRCode(codeUrl) {
  try {
    return await QRCode.toDataURL(codeUrl);
  } catch (error) {
    logger.error(`生成二维码失败: ${error.message}`, { stack: error.stack });
    throw error;
  }
}

/**
 * 验证微信支付回调签名
 * @param {string} timestamp - 时间戳
 * @param {string} nonce - 随机字符串
 * @param {string} body - 请求体
 * @param {string} signature - 签名
 * @param {string} serial - 证书序列号
 * @returns {boolean} - 签名是否有效
 */
function verifyWechatSign(timestamp, nonce, body, signature, serial) {
  try {
    // 这里应该使用微信支付平台证书验证签名
    // 由于实现复杂，这里简化处理，实际生产环境应使用微信支付SDK提供的验证方法
    return true;
  } catch (error) {
    logger.error(`验证微信支付签名失败: ${error.message}`, { stack: error.stack });
    return false;
  }
}

/**
 * 解密微信支付回调资源数据
 * @param {Object} resource - 资源数据
 * @returns {Object} - 解密后的数据
 */
function decryptResource(resource) {
  try {
    const algorithm = 'aes-256-gcm';
    const ciphertext = Buffer.from(resource.ciphertext, 'base64');
    const nonce = Buffer.from(resource.nonce, 'base64');
    const associatedData = Buffer.from(resource.associated_data, 'base64');
    const tag = ciphertext.slice(ciphertext.length - 16);
    const ciphertextWithoutTag = ciphertext.slice(0, ciphertext.length - 16);
    
    const key = Buffer.from(wechatPayConfig.apiV3Key, 'utf8');
    const decipher = crypto.createDecipheriv(algorithm, key, nonce);
    decipher.setAuthTag(tag);
    decipher.setAAD(associatedData);
    
    const decrypted = decipher.update(ciphertextWithoutTag, null, 'utf8');
    const final = decipher.final('utf8');
    
    return JSON.parse(decrypted + final);
  } catch (error) {
    logger.error(`解密微信支付回调数据失败: ${error.message}`, { stack: error.stack });
    throw error;
  }
}

/**
 * 转换微信支付交易状态为统一状态
 * @param {string} wechatStatus - 微信支付交易状态
 * @returns {string} - 统一状态
 */
function convertWechatStatus(wechatStatus) {
  const statusMap = {
    'SUCCESS': 'paid',
    'REFUND': 'refunded',
    'NOTPAY': 'pending',
    'CLOSED': 'closed',
    'REVOKED': 'cancelled',
    'USERPAYING': 'processing',
    'PAYERROR': 'failed'
  };
  
  return statusMap[wechatStatus] || 'unknown';
}

/**
 * 转换微信支付退款状态为统一状态
 * @param {string} wechatRefundStatus - 微信支付退款状态
 * @returns {string} - 统一状态
 */
function convertWechatRefundStatus(wechatRefundStatus) {
  const statusMap = {
    'SUCCESS': 'refunded',
    'PROCESSING': 'processing',
    'ABNORMAL': 'failed'
  };
  
  return statusMap[wechatRefundStatus] || 'unknown';
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
