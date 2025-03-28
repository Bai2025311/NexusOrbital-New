/**
 * NexusOrbital 移动端星空穹顶效果
 * 版本: 2025.03.23
 * 作者: 星际人居技术设计团队
 */

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化穹顶渐变
    initDomeGradient();
    
    // 创建星空背景
    createStarsBackground();
    
    // 创建穹顶内星星
    createDomeStars();
    
    // 初始化数据卡片
    initDataCards();
});

/**
 * 初始化穹顶渐变
 */
function initDomeGradient() {
    // 创建SVG命名空间
    const svgNS = "http://www.w3.org/2000/svg";
    
    // 创建SVG定义元素
    const svgDefs = document.createElementNS(svgNS, "defs");
    
    // 创建线性渐变
    const linearGradient = document.createElementNS(svgNS, "linearGradient");
    linearGradient.setAttribute("id", "dome-gradient");
    linearGradient.setAttribute("gradientUnits", "userSpaceOnUse");
    linearGradient.setAttribute("x1", "0%");
    linearGradient.setAttribute("y1", "0%");
    linearGradient.setAttribute("x2", "0%");
    linearGradient.setAttribute("y2", "100%");
    
    // 创建渐变色标
    const stops = [
        { offset: "0%", color: "#000012" },
        { offset: "30%", color: "#1B2735" },
        { offset: "60%", color: "#2D033B" },
        { offset: "90%", color: "#3a7bd5" },
        { offset: "100%", color: "#64E9EE" }
    ];
    
    // 添加色标到渐变
    stops.forEach(stop => {
        const stopElement = document.createElementNS(svgNS, "stop");
        stopElement.setAttribute("offset", stop.offset);
        stopElement.setAttribute("stop-color", stop.color);
        linearGradient.appendChild(stopElement);
    });
    
    // 将渐变添加到定义
    svgDefs.appendChild(linearGradient);
    
    // 将定义添加到SVG
    const domeSvg = document.querySelector('.dome-svg');
    domeSvg.insertBefore(svgDefs, domeSvg.firstChild);
}

/**
 * 创建星空背景
 */
function createStarsBackground() {
    const starsContainer = document.querySelector('.stars-background');
    const starCount = 200;
    
    // 清空现有星星
    starsContainer.innerHTML = '';
    
    // 创建星星
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // 随机位置
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        
        // 随机大小
        const size = Math.random() * 2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // 随机动画延迟
        star.style.animationDelay = `${Math.random() * 3}s`;
        
        // 添加到容器
        starsContainer.appendChild(star);
    }
}

/**
 * 创建穹顶内星星
 */
function createDomeStars() {
    const domeStarsContainer = document.getElementById('domeStars');
    const starCount = 50;
    
    // 清空现有星星
    domeStarsContainer.innerHTML = '';
    
    // 创建星星
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('dome-star');
        
        // 随机位置 - 主要集中在穹顶上部
        const topPercentage = Math.random() * 70; // 主要在上部70%的区域
        star.style.top = `${topPercentage}%`;
        star.style.left = `${Math.random() * 100}%`;
        
        // 随机大小 - 偶尔有大星星
        const size = Math.random() > 0.9 ? Math.random() * 3 + 1 : Math.random() * 2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // 随机动画延迟
        star.style.animationDelay = `${Math.random() * 5}s`;
        
        // 添加到容器
        domeStarsContainer.appendChild(star);
    }
}

/**
 * 初始化数据卡片
 */
function initDataCards() {
    // 模拟数据更新
    setInterval(updateDataCards, 5000);
}

/**
 * 更新数据卡片
 */
function updateDataCards() {
    const cards = document.querySelectorAll('.data-card');
    
    cards.forEach(card => {
        // 获取当前值
        const valueElement = card.querySelector('.card-value');
        const progressBar = card.querySelector('.progress-bar');
        
        // 当前值
        const currentValue = parseInt(valueElement.textContent);
        
        // 生成新值 (当前值 +/- 5%)
        const change = Math.floor(Math.random() * 5) - 2;
        let newValue = currentValue + change;
        
        // 确保值在合理范围内
        newValue = Math.max(50, Math.min(99, newValue));
        
        // 更新显示
        valueElement.textContent = `${newValue}%`;
        progressBar.style.width = `${newValue}%`;
        
        // 添加变化动画
        if (change > 0) {
            valueElement.classList.add('value-increase');
            setTimeout(() => valueElement.classList.remove('value-increase'), 1000);
        } else if (change < 0) {
            valueElement.classList.add('value-decrease');
            setTimeout(() => valueElement.classList.remove('value-decrease'), 1000);
        }
    });
}
