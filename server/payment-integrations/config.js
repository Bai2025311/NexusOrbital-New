/**
 * 支付集成配置文件
 * 从环境变量加载各支付平台的配置信息
 */

require('dotenv').config();

// 输出环境变量加载情况
console.log('环境变量加载情况:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  STRIPE_SECRET_KEY_LENGTH: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0,
  STRIPE_PUBLISHABLE_KEY_LENGTH: process.env.STRIPE_PUBLISHABLE_KEY ? process.env.STRIPE_PUBLISHABLE_KEY.length : 0
});

// 支付宝配置
const alipayConfig = {
  appId: process.env.ALIPAY_APP_ID,
  privateKey: process.env.ALIPAY_PRIVATE_KEY,
  publicKey: process.env.ALIPAY_PUBLIC_KEY,
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipaydev.com/gateway.do', // 默认使用沙箱环境
  notifyUrl: process.env.ALIPAY_NOTIFY_URL,
  returnUrl: process.env.ALIPAY_RETURN_URL
};

// 微信支付配置
const wechatPayConfig = {
  appId: process.env.WECHAT_APP_ID,
  mchId: process.env.WECHAT_MCH_ID,
  apiKey: process.env.WECHAT_API_KEY,
  apiV3Key: process.env.WECHAT_API_V3_KEY,
  serialNo: process.env.WECHAT_SERIAL_NO,
  privateKeyPath: process.env.WECHAT_PRIVATE_KEY_PATH,
  certPath: process.env.WECHAT_CERT_PATH,
  notifyUrl: process.env.WECHAT_NOTIFY_URL
};

// PayPal配置
const paypalConfig = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  mode: process.env.PAYPAL_MODE || 'sandbox', // 默认使用沙箱环境
  returnUrl: process.env.PAYPAL_RETURN_URL,
  cancelUrl: process.env.PAYPAL_CANCEL_URL,
  webhookId: process.env.PAYPAL_WEBHOOK_ID
};

// Stripe配置
const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY, // 支持新的公钥命名
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  returnUrl: process.env.STRIPE_RETURN_URL || `${process.env.BASE_URL || 'http://localhost:3000'}/payment/success`,
  cancelUrl: process.env.STRIPE_CANCEL_URL || `${process.env.BASE_URL || 'http://localhost:3000'}/payment/cancel`
};

// 输出配置信息（不包含敏感信息）
console.log('Stripe配置加载完成:', {
  secretKeyLoaded: !!stripeConfig.secretKey,
  publishableKeyLoaded: !!stripeConfig.publishableKey,
  webhookSecretLoaded: !!stripeConfig.webhookSecret
});

module.exports = {
  alipayConfig,
  wechatPayConfig,
  paypalConfig,
  stripeConfig
};
