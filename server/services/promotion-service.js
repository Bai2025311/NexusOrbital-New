/**
 * NexusOrbital 促销活动和优惠券服务
 * 提供促销活动创建、优惠券管理和折扣计算功能
 */
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// 数据文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const PROMOTIONS_FILE = path.join(DATA_DIR, 'promotions.json');
const COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');
const COUPON_USAGE_FILE = path.join(DATA_DIR, 'coupon-usage.json');
const MEMBERSHIPS_FILE = path.join(DATA_DIR, 'memberships.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
function initDataFile(filePath, initialData = {}) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    }
}

// 初始化促销和优惠券文件
initDataFile(PROMOTIONS_FILE, { promotions: [] });
initDataFile(COUPONS_FILE, { coupons: [] });
initDataFile(COUPON_USAGE_FILE, { usages: [] });

/**
 * 读取数据文件
 * @param {string} filePath - 文件路径
 * @returns {Object} - 解析后的数据
 */
function readDataFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            if (filePath === PROMOTIONS_FILE) return { promotions: [] };
            if (filePath === COUPONS_FILE) return { coupons: [] };
            if (filePath === COUPON_USAGE_FILE) return { usages: [] };
            return {};
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件失败 ${filePath}:`, error);
        if (filePath === PROMOTIONS_FILE) return { promotions: [] };
        if (filePath === COUPONS_FILE) return { coupons: [] };
        if (filePath === COUPON_USAGE_FILE) return { usages: [] };
        return {};
    }
}

/**
 * 写入数据文件
 * @param {string} filePath - 文件路径
 * @param {Object} data - 要写入的数据
 */
function writeDataFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`写入文件失败 ${filePath}:`, error);
    }
}

/**
 * 创建促销活动
 * @param {Object} promotionData - 促销活动数据
 * @returns {Promise<Object>} - 操作结果
 */
async function createPromotion(promotionData) {
    try {
        const {
            name,
            description,
            type,
            value,
            startDate,
            endDate,
            membershipIds,
            minPurchaseAmount,
            maxDiscountAmount,
            isActive,
            couponCode
        } = promotionData;

        // 验证必要字段
        if (!name || !type || !value) {
            return {
                success: false,
                error: '缺少必要参数'
            };
        }

        // 验证促销类型
        const validTypes = ['percentage', 'fixed', 'free_upgrade'];
        if (!validTypes.includes(type)) {
            return {
                success: false,
                error: '无效的促销类型'
            };
        }

        // 验证促销值
        if (type === 'percentage' && (value <= 0 || value > 100)) {
            return {
                success: false,
                error: '百分比折扣必须在0-100之间'
            };
        } else if (type === 'fixed' && value <= 0) {
            return {
                success: false,
                error: '固定金额折扣必须大于0'
            };
        }

        // 验证日期
        const now = moment();
        const start = startDate ? moment(startDate) : now;
        const end = endDate ? moment(endDate) : moment().add(30, 'days');

        if (end.isBefore(start)) {
            return {
                success: false,
                error: '结束日期不能早于开始日期'
            };
        }

        // 读取促销数据
        const promotionsData = readDataFile(PROMOTIONS_FILE);

        // 生成促销ID
        const promotionId = uuidv4();

        // 创建促销对象
        const newPromotion = {
            id: promotionId,
            name,
            description: description || '',
            type,
            value: parseFloat(value),
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            membershipIds: membershipIds || [],
            minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : 0,
            maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: moment().toISOString(),
            updatedAt: moment().toISOString()
        };

        // 如果有优惠码，创建对应的优惠券
        if (couponCode) {
            const couponResult = await createCoupon({
                code: couponCode,
                promotionId,
                description: `${name} 优惠券`,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                isActive: isActive !== undefined ? isActive : true,
                maxUsesPerUser: 1,
                maxUsesTotal: 0 // 无限制
            });

            if (!couponResult.success) {
                return couponResult;
            }

            newPromotion.couponId = couponResult.data.id;
        }

        // 添加到促销列表
        promotionsData.promotions.push(newPromotion);
        writeDataFile(PROMOTIONS_FILE, promotionsData);

        return {
            success: true,
            data: newPromotion
        };
    } catch (error) {
        console.error('创建促销活动失败:', error);
        return {
            success: false,
            error: error.message || '创建促销活动失败'
        };
    }
}

/**
 * 更新促销活动
 * @param {string} promotionId - 促销活动ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} - 操作结果
 */
async function updatePromotion(promotionId, updateData) {
    try {
        if (!promotionId) {
            return {
                success: false,
                error: '缺少促销活动ID'
            };
        }

        // 读取促销数据
        const promotionsData = readDataFile(PROMOTIONS_FILE);
        const promotionIndex = promotionsData.promotions.findIndex(p => p.id === promotionId);

        if (promotionIndex === -1) {
            return {
                success: false,
                error: '促销活动不存在'
            };
        }

        const promotion = promotionsData.promotions[promotionIndex];

        // 更新字段
        const updatedPromotion = {
            ...promotion,
            ...updateData,
            updatedAt: moment().toISOString()
        };

        // 如果更新了日期，验证日期
        if (updateData.startDate || updateData.endDate) {
            const start = updateData.startDate ? moment(updateData.startDate) : moment(promotion.startDate);
            const end = updateData.endDate ? moment(updateData.endDate) : moment(promotion.endDate);

            if (end.isBefore(start)) {
                return {
                    success: false,
                    error: '结束日期不能早于开始日期'
                };
            }

            updatedPromotion.startDate = start.toISOString();
            updatedPromotion.endDate = end.toISOString();
        }

        // 更新促销活动
        promotionsData.promotions[promotionIndex] = updatedPromotion;
        writeDataFile(PROMOTIONS_FILE, promotionsData);

        // 如果有关联的优惠券，也更新优惠券
        if (promotion.couponId) {
            const couponUpdateData = {};
            
            if (updateData.isActive !== undefined) {
                couponUpdateData.isActive = updateData.isActive;
            }
            
            if (updateData.startDate) {
                couponUpdateData.startDate = updateData.startDate;
            }
            
            if (updateData.endDate) {
                couponUpdateData.endDate = updateData.endDate;
            }
            
            if (Object.keys(couponUpdateData).length > 0) {
                await updateCoupon(promotion.couponId, couponUpdateData);
            }
        }

        return {
            success: true,
            data: updatedPromotion
        };
    } catch (error) {
        console.error('更新促销活动失败:', error);
        return {
            success: false,
            error: error.message || '更新促销活动失败'
        };
    }
}

/**
 * 获取所有促销活动
 * @param {boolean} activeOnly - 是否只返回活跃的促销活动
 * @returns {Promise<Object>} - 促销活动列表
 */
async function getAllPromotions(activeOnly = false) {
    try {
        const promotionsData = readDataFile(PROMOTIONS_FILE);
        let promotions = promotionsData.promotions;

        if (activeOnly) {
            const now = moment().toISOString();
            promotions = promotions.filter(p => 
                p.isActive && 
                p.startDate <= now && 
                p.endDate >= now
            );
        }

        return {
            success: true,
            data: promotions
        };
    } catch (error) {
        console.error('获取促销活动失败:', error);
        return {
            success: false,
            error: error.message || '获取促销活动失败'
        };
    }
}

/**
 * 获取促销活动详情
 * @param {string} promotionId - 促销活动ID
 * @returns {Promise<Object>} - 促销活动详情
 */
async function getPromotionById(promotionId) {
    try {
        if (!promotionId) {
            return {
                success: false,
                error: '缺少促销活动ID'
            };
        }

        const promotionsData = readDataFile(PROMOTIONS_FILE);
        const promotion = promotionsData.promotions.find(p => p.id === promotionId);

        if (!promotion) {
            return {
                success: false,
                error: '促销活动不存在'
            };
        }

        return {
            success: true,
            data: promotion
        };
    } catch (error) {
        console.error('获取促销活动详情失败:', error);
        return {
            success: false,
            error: error.message || '获取促销活动详情失败'
        };
    }
}

/**
 * 删除促销活动
 * @param {string} promotionId - 促销活动ID
 * @returns {Promise<Object>} - 操作结果
 */
async function deletePromotion(promotionId) {
    try {
        if (!promotionId) {
            return {
                success: false,
                error: '缺少促销活动ID'
            };
        }

        const promotionsData = readDataFile(PROMOTIONS_FILE);
        const promotionIndex = promotionsData.promotions.findIndex(p => p.id === promotionId);

        if (promotionIndex === -1) {
            return {
                success: false,
                error: '促销活动不存在'
            };
        }

        const promotion = promotionsData.promotions[promotionIndex];

        // 删除关联的优惠券
        if (promotion.couponId) {
            await deleteCoupon(promotion.couponId);
        }

        // 删除促销活动
        promotionsData.promotions.splice(promotionIndex, 1);
        writeDataFile(PROMOTIONS_FILE, promotionsData);

        return {
            success: true,
            data: { id: promotionId }
        };
    } catch (error) {
        console.error('删除促销活动失败:', error);
        return {
            success: false,
            error: error.message || '删除促销活动失败'
        };
    }
}

/**
 * 创建优惠券
 * @param {Object} couponData - 优惠券数据
 * @returns {Promise<Object>} - 操作结果
 */
async function createCoupon(couponData) {
    try {
        const {
            code,
            promotionId,
            description,
            startDate,
            endDate,
            isActive,
            maxUsesPerUser,
            maxUsesTotal
        } = couponData;

        // 验证必要字段
        if (!code || !promotionId) {
            return {
                success: false,
                error: '缺少必要参数'
            };
        }

        // 读取优惠券数据
        const couponsData = readDataFile(COUPONS_FILE);

        // 检查优惠码是否已存在
        const existingCoupon = couponsData.coupons.find(c => c.code === code);
        if (existingCoupon) {
            return {
                success: false,
                error: '优惠码已存在'
            };
        }

        // 验证日期
        const now = moment();
        const start = startDate ? moment(startDate) : now;
        const end = endDate ? moment(endDate) : moment().add(30, 'days');

        if (end.isBefore(start)) {
            return {
                success: false,
                error: '结束日期不能早于开始日期'
            };
        }

        // 生成优惠券ID
        const couponId = uuidv4();

        // 创建优惠券对象
        const newCoupon = {
            id: couponId,
            code,
            promotionId,
            description: description || '',
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            isActive: isActive !== undefined ? isActive : true,
            maxUsesPerUser: maxUsesPerUser || 1,
            maxUsesTotal: maxUsesTotal || 0, // 0表示无限制
            usedCount: 0,
            createdAt: moment().toISOString(),
            updatedAt: moment().toISOString()
        };

        // 添加到优惠券列表
        couponsData.coupons.push(newCoupon);
        writeDataFile(COUPONS_FILE, couponsData);

        return {
            success: true,
            data: newCoupon
        };
    } catch (error) {
        console.error('创建优惠券失败:', error);
        return {
            success: false,
            error: error.message || '创建优惠券失败'
        };
    }
}

/**
 * 更新优惠券
 * @param {string} couponId - 优惠券ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} - 操作结果
 */
async function updateCoupon(couponId, updateData) {
    try {
        if (!couponId) {
            return {
                success: false,
                error: '缺少优惠券ID'
            };
        }

        // 读取优惠券数据
        const couponsData = readDataFile(COUPONS_FILE);
        const couponIndex = couponsData.coupons.findIndex(c => c.id === couponId);

        if (couponIndex === -1) {
            return {
                success: false,
                error: '优惠券不存在'
            };
        }

        const coupon = couponsData.coupons[couponIndex];

        // 更新字段
        const updatedCoupon = {
            ...coupon,
            ...updateData,
            updatedAt: moment().toISOString()
        };

        // 如果更新了日期，验证日期
        if (updateData.startDate || updateData.endDate) {
            const start = updateData.startDate ? moment(updateData.startDate) : moment(coupon.startDate);
            const end = updateData.endDate ? moment(updateData.endDate) : moment(coupon.endDate);

            if (end.isBefore(start)) {
                return {
                    success: false,
                    error: '结束日期不能早于开始日期'
                };
            }

            updatedCoupon.startDate = start.toISOString();
            updatedCoupon.endDate = end.toISOString();
        }

        // 更新优惠券
        couponsData.coupons[couponIndex] = updatedCoupon;
        writeDataFile(COUPONS_FILE, couponsData);

        return {
            success: true,
            data: updatedCoupon
        };
    } catch (error) {
        console.error('更新优惠券失败:', error);
        return {
            success: false,
            error: error.message || '更新优惠券失败'
        };
    }
}

/**
 * 获取所有优惠券
 * @param {boolean} activeOnly - 是否只返回活跃的优惠券
 * @returns {Promise<Object>} - 优惠券列表
 */
async function getAllCoupons(activeOnly = false) {
    try {
        const couponsData = readDataFile(COUPONS_FILE);
        let coupons = couponsData.coupons;

        if (activeOnly) {
            const now = moment().toISOString();
            coupons = coupons.filter(c => 
                c.isActive && 
                c.startDate <= now && 
                c.endDate >= now &&
                (c.maxUsesTotal === 0 || c.usedCount < c.maxUsesTotal)
            );
        }

        return {
            success: true,
            data: coupons
        };
    } catch (error) {
        console.error('获取优惠券失败:', error);
        return {
            success: false,
            error: error.message || '获取优惠券失败'
        };
    }
}

/**
 * 获取优惠券详情
 * @param {string} couponId - 优惠券ID
 * @returns {Promise<Object>} - 优惠券详情
 */
async function getCouponById(couponId) {
    try {
        if (!couponId) {
            return {
                success: false,
                error: '缺少优惠券ID'
            };
        }

        const couponsData = readDataFile(COUPONS_FILE);
        const coupon = couponsData.coupons.find(c => c.id === couponId);

        if (!coupon) {
            return {
                success: false,
                error: '优惠券不存在'
            };
        }

        return {
            success: true,
            data: coupon
        };
    } catch (error) {
        console.error('获取优惠券详情失败:', error);
        return {
            success: false,
            error: error.message || '获取优惠券详情失败'
        };
    }
}

/**
 * 根据优惠码获取优惠券
 * @param {string} code - 优惠码
 * @returns {Promise<Object>} - 优惠券详情
 */
async function getCouponByCode(code) {
    try {
        if (!code) {
            return {
                success: false,
                error: '缺少优惠码'
            };
        }

        const couponsData = readDataFile(COUPONS_FILE);
        const coupon = couponsData.coupons.find(c => c.code === code);

        if (!coupon) {
            return {
                success: false,
                error: '优惠券不存在'
            };
        }

        return {
            success: true,
            data: coupon
        };
    } catch (error) {
        console.error('获取优惠券详情失败:', error);
        return {
            success: false,
            error: error.message || '获取优惠券详情失败'
        };
    }
}

/**
 * 删除优惠券
 * @param {string} couponId - 优惠券ID
 * @returns {Promise<Object>} - 操作结果
 */
async function deleteCoupon(couponId) {
    try {
        if (!couponId) {
            return {
                success: false,
                error: '缺少优惠券ID'
            };
        }

        const couponsData = readDataFile(COUPONS_FILE);
        const couponIndex = couponsData.coupons.findIndex(c => c.id === couponId);

        if (couponIndex === -1) {
            return {
                success: false,
                error: '优惠券不存在'
            };
        }

        // 删除优惠券
        couponsData.coupons.splice(couponIndex, 1);
        writeDataFile(COUPONS_FILE, couponsData);

        return {
            success: true,
            data: { id: couponId }
        };
    } catch (error) {
        console.error('删除优惠券失败:', error);
        return {
            success: false,
            error: error.message || '删除优惠券失败'
        };
    }
}

/**
 * 验证优惠券
 * @param {string} code - 优惠码
 * @param {string} userId - 用户ID
 * @param {number} amount - 订单金额
 * @param {string} membershipId - 会员ID
 * @returns {Promise<Object>} - 验证结果
 */
async function validateCoupon(code, userId, amount, membershipId) {
    try {
        if (!code) {
            return {
                success: false,
                error: '缺少优惠码'
            };
        }

        if (!userId) {
            return {
                success: false,
                error: '缺少用户ID'
            };
        }

        // 获取优惠券
        const couponResult = await getCouponByCode(code);
        if (!couponResult.success) {
            return couponResult;
        }

        const coupon = couponResult.data;

        // 检查优惠券是否有效
        const now = moment().toISOString();
        if (!coupon.isActive) {
            return {
                success: false,
                error: '优惠券已禁用'
            };
        }

        if (coupon.startDate > now) {
            return {
                success: false,
                error: '优惠券尚未生效'
            };
        }

        if (coupon.endDate < now) {
            return {
                success: false,
                error: '优惠券已过期'
            };
        }

        // 检查使用次数限制
        if (coupon.maxUsesTotal > 0 && coupon.usedCount >= coupon.maxUsesTotal) {
            return {
                success: false,
                error: '优惠券已达到最大使用次数'
            };
        }

        // 检查用户使用次数
        const usageData = readDataFile(COUPON_USAGE_FILE);
        const userUsages = usageData.usages.filter(u => 
            u.userId === userId && u.couponId === coupon.id
        );

        if (coupon.maxUsesPerUser > 0 && userUsages.length >= coupon.maxUsesPerUser) {
            return {
                success: false,
                error: '您已达到此优惠券的最大使用次数'
            };
        }

        // 获取关联的促销活动
        const promotionResult = await getPromotionById(coupon.promotionId);
        if (!promotionResult.success) {
            return {
                success: false,
                error: '无法获取促销活动信息'
            };
        }

        const promotion = promotionResult.data;

        // 检查促销活动是否有效
        if (!promotion.isActive) {
            return {
                success: false,
                error: '关联的促销活动已禁用'
            };
        }

        if (promotion.startDate > now) {
            return {
                success: false,
                error: '关联的促销活动尚未开始'
            };
        }

        if (promotion.endDate < now) {
            return {
                success: false,
                error: '关联的促销活动已结束'
            };
        }

        // 检查最低消费金额
        if (promotion.minPurchaseAmount > 0 && amount < promotion.minPurchaseAmount) {
            return {
                success: false,
                error: `订单金额不满足最低消费要求，最低消费金额为 ¥${promotion.minPurchaseAmount.toFixed(2)}`
            };
        }

        // 检查会员限制
        if (promotion.membershipIds && promotion.membershipIds.length > 0) {
            if (!membershipId || !promotion.membershipIds.includes(membershipId)) {
                return {
                    success: false,
                    error: '您的会员等级不符合此优惠券的使用条件'
                };
            }
        }

        // 计算折扣金额
        let discountAmount = 0;
        if (promotion.type === 'percentage') {
            discountAmount = amount * (promotion.value / 100);
        } else if (promotion.type === 'fixed') {
            discountAmount = promotion.value;
        }

        // 限制最大折扣金额
        if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
            discountAmount = promotion.maxDiscountAmount;
        }

        // 确保折扣不超过订单金额
        if (discountAmount > amount) {
            discountAmount = amount;
        }

        return {
            success: true,
            data: {
                couponId: coupon.id,
                promotionId: promotion.id,
                discountAmount,
                finalAmount: amount - discountAmount,
                promotionType: promotion.type,
                promotionValue: promotion.value
            }
        };
    } catch (error) {
        console.error('验证优惠券失败:', error);
        return {
            success: false,
            error: error.message || '验证优惠券失败'
        };
    }
}

/**
 * 应用优惠券
 * @param {string} couponId - 优惠券ID
 * @param {string} userId - 用户ID
 * @param {string} orderId - 订单ID
 * @param {number} amount - 订单金额
 * @param {number} discountAmount - 折扣金额
 * @returns {Promise<Object>} - 操作结果
 */
async function applyCoupon(couponId, userId, orderId, amount, discountAmount) {
    try {
        // 获取优惠券信息
        const couponResult = await getCouponById(couponId);
        if (!couponResult.success) {
            return couponResult;
        }

        const coupon = couponResult.data;

        // 记录使用记录
        const usageData = readDataFile(COUPON_USAGE_FILE);
        const usageId = uuidv4();
        
        const usage = {
            id: usageId,
            couponId,
            userId,
            orderId,
            amount,
            discountAmount,
            usedAt: moment().toISOString()
        };

        usageData.usages.push(usage);
        writeDataFile(COUPON_USAGE_FILE, usageData);

        // 更新优惠券使用次数
        const couponsData = readDataFile(COUPONS_FILE);
        const couponIndex = couponsData.coupons.findIndex(c => c.id === couponId);
        
        if (couponIndex !== -1) {
            couponsData.coupons[couponIndex].usedCount += 1;
            writeDataFile(COUPONS_FILE, couponsData);
        }

        return {
            success: true,
            data: {
                usageId,
                couponId,
                discountAmount
            }
        };
    } catch (error) {
        console.error('应用优惠券失败:', error);
        return {
            success: false,
            error: error.message || '应用优惠券失败'
        };
    }
}

/**
 * 生成随机优惠码
 * @param {number} length - 优惠码长度
 * @returns {string} - 随机优惠码
 */
function generateRandomCouponCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
    }
    
    return code;
}

/**
 * 批量生成优惠券
 * @param {Object} batchData - 批量生成数据
 * @returns {Promise<Object>} - 操作结果
 */
async function generateCouponsBatch(batchData) {
    try {
        const {
            promotionId,
            count,
            prefix,
            codeLength,
            description,
            startDate,
            endDate,
            isActive,
            maxUsesPerUser,
            maxUsesTotal
        } = batchData;

        if (!promotionId || !count || count <= 0) {
            return {
                success: false,
                error: '缺少必要参数'
            };
        }

        // 获取促销活动
        const promotionResult = await getPromotionById(promotionId);
        if (!promotionResult.success) {
            return promotionResult;
        }

        const length = codeLength || 8;
        const codePrefix = prefix || '';
        const results = [];
        const errors = [];

        // 批量生成优惠券
        for (let i = 0; i < count; i++) {
            let code = '';
            let attempts = 0;
            const maxAttempts = 10;
            
            // 尝试生成唯一的优惠码
            while (attempts < maxAttempts) {
                code = codePrefix + generateRandomCouponCode(length);
                
                // 检查优惠码是否已存在
                const existingCoupon = await getCouponByCode(code);
                if (!existingCoupon.success) {
                    break;
                }
                
                attempts++;
            }
            
            if (attempts >= maxAttempts) {
                errors.push(`无法生成唯一的优惠码，尝试次数: ${maxAttempts}`);
                continue;
            }
            
            // 创建优惠券
            const couponResult = await createCoupon({
                code,
                promotionId,
                description: description || `批量生成的优惠券 #${i+1}`,
                startDate,
                endDate,
                isActive,
                maxUsesPerUser,
                maxUsesTotal
            });
            
            if (couponResult.success) {
                results.push(couponResult.data);
            } else {
                errors.push(`优惠券 #${i+1} 创建失败: ${couponResult.error}`);
            }
        }

        return {
            success: true,
            data: {
                coupons: results,
                errors,
                totalGenerated: results.length,
                totalErrors: errors.length
            }
        };
    } catch (error) {
        console.error('批量生成优惠券失败:', error);
        return {
            success: false,
            error: error.message || '批量生成优惠券失败'
        };
    }
}

/**
 * 获取用户的优惠券使用记录
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 使用记录
 */
async function getUserCouponUsage(userId) {
    try {
        if (!userId) {
            return {
                success: false,
                error: '缺少用户ID'
            };
        }

        const usageData = readDataFile(COUPON_USAGE_FILE);
        const userUsages = usageData.usages.filter(u => u.userId === userId);

        // 按时间排序
        userUsages.sort((a, b) => moment(b.usedAt).diff(moment(a.usedAt)));

        // 获取优惠券详情
        const usagesWithDetails = await Promise.all(userUsages.map(async (usage) => {
            const couponResult = await getCouponById(usage.couponId);
            const coupon = couponResult.success ? couponResult.data : null;
            
            return {
                ...usage,
                couponCode: coupon ? coupon.code : '未知优惠券',
                couponDescription: coupon ? coupon.description : ''
            };
        }));

        return {
            success: true,
            data: usagesWithDetails
        };
    } catch (error) {
        console.error('获取用户优惠券使用记录失败:', error);
        return {
            success: false,
            error: error.message || '获取用户优惠券使用记录失败'
        };
    }
}

/**
 * 记录优惠券使用情况
 * @param {string} couponId - 优惠券ID
 * @param {string} userId - 用户ID
 * @param {string} orderId - 订单ID
 * @param {number} orderAmount - 订单原始金额
 * @param {number} discountAmount - 折扣金额
 * @returns {Promise<Object>} - 操作结果
 */
async function recordCouponUsage(couponId, userId, orderId, orderAmount, discountAmount) {
    try {
        // 获取优惠券信息
        const coupon = await getCouponById(couponId);
        if (!coupon) {
            throw new Error(`优惠券不存在: ${couponId}`);
        }

        // 获取优惠券使用记录
        const usageRecords = await getCouponUsageRecords();
        
        // 创建新的使用记录
        const usageRecord = {
            id: uuidv4(),
            couponId,
            userId,
            orderId,
            orderAmount,
            discountAmount,
            usedAt: moment().toISOString(),
            promotionId: coupon.promotionId
        };
        
        // 添加到使用记录
        usageRecords.push(usageRecord);
        
        // 保存使用记录
        await saveCouponUsageRecords(usageRecords);
        
        // 更新优惠券使用次数
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        
        // 如果优惠券只能使用一次，标记为已使用
        if (coupon.maxUses === 1) {
            coupon.isActive = false;
        }
        
        // 保存更新后的优惠券
        await updateCoupon(coupon);
        
        return {
            success: true,
            data: usageRecord
        };
    } catch (error) {
        console.error('记录优惠券使用失败:', error);
        return {
            success: false,
            error: error.message || '记录优惠券使用失败'
        };
    }
}

/**
 * 获取优惠券使用记录
 * @returns {Promise<Array>} - 优惠券使用记录
 */
async function getCouponUsageRecords() {
    const usageRecordsFile = path.join(__dirname, '../data/coupon-usage.json');
  
    // 如果文件不存在，返回空数组
    if (!fs.existsSync(usageRecordsFile)) {
        return [];
    }
  
    try {
        // 读取文件内容
        const data = await fs.promises.readFile(usageRecordsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取优惠券使用记录失败:', error);
        return [];
    }
}

/**
 * 保存优惠券使用记录
 * @param {Array} usageRecords - 优惠券使用记录
 * @returns {Promise<void>}
 */
async function saveCouponUsageRecords(usageRecords) {
    const dataDir = path.join(__dirname, '../data');
    const usageRecordsFile = path.join(dataDir, 'coupon-usage.json');
  
    // 确保目录存在
    if (!fs.existsSync(dataDir)) {
        await fs.promises.mkdir(dataDir, { recursive: true });
    }
  
    try {
        // 写入文件
        await fs.promises.writeFile(
            usageRecordsFile,
            JSON.stringify(usageRecords, null, 2),
            'utf8'
        );
    } catch (error) {
        console.error('保存优惠券使用记录失败:', error);
        throw error;
    }
}

/**
 * 获取用户的优惠券使用历史
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} - 用户的优惠券使用历史
 */
async function getUserCouponUsageHistory(userId) {
    try {
        // 获取所有使用记录
        const usageRecords = await getCouponUsageRecords();
        
        // 过滤出用户的使用记录
        const userRecords = usageRecords.filter(record => record.userId === userId);
        
        // 按使用时间降序排序
        userRecords.sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt));
        
        return {
            success: true,
            data: userRecords
        };
    } catch (error) {
        console.error('获取用户优惠券使用历史失败:', error);
        return {
            success: false,
            error: error.message || '获取用户优惠券使用历史失败'
        };
    }
}

/**
 * 获取所有优惠券使用记录
 * @returns {Promise<Array>} - 所有优惠券使用记录
 */
async function getAllCouponUsageRecords() {
    try {
        // 获取所有使用记录
        const usageRecords = await getCouponUsageRecords();
        
        // 按使用时间降序排序
        usageRecords.sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt));
        
        return usageRecords;
    } catch (error) {
        console.error('获取所有优惠券使用记录失败:', error);
        throw error;
    }
}

module.exports = {
    createPromotion,
    updatePromotion,
    getPromotionById,
    getAllPromotions,
    deletePromotion,
    createCoupon,
    updateCoupon,
    getCouponById,
    getAllCoupons,
    deleteCoupon,
    validateCoupon,
    generateRandomCouponCode,
    generateCouponsBatch,
    recordCouponUsage,
    getUserCouponUsageHistory,
    getAllCouponUsageRecords
};
