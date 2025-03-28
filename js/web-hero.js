/**
 * NexusOrbital 网页端英雄区域3D效果
 * 版本: 2025.03.23
 * 作者: 星际人居技术设计团队
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化英雄区域3D效果
    initHeroCanvas();
});

/**
 * 初始化英雄区域3D效果
 */
function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    
    // 创建3D场景
    const scene = createScene(canvas);
    
    // 添加交互效果
    addInteraction(canvas, scene);
}

/**
 * 创建3D场景
 * @param {HTMLElement} container - 容器元素
 * @returns {Object} - 场景对象
 */
function createScene(container) {
    // 创建场景对象
    const scene = {
        particles: [],
        lines: [],
        rotation: 0,
        mouseX: 0,
        mouseY: 0
    };
    
    // 创建画布
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    container.appendChild(canvas);
    
    // 设置画布尺寸
    function setCanvasSize() {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
    }
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // 创建粒子
    function createParticles() {
        const particleCount = 100;
        scene.particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            // 创建3D空间中的随机点
            const particle = {
                x: Math.random() * 1000 - 500,
                y: Math.random() * 1000 - 500,
                z: Math.random() * 1000 - 500,
                size: Math.random() * 2 + 1,
                color: getRandomColor(),
                speed: Math.random() * 0.2 + 0.1
            };
            
            scene.particles.push(particle);
        }
    }
    
    // 获取随机颜色
    function getRandomColor() {
        const colors = [
            '#3a7bd5', // 蓝色
            '#64E9EE', // 青色
            '#E6F1FF', // 白色
            '#8892B0'  // 灰色
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // 创建连接线
    function createLines() {
        scene.lines = [];
        const maxDistance = 150;
        
        for (let i = 0; i < scene.particles.length; i++) {
            for (let j = i + 1; j < scene.particles.length; j++) {
                const p1 = scene.particles[i];
                const p2 = scene.particles[j];
                
                // 计算3D空间中的距离
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dz = p1.z - p2.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (distance < maxDistance) {
                    scene.lines.push({
                        p1: i,
                        p2: j,
                        distance: distance,
                        opacity: 1 - distance / maxDistance
                    });
                }
            }
        }
    }
    
    // 渲染场景
    function renderScene() {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 计算视角中心
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 更新粒子位置
        scene.particles.forEach(particle => {
            // 旋转粒子
            const rotationX = scene.rotation * 0.001 + scene.mouseY * 0.0005;
            const rotationY = scene.rotation * 0.001 + scene.mouseX * 0.0005;
            
            // 应用旋转变换
            const cosX = Math.cos(rotationX);
            const sinX = Math.sin(rotationX);
            const cosY = Math.cos(rotationY);
            const sinY = Math.sin(rotationY);
            
            // 旋转X轴
            const y1 = particle.y * cosX - particle.z * sinX;
            const z1 = particle.y * sinX + particle.z * cosX;
            
            // 旋转Y轴
            const x2 = particle.x * cosY + z1 * sinY;
            const z2 = -particle.x * sinY + z1 * cosY;
            
            // 计算透视投影
            const scale = 1000 / (1000 + z2);
            const x = centerX + x2 * scale;
            const y = centerY + y1 * scale;
            
            // 更新粒子位置
            particle.projectedX = x;
            particle.projectedY = y;
            particle.projectedScale = scale;
            
            // 绘制粒子
            ctx.beginPath();
            ctx.arc(x, y, particle.size * scale, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = 0.6 * scale;
            ctx.fill();
        });
        
        // 绘制连接线
        scene.lines.forEach(line => {
            const p1 = scene.particles[line.p1];
            const p2 = scene.particles[line.p2];
            
            ctx.beginPath();
            ctx.moveTo(p1.projectedX, p1.projectedY);
            ctx.lineTo(p2.projectedX, p2.projectedY);
            
            // 计算线的透明度
            const opacity = line.opacity * Math.min(p1.projectedScale, p2.projectedScale) * 0.5;
            
            ctx.strokeStyle = 'rgba(58, 123, 213, ' + opacity + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
        
        // 更新旋转
        scene.rotation += 0.5;
        
        // 循环动画
        requestAnimationFrame(renderScene);
    }
    
    // 初始化场景
    createParticles();
    createLines();
    renderScene();
    
    return scene;
}

/**
 * 添加交互效果
 * @param {HTMLElement} container - 容器元素
 * @param {Object} scene - 场景对象
 */
function addInteraction(container, scene) {
    // 鼠标移动交互
    container.addEventListener('mousemove', function(e) {
        const rect = container.getBoundingClientRect();
        scene.mouseX = (e.clientX - rect.left - rect.width / 2) * 2;
        scene.mouseY = (e.clientY - rect.top - rect.height / 2) * 2;
    });
    
    // 触摸交互
    container.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) {
            const rect = container.getBoundingClientRect();
            scene.mouseX = (e.touches[0].clientX - rect.left - rect.width / 2) * 2;
            scene.mouseY = (e.touches[0].clientY - rect.top - rect.height / 2) * 2;
            e.preventDefault();
        }
    });
    
    // 重置鼠标位置
    container.addEventListener('mouseleave', function() {
        scene.mouseX = 0;
        scene.mouseY = 0;
    });
}
