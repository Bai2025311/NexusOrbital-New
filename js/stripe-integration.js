/**
 * Stripe支付集成
 * 提供Stripe支付相关功能
 */

// Stripe公钥
let stripePublicKey = '';

// 初始化Stripe
let stripe = null;

/**
 * 初始化Stripe
 */
function initStripe() {
    // 从服务器获取Stripe公钥
    fetchStripePublicKey()
        .then(key => {
            stripePublicKey = key;
            // 初始化Stripe实例
            stripe = Stripe(stripePublicKey);
            console.log('Stripe初始化成功');
        })
        .catch(error => {
            console.error('Stripe初始化失败:', error);
            showNotification('支付系统初始化失败，请刷新页面重试', 'error');
        });
}

/**
 * 从服务器获取Stripe公钥
 * @returns {Promise<string>} Stripe公钥
 */
async function fetchStripePublicKey() {
    // 实际项目中应从服务器获取
    // 这里暂时使用硬编码的公钥（生产环境）
    return 'pk_live_51Nw4GkHEiPLqRhLYyHGVJnuISQaEyU59M7qwaYcdWwNUciOlkRdrH0ZMMYrZAUgulbsx7DBZGiCZ84HHSxkmhhDz00ARbmq2jR';
}

/**
 * 创建支付会话
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Object>} 支付会话数据
 */
async function createPaymentSession(orderData) {
    try {
        // 实际项目中应调用后端API创建支付会话
        // 这里模拟API调用
        console.log('创建Stripe支付会话，参数:', orderData);
        
        // 模拟API响应
        return {
            success: true,
            data: {
                sessionId: 'cs_test_' + Math.random().toString(36).substring(2, 15),
                clientSecret: 'pi_' + Math.random().toString(36).substring(2, 15) + '_secret_' + Math.random().toString(36).substring(2, 15),
                publicKey: stripePublicKey,
                amount: orderData.totalAmount,
                currency: 'usd',
                status: 'created'
            }
        };
    } catch (error) {
        console.error('创建Stripe支付会话失败:', error);
        return {
            success: false,
            error: error.message || 'Stripe支付会话创建失败'
        };
    }
}

/**
 * 处理Stripe支付
 * @param {string} planName - 计划名称
 * @param {number} planPrice - 计划价格
 * @returns {Promise<Object>} 支付结果
 */
async function processStripePayment(planName, planPrice) {
    try {
        // 显示加载状态
        const confirmBtn = document.getElementById('confirm-payment-btn');
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
        
        // 生成订单数据
        const orderData = {
            outTradeNo: 'ST' + Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
            totalAmount: parseFloat(planPrice),
            subject: `NexusOrbital ${planName}订阅`,
            body: `订阅${planName}计划，享受更多高级功能`,
            attach: 'membership_' + planName.replace(/\s+/g, '_').toLowerCase()
        };
        
        // 创建支付会话
        const sessionResult = await createPaymentSession(orderData);
        
        // 恢复按钮状态
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
        
        if (!sessionResult.success) {
            throw new Error(sessionResult.error || '创建支付会话失败');
        }
        
        const { sessionId, clientSecret } = sessionResult.data;
        
        // 使用Stripe.js重定向到Checkout页面
        if (stripe) {
            // 方式1: 使用Checkout会话
            const { error } = await stripe.redirectToCheckout({
                sessionId: sessionId
            });
            
            if (error) {
                throw new Error(error.message);
            }
            
            // 方式2: 使用Elements和PaymentIntents (备选方案)
            // 这部分代码在redirectToCheckout失败时使用
            // 需要在页面中添加相应的HTML元素
        } else {
            throw new Error('Stripe未初始化');
        }
        
        return {
            success: true,
            data: {
                transactionId: orderData.outTradeNo,
                sessionId: sessionId,
                paymentMethod: 'stripe',
                amount: parseFloat(planPrice),
                status: 'processing'
            }
        };
    } catch (error) {
        console.error('Stripe支付处理失败:', error);
        showNotification('支付处理失败: ' + error.message, 'error');
        
        return {
            success: false,
            error: error.message || 'Stripe支付处理失败'
        };
    }
}

/**
 * 查询Stripe支付状态
 * @param {string} sessionId - 会话ID
 * @returns {Promise<Object>} 支付状态
 */
async function checkStripePaymentStatus(sessionId) {
    try {
        // 实际项目中应调用后端API查询支付状态
        // 这里模拟API调用
        console.log('查询Stripe支付状态，会话ID:', sessionId);
        
        // 模拟API响应
        return {
            success: true,
            data: {
                sessionId: sessionId,
                status: 'paid', // 可能的状态: created, processing, paid, failed
                paymentTime: new Date().toISOString(),
                transactionId: 'ch_' + Math.random().toString(36).substring(2, 15)
            }
        };
    } catch (error) {
        console.error('查询Stripe支付状态失败:', error);
        return {
            success: false,
            error: error.message || '查询Stripe支付状态失败'
        };
    }
}

/**
 * 显示通知消息
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 (success, error, info)
 */
function showNotification(message, type = 'info') {
    // 检查全局函数是否存在
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // 简单的备用通知
        alert(message);
    }
}

// 导出函数
window.stripeIntegration = {
    initStripe,
    processStripePayment,
    checkStripePaymentStatus
};

// 页面加载完成后初始化Stripe
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已加载Stripe.js
    if (typeof Stripe === 'function') {
        initStripe();
    } else {
        console.error('Stripe.js未加载');
    }
});
