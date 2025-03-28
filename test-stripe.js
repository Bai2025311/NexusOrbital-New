/**
 * Stripe支付集成测试脚本
 */
require('dotenv').config();
const stripe = require('stripe');

// 测试Stripe配置
console.log('开始测试Stripe支付集成...');

// 检查环境变量
console.log('环境变量检查:');
console.log('- STRIPE_SECRET_KEY 长度:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0);
console.log('- STRIPE_PUBLISHABLE_KEY 长度:', process.env.STRIPE_PUBLISHABLE_KEY ? process.env.STRIPE_PUBLISHABLE_KEY.length : 0);

// 尝试创建Stripe客户端
try {
  console.log('尝试创建Stripe客户端...');
  const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
  console.log('Stripe客户端创建成功!');
  
  // 测试创建支付意向
  async function testCreatePaymentIntent() {
    try {
      console.log('尝试创建支付意向...');
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: 999, // $9.99
        currency: 'usd',
        description: 'NexusOrbital基础会员订阅测试',
        metadata: {
          order_id: 'test_' + Date.now(),
          membership_id: 'basic'
        }
      });
      
      console.log('支付意向创建成功!');
      console.log('- ID:', paymentIntent.id);
      console.log('- 客户端密钥:', paymentIntent.client_secret ? '已生成' : '未生成');
      console.log('- 状态:', paymentIntent.status);
      
      // 测试创建Checkout会话
      try {
        console.log('尝试创建Checkout会话...');
        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'NexusOrbital基础会员',
                  description: '太空技术协作平台会员订阅'
                },
                unit_amount: 999
              },
              quantity: 1
            }
          ],
          mode: 'payment',
          success_url: `http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `http://localhost:3000/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
          client_reference_id: 'test_' + Date.now()
        });
        
        console.log('Checkout会话创建成功!');
        console.log('- 会话ID:', session.id);
        console.log('- 支付URL:', session.url);
        console.log('- 状态:', session.status);
        console.log('- 支付链接:', session.url);
        
        console.log('\n测试完成: Stripe支付集成正常工作!');
        console.log('您可以使用以下链接测试支付流程:');
        console.log(session.url);
      } catch (error) {
        console.error('创建Checkout会话失败:', error.message);
      }
    } catch (error) {
      console.error('创建支付意向失败:', error.message);
    }
  }
  
  // 执行测试
  testCreatePaymentIntent();
  
} catch (error) {
  console.error('Stripe客户端创建失败:', error.message);
}
