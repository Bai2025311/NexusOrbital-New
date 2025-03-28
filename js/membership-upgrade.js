/**
 * NexusOrbital 会员升级/降级管理
 * 处理会员等级变更的显示和操作
 */

// 全局变量
let memberships = [];
let currentMembership = null;
let selectedMembershipId = null;
let pricePreview = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查用户登录状态
    checkLoginStatus();
    
    // 加载会员信息
    loadMemberships();
    
    // 加载会员变更日志
    loadUpgradeLogs();
    
    // 绑定确认按钮事件
    document.getElementById('confirmUpgradeBtn').addEventListener('click', showConfirmModal);
    
    // 绑定最终确认按钮事件
    document.getElementById('finalConfirmBtn').addEventListener('click', executeMembershipChange);
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
    
    // 显示当前会员信息
    if (user.membership) {
        document.getElementById('currentMembershipName').textContent = user.membership.name || '无会员';
        
        const expiryDate = user.membership.expiryDate ? new Date(user.membership.expiryDate) : null;
        
        if (expiryDate) {
            // 格式化到期时间
            const formattedExpiry = expiryDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            document.getElementById('currentMembershipExpiry').textContent = formattedExpiry;
            
            // 检查会员是否已过期
            if (expiryDate < new Date()) {
                document.getElementById('membershipStatus').className = 'badge bg-danger';
                document.getElementById('membershipStatus').textContent = '已过期';
            }
        } else {
            document.getElementById('currentMembershipExpiry').textContent = '无到期时间';
        }
        
        // 保存当前会员信息
        currentMembership = user.membership;
    } else {
        document.getElementById('currentMembershipName').textContent = '无会员';
        document.getElementById('currentMembershipExpiry').textContent = '无';
        document.getElementById('membershipStatus').className = 'badge bg-secondary';
        document.getElementById('membershipStatus').textContent = '无会员';
    }
}

/**
 * 加载会员信息
 */
async function loadMemberships() {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            showError('请先登录');
            return;
        }
        
        // 发送请求获取会员信息
        const response = await fetch('/api/memberships', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showError(result.error || '加载会员信息失败');
            return;
        }
        
        // 保存会员信息
        memberships = result.data.memberships || [];
        
        // 显示会员信息
        renderMemberships(memberships);
    } catch (error) {
        console.error('加载会员信息失败:', error);
        showError('加载会员信息失败，请稍后再试');
    }
}

/**
 * 渲染会员信息
 * @param {Array} memberships - 会员信息数组
 */
function renderMemberships(memberships) {
    const membershipsListElement = document.getElementById('membershipsList');
    
    // 清空现有内容
    membershipsListElement.innerHTML = '';
    
    if (!memberships || memberships.length === 0) {
        membershipsListElement.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    暂无可用的会员类型
                </div>
            </div>
        `;
        return;
    }
    
    // 创建会员卡片
    memberships.forEach(membership => {
        const membershipCard = createMembershipCard(membership);
        membershipsListElement.appendChild(membershipCard);
    });
}

/**
 * 创建会员卡片
 * @param {Object} membership - 会员信息
 * @returns {HTMLElement} - 会员卡片元素
 */
function createMembershipCard(membership) {
    // 创建卡片容器
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    
    // 判断是否是当前会员
    const isCurrent = currentMembership && currentMembership.id === membership.id;
    
    // 判断是否是推荐会员（简单逻辑：比当前会员高一级的会员）
    let isRecommended = false;
    if (currentMembership && memberships.length > 1) {
        const currentIndex = memberships.findIndex(m => m.id === currentMembership.id);
        if (currentIndex !== -1 && currentIndex + 1 < memberships.length) {
            isRecommended = membership.id === memberships[currentIndex + 1].id;
        }
    }
    
    // 卡片类名
    let cardClass = 'card membership-card';
    if (isCurrent) {
        cardClass += ' current';
    } else if (isRecommended) {
        cardClass += ' recommended';
    }
    
    // 会员特权
    const features = membership.features || [
        '基础功能访问',
        '标准客户支持',
        '无广告体验'
    ];
    
    let featuresHtml = '';
    features.forEach(feature => {
        featuresHtml += `
            <div class="membership-feature">
                <span class="feature-icon">✓</span>
                ${feature}
            </div>
        `;
    });
    
    // 卡片内容
    col.innerHTML = `
        <div class="${cardClass}" data-membership-id="${membership.id}">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">${membership.name}</h5>
                ${isCurrent ? '<span class="badge bg-light text-dark">当前</span>' : ''}
                ${isRecommended ? '<span class="badge bg-warning text-dark">推荐</span>' : ''}
            </div>
            <div class="card-body">
                <div class="text-center mb-3">
                    <h3 class="mb-0">¥${membership.price.toFixed(2)}</h3>
                    <small class="text-muted">${membership.duration}天</small>
                </div>
                <div class="mb-3">
                    ${featuresHtml}
                </div>
                <div class="text-center">
                    ${isCurrent ? 
                        '<button class="btn btn-outline-secondary" disabled>当前会员</button>' : 
                        `<button class="btn btn-primary select-membership-btn" data-membership-id="${membership.id}">选择</button>`
                    }
                </div>
            </div>
        </div>
    `;
    
    // 绑定选择按钮事件
    setTimeout(() => {
        const selectBtn = col.querySelector('.select-membership-btn');
        if (selectBtn) {
            selectBtn.addEventListener('click', function() {
                selectMembership(this.dataset.membershipId);
            });
        }
    }, 0);
    
    return col;
}

/**
 * 选择会员
 * @param {string} membershipId - 会员ID
 */
async function selectMembership(membershipId) {
    try {
        if (!membershipId) {
            showError('无效的会员ID');
            return;
        }
        
        // 如果选择的是当前会员，不做处理
        if (currentMembership && currentMembership.id === membershipId) {
            showError('您已经是该会员，无需变更');
            return;
        }
        
        const token = localStorage.getItem('token');
        
        if (!token) {
            showError('请先登录');
            return;
        }
        
        // 保存选中的会员ID
        selectedMembershipId = membershipId;
        
        // 高亮显示选中的会员卡片
        const cards = document.querySelectorAll('.membership-card');
        cards.forEach(card => {
            if (card.dataset.membershipId === membershipId) {
                card.classList.add('border-primary');
            } else {
                card.classList.remove('border-primary');
            }
        });
        
        // 显示加载状态
        document.getElementById('priceCalculation').innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <p class="mt-2">正在计算价格...</p>
            </div>
        `;
        document.getElementById('priceCalculation').classList.remove('d-none');
        
        // 发送请求获取价格预览
        const response = await fetch(`/api/membership-upgrade/preview?targetMembershipId=${membershipId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            showError(result.error || '获取价格预览失败');
            document.getElementById('priceCalculation').classList.add('d-none');
            return;
        }
        
        // 保存价格预览
        pricePreview = result.data;
        
        // 显示价格计算
        renderPriceCalculation(pricePreview);
    } catch (error) {
        console.error('选择会员失败:', error);
        showError('选择会员失败，请稍后再试');
        document.getElementById('priceCalculation').classList.add('d-none');
    }
}

/**
 * 渲染价格计算
 * @param {Object} priceData - 价格数据
 */
function renderPriceCalculation(priceData) {
    // 获取目标会员信息
    const targetMembership = memberships.find(m => m.id === priceData.targetMembershipId);
    
    if (!targetMembership) {
        showError('无法获取目标会员信息');
        document.getElementById('priceCalculation').classList.add('d-none');
        return;
    }
    
    // 恢复价格计算区域
    document.getElementById('priceCalculation').innerHTML = `
        <h4 class="mb-3">价格计算</h4>
        <div class="price-section">
            <div class="price-breakdown d-flex justify-content-between">
                <span>目标会员价格</span>
                <span id="targetPrice">¥${targetMembership.price.toFixed(2)}</span>
            </div>
            <div class="price-breakdown d-flex justify-content-between">
                <span>当前会员剩余价值</span>
                <span id="remainingValue">-¥${priceData.remainingValue.toFixed(2)}</span>
            </div>
            <div class="price-breakdown d-flex justify-content-between">
                <span>剩余天数</span>
                <span id="daysRemaining">${priceData.daysRemaining}天</span>
            </div>
            <div id="refundSection" class="price-breakdown d-flex justify-content-between ${priceData.refundAmount > 0 ? '' : 'd-none'}">
                <span>可退款金额</span>
                <span id="refundAmount" class="text-success">¥${priceData.refundAmount.toFixed(2)}</span>
            </div>
            <div class="price-breakdown d-flex justify-content-between fw-bold">
                <span>需支付金额</span>
                <span id="finalPrice">¥${priceData.upgradePrice.toFixed(2)}</span>
            </div>
        </div>
        
        <!-- 支付方式选择 -->
        <div id="paymentMethodSection" class="mb-4 ${priceData.upgradePrice > 0 ? '' : 'd-none'}">
            <h4 class="mb-3">选择支付方式</h4>
            <div class="form-check mb-2">
                <input class="form-check-input" type="radio" name="paymentMethod" id="alipay" value="alipay" checked>
                <label class="form-check-label" for="alipay">
                    支付宝
                </label>
            </div>
            <div class="form-check mb-2">
                <input class="form-check-input" type="radio" name="paymentMethod" id="wechat" value="wechat">
                <label class="form-check-label" for="wechat">
                    微信支付
                </label>
            </div>
            <div class="form-check mb-2">
                <input class="form-check-input" type="radio" name="paymentMethod" id="stripe" value="stripe">
                <label class="form-check-label" for="stripe">
                    信用卡
                </label>
            </div>
        </div>
        
        <!-- 确认按钮 -->
        <div class="text-center mb-4">
            <button id="confirmUpgradeBtn" class="btn btn-primary btn-lg">确认变更</button>
        </div>
    `;
    
    // 重新绑定确认按钮事件
    document.getElementById('confirmUpgradeBtn').addEventListener('click', showConfirmModal);
    
    // 显示价格计算区域
    document.getElementById('priceCalculation').classList.remove('d-none');
}

/**
 * 显示确认模态框
 */
function showConfirmModal() {
    if (!selectedMembershipId || !pricePreview) {
        showError('请先选择会员');
        return;
    }
    
    // 获取目标会员信息
    const targetMembership = memberships.find(m => m.id === selectedMembershipId);
    
    if (!targetMembership) {
        showError('无法获取目标会员信息');
        return;
    }
    
    // 设置确认信息
    document.getElementById('confirmFromMembership').textContent = pricePreview.currentMembershipName || '无会员';
    document.getElementById('confirmToMembership').textContent = targetMembership.name;
    
    // 根据是升级还是降级显示不同信息
    if (pricePreview.isUpgrade) {
        document.getElementById('confirmUpgradeInfo').classList.remove('d-none');
        document.getElementById('confirmDowngradeInfo').classList.add('d-none');
        document.getElementById('confirmFreeChangeInfo').classList.add('d-none');
        document.getElementById('confirmPrice').textContent = `¥${pricePreview.upgradePrice.toFixed(2)}`;
    } else if (pricePreview.isDowngrade && pricePreview.refundAmount > 0) {
        document.getElementById('confirmUpgradeInfo').classList.add('d-none');
        document.getElementById('confirmDowngradeInfo').classList.remove('d-none');
        document.getElementById('confirmFreeChangeInfo').classList.add('d-none');
        document.getElementById('confirmRefund').textContent = `¥${pricePreview.refundAmount.toFixed(2)}`;
    } else {
        document.getElementById('confirmUpgradeInfo').classList.add('d-none');
        document.getElementById('confirmDowngradeInfo').classList.add('d-none');
        document.getElementById('confirmFreeChangeInfo').classList.remove('d-none');
    }
    
    // 显示确认模态框
    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    modal.show();
}

/**
 * 执行会员变更
 */
async function executeMembershipChange() {
    try {
        if (!selectedMembershipId) {
            showError('请先选择会员');
            return;
        }
        
        const token = localStorage.getItem('token');
        
        if (!token) {
            showError('请先登录');
            return;
        }
        
        // 获取支付方式
        let paymentMethod = 'alipay';
        const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethodInputs.forEach(input => {
            if (input.checked) {
                paymentMethod = input.value;
            }
        });
        
        // 显示加载状态
        const confirmBtn = document.getElementById('finalConfirmBtn');
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 处理中...';
        
        // 发送请求执行会员变更
        const response = await fetch('/api/membership-upgrade/execute', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetMembershipId: selectedMembershipId,
                paymentMethod
            })
        });
        
        const result = await response.json();
        
        // 恢复按钮状态
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
        
        // 关闭确认模态框
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        confirmModal.hide();
        
        if (!result.success) {
            showError(result.error || '会员变更失败');
            return;
        }
        
        // 显示成功信息
        let successMessage = '会员变更成功';
        let successDetails = '';
        
        if (result.data.status === 'payment_completed') {
            successMessage = '支付成功';
            successDetails = '会员将在支付确认后更新';
        } else if (result.data.status === 'refund_pending') {
            successMessage = '会员已降级';
            successDetails = `退款金额 ¥${result.data.refundAmount.toFixed(2)} 正在处理中`;
        } else if (result.data.status === 'completed') {
            successMessage = '会员变更成功';
            successDetails = `新会员有效期至 ${new Date(result.data.expiryDate).toLocaleDateString('zh-CN')}`;
        }
        
        document.getElementById('successMessage').textContent = successMessage;
        document.getElementById('successDetails').textContent = successDetails;
        
        // 显示成功模态框
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();
        
        // 重新加载会员变更日志
        loadUpgradeLogs();
        
        // 重新加载用户信息
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    } catch (error) {
        console.error('执行会员变更失败:', error);
        showError('执行会员变更失败，请稍后再试');
        
        // 恢复按钮状态
        const confirmBtn = document.getElementById('finalConfirmBtn');
        confirmBtn.disabled = false;
        confirmBtn.textContent = '确认变更';
    }
}

/**
 * 加载会员变更日志
 */
async function loadUpgradeLogs() {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            return;
        }
        
        // 发送请求获取会员变更日志
        const response = await fetch('/api/membership-upgrade/logs', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (!result.success) {
            document.getElementById('upgradeLogs').innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">加载日志失败</p>
                </div>
            `;
            return;
        }
        
        // 渲染会员变更日志
        renderUpgradeLogs(result.data || []);
    } catch (error) {
        console.error('加载会员变更日志失败:', error);
        document.getElementById('upgradeLogs').innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted">加载日志失败，请稍后再试</p>
            </div>
        `;
    }
}

/**
 * 渲染会员变更日志
 * @param {Array} logs - 日志数组
 */
function renderUpgradeLogs(logs) {
    const logsElement = document.getElementById('upgradeLogs');
    
    if (!logs || logs.length === 0) {
        logsElement.innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted">暂无会员变更日志</p>
            </div>
        `;
        return;
    }
    
    // 创建日志列表
    let logsHtml = '';
    
    logs.forEach(log => {
        const logDate = new Date(log.createdAt);
        const formattedDate = logDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // 根据状态设置样式
        let statusBadge = '';
        switch (log.status) {
            case 'completed':
                statusBadge = '<span class="badge bg-success">成功</span>';
                break;
            case 'pending':
                statusBadge = '<span class="badge bg-warning text-dark">处理中</span>';
                break;
            case 'payment_completed':
                statusBadge = '<span class="badge bg-info">支付成功</span>';
                break;
            case 'refund_pending':
                statusBadge = '<span class="badge bg-info">退款处理中</span>';
                break;
            case 'failed':
                statusBadge = '<span class="badge bg-danger">失败</span>';
                break;
            default:
                statusBadge = `<span class="badge bg-secondary">${log.status}</span>`;
        }
        
        // 创建日志项
        logsHtml += `
            <div class="log-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${log.fromMembershipId || '无会员'} → ${log.toMembershipId}</strong> ${statusBadge}
                    </div>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                ${log.upgradePrice > 0 ? `<div class="mt-1">升级费用: ¥${log.upgradePrice.toFixed(2)}</div>` : ''}
                ${log.refundAmount > 0 ? `<div class="mt-1">退款金额: ¥${log.refundAmount.toFixed(2)}</div>` : ''}
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
