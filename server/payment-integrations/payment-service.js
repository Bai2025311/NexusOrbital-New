/**
 * NexusOrbital 统一支付服务
 * 集成支付宝、微信支付、PayPal和Stripe支付平台
 */
const alipayService = require('./alipay');
const wechatPayService = require('./wechatpay');
const paypalService = require('./paypal');
const stripeService = require('./stripe');
const membershipService = require('../services/membership-service');
const transactionService = require('../services/transaction-service');
const promotionService = require('../services/promotion-service'); // 添加优惠券服务
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

/**
 * 创建支付订单
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Object>} - 支付订单结果
 */
async function createPaymentOrder(orderData) {
  try {
    const { 
      paymentMethod, 
      amount, 
      membershipId, 
      description, 
      userId, 
      metadata, 
      couponId, 
      discountAmount, 
      finalAmount 
    } = orderData;
    
    // 生成订单号
    const outTradeNo = generateOrderId(paymentMethod);
    
    // 确定实际支付金额（考虑优惠券折扣）
    const paymentAmount = finalAmount || amount;
    
    // 构建通用订单数据
    const commonOrderData = {
      outTradeNo,
      totalAmount: paymentAmount,
      subject: `NexusOrbital ${getMembershipName(membershipId)}会员订阅`,
      body: description || `升级到${getMembershipName(membershipId)}会员`,
      passbackParams: membershipId,
      metadata: {
        userId,
        membershipId,
        originalAmount: amount,
        discountAmount: discountAmount || 0,
        couponId,
        ...metadata
      },
      attach: membershipId // 微信支付使用
    };
    
    // 根据支付方式调用对应的支付服务
    let result;
    switch (paymentMethod) {
      case 'alipay':
        result = await alipayService.createPaymentOrder(commonOrderData);
        break;
      case 'wechat':
        result = await wechatPayService.createPaymentOrder(commonOrderData);
        break;
      case 'paypal':
        result = await paypalService.createPaymentOrder(commonOrderData);
        break;
      case 'stripe':
        result = await stripeService.createPaymentOrder(commonOrderData);
        break;
      default:
        throw new Error(`不支持的支付方式: ${paymentMethod}`);
    }
    
    // 保存订单记录
    if (result.success) {
      saveOrderRecord({
        orderId: outTradeNo,
        userId,
        membershipId,
        originalAmount: amount,
        amount: paymentAmount,
        discountAmount: discountAmount || 0,
        couponId,
        paymentMethod,
        status: 'created',
        createTime: moment().toISOString(),
        description: commonOrderData.body,
        paymentData: result.data
      });
      
      // 如果使用了优惠券，更新优惠券使用记录
      if (couponId) {
        try {
          await promotionService.recordCouponUsage(couponId, userId, outTradeNo, amount, discountAmount);
        } catch (error) {
          console.error('记录优惠券使用失败:', error);
          // 不影响支付流程继续
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('创建支付订单失败:', error);
    return {
      success: false,
      error: error.message || '创建支付订单失败'
    };
  }
}

/**
 * 处理支付回调
 * @param {string} paymentMethod - 支付方式
 * @param {Object} callbackData - 回调数据
 * @param {Object} headers - 请求头
 * @returns {Promise<Object>} - 处理结果
 */
async function handlePaymentCallback(paymentMethod, callbackData, headers) {
  try {
    // 根据支付方式调用对应的支付服务
    let result;
    switch (paymentMethod) {
      case 'alipay':
        result = await alipayService.handlePaymentCallback(callbackData);
        break;
      case 'wechat':
        result = await wechatPayService.handlePaymentCallback(callbackData, headers);
        break;
      case 'paypal':
        // PayPal需要Webhook ID
        const webhookId = process.env.PAYPAL_WEBHOOK_ID;
        result = await paypalService.handlePaymentCallback(callbackData, webhookId, headers);
        break;
      case 'stripe':
        // Stripe需要签名
        const signature = headers['stripe-signature'];
        result = await stripeService.handlePaymentCallback(callbackData, signature);
        break;
      default:
        throw new Error(`不支持的支付方式: ${paymentMethod}`);
    }
    
    // 更新订单记录
    if (result.success && result.data.orderId) {
      updateOrderStatus(result.data.orderId, result.data.status, result.data);
      
      // 如果支付成功，创建交易记录并更新会员信息
      if (result.data.status === 'paid') {
        // 获取订单记录
        const orderRecord = getOrderRecord(result.data.orderId);
        
        if (orderRecord && orderRecord.userId) {
          // 创建交易记录
          const transactionResult = await transactionService.createTransaction({
            userId: orderRecord.userId,
            orderId: result.data.orderId,
            amount: orderRecord.amount,
            originalAmount: orderRecord.originalAmount,
            discountAmount: orderRecord.discountAmount,
            couponId: orderRecord.couponId,
            paymentMethod: paymentMethod,
            status: 'paid',
            membershipId: orderRecord.membershipId,
            description: orderRecord.description
          });
          
          if (!transactionResult.success) {
            console.error('创建交易记录失败:', transactionResult.error);
          } else {
            console.log(`交易记录已创建: ${transactionResult.data.id}`);
          }
          
          // 如果是会员订阅，更新会员信息
          if (orderRecord.membershipId) {
            // 调用会员服务更新会员信息
            const membershipResult = await membershipService.updateMembership(
              orderRecord.userId,
              orderRecord.membershipId,
              {
                transactionId: transactionResult.success ? transactionResult.data.id : result.data.orderId,
                amount: orderRecord.amount,
                paymentMethod: paymentMethod,
                payTime: result.data.payTime || moment().toISOString()
              }
            );
            
            if (!membershipResult.success) {
              console.error('更新会员状态失败:', membershipResult.error);
            } else {
              console.log(`用户 ${orderRecord.userId} 的会员状态已更新为 ${orderRecord.membershipId}`);
            }
          }
        } else {
          console.error(`找不到订单记录或用户ID: ${result.data.orderId}`);
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('处理支付回调失败:', error);
    return {
      success: false,
      error: error.message || '处理支付回调失败'
    };
  }
}

/**
 * 获取交易记录
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} - 交易记录列表
 */
async function getTransactions(params = {}) {
  try {
    const { userId, status, paymentMethod, page = 1, limit = 10, timeFilter } = params;
    
    // 获取所有订单记录
    const allOrders = getAllOrderRecords();
    
    // 过滤订单记录
    let filteredOrders = allOrders;
    
    if (userId) {
      filteredOrders = filteredOrders.filter(order => order.userId === userId);
    }
    
    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.paymentMethod === paymentMethod);
    }
    
    if (timeFilter) {
      const now = moment();
      let startTime;
      
      switch (timeFilter) {
        case 'today':
          startTime = moment().startOf('day');
          break;
        case 'week':
          startTime = moment().subtract(7, 'days');
          break;
        case 'month':
          startTime = moment().subtract(30, 'days');
          break;
        case 'year':
          startTime = moment().subtract(365, 'days');
          break;
      }
      
      if (startTime) {
        filteredOrders = filteredOrders.filter(order => moment(order.createTime).isAfter(startTime));
      }
    }
    
    // 按创建时间倒序排序
    filteredOrders.sort((a, b) => moment(b.createTime).valueOf() - moment(a.createTime).valueOf());
    
    // 分页
    const total = filteredOrders.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedOrders = filteredOrders.slice(offset, offset + limit);
    
    // 格式化交易记录
    const transactions = paginatedOrders.map(order => ({
      id: order.id,
      transactionId: order.orderId,
      amount: order.amount,
      originalAmount: order.originalAmount,
      discountAmount: order.discountAmount,
      couponId: order.couponId,
      paymentMethod: order.paymentMethod,
      membershipId: order.membershipId,
      description: order.description,
      status: order.status,
      date: order.createTime,
      payTime: order.payTime,
      metadata: order.metadata
    }));
    
    return {
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          limit
        }
      }
    };
  } catch (error) {
    console.error('获取交易记录失败:', error);
    return {
      success: false,
      error: error.message || '获取交易记录失败'
    };
  }
}

/**
 * 获取交易详情
 * @param {string} transactionId - 交易ID
 * @returns {Promise<Object>} - 交易详情
 */
async function getTransactionDetail(transactionId) {
  try {
    // 获取订单记录
    const orderRecord = getOrderRecord(transactionId);
    if (!orderRecord) {
      throw new Error(`交易不存在: ${transactionId}`);
    }
    
    // 查询最新的订单状态
    await queryPaymentOrderStatus(transactionId, orderRecord.paymentMethod);
    
    // 重新获取更新后的订单记录
    const updatedOrder = getOrderRecord(transactionId);
    
    // 格式化交易详情
    const transactionDetail = {
      id: updatedOrder.id,
      transactionId: updatedOrder.orderId,
      amount: updatedOrder.amount,
      originalAmount: updatedOrder.originalAmount,
      discountAmount: updatedOrder.discountAmount,
      couponId: updatedOrder.couponId,
      paymentMethod: updatedOrder.paymentMethod,
      membershipId: updatedOrder.membershipId,
      description: updatedOrder.description,
      status: updatedOrder.status,
      createTime: updatedOrder.createTime,
      payTime: updatedOrder.payTime,
      metadata: updatedOrder.metadata,
      paymentData: updatedOrder.paymentData
    };
    
    return {
      success: true,
      data: transactionDetail
    };
  } catch (error) {
    console.error('获取交易详情失败:', error);
    return {
      success: false,
      error: error.message || '获取交易详情失败'
    };
  }
}

/**
 * 下载交易收据
 * @param {string} transactionId - 交易ID
 * @returns {Promise<Object>} - 收据数据
 */
async function downloadReceipt(transactionId) {
  try {
    // 获取交易详情
    const result = await getTransactionDetail(transactionId);
    if (!result.success) {
      throw new Error(result.error || '获取交易详情失败');
    }
    
    const transaction = result.data;
    
    // 检查交易状态
    if (transaction.status !== 'paid' && transaction.status !== 'completed') {
      throw new Error('只有已支付的交易才能下载收据');
    }
    
    // 生成收据数据
    const receipt = {
      transactionId: transaction.transactionId,
      date: transaction.payTime || transaction.createTime,
      amount: transaction.amount,
      originalAmount: transaction.originalAmount,
      discountAmount: transaction.discountAmount,
      couponId: transaction.couponId,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description,
      membershipId: transaction.membershipId,
      membershipName: getMembershipName(transaction.membershipId),
      status: transaction.status,
      company: {
        name: 'NexusOrbital太空技术协作平台',
        address: '北京市海淀区中关村科技园区',
        phone: '+86 10-12345678',
        email: 'support@nexusorbital.com',
        website: 'https://www.nexusorbital.com'
      },
      receiptNumber: `REC-${transaction.transactionId}`,
      issueDate: moment().format('YYYY-MM-DD HH:mm:ss')
    };
    
    return {
      success: true,
      data: {
        receipt
      }
    };
  } catch (error) {
    console.error('下载交易收据失败:', error);
    return {
      success: false,
      error: error.message || '下载交易收据失败'
    };
  }
}

module.exports = {
  createPaymentOrder,
  queryPaymentOrderStatus,
  handlePaymentCallback,
  refund,
  closeOrder,
  getTransactions,
  getTransactionDetail,
  downloadReceipt
};
