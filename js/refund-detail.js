/**
 * NexusOrbital 退款详情
 * 处理退款申请详情页面
 */

// 全局变量
let currentUser = null;
let refundRequest = null;
let transactionData = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查用户登录状态
    checkLoginStatus();
    
    // 获取退款申请ID
    const urlParams = new URLSearchParams(window.location.search);
    const refundId = urlParams.get('id');
    
    if (!refundId) {
        showErrorMessage('未提供退款申请ID');
        return;
    }
    
    // 加载退款申请详情
    loadRefundRequestDetail(refundId);
});

/**
 * 检查用户登录状态
 */
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // 未登录，跳转到登录页
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    
    // 获取用户信息
    fetchUserInfo(token);
}

/**
 * 获取用户信息
 * @param {string} token - 用户令牌
 */
function fetchUserInfo(token) {
    fetch('/api/user/profile', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.data;
            updateUserInfo();
        } else {
            // 获取用户信息失败，可能是令牌无效
            localStorage.removeItem('token');
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }
    })
    .catch(error => {
        console.error('获取用户信息失败:', error);
        showErrorMessage('获取用户信息失败，请刷新页面重试');
    });
}

/**
 * 更新用户信息显示
 */
function updateUserInfo() {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.name;
    }
}

/**
 * 加载退款申请详情
 * @param {string} refundId - 退款申请ID
 */
function loadRefundRequestDetail(refundId) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return;
    }
    
    // 显示加载状态
    document.getElementById('refund-loading').classList.remove('d-none');
    document.getElementById('refund-details').classList.add('d-none');
    
    fetch(`/api/refund/${refundId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        // 隐藏加载状态
        document.getElementById('refund-loading').classList.add('d-none');
        
        if (data.success) {
            refundRequest = data.data.refundRequest;
            transactionData = data.data.transaction;
            
            // 显示退款申请详情
            displayRefundDetails();
            
            // 显示交易详情
            displayTransactionDetails();
            
            // 更新退款进度
            updateRefundProgress();
        } else {
            showErrorMessage('加载退款申请详情失败: ' + data.error);
        }
    })
    .catch(error => {
        // 隐藏加载状态
        document.getElementById('refund-loading').classList.add('d-none');
        
        console.error('加载退款申请详情失败:', error);
        showErrorMessage('加载退款申请详情失败，请刷新页面重试');
    });
}

/**
 * 显示退款申请详情
 */
function displayRefundDetails() {
    if (!refundRequest) {
        return;
    }
    
    // 显示详情区域
    document.getElementById('refund-details').classList.remove('d-none');
    
    // 填充基本信息
    document.getElementById('refund-id').textContent = refundRequest.id;
    document.getElementById('order-id').textContent = refundRequest.orderId;
    document.getElementById('transaction-id').textContent = refundRequest.transactionId;
    document.getElementById('created-time').textContent = formatDate(refundRequest.createdAt);
    document.getElementById('refund-amount').textContent = `¥${refundRequest.amount}`;
    
    // 设置状态
    const statusElement = document.getElementById('refund-status');
    statusElement.textContent = getRefundStatusText(refundRequest.status);
    statusElement.className = getRefundStatusClass(refundRequest.status);
    
    document.getElementById('updated-time').textContent = formatDate(refundRequest.updatedAt);
    document.getElementById('contact-info').textContent = refundRequest.contactInfo || '未提供';
    document.getElementById('refund-reason').textContent = refundRequest.reason;
    
    // 显示审核信息（如果有）
    if (refundRequest.reviewedAt) {
        document.getElementById('review-info').classList.remove('d-none');
        document.getElementById('review-time').textContent = formatDate(refundRequest.reviewedAt);
        document.getElementById('review-result').textContent = refundRequest.status === 'rejected' ? '拒绝' : '通过';
        document.getElementById('review-comment').textContent = refundRequest.reviewComment || '无';
    } else {
        document.getElementById('review-info').classList.add('d-none');
    }
}

/**
 * 显示交易详情
 */
function displayTransactionDetails() {
    // 隐藏加载状态
    document.getElementById('transaction-loading').classList.add('d-none');
    
    if (!transactionData || !transactionData.transaction) {
        // 如果没有交易数据，显示提示信息
        const transactionDetails = document.getElementById('transaction-details');
        transactionDetails.classList.remove('d-none');
        transactionDetails.innerHTML = '<div class="alert alert-warning">未找到相关交易记录</div>';
        return;
    }
    
    // 显示详情区域
    document.getElementById('transaction-details').classList.remove('d-none');
    
    const transaction = transactionData.transaction;
    
    // 填充交易信息
    document.getElementById('tx-id').textContent = transaction.id;
    document.getElementById('tx-order-id').textContent = transaction.orderId;
    document.getElementById('tx-amount').textContent = `¥${transaction.amount}`;
    document.getElementById('tx-payment-method').textContent = getPaymentMethodText(transaction.paymentMethod);
    document.getElementById('tx-status').textContent = getTransactionStatusText(transaction.status);
    document.getElementById('tx-time').textContent = formatDate(transaction.createdAt);
    document.getElementById('tx-membership').textContent = getMembershipName(transaction.membershipId);
    document.getElementById('tx-description').textContent = transaction.description || '无';
}

/**
 * 更新退款进度
 */
function updateRefundProgress() {
    if (!refundRequest) {
        return;
    }
    
    // 提交申请
    const stepSubmitted = document.getElementById('step-submitted');
    stepSubmitted.classList.add('active');
    document.getElementById('submitted-date').textContent = formatDate(refundRequest.createdAt);
    
    // 审核中
    const stepReviewing = document.getElementById('step-reviewing');
    if (refundRequest.status !== 'pending') {
        stepReviewing.classList.add('active');
        document.getElementById('reviewing-date').textContent = formatDate(refundRequest.reviewedAt || refundRequest.updatedAt);
    }
    
    // 审核通过
    const stepApproved = document.getElementById('step-approved');
    if (refundRequest.status === 'approved' || refundRequest.status === 'refunded') {
        stepApproved.classList.add('active');
        document.getElementById('approved-date').textContent = formatDate(refundRequest.reviewedAt || refundRequest.updatedAt);
    }
    
    // 退款完成
    const stepRefunded = document.getElementById('step-refunded');
    if (refundRequest.status === 'refunded') {
        stepRefunded.classList.add('active');
        document.getElementById('refunded-date').textContent = formatDate(refundRequest.updatedAt);
    }
}

/**
 * 获取退款状态文本
 * @param {string} status - 退款状态
 * @returns {string} - 状态文本
 */
function getRefundStatusText(status) {
    const statusMap = {
        'pending': '待审核',
        'approved': '已批准',
        'rejected': '已拒绝',
        'refunded': '已退款',
        'refund_failed': '退款失败'
    };
    
    return statusMap[status] || status;
}

/**
 * 获取退款状态CSS类
 * @param {string} status - 退款状态
 * @returns {string} - CSS类
 */
function getRefundStatusClass(status) {
    const classMap = {
        'pending': 'badge badge-warning',
        'approved': 'badge badge-info',
        'rejected': 'badge badge-danger',
        'refunded': 'badge badge-success',
        'refund_failed': 'badge badge-danger'
    };
    
    return classMap[status] || '';
}

/**
 * 获取支付方式文本
 * @param {string} method - 支付方式
 * @returns {string} - 支付方式文本
 */
function getPaymentMethodText(method) {
    const methodMap = {
        'alipay': '支付宝',
        'wechat': '微信支付',
        'paypal': 'PayPal',
        'stripe': '信用卡'
    };
    
    return methodMap[method] || method;
}

/**
 * 获取交易状态文本
 * @param {string} status - 交易状态
 * @returns {string} - 状态文本
 */
function getTransactionStatusText(status) {
    const statusMap = {
        'created': '已创建',
        'pending': '处理中',
        'paid': '已支付',
        'success': '成功',
        'failed': '失败',
        'refunded': '已退款',
        'closed': '已关闭'
    };
    
    return statusMap[status] || status;
}

/**
 * 获取会员计划名称
 * @param {string} membershipId - 会员计划ID
 * @returns {string} - 会员计划名称
 */
function getMembershipName(membershipId) {
    const membershipMap = {
        'free': '免费用户',
        'basic': '基础会员',
        'professional': '专业会员',
        'enterprise': '企业会员',
        'founder': '创始会员'
    };
    
    return membershipMap[membershipId] || membershipId;
}

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} - 格式化后的日期
 */
function formatDate(dateString) {
    if (!dateString) {
        return '-';
    }
    
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showErrorMessage(message) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        return;
    }
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.role = 'alert';
    
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    alertContainer.appendChild(alert);
    
    // 5秒后自动关闭
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alertContainer.removeChild(alert);
        }, 150);
    }, 5000);
}
