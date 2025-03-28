/**
 * NexusOrbital API集成测试脚本
 * 用于测试API服务的各项功能
 */

// 导入API服务
import { apiService } from './api-service.js';

// 测试结果容器
const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

/**
 * 运行测试并记录结果
 * @param {string} testName - 测试名称
 * @param {Function} testFn - 测试函数
 */
async function runTest(testName, testFn) {
    console.log(`开始测试: ${testName}`);
    testResults.total++;
    
    try {
        await testFn();
        console.log(`✅ 测试通过: ${testName}`);
        testResults.passed++;
        testResults.details.push({
            name: testName,
            status: 'passed',
            message: '测试通过'
        });
    } catch (error) {
        console.error(`❌ 测试失败: ${testName}`, error);
        testResults.failed++;
        testResults.details.push({
            name: testName,
            status: 'failed',
            message: error.message,
            error: error
        });
    }
}

/**
 * 显示测试结果
 */
function showTestResults() {
    console.log('\n==== 测试结果汇总 ====');
    console.log(`总计: ${testResults.total} 测试`);
    console.log(`通过: ${testResults.passed} 测试`);
    console.log(`失败: ${testResults.failed} 测试`);
    
    if (testResults.failed > 0) {
        console.log('\n==== 失败测试详情 ====');
        testResults.details
            .filter(result => result.status === 'failed')
            .forEach(result => {
                console.log(`- ${result.name}: ${result.message}`);
            });
    }
    
    // 在页面上显示结果
    const resultContainer = document.getElementById('testResults');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="test-summary ${testResults.failed > 0 ? 'has-failures' : 'all-passed'}">
                <h2>测试结果汇总</h2>
                <div class="test-counts">
                    <div class="test-count">总计: ${testResults.total} 测试</div>
                    <div class="test-count passed">通过: ${testResults.passed} 测试</div>
                    <div class="test-count failed">失败: ${testResults.failed} 测试</div>
                </div>
            </div>
            
            <div class="test-details">
                <h3>测试详情</h3>
                <ul class="test-list">
                    ${testResults.details.map(result => `
                        <li class="test-item ${result.status}">
                            <div class="test-name">${result.name}</div>
                            <div class="test-message">${result.message}</div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
}

/**
 * 测试用户认证
 */
async function testAuthentication() {
    // 测试登录
    const loginResponse = await apiService.login('test@example.com', 'password123');
    if (!loginResponse || !loginResponse.token) {
        throw new Error('登录失败，未返回有效token');
    }
    
    // 测试获取用户信息
    const userInfo = await apiService.getUserInfo();
    if (!userInfo || !userInfo.username) {
        throw new Error('获取用户信息失败');
    }
    
    // 测试登出
    await apiService.logout();
    if (apiService.isAuthenticated()) {
        throw new Error('登出失败，用户仍然处于认证状态');
    }
}

/**
 * 测试资源加载
 */
async function testLoadResources() {
    // 测试加载资源列表
    const resources = await apiService.getResources();
    if (!Array.isArray(resources)) {
        throw new Error('加载资源列表失败，未返回数组');
    }
    
    // 测试资源筛选
    const filteredResources = await apiService.getResources({
        search: 'test',
        type: '文档',
        category: '技术',
        access: '免费'
    });
    if (!Array.isArray(filteredResources)) {
        throw new Error('资源筛选失败，未返回数组');
    }
    
    // 测试资源分页
    const pagedResources = await apiService.getResources({
        page: 2,
        limit: 10
    });
    if (!Array.isArray(pagedResources)) {
        throw new Error('资源分页失败，未返回数组');
    }
}

/**
 * 测试资源详情
 */
async function testResourceDetails() {
    // 获取资源列表
    const resources = await apiService.getResources();
    if (!Array.isArray(resources) || resources.length === 0) {
        throw new Error('无法获取资源列表进行详情测试');
    }
    
    // 获取第一个资源的ID
    const resourceId = resources[0].id;
    
    // 测试获取资源详情
    const resourceDetail = await apiService.getResourceDetail(resourceId);
    if (!resourceDetail || !resourceDetail.id) {
        throw new Error('获取资源详情失败');
    }
    
    // 测试获取相关资源
    const relatedResources = await apiService.getRelatedResources(resourceId);
    if (!Array.isArray(relatedResources)) {
        throw new Error('获取相关资源失败，未返回数组');
    }
}

/**
 * 测试资源交互
 */
async function testResourceInteractions() {
    // 登录
    await apiService.login('test@example.com', 'password123');
    
    // 获取资源列表
    const resources = await apiService.getResources();
    if (!Array.isArray(resources) || resources.length === 0) {
        throw new Error('无法获取资源列表进行交互测试');
    }
    
    // 获取第一个资源的ID
    const resourceId = resources[0].id;
    
    // 测试更新资源浏览量
    await apiService.updateResourceViews(resourceId);
    
    // 测试下载资源
    const downloadUrl = await apiService.getResourceDownloadUrl(resourceId);
    if (!downloadUrl) {
        throw new Error('获取资源下载链接失败');
    }
    
    // 测试提交评分
    await apiService.submitRating(resourceId, 4);
    
    // 测试获取用户评分
    const userRating = await apiService.getUserRating(resourceId);
    if (!userRating || userRating.rating !== 4) {
        throw new Error('获取用户评分失败或评分值不匹配');
    }
    
    // 测试收藏资源
    await apiService.saveResource(resourceId);
    
    // 测试获取收藏的资源
    const savedResources = await apiService.getSavedResources();
    if (!Array.isArray(savedResources) || !savedResources.some(res => res.id === resourceId)) {
        throw new Error('获取收藏资源失败或未找到收藏的资源');
    }
    
    // 测试取消收藏资源
    await apiService.unsaveResource(resourceId);
    
    // 测试获取收藏的资源（应该不包含刚取消收藏的资源）
    const updatedSavedResources = await apiService.getSavedResources();
    if (updatedSavedResources.some(res => res.id === resourceId)) {
        throw new Error('取消收藏资源失败，资源仍在收藏列表中');
    }
    
    // 登出
    await apiService.logout();
}

/**
 * 测试会员订阅
 */
async function testMembershipSubscription() {
    // 登录
    await apiService.login('test@example.com', 'password123');
    
    // 测试订阅会员
    await apiService.subscribeMembership('基础会员');
    
    // 测试获取用户信息（应包含会员信息）
    const userInfo = await apiService.getUserInfo();
    if (!userInfo.membership || userInfo.membership.plan !== '基础会员') {
        throw new Error('会员订阅失败，用户信息中未包含正确的会员信息');
    }
    
    // 登出
    await apiService.logout();
}

/**
 * 测试资源提交
 */
async function testResourceSubmission() {
    // 登录
    await apiService.login('test@example.com', 'password123');
    
    // 创建测试资源数据
    const formData = new FormData();
    formData.append('title', '测试资源' + Date.now());
    formData.append('type', '文档');
    formData.append('category', '技术');
    formData.append('description', '这是一个测试资源描述');
    formData.append('access', '免费');
    formData.append('tags[]', '测试');
    formData.append('tags[]', 'API');
    
    // 测试提交资源
    const response = await apiService.submitResource(formData);
    if (!response || !response.id) {
        throw new Error('资源提交失败');
    }
    
    // 登出
    await apiService.logout();
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    try {
        // 基础功能测试
        await runTest('用户认证', testAuthentication);
        await runTest('资源加载', testLoadResources);
        await runTest('资源详情', testResourceDetails);
        
        // 交互功能测试
        await runTest('资源交互', testResourceInteractions);
        await runTest('会员订阅', testMembershipSubscription);
        await runTest('资源提交', testResourceSubmission);
        
        // 显示测试结果
        showTestResults();
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}

// 导出测试函数
export { runAllTests };
