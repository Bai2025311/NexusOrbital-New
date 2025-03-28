/**
 * NexusOrbital 自动续费管理
 * 处理自动续费的显示、启用和禁用
 */

// 全局变量
let currentRenewals = [];
let cancelRenewalId = null;
let cancelMembershipId = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查用户登录状态
    checkLoginStatus();
    
    // 加载自动续费信息
    loadAutoRenewals();
    
    // 加载自动续费日志
    loadRenewalLogs();
    
    // 绑定取消自动续费确认按钮事件
    document.getElementById('confirmCancelBtn').addEventListener('click', confirmCancelRenewal);
});

/**
 * 检查用户登录状态
 */
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) {
        // 未登录，跳转到登录页
        window.location.href = 'login.html';
        return;
    }
    
    // 显示当前用户
    document.getElementById('currentUser').textContent = user.name || '用户';
    
    // 绑定退出登录按钮
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
}

/**
 * 加载自动续费信息
 */
async function loadAutoRenewals() {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            showError('请先登录');
            return;
        }
        
        // 发送请求获取自动续费信息
        const response = await fetch('/api/auto-renewal/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showError(result.error || '加载自动续费信息失败');
            return;
        }
        
        // 保存当前续费信息
        currentRenewals = result.data || [];
        
        // 显示自动续费信息
        renderRenewals(currentRenewals);
    } catch (error) {
        console.error('加载自动续费信息失败:', error);
        showError('加载自动续费信息失败，请稍后再试');
    }
}

/**
 * 渲染自动续费信息
 * @param {Array} renewals - 自动续费信息数组
 */
function renderRenewals(renewals) {
    const renewalsListElement = document.getElementById('renewalsList');
    const noRenewalsElement = document.getElementById('noRenewals');
    
    // 清空现有内容
    renewalsListElement.innerHTML = '';
    
    if (!renewals || renewals.length === 0) {
        // 显示无自动续费提示
        renewalsListElement.classList.add('d-none');
        noRenewalsElement.classList.remove('d-none');
        return;
    }
    
    // 隐藏无自动续费提示
    renewalsListElement.classList.remove('d-none');
    noRenewalsElement.classList.add('d-none');
    
    // 创建自动续费卡片
    renewals.forEach(renewal => {
        const renewalCard = createRenewalCard(renewal);
        renewalsListElement.appendChild(renewalCard);
    });
}

/**
 * 创建自动续费卡片
 * @param {Object} renewal - 自动续费信息
 * @returns {HTMLElement} - 自动续费卡片元素
 */
function createRenewalCard(renewal) {
    const isActive = renewal.status === 'active';
    
    // 创建卡片元素
    const card = document.createElement('div');
    card.className = `card renewal-card ${isActive ? 'active' : 'disabled'}`;
    card.dataset.renewalId = renewal.id;
    card.dataset.membershipId = renewal.membershipId;
    
    // 格式化日期
    const nextRenewalDate = new Date(renewal.nextRenewalDate);
    const formattedNextRenewalDate = nextRenewalDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // 支付方式图标
    const paymentMethodIcons = {
        'alipay': 'alipay-icon.png',
        'wechat': 'wechat-icon.png',
        'paypal': 'paypal-icon.png',
        'stripe': 'stripe-icon.png'
    };
    
    const paymentMethodIcon = paymentMethodIcons[renewal.paymentMethod] || 'default-payment-icon.png';
    
    // 卡片内容
    card.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">${renewal.membershipName}</h5>
            <span class="badge ${isActive ? 'bg-success' : 'bg-danger'}">${isActive ? '已启用' : '已禁用'}</span>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <p class="mb-2"><strong>会员价格:</strong> ¥${renewal.membershipPrice.toFixed(2)}</p>
                    <p class="mb-2"><strong>会员期限:</strong> ${renewal.membershipDuration}天</p>
                    <p class="mb-2">
                        <strong>支付方式:</strong>
                        <img src="images/${paymentMethodIcon}" alt="${renewal.paymentMethod}" class="payment-method-icon">
                        ${getPaymentMethodName(renewal.paymentMethod)}
                    </p>
                </div>
                <div class="col-md-6">
                    <p class="mb-2"><strong>下次续费日期:</strong> ${formattedNextRenewalDate}</p>
                    <p class="mb-2"><strong>创建时间:</strong> ${new Date(renewal.createdAt).toLocaleDateString('zh-CN')}</p>
                    <p class="mb-2"><strong>更新时间:</strong> ${new Date(renewal.updatedAt).toLocaleDateString('zh-CN')}</p>
                </div>
            </div>
            <div class="mt-3 text-end">
                ${isActive ? `
                    <button class="btn btn-outline-danger cancel-renewal-btn" data-renewal-id="${renewal.id}" data-membership-id="${renewal.membershipId}" data-membership-name="${renewal.membershipName}">
                        取消自动续费
                    </button>
                ` : `
                    <button class="btn btn-outline-success enable-renewal-btn" data-renewal-id="${renewal.id}" data-membership-id="${renewal.membershipId}">
                        启用自动续费
                    </button>
                `}
            </div>
        </div>
    `;
    
    // 绑定按钮事件
    setTimeout(() => {
        const cancelBtn = card.querySelector('.cancel-renewal-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                showCancelConfirmation(
                    this.dataset.renewalId,
                    this.dataset.membershipId,
                    this.dataset.membershipName
                );
            });
        }
        
        const enableBtn = card.querySelector('.enable-renewal-btn');
        if (enableBtn) {
            enableBtn.addEventListener('click', function() {
                enableAutoRenewal(this.dataset.membershipId);
            });
        }
    }, 0);
    
    return card;
}

/**
 * 获取支付方式名称
 * @param {string} method - 支付方式代码
 * @returns {string} - 支付方式名称
 */
function getPaymentMethodName(method) {
    const methodNames = {
        'alipay': '支付宝',
        'wechat': '微信支付',
        'paypal': 'PayPal',
        'stripe': '信用卡'
    };
    
    return methodNames[method] || method;
}

/**
 * 显示取消自动续费确认对话框
 * @param {string} renewalId - 自动续费ID
 * @param {string} membershipId - 会员ID
 * @param {string} membershipName - 会员名称
 */
function showCancelConfirmation(renewalId, membershipId, membershipName) {
    // 保存当前要取消的自动续费ID和会员ID
    cancelRenewalId = renewalId;
    cancelMembershipId = membershipId;
    
    // 设置会员名称
    document.getElementById('cancelMembershipName').textContent = membershipName;
    
    // 显示确认对话框
    const modal = new bootstrap.Modal(document.getElementById('cancelRenewalModal'));
    modal.show();
}

/**
 * 确认取消自动续费
 */
async function confirmCancelRenewal() {
    try {
        if (!cancelMembershipId) {
            showError('无效的会员ID');
            return;
        }
        
        const token = localStorage.getItem('token');
        
        if (!token) {
            showError('请先登录');
            return;
        }
        
        // 显示加载状态
        const confirmBtn = document.getElementById('confirmCancelBtn');
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 处理中...';
        
        // 发送请求取消自动续费
        const response = await fetch('/api/auto-renewal/disable', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                membershipId: cancelMembershipId
            })
        });
        
        const result = await response.json();
        
        // 恢复按钮状态
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('cancelRenewalModal'));
        modal.hide();
        
        if (!result.success) {
            showError(result.error || '取消自动续费失败');
            return;
        }
        
        // 显示成功消息
        showSuccess('已成功取消自动续费');
        
        // 重新加载自动续费信息
        loadAutoRenewals();
        
        // 重新加载自动续费日志
        loadRenewalLogs();
    } catch (error) {
        console.error('取消自动续费失败:', error);
        showError('取消自动续费失败，请稍后再试');
        
        // 恢复按钮状态
        const confirmBtn = document.getElementById('confirmCancelBtn');
        confirmBtn.disabled = false;
        confirmBtn.textContent = '确认取消';
    }
}

/**
 * 启用自动续费
 * @param {string} membershipId - 会员ID
 */
async function enableAutoRenewal(membershipId) {
    try {
        if (!membershipId) {
            showError('无效的会员ID');
            return;
        }
        
        const token = localStorage.getItem('token');
        
        if (!token) {
            showError('请先登录');
            return;
        }
        
        // 获取支付方式（实际应用中应该让用户选择）
        // 这里简化处理，使用默认支付方式
        const paymentMethod = 'alipay';
        
        // 发送请求启用自动续费
        const response = await fetch('/api/auto-renewal/enable', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                membershipId,
                paymentMethod
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showError(result.error || '启用自动续费失败');
            return;
        }
        
        // 显示成功消息
        showSuccess('已成功启用自动续费');
        
        // 重新加载自动续费信息
        loadAutoRenewals();
        
        // 重新加载自动续费日志
        loadRenewalLogs();
    } catch (error) {
        console.error('启用自动续费失败:', error);
        showError('启用自动续费失败，请稍后再试');
    }
}

/**
 * 加载自动续费日志
 */
async function loadRenewalLogs() {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            return;
        }
        
        // 发送请求获取自动续费日志
        const response = await fetch('/api/auto-renewal/logs', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            document.getElementById('renewalLogs').innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">加载日志失败</p>
                </div>
            `;
            return;
        }
        
        // 渲染自动续费日志
        renderRenewalLogs(result.data || []);
    } catch (error) {
        console.error('加载自动续费日志失败:', error);
        document.getElementById('renewalLogs').innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted">加载日志失败，请稍后再试</p>
            </div>
        `;
    }
}

/**
 * 渲染自动续费日志
 * @param {Array} logs - 日志数组
 */
function renderRenewalLogs(logs) {
    const logsElement = document.getElementById('renewalLogs');
    
    if (!logs || logs.length === 0) {
        logsElement.innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted">暂无自动续费日志</p>
            </div>
        `;
        return;
    }
    
    // 创建日志列表
    let logsHtml = '';
    
    logs.forEach(log => {
        const logDate = new Date(log.timestamp);
        const formattedDate = logDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // 根据操作类型和状态设置样式
        let actionText = '';
        let statusBadge = '';
        
        switch (log.action) {
            case 'enable':
                actionText = '启用自动续费';
                break;
            case 'update':
                actionText = '更新自动续费';
                break;
            case 'disable':
                actionText = '禁用自动续费';
                break;
            case 'renewal':
                actionText = '执行自动续费';
                break;
            case 'reminder':
                actionText = '续费提醒';
                break;
            default:
                actionText = log.action;
        }
        
        if (log.status === 'success') {
            statusBadge = '<span class="badge bg-success">成功</span>';
        } else if (log.status === 'failed') {
            statusBadge = '<span class="badge bg-danger">失败</span>';
        } else {
            statusBadge = `<span class="badge bg-secondary">${log.status}</span>`;
        }
        
        // 创建日志项
        logsHtml += `
            <div class="log-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${actionText}</strong> ${statusBadge}
                    </div>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                ${log.amount ? `<div class="mt-1">金额: ¥${log.amount.toFixed(2)}</div>` : ''}
                ${log.orderId ? `<div class="mt-1">订单ID: ${log.orderId}</div>` : ''}
                ${log.error ? `<div class="mt-1 text-danger">错误: ${log.error}</div>` : ''}
            </div>
        `;
    });
    
    logsElement.innerHTML = logsHtml;
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showError(message) {
    // 创建提示元素
    const alertElement = document.createElement('div');
    alertElement.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    alertElement.style.zIndex = '9999';
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // 添加到页面
    document.body.appendChild(alertElement);
    
    // 3秒后自动关闭
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertElement);
        bsAlert.close();
    }, 3000);
}

/**
 * 显示成功消息
 * @param {string} message - 成功消息
 */
function showSuccess(message) {
    // 创建提示元素
    const alertElement = document.createElement('div');
    alertElement.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    alertElement.style.zIndex = '9999';
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // 添加到页面
    document.body.appendChild(alertElement);
    
    // 3秒后自动关闭
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertElement);
        bsAlert.close();
    }, 3000);
}
