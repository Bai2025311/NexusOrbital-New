/**
 * NexusOrbital 简易服务器
 * 提供API服务和静态文件服务
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入支付路由
const paymentRoutes = require('./routes/payment-routes');
const refundRoutes = require('./routes/refund-routes');
const paymentAnalyticsRoutes = require('./routes/payment-analytics-routes');
const autoRenewalRoutes = require('./routes/auto-renewal-routes');
const membershipUpgradeRoutes = require('./routes/membership-upgrade-routes');
const promotionRoutes = require('./routes/promotion-routes');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 为Stripe webhook添加原始请求体解析
app.use('/api/payment/callback/stripe', express.raw({ type: 'application/json' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '..')));

// 数据文件路径
const usersFilePath = path.join(__dirname, 'data', 'users.json');
const transactionsFilePath = path.join(__dirname, 'data', 'transactions.json');

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 确保日志目录存在
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// 辅助函数：读取JSON文件
function readJsonFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            // 如果文件不存在，创建默认结构
            if (filePath === usersFilePath) {
                writeJsonFile(filePath, { users: [] });
            } else if (filePath === transactionsFilePath) {
                writeJsonFile(filePath, { transactions: [] });
            }
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件失败: ${filePath}`, error);
        return null;
    }
}

// 辅助函数：写入JSON文件
function writeJsonFile(filePath, data) {
    try {
        // 确保目录存在
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`写入文件失败: ${filePath}`, error);
        return false;
    }
}

// 辅助函数：生成简单的令牌
function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 辅助函数：验证令牌
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: '未提供有效的认证令牌'
        });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 实际项目中应该验证令牌的有效性
    // 这里简化处理，假设所有令牌都有效
    req.token = token;
    
    // 获取用户ID（实际项目中应从令牌中解析）
    req.userId = 'user_001'; // 模拟用户ID
    
    // 添加用户信息到请求对象
    req.user = {
        id: req.userId,
        email: 'user@example.com',
        name: 'Test User',
        isAdmin: true // 为了测试，将所有用户设为管理员
    };
    
    next();
}

// 认证中间件
const { validatePaymentRequest, validateRegistrationRequest, validateLoginRequest } = require('./middleware/validators');

// 使用支付路由
app.use('/api/payment', paymentRoutes);

// 使用退款路由
app.use('/api/refund', refundRoutes);

// 使用支付分析路由
app.use('/api/payment-analytics', paymentAnalyticsRoutes);

// 使用自动续费路由
app.use('/api/auto-renewal', autoRenewalRoutes);

// 使用会员升级/降级路由
app.use('/api/membership-upgrade', membershipUpgradeRoutes);

// 使用促销活动和优惠券路由
app.use('/api/promotion', promotionRoutes);

// 用户登录
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: '邮箱和密码不能为空'
        });
    }
    
    // 读取用户数据
    const userData = readJsonFile(usersFilePath);
    
    if (!userData) {
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
    
    // 查找用户
    const user = userData.users.find(u => u.email === email);
    
    if (!user || user.password !== password) { // 实际项目中应使用加密比较
        return res.status(401).json({
            success: false,
            message: '邮箱或密码错误'
        });
    }
    
    // 生成令牌
    const token = generateToken();
    
    // 返回用户信息和令牌
    res.json({
        success: true,
        data: {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                membership: user.membership
            }
        }
    });
});

// 用户注册
app.post('/api/auth/register', (req, res) => {
    const { username, email, password, name } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: '用户名、邮箱和密码不能为空'
        });
    }
    
    // 读取用户数据
    const userData = readJsonFile(usersFilePath);
    
    if (!userData) {
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
    
    // 检查用户是否已存在
    if (userData.users.some(u => u.email === email || u.username === username)) {
        return res.status(409).json({
            success: false,
            message: '用户名或邮箱已被注册'
        });
    }
    
    // 创建新用户
    const newUser = {
        id: `user_${Date.now()}`,
        username,
        email,
        password, // 实际项目中应加密存储
        name: name || username,
        avatar: '../images/avatar-placeholder.jpg',
        membership: {
            id: 'free',
            name: '免费用户',
            startDate: new Date().toISOString().split('T')[0],
            endDate: null,
            features: [
                "基础技术资源访问",
                "社区讨论参与",
                "公开项目浏览"
            ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // 添加新用户
    userData.users.push(newUser);
    
    // 保存用户数据
    if (!writeJsonFile(usersFilePath, userData)) {
        return res.status(500).json({
            success: false,
            message: '注册失败，请稍后再试'
        });
    }
    
    // 生成令牌
    const token = generateToken();
    
    // 返回用户信息和令牌
    res.status(201).json({
        success: true,
        data: {
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                name: newUser.name,
                avatar: newUser.avatar,
                membership: newUser.membership
            }
        }
    });
});

// 获取用户信息
app.get('/api/user', verifyToken, (req, res) => {
    // 读取用户数据
    const userData = readJsonFile(usersFilePath);
    
    if (!userData) {
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
    
    // 查找用户
    const user = userData.users.find(u => u.id === req.userId);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: '用户不存在'
        });
    }
    
    // 返回用户信息
    res.json({
        success: true,
        data: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            membership: user.membership
        }
    });
});

// 更新用户会员信息
app.post('/api/user/membership', verifyToken, (req, res) => {
    const { membershipId } = req.body;
    
    if (!membershipId) {
        return res.status(400).json({
            success: false,
            message: '会员ID不能为空'
        });
    }
    
    // 读取用户数据
    const userData = readJsonFile(usersFilePath);
    
    if (!userData) {
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
    
    // 查找用户
    const userIndex = userData.users.findIndex(u => u.id === req.userId);
    
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            message: '用户不存在'
        });
    }
    
    // 更新会员信息
    const user = userData.users[userIndex];
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
    
    // 根据会员ID设置会员信息
    if (membershipId === 'professional') {
        user.membership = {
            id: 'professional',
            name: '专业会员计划',
            startDate,
            endDate,
            features: [
                "基础技术资源访问",
                "社区讨论参与",
                "公开项目浏览",
                "高级项目协作工具",
                "专家一对一咨询（每月1次）",
                "优先项目孵化支持",
                "专属技术研讨会",
                "API高级访问权限"
            ]
        };
    } else if (membershipId === 'enterprise') {
        user.membership = {
            id: 'enterprise',
            name: '企业会员计划',
            startDate,
            endDate,
            features: [
                "专业会员所有权益",
                "定制化技术支持",
                "企业级API访问",
                "优先漏洞修复",
                "专属技术顾问",
                "企业品牌展示"
            ]
        };
    } else if (membershipId === 'founder') {
        user.membership = {
            id: 'founder',
            name: '创始会员计划',
            startDate,
            endDate,
            features: [
                "无限访问所有技术资源",
                "优先参与众筹项目",
                "专家社区直接交流",
                "每月专属线上活动",
                "项目协作工具高级功能",
                "创始会员专属徽章"
            ]
        };
    } else {
        return res.status(400).json({
            success: false,
            message: '无效的会员ID'
        });
    }
    
    // 更新用户数据
    user.updatedAt = new Date().toISOString();
    userData.users[userIndex] = user;
    
    // 保存用户数据
    if (!writeJsonFile(usersFilePath, userData)) {
        return res.status(500).json({
            success: false,
            message: '更新会员信息失败，请稍后再试'
        });
    }
    
    // 返回更新后的会员信息
    res.json({
        success: true,
        data: {
            membership: user.membership
        }
    });
});

// 创建交易记录
app.post('/api/transactions', verifyToken, (req, res) => {
    const { amount, paymentMethod, membershipId, description } = req.body;
    
    if (!amount || !paymentMethod || !membershipId) {
        return res.status(400).json({
            success: false,
            message: '金额、支付方式和会员ID不能为空'
        });
    }
    
    // 读取交易数据
    const transactionData = readJsonFile(transactionsFilePath);
    
    if (!transactionData) {
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
    
    // 生成交易ID
    const date = new Date();
    const transactionId = `NO${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${transactionData.transactions.length + 1}`.padStart(12, '0');
    
    // 创建新交易记录
    const newTransaction = {
        id: `txn_${Date.now()}`,
        transactionId,
        userId: req.userId,
        amount: parseFloat(amount),
        paymentMethod,
        membershipId,
        description: description || `升级到${membershipId}会员`,
        status: 'completed', // 实际项目中应根据支付结果设置
        date: new Date().toISOString(),
        metadata: {
            paymentId: `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`,
            platform: 'web'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // 添加新交易记录
    transactionData.transactions.push(newTransaction);
    
    // 保存交易数据
    if (!writeJsonFile(transactionsFilePath, transactionData)) {
        return res.status(500).json({
            success: false,
            message: '创建交易记录失败，请稍后再试'
        });
    }
    
    // 返回交易记录
    res.status(201).json({
        success: true,
        data: newTransaction
    });
});

// 获取交易记录列表
app.get('/api/transactions', verifyToken, (req, res) => {
    // 获取查询参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const paymentMethod = req.query.paymentMethod;
    const timeFilter = req.query.timeFilter;
    
    // 读取交易数据
    const transactionData = readJsonFile(transactionsFilePath);
    
    if (!transactionData) {
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
    
    // 筛选用户的交易记录
    let transactions = transactionData.transactions.filter(t => t.userId === req.userId);
    
    // 应用筛选条件
    if (status && status !== 'all') {
        transactions = transactions.filter(t => t.status === status);
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
        transactions = transactions.filter(t => t.paymentMethod === paymentMethod);
    }
    
    if (timeFilter && timeFilter !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (timeFilter) {
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
            transactions = transactions.filter(t => new Date(t.date) >= startDate);
        }
    }
    
    // 按日期倒序排序
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 分页
    const total = transactions.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedTransactions = transactions.slice(offset, offset + limit);
    
    // 返回交易记录
    res.json({
        success: true,
        data: {
            transactions: paginatedTransactions,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                limit
            }
        }
    });
});

// 获取交易记录详情
app.get('/api/transactions/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    
    // 读取交易数据
    const transactionData = readJsonFile(transactionsFilePath);
    
    if (!transactionData) {
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
    
    // 查找交易记录
    const transaction = transactionData.transactions.find(t => (t.id === id || t.transactionId === id) && t.userId === req.userId);
    
    if (!transaction) {
        return res.status(404).json({
            success: false,
            message: '交易记录不存在'
        });
    }
    
    // 返回交易记录
    res.json({
        success: true,
        data: transaction
    });
});

// 下载交易收据
app.get('/api/transactions/:id/receipt', verifyToken, (req, res) => {
    const { id } = req.params;
    
    // 读取交易数据
    const transactionData = readJsonFile(transactionsFilePath);
    
    if (!transactionData) {
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
    
    // 查找交易记录
    const transaction = transactionData.transactions.find(t => (t.id === id || t.transactionId === id) && t.userId === req.userId);
    
    if (!transaction) {
        return res.status(404).json({
            success: false,
            message: '交易记录不存在'
        });
    }
    
    // 检查交易状态
    if (transaction.status !== 'completed') {
        return res.status(400).json({
            success: false,
            message: '只有已完成的交易才能下载收据'
        });
    }
    
    // 实际项目中应生成PDF收据
    // 这里简化处理，返回JSON格式的收据数据
    res.json({
        success: true,
        data: {
            receipt: {
                transactionId: transaction.transactionId,
                date: transaction.date,
                amount: transaction.amount,
                paymentMethod: transaction.paymentMethod,
                description: transaction.description,
                membershipId: transaction.membershipId
            }
        }
    });
});

// 支付回调处理
app.post('/api/payment/callback/:method', (req, res) => {
    const { method } = req.params;
    const callbackData = req.body;
    
    console.log(`收到${method}支付回调:`, callbackData);
    
    // 实际项目中应验证回调签名
    
    // 返回成功响应
    res.json({
        success: true,
        message: '回调处理成功'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`支付测试页面: http://localhost:${PORT}/payment.html`);
    console.log(`交易记录页面: http://localhost:${PORT}/account/transactions.html`);
});
