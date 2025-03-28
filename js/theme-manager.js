/**
 * NexusOrbital主题管理器
 * 用于管理网站主题，支持多主题切换和用户偏好存储
 */

class ThemeManager {
    constructor(options = {}) {
        this.options = {
            // 主题选项
            enabled: true,
            defaultTheme: 'light',
            supportDarkMode: true,
            respectUserPreference: true,
            storageKey: 'nexusorbital-theme',
            transitionDuration: 300,
            
            // 主题定义
            themes: {
                light: {
                    name: '明亮模式',
                    colors: {
                        // 主要颜色
                        primary: '#1e88e5',
                        secondary: '#6c757d',
                        success: '#28a745',
                        danger: '#dc3545',
                        warning: '#ffc107',
                        info: '#17a2b8',
                        
                        // 背景颜色
                        background: '#ffffff',
                        backgroundAlt: '#f8f9fa',
                        backgroundElevated: '#ffffff',
                        
                        // 文本颜色
                        textPrimary: '#212529',
                        textSecondary: '#6c757d',
                        textMuted: '#999999',
                        textInverse: '#ffffff',
                        
                        // 边框颜色
                        border: '#dee2e6',
                        borderLight: '#e9ecef',
                        borderDark: '#ced4da',
                        
                        // 链接颜色
                        link: '#1e88e5',
                        linkHover: '#0d47a1',
                        
                        // 阴影
                        shadow: 'rgba(0, 0, 0, 0.1)'
                    },
                    fonts: {
                        base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        heading: 'inherit',
                        monospace: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                    },
                    spacing: {
                        base: '1rem',
                        xs: '0.25rem',
                        sm: '0.5rem',
                        md: '1rem',
                        lg: '1.5rem',
                        xl: '3rem'
                    },
                    borderRadius: {
                        sm: '0.2rem',
                        md: '0.25rem',
                        lg: '0.3rem',
                        pill: '50rem'
                    },
                    boxShadow: {
                        sm: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
                        md: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
                        lg: '0 1rem 3rem rgba(0, 0, 0, 0.175)'
                    }
                },
                dark: {
                    name: '暗黑模式',
                    colors: {
                        // 主要颜色
                        primary: '#2196f3',
                        secondary: '#6c757d',
                        success: '#4caf50',
                        danger: '#f44336',
                        warning: '#ff9800',
                        info: '#00bcd4',
                        
                        // 背景颜色
                        background: '#121212',
                        backgroundAlt: '#1e1e1e',
                        backgroundElevated: '#2d2d2d',
                        
                        // 文本颜色
                        textPrimary: '#e0e0e0',
                        textSecondary: '#aaaaaa',
                        textMuted: '#777777',
                        textInverse: '#121212',
                        
                        // 边框颜色
                        border: '#333333',
                        borderLight: '#444444',
                        borderDark: '#222222',
                        
                        // 链接颜色
                        link: '#2196f3',
                        linkHover: '#90caf9',
                        
                        // 阴影
                        shadow: 'rgba(0, 0, 0, 0.3)'
                    },
                    fonts: {
                        base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        heading: 'inherit',
                        monospace: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                    },
                    spacing: {
                        base: '1rem',
                        xs: '0.25rem',
                        sm: '0.5rem',
                        md: '1rem',
                        lg: '1.5rem',
                        xl: '3rem'
                    },
                    borderRadius: {
                        sm: '0.2rem',
                        md: '0.25rem',
                        lg: '0.3rem',
                        pill: '50rem'
                    },
                    boxShadow: {
                        sm: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.2)',
                        md: '0 0.5rem 1rem rgba(0, 0, 0, 0.4)',
                        lg: '0 1rem 3rem rgba(0, 0, 0, 0.5)'
                    }
                },
                // 太空主题
                space: {
                    name: '太空主题',
                    colors: {
                        // 主要颜色
                        primary: '#6200ea',
                        secondary: '#0091ea',
                        success: '#00c853',
                        danger: '#d50000',
                        warning: '#ffab00',
                        info: '#00b8d4',
                        
                        // 背景颜色
                        background: '#0a1929',
                        backgroundAlt: '#0d2137',
                        backgroundElevated: '#102a43',
                        
                        // 文本颜色
                        textPrimary: '#e6f1ff',
                        textSecondary: '#b3e5fc',
                        textMuted: '#64b5f6',
                        textInverse: '#0a1929',
                        
                        // 边框颜色
                        border: '#1a3a5f',
                        borderLight: '#2a4a6f',
                        borderDark: '#0a2744',
                        
                        // 链接颜色
                        link: '#29b6f6',
                        linkHover: '#4fc3f7',
                        
                        // 阴影
                        shadow: 'rgba(0, 0, 0, 0.5)'
                    },
                    fonts: {
                        base: '"Roboto", "Helvetica Neue", Arial, sans-serif',
                        heading: '"Exo 2", "Roboto", sans-serif',
                        monospace: '"Roboto Mono", monospace'
                    },
                    spacing: {
                        base: '1rem',
                        xs: '0.25rem',
                        sm: '0.5rem',
                        md: '1rem',
                        lg: '1.5rem',
                        xl: '3rem'
                    },
                    borderRadius: {
                        sm: '0.2rem',
                        md: '0.25rem',
                        lg: '0.3rem',
                        pill: '50rem'
                    },
                    boxShadow: {
                        sm: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.3)',
                        md: '0 0.5rem 1rem rgba(0, 0, 0, 0.5)',
                        lg: '0 1rem 3rem rgba(0, 0, 0, 0.7)'
                    }
                }
            },
            
            // 调试模式
            debug: false
        };
        
        // 合并选项
        this.options = { ...this.options, ...options };
        
        // 当前主题
        this.currentTheme = null;
        
        // 初始化标志
        this.initialized = false;
        
        // CSS变量前缀
        this.cssVarPrefix = '--nexus-';
    }
    
    /**
     * 初始化主题管理器
     */
    init() {
        if (this.initialized) return;
        
        this.log('主题管理器初始化中...');
        
        // 检测并应用主题
        this.detectAndApplyTheme();
        
        // 设置主题切换监听
        this.setupThemeToggleListeners();
        
        // 设置媒体查询监听
        if (this.options.respectUserPreference && this.options.supportDarkMode) {
            this.setupMediaQueryListeners();
        }
        
        this.initialized = true;
        this.log('主题管理器初始化完成');
    }
    
    /**
     * 检测并应用主题
     */
    detectAndApplyTheme() {
        // 尝试从存储中获取主题
        const storedTheme = localStorage.getItem(this.options.storageKey);
        
        if (storedTheme && this.isValidTheme(storedTheme)) {
            // 应用存储的主题
            this.applyTheme(storedTheme);
        } else if (this.options.respectUserPreference && this.options.supportDarkMode) {
            // 检测系统偏好
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = prefersDarkMode ? 'dark' : this.options.defaultTheme;
            
            // 应用主题
            this.applyTheme(theme);
        } else {
            // 应用默认主题
            this.applyTheme(this.options.defaultTheme);
        }
    }
    
    /**
     * 设置主题切换监听
     */
    setupThemeToggleListeners() {
        // 查找主题切换按钮
        const themeToggles = document.querySelectorAll('[data-theme-toggle]');
        
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 获取目标主题
                const targetTheme = toggle.dataset.themeToggle;
                
                if (targetTheme === 'toggle') {
                    // 切换明暗主题
                    this.toggleTheme();
                } else if (this.isValidTheme(targetTheme)) {
                    // 应用指定主题
                    this.applyTheme(targetTheme);
                }
            });
        });
    }
    
    /**
     * 设置媒体查询监听
     */
    setupMediaQueryListeners() {
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            // 只有在用户没有手动设置主题时才跟随系统
            if (!localStorage.getItem(this.options.storageKey)) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(newTheme, false);
            }
        });
    }
    
    /**
     * 应用主题
     * @param {string} themeName 主题名称
     * @param {boolean} savePreference 是否保存偏好
     */
    applyTheme(themeName, savePreference = true) {
        if (!this.isValidTheme(themeName)) {
            console.error(`无效的主题: ${themeName}`);
            return;
        }
        
        const theme = this.options.themes[themeName];
        
        // 设置当前主题
        this.currentTheme = themeName;
        
        // 移除所有主题类
        Object.keys(this.options.themes).forEach(name => {
            document.documentElement.classList.remove(`theme-${name}`);
        });
        
        // 添加当前主题类
        document.documentElement.classList.add(`theme-${themeName}`);
        
        // 应用CSS变量
        this.applyCSSVariables(theme);
        
        // 保存用户偏好
        if (savePreference) {
            localStorage.setItem(this.options.storageKey, themeName);
        }
        
        // 触发主题变更事件
        const event = new CustomEvent('themeChange', { 
            detail: { 
                theme: themeName,
                themeData: theme
            } 
        });
        document.dispatchEvent(event);
        
        this.log(`已应用主题: ${themeName} (${theme.name})`);
    }
    
    /**
     * 应用CSS变量
     * @param {Object} theme 主题对象
     */
    applyCSSVariables(theme) {
        // 获取根元素
        const root = document.documentElement;
        
        // 应用颜色变量
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`${this.cssVarPrefix}color-${this.kebabCase(key)}`, value);
        });
        
        // 应用字体变量
        Object.entries(theme.fonts).forEach(([key, value]) => {
            root.style.setProperty(`${this.cssVarPrefix}font-${this.kebabCase(key)}`, value);
        });
        
        // 应用间距变量
        Object.entries(theme.spacing).forEach(([key, value]) => {
            root.style.setProperty(`${this.cssVarPrefix}spacing-${this.kebabCase(key)}`, value);
        });
        
        // 应用圆角变量
        Object.entries(theme.borderRadius).forEach(([key, value]) => {
            root.style.setProperty(`${this.cssVarPrefix}radius-${this.kebabCase(key)}`, value);
        });
        
        // 应用阴影变量
        Object.entries(theme.boxShadow).forEach(([key, value]) => {
            root.style.setProperty(`${this.cssVarPrefix}shadow-${this.kebabCase(key)}`, value);
        });
    }
    
    /**
     * 切换主题
     */
    toggleTheme() {
        // 如果当前是暗色主题，切换到亮色主题，反之亦然
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }
    
    /**
     * 获取当前主题
     * @returns {string} 当前主题名称
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    /**
     * 获取当前主题数据
     * @returns {Object} 当前主题数据
     */
    getCurrentThemeData() {
        return this.options.themes[this.currentTheme];
    }
    
    /**
     * 获取可用主题列表
     * @returns {Array} 主题列表
     */
    getAvailableThemes() {
        return Object.keys(this.options.themes).map(key => ({
            id: key,
            name: this.options.themes[key].name
        }));
    }
    
    /**
     * 检查主题是否有效
     * @param {string} themeName 主题名称
     * @returns {boolean} 是否有效
     */
    isValidTheme(themeName) {
        return Object.keys(this.options.themes).includes(themeName);
    }
    
    /**
     * 添加主题
     * @param {string} themeName 主题名称
     * @param {Object} themeData 主题数据
     */
    addTheme(themeName, themeData) {
        // 确保主题数据有效
        if (!themeData || !themeData.colors) {
            console.error('无效的主题数据');
            return;
        }
        
        // 添加主题
        this.options.themes[themeName] = themeData;
        
        this.log(`已添加主题: ${themeName} (${themeData.name})`);
    }
    
    /**
     * 移除主题
     * @param {string} themeName 主题名称
     */
    removeTheme(themeName) {
        // 不允许移除基本主题
        if (themeName === 'light' || themeName === 'dark') {
            console.error('不能移除基本主题');
            return;
        }
        
        // 如果当前主题是要移除的主题，先切换到默认主题
        if (this.currentTheme === themeName) {
            this.applyTheme(this.options.defaultTheme);
        }
        
        // 移除主题
        delete this.options.themes[themeName];
        
        this.log(`已移除主题: ${themeName}`);
    }
    
    /**
     * 创建主题切换器UI
     * @param {HTMLElement} container 容器元素
     */
    createThemeSwitcher(container) {
        // 创建主题切换器容器
        const switcherContainer = document.createElement('div');
        switcherContainer.className = 'theme-switcher';
        
        // 创建标题
        const title = document.createElement('h4');
        title.textContent = '选择主题';
        switcherContainer.appendChild(title);
        
        // 创建主题列表
        const themeList = document.createElement('div');
        themeList.className = 'theme-list';
        
        // 添加主题选项
        Object.keys(this.options.themes).forEach(themeName => {
            const theme = this.options.themes[themeName];
            
            // 创建主题选项
            const themeOption = document.createElement('div');
            themeOption.className = 'theme-option';
            themeOption.dataset.theme = themeName;
            
            // 创建主题预览
            const themePreview = document.createElement('div');
            themePreview.className = 'theme-preview';
            themePreview.style.backgroundColor = theme.colors.background;
            themePreview.style.borderColor = theme.colors.border;
            
            // 添加主题颜色示例
            ['primary', 'secondary', 'success', 'danger', 'warning', 'info'].forEach(color => {
                const colorSample = document.createElement('span');
                colorSample.className = `color-sample color-${color}`;
                colorSample.style.backgroundColor = theme.colors[color];
                themePreview.appendChild(colorSample);
            });
            
            themeOption.appendChild(themePreview);
            
            // 创建主题名称
            const themeName = document.createElement('span');
            themeName.className = 'theme-name';
            themeName.textContent = theme.name;
            themeOption.appendChild(themeName);
            
            // 添加点击事件
            themeOption.addEventListener('click', () => {
                this.applyTheme(themeName);
                
                // 更新选中状态
                document.querySelectorAll('.theme-option').forEach(option => {
                    option.classList.remove('active');
                });
                themeOption.classList.add('active');
            });
            
            // 如果是当前主题，添加活动类
            if (themeName === this.currentTheme) {
                themeOption.classList.add('active');
            }
            
            themeList.appendChild(themeOption);
        });
        
        switcherContainer.appendChild(themeList);
        
        // 添加到容器
        container.appendChild(switcherContainer);
        
        // 添加样式
        this.addThemeSwitcherStyles();
    }
    
    /**
     * 添加主题切换器样式
     */
    addThemeSwitcherStyles() {
        // 检查是否已经添加了样式
        if (document.getElementById('theme-switcher-styles')) return;
        
        // 创建样式元素
        const style = document.createElement('style');
        style.id = 'theme-switcher-styles';
        
        // 设置样式内容
        style.textContent = `
            .theme-switcher {
                padding: 1rem;
                border-radius: 0.5rem;
                background-color: var(${this.cssVarPrefix}color-background-alt);
                border: 1px solid var(${this.cssVarPrefix}color-border);
                margin-bottom: 1rem;
            }
            
            .theme-switcher h4 {
                margin-top: 0;
                margin-bottom: 0.5rem;
                color: var(${this.cssVarPrefix}color-text-primary);
            }
            
            .theme-list {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
            }
            
            .theme-option {
                cursor: pointer;
                border-radius: 0.25rem;
                padding: 0.5rem;
                transition: all 0.2s ease;
                border: 2px solid transparent;
                text-align: center;
            }
            
            .theme-option:hover {
                background-color: var(${this.cssVarPrefix}color-background-elevated);
            }
            
            .theme-option.active {
                border-color: var(${this.cssVarPrefix}color-primary);
                background-color: var(${this.cssVarPrefix}color-background-elevated);
            }
            
            .theme-preview {
                width: 100px;
                height: 60px;
                border-radius: 0.25rem;
                border: 1px solid var(${this.cssVarPrefix}color-border);
                margin-bottom: 0.5rem;
                padding: 0.5rem;
                display: flex;
                flex-wrap: wrap;
                gap: 0.25rem;
                justify-content: center;
                align-items: center;
            }
            
            .color-sample {
                width: 1rem;
                height: 1rem;
                border-radius: 50%;
                display: inline-block;
            }
            
            .theme-name {
                font-size: 0.875rem;
                color: var(${this.cssVarPrefix}color-text-primary);
            }
        `;
        
        // 添加到文档
        document.head.appendChild(style);
    }
    
    /**
     * 将驼峰命名转换为短横线命名
     * @param {string} str 驼峰命名字符串
     * @returns {string} 短横线命名字符串
     */
    kebabCase(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }
    
    /**
     * 输出日志
     * @param {string} message 日志消息
     */
    log(message) {
        if (this.options.debug) {
            console.log(`[主题管理器] ${message}`);
        }
    }
}

export default ThemeManager;
