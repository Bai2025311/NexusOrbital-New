/**
 * NexusOrbital响应式设计优化器
 * 用于优化网站在不同设备上的显示和交互
 */

class ResponsiveOptimizer {
    constructor() {
        this.options = {
            breakpoints: {
                xs: 0,    // 超小屏幕
                sm: 576,  // 小屏幕
                md: 768,  // 中等屏幕
                lg: 992,  // 大屏幕
                xl: 1200, // 超大屏幕
                xxl: 1400 // 特大屏幕
            },
            adaptNavigation: true,     // 自适应导航
            optimizeTouch: true,       // 触摸优化
            adaptFontSize: true,       // 自适应字体大小
            optimizeFormsForMobile: true, // 优化移动端表单
            detectOrientation: true,   // 检测设备方向
            currentBreakpoint: '',     // 当前断点
            isMobile: false,           // 是否移动设备
            isTouch: false,            // 是否触摸设备
            debug: false               // 调试模式
        };
        
        this.initialized = false;
    }
    
    /**
     * 初始化响应式优化器
     * @param {Object} options 配置选项
     */
    init(options = {}) {
        if (this.initialized) return;
        
        // 合并选项
        this.options = { ...this.options, ...options };
        
        // 检测设备类型
        this.detectDeviceType();
        
        // 检测当前断点
        this.detectBreakpoint();
        
        // 添加响应式类
        this.addResponsiveClasses();
        
        // 设置事件监听
        this.setupEventListeners();
        
        // 优化导航
        if (this.options.adaptNavigation) {
            this.optimizeNavigation();
        }
        
        // 触摸优化
        if (this.options.optimizeTouch) {
            this.optimizeForTouch();
        }
        
        // 字体大小优化
        if (this.options.adaptFontSize) {
            this.optimizeFontSize();
        }
        
        // 表单优化
        if (this.options.optimizeFormsForMobile) {
            this.optimizeForms();
        }
        
        this.initialized = true;
        this.log('响应式优化器已初始化');
    }
    
    /**
     * 检测设备类型
     */
    detectDeviceType() {
        // 检测是否移动设备
        this.options.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 检测是否触摸设备
        this.options.isTouch = ('ontouchstart' in window) || 
                               (navigator.maxTouchPoints > 0) || 
                               (navigator.msMaxTouchPoints > 0);
        
        this.log(`设备检测: 移动设备=${this.options.isMobile}, 触摸设备=${this.options.isTouch}`);
    }
    
    /**
     * 检测当前断点
     */
    detectBreakpoint() {
        const width = window.innerWidth;
        let currentBreakpoint = '';
        
        // 从大到小检查断点
        const breakpoints = Object.entries(this.options.breakpoints).sort((a, b) => b[1] - a[1]);
        
        for (const [name, value] of breakpoints) {
            if (width >= value) {
                currentBreakpoint = name;
                break;
            }
        }
        
        this.options.currentBreakpoint = currentBreakpoint;
        this.log(`当前断点: ${currentBreakpoint} (${width}px)`);
        
        return currentBreakpoint;
    }
    
    /**
     * 添加响应式类
     */
    addResponsiveClasses() {
        // 移除旧的断点类
        document.documentElement.classList.forEach(cls => {
            if (cls.startsWith('breakpoint-')) {
                document.documentElement.classList.remove(cls);
            }
        });
        
        // 添加当前断点类
        document.documentElement.classList.add(`breakpoint-${this.options.currentBreakpoint}`);
        
        // 添加设备类型类
        if (this.options.isMobile) {
            document.documentElement.classList.add('is-mobile');
        } else {
            document.documentElement.classList.add('is-desktop');
        }
        
        if (this.options.isTouch) {
            document.documentElement.classList.add('is-touch');
        } else {
            document.documentElement.classList.add('is-pointer');
        }
        
        // 添加方向类
        if (this.options.detectOrientation) {
            if (window.innerWidth > window.innerHeight) {
                document.documentElement.classList.add('landscape');
                document.documentElement.classList.remove('portrait');
            } else {
                document.documentElement.classList.add('portrait');
                document.documentElement.classList.remove('landscape');
            }
        }
    }
    
    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 监听窗口大小变化
        window.addEventListener('resize', this.debounce(() => {
            this.detectBreakpoint();
            this.addResponsiveClasses();
            
            // 触发自定义事件
            const event = new CustomEvent('breakpointChange', { 
                detail: { 
                    breakpoint: this.options.currentBreakpoint,
                    width: window.innerWidth
                } 
            });
            document.dispatchEvent(event);
        }, 250));
        
        // 监听设备方向变化
        if (this.options.detectOrientation) {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.addResponsiveClasses();
                    
                    // 触发自定义事件
                    const event = new CustomEvent('orientationChange', { 
                        detail: { 
                            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
                        } 
                    });
                    document.dispatchEvent(event);
                }, 100);
            });
        }
    }
    
    /**
     * 优化导航
     */
    optimizeNavigation() {
        // 查找主导航
        const mainNav = document.querySelector('nav.main-nav, .main-navigation, header nav');
        if (!mainNav) return;
        
        // 检查是否已经有移动菜单
        if (mainNav.querySelector('.mobile-menu-toggle')) return;
        
        // 如果是移动设备或小屏幕，转换为汉堡菜单
        if (this.options.isMobile || ['xs', 'sm'].includes(this.options.currentBreakpoint)) {
            this.convertToMobileMenu(mainNav);
        }
        
        // 监听断点变化
        document.addEventListener('breakpointChange', (e) => {
            if (['xs', 'sm'].includes(e.detail.breakpoint)) {
                this.convertToMobileMenu(mainNav);
            } else {
                this.revertToDesktopMenu(mainNav);
            }
        });
    }
    
    /**
     * 转换为移动菜单
     * @param {HTMLElement} nav 导航元素
     */
    convertToMobileMenu(nav) {
        // 检查是否已经是移动菜单
        if (nav.classList.contains('mobile-menu-active')) return;
        
        // 添加移动菜单类
        nav.classList.add('mobile-menu-active');
        
        // 获取菜单项容器
        const menuContainer = nav.querySelector('ul') || nav;
        
        // 隐藏菜单项容器
        menuContainer.style.display = 'none';
        
        // 创建汉堡菜单按钮
        if (!nav.querySelector('.mobile-menu-toggle')) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'mobile-menu-toggle';
            toggleButton.setAttribute('aria-label', '切换菜单');
            toggleButton.innerHTML = '<span></span><span></span><span></span>';
            
            // 添加点击事件
            toggleButton.addEventListener('click', () => {
                const isVisible = menuContainer.style.display !== 'none';
                menuContainer.style.display = isVisible ? 'none' : 'block';
                toggleButton.classList.toggle('active', !isVisible);
                
                // 设置aria属性
                toggleButton.setAttribute('aria-expanded', !isVisible);
            });
            
            // 设置初始aria属性
            toggleButton.setAttribute('aria-expanded', 'false');
            
            // 插入按钮
            nav.insertBefore(toggleButton, menuContainer);
        }
    }
    
    /**
     * 恢复为桌面菜单
     * @param {HTMLElement} nav 导航元素
     */
    revertToDesktopMenu(nav) {
        // 检查是否是移动菜单
        if (!nav.classList.contains('mobile-menu-active')) return;
        
        // 移除移动菜单类
        nav.classList.remove('mobile-menu-active');
        
        // 获取菜单项容器
        const menuContainer = nav.querySelector('ul') || nav;
        
        // 显示菜单项容器
        menuContainer.style.display = '';
        
        // 隐藏汉堡菜单按钮
        const toggleButton = nav.querySelector('.mobile-menu-toggle');
        if (toggleButton) {
            toggleButton.style.display = 'none';
        }
    }
    
    /**
     * 触摸优化
     */
    optimizeForTouch() {
        if (!this.options.isTouch) return;
        
        // 增加点击区域
        this.increaseTapTargets();
        
        // 优化悬停状态
        this.optimizeHoverStates();
        
        // 添加触摸反馈
        this.addTouchFeedback();
    }
    
    /**
     * 增加点击区域
     */
    increaseTapTargets() {
        // 查找所有按钮和链接
        const tapTargets = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], .tap-target');
        
        tapTargets.forEach(target => {
            // 检查大小
            const rect = target.getBoundingClientRect();
            
            // 如果点击区域太小，增加内边距或外边距
            if (rect.width < 44 || rect.height < 44) {
                // 检查当前样式
                const style = window.getComputedStyle(target);
                const display = style.getPropertyValue('display');
                
                // 对于内联元素，设置为内联块
                if (display === 'inline') {
                    target.style.display = 'inline-block';
                }
                
                // 如果高度太小，增加内边距
                if (rect.height < 44) {
                    const currentPaddingTop = parseInt(style.getPropertyValue('padding-top'));
                    const currentPaddingBottom = parseInt(style.getPropertyValue('padding-bottom'));
                    const additionalPadding = Math.max(0, (44 - rect.height) / 2);
                    
                    target.style.paddingTop = `${currentPaddingTop + additionalPadding}px`;
                    target.style.paddingBottom = `${currentPaddingBottom + additionalPadding}px`;
                }
                
                // 如果宽度太小，增加内边距
                if (rect.width < 44) {
                    const currentPaddingLeft = parseInt(style.getPropertyValue('padding-left'));
                    const currentPaddingRight = parseInt(style.getPropertyValue('padding-right'));
                    const additionalPadding = Math.max(0, (44 - rect.width) / 2);
                    
                    target.style.paddingLeft = `${currentPaddingLeft + additionalPadding}px`;
                    target.style.paddingRight = `${currentPaddingRight + additionalPadding}px`;
                }
                
                // 添加类以标记已优化
                target.classList.add('tap-optimized');
            }
        });
    }
    
    /**
     * 优化悬停状态
     */
    optimizeHoverStates() {
        // 在触摸设备上，:hover伪类可能会导致问题
        // 添加一个类以便CSS中可以区分触摸和非触摸设备
        document.documentElement.classList.add('optimize-hover');
        
        // 为所有有悬停效果的元素添加触摸处理
        const hoverElements = document.querySelectorAll('.has-hover, .hover-effect');
        
        hoverElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                // 移除所有其他元素的活动类
                hoverElements.forEach(el => {
                    if (el !== element) {
                        el.classList.remove('hover-active');
                    }
                });
                
                // 切换当前元素的活动类
                element.classList.toggle('hover-active');
            });
        });
        
        // 点击文档其他地方时移除所有活动类
        document.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.has-hover, .hover-effect')) {
                hoverElements.forEach(el => {
                    el.classList.remove('hover-active');
                });
            }
        });
    }
    
    /**
     * 添加触摸反馈
     */
    addTouchFeedback() {
        // 为所有可点击元素添加触摸反馈
        const touchTargets = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], .touch-feedback');
        
        touchTargets.forEach(target => {
            // 跳过已经处理过的元素
            if (target.classList.contains('touch-feedback-added')) return;
            
            // 添加触摸开始事件
            target.addEventListener('touchstart', () => {
                target.classList.add('touch-active');
            });
            
            // 添加触摸结束和取消事件
            ['touchend', 'touchcancel'].forEach(eventType => {
                target.addEventListener(eventType, () => {
                    target.classList.remove('touch-active');
                });
            });
            
            // 标记为已添加反馈
            target.classList.add('touch-feedback-added');
        });
        
        // 添加触摸反馈样式
        this.addTouchFeedbackStyles();
    }
    
    /**
     * 添加触摸反馈样式
     */
    addTouchFeedbackStyles() {
        // 检查是否已经添加了样式
        if (document.getElementById('touch-feedback-styles')) return;
        
        // 创建样式元素
        const style = document.createElement('style');
        style.id = 'touch-feedback-styles';
        
        // 设置样式内容
        style.textContent = `
            .touch-active {
                opacity: 0.7 !important;
                transition: opacity 0.1s ease-out !important;
            }
            
            .optimize-hover .has-hover:hover,
            .optimize-hover .hover-effect:hover {
                /* 在触摸设备上禁用悬停效果 */
                opacity: 1 !important;
                transform: none !important;
                box-shadow: none !important;
            }
            
            .optimize-hover .hover-active {
                /* 使用活动类代替悬停 */
                opacity: 0.8 !important;
                transform: translateY(2px) !important;
                transition: all 0.2s ease-out !important;
            }
        `;
        
        // 添加到文档
        document.head.appendChild(style);
    }
    
    /**
     * 优化字体大小
     */
    optimizeFontSize() {
        // 检查是否已经添加了样式
        if (document.getElementById('responsive-font-styles')) return;
        
        // 创建样式元素
        const style = document.createElement('style');
        style.id = 'responsive-font-styles';
        
        // 设置样式内容
        style.textContent = `
            /* 基础响应式字体大小 */
            @media (max-width: ${this.options.breakpoints.sm}px) {
                body {
                    font-size: 14px;
                }
                h1 {
                    font-size: 1.8rem;
                }
                h2 {
                    font-size: 1.5rem;
                }
                h3 {
                    font-size: 1.3rem;
                }
            }
            
            @media (min-width: ${this.options.breakpoints.sm + 1}px) and (max-width: ${this.options.breakpoints.lg}px) {
                body {
                    font-size: 16px;
                }
                h1 {
                    font-size: 2rem;
                }
                h2 {
                    font-size: 1.7rem;
                }
                h3 {
                    font-size: 1.4rem;
                }
            }
            
            @media (min-width: ${this.options.breakpoints.lg + 1}px) {
                body {
                    font-size: 18px;
                }
                h1 {
                    font-size: 2.5rem;
                }
                h2 {
                    font-size: 2rem;
                }
                h3 {
                    font-size: 1.5rem;
                }
            }
            
            /* 流体排版 */
            .fluid-text-sm {
                font-size: calc(14px + 0.2vw);
            }
            
            .fluid-text-md {
                font-size: calc(16px + 0.3vw);
            }
            
            .fluid-text-lg {
                font-size: calc(18px + 0.5vw);
            }
            
            .fluid-heading-1 {
                font-size: calc(1.8rem + 1vw);
            }
            
            .fluid-heading-2 {
                font-size: calc(1.5rem + 0.8vw);
            }
            
            .fluid-heading-3 {
                font-size: calc(1.3rem + 0.5vw);
            }
        `;
        
        // 添加到文档
        document.head.appendChild(style);
    }
    
    /**
     * 优化表单
     */
    optimizeForms() {
        // 查找所有表单
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // 跳过已经优化的表单
            if (form.classList.contains('mobile-optimized')) return;
            
            // 优化输入框
            this.optimizeInputs(form);
            
            // 优化选择框
            this.optimizeSelects(form);
            
            // 优化按钮
            this.optimizeButtons(form);
            
            // 标记为已优化
            form.classList.add('mobile-optimized');
        });
        
        // 添加表单优化样式
        this.addFormOptimizationStyles();
    }
    
    /**
     * 优化输入框
     * @param {HTMLFormElement} form 表单元素
     */
    optimizeInputs(form) {
        // 查找所有输入框
        const inputs = form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            // 设置适当的输入类型
            if (input.type === 'text') {
                // 根据name或id猜测输入类型
                const name = input.name.toLowerCase();
                const id = (input.id || '').toLowerCase();
                
                if (name.includes('email') || id.includes('email')) {
                    input.type = 'email';
                } else if (name.includes('tel') || name.includes('phone') || id.includes('tel') || id.includes('phone')) {
                    input.type = 'tel';
                } else if (name.includes('search') || id.includes('search')) {
                    input.type = 'search';
                } else if (name.includes('url') || id.includes('url')) {
                    input.type = 'url';
                } else if (name.includes('number') || id.includes('number')) {
                    input.type = 'number';
                }
            }
            
            // 设置自动完成属性
            if (!input.hasAttribute('autocomplete')) {
                const name = input.name.toLowerCase();
                
                if (name.includes('name')) {
                    input.autocomplete = name.includes('first') ? 'given-name' : 
                                        name.includes('last') ? 'family-name' : 'name';
                } else if (name.includes('email')) {
                    input.autocomplete = 'email';
                } else if (name.includes('tel') || name.includes('phone')) {
                    input.autocomplete = 'tel';
                } else if (name.includes('address')) {
                    input.autocomplete = 'street-address';
                } else if (name.includes('city')) {
                    input.autocomplete = 'address-level2';
                } else if (name.includes('state') || name.includes('province')) {
                    input.autocomplete = 'address-level1';
                } else if (name.includes('zip') || name.includes('postal')) {
                    input.autocomplete = 'postal-code';
                } else if (name.includes('country')) {
                    input.autocomplete = 'country';
                } else if (name.includes('username')) {
                    input.autocomplete = 'username';
                } else if (name.includes('password')) {
                    input.autocomplete = 'current-password';
                }
            }
            
            // 增加触摸设备上的点击区域
            if (this.options.isTouch) {
                input.classList.add('touch-input');
            }
        });
    }
    
    /**
     * 优化选择框
     * @param {HTMLFormElement} form 表单元素
     */
    optimizeSelects(form) {
        // 查找所有选择框
        const selects = form.querySelectorAll('select');
        
        selects.forEach(select => {
            // 增加触摸设备上的点击区域
            if (this.options.isTouch) {
                select.classList.add('touch-select');
            }
        });
    }
    
    /**
     * 优化按钮
     * @param {HTMLFormElement} form 表单元素
     */
    optimizeButtons(form) {
        // 查找所有按钮
        const buttons = form.querySelectorAll('button, input[type="button"], input[type="submit"]');
        
        buttons.forEach(button => {
            // 增加触摸设备上的点击区域
            if (this.options.isTouch) {
                button.classList.add('touch-button');
            }
        });
    }
    
    /**
     * 添加表单优化样式
     */
    addFormOptimizationStyles() {
        // 检查是否已经添加了样式
        if (document.getElementById('form-optimization-styles')) return;
        
        // 创建样式元素
        const style = document.createElement('style');
        style.id = 'form-optimization-styles';
        
        // 设置样式内容
        style.textContent = `
            /* 触摸优化输入控件 */
            .touch-input,
            .touch-select,
            .touch-button {
                min-height: 44px;
                min-width: 44px;
                font-size: 16px; /* 防止iOS缩放 */
            }
            
            /* 移动端表单布局 */
            @media (max-width: ${this.options.breakpoints.sm}px) {
                form {
                    display: flex;
                    flex-direction: column;
                }
                
                form .form-group,
                form .form-row {
                    margin-bottom: 16px;
                }
                
                form label {
                    display: block;
                    margin-bottom: 8px;
                }
                
                form input,
                form select,
                form textarea {
                    width: 100%;
                    box-sizing: border-box;
                }
                
                form button,
                form input[type="button"],
                form input[type="submit"] {
                    width: 100%;
                    margin-top: 8px;
                }
            }
        `;
        
        // 添加到文档
        document.head.appendChild(style);
    }
    
    /**
     * 防抖函数
     * @param {Function} func 要防抖的函数
     * @param {number} wait 等待时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    /**
     * 输出日志
     * @param {string} message 日志消息
     */
    log(message) {
        if (this.options.debug) {
            console.log(`[响应式优化器] ${message}`);
        }
    }
}

// 创建并导出单例
const responsiveOptimizer = new ResponsiveOptimizer();
export default responsiveOptimizer;
