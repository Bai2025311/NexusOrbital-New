/**
 * NexusOrbital 退款管理
 * 处理退款申请和查询
 */

// 全局变量
let currentUser = null;
let userTransactions = [];
let userRefundRequests = [];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查用户登录状态
    checkLoginStatus();
    
    // 绑定事件
    bindEvents();
    
    // 加载交易记录
    loadUserTransactions();
    
    // 加载退款申请记录
    loadUserRefundRequests();
});

/**
 * 检查用户登录状态
 */
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // 未登录，跳转到登录页
        window.location.href = 'login.html?redirect=refund.html';
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
            window.location.href = 'login.html?redirect=refund.html';
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
 * 绑定事件
 */
function bindEvents() {
    // 绑定退款申请表单提交事件
    const refundForm = document.getElementById('refund-form');
    if (refundForm) {
        refundForm.addEventListener('submit', handleRefundSubmit);
    }
    
    // 绑定交易选择事件
    const transactionSelect = document.getElementById('transaction-id');
    if (transactionSelect) {
        transactionSelect.addEventListener('change', handleTransactionSelect);
    }
}

/**
 * 加载用户交易记录
 */
function loadUserTransactions() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return;
    }
    
    // 显示加载状态
    const transactionSelect = document.getElementById('transaction-id');
    if (transactionSelect) {
        transactionSelect.innerHTML = '<option value="">加载中...</option>';
    }
    
    fetch('/api/payment/transactions?status=paid', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            userTransactions = data.data;
            updateTransactionSelect();
        } else {
            showErrorMessage('加载交易记录失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('加载交易记录失败:', error);
        showErrorMessage('加载交易记录失败，请刷新页面重试');
    });
}

/**
 * 更新交易选择下拉框
 */
function updateTransactionSelect() {
    const transactionSelect = document.getElementById('transaction-id');
    if (!transactionSelect) {
        return;
    }
    
    // 清空选项
    transactionSelect.innerHTML = '';
    
    // 添加默认选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请选择交易记录';
    transactionSelect.appendChild(defaultOption);
    
    // 添加交易记录选项
    if (userTransactions.length === 0) {
        const noDataOption = document.createElement('option');
        noDataOption.value = '';
        noDataOption.textContent = '没有可退款的交易记录';
        noDataOption.disabled = true;
        transactionSelect.appendChild(noDataOption);
    } else {
        userTransactions.forEach(transaction => {
            const option = document.createElement('option');
            option.value = transaction.id;
            option.dataset.orderId = transaction.orderId;
            option.dataset.amount = transaction.amount;
            option.textContent = `${transaction.description} - ¥${transaction.amount} - ${formatDate(transaction.createdAt)}`;
            transactionSelect.appendChild(option);
        });
    }
}

/**
 * 处理交易选择事件
 */
function handleTransactionSelect() {
    const transactionSelect = document.getElementById('transaction-id');
    const amountInput = document.getElementById('refund-amount');
    const orderIdInput = document.getElementById('order-id');
    
    if (!transactionSelect || !amountInput || !orderIdInput) {
        return;
    }
    
    const selectedOption = transactionSelect.options[transactionSelect.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        // 设置退款金额和订单ID
        amountInput.value = selectedOption.dataset.amount || '';
        orderIdInput.value = selectedOption.dataset.orderId || '';
    } else {
        // 清空退款金额和订单ID
        amountInput.value = '';
        orderIdInput.value = '';
    }
}

/**
 * 处理退款申请提交
 * @param {Event} event - 表单提交事件
 */
function handleRefundSubmit(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showErrorMessage('您需要登录才能申请退款');
        return;
    }
    
    // 获取表单数据
    const form = event.target;
    const orderId = form.elements['order-id'].value;
    const transactionId = form.elements['transaction-id'].value;
    const amount = parseFloat(form.elements['refund-amount'].value);
    const reason = form.elements['refund-reason'].value;
    const contactInfo = form.elements['contact-info'].value;
    
    // 验证表单数据
    if (!orderId) {
        showErrorMessage('订单ID不能为空');
        return;
    }
    
    if (!transactionId) {
        showErrorMessage('请选择要退款的交易记录');
        return;
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
        showErrorMessage('请输入有效的退款金额');
        return;
    }
    
    if (!reason) {
        showErrorMessage('请输入退款原因');
        return;
    }
    
    // 显示加载状态
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '提交中...';
    
    // 提交退款申请
    fetch('/api/refund/request', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            orderId,
            transactionId,
            amount,
            reason,
            contactInfo
        })
    })
    .then(response => response.json())
    .then(data => {
        // 恢复按钮状态
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        
        if (data.success) {
            // 显示成功消息
            showSuccessMessage('退款申请已提交，请等待审核');
            
            // 重置表单
            form.reset();
            
            // 重新加载退款申请记录
            loadUserRefundRequests();
        } else {
            showErrorMessage('退款申请提交失败: ' + data.error);
        }
    })
    .catch(error => {
        // 恢复按钮状态
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        
        console.error('退款申请提交失败:', error);
        showErrorMessage('退款申请提交失败，请稍后重试');
    });
}

/**
 * 加载用户退款申请记录
 */
function loadUserRefundRequests() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return;
    }
    
    // 显示加载状态
    const refundList = document.getElementById('refund-list');
    if (refundList) {
        refundList.innerHTML = '<tr><td colspan="6" class="text-center">加载中...</td></tr>';
    }
    
    fetch('/api/refund/user', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            userRefundRequests = data.data;
            updateRefundRequestsList();
        } else {
            showErrorMessage('加载退款申请记录失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('加载退款申请记录失败:', error);
        showErrorMessage('加载退款申请记录失败，请刷新页面重试');
    });
}

/**
 * 更新退款申请记录列表
 */
function updateRefundRequestsList() {
    const refundList = document.getElementById('refund-list');
    if (!refundList) {
        return;
    }
    
    // 清空列表
    refundList.innerHTML = '';
    
    // 添加退款申请记录
    if (userRefundRequests.length === 0) {
        refundList.innerHTML = '<tr><td colspan="6" class="text-center">暂无退款申请记录</td></tr>';
    } else {
        userRefundRequests.forEach(request => {
            const row = document.createElement('tr');
            
            // 申请ID
            const idCell = document.createElement('td');
            idCell.textContent = request.id;
            row.appendChild(idCell);
            
            // 订单ID
            const orderIdCell = document.createElement('td');
            orderIdCell.textContent = request.orderId;
            row.appendChild(orderIdCell);
            
            // 退款金额
            const amountCell = document.createElement('td');
            amountCell.textContent = `¥${request.amount}`;
            row.appendChild(amountCell);
            
            // 申请时间
            const timeCell = document.createElement('td');
            timeCell.textContent = formatDate(request.createdAt);
            row.appendChild(timeCell);
            
            // 状态
            const statusCell = document.createElement('td');
            statusCell.textContent = getRefundStatusText(request.status);
            statusCell.className = getRefundStatusClass(request.status);
            row.appendChild(statusCell);
            
            // 操作
            const actionCell = document.createElement('td');
            const detailLink = document.createElement('a');
            detailLink.href = `refund-detail.html?id=${request.id}`;
            detailLink.className = 'btn btn-sm btn-primary';
            detailLink.textContent = '查看详情';
            actionCell.appendChild(detailLink);
            row.appendChild(actionCell);
            
            refundList.appendChild(row);
        });
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
        'pending': 'text-warning',
        'approved': 'text-info',
        'rejected': 'text-danger',
        'refunded': 'text-success',
        'refund_failed': 'text-danger'
    };
    
    return classMap[status] || '';
}

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} - 格式化后的日期
 */
function formatDate(dateString) {
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

/**
 * 显示成功消息
 * @param {string} message - 成功消息
 */
function showSuccessMessage(message) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        return;
    }
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show';
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
