/**
 * 交易记录页面脚本
 * NexusOrbital平台
 */

// 当文档加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化用户界面
    initUserInterface();
    
    // 检查用户登录状态
    checkLoginStatus();
    
    // 加载交易记录
    loadTransactions();
    
    // 设置筛选器事件监听
    setupFilterListeners();
});

/**
 * 初始化用户界面
 */
function initUserInterface() {
    // 获取DOM元素
    const statusFilter = document.getElementById('statusFilter');
    const paymentMethodFilter = document.getElementById('paymentMethodFilter');
    const timeFilter = document.getElementById('timeFilter');
    const transactionTableBody = document.getElementById('transactionTableBody');
    const emptyTransactions = document.getElementById('emptyTransactions');
    const transactionPagination = document.getElementById('transactionPagination');
    const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
    
    // 设置下载收据按钮事件
    if (downloadReceiptBtn) {
        downloadReceiptBtn.addEventListener('click', function() {
            const transactionId = this.dataset.transactionId;
            if (transactionId) {
                downloadReceipt(transactionId);
            }
        });
    }
}

/**
 * 检查用户登录状态
 */
function checkLoginStatus() {
    // 获取用户信息
    const userToken = localStorage.getItem('nexusorbital_token');
    const user = JSON.parse(localStorage.getItem('nexusorbital_user') || '{}');
    
    // 如果用户未登录，重定向到登录页面
    if (!userToken || !user.id) {
        window.location.href = 'login.html?redirect=transaction-history.html';
        return;
    }
    
    // 更新导航栏用户信息
    updateNavbar(user);
}

/**
 * 更新导航栏用户信息
 * @param {Object} user - 用户信息
 */
function updateNavbar(user) {
    const navbarButtons = document.getElementById('navbarButtons');
    const userProfileNav = document.getElementById('userProfileNav');
    const navbarUsername = document.getElementById('navbarUsername');
    const navbarUserAvatar = document.getElementById('navbarUserAvatar');
    const logoutButton = document.getElementById('logoutButton');
    
    if (user && user.id) {
        // 隐藏登录/注册按钮，显示用户信息
        navbarButtons.classList.add('d-none');
        userProfileNav.classList.remove('d-none');
        userProfileNav.classList.add('d-flex');
        
        // 设置用户名和头像
        navbarUsername.textContent = user.username || user.name || '用户';
        if (user.avatar) {
            navbarUserAvatar.src = user.avatar;
        }
        
        // 设置登出按钮事件
        if (logoutButton) {
            logoutButton.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
    } else {
        // 显示登录/注册按钮，隐藏用户信息
        navbarButtons.classList.remove('d-none');
        userProfileNav.classList.add('d-none');
        userProfileNav.classList.remove('d-flex');
    }
}

/**
 * 登出
 */
function logout() {
    // 清除本地存储中的用户信息
    localStorage.removeItem('nexusorbital_token');
    localStorage.removeItem('nexusorbital_user');
    
    // 重定向到首页
    window.location.href = 'index.html';
}

/**
 * 加载交易记录
 * @param {Object} filters - 筛选条件
 * @param {number} page - 页码
 */
async function loadTransactions(filters = {}, page = 1) {
    try {
        // 显示加载中状态
        showLoading();
        
        // 获取用户令牌
        const userToken = localStorage.getItem('nexusorbital_token');
        
        if (!userToken) {
            throw new Error('用户未登录');
        }
        
        // 构建查询参数
        const queryParams = new URLSearchParams({
            page: page,
            limit: 10,
            ...filters
        });
        
        // 从API获取交易记录
        const response = await fetch(`http://localhost:3000/api/transactions?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        // 解析响应
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || '获取交易记录失败');
        }
        
        // 渲染交易记录
        renderTransactions(result.data.transactions, result.data.pagination);
    } catch (error) {
        console.error('加载交易记录失败:', error);
        
        // 如果API请求失败，尝试从本地存储加载交易记录
        loadTransactionsFromLocalStorage(filters, page);
    } finally {
        // 隐藏加载中状态
        hideLoading();
    }
}

/**
 * 从本地存储加载交易记录（备用方案）
 * @param {Object} filters - 筛选条件
 * @param {number} page - 页码
 */
function loadTransactionsFromLocalStorage(filters = {}, page = 1) {
    // 从本地存储获取交易记录
    const transactionsString = localStorage.getItem('nexusorbital_transactions');
    let transactions = [];
    
    if (transactionsString) {
        try {
            transactions = JSON.parse(transactionsString);
        } catch (e) {
            console.error('解析本地交易记录失败:', e);
        }
    }
    
    // 应用筛选器
    let filteredTransactions = transactions;
    
    if (filters.status && filters.status !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.status === filters.status);
    }
    
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.paymentMethod === filters.paymentMethod);
    }
    
    if (filters.timeFilter && filters.timeFilter !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (filters.timeFilter) {
            case 'last7days':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'last30days':
                startDate = new Date(now.setDate(now.getDate() - 30));
                break;
            case 'last3months':
                startDate = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case 'last6months':
                startDate = new Date(now.setMonth(now.getMonth() - 6));
                break;
            case 'lastyear':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
        }
        
        if (startDate) {
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= startDate);
        }
    }
    
    // 分页
    const limit = 10;
    const total = filteredTransactions.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);
    
    // 渲染交易记录
    renderTransactions(paginatedTransactions, {
        currentPage: page,
        totalPages: totalPages,
        totalItems: total,
        limit: limit
    });
}

/**
 * 渲染交易记录
 * @param {Array} transactions - 交易记录数组
 * @param {Object} pagination - 分页信息
 */
function renderTransactions(transactions, pagination) {
    const transactionTableBody = document.getElementById('transactionTableBody');
    const emptyTransactions = document.getElementById('emptyTransactions');
    const transactionPagination = document.getElementById('transactionPagination');
    
    // 清空表格内容
    transactionTableBody.innerHTML = '';
    
    // 如果没有交易记录，显示空状态
    if (!transactions || transactions.length === 0) {
        transactionTableBody.parentElement.classList.add('d-none');
        emptyTransactions.classList.remove('d-none');
        transactionPagination.innerHTML = '';
        return;
    }
    
    // 显示交易表格，隐藏空状态
    transactionTableBody.parentElement.classList.remove('d-none');
    emptyTransactions.classList.add('d-none');
    
    // 渲染每条交易记录
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // 格式化日期
        const date = new Date(transaction.date);
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        // 格式化支付方式
        const paymentMethodMap = {
            'alipay': '支付宝',
            'wechat': '微信支付',
            'creditcard': '信用卡'
        };
        
        // 格式化状态
        const statusMap = {
            'completed': '<span class="transaction-status completed">已完成</span>',
            'pending': '<span class="transaction-status pending">处理中</span>',
            'failed': '<span class="transaction-status failed">失败</span>'
        };
        
        // 设置行内容
        row.innerHTML = `
            <td>${transaction.transactionId}</td>
            <td>${formattedDate}</td>
            <td>${transaction.description}</td>
            <td class="transaction-amount">¥${transaction.amount.toFixed(2)}</td>
            <td>${paymentMethodMap[transaction.paymentMethod] || transaction.paymentMethod}</td>
            <td>${statusMap[transaction.status] || transaction.status}</td>
            <td>
                <button class="transaction-details-btn" data-bs-toggle="modal" data-bs-target="#transactionDetailModal" data-transaction-id="${transaction.transactionId}">
                    查看详情
                </button>
            </td>
        `;
        
        // 添加行点击事件
        row.querySelector('.transaction-details-btn').addEventListener('click', function() {
            showTransactionDetails(transaction);
        });
        
        // 将行添加到表格
        transactionTableBody.appendChild(row);
    });
    
    // 渲染分页
    renderPagination(pagination);
}

/**
 * 渲染分页
 * @param {Object} pagination - 分页信息
 */
function renderPagination(pagination) {
    const transactionPagination = document.getElementById('transactionPagination');
    
    // 清空分页内容
    transactionPagination.innerHTML = '';
    
    // 如果只有一页，不显示分页
    if (!pagination || pagination.totalPages <= 1) {
        return;
    }
    
    // 创建上一页按钮
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${pagination.currentPage - 1}">上一页</a>`;
    transactionPagination.appendChild(prevLi);
    
    // 创建页码按钮
    const maxPages = 5; // 最多显示5个页码
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === pagination.currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        transactionPagination.appendChild(pageLi);
    }
    
    // 创建下一页按钮
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${pagination.currentPage + 1}">下一页</a>`;
    transactionPagination.appendChild(nextLi);
    
    // 添加页码点击事件
    transactionPagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = parseInt(this.dataset.page);
            
            if (page && page !== pagination.currentPage) {
                // 获取当前筛选条件
                const filters = getCurrentFilters();
                
                // 加载指定页的交易记录
                loadTransactions(filters, page);
            }
        });
    });
}

/**
 * 显示交易详情
 * @param {Object} transaction - 交易记录
 */
function showTransactionDetails(transaction) {
    // 获取模态框元素
    const detailTransactionId = document.getElementById('detailTransactionId');
    const detailTransactionDate = document.getElementById('detailTransactionDate');
    const detailTransactionDescription = document.getElementById('detailTransactionDescription');
    const detailTransactionAmount = document.getElementById('detailTransactionAmount');
    const detailTransactionPaymentMethod = document.getElementById('detailTransactionPaymentMethod');
    const detailTransactionStatus = document.getElementById('detailTransactionStatus');
    const detailTransactionMembership = document.getElementById('detailTransactionMembership');
    const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
    
    // 格式化日期
    const date = new Date(transaction.date);
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    // 格式化支付方式
    const paymentMethodMap = {
        'alipay': '支付宝',
        'wechat': '微信支付',
        'creditcard': '信用卡'
    };
    
    // 格式化状态
    const statusMap = {
        'completed': '<span class="transaction-status completed">已完成</span>',
        'pending': '<span class="transaction-status pending">处理中</span>',
        'failed': '<span class="transaction-status failed">失败</span>'
    };
    
    // 格式化会员类型
    const membershipMap = {
        'professional': '专业会员计划',
        'enterprise': '企业会员计划',
        'founder': '创始会员计划'
    };
    
    // 设置详情内容
    detailTransactionId.textContent = transaction.transactionId;
    detailTransactionDate.textContent = formattedDate;
    detailTransactionDescription.textContent = transaction.description;
    detailTransactionAmount.textContent = `¥${transaction.amount.toFixed(2)}`;
    detailTransactionPaymentMethod.textContent = paymentMethodMap[transaction.paymentMethod] || transaction.paymentMethod;
    detailTransactionStatus.innerHTML = statusMap[transaction.status] || transaction.status;
    detailTransactionMembership.textContent = membershipMap[transaction.membershipId] || transaction.membershipId;
    
    // 设置下载收据按钮状态
    if (transaction.status === 'completed') {
        downloadReceiptBtn.classList.remove('d-none');
        downloadReceiptBtn.dataset.transactionId = transaction.transactionId;
    } else {
        downloadReceiptBtn.classList.add('d-none');
    }
}

/**
 * 下载收据
 * @param {string} transactionId - 交易ID
 */
async function downloadReceipt(transactionId) {
    try {
        // 获取用户令牌
        const userToken = localStorage.getItem('nexusorbital_token');
        
        if (!userToken) {
            throw new Error('用户未登录');
        }
        
        // 从API获取收据
        const response = await fetch(`http://localhost:3000/api/transactions/${transactionId}/receipt`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        // 检查响应类型
        const contentType = response.headers.get('Content-Type');
        
        if (contentType && contentType.includes('application/json')) {
            // 如果返回JSON，可能是错误信息
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || '下载收据失败');
            }
        } else {
            // 如果返回文件，创建下载链接
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${transactionId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    } catch (error) {
        console.error('下载收据失败:', error);
        alert('下载收据失败: ' + error.message);
    }
}

/**
 * 设置筛选器事件监听
 */
function setupFilterListeners() {
    const statusFilter = document.getElementById('statusFilter');
    const paymentMethodFilter = document.getElementById('paymentMethodFilter');
    const timeFilter = document.getElementById('timeFilter');
    
    // 添加筛选器变化事件
    [statusFilter, paymentMethodFilter, timeFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', function() {
                // 获取当前筛选条件
                const filters = getCurrentFilters();
                
                // 加载筛选后的交易记录
                loadTransactions(filters, 1);
            });
        }
    });
}

/**
 * 获取当前筛选条件
 * @returns {Object} 筛选条件
 */
function getCurrentFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const paymentMethodFilter = document.getElementById('paymentMethodFilter');
    const timeFilter = document.getElementById('timeFilter');
    
    const filters = {};
    
    if (statusFilter && statusFilter.value !== 'all') {
        filters.status = statusFilter.value;
    }
    
    if (paymentMethodFilter && paymentMethodFilter.value !== 'all') {
        filters.paymentMethod = paymentMethodFilter.value;
    }
    
    if (timeFilter && timeFilter.value !== 'all') {
        filters.timeFilter = timeFilter.value;
    }
    
    return filters;
}

/**
 * 显示加载中状态
 */
function showLoading() {
    // 可以添加加载动画或禁用交互
    document.body.style.cursor = 'wait';
}

/**
 * 隐藏加载中状态
 */
function hideLoading() {
    // 恢复正常状态
    document.body.style.cursor = 'default';
}
