/**
 * 优惠券分析页面JavaScript
 * 负责加载优惠券使用数据、生成统计图表和展示分析结果
 */

// 全局变量
let allCoupons = [];
let allPromotions = [];
let couponUsageData = [];
let filteredData = [];
let charts = {};

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化日期选择器
  initDatePicker();
  
  // 加载数据
  await loadData();
  
  // 初始化筛选器
  initFilters();
  
  // 渲染统计数据
  renderStatistics();
  
  // 初始化图表
  initCharts();
  
  // 渲染热门优惠券表格
  renderPopularCouponsTable();
  
  // 绑定事件处理程序
  bindEventHandlers();
});

/**
 * 初始化日期选择器
 */
function initDatePicker() {
  // 设置默认日期范围为过去30天
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  document.getElementById('start-date').valueAsDate = startDate;
  document.getElementById('end-date').valueAsDate = endDate;
}

/**
 * 加载数据
 */
async function loadData() {
  try {
    // 显示加载状态
    showLoading(true);
    
    // 获取认证令牌
    const token = await getAuthToken();
    
    // 并行加载数据
    const [couponsResponse, promotionsResponse, usageResponse] = await Promise.all([
      fetch('/api/promotion/coupons', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('/api/promotion', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('/api/promotion/coupons/usage/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);
    
    // 解析响应
    const couponsData = await couponsResponse.json();
    const promotionsData = await promotionsResponse.json();
    const usageData = await usageResponse.json();
    
    // 存储数据
    allCoupons = couponsData.success ? couponsData.data : [];
    allPromotions = promotionsData.success ? promotionsData.data : [];
    couponUsageData = usageData.success ? usageData.data : [];
    
    // 应用日期筛选
    applyFilters();
    
    // 隐藏加载状态
    showLoading(false);
  } catch (error) {
    console.error('加载数据失败:', error);
    showError('加载数据失败，请稍后重试');
    showLoading(false);
  }
}

/**
 * 初始化筛选器
 */
function initFilters() {
  // 填充促销活动下拉列表
  const promotionFilter = document.getElementById('promotion-filter');
  promotionFilter.innerHTML = '<option value="all">所有活动</option>';
  
  allPromotions.forEach(promotion => {
    const option = document.createElement('option');
    option.value = promotion.id;
    option.textContent = promotion.name;
    promotionFilter.appendChild(option);
  });
  
  // 绑定筛选器变更事件
  document.getElementById('promotion-filter').addEventListener('change', applyFilters);
  document.getElementById('coupon-type-filter').addEventListener('change', applyFilters);
  document.getElementById('apply-date-filter').addEventListener('click', applyFilters);
}

/**
 * 应用筛选条件
 */
function applyFilters() {
  // 获取筛选条件
  const promotionId = document.getElementById('promotion-filter').value;
  const couponType = document.getElementById('coupon-type-filter').value;
  const startDate = new Date(document.getElementById('start-date').value);
  const endDate = new Date(document.getElementById('end-date').value);
  endDate.setHours(23, 59, 59, 999); // 设置为当天结束时间
  
  // 筛选数据
  filteredData = couponUsageData.filter(record => {
    // 日期筛选
    const usedAt = new Date(record.usedAt);
    const dateInRange = usedAt >= startDate && usedAt <= endDate;
    
    // 促销活动筛选
    const promotionMatch = promotionId === 'all' || record.promotionId === promotionId;
    
    // 优惠券类型筛选
    let typeMatch = true;
    if (couponType !== 'all') {
      const coupon = allCoupons.find(c => c.id === record.couponId);
      typeMatch = coupon && coupon.discountType === couponType;
    }
    
    return dateInRange && promotionMatch && typeMatch;
  });
  
  // 更新UI
  renderStatistics();
  updateCharts();
  renderPopularCouponsTable();
}

/**
 * 渲染统计数据
 */
function renderStatistics() {
  // 计算总优惠券数
  const totalCoupons = allCoupons.length;
  
  // 计算总使用次数
  const totalUsage = filteredData.length;
  
  // 计算总折扣金额
  const totalDiscount = filteredData.reduce((sum, record) => sum + record.discountAmount, 0);
  
  // 计算转化率（使用次数 / 优惠券总数）
  const conversionRate = totalCoupons > 0 ? (totalUsage / totalCoupons) * 100 : 0;
  
  // 更新DOM
  document.getElementById('total-coupons').textContent = totalCoupons;
  document.getElementById('total-usage').textContent = totalUsage;
  document.getElementById('total-discount').textContent = `$${totalDiscount.toFixed(2)}`;
  document.getElementById('conversion-rate').textContent = `${conversionRate.toFixed(1)}%`;
}

/**
 * 初始化图表
 */
function initCharts() {
  // 优惠券使用趋势图
  const usageTrendCtx = document.getElementById('usage-trend-chart').getContext('2d');
  charts.usageTrend = new Chart(usageTrendCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: '使用次数',
        data: [],
        borderColor: '#4a90e2',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  // 优惠券类型分布图
  const couponTypeCtx = document.getElementById('coupon-type-chart').getContext('2d');
  charts.couponType = new Chart(couponTypeCtx, {
    type: 'doughnut',
    data: {
      labels: ['百分比折扣', '固定金额', '免费升级'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: [
          '#4a90e2',
          '#28a745',
          '#ffc107'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        }
      }
    }
  });
  
  // 促销活动效果对比图
  const promotionComparisonCtx = document.getElementById('promotion-comparison-chart').getContext('2d');
  charts.promotionComparison = new Chart(promotionComparisonCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: '使用次数',
        data: [],
        backgroundColor: '#4a90e2',
        borderColor: '#4a90e2',
        borderWidth: 1
      }, {
        label: '折扣金额',
        data: [],
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        borderWidth: 1,
        yAxisID: 'y1'
      }]
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
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '使用次数'
          }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          title: {
            display: true,
            text: '折扣金额 ($)'
          }
        }
      }
    }
  });
  
  // 优惠券使用时间分布图
  const usageTimeCtx = document.getElementById('usage-time-chart').getContext('2d');
  charts.usageTime = new Chart(usageTimeCtx, {
    type: 'bar',
    data: {
      labels: ['00-03', '03-06', '06-09', '09-12', '12-15', '15-18', '18-21', '21-24'],
      datasets: [{
        label: '使用次数',
        data: [0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#4a90e2',
        borderColor: '#4a90e2',
        borderWidth: 1
      }]
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
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  // 更新图表数据
  updateCharts();
}

/**
 * 更新图表数据
 */
function updateCharts() {
  // 更新优惠券使用趋势图
  updateUsageTrendChart();
  
  // 更新优惠券类型分布图
  updateCouponTypeChart();
  
  // 更新促销活动效果对比图
  updatePromotionComparisonChart();
  
  // 更新优惠券使用时间分布图
  updateUsageTimeChart();
}

/**
 * 更新优惠券使用趋势图
 */
function updateUsageTrendChart() {
  // 按日期分组数据
  const usageByDate = {};
  
  filteredData.forEach(record => {
    const date = moment(record.usedAt).format('YYYY-MM-DD');
    usageByDate[date] = (usageByDate[date] || 0) + 1;
  });
  
  // 获取日期范围
  const startDate = new Date(document.getElementById('start-date').value);
  const endDate = new Date(document.getElementById('end-date').value);
  
  // 生成日期序列
  const dateLabels = [];
  const usageCounts = [];
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = moment(currentDate).format('YYYY-MM-DD');
    dateLabels.push(dateStr);
    usageCounts.push(usageByDate[dateStr] || 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // 更新图表数据
  charts.usageTrend.data.labels = dateLabels;
  charts.usageTrend.data.datasets[0].data = usageCounts;
  charts.usageTrend.update();
}

/**
 * 更新优惠券类型分布图
 */
function updateCouponTypeChart() {
  // 按优惠券类型统计使用次数
  const usageByType = {
    percentage: 0,
    fixed: 0,
    free_upgrade: 0
  };
  
  filteredData.forEach(record => {
    const coupon = allCoupons.find(c => c.id === record.couponId);
    if (coupon) {
      usageByType[coupon.discountType] = (usageByType[coupon.discountType] || 0) + 1;
    }
  });
  
  // 更新图表数据
  charts.couponType.data.datasets[0].data = [
    usageByType.percentage,
    usageByType.fixed,
    usageByType.free_upgrade
  ];
  charts.couponType.update();
}

/**
 * 更新促销活动效果对比图
 */
function updatePromotionComparisonChart() {
  // 按促销活动统计使用次数和折扣金额
  const usageByPromotion = {};
  const discountByPromotion = {};
  
  filteredData.forEach(record => {
    const promotionId = record.promotionId;
    usageByPromotion[promotionId] = (usageByPromotion[promotionId] || 0) + 1;
    discountByPromotion[promotionId] = (discountByPromotion[promotionId] || 0) + record.discountAmount;
  });
  
  // 获取前5个促销活动
  const topPromotions = Object.keys(usageByPromotion)
    .sort((a, b) => usageByPromotion[b] - usageByPromotion[a])
    .slice(0, 5);
  
  // 准备图表数据
  const promotionLabels = [];
  const usageCounts = [];
  const discountAmounts = [];
  
  topPromotions.forEach(promotionId => {
    const promotion = allPromotions.find(p => p.id === promotionId);
    promotionLabels.push(promotion ? promotion.name : '未知活动');
    usageCounts.push(usageByPromotion[promotionId]);
    discountAmounts.push(discountByPromotion[promotionId]);
  });
  
  // 更新图表数据
  charts.promotionComparison.data.labels = promotionLabels;
  charts.promotionComparison.data.datasets[0].data = usageCounts;
  charts.promotionComparison.data.datasets[1].data = discountAmounts;
  charts.promotionComparison.update();
}

/**
 * 更新优惠券使用时间分布图
 */
function updateUsageTimeChart() {
  // 按时间段统计使用次数
  const usageByHour = [0, 0, 0, 0, 0, 0, 0, 0]; // 8个时间段
  
  filteredData.forEach(record => {
    const hour = new Date(record.usedAt).getHours();
    const timeSlot = Math.floor(hour / 3); // 每3小时一个时间段
    usageByHour[timeSlot]++;
  });
  
  // 更新图表数据
  charts.usageTime.data.datasets[0].data = usageByHour;
  charts.usageTime.update();
}

/**
 * 渲染热门优惠券表格
 */
function renderPopularCouponsTable() {
  const tableBody = document.getElementById('popular-coupons-table');
  
  // 如果没有数据，显示提示信息
  if (filteredData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">暂无数据</td></tr>';
    return;
  }
  
  // 按优惠券统计使用次数和折扣金额
  const usageByCoupon = {};
  const discountByCoupon = {};
  
  filteredData.forEach(record => {
    const couponId = record.couponId;
    usageByCoupon[couponId] = (usageByCoupon[couponId] || 0) + 1;
    discountByCoupon[couponId] = (discountByCoupon[couponId] || 0) + record.discountAmount;
  });
  
  // 获取前10个热门优惠券
  const topCoupons = Object.keys(usageByCoupon)
    .sort((a, b) => usageByCoupon[b] - usageByCoupon[a])
    .slice(0, 10);
  
  // 生成表格行
  let html = '';
  
  topCoupons.forEach((couponId, index) => {
    const coupon = allCoupons.find(c => c.id === couponId);
    if (!coupon) return;
    
    const promotion = allPromotions.find(p => p.id === coupon.promotionId);
    const usageCount = usageByCoupon[couponId];
    const discountAmount = discountByCoupon[couponId];
    const conversionRate = (usageCount / (coupon.viewCount || 1)) * 100;
    
    // 折扣类型文本
    let discountTypeText = '';
    if (coupon.discountType === 'percentage') {
      discountTypeText = `${coupon.discountValue}% 折扣`;
    } else if (coupon.discountType === 'fixed') {
      discountTypeText = `$${coupon.discountValue.toFixed(2)} 固定金额`;
    } else if (coupon.discountType === 'free_upgrade') {
      discountTypeText = '免费升级';
    }
    
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${coupon.code}</td>
        <td>${promotion ? promotion.name : '未知活动'}</td>
        <td>${discountTypeText}</td>
        <td>${usageCount}</td>
        <td>$${discountAmount.toFixed(2)}</td>
        <td>${conversionRate.toFixed(1)}%</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="viewCouponDetails('${couponId}')">
            详情
          </button>
        </td>
      </tr>
    `;
  });
  
  tableBody.innerHTML = html;
}

/**
 * 绑定事件处理程序
 */
function bindEventHandlers() {
  // 导出CSV按钮
  document.getElementById('export-csv').addEventListener('click', exportCsv);
}

/**
 * 导出CSV文件
 */
function exportCsv() {
  // 准备CSV数据
  const headers = ['优惠券码', '促销活动', '折扣类型', '折扣值', '使用次数', '总折扣金额', '转化率'];
  
  // 按优惠券统计使用次数和折扣金额
  const usageByCoupon = {};
  const discountByCoupon = {};
  
  filteredData.forEach(record => {
    const couponId = record.couponId;
    usageByCoupon[couponId] = (usageByCoupon[couponId] || 0) + 1;
    discountByCoupon[couponId] = (discountByCoupon[couponId] || 0) + record.discountAmount;
  });
  
  // 生成CSV行
  const rows = [];
  
  Object.keys(usageByCoupon).forEach(couponId => {
    const coupon = allCoupons.find(c => c.id === couponId);
    if (!coupon) return;
    
    const promotion = allPromotions.find(p => p.id === coupon.promotionId);
    const usageCount = usageByCoupon[couponId];
    const discountAmount = discountByCoupon[couponId];
    const conversionRate = (usageCount / (coupon.viewCount || 1)) * 100;
    
    // 折扣类型文本
    let discountTypeText = '';
    if (coupon.discountType === 'percentage') {
      discountTypeText = '百分比折扣';
    } else if (coupon.discountType === 'fixed') {
      discountTypeText = '固定金额';
    } else if (coupon.discountType === 'free_upgrade') {
      discountTypeText = '免费升级';
    }
    
    rows.push([
      coupon.code,
      promotion ? promotion.name : '未知活动',
      discountTypeText,
      coupon.discountValue,
      usageCount,
      discountAmount.toFixed(2),
      conversionRate.toFixed(1) + '%'
    ]);
  });
  
  // 生成CSV内容
  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `优惠券分析_${moment().format('YYYYMMDD')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 查看优惠券详情
 * @param {string} couponId - 优惠券ID
 */
function viewCouponDetails(couponId) {
  const coupon = allCoupons.find(c => c.id === couponId);
  if (!coupon) return;
  
  const promotion = allPromotions.find(p => p.id === coupon.promotionId);
  
  // 获取该优惠券的使用记录
  const usageRecords = filteredData.filter(record => record.couponId === couponId);
  
  // 计算统计数据
  const usageCount = usageRecords.length;
  const totalDiscount = usageRecords.reduce((sum, record) => sum + record.discountAmount, 0);
  const averageDiscount = usageCount > 0 ? totalDiscount / usageCount : 0;
  
  // 格式化日期
  const createdAt = moment(coupon.createdAt).format('YYYY-MM-DD HH:mm:ss');
  const expiresAt = coupon.expiresAt ? moment(coupon.expiresAt).format('YYYY-MM-DD HH:mm:ss') : '永不过期';
  
  // 折扣类型和金额
  let discountText = '';
  if (coupon.discountType === 'percentage') {
    discountText = `${coupon.discountValue}% 折扣`;
  } else if (coupon.discountType === 'fixed') {
    discountText = `$${coupon.discountValue.toFixed(2)} 固定金额`;
  } else if (coupon.discountType === 'free_upgrade') {
    discountText = '免费升级';
  }
  
  // 构建HTML
  let html = `
    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title">优惠券信息</h5>
        <div class="row">
          <div class="col-md-6">
            <p><strong>优惠券码:</strong> ${coupon.code}</p>
            <p><strong>折扣类型:</strong> ${discountText}</p>
            <p><strong>最低消费:</strong> ${coupon.minPurchaseAmount ? `$${coupon.minPurchaseAmount.toFixed(2)}` : '无限制'}</p>
            <p><strong>最大使用次数:</strong> ${coupon.maxUses || '无限制'}</p>
          </div>
          <div class="col-md-6">
            <p><strong>已使用次数:</strong> ${coupon.usedCount || 0}</p>
            <p><strong>创建时间:</strong> ${createdAt}</p>
            <p><strong>过期时间:</strong> ${expiresAt}</p>
            <p><strong>状态:</strong> <span class="badge bg-${coupon.isActive ? 'success' : 'danger'}">${coupon.isActive ? '有效' : '无效'}</span></p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 添加促销活动信息
  if (promotion) {
    const startDate = moment(promotion.startDate).format('YYYY-MM-DD');
    const endDate = promotion.endDate ? moment(promotion.endDate).format('YYYY-MM-DD') : '永不过期';
    
    html += `
      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">所属促销活动</h5>
          <div class="row">
            <div class="col-md-6">
              <p><strong>活动名称:</strong> ${promotion.name}</p>
              <p><strong>活动描述:</strong> ${promotion.description || '无描述'}</p>
            </div>
            <div class="col-md-6">
              <p><strong>开始日期:</strong> ${startDate}</p>
              <p><strong>结束日期:</strong> ${endDate}</p>
              <p><strong>状态:</strong> <span class="badge bg-${promotion.isActive ? 'success' : 'danger'}">${promotion.isActive ? '有效' : '无效'}</span></p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // 添加使用统计
  html += `
    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title">使用统计</h5>
        <div class="row">
          <div class="col-md-4">
            <div class="text-center">
              <h3>${usageCount}</h3>
              <p>使用次数</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="text-center">
              <h3>$${totalDiscount.toFixed(2)}</h3>
              <p>总折扣金额</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="text-center">
              <h3>$${averageDiscount.toFixed(2)}</h3>
              <p>平均折扣</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 添加最近使用记录
  if (usageRecords.length > 0) {
    html += `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">最近使用记录</h5>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>使用时间</th>
                  <th>订单金额</th>
                  <th>折扣金额</th>
                  <th>订单ID</th>
                </tr>
              </thead>
              <tbody>
    `;
    
    // 显示最近10条记录
    usageRecords
      .sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt))
      .slice(0, 10)
      .forEach(record => {
        const usedAt = moment(record.usedAt).format('YYYY-MM-DD HH:mm:ss');
        
        html += `
          <tr>
            <td>${usedAt}</td>
            <td>$${record.orderAmount.toFixed(2)}</td>
            <td>$${record.discountAmount.toFixed(2)}</td>
            <td>${record.orderId}</td>
          </tr>
        `;
      });
    
    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
  
  // 显示模态框
  document.getElementById('coupon-detail-content').innerHTML = html;
  const modal = new bootstrap.Modal(document.getElementById('couponDetailModal'));
  modal.show();
}

/**
 * 显示加载状态
 * @param {boolean} isLoading - 是否正在加载
 */
function showLoading(isLoading) {
  // 这里可以添加加载指示器
  document.body.style.cursor = isLoading ? 'wait' : 'default';
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showError(message) {
  alert(message);
}

/**
 * 获取认证令牌
 * @returns {Promise<string>} - 认证令牌
 */
async function getAuthToken() {
  // 这里应该是从localStorage或其他存储中获取令牌
  // 为了演示，我们返回一个模拟的令牌
  return 'mock_token_123456';
}
