/**
 * NexusOrbital A/B测试结果分析脚本
 * 
 * 用于加载、处理和可视化A/B测试数据
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initPage();
    
    // 加载测试数据
    loadTestData();
    
    // 设置事件监听器
    setupEventListeners();
});

/**
 * 初始化页面
 */
function initPage() {
    console.log('初始化A/B测试结果分析页面');
    
    // 设置当前日期
    const today = new Date();
    const formattedDate = formatDate(today);
    
    // 更新测试ID（使用当前日期）
    document.getElementById('test-id').textContent = 'ux-optimization-test-' + formattedDate;
    
    // 设置测试开始日期（假设为7天前）
    const startDate = new Date();
    startDate.setDate(today.getDate() - 7);
    document.getElementById('start-date').textContent = formatDate(startDate);
    
    // 设置测试结束日期（当前日期）
    document.getElementById('end-date').textContent = formattedDate;
}

/**
 * 格式化日期为YYYY-MM-DD格式
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 加载测试数据
 * 在实际应用中，这里应该从服务器API获取数据
 * 这里使用模拟数据进行演示
 */
function loadTestData() {
    console.log('加载A/B测试数据');
    
    // 模拟从服务器获取数据的延迟
    setTimeout(() => {
        // 获取模拟数据
        const testData = getMockTestData();
        
        // 更新页面上的测试数据
        updateTestInfo(testData);
        
        // 更新变体数据
        updateVariantData(testData);
        
        // 创建图表
        createCharts(testData);
    }, 500);
}

/**
 * 获取模拟测试数据
 * 在实际应用中，这些数据应该从服务器获取
 * @returns {Object} 测试数据对象
 */
function getMockTestData() {
    return {
        testInfo: {
            id: 'ux-optimization-test-' + formatDate(new Date()),
            startDate: formatDate(new Date(new Date().setDate(new Date().getDate() - 7))),
            endDate: formatDate(new Date()),
            totalSamples: 1248,
            status: '进行中'
        },
        variants: {
            control: {
                name: '原始版本',
                type: '对照组',
                description: '未应用用户体验优化的原始版本',
                samples: 624,
                metrics: {
                    pageLoadTime: 2.45,
                    firstContentfulPaint: 1.82,
                    timeOnPage: 155, // 秒
                    interactionCount: 8.3,
                    conversionRate: 4.2,
                    mobileLoadTime: 3.12,
                    desktopLoadTime: 1.95,
                    mobileConversionRate: 3.1,
                    desktopConversionRate: 5.3
                }
            },
            optimized: {
                name: '优化版本',
                type: '实验组',
                description: '应用了用户体验优化的版本',
                samples: 624,
                metrics: {
                    pageLoadTime: 1.78,
                    firstContentfulPaint: 1.25,
                    timeOnPage: 228, // 秒
                    interactionCount: 12.7,
                    conversionRate: 6.8,
                    mobileLoadTime: 2.15,
                    desktopLoadTime: 1.42,
                    mobileConversionRate: 5.4,
                    desktopConversionRate: 8.2
                }
            }
        },
        comparison: {
            pageLoadTime: {
                improvement: -27.3,
                significance: 'p < 0.001 (显著)'
            },
            firstContentfulPaint: {
                improvement: -31.3,
                significance: 'p < 0.001 (显著)'
            },
            timeOnPage: {
                improvement: 47.1,
                significance: 'p < 0.001 (显著)'
            },
            interactionCount: {
                improvement: 53.0,
                significance: 'p < 0.001 (显著)'
            },
            conversionRate: {
                improvement: 61.9,
                significance: 'p < 0.001 (显著)'
            },
            mobileLoadTime: {
                improvement: -31.1,
                significance: 'p < 0.001 (显著)'
            },
            desktopLoadTime: {
                improvement: -27.2,
                significance: 'p < 0.001 (显著)'
            },
            mobileConversionRate: {
                improvement: 74.2,
                significance: 'p < 0.001 (显著)'
            },
            desktopConversionRate: {
                improvement: 54.7,
                significance: 'p < 0.001 (显著)'
            }
        }
    };
}

/**
 * 更新测试信息
 * @param {Object} data - 测试数据
 */
function updateTestInfo(data) {
    const { testInfo } = data;
    
    document.getElementById('test-id').textContent = testInfo.id;
    document.getElementById('start-date').textContent = testInfo.startDate;
    document.getElementById('end-date').textContent = testInfo.endDate;
    document.getElementById('total-samples').textContent = formatNumber(testInfo.totalSamples);
    document.getElementById('test-status').textContent = testInfo.status;
}

/**
 * 更新变体数据
 * @param {Object} data - 测试数据
 */
function updateVariantData(data) {
    const { variants } = data;
    
    // 更新对照组数据
    document.getElementById('control-samples').textContent = formatNumber(variants.control.samples);
    document.getElementById('control-load-time').textContent = variants.control.metrics.pageLoadTime + '秒';
    document.getElementById('control-fcp').textContent = variants.control.metrics.firstContentfulPaint + '秒';
    document.getElementById('control-time-on-page').textContent = formatTime(variants.control.metrics.timeOnPage);
    document.getElementById('control-interactions').textContent = variants.control.metrics.interactionCount + '次';
    document.getElementById('control-conversion').textContent = variants.control.metrics.conversionRate + '%';
    
    // 更新实验组数据
    document.getElementById('optimized-samples').textContent = formatNumber(variants.optimized.samples);
    document.getElementById('optimized-load-time').textContent = variants.optimized.metrics.pageLoadTime + '秒';
    document.getElementById('optimized-fcp').textContent = variants.optimized.metrics.firstContentfulPaint + '秒';
    document.getElementById('optimized-time-on-page').textContent = formatTime(variants.optimized.metrics.timeOnPage);
    document.getElementById('optimized-interactions').textContent = variants.optimized.metrics.interactionCount + '次';
    document.getElementById('optimized-conversion').textContent = variants.optimized.metrics.conversionRate + '%';
}

/**
 * 创建图表
 * @param {Object} data - 测试数据
 */
function createCharts(data) {
    const { variants } = data;
    
    // 创建关键指标比较图表
    createMetricsComparisonChart(variants);
    
    // 创建转化率比较图表
    createConversionChart(variants);
}

/**
 * 创建关键指标比较图表
 * @param {Object} variants - 变体数据
 */
function createMetricsComparisonChart(variants) {
    const ctx = document.getElementById('metrics-comparison-chart').getContext('2d');
    
    // 准备数据
    const labels = ['页面加载时间 (秒)', '首次内容绘制 (秒)', '用户停留时间 (分钟)', '交互次数'];
    const controlData = [
        variants.control.metrics.pageLoadTime,
        variants.control.metrics.firstContentfulPaint,
        variants.control.metrics.timeOnPage / 60, // 转换为分钟
        variants.control.metrics.interactionCount
    ];
    const optimizedData = [
        variants.optimized.metrics.pageLoadTime,
        variants.optimized.metrics.firstContentfulPaint,
        variants.optimized.metrics.timeOnPage / 60, // 转换为分钟
        variants.optimized.metrics.interactionCount
    ];
    
    // 创建图表
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '原始版本 (A)',
                    data: controlData,
                    backgroundColor: 'rgba(108, 117, 125, 0.7)',
                    borderColor: 'rgba(108, 117, 125, 1)',
                    borderWidth: 1
                },
                {
                    label: '优化版本 (B)',
                    data: optimizedData,
                    backgroundColor: 'rgba(30, 136, 229, 0.7)',
                    borderColor: 'rgba(30, 136, 229, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: '关键指标比较'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            
                            const value = context.raw;
                            
                            // 根据指标类型格式化值
                            if (context.dataIndex === 2) {
                                // 用户停留时间（分钟）
                                label += value.toFixed(2) + ' 分钟';
                            } else if (context.dataIndex === 3) {
                                // 交互次数
                                label += value.toFixed(1) + ' 次';
                            } else {
                                // 加载时间和首次内容绘制（秒）
                                label += value.toFixed(2) + ' 秒';
                            }
                            
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * 创建转化率比较图表
 * @param {Object} variants - 变体数据
 */
function createConversionChart(variants) {
    const ctx = document.getElementById('conversion-chart').getContext('2d');
    
    // 准备数据
    const labels = ['总体转化率', '移动端转化率', '桌面端转化率'];
    const controlData = [
        variants.control.metrics.conversionRate,
        variants.control.metrics.mobileConversionRate,
        variants.control.metrics.desktopConversionRate
    ];
    const optimizedData = [
        variants.optimized.metrics.conversionRate,
        variants.optimized.metrics.mobileConversionRate,
        variants.optimized.metrics.desktopConversionRate
    ];
    
    // 创建图表
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '原始版本 (A)',
                    data: controlData,
                    backgroundColor: 'rgba(108, 117, 125, 0.7)',
                    borderColor: 'rgba(108, 117, 125, 1)',
                    borderWidth: 1
                },
                {
                    label: '优化版本 (B)',
                    data: optimizedData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '转化率 (%)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: '转化率比较'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            return label + context.raw.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 导出数据按钮
    const exportDataBtn = document.getElementById('export-data');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportTestData);
    }
    
    // 推广优化版本按钮
    const promoteVariantBtn = document.getElementById('promote-variant');
    if (promoteVariantBtn) {
        promoteVariantBtn.addEventListener('click', promoteOptimizedVariant);
    }
    
    // 继续测试按钮
    const continueTestBtn = document.getElementById('continue-test');
    if (continueTestBtn) {
        continueTestBtn.addEventListener('click', continueTest);
    }
}

/**
 * 导出测试数据
 */
function exportTestData() {
    console.log('导出测试数据');
    
    // 获取测试数据
    const testData = getMockTestData();
    
    // 将数据转换为JSON字符串
    const jsonData = JSON.stringify(testData, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ab-testing-data-' + formatDate(new Date()) + '.json';
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
    
    alert('测试数据已导出');
}

/**
 * 推广优化版本
 */
function promoteOptimizedVariant() {
    console.log('推广优化版本到所有用户');
    
    // 在实际应用中，这里应该调用API将优化版本设置为默认版本
    
    // 显示确认消息
    alert('优化版本已成功推广到所有用户！');
    
    // 更新测试状态
    document.getElementById('test-status').textContent = '已完成';
    
    // 禁用按钮
    document.getElementById('promote-variant').disabled = true;
    document.getElementById('continue-test').disabled = true;
}

/**
 * 继续测试
 */
function continueTest() {
    console.log('继续测试');
    
    // 在实际应用中，这里应该调用API延长测试时间
    
    // 更新测试结束日期（延长7天）
    const currentEndDate = new Date(document.getElementById('end-date').textContent);
    currentEndDate.setDate(currentEndDate.getDate() + 7);
    document.getElementById('end-date').textContent = formatDate(currentEndDate);
    
    // 显示确认消息
    alert('测试已延长7天！');
}

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的数字字符串
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化时间（秒转换为分:秒格式）
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}分${remainingSeconds}秒`;
}
