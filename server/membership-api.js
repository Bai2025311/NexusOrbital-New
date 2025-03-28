/**
 * NexusOrbital 会员系统后端API
 * 用于处理会员数据和交易记录
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const MEMBERSHIPS_FILE = path.join(DATA_DIR, 'memberships.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
function initDataFile(filePath, initialData = []) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    }
}

// 初始化数据文件
initDataFile(USERS_FILE, []);
initDataFile(TRANSACTIONS_FILE, []);
initDataFile(MEMBERSHIPS_FILE, [
    {
        id: 'free',
        name: '免费用户',
        price: 0,
        features: [
            "基础技术资源访问",
            "社区讨论参与",
            "个人项目展示",
            "基础技术支持"
        ]
    },
    {
        id: 'founder',
        name: '创始会员',
        price: 199,
        features: [
            "无限访问所有技术资源",
            "优先参与众筹项目",
            "专家社区直接交流",
            "每月专属线上活动",
            "项目协作工具高级功能",
            "创始会员专属徽章"
        ]
    },
    {
        id: 'professional',
        name: '专业会员',
        price: 299,
        features: [
            "创始会员所有权益",
            "高级项目协作工具",
            "专家一对一咨询（每月1次）",
            "优先项目孵化支持",
            "专属技术研讨会",
            "API高级访问权限"
        ]
    },
    {
        id: 'enterprise',
        name: '企业会员',
        price: 999,
        features: [
            "专业会员所有权益",
            "定制化技术支持",
            "企业级API访问",
            "优先漏洞修复",
            "专属技术顾问",
            "企业品牌展示"
        ]
    }
]);

// 读取数据文件
function readDataFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件 ${filePath} 失败:`, error);
        return [];
    }
}

// 写入数据文件
function writeDataFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`写入文件 ${filePath} 失败:`, error);
        return false;
    }
}

// 生成唯一ID
function generateId(prefix = '') {
    return `${prefix}${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// 验证用户令牌
function verifyToken(token) {
    // 实际项目中应该使用JWT等方式验证令牌
    // 这里简化处理，只检查令牌是否存在
    if (!token) {
        return null;
    }
    
    const users = readDataFile(USERS_FILE);
    const user = users.find(u => u.token === token);
    return user || null;
}

// 中间件：验证用户身份
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    const user = verifyToken(token);
    
    if (!user) {
        return res.status(401).json({ success: false, message: '未授权，请先登录' });
    }
    
    req.user = user;
    next();
}

// API路由

// 获取会员计划列表
app.get('/api/memberships', (req, res) => {
    const memberships = readDataFile(MEMBERSHIPS_FILE);
    res.json({ success: true, data: memberships });
});

// 获取用户信息
app.get('/api/user', authMiddleware, (req, res) => {
    res.json({ success: true, data: req.user });
});

// 更新用户会员信息
app.post('/api/user/membership', authMiddleware, (req, res) => {
    const { membershipId } = req.body;
    
    if (!membershipId) {
        return res.status(400).json({ success: false, message: '缺少会员ID' });
    }
    
    const memberships = readDataFile(MEMBERSHIPS_FILE);
    const membership = memberships.find(m => m.id === membershipId);
    
    if (!membership) {
        return res.status(404).json({ success: false, message: '未找到指定的会员计划' });
    }
    
    const users = readDataFile(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: '未找到用户' });
    }
    
    // 更新用户会员信息
    users[userIndex].membership = {
        id: membership.id,
        name: membership.name,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 一年后
        features: membership.features
    };
    
    // 保存更新后的用户数据
    if (writeDataFile(USERS_FILE, users)) {
        res.json({ success: true, data: users[userIndex] });
    } else {
        res.status(500).json({ success: false, message: '保存用户数据失败' });
    }
});

// 创建交易记录
app.post('/api/transactions', authMiddleware, (req, res) => {
    const { amount, paymentMethod, membershipId, description } = req.body;
    
    if (!amount || !paymentMethod || !membershipId) {
        return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const transactions = readDataFile(TRANSACTIONS_FILE);
    const memberships = readDataFile(MEMBERSHIPS_FILE);
    const membership = memberships.find(m => m.id === membershipId);
    
    if (!membership) {
        return res.status(404).json({ success: false, message: '未找到指定的会员计划' });
    }
    
    // 创建新交易记录
    const newTransaction = {
        id: generateId('TX'),
        userId: req.user.id,
        amount: parseFloat(amount),
        paymentMethod,
        membershipId,
        membershipName: membership.name,
        description: description || `升级到${membership.name}`,
        status: 'completed',
        createdAt: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    
    // 保存交易记录
    if (writeDataFile(TRANSACTIONS_FILE, transactions)) {
        // 更新用户会员信息
        const users = readDataFile(USERS_FILE);
        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex !== -1) {
            users[userIndex].membership = {
                id: membership.id,
                name: membership.name,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 一年后
                features: membership.features
            };
            
            writeDataFile(USERS_FILE, users);
        }
        
        res.json({ success: true, data: newTransaction });
    } else {
        res.status(500).json({ success: false, message: '保存交易记录失败' });
    }
});

// 获取用户交易记录
app.get('/api/transactions', authMiddleware, (req, res) => {
    const transactions = readDataFile(TRANSACTIONS_FILE);
    const userTransactions = transactions.filter(t => t.userId === req.user.id);
    
    res.json({ success: true, data: userTransactions });
});

// 获取交易详情
app.get('/api/transactions/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const transactions = readDataFile(TRANSACTIONS_FILE);
    const transaction = transactions.find(t => t.id === id && t.userId === req.user.id);
    
    if (!transaction) {
        return res.status(404).json({ success: false, message: '未找到指定的交易记录' });
    }
    
    res.json({ success: true, data: transaction });
});

// 处理支付回调
app.post('/api/payment/callback/:method', (req, res) => {
    const { method } = req.params;
    const callbackData = req.body;
    
    console.log(`收到${method}支付回调:`, callbackData);
    
    // 实际项目中应该验证回调签名
    // 这里简化处理，直接返回成功
    
    res.json({ success: true, message: '回调处理成功' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`会员系统API服务运行在端口 ${PORT}`);
    console.log(`API基础URL: http://localhost:${PORT}/api`);
});
