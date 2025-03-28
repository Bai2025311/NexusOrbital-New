/**
 * 支付宝支付集成
 * 提供支付宝支付相关功能
 */

/**
 * 处理支付宝支付
 * @param {string} planName - 计划名称
 * @param {number} planPrice - 计划价格
 * @returns {Promise<Object>} 支付结果
 */
async function processAlipayPayment(planName, planPrice) {
    try {
        // 显示加载状态
        const confirmBtn = document.getElementById('confirm-payment-btn');
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
        
        // 生成订单数据
        const orderData = {
            outTradeNo: 'AP' + Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
            totalAmount: parseFloat(planPrice),
            subject: `NexusOrbital ${planName}订阅`,
            body: `订阅${planName}计划，享受更多高级功能`,
            passbackParams: 'membership_' + planName.replace(/\s+/g, '_').toLowerCase()
        };
        
        // 调用后端API创建支付宝订单
        const response = await fetch('/api/payment/alipay/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        // 恢复按钮状态
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
        
        if (!result.success) {
            throw new Error(result.error || '创建支付宝订单失败');
        }
        
        // 跳转到支付宝支付页面
        window.location.href = result.data.paymentUrl;
        
        return {
            success: true,
            data: {
                orderId: result.data.orderId,
                paymentMethod: 'alipay',
                amount: parseFloat(planPrice),
                status: 'processing'
            }
        };
    } catch (error) {
        console.error('支付宝支付处理失败:', error);
        showNotification('支付处理失败: ' + error.message, 'error');
        
        return {
            success: false,
            error: error.message || '支付宝支付处理失败'
        };
    }
}

/**
 * 查询支付宝支付状态
 * @param {string} orderId - 订单ID
 * @returns {Promise<Object>} 支付状态
 */
async function checkAlipayPaymentStatus(orderId) {
    try {
        // 调用后端API查询支付状态
        const response = await fetch(`/api/payment/alipay/query?orderId=${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '查询支付宝支付状态失败');
        }
        
        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error('查询支付宝支付状态失败:', error);
        return {
            success: false,
            error: error.message || '查询支付宝支付状态失败'
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
window.alipayIntegration = {
    processAlipayPayment,
    checkAlipayPaymentStatus
};
