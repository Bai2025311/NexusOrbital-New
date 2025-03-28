/**
 * NexusOrbital 促销活动管理
 * 提供促销活动和优惠券的管理功能
 */

// 全局变量
let currentUser = null;
let promotions = [];
let coupons = [];
let memberships = [];

// DOM 元素
const promotionsList = document.getElementById('promotionsList');
const couponsList = document.getElementById('couponsList');
const userCouponUsage = document.getElementById('userCouponUsage');
const adminView = document.getElementById('adminView');
const userView = document.getElementById('userView');
const notLoggedInView = document.getElementById('notLoggedInView');
const loginBtn = document.getElementById('loginBtn');
const loginBtnAlert = document.getElementById('loginBtnAlert');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户登录状态
    checkLoginStatus();
    
    // 事件监听器
    setupEventListeners();
    
    // 加载会员等级
    loadMemberships();
});

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        try {
            currentUser = JSON.parse(user);
            userInfo.textContent = `${currentUser.name} (${currentUser.role})`;
            loginBtn.classList.add('d-none');
            logoutBtn.classList.remove('d-none');
            
            if (currentUser.role === 'admin') {
                adminView.classList.remove('d-none');
                userView.classList.add('d-none');
                notLoggedInView.classList.add('d-none');
                
                // 加载促销活动和优惠券
                loadPromotions();
                loadCoupons();
            } else {
                adminView.classList.add('d-none');
                userView.classList.remove('d-none');
                notLoggedInView.classList.add('d-none');
                
                // 加载用户优惠券使用记录
                loadUserCouponUsage();
            }
        } catch (error) {
            console.error('解析用户信息失败:', error);
            logout();
        }
    } else {
        adminView.classList.add('d-none');
        userView.classList.add('d-none');
        notLoggedInView.classList.remove('d-none');
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 登录和登出按钮
    loginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
    
    loginBtnAlert.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
    
    logoutBtn.addEventListener('click', logout);
    
    // 促销活动类型变更事件
    const promotionType = document.getElementById('promotionType');
    const valueType = document.getElementById('valueType');
    
    promotionType.addEventListener('change', () => {
        if (promotionType.value === 'percentage') {
            valueType.textContent = '%';
        } else {
            valueType.textContent = '¥';
        }
    });
    
    // 编辑促销活动类型变更事件
    const editPromotionType = document.getElementById('editPromotionType');
    const editValueType = document.getElementById('editValueType');
    
    editPromotionType.addEventListener('change', () => {
        if (editPromotionType.value === 'percentage') {
            editValueType.textContent = '%';
        } else {
            editValueType.textContent = '¥';
        }
    });
    
    // 优惠券切换事件
    const showActiveOnly = document.getElementById('showActiveOnly');
    
    showActiveOnly.addEventListener('change', () => {
        loadCoupons(showActiveOnly.checked);
    });
    
    // 为促销活动创建优惠券切换
    const createCouponForPromotion = document.getElementById('createCouponForPromotion');
    const couponCodeSection = document.getElementById('couponCodeSection');
    
    createCouponForPromotion.addEventListener('change', () => {
        if (createCouponForPromotion.checked) {
            couponCodeSection.classList.remove('d-none');
        } else {
            couponCodeSection.classList.add('d-none');
        }
    });
    
    // 生成随机优惠码
    const generateRandomCode = document.getElementById('generateRandomCode');
    const promotionCouponCode = document.getElementById('promotionCouponCode');
    
    generateRandomCode.addEventListener('click', () => {
        promotionCouponCode.value = generateRandomCouponCode();
    });
    
    const generateRandomCodeCoupon = document.getElementById('generateRandomCodeCoupon');
    const couponCode = document.getElementById('couponCode');
    
    generateRandomCodeCoupon.addEventListener('click', () => {
        couponCode.value = generateRandomCouponCode();
    });
    
    // 保存促销活动
    const savePromotionBtn = document.getElementById('savePromotionBtn');
    
    savePromotionBtn.addEventListener('click', () => {
        savePromotion();
    });
    
    // 保存优惠券
    const saveCouponBtn = document.getElementById('saveCouponBtn');
    
    saveCouponBtn.addEventListener('click', () => {
        saveCoupon();
    });
    
    // 更新促销活动
    const updatePromotionBtn = document.getElementById('updatePromotionBtn');
    
    updatePromotionBtn.addEventListener('click', () => {
        updatePromotion();
    });
    
    // 批量生成优惠券
    const batchCouponGenerateForm = document.getElementById('batchCouponGenerateForm');
    
    batchCouponGenerateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        generateCouponsBatch();
    });
    
    // 下载优惠券CSV
    const downloadCouponsBtn = document.getElementById('downloadCouponsBtn');
    
    downloadCouponsBtn.addEventListener('click', () => {
        downloadCouponsCSV();
    });
}

// 加载促销活动
async function loadPromotions() {
    try {
        const response = await fetch('/api/promotion/promotions', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            promotions = result.data;
            renderPromotions();
            populatePromotionDropdowns();
        } else {
            showAlert('加载促销活动失败: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('加载促销活动失败:', error);
        showAlert('加载促销活动失败，请检查网络连接', 'danger');
    }
}

// 渲染促销活动列表
function renderPromotions() {
    if (!promotions || promotions.length === 0) {
        promotionsList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    暂无促销活动，点击"创建促销活动"按钮创建新的促销活动。
                </div>
            </div>
        `;
        return;
    }
    
    // 按创建时间排序，最新的在前面
    promotions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let html = '';
    
    promotions.forEach(promotion => {
        const now = new Date().toISOString();
        const isExpired = promotion.endDate < now;
        const isActive = promotion.isActive && !isExpired && promotion.startDate <= now;
        
        let statusClass = 'bg-success';
        let statusText = '活跃';
        
        if (isExpired) {
            statusClass = 'bg-secondary';
            statusText = '已过期';
        } else if (!promotion.isActive) {
            statusClass = 'bg-danger';
            statusText = '已禁用';
        } else if (promotion.startDate > now) {
            statusClass = 'bg-warning';
            statusText = '未开始';
        }
        
        let cardClass = 'promotion-card';
        if (isExpired) {
            cardClass += ' expired-promotion';
        } else if (!promotion.isActive) {
            cardClass += ' inactive-promotion';
        }
        
        let valueText = '';
        if (promotion.type === 'percentage') {
            valueText = `${promotion.value}% 折扣`;
        } else if (promotion.type === 'fixed') {
            valueText = `¥${promotion.value.toFixed(2)} 折扣`;
        } else if (promotion.type === 'free_upgrade') {
            valueText = '免费升级';
        }
        
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card ${cardClass}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <h5 class="card-title">${promotion.name}</h5>
                            <span class="badge ${statusClass}">${statusText}</span>
                        </div>
                        <p class="card-text">${promotion.description || '无描述'}</p>
                        <div class="mb-2">
                            <strong>类型:</strong> ${valueText}
                        </div>
                        <div class="mb-2">
                            <strong>有效期:</strong> ${formatDate(promotion.startDate)} 至 ${formatDate(promotion.endDate)}
                        </div>
                        ${promotion.minPurchaseAmount > 0 ? `
                            <div class="mb-2">
                                <strong>最低消费:</strong> ¥${promotion.minPurchaseAmount.toFixed(2)}
                            </div>
                        ` : ''}
                        ${promotion.maxDiscountAmount ? `
                            <div class="mb-2">
                                <strong>最大折扣:</strong> ¥${promotion.maxDiscountAmount.toFixed(2)}
                            </div>
                        ` : ''}
                        ${promotion.couponId ? `
                            <div class="mb-2">
                                <strong>关联优惠券:</strong> <span class="badge bg-info">已关联</span>
                            </div>
                        ` : ''}
                        <div class="d-flex justify-content-between mt-3">
                            <button class="btn btn-sm btn-outline-primary" onclick="editPromotion('${promotion.id}')">
                                <i class="bi bi-pencil"></i> 编辑
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deletePromotion('${promotion.id}')">
                                <i class="bi bi-trash"></i> 删除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    promotionsList.innerHTML = html;
}

// 加载优惠券
async function loadCoupons(activeOnly = true) {
    try {
        const response = await fetch(`/api/promotion/coupons?activeOnly=${activeOnly}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            coupons = result.data;
            renderCoupons();
        } else {
            showAlert('加载优惠券失败: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('加载优惠券失败:', error);
        showAlert('加载优惠券失败，请检查网络连接', 'danger');
    }
}

// 渲染优惠券列表
function renderCoupons() {
    if (!coupons || coupons.length === 0) {
        couponsList.innerHTML = `
            <div class="alert alert-info">
                暂无优惠券，点击"创建优惠券"按钮创建新的优惠券。
            </div>
        `;
        return;
    }
    
    // 按创建时间排序，最新的在前面
    coupons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let html = '';
    
    coupons.forEach(coupon => {
        const now = new Date().toISOString();
        const isExpired = coupon.endDate < now;
        const isActive = coupon.isActive && !isExpired && coupon.startDate <= now;
        
        let statusClass = 'bg-success';
        let statusText = '活跃';
        
        if (isExpired) {
            statusClass = 'bg-secondary';
            statusText = '已过期';
        } else if (!coupon.isActive) {
            statusClass = 'bg-danger';
            statusText = '已禁用';
        } else if (coupon.startDate > now) {
            statusClass = 'bg-warning';
            statusText = '未开始';
        }
        
        let itemClass = 'coupon-item';
        if (isExpired) {
            itemClass += ' expired';
        } else if (!coupon.isActive) {
            itemClass += ' inactive';
        }
        
        // 查找关联的促销活动
        const promotion = promotions.find(p => p.id === coupon.promotionId);
        const promotionName = promotion ? promotion.name : '未知促销活动';
        
        html += `
            <div class="card mb-2 ${itemClass}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="card-title coupon-code">${coupon.code}</h5>
                        <span class="badge ${statusClass}">${statusText}</span>
                    </div>
                    <p class="card-text">${coupon.description || '无描述'}</p>
                    <div class="mb-2">
                        <strong>关联促销活动:</strong> ${promotionName}
                    </div>
                    <div class="mb-2">
                        <strong>有效期:</strong> ${formatDate(coupon.startDate)} 至 ${formatDate(coupon.endDate)}
                    </div>
                    <div class="mb-2">
                        <strong>使用情况:</strong> ${coupon.usedCount} / ${coupon.maxUsesTotal > 0 ? coupon.maxUsesTotal : '不限'}
                    </div>
                    <div class="mb-2">
                        <strong>每用户使用次数:</strong> ${coupon.maxUsesPerUser}
                    </div>
                    <div class="d-flex justify-content-between mt-3">
                        <button class="btn btn-sm btn-outline-primary" onclick="editCoupon('${coupon.id}')">
                            <i class="bi bi-pencil"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCoupon('${coupon.id}')">
                            <i class="bi bi-trash"></i> 删除
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    couponsList.innerHTML = html;
}

// 加载用户优惠券使用记录
async function loadUserCouponUsage() {
    try {
        const response = await fetch('/api/promotion/coupons/usage/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderUserCouponUsage(result.data);
        } else {
            showAlert('加载优惠券使用记录失败: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('加载优惠券使用记录失败:', error);
        showAlert('加载优惠券使用记录失败，请检查网络连接', 'danger');
    }
}

// 渲染用户优惠券使用记录
function renderUserCouponUsage(usages) {
    const userCouponUsageLoading = document.getElementById('userCouponUsageLoading');
    userCouponUsageLoading.classList.add('d-none');
    
    if (!usages || usages.length === 0) {
        userCouponUsage.innerHTML = `
            <div class="alert alert-info">
                您还没有使用过任何优惠券。
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>优惠码</th>
                        <th>订单ID</th>
                        <th>折扣金额</th>
                        <th>使用时间</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    usages.forEach(usage => {
        html += `
            <tr>
                <td><span class="coupon-code">${usage.couponCode}</span></td>
                <td>${usage.orderId}</td>
                <td>¥${usage.discountAmount.toFixed(2)}</td>
                <td>${formatDate(usage.usedAt)}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    userCouponUsage.innerHTML = html;
}

// 加载会员等级
async function loadMemberships() {
    try {
        const response = await fetch('/api/memberships', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            memberships = result.data;
            renderMembershipOptions();
        } else {
            console.error('加载会员等级失败:', result.error);
        }
    } catch (error) {
        console.error('加载会员等级失败:', error);
    }
}

// 渲染会员等级选项
function renderMembershipOptions() {
    const membershipOptions = document.getElementById('membershipOptions');
    const editMembershipOptions = document.getElementById('editMembershipOptions');
    
    if (!memberships || memberships.length === 0) {
        membershipOptions.innerHTML = '<div class="alert alert-info">无会员等级数据</div>';
        editMembershipOptions.innerHTML = '<div class="alert alert-info">无会员等级数据</div>';
        return;
    }
    
    let html = '';
    
    memberships.forEach(membership => {
        html += `
            <div class="form-check form-check-inline">
                <input class="form-check-input membership-checkbox" type="checkbox" id="membership-${membership.id}" value="${membership.id}">
                <label class="form-check-label" for="membership-${membership.id}">${membership.name}</label>
            </div>
        `;
    });
    
    membershipOptions.innerHTML = html;
    
    // 编辑模态框的会员选项
    let editHtml = '';
    
    memberships.forEach(membership => {
        editHtml += `
            <div class="form-check form-check-inline">
                <input class="form-check-input edit-membership-checkbox" type="checkbox" id="edit-membership-${membership.id}" value="${membership.id}">
                <label class="form-check-label" for="edit-membership-${membership.id}">${membership.name}</label>
            </div>
        `;
    });
    
    editMembershipOptions.innerHTML = editHtml;
}

// 填充促销活动下拉框
function populatePromotionDropdowns() {
    const couponPromotionId = document.getElementById('couponPromotionId');
    const batchPromotionId = document.getElementById('batchPromotionId');
    
    // 清空选项
    couponPromotionId.innerHTML = '<option value="">请选择促销活动</option>';
    batchPromotionId.innerHTML = '<option value="">请选择促销活动</option>';
    
    // 添加活跃的促销活动
    const now = new Date().toISOString();
    const activePromotions = promotions.filter(p => p.isActive && p.startDate <= now && p.endDate >= now);
    
    activePromotions.forEach(promotion => {
        const option = document.createElement('option');
        option.value = promotion.id;
        option.textContent = promotion.name;
        
        couponPromotionId.appendChild(option.cloneNode(true));
        batchPromotionId.appendChild(option);
    });
}

// 保存促销活动
async function savePromotion() {
    const name = document.getElementById('promotionName').value;
    const description = document.getElementById('promotionDescription').value;
    const type = document.getElementById('promotionType').value;
    const value = parseFloat(document.getElementById('promotionValue').value);
    const startDate = document.getElementById('promotionStartDate').value;
    const endDate = document.getElementById('promotionEndDate').value;
    const minPurchaseAmount = parseFloat(document.getElementById('promotionMinPurchase').value) || 0;
    const maxDiscountAmount = document.getElementById('promotionMaxDiscount').value ? parseFloat(document.getElementById('promotionMaxDiscount').value) : null;
    const isActive = document.getElementById('promotionIsActive').checked;
    const createCouponForPromotion = document.getElementById('createCouponForPromotion').checked;
    const couponCode = document.getElementById('promotionCouponCode').value;
    
    // 收集选中的会员等级
    const membershipCheckboxes = document.querySelectorAll('.membership-checkbox:checked');
    const membershipIds = Array.from(membershipCheckboxes).map(cb => cb.value);
    
    // 验证必填字段
    if (!name || !type || value === undefined || isNaN(value)) {
        showAlert('请填写所有必填字段', 'danger');
        return;
    }
    
    // 验证促销值
    if (type === 'percentage' && (value <= 0 || value > 100)) {
        showAlert('百分比折扣必须在0-100之间', 'danger');
        return;
    } else if ((type === 'fixed' || type === 'free_upgrade') && value <= 0) {
        showAlert('固定金额折扣必须大于0', 'danger');
        return;
    }
    
    // 验证日期
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        showAlert('结束日期必须晚于开始日期', 'danger');
        return;
    }
    
    // 验证优惠码
    if (createCouponForPromotion && !couponCode) {
        showAlert('请输入优惠码或生成随机优惠码', 'danger');
        return;
    }
    
    // 构建请求数据
    const promotionData = {
        name,
        description,
        type,
        value,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minPurchaseAmount,
        maxDiscountAmount,
        isActive,
        membershipIds,
        couponCode: createCouponForPromotion ? couponCode : undefined
    };
    
    try {
        const response = await fetch('/api/promotion/promotions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(promotionData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('促销活动创建成功', 'success');
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('createPromotionModal'));
            modal.hide();
            
            // 重置表单
            document.getElementById('createPromotionForm').reset();
            document.getElementById('couponCodeSection').classList.add('d-none');
            
            // 重新加载促销活动
            loadPromotions();
        } else {
            showAlert('创建促销活动失败: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('创建促销活动失败:', error);
        showAlert('创建促销活动失败，请检查网络连接', 'danger');
    }
}

// 编辑促销活动
function editPromotion(promotionId) {
    const promotion = promotions.find(p => p.id === promotionId);
    
    if (!promotion) {
        showAlert('找不到促销活动', 'danger');
        return;
    }
    
    // 填充表单
    document.getElementById('editPromotionId').value = promotion.id;
    document.getElementById('editPromotionName').value = promotion.name;
    document.getElementById('editPromotionDescription').value = promotion.description || '';
    document.getElementById('editPromotionType').value = promotion.type;
    document.getElementById('editPromotionValue').value = promotion.value;
    
    // 设置值类型显示
    const editValueType = document.getElementById('editValueType');
    if (promotion.type === 'percentage') {
        editValueType.textContent = '%';
    } else {
        editValueType.textContent = '¥';
    }
    
    // 设置日期
    if (promotion.startDate) {
        document.getElementById('editPromotionStartDate').value = formatDateForInput(promotion.startDate);
    }
    
    if (promotion.endDate) {
        document.getElementById('editPromotionEndDate').value = formatDateForInput(promotion.endDate);
    }
    
    document.getElementById('editPromotionMinPurchase').value = promotion.minPurchaseAmount || 0;
    document.getElementById('editPromotionMaxDiscount').value = promotion.maxDiscountAmount || '';
    document.getElementById('editPromotionIsActive').checked = promotion.isActive;
    
    // 设置会员等级
    const membershipCheckboxes = document.querySelectorAll('.edit-membership-checkbox');
    membershipCheckboxes.forEach(cb => {
        cb.checked = promotion.membershipIds && promotion.membershipIds.includes(cb.value);
    });
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('editPromotionModal'));
    modal.show();
}

// 更新促销活动
async function updatePromotion() {
    const promotionId = document.getElementById('editPromotionId').value;
    const name = document.getElementById('editPromotionName').value;
    const description = document.getElementById('editPromotionDescription').value;
    const type = document.getElementById('editPromotionType').value;
    const value = parseFloat(document.getElementById('editPromotionValue').value);
    const startDate = document.getElementById('editPromotionStartDate').value;
    const endDate = document.getElementById('editPromotionEndDate').value;
    const minPurchaseAmount = parseFloat(document.getElementById('editPromotionMinPurchase').value) || 0;
    const maxDiscountAmount = document.getElementById('editPromotionMaxDiscount').value ? parseFloat(document.getElementById('editPromotionMaxDiscount').value) : null;
    const isActive = document.getElementById('editPromotionIsActive').checked;
    
    // 收集选中的会员等级
    const membershipCheckboxes = document.querySelectorAll('.edit-membership-checkbox:checked');
    const membershipIds = Array.from(membershipCheckboxes).map(cb => cb.value);
    
    // 验证必填字段
    if (!name || !type || value === undefined || isNaN(value)) {
        showAlert('请填写所有必填字段', 'danger');
        return;
    }
    
    // 验证促销值
    if (type === 'percentage' && (value <= 0 || value > 100)) {
        showAlert('百分比折扣必须在0-100之间', 'danger');
        return;
    } else if ((type === 'fixed' || type === 'free_upgrade') && value <= 0) {
        showAlert('固定金额折扣必须大于0', 'danger');
        return;
    }
    
    // 验证日期
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        showAlert('结束日期必须晚于开始日期', 'danger');
        return;
    }
    
    // 构建请求数据
    const promotionData = {
        name,
        description,
        type,
        value,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minPurchaseAmount,
        maxDiscountAmount,
        isActive,
        membershipIds
    };
    
    try {
        const response = await fetch(`/api/promotion/promotions/${promotionId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(promotionData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('促销活动更新成功', 'success');
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('editPromotionModal'));
            modal.hide();
            
            // 重新加载促销活动
            loadPromotions();
        } else {
            showAlert('更新促销活动失败: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('更新促销活动失败:', error);
        showAlert('更新促销活动失败，请检查网络连接', 'danger');
    }
}

// 删除促销活动
async function deletePromotion(promotionId) {
    if (!confirm('确定要删除此促销活动吗？关联的优惠券也将被删除。')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/promotion/promotions/${promotionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('促销活动删除成功', 'success');
            
            // 重新加载促销活动和优惠券
            loadPromotions();
            loadCoupons(document.getElementById('showActiveOnly').checked);
        } else {
            showAlert('删除促销活动失败: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('删除促销活动失败:', error);
        showAlert('删除促销活动失败，请检查网络连接', 'danger');
    }
}

// 保存优惠券
async function saveCoupon() {
    const code = document.getElementById('couponCode').value;
    const promotionId = document.getElementById('couponPromotionId').value;
    const description = document.getElementById('couponDescription').value;
    const maxUsesPerUser = parseInt(document.getElementById('couponMaxUsesPerUser').value) || 1;
    const maxUsesTotal = parseInt(document.getElementById('couponMaxUsesTotal').value) || 0;
    const startDate = document.getElementById('couponStartDate').value;
    const endDate = document.getElementById('couponEndDate').value;
    const isActive = document.getElementById('couponIsActive').checked;
    
    // 验证必填字段
    if (!code || !promotionId) {
        showAlert('请填写所有必填字段', 'danger');
        return;
    }
    
    // 验证日期
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        showAlert('结束日期必须晚于开始日期', 'danger');
        return;
    }
    
    // 构建请求数据
    const couponData = {
        code,
        promotionId,
        description,
        maxUsesPerUser,
        maxUsesTotal,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isActive
    };
    
    try {
        const response = await fetch('/api/promotion/coupons', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(couponData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('优惠券创建成功', 'success');
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('createCouponModal'));
            modal.hide();
            
            // 重置表单
            document.getElementById('createCouponForm').reset();
            
            // 重新加载优惠券
            loadCoupons(document.getElementById('showActiveOnly').checked);
        } else {
            showAlert('创建优惠券失败: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('创建优惠券失败:', error);
        showAlert('创建优惠券失败，请检查网络连接', 'danger');
    }
}

// 删除优惠券
async function deleteCoupon(couponId) {
    if (!confirm('确定要删除此优惠券吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/promotion/coupons/${couponId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('优惠券删除成功', 'success');
            
            // 重新加载优惠券
            loadCoupons(document.getElementById('showActiveOnly').checked);
        } else {
            showAlert('删除优惠券失败: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('删除优惠券失败:', error);
        showAlert('删除优惠券失败，请检查网络连接', 'danger');
    }
}

// 批量生成优惠券
async function generateCouponsBatch() {
    const promotionId = document.getElementById('batchPromotionId').value;
    const count = parseInt(document.getElementById('batchCount').value) || 10;
    const prefix = document.getElementById('batchPrefix').value;
    const codeLength = parseInt(document.getElementById('batchCodeLength').value) || 8;
    const description = document.getElementById('batchDescription').value;
    const maxUsesPerUser = parseInt(document.getElementById('batchMaxUsesPerUser').value) || 1;
    
    // 验证必填字段
    if (!promotionId) {
        showAlert('请选择关联的促销活动', 'danger');
        return;
    }
    
    if (count <= 0 || count > 100) {
        showAlert('生成数量必须在1-100之间', 'danger');
        return;
    }
    
    if (codeLength < 4 || codeLength > 12) {
        showAlert('优惠码长度必须在4-12之间', 'danger');
        return;
    }
    
    // 构建请求数据
    const batchData = {
        promotionId,
        count,
        prefix,
        codeLength,
        description,
        maxUsesPerUser,
        maxUsesTotal: 1, // 每个优惠券只能使用一次
        isActive: true
    };
    
    try {
        const response = await fetch('/api/promotion/coupons/batch', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(batchData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 显示结果
            showBatchResult(result.data);
            
            // 关闭批量生成表单
            const batchForm = document.getElementById('batchCouponForm');
            const batchFormCollapse = bootstrap.Collapse.getInstance(batchForm);
            batchFormCollapse.hide();
            
            // 重置表单
            document.getElementById('batchCouponGenerateForm').reset();
            
            // 重新加载优惠券
            loadCoupons(document.getElementById('showActiveOnly').checked);
        } else {
            showAlert('批量生成优惠券失败: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('批量生成优惠券失败:', error);
        showAlert('批量生成优惠券失败，请检查网络连接', 'danger');
    }
}

// 显示批量生成结果
function showBatchResult(data) {
    const batchResultContent = document.getElementById('batchResultContent');
    const { coupons, errors, totalGenerated, totalErrors } = data;
    
    let html = `
        <div class="alert ${totalErrors > 0 ? 'alert-warning' : 'alert-success'}">
            成功生成 ${totalGenerated} 个优惠券，失败 ${totalErrors} 个。
        </div>
    `;
    
    if (coupons && coupons.length > 0) {
        html += `
            <h5>生成的优惠券</h5>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>优惠码</th>
                            <th>描述</th>
                            <th>有效期</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        coupons.forEach(coupon => {
            html += `
                <tr>
                    <td><span class="coupon-code">${coupon.code}</span></td>
                    <td>${coupon.description || ''}</td>
                    <td>${formatDate(coupon.startDate)} 至 ${formatDate(coupon.endDate)}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    if (errors && errors.length > 0) {
        html += `
            <h5 class="text-danger">错误信息</h5>
            <ul class="list-group">
        `;
        
        errors.forEach(error => {
            html += `<li class="list-group-item list-group-item-danger">${error}</li>`;
        });
        
        html += `</ul>`;
    }
    
    batchResultContent.innerHTML = html;
    
    // 保存生成的优惠券用于下载
    window.generatedCoupons = coupons;
    
    // 显示结果模态框
    const modal = new bootstrap.Modal(document.getElementById('batchResultModal'));
    modal.show();
}

// 下载优惠券CSV
function downloadCouponsCSV() {
    if (!window.generatedCoupons || window.generatedCoupons.length === 0) {
        showAlert('没有可下载的优惠券数据', 'warning');
        return;
    }
    
    const coupons = window.generatedCoupons;
    
    // 创建CSV内容
    let csvContent = 'data:text/csv;charset=utf-8,优惠码,描述,开始日期,结束日期\n';
    
    coupons.forEach(coupon => {
        const row = [
            coupon.code,
            `"${(coupon.description || '').replace(/"/g, '""')}"`,
            formatDate(coupon.startDate),
            formatDate(coupon.endDate)
        ];
        
        csvContent += row.join(',') + '\n';
    });
    
    // 创建下载链接
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `优惠券_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    
    // 触发下载
    link.click();
    
    // 清理
    document.body.removeChild(link);
}

// 生成随机优惠码
function generateRandomCouponCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
    }
    
    return code;
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    return moment(dateString).format('YYYY-MM-DD HH:mm');
}

// 格式化日期用于输入框
function formatDateForInput(dateString) {
    if (!dateString) return '';
    return moment(dateString).format('YYYY-MM-DDTHH:mm');
}

// 显示提示信息
function showAlert(message, type = 'info') {
    // 创建提示元素
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '500px';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // 添加到页面
    document.body.appendChild(alertDiv);
    
    // 自动关闭
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
}

// 登出
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}
