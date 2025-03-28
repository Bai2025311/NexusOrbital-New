/**
 * NexusOrbital 支付分析页面脚本
 */

// 图表颜色配置
const chartColors = {
    primary: 'rgba(52, 152, 219, 0.7)',
    secondary: 'rgba(46, 204, 113, 0.7)',
    danger: 'rgba(231, 76, 60, 0.7)',
    warning: 'rgba(241, 196, 15, 0.7)',
    info: 'rgba(52, 73, 94, 0.7)',
    light: 'rgba(189, 195, 199, 0.7)',
    colorSet: [
        'rgba(52, 152, 219, 0.7)',
        'rgba(46, 204, 113, 0.7)',
        'rgba(231, 76, 60, 0.7)',
        'rgba(241, 196, 15, 0.7)',
        'rgba(155, 89, 182, 0.7)',
        'rgba(52, 73, 94, 0.7)',
        'rgba(230, 126, 34, 0.7)',
        'rgba(149, 165, 166, 0.7)'
    ]
};

// 全局变量
let trendsChart = null;
let countTrendsChart = null;
let paymentMethodsChart = null;
let paymentMethodsCountChart = null;
let membershipsChart = null;
let membershipsCountChart = null;
let refundTrendsChart = null;
let refundReasonsChart = null;
let customRangeChart = null;

// 当前视图设置
const viewSettings = {
    trendsView: 'daily', // daily, weekly, monthly
    trendsDays: 30, // 30, 90, 180
    refundDays: 30, // 30, 90, 180
    customGroupBy: 'day' // day, week, month
};

// 格式化金额
function formatCurrency(amount) {
    return '¥' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// 格式化百分比
function formatPercentage(value) {
    return parseFloat(value).toFixed(2) + '%';
}

// 显示加载中
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// 隐藏加载中
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// 初始化页面
async function initPage() {
    showLoading();
    
    try {
        // 检查用户是否已登录
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        
        // 检查用户是否是管理员
        const user = getCurrentUser();
        if (!user.isAdmin) {
            alert('您没有权限访问此页面');
            window.location.href = 'index.html';
            return;
        }
        
        // 显示当前用户
        document.getElementById('currentUser').textContent = user.name || user.username;
        
        // 初始化日期选择器
        initDatePickers();
        
        // 加载概览数据
        await loadOverviewData();
        
        // 加载趋势数据
        await loadTrendsData();
        
        // 初始化事件监听器
        initEventListeners();
    } catch (error) {
        console.error('初始化页面失败:', error);
        alert('加载页面数据失败，请刷新页面重试');
    } finally {
        hideLoading();
    }
}

// 初始化日期选择器
function initDatePickers() {
    // 设置默认日期范围（最近30天）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;
}

// 初始化事件监听器
function initEventListeners() {
    // 趋势视图切换
    document.getElementById('dailyBtn').addEventListener('click', () => {
        setTrendsView('daily');
    });
    
    document.getElementById('weeklyBtn').addEventListener('click', () => {
        setTrendsView('weekly');
    });
    
    document.getElementById('monthlyBtn').addEventListener('click', () => {
        setTrendsView('monthly');
    });
    
    // 趋势时间范围切换
    document.getElementById('days30Btn').addEventListener('click', () => {
        setTrendsDays(30);
    });
    
    document.getElementById('days90Btn').addEventListener('click', () => {
        setTrendsDays(90);
    });
    
    document.getElementById('days180Btn').addEventListener('click', () => {
        setTrendsDays(180);
    });
    
    // 退款时间范围切换
    document.getElementById('refundDays30Btn').addEventListener('click', () => {
        setRefundDays(30);
    });
    
    document.getElementById('refundDays90Btn').addEventListener('click', () => {
        setRefundDays(90);
    });
    
    document.getElementById('refundDays180Btn').addEventListener('click', () => {
        setRefundDays(180);
    });
    
    // 自定义分析视图切换
    document.getElementById('customDailyBtn').addEventListener('click', () => {
        setCustomGroupBy('day');
    });
    
    document.getElementById('customWeeklyBtn').addEventListener('click', () => {
        setCustomGroupBy('week');
    });
    
    document.getElementById('customMonthlyBtn').addEventListener('click', () => {
        setCustomGroupBy('month');
    });
    
    // 应用自定义时间范围
    document.getElementById('applyCustomRangeBtn').addEventListener('click', () => {
        loadCustomRangeData();
    });
    
    // 选项卡切换事件
    document.getElementById('analyticsTabs').addEventListener('shown.bs.tab', (event) => {
        const targetId = event.target.getAttribute('data-bs-target').substring(1);
        
        if (targetId === 'payment-methods' && !paymentMethodsChart) {
            loadPaymentMethodsData();
        } else if (targetId === 'memberships' && !membershipsChart) {
            loadMembershipsData();
        } else if (targetId === 'refunds' && !refundTrendsChart) {
            loadRefundsData();
        } else if (targetId === 'custom' && !customRangeChart) {
            loadCustomRangeData();
        }
    });
    
    // 退出登录
    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout();
        window.location.href = 'login.html';
    });
}

// 设置趋势视图
function setTrendsView(view) {
    viewSettings.trendsView = view;
    
    // 更新按钮状态
    document.getElementById('dailyBtn').classList.remove('active');
    document.getElementById('weeklyBtn').classList.remove('active');
    document.getElementById('monthlyBtn').classList.remove('active');
    document.getElementById(`${view}Btn`).classList.add('active');
    
    // 重新加载数据
    loadTrendsData();
}

// 设置趋势天数
function setTrendsDays(days) {
    viewSettings.trendsDays = days;
    
    // 更新按钮状态
    document.getElementById('days30Btn').classList.remove('active');
    document.getElementById('days90Btn').classList.remove('active');
    document.getElementById('days180Btn').classList.remove('active');
    document.getElementById(`days${days}Btn`).classList.add('active');
    
    // 重新加载数据
    loadTrendsData();
}

// 设置退款天数
function setRefundDays(days) {
    viewSettings.refundDays = days;
    
    // 更新按钮状态
    document.getElementById('refundDays30Btn').classList.remove('active');
    document.getElementById('refundDays90Btn').classList.remove('active');
    document.getElementById('refundDays180Btn').classList.remove('active');
    document.getElementById(`refundDays${days}Btn`).classList.add('active');
    
    // 重新加载数据
    loadRefundsData();
}

// 设置自定义分组方式
function setCustomGroupBy(groupBy) {
    viewSettings.customGroupBy = groupBy;
    
    // 更新按钮状态
    document.getElementById('customDailyBtn').classList.remove('active');
    document.getElementById('customWeeklyBtn').classList.remove('active');
    document.getElementById('customMonthlyBtn').classList.remove('active');
    document.getElementById(`custom${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}Btn`).classList.add('active');
}

// 加载概览数据
async function loadOverviewData() {
    try {
        const response = await fetch('/api/payment-analytics/overview', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('获取概览数据失败');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '获取概览数据失败');
        }
        
        updateOverviewStats(result.data);
    } catch (error) {
        console.error('加载概览数据失败:', error);
        alert('加载概览数据失败，请刷新页面重试');
    }
}

// 更新概览统计
function updateOverviewStats(data) {
    // 获取当月和上月数据
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const lastMonthKey = currentMonth === 0 
        ? `${currentYear - 1}-12` 
        : `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // 查找当月和上月数据索引
    const currentMonthIndex = data.monthly.labels.indexOf(currentMonthKey);
    const lastMonthIndex = data.monthly.labels.indexOf(lastMonthKey);
    
    // 当月数据
    const currentMonthAmount = currentMonthIndex !== -1 ? data.monthly.successAmount[currentMonthIndex] : 0;
    const currentMonthRefund = currentMonthIndex !== -1 ? data.monthly.refundAmount[currentMonthIndex] : 0;
    
    // 计算交易笔数（使用日数据累加）
    let currentMonthCount = 0;
    const daysInCurrentMonth = data.daily.labels.filter(date => date.startsWith(currentMonthKey)).length;
    
    for (let i = 0; i < data.daily.labels.length; i++) {
        if (data.daily.labels[i].startsWith(currentMonthKey)) {
            currentMonthCount += data.daily.successAmount[i] > 0 ? 1 : 0;
        }
    }
    
    // 上月数据
    const lastMonthAmount = lastMonthIndex !== -1 ? data.monthly.successAmount[lastMonthIndex] : 0;
    const lastMonthRefund = lastMonthIndex !== -1 ? data.monthly.refundAmount[lastMonthIndex] : 0;
    
    // 计算上月交易笔数
    let lastMonthCount = 0;
    for (let i = 0; i < data.daily.labels.length; i++) {
        if (data.daily.labels[i].startsWith(lastMonthKey)) {
            lastMonthCount += data.daily.successAmount[i] > 0 ? 1 : 0;
        }
    }
    
    // 计算变化率
    const amountChange = lastMonthAmount === 0 ? 100 : ((currentMonthAmount - lastMonthAmount) / lastMonthAmount * 100);
    const countChange = lastMonthCount === 0 ? 100 : ((currentMonthCount - lastMonthCount) / lastMonthCount * 100);
    const refundChange = lastMonthRefund === 0 ? 0 : ((currentMonthRefund - lastMonthRefund) / lastMonthRefund * 100);
    
    // 计算退款率
    const currentRefundRate = currentMonthAmount === 0 ? 0 : (currentMonthRefund / currentMonthAmount * 100);
    const lastRefundRate = lastMonthAmount === 0 ? 0 : (lastMonthRefund / lastMonthAmount * 100);
    const refundRateChange = lastRefundRate === 0 ? 0 : ((currentRefundRate - lastRefundRate) / lastRefundRate * 100);
    
    // 更新UI
    document.getElementById('monthlyTotal').textContent = formatCurrency(currentMonthAmount);
    document.getElementById('monthlyCount').textContent = currentMonthCount;
    document.getElementById('monthlyRefund').textContent = formatCurrency(currentMonthRefund);
    document.getElementById('refundRate').textContent = formatPercentage(currentRefundRate);
    
    // 更新变化率，并设置颜色
    const monthlyTotalChangeEl = document.getElementById('monthlyTotalChange');
    monthlyTotalChangeEl.textContent = (amountChange >= 0 ? '+' : '') + formatPercentage(amountChange);
    monthlyTotalChangeEl.className = amountChange >= 0 ? 'stat-change text-success' : 'stat-change text-danger';
    
    const monthlyCountChangeEl = document.getElementById('monthlyCountChange');
    monthlyCountChangeEl.textContent = (countChange >= 0 ? '+' : '') + formatPercentage(countChange);
    monthlyCountChangeEl.className = countChange >= 0 ? 'stat-change text-success' : 'stat-change text-danger';
    
    const monthlyRefundChangeEl = document.getElementById('monthlyRefundChange');
    monthlyRefundChangeEl.textContent = (refundChange >= 0 ? '+' : '') + formatPercentage(refundChange);
    monthlyRefundChangeEl.className = refundChange >= 0 ? 'stat-change text-danger' : 'stat-change text-success';
    
    const refundRateChangeEl = document.getElementById('refundRateChange');
    refundRateChangeEl.textContent = (refundRateChange >= 0 ? '+' : '') + formatPercentage(refundRateChange);
    refundRateChangeEl.className = refundRateChange >= 0 ? 'stat-change text-danger' : 'stat-change text-success';
}

// 加载趋势数据
async function loadTrendsData() {
    showLoading();
    
    try {
        let endpoint;
        
        switch (viewSettings.trendsView) {
            case 'daily':
                endpoint = `/api/payment-analytics/daily?days=${viewSettings.trendsDays}`;
                break;
            case 'weekly':
                endpoint = `/api/payment-analytics/weekly?weeks=${Math.ceil(viewSettings.trendsDays / 7)}`;
                break;
            case 'monthly':
                endpoint = `/api/payment-analytics/monthly?months=${Math.ceil(viewSettings.trendsDays / 30)}`;
                break;
            default:
                endpoint = `/api/payment-analytics/daily?days=${viewSettings.trendsDays}`;
        }
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('获取趋势数据失败');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '获取趋势数据失败');
        }
        
        updateTrendsCharts(result.data);
    } catch (error) {
        console.error('加载趋势数据失败:', error);
        alert('加载趋势数据失败，请刷新页面重试');
    } finally {
        hideLoading();
    }
}

// 更新趋势图表
function updateTrendsCharts(data) {
    // 准备图表数据
    const labels = [];
    const successAmounts = [];
    const refundAmounts = [];
    const successCounts = [];
    const failureCounts = [];
    
    data.forEach(item => {
        let label;
        
        // 根据视图类型格式化标签
        switch (viewSettings.trendsView) {
            case 'daily':
                label = moment(item.date).format('MM-DD');
                break;
            case 'weekly':
                label = item.weekKey ? item.weekKey.split('~')[0] : '';
                break;
            case 'monthly':
                label = item.monthKey || '';
                break;
            default:
                label = moment(item.date).format('MM-DD');
        }
        
        labels.push(label);
        successAmounts.push(item.successAmount || 0);
        refundAmounts.push(item.refundAmount || 0);
        successCounts.push(item.successCount || 0);
        failureCounts.push(item.failureCount || 0);
    });
    
    // 更新金额趋势图表
    updateTrendsAmountChart(labels, successAmounts, refundAmounts);
    
    // 更新笔数趋势图表
    updateTrendsCountChart(labels, successCounts, failureCounts);
}

// 更新金额趋势图表
function updateTrendsAmountChart(labels, successAmounts, refundAmounts) {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    
    // 如果图表已存在，销毁它
    if (trendsChart) {
        trendsChart.destroy();
    }
    
    // 创建新图表
    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '交易金额',
                    data: successAmounts,
                    backgroundColor: chartColors.primary,
                    borderColor: chartColors.primary,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: '退款金额',
                    data: refundAmounts,
                    backgroundColor: chartColors.danger,
                    borderColor: chartColors.danger,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// 更新笔数趋势图表
function updateTrendsCountChart(labels, successCounts, failureCounts) {
    const ctx = document.getElementById('countTrendsChart').getContext('2d');
    
    // 如果图表已存在，销毁它
    if (countTrendsChart) {
        countTrendsChart.destroy();
    }
    
    // 创建新图表
    countTrendsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '成功交易',
                    data: successCounts,
                    backgroundColor: chartColors.secondary,
                    borderColor: chartColors.secondary,
                    borderWidth: 1
                },
                {
                    label: '失败交易',
                    data: failureCounts,
                    backgroundColor: chartColors.danger,
                    borderColor: chartColors.danger,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 加载支付方式数据
async function loadPaymentMethodsData() {
    showLoading();
    
    try {
        const response = await fetch('/api/payment-analytics/payment-methods', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('获取支付方式数据失败');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '获取支付方式数据失败');
        }
        
        updatePaymentMethodsCharts(result.data);
    } catch (error) {
        console.error('加载支付方式数据失败:', error);
        alert('加载支付方式数据失败，请刷新页面重试');
    } finally {
        hideLoading();
    }
}

// 更新支付方式图表
function updatePaymentMethodsCharts(data) {
    // 准备图表数据
    const labels = [];
    const amounts = [];
    const counts = [];
    
    // 填充表格数据
    const tableBody = document.getElementById('paymentMethodsTable');
    tableBody.innerHTML = '';
    
    data.forEach(item => {
        // 添加到图表数据
        labels.push(getPaymentMethodName(item.paymentMethod));
        amounts.push(item.successAmount || 0);
        counts.push(item.successCount || 0);
        
        // 添加到表格
        const row = document.createElement('tr');
        
        // 计算成功率和退款率
        const successRate = item.count > 0 ? (item.successCount / item.count * 100) : 0;
        const refundRate = item.successAmount > 0 ? (item.refundAmount / item.successAmount * 100) : 0;
        
        row.innerHTML = `
            <td>${getPaymentMethodName(item.paymentMethod)}</td>
            <td>${item.count || 0}</td>
            <td>${item.successCount || 0}</td>
            <td>${formatPercentage(successRate)}</td>
            <td>${formatCurrency(item.successAmount || 0)}</td>
            <td>${item.refundCount || 0}</td>
            <td>${formatCurrency(item.refundAmount || 0)}</td>
            <td>${formatPercentage(refundRate)}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 更新金额分布图表
    updatePaymentMethodsAmountChart(labels, amounts);
    
    // 更新笔数分布图表
    updatePaymentMethodsCountChart(labels, counts);
}

// 更新支付方式金额分布图表
function updatePaymentMethodsAmountChart(labels, amounts) {
    const ctx = document.getElementById('paymentMethodsChart').getContext('2d');
    
    // 如果图表已存在，销毁它
    if (paymentMethodsChart) {
        paymentMethodsChart.destroy();
    }
    
    // 创建新图表
    paymentMethodsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [
                {
                    data: amounts,
                    backgroundColor: chartColors.colorSet,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? (value / total * 100).toFixed(2) + '%' : '0%';
                            return `${label}: ${formatCurrency(value)} (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

// 更新支付方式笔数分布图表
function updatePaymentMethodsCountChart(labels, counts) {
    const ctx = document.getElementById('paymentMethodsCountChart').getContext('2d');
    
    // 如果图表已存在，销毁它
    if (paymentMethodsCountChart) {
        paymentMethodsCountChart.destroy();
    }
    
    // 创建新图表
    paymentMethodsCountChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [
                {
                    data: counts,
                    backgroundColor: chartColors.colorSet,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? (value / total * 100).toFixed(2) + '%' : '0%';
                            return `${label}: ${value} 笔 (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

// 获取支付方式名称
function getPaymentMethodName(method) {
    const methodMap = {
        'wechat': '微信支付',
        'alipay': '支付宝',
        'stripe': 'Stripe',
        'credit_card': '信用卡',
        'bank_transfer': '银行转账',
        'paypal': 'PayPal',
        'unknown': '未知'
    };
    
    return methodMap[method] || method;
}

// 加载会员类型数据
async function loadMembershipsData() {
    showLoading();
    
    try {
        const response = await fetch('/api/payment-analytics/memberships', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('获取会员类型数据失败');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '获取会员类型数据失败');
        }
        
        updateMembershipsCharts(result.data);
    } catch (error) {
        console.error('加载会员类型数据失败:', error);
        alert('加载会员类型数据失败，请刷新页面重试');
    } finally {
        hideLoading();
    }
}

// 更新会员类型图表
function updateMembershipsCharts(data) {
    // 准备图表数据
    const labels = [];
    const amounts = [];
    const counts = [];
    
    // 填充表格数据
    const tableBody = document.getElementById('membershipsTable');
    tableBody.innerHTML = '';
    
    data.forEach(item => {
        // 添加到图表数据
        labels.push(getMembershipName(item.membershipId));
        amounts.push(item.successAmount || 0);
        counts.push(item.successCount || 0);
        
        // 添加到表格
        const row = document.createElement('tr');
        
        // 计算成功率和退款率
        const successRate = item.count > 0 ? (item.successCount / item.count * 100) : 0;
        const refundRate = item.successAmount > 0 ? (item.refundAmount / item.successAmount * 100) : 0;
        
        row.innerHTML = `
            <td>${getMembershipName(item.membershipId)}</td>
            <td>${item.count || 0}</td>
            <td>${item.successCount || 0}</td>
            <td>${formatPercentage(successRate)}</td>
            <td>${formatCurrency(item.successAmount || 0)}</td>
            <td>${item.refundCount || 0}</td>
            <td>${formatCurrency(item.refundAmount || 0)}</td>
            <td>${formatPercentage(refundRate)}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 更新金额分布图表
    updateMembershipsAmountChart(labels, amounts);
    
    // 更新笔数分布图表
    updateMembershipsCountChart(labels, counts);
}

// 更新会员类型金额分布图表
function updateMembershipsAmountChart(labels, amounts) {
    const ctx = document.getElementById('membershipsChart').getContext('2d');
    
    // 如果图表已存在，销毁它
    if (membershipsChart) {
        membershipsChart.destroy();
    }
    
    // 创建新图表
    membershipsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [
                {
                    data: amounts,
                    backgroundColor: chartColors.colorSet,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? (value / total * 100).toFixed(2) + '%' : '0%';
                            return `${label}: ${formatCurrency(value)} (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

// 更新会员类型笔数分布图表
function updateMembershipsCountChart(labels, counts) {
    const ctx = document.getElementById('membershipsCountChart').getContext('2d');
    
    // 如果图表已存在，销毁它
    if (membershipsCountChart) {
        membershipsCountChart.destroy();
    }
    
    // 创建新图表
    membershipsCountChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [
                {
                    data: counts,
                    backgroundColor: chartColors.colorSet,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? (value / total * 100).toFixed(2) + '%' : '0%';
                            return `${label}: ${value} 笔 (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

// 获取会员类型名称
function getMembershipName(membershipId) {
    const membershipMap = {
        'basic': '基础会员',
        'standard': '标准会员',
        'premium': '高级会员',
        'vip': 'VIP会员',
        'enterprise': '企业会员',
        'unknown': '未知'
    };
    
    return membershipMap[membershipId] || membershipId;
}

// 加载退款数据
async function loadRefundsData() {
    showLoading();
    
    try {
        const response = await fetch(`/api/payment-analytics/refunds?days=${viewSettings.refundDays}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('获取退款数据失败');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '获取退款数据失败');
        }
        
        updateRefundsCharts(result.data);
    } catch (error) {
        console.error('加载退款数据失败:', error);
        alert('加载退款数据失败，请刷新页面重试');
    } finally {
        hideLoading();
    }
}

// 更新退款图表
function updateRefundsCharts(data) {
    // 更新退款趋势图表
    updateRefundTrendsChart(data.dailyStats);
    
    // 更新退款原因图表
    updateRefundReasonsChart(data.reasonStats);
    
    // 填充退款原因表格
    const tableBody = document.getElementById('refundReasonsTable');
    tableBody.innerHTML = '';
    
    data.reasonStats.forEach(item => {
        const row = document.createElement('tr');
        
        // 计算占比
        const percentage = data.totalAmount > 0 ? (item.amount / data.totalAmount * 100) : 0;
        
        row.innerHTML = `
            <td>${item.reason}</td>
            <td>${item.count || 0}</td>
            <td>${formatCurrency(item.amount || 0)}</td>
            <td>${formatPercentage(percentage)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// 更新退款趋势图表
function updateRefundTrendsChart(dailyStats) {
    const ctx = document.getElementById('refundTrendsChart').getContext('2d');
    
    // 准备图表数据
    const labels = [];
    const amounts = [];
    const counts = [];
    
    dailyStats.forEach(item => {
        labels.push(moment(item.date).format('MM-DD'));
        amounts.push(item.amount || 0);
        counts.push(item.count || 0);
    });
    
    // 如果图表已存在，销毁它
    if (refundTrendsChart) {
        refundTrendsChart.destroy();
    }
    
    // 创建新图表
    refundTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '退款金额',
                    data: amounts,
                    backgroundColor: chartColors.danger,
                    borderColor: chartColors.danger,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y'
                },
                {
                    label: '退款笔数',
                    data: counts,
                    backgroundColor: chartColors.warning,
                    borderColor: chartColors.warning,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.yAxisID === 'y') {
                                    label += formatCurrency(context.parsed.y);
                                } else {
                                    label += context.parsed.y + ' 笔';
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    position: 'left',
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 更新退款原因图表
function updateRefundReasonsChart(reasonStats) {
    const ctx = document.getElementById('refundReasonsChart').getContext('2d');
    
    // 准备图表数据
    const labels = [];
    const amounts = [];
    
    reasonStats.forEach(item => {
        labels.push(item.reason);
        amounts.push(item.amount || 0);
    });
    
    // 如果图表已存在，销毁它
    if (refundReasonsChart) {
        refundReasonsChart.destroy();
    }
    
    // 创建新图表
    refundReasonsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [
                {
                    data: amounts,
                    backgroundColor: chartColors.colorSet,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? (value / total * 100).toFixed(2) + '%' : '0%';
                            return `${label}: ${formatCurrency(value)} (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

// 加载自定义时间范围数据
async function loadCustomRangeData() {
    showLoading();
    
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            alert('请选择开始日期和结束日期');
            hideLoading();
            return;
        }
        
        const response = await fetch(`/api/payment-analytics/custom-range?startDate=${startDate}&endDate=${endDate}&groupBy=${viewSettings.customGroupBy}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('获取自定义时间范围数据失败');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '获取自定义时间范围数据失败');
        }
        
        updateCustomRangeChart(result.data);
    } catch (error) {
        console.error('加载自定义时间范围数据失败:', error);
        alert('加载自定义时间范围数据失败，请重试');
    } finally {
        hideLoading();
    }
}

// 更新自定义时间范围图表
function updateCustomRangeChart(data) {
    const ctx = document.getElementById('customRangeChart').getContext('2d');
    
    // 准备图表数据
    const labels = [];
    const successAmounts = [];
    const refundAmounts = [];
    const successCounts = [];
    
    // 计算统计数据
    let totalAmount = 0;
    let totalCount = 0;
    let totalRefundAmount = 0;
    let totalRefundCount = 0;
    
    data.forEach(item => {
        let label;
        
        // 根据分组方式格式化标签
        switch (viewSettings.customGroupBy) {
            case 'day':
                label = moment(item.date).format('MM-DD');
                break;
            case 'week':
                label = item.weekKey ? item.weekKey.split('~')[0] : '';
                break;
            case 'month':
                label = item.monthKey || '';
                break;
            default:
                label = moment(item.date).format('MM-DD');
        }
        
        labels.push(label);
        successAmounts.push(item.successAmount || 0);
        refundAmounts.push(item.refundAmount || 0);
        successCounts.push(item.successCount || 0);
        
        // 累计统计数据
        totalAmount += item.successAmount || 0;
        totalCount += item.successCount || 0;
        totalRefundAmount += item.refundAmount || 0;
        totalRefundCount += item.refundCount || 0;
    });
    
    // 如果图表已存在，销毁它
    if (customRangeChart) {
        customRangeChart.destroy();
    }
    
    // 创建新图表
    customRangeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '交易金额',
                    data: successAmounts,
                    backgroundColor: chartColors.primary,
                    borderColor: chartColors.primary,
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: '退款金额',
                    data: refundAmounts,
                    backgroundColor: chartColors.danger,
                    borderColor: chartColors.danger,
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: '交易笔数',
                    data: successCounts,
                    backgroundColor: chartColors.secondary,
                    borderColor: chartColors.secondary,
                    borderWidth: 1,
                    type: 'line',
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.yAxisID === 'y') {
                                    label += formatCurrency(context.parsed.y);
                                } else {
                                    label += context.parsed.y + ' 笔';
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    position: 'left',
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // 计算退款率
    const refundRate = totalAmount > 0 ? (totalRefundAmount / totalAmount * 100) : 0;
    
    // 计算日均数据
    const startDate = moment(document.getElementById('startDate').value);
    const endDate = moment(document.getElementById('endDate').value);
    const daysDiff = endDate.diff(startDate, 'days') + 1;
    
    const dailyAvgAmount = daysDiff > 0 ? (totalAmount / daysDiff) : 0;
    const dailyAvgCount = daysDiff > 0 ? (totalCount / daysDiff) : 0;
    const dailyRefundAmount = daysDiff > 0 ? (totalRefundAmount / daysDiff) : 0;
    const dailyRefundCount = daysDiff > 0 ? (totalRefundCount / daysDiff) : 0;
    
    // 更新统计数据
    document.getElementById('customTotalAmount').textContent = formatCurrency(totalAmount);
    document.getElementById('customTotalCount').textContent = totalCount;
    document.getElementById('customRefundAmount').textContent = formatCurrency(totalRefundAmount);
    document.getElementById('customRefundRate').textContent = formatPercentage(refundRate);
    
    document.getElementById('customDailyAvgAmount').textContent = formatCurrency(dailyAvgAmount);
    document.getElementById('customDailyAvgCount').textContent = dailyAvgCount.toFixed(2);
    document.getElementById('customDailyRefundAmount').textContent = formatCurrency(dailyRefundAmount);
    document.getElementById('customDailyRefundCount').textContent = dailyRefundCount.toFixed(2);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);
