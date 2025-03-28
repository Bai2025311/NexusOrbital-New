/**
 * NexusOrbital API测试运行器
 * 用于自动化测试API集成功能
 */

import { apiService } from './api-service.js';

class ApiTestRunner {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        this.logElement = null;
        this.resultElement = null;
        this.testCredentials = {
            email: 'test@example.com',
            password: 'password123'
        };
    }

    /**
     * 初始化测试运行器
     * @param {HTMLElement} logElement - 日志输出元素
     * @param {HTMLElement} resultElement - 结果输出元素
     */
    init(logElement, resultElement) {
        this.logElement = logElement;
        this.resultElement = resultElement;
        this.log('API测试运行器初始化完成');
    }

    /**
     * 记录日志
     * @param {string} message - 日志消息
     * @param {boolean} isError - 是否为错误日志
     */
    log(message, isError = false) {
        if (!this.logElement) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = isError ? 'log-error' : 'log-info';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        this.logElement.appendChild(logEntry);
        this.logElement.scrollTop = this.logElement.scrollHeight;
        
        // 同时在控制台输出
        if (isError) {
            console.error(message);
        } else {
            console.log(message);
        }
    }

    /**
     * 记录测试结果
     * @param {string} testName - 测试名称
     * @param {boolean} passed - 是否通过
     * @param {string} message - 结果消息
     * @param {Object} data - 附加数据
     */
    recordTestResult(testName, passed, message, data = null) {
        this.testResults.total++;
        if (passed) {
            this.testResults.passed++;
            this.log(`✓ 测试通过: ${testName} - ${message}`);
        } else {
            this.testResults.failed++;
            this.log(`✗ 测试失败: ${testName} - ${message}`, true);
        }

        this.testResults.details.push({
            name: testName,
            passed,
            message,
            data,
            timestamp: new Date().toISOString()
        });

        this.updateResultsDisplay();
    }

    /**
     * 更新结果显示
     */
    updateResultsDisplay() {
        if (!this.resultElement) return;

        const passRate = this.testResults.total > 0 
            ? Math.round((this.testResults.passed / this.testResults.total) * 100) 
            : 0;

        this.resultElement.innerHTML = `
            <h3>测试结果摘要</h3>
            <div class="result-summary">
                <div class="result-item">
                    <span class="result-label">总测试数:</span>
                    <span class="result-value">${this.testResults.total}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">通过:</span>
                    <span class="result-value passed">${this.testResults.passed}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">失败:</span>
                    <span class="result-value failed">${this.testResults.failed}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">通过率:</span>
                    <span class="result-value ${passRate >= 80 ? 'passed' : 'failed'}">${passRate}%</span>
                </div>
            </div>
            <h3>详细测试结果</h3>
            <div class="result-details">
                ${this.testResults.details.map(detail => `
                    <div class="test-detail ${detail.passed ? 'passed' : 'failed'}">
                        <div class="test-detail-header">
                            <span class="test-detail-name">${detail.name}</span>
                            <span class="test-detail-status">${detail.passed ? '通过 ✓' : '失败 ✗'}</span>
                        </div>
                        <div class="test-detail-message">${detail.message}</div>
                        ${detail.data ? `<div class="test-detail-data">${JSON.stringify(detail.data, null, 2)}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        this.log('开始运行所有API测试...');
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        
        try {
            // 确保用户已登出
            if (apiService.isAuthenticated()) {
                this.log('用户已登录，先进行登出...');
                await apiService.logout();
            }
            
            // 按顺序运行测试
            await this.testAuthentication();
            await this.testResourceLoading();
            await this.testResourceDetail();
            await this.testResourceInteraction();
            await this.testMembershipSubscription();
            await this.testPaymentAndTransactions();
            await this.testResourceSubmission();
            
            this.log('所有测试完成!');
            
            // 最终确保用户登出
            if (apiService.isAuthenticated()) {
                await apiService.logout();
                this.log('测试完成后登出用户');
            }
        } catch (error) {
            this.log(`测试过程中发生错误: ${error.message}`, true);
        }
    }

    /**
     * 测试用户认证
     */
    async testAuthentication() {
        this.log('开始测试用户认证功能...');
        
        try {
            // 测试登录
            this.log(`尝试使用邮箱 ${this.testCredentials.email} 登录...`);
            const loginResponse = await apiService.login(this.testCredentials.email, this.testCredentials.password);
            
            this.recordTestResult(
                '用户登录', 
                !!loginResponse, 
                '用户登录功能正常工作',
                { userId: loginResponse?.userId }
            );
            
            // 测试获取用户信息
            this.log('获取用户信息...');
            const userInfo = await apiService.getUserInfo();
            
            this.recordTestResult(
                '获取用户信息', 
                !!userInfo && !!userInfo.username, 
                '获取用户信息功能正常工作',
                { username: userInfo?.username, email: userInfo?.email }
            );
            
            // 测试登出
            this.log('测试登出...');
            await apiService.logout();
            
            const isStillAuthenticated = apiService.isAuthenticated();
            this.recordTestResult(
                '用户登出', 
                !isStillAuthenticated, 
                '用户登出功能正常工作'
            );
        } catch (error) {
            this.log(`用户认证测试出错: ${error.message}`, true);
            this.recordTestResult('用户认证', false, `测试过程中出错: ${error.message}`);
        }
    }

    /**
     * 测试资源加载
     */
    async testResourceLoading() {
        this.log('开始测试资源加载功能...');
        
        try {
            // 测试获取资源列表
            this.log('获取资源列表...');
            const resources = await apiService.getResources();
            
            this.recordTestResult(
                '资源列表加载', 
                Array.isArray(resources) && resources.length > 0, 
                `成功获取资源列表，共 ${resources?.length || 0} 个资源`,
                { count: resources?.length || 0 }
            );
            
            // 测试资源筛选
            this.log('测试资源筛选...');
            const filteredResources = await apiService.getResources({
                search: 'test',
                type: '文档'
            });
            
            this.recordTestResult(
                '资源筛选', 
                Array.isArray(filteredResources), 
                `成功获取筛选后的资源列表，共 ${filteredResources?.length || 0} 个资源`,
                { count: filteredResources?.length || 0, filters: { search: 'test', type: '文档' } }
            );
            
            // 测试分页
            this.log('测试资源分页...');
            const page2Resources = await apiService.getResources({ page: 2, limit: 10 });
            
            this.recordTestResult(
                '资源分页', 
                Array.isArray(page2Resources), 
                `成功获取第2页资源，共 ${page2Resources?.length || 0} 个资源`,
                { count: page2Resources?.length || 0, page: 2, limit: 10 }
            );
        } catch (error) {
            this.log(`资源加载测试出错: ${error.message}`, true);
            this.recordTestResult('资源加载', false, `测试过程中出错: ${error.message}`);
        }
    }

    /**
     * 测试资源详情
     */
    async testResourceDetail() {
        this.log('开始测试资源详情功能...');
        
        try {
            // 先获取资源列表
            this.log('获取资源列表...');
            const resources = await apiService.getResources();
            
            if (!resources || resources.length === 0) {
                throw new Error('无法获取资源列表，无法继续测试');
            }
            
            // 获取第一个资源的ID
            const resourceId = resources[0].id;
            this.log(`选择资源ID: ${resourceId} 进行测试`);
            
            // 测试获取资源详情
            this.log('获取资源详情...');
            const resourceDetail = await apiService.getResourceDetail(resourceId);
            
            this.recordTestResult(
                '资源详情获取', 
                !!resourceDetail && !!resourceDetail.title, 
                `成功获取资源详情: ${resourceDetail?.title}`,
                { title: resourceDetail?.title, id: resourceId }
            );
            
            // 测试获取相关资源
            this.log('获取相关资源...');
            const relatedResources = await apiService.getRelatedResources(resourceId);
            
            this.recordTestResult(
                '相关资源获取', 
                Array.isArray(relatedResources), 
                `成功获取相关资源，共 ${relatedResources?.length || 0} 个相关资源`,
                { count: relatedResources?.length || 0, resourceId }
            );
        } catch (error) {
            this.log(`资源详情测试出错: ${error.message}`, true);
            this.recordTestResult('资源详情', false, `测试过程中出错: ${error.message}`);
        }
    }

    /**
     * 测试资源交互
     */
    async testResourceInteraction() {
        this.log('开始测试资源交互功能...');
        
        try {
            // 先获取资源列表
            this.log('获取资源列表...');
            const resources = await apiService.getResources();
            
            if (!resources || resources.length === 0) {
                throw new Error('无法获取资源列表，无法继续测试');
            }
            
            // 获取第一个资源的ID
            const resourceId = resources[0].id;
            this.log(`选择资源ID: ${resourceId} 进行测试`);
            
            // 确保用户已登录
            if (!apiService.isAuthenticated()) {
                this.log('用户未登录，尝试登录...');
                await apiService.login(this.testCredentials.email, this.testCredentials.password);
            }
            
            // 测试更新资源浏览量
            this.log('测试更新资源浏览量...');
            await apiService.updateResourceViews(resourceId);
            
            this.recordTestResult(
                '资源浏览量更新', 
                true, 
                '成功更新资源浏览量',
                { resourceId }
            );
            
            // 测试获取资源下载链接
            this.log('测试获取资源下载链接...');
            const downloadUrl = await apiService.getResourceDownloadUrl(resourceId);
            
            this.recordTestResult(
                '资源下载链接获取', 
                !!downloadUrl, 
                '成功获取资源下载链接',
                { resourceId, downloadUrl: downloadUrl ? '有效链接' : '无效链接' }
            );
            
            // 测试提交评分
            const testRating = 4;
            this.log(`测试提交评分 ${testRating}...`);
            await apiService.submitRating(resourceId, testRating);
            
            this.recordTestResult(
                '资源评分提交', 
                true, 
                `成功提交评分: ${testRating}`,
                { resourceId, rating: testRating }
            );
            
            // 测试获取用户评分
            this.log('测试获取用户评分...');
            const userRating = await apiService.getUserRating(resourceId);
            
            this.recordTestResult(
                '用户评分获取', 
                !!userRating && userRating.rating === testRating, 
                `成功获取用户评分: ${userRating?.rating}`,
                { resourceId, rating: userRating?.rating }
            );
            
            // 测试收藏资源
            this.log('测试收藏资源...');
            await apiService.saveResource(resourceId);
            
            this.recordTestResult(
                '资源收藏', 
                true, 
                '成功收藏资源',
                { resourceId }
            );
            
            // 测试获取收藏的资源
            this.log('测试获取收藏的资源...');
            const savedResources = await apiService.getSavedResources();
            const isSaved = savedResources.some(res => res.id === resourceId);
            
            this.recordTestResult(
                '收藏资源获取', 
                isSaved, 
                `资源是否在收藏列表中: ${isSaved ? '是' : '否'}`,
                { resourceId, isSaved }
            );
            
            // 测试取消收藏资源
            this.log('测试取消收藏资源...');
            await apiService.unsaveResource(resourceId);
            
            // 再次获取收藏的资源，确认已取消收藏
            const savedResourcesAfter = await apiService.getSavedResources();
            const isStillSaved = savedResourcesAfter.some(res => res.id === resourceId);
            
            this.recordTestResult(
                '资源取消收藏', 
                !isStillSaved, 
                `资源是否已取消收藏: ${!isStillSaved ? '是' : '否'}`,
                { resourceId, isStillSaved }
            );
        } catch (error) {
            this.log(`资源交互测试出错: ${error.message}`, true);
            this.recordTestResult('资源交互', false, `测试过程中出错: ${error.message}`);
        }
    }

    /**
     * 测试会员订阅
     */
    async testMembershipSubscription() {
        this.log('开始测试会员订阅功能...');
        
        try {
            // 确保用户已登录
            if (!apiService.isAuthenticated()) {
                this.log('用户未登录，尝试登录...');
                await apiService.login(this.testCredentials.email, this.testCredentials.password);
            }
            
            // 测试获取会员计划
            this.log('获取会员计划...');
            const membershipPlans = await apiService.getMembershipPlans();
            
            this.recordTestResult(
                '会员计划获取', 
                Array.isArray(membershipPlans) && membershipPlans.length > 0, 
                `成功获取会员计划，共 ${membershipPlans?.length || 0} 个计划`,
                { count: membershipPlans?.length || 0 }
            );
            
            // 测试获取用户会员状态
            this.log('获取用户会员状态...');
            const membershipStatus = await apiService.getUserMembershipStatus();
            
            this.recordTestResult(
                '会员状态获取', 
                membershipStatus !== undefined, 
                `成功获取用户会员状态: ${membershipStatus ? '是会员' : '非会员'}`,
                { isMember: !!membershipStatus }
            );
            
            // 模拟订阅会员（测试环境不实际扣费）
            if (membershipPlans && membershipPlans.length > 0) {
                const testPlanId = membershipPlans[0].id;
                this.log(`测试订阅会员计划 ${testPlanId}...`);
                
                try {
                    // 注意：这里只是测试API调用，不实际完成订阅
                    const subscriptionResult = await apiService.subscribeMembership(testPlanId, true);
                    
                    this.recordTestResult(
                        '会员订阅', 
                        !!subscriptionResult, 
                        '成功调用会员订阅API',
                        { planId: testPlanId, testMode: true }
                    );
                } catch (subError) {
                    // 订阅可能会失败，因为这是测试模式
                    this.recordTestResult(
                        '会员订阅', 
                        false, 
                        `会员订阅API调用失败: ${subError.message}`,
                        { planId: testPlanId, testMode: true }
                    );
                }
            }
            
            // 测试获取当前用户会员信息
            this.log('获取当前用户会员信息...');
            try {
                const membershipInfo = await apiService.getUserMembership();
                
                this.recordTestResult(
                    '用户会员信息获取', 
                    !!membershipInfo, 
                    '成功获取用户会员信息',
                    { 
                        membershipId: membershipInfo?.id,
                        membershipName: membershipInfo?.name,
                        startDate: membershipInfo?.startDate,
                        endDate: membershipInfo?.endDate
                    }
                );
            } catch (membershipError) {
                this.recordTestResult(
                    '用户会员信息获取', 
                    false, 
                    `获取用户会员信息失败: ${membershipError.message}`
                );
            }
            
            // 测试更新用户会员信息（测试环境）
            this.log('测试更新用户会员信息...');
            try {
                const testMembershipId = 'professional'; // 测试用的会员ID
                const updateResult = await apiService.updateUserMembership(testMembershipId);
                
                this.recordTestResult(
                    '用户会员信息更新', 
                    !!updateResult && !!updateResult.data && !!updateResult.data.membership, 
                    '成功更新用户会员信息',
                    { 
                        membershipId: updateResult?.data?.membership?.id,
                        membershipName: updateResult?.data?.membership?.name
                    }
                );
            } catch (updateError) {
                this.recordTestResult(
                    '用户会员信息更新', 
                    false, 
                    `更新用户会员信息失败: ${updateError.message}`
                );
            }
        } catch (error) {
            this.log(`会员订阅测试出错: ${error.message}`, true);
            this.recordTestResult('会员订阅', false, `测试过程中出错: ${error.message}`);
        }
    }
    
    /**
     * 测试支付和交易功能
     */
    async testPaymentAndTransactions() {
        this.log('开始测试支付和交易功能...');
        
        try {
            // 确保用户已登录
            if (!apiService.isAuthenticated()) {
                this.log('用户未登录，尝试登录...');
                await apiService.login(this.testCredentials.email, this.testCredentials.password);
            }
            
            // 测试获取交易记录列表
            this.log('获取交易记录列表...');
            try {
                const transactionsResponse = await apiService.getTransactions();
                
                this.recordTestResult(
                    '交易记录列表获取', 
                    !!transactionsResponse && !!transactionsResponse.data && Array.isArray(transactionsResponse.data.transactions), 
                    `成功获取交易记录列表，共 ${transactionsResponse?.data?.transactions?.length || 0} 条记录`,
                    { 
                        count: transactionsResponse?.data?.transactions?.length || 0,
                        pagination: transactionsResponse?.data?.pagination || {}
                    }
                );
                
                // 如果有交易记录，测试获取交易详情
                if (transactionsResponse?.data?.transactions?.length > 0) {
                    const testTransactionId = transactionsResponse.data.transactions[0].transactionId;
                    this.log(`测试获取交易详情，交易ID: ${testTransactionId}...`);
                    
                    try {
                        const transactionDetail = await apiService.getTransactionDetail(testTransactionId);
                        
                        this.recordTestResult(
                            '交易详情获取', 
                            !!transactionDetail && !!transactionDetail.data, 
                            '成功获取交易详情',
                            { 
                                transactionId: transactionDetail?.data?.transactionId,
                                amount: transactionDetail?.data?.amount,
                                status: transactionDetail?.data?.status,
                                paymentMethod: transactionDetail?.data?.paymentMethod
                            }
                        );
                        
                        // 测试下载交易收据
                        if (transactionDetail?.data?.status === 'completed') {
                            this.log(`测试下载交易收据，交易ID: ${testTransactionId}...`);
                            
                            try {
                                const receiptResponse = await apiService.downloadReceipt(testTransactionId);
                                
                                this.recordTestResult(
                                    '交易收据下载', 
                                    !!receiptResponse && !!receiptResponse.data && !!receiptResponse.data.receipt, 
                                    '成功下载交易收据',
                                    { receiptData: receiptResponse?.data?.receipt || {} }
                                );
                            } catch (receiptError) {
                                this.recordTestResult(
                                    '交易收据下载', 
                                    false, 
                                    `下载交易收据失败: ${receiptError.message}`
                                );
                            }
                        }
                    } catch (detailError) {
                        this.recordTestResult(
                            '交易详情获取', 
                            false, 
                            `获取交易详情失败: ${detailError.message}`
                        );
                    }
                }
            } catch (transactionsError) {
                this.recordTestResult(
                    '交易记录列表获取', 
                    false, 
                    `获取交易记录列表失败: ${transactionsError.message}`
                );
            }
            
            // 测试创建交易记录（测试环境）
            this.log('测试创建交易记录...');
            try {
                const testTransactionData = {
                    amount: 299.00,
                    paymentMethod: 'alipay',
                    membershipId: 'founder',
                    description: '测试交易 - 升级到创始会员计划'
                };
                
                const createResponse = await apiService.createTransaction(testTransactionData);
                
                this.recordTestResult(
                    '交易记录创建', 
                    !!createResponse && !!createResponse.data, 
                    '成功创建交易记录',
                    { 
                        transactionId: createResponse?.data?.transactionId,
                        amount: createResponse?.data?.amount,
                        status: createResponse?.data?.status,
                        paymentMethod: createResponse?.data?.paymentMethod
                    }
                );
            } catch (createError) {
                this.recordTestResult(
                    '交易记录创建', 
                    false, 
                    `创建交易记录失败: ${createError.message}`
                );
            }
            
            // 测试创建支付订单
            this.log('测试创建支付订单...');
            try {
                const testOrderData = {
                    amount: 299.00,
                    paymentMethod: 'alipay',
                    membershipId: 'founder',
                    description: '测试订单 - 升级到创始会员计划'
                };
                
                const orderResponse = await apiService.createPaymentOrder(testOrderData);
                
                this.recordTestResult(
                    '支付订单创建', 
                    !!orderResponse && !!orderResponse.data && !!orderResponse.data.orderId, 
                    '成功创建支付订单',
                    { 
                        orderId: orderResponse?.data?.orderId,
                        amount: orderResponse?.data?.amount,
                        status: orderResponse?.data?.status,
                        paymentMethod: orderResponse?.data?.paymentMethod,
                        paymentUrl: orderResponse?.data?.paymentUrl ? '有效' : '无效',
                        qrCodeUrl: orderResponse?.data?.qrCodeUrl ? '有效' : '无效'
                    }
                );
                
                // 如果创建订单成功，测试查询订单状态
                if (orderResponse?.data?.orderId) {
                    const testOrderId = orderResponse.data.orderId;
                    this.log(`测试查询支付订单状态，订单ID: ${testOrderId}...`);
                    
                    try {
                        const statusResponse = await apiService.queryPaymentOrderStatus(testOrderId);
                        
                        this.recordTestResult(
                            '支付订单状态查询', 
                            !!statusResponse && !!statusResponse.data, 
                            '成功查询支付订单状态',
                            { 
                                orderId: statusResponse?.data?.orderId,
                                status: statusResponse?.data?.status,
                                payTime: statusResponse?.data?.payTime
                            }
                        );
                    } catch (statusError) {
                        this.recordTestResult(
                            '支付订单状态查询', 
                            false, 
                            `查询支付订单状态失败: ${statusError.message}`
                        );
                    }
                }
            } catch (orderError) {
                this.recordTestResult(
                    '支付订单创建', 
                    false, 
                    `创建支付订单失败: ${orderError.message}`
                );
            }
            
            // 测试支付回调处理（模拟）
            this.log('测试支付回调处理（模拟）...');
            try {
                const testCallbackData = {
                    out_trade_no: `test_${Date.now()}`,
                    total_amount: '299.00',
                    trade_status: 'TRADE_SUCCESS',
                    passback_params: 'founder'
                };
                
                const callbackResponse = await apiService.handlePaymentCallback('alipay', testCallbackData);
                
                this.recordTestResult(
                    '支付回调处理', 
                    !!callbackResponse && callbackResponse.success === true, 
                    '成功处理支付回调',
                    { response: callbackResponse || {} }
                );
            } catch (callbackError) {
                this.recordTestResult(
                    '支付回调处理', 
                    false, 
                    `处理支付回调失败: ${callbackError.message}`
                );
            }
        } catch (error) {
            this.log(`支付和交易测试出错: ${error.message}`, true);
            this.recordTestResult('支付和交易', false, `测试过程中出错: ${error.message}`);
        }
    }

    /**
     * 测试资源提交
     */
    async testResourceSubmission() {
        this.log('开始测试资源提交功能...');
        
        try {
            // 确保用户已登录
            if (!apiService.isAuthenticated()) {
                this.log('用户未登录，尝试登录...');
                await apiService.login(this.testCredentials.email, this.testCredentials.password);
            }
            
            // 准备测试资源数据
            const testResource = {
                title: `测试资源 ${new Date().toISOString()}`,
                description: '这是一个用于API测试的资源',
                type: '文档',
                category: '技术文档',
                tags: ['测试', 'API', '自动化'],
                accessLevel: 'public'
            };
            
            // 测试资源提交前检查
            this.log('测试资源提交前检查...');
            const submissionCheck = await apiService.checkResourceSubmission(testResource);
            
            this.recordTestResult(
                '资源提交前检查', 
                !!submissionCheck && submissionCheck.canSubmit, 
                `资源提交前检查结果: ${submissionCheck?.canSubmit ? '可提交' : '不可提交'}`,
                { canSubmit: submissionCheck?.canSubmit, message: submissionCheck?.message }
            );
            
            // 测试资源提交（测试模式）
            this.log('测试资源提交（测试模式）...');
            try {
                const submissionResult = await apiService.submitResource(testResource, true);
                
                this.recordTestResult(
                    '资源提交', 
                    !!submissionResult && !!submissionResult.id, 
                    '成功调用资源提交API',
                    { resourceId: submissionResult?.id, testMode: true }
                );
            } catch (subError) {
                // 提交可能会失败，因为这是测试模式
                this.recordTestResult(
                    '资源提交', 
                    false, 
                    `资源提交API调用失败: ${subError.message}`,
                    { testMode: true }
                );
            }
        } catch (error) {
            this.log(`资源提交测试出错: ${error.message}`, true);
            this.recordTestResult('资源提交', false, `测试过程中出错: ${error.message}`);
        }
    }
}

// 导出测试运行器实例
export const apiTestRunner = new ApiTestRunner();
