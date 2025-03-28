/**
 * 示例数据
 * 用于初始化本地存储中的项目数据
 */

// 初始化示例数据
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已初始化
    if (localStorage.getItem('dataInitialized')) {
        return;
    }
    
    // 初始化用户数据
    initUsers();
    
    // 初始化项目数据
    initProjects();
    
    // 标记为已初始化
    localStorage.setItem('dataInitialized', 'true');
    
    console.log('示例数据初始化完成');
});

/**
 * 初始化用户数据
 */
function initUsers() {
    const users = [
        {
            id: '1',
            username: '张航天',
            email: 'zhang@example.com',
            password: '123456',
            avatar: 'images/avatar-1.jpg',
            role: '航天工程师',
            skills: ['结构设计', '材料科学', '热力学'],
            bio: '资深航天工程师，专注于太空舱设计与优化',
            projects: ['1', '3'],
            following: ['2', '4']
        },
        {
            id: '2',
            username: '李月球',
            email: 'li@example.com',
            password: '123456',
            avatar: 'images/avatar-2.jpg',
            role: '建筑师',
            skills: ['建筑设计', '环境控制', '人居空间'],
            bio: '致力于太空建筑与人居环境设计研究',
            projects: ['2'],
            following: ['1']
        },
        {
            id: '3',
            username: '王星际',
            email: 'wang@example.com',
            password: '123456',
            avatar: 'images/avatar-3.jpg',
            role: '系统工程师',
            skills: ['系统集成', '自动化控制', '生命支持'],
            bio: '专注于太空生命支持系统研发',
            projects: ['4'],
            following: ['1', '2']
        }
    ];
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // 设置当前用户（模拟登录状态）
    localStorage.setItem('currentUser', JSON.stringify(users[0]));
}

/**
 * 初始化项目数据
 */
function initProjects() {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const projects = [
        {
            id: '1',
            title: '月球基地生态循环系统',
            category: '生命支持',
            summary: '设计一个闭环生态系统，支持月球基地长期自给自足运行',
            description: '本项目旨在开发一套完整的生态循环系统，用于支持月球基地的长期运行。系统将整合空气净化、水循环、食物生产和废物处理等子系统，形成一个高效的闭环生态系统。该系统将大幅减少对地球补给的依赖，提高月球基地的自给自足能力，为未来的深空探索奠定基础。',
            image: 'images/project-1.jpg',
            createdAt: lastWeek.toISOString(),
            progress: 65,
            views: 1245,
            tags: ['生态系统', '生命支持', '资源循环', '月球基地'],
            members: [
                {
                    id: '1',
                    username: '张航天',
                    avatar: 'images/avatar-1.jpg',
                    role: '项目负责人',
                    isLeader: true,
                    skills: ['结构设计', '材料科学', '热力学']
                },
                {
                    id: '3',
                    username: '王星际',
                    avatar: 'images/avatar-3.jpg',
                    role: '系统工程师',
                    isLeader: false,
                    skills: ['系统集成', '自动化控制', '生命支持']
                }
            ],
            followers: ['2', '3'],
            comments: [
                {
                    id: '101',
                    userId: '2',
                    username: '李月球',
                    userAvatar: 'images/avatar-2.jpg',
                    content: '这个项目非常有意义，生态循环系统是月球基地的核心技术之一。建议考虑在系统中加入微生物处理单元，提高有机废物的处理效率。',
                    timestamp: yesterday.toISOString(),
                    likes: ['1', '3'],
                    replies: [
                        {
                            id: '1011',
                            userId: '1',
                            username: '张航天',
                            userAvatar: 'images/avatar-1.jpg',
                            content: '感谢建议！我们正在考虑使用特定的微生物群落来提高系统的稳定性和效率。',
                            timestamp: now.toISOString(),
                            likes: ['2']
                        }
                    ]
                }
            ],
            resources: [
                {
                    id: '201',
                    title: '生态循环系统设计方案',
                    type: 'document',
                    description: '详细的系统设计文档，包括各子系统的技术参数和接口规范',
                    fileName: 'eco_system_design.pdf',
                    fileSize: 2458000,
                    userId: '1',
                    username: '张航天',
                    timestamp: lastWeek.toISOString(),
                    downloads: 56
                },
                {
                    id: '202',
                    title: '月球基地3D模型',
                    type: 'model',
                    description: '基地整体布局和生态系统集成方案的三维模型',
                    fileName: 'lunar_base_model.obj',
                    fileSize: 15782000,
                    userId: '1',
                    username: '张航天',
                    timestamp: yesterday.toISOString(),
                    downloads: 28
                },
                {
                    id: '203',
                    title: 'NASA生命支持系统研究报告',
                    type: 'link',
                    description: 'NASA关于空间站生命支持系统的最新研究报告',
                    url: 'https://www.nasa.gov/life-support-systems',
                    userId: '3',
                    username: '王星际',
                    timestamp: now.toISOString(),
                    downloads: 12
                }
            ],
            activities: [
                {
                    type: 'resource',
                    userId: '3',
                    username: '王星际',
                    timestamp: now.toISOString(),
                    resourceTitle: 'NASA生命支持系统研究报告'
                },
                {
                    type: 'comment',
                    userId: '1',
                    username: '张航天',
                    timestamp: now.toISOString(),
                    content: '感谢建议！我们正在考虑使用特定的微生物群落来提高系统的稳定性和效率。'
                },
                {
                    type: 'resource',
                    userId: '1',
                    username: '张航天',
                    timestamp: yesterday.toISOString(),
                    resourceTitle: '月球基地3D模型'
                },
                {
                    type: 'comment',
                    userId: '2',
                    username: '李月球',
                    timestamp: yesterday.toISOString(),
                    content: '这个项目非常有意义，生态循环系统是月球基地的核心技术之一。建议考虑在系统中加入微生物处理单元，提高有机废物的处理效率。'
                },
                {
                    type: 'follow',
                    userId: '3',
                    username: '王星际',
                    timestamp: lastWeek.toISOString()
                },
                {
                    type: 'resource',
                    userId: '1',
                    username: '张航天',
                    timestamp: lastWeek.toISOString(),
                    resourceTitle: '生态循环系统设计方案'
                },
                {
                    type: 'follow',
                    userId: '2',
                    username: '李月球',
                    timestamp: lastWeek.toISOString()
                }
            ]
        },
        {
            id: '2',
            title: '太空舱模块化设计标准',
            category: '建筑设计',
            summary: '制定太空舱模块化设计标准，提高组件兼容性和装配效率',
            description: '本项目致力于建立一套通用的太空舱模块化设计标准，解决当前太空舱设计碎片化、兼容性差的问题。通过标准化接口、结构和系统集成方案，可以大幅提高太空舱组件的兼容性和装配效率，降低研发和生产成本。该标准将考虑不同任务场景的需求，如近地轨道空间站、月球基地和火星前哨站等，提供灵活且可扩展的设计框架。',
            image: 'images/project-2.jpg',
            createdAt: lastWeek.toISOString(),
            progress: 40,
            views: 876,
            tags: ['模块化设计', '标准化', '太空舱', '系统集成'],
            members: [
                {
                    id: '2',
                    username: '李月球',
                    avatar: 'images/avatar-2.jpg',
                    role: '项目负责人',
                    isLeader: true,
                    skills: ['建筑设计', '环境控制', '人居空间']
                }
            ],
            followers: ['1'],
            resources: [
                {
                    id: '204',
                    title: '模块化接口规范草案',
                    type: 'document',
                    description: '太空舱模块间接口的标准化规范草案',
                    fileName: 'interface_standard_draft.pdf',
                    fileSize: 1856000,
                    userId: '2',
                    username: '李月球',
                    timestamp: yesterday.toISOString(),
                    downloads: 35
                },
                {
                    id: '205',
                    title: '模块化太空舱概念图',
                    type: 'image',
                    description: '基于标准化接口的模块化太空舱概念设计图',
                    fileName: 'modular_concept.jpg',
                    fileSize: 4562000,
                    userId: '2',
                    username: '李月球',
                    timestamp: now.toISOString(),
                    downloads: 42
                }
            ],
            activities: [
                {
                    type: 'resource',
                    userId: '2',
                    username: '李月球',
                    timestamp: now.toISOString(),
                    resourceTitle: '模块化太空舱概念图'
                },
                {
                    type: 'resource',
                    userId: '2',
                    username: '李月球',
                    timestamp: yesterday.toISOString(),
                    resourceTitle: '模块化接口规范草案'
                },
                {
                    type: 'follow',
                    userId: '1',
                    username: '张航天',
                    timestamp: lastWeek.toISOString()
                }
            ]
        }
    ];
    
    localStorage.setItem('projects', JSON.stringify(projects));
}
