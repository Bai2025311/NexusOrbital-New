/**
 * NexusOrbital 图片占位符生成器
 * 版本: 2025.03.23
 * 作者: 星际人居技术设计团队
 */

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 替换所有缺失的项目图片为占位图
    replaceMissingImages();
});

/**
 * 替换缺失的项目图片为占位图
 */
function replaceMissingImages() {
    // 获取所有项目图片容器
    const projectImages = document.querySelectorAll('.project-image');
    
    projectImages.forEach(imageContainer => {
        // 检查背景图片URL是否包含"../images/"
        const style = window.getComputedStyle(imageContainer);
        const bgImage = style.backgroundImage;
        
        if (bgImage.includes('../images/') || bgImage === 'none') {
            // 生成渐变背景作为占位图
            const gradients = [
                'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
                'linear-gradient(135deg, #2b5876, #4e4376)',
                'linear-gradient(135deg, #ff6e7f, #bfe9ff)',
                'linear-gradient(135deg, #3a7bd5, #3a6073)'
            ];
            
            // 随机选择一个渐变
            const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
            
            // 应用渐变作为背景
            imageContainer.style.backgroundImage = randomGradient;
            
            // 添加项目图标
            const icon = document.createElement('i');
            icon.className = 'fas fa-rocket';
            icon.style.position = 'absolute';
            icon.style.top = '50%';
            icon.style.left = '50%';
            icon.style.transform = 'translate(-50%, -50%)';
            icon.style.fontSize = '2rem';
            icon.style.color = 'rgba(255, 255, 255, 0.8)';
            
            imageContainer.appendChild(icon);
        }
    });
}
