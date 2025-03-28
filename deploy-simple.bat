@echo off
echo NexusOrbital新版网站部署脚本
echo ===========================

REM 设置变量
set REPO_NAME=nexusorbital-new
set SOURCE_DIR=C:\Users\Administrator\CascadeProjects\NexusOrbital
set TEMP_DIR=C:\Users\Administrator\CascadeProjects\temp-deploy

REM 创建临时目录
echo 创建临时部署目录...
if exist %TEMP_DIR% rmdir /s /q %TEMP_DIR%
mkdir %TEMP_DIR%

REM 复制文件到临时目录
echo 复制文件到临时目录...
xcopy %SOURCE_DIR%\*.* %TEMP_DIR%\ /E /H /C /I /Y /EXCLUDE:%SOURCE_DIR%\exclude.txt

REM 创建README.md文件
echo 创建README.md文件...
echo # NexusOrbital 新版网站 > %TEMP_DIR%\README.md
echo. >> %TEMP_DIR%\README.md
echo 这是NexusOrbital平台的新版网站，包含完整的支付系统、会员管理、优惠券功能等。 >> %TEMP_DIR%\README.md
echo. >> %TEMP_DIR%\README.md
echo ## 功能特点 >> %TEMP_DIR%\README.md
echo. >> %TEMP_DIR%\README.md
echo - 用户管理系统（注册、登录、个人资料） >> %TEMP_DIR%\README.md
echo - 会员等级管理 >> %TEMP_DIR%\README.md
echo - 多支付方式集成（Stripe、微信支付） >> %TEMP_DIR%\README.md
echo - 优惠券系统（创建、验证、使用记录和分析） >> %TEMP_DIR%\README.md
echo - 内容管理 >> %TEMP_DIR%\README.md
echo - 社区互动功能 >> %TEMP_DIR%\README.md

REM 初始化Git仓库
echo 初始化Git仓库...
cd %TEMP_DIR%
git init
git add .
git commit -m "初始提交：NexusOrbital新版网站"

echo.
echo 部署准备完成！
echo.
echo 请按照以下步骤完成GitHub仓库创建和代码上传：
echo 1. 在GitHub上创建名为 %REPO_NAME% 的新仓库
echo 2. 不要初始化仓库（不选择添加README、.gitignore或许可证）
echo 3. 创建仓库后，运行以下命令：
echo    cd %TEMP_DIR%
echo    git remote add origin https://github.com/Bai0925111/%REPO_NAME%.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 4. 完成后，您可以在GitHub上查看您的新仓库：https://github.com/Bai0925111/%REPO_NAME%
echo.
echo 如需启用GitHub Pages进行部署，请在仓库设置中配置Pages选项。

REM 返回原目录
cd %SOURCE_DIR%
pause
