# NexusOrbital 新版网站部署脚本
# 此脚本用于将NexusOrbital新版网站代码上传到GitHub

# 设置变量
$repoName = "nexusorbital-new"
$repoDescription = "NexusOrbital新版网站 - 包含完整支付系统和会员管理功能"
$sourceDir = "C:\Users\Administrator\CascadeProjects\NexusOrbital"
$tempDir = "C:\Users\Administrator\CascadeProjects\temp-deploy"
$excludeFiles = @(".git", "node_modules", ".env", "package-lock.json")

# 创建临时目录
Write-Host "创建临时部署目录..." -ForegroundColor Cyan
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory | Out-Null

# 复制文件到临时目录，排除不需要的文件
Write-Host "复制文件到临时目录..." -ForegroundColor Cyan
Get-ChildItem -Path $sourceDir -Exclude $excludeFiles | ForEach-Object {
    if ($_.PSIsContainer) {
        # 如果是目录，递归复制，但排除node_modules
        if ($_.Name -notin $excludeFiles) {
            Copy-Item -Path $_.FullName -Destination "$tempDir\$($_.Name)" -Recurse
        }
    } else {
        # 如果是文件，直接复制
        Copy-Item -Path $_.FullName -Destination "$tempDir\$($_.Name)"
    }
}

# 创建.gitignore文件
Write-Host "创建.gitignore文件..." -ForegroundColor Cyan
@"
# 依赖目录
node_modules/

# 环境变量文件
.env
.env.local
.env.development
.env.test
.env.production

# 日志文件
logs
*.log
npm-debug.log*

# 运行时数据
pids
*.pid
*.seed
*.pid.lock

# 测试覆盖率目录
coverage/

# 构建输出
build/
dist/

# 缓存目录
.cache/
.npm/

# IDE配置
.idea/
.vscode/
*.swp
*.swo

# 操作系统文件
.DS_Store
Thumbs.db
"@ | Out-File -FilePath "$tempDir\.gitignore" -Encoding utf8

# 创建示例环境变量文件
Write-Host "创建示例环境变量文件..." -ForegroundColor Cyan
if (Test-Path "$sourceDir\.env") {
    Get-Content "$sourceDir\.env" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $key = $matches[1]
            $value = "YOUR_$($key)_HERE"
            "$key=$value"
        } else {
            $_
        }
    } | Out-File -FilePath "$tempDir\.env.example" -Encoding utf8
}

# 创建README.md文件
Write-Host "创建README.md文件..." -ForegroundColor Cyan
@"
# NexusOrbital 新版网站

这是NexusOrbital平台的新版网站，包含完整的支付系统、会员管理、优惠券功能等。

## 功能特点

- 用户管理系统（注册、登录、个人资料）
- 会员等级管理
- 多支付方式集成（Stripe、微信支付）
- 优惠券系统（创建、验证、使用记录和分析）
- 内容管理
- 社区互动功能

## 安装与部署

1. 克隆仓库
   \`\`\`
   git clone https://github.com/Bai0925111/$repoName.git
   cd $repoName
   \`\`\`

2. 安装依赖
   \`\`\`
   npm install
   \`\`\`

3. 配置环境变量
   - 复制 \`.env.example\` 为 \`.env\`
   - 填入必要的API密钥和配置信息

4. 启动服务器
   \`\`\`
   node server/server.js
   \`\`\`

## 技术栈

- 前端：HTML5, CSS3, JavaScript, Bootstrap
- 后端：Node.js, Express
- 数据存储：JSON文件（可扩展为数据库）
- 支付集成：Stripe API, 微信支付API

## 目录结构

- \`/admin\` - 管理员界面
- \`/public\` - 公共资源和测试页面
- \`/server\` - 服务器端代码
  - \`/routes\` - API路由
  - \`/services\` - 业务逻辑服务
  - \`/payment-integrations\` - 支付集成
- \`/css\` - 样式文件
- \`/js\` - JavaScript文件
- \`/images\` - 图片资源

## 贡献指南

1. Fork 这个仓库
2. 创建您的特性分支 (\`git checkout -b feature/amazing-feature\`)
3. 提交您的更改 (\`git commit -m 'Add some amazing feature'\`)
4. 推送到分支 (\`git push origin feature/amazing-feature\`)
5. 打开一个 Pull Request

## 许可证

[MIT](https://opensource.org/licenses/MIT)
"@ | Out-File -FilePath "$tempDir\README.md" -Encoding utf8

# 初始化Git仓库
Write-Host "初始化Git仓库..." -ForegroundColor Cyan
Set-Location -Path $tempDir
& git init
& git add .
& git commit -m "初始提交：NexusOrbital新版网站"

# 输出后续步骤指南
Write-Host "`n部署准备完成！" -ForegroundColor Green
Write-Host "`n请按照以下步骤完成GitHub仓库创建和代码上传：" -ForegroundColor Yellow
Write-Host "1. 在GitHub上创建名为 $repoName 的新仓库" -ForegroundColor White
Write-Host "2. 不要初始化仓库（不选择添加README、.gitignore或许可证）" -ForegroundColor White
Write-Host "3. 创建仓库后，运行以下命令：" -ForegroundColor White
Write-Host "   cd $tempDir" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/Bai0925111/$repoName.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host "`n4. 完成后，您可以在GitHub上查看您的新仓库：https://github.com/Bai0925111/$repoName" -ForegroundColor White
Write-Host "`n如需启用GitHub Pages进行部署，请在仓库设置中配置Pages选项。" -ForegroundColor Yellow

# 返回原目录
Set-Location -Path $sourceDir
