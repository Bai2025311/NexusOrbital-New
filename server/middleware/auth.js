/**
 * NexusOrbital 认证中间件
 */

/**
 * 验证用户身份
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未提供有效的认证令牌'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // 实际项目中应该验证JWT令牌并解析用户信息
    // 这里简化处理，假设所有令牌都有效
    
    // 模拟用户信息
    req.user = {
      id: 'user_001',
      email: 'user@example.com',
      name: 'Test User',
      isAdmin: true // 为了测试，将所有用户设为管理员
    };
    
    next();
  } catch (error) {
    console.error('认证失败:', error);
    return res.status(401).json({
      success: false,
      error: '认证失败，请重新登录'
    });
  }
}

/**
 * 验证管理员权限
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function authenticateAdmin(req, res, next) {
  // 先验证用户身份
  authenticateUser(req, res, (err) => {
    if (err) return next(err);
    
    // 检查是否为管理员
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: '没有权限执行此操作，需要管理员权限'
      });
    }
    
    next();
  });
}

module.exports = {
  authenticateUser,
  authenticateAdmin
};
