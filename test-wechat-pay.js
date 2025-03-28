/**
 * 微信支付集成测试脚本
 * 用于测试微信支付的配置和基本功能
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');

// 微信支付配置
const wechatConfig = {
  appId: process.env.WECHAT_APP_ID,
  mchId: process.env.WECHAT_MCH_ID,
  apiKey: process.env.WECHAT_API_KEY,
  apiV3Key: process.env.WECHAT_API_V3_KEY,
  serialNo: process.env.WECHAT_SERIAL_NO,
  privateKeyPath: process.env.WECHAT_PRIVATE_KEY_PATH,
  certPath: process.env.WECHAT_CERT_PATH,
  notifyUrl: process.env.WECHAT_NOTIFY_URL
};

// 检查配置
console.log('微信支付配置检查:');
console.log(`- 应用ID: ${wechatConfig.appId}`);
console.log(`- 商户号: ${wechatConfig.mchId}`);
console.log(`- API密钥长度: ${wechatConfig.apiKey ? wechatConfig.apiKey.length : 0}`);
console.log(`- APIv3密钥长度: ${wechatConfig.apiV3Key ? wechatConfig.apiV3Key.length : 0}`);
console.log(`- 证书序列号: ${wechatConfig.serialNo}`);
console.log(`- 私钥路径: ${wechatConfig.privateKeyPath}`);
console.log(`- 证书路径: ${wechatConfig.certPath}`);
console.log(`- 回调URL: ${wechatConfig.notifyUrl}`);

// 检查证书文件
const privateKeyExists = fs.existsSync(wechatConfig.privateKeyPath);
const certExists = fs.existsSync(wechatConfig.certPath);

console.log('\n证书文件检查:');
console.log(`- 私钥文件存在: ${privateKeyExists}`);
console.log(`- 证书文件存在: ${certExists}`);

// 如果证书文件存在，检查内容
let privateKeyContent = '';
let certContent = '';

if (privateKeyExists) {
  privateKeyContent = fs.readFileSync(wechatConfig.privateKeyPath, 'utf8');
  console.log(`- 私钥文件内容长度: ${privateKeyContent.length}`);
}

if (certExists) {
  certContent = fs.readFileSync(wechatConfig.certPath, 'utf8');
  console.log(`- 证书文件内容长度: ${certContent.length}`);
}

// 生成随机订单号
function generateOrderId() {
  return `WX${Date.now()}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
}

// 生成随机OpenID（仅用于测试）
function generateRandomOpenId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'test_openid_';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 模拟创建微信支付订单
async function mockCreateOrder() {
  const orderId = generateOrderId();
  const openId = generateRandomOpenId();
  
  // 构建订单数据
  const orderData = {
    "appid": wechatConfig.appId,
    "mchid": wechatConfig.mchId,
    "description": "NexusOrbital基础会员订阅",
    "out_trade_no": orderId,
    "notify_url": wechatConfig.notifyUrl,
    "amount": {
      "total": 999,
      "currency": "CNY"
    },
    "payer": {
      "openid": openId
    }
  };
  
  console.log('\n创建模拟微信支付订单...');
  console.log('订单数据:', JSON.stringify(orderData, null, 2));
  
  // 在实际环境中，这里会调用微信支付API
  // 返回模拟的预支付ID和二维码链接
  const mockResult = {
    prepay_id: `wx${moment().format('YYMMDDHHmmss')}${Math.random().toString(36).substring(2, 8)}`,
    code_url: 'weixin://wxpay/bizpayurl?pr=XZl8OBCzz'
  };
  
  return {
    orderId,
    prepayId: mockResult.prepay_id,
    codeUrl: mockResult.code_url
  };
}

// 模拟查询微信支付订单状态
async function mockQueryOrder(orderId) {
  console.log('\n查询模拟微信支付订单状态...');
  console.log('订单ID:', orderId);
  
  // 在实际环境中，这里会调用微信支付API查询订单状态
  // 返回模拟的订单状态
  const statuses = ['success', 'processing', 'failed'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    orderId,
    status: randomStatus
  };
}

// 运行测试
async function runTest() {
  console.log('=== 开始微信支付测试 ===\n');
  
  try {
    // 1. 创建订单
    const orderResult = await mockCreateOrder();
    
    // 2. 查询订单状态
    const queryResult = await mockQueryOrder(orderResult.orderId);
    
    console.log('\n=== 微信支付测试完成 ===');
    console.log('测试结果:');
    console.log('- 创建订单: 成功');
    console.log('- 查询状态: 成功');
    console.log(`- 订单状态: ${queryResult.status}`);
    
    console.log('\n在实际环境中，您需要:');
    console.log('1. 使用真实的微信支付商户号和应用ID');
    console.log('2. 生成正确的微信支付签名');
    console.log('3. 调用微信支付API创建订单');
    console.log('4. 使用微信扫描生成的二维码完成支付');
    console.log('5. 处理微信支付回调通知');
    
    console.log('\n=== 微信支付测试信息 ===');
    console.log(`订单ID: ${orderResult.orderId}`);
    console.log(`预支付ID: ${orderResult.prepayId}`);
    console.log(`二维码链接: ${orderResult.codeUrl}`);
    console.log(`金额: 9.99 CNY`);
    console.log(`状态: ${queryResult.status === 'success' ? '支付成功' : queryResult.status === 'processing' ? '处理中' : '支付失败'}`);
    
    // 提供下一步建议
    console.log('\n=== 下一步建议 ===');
    console.log('1. 在会员订阅页面集成微信支付');
    console.log('2. 实现支付状态查询和通知处理');
    console.log('3. 添加支付成功后的会员权限更新');
    console.log('4. 在支付页面添加"通过忠间居住设计研究院小程序处理付款"的提示');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 执行测试
runTest();
