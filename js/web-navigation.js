/**
 * NexusOrbital 网页端导航功能
 * 版本: 2025.03.23
 * 作者: 星际人居技术设计团队
 */

document.addEventListener('DOMContentLoaded', function() {
    // 导航菜单切换
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
        });
    }
    
    // 滚动效果
    const header = document.querySelector('.main-header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // 生成星星背景
    generateStars();
    
    // 平滑滚动
    setupSmoothScrolling();
});

/**
 * 生成星星背景
 */
function generateStars() {
    const starsContainer = document.querySelector('.stars-background');
    if (!starsContainer) return;
    
    const starsCount = 100;
    
    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // 随机大小
        const size = Math.random() * 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // 随机位置
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        star.style.left = `${posX}%`;
        star.style.top = `${posY}%`;
        
        // 随机闪烁时间
        const twinkleDuration = 3 + Math.random() * 7;
        star.style.setProperty('--twinkle-duration', `${twinkleDuration}s`);
        
        // 随机延迟
        const delay = Math.random() * 5;
        star.style.animationDelay = `${delay}s`;
        
        starsContainer.appendChild(star);
    }
}

/**
 * 设置平滑滚动
 */
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                const headerHeight = document.querySelector('.main-header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // 如果是移动端菜单，点击后关闭菜单
                const mainNav = document.querySelector('.main-nav');
                const mobileToggle = document.querySelector('.mobile-toggle');
                
                if (mainNav && mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    if (mobileToggle) {
                        mobileToggle.classList.remove('active');
                    }
                }
            }
        });
    });
}

/**
 * 登录按钮点击事件
 */
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.querySelector('.login-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            // 这里可以添加登录逻辑或跳转到登录页面
            console.log('登录按钮被点击');
            alert('登录功能即将上线，敬请期待！');
        });
    }
});
