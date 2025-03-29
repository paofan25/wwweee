# 应用部署指南

## MongoDB配置

### 方法1：MongoDB Atlas（推荐）

1. 注册MongoDB Atlas账号：https://www.mongodb.com/cloud/atlas/register
2. 创建免费集群
   - 选择"Shared"（免费）计划
   - 选择云服务商和地区（建议选择离用户最近的地区）
   - 创建集群
3. 创建数据库用户
   - 在"Database Access"菜单中，点击"Add New Database User"
   - 创建用户名和密码（请使用复杂密码并记住它）
   - 选择"Read and write to any database"权限
4. 配置网络访问
   - 在"Network Access"菜单中，点击"Add IP Address"
   - 选择"Allow Access From Anywhere"（生产环境应限制IP）
5. 获取连接字符串
   - 在集群页面，点击"Connect"
   - 选择"Connect your application"
   - 复制提供的连接字符串
   - 将字符串中的`<password>`替换为你的实际密码
   - 将字符串中的`myFirstDatabase`替换为你的数据库名称（例如"appdb"）

### 方法2：自托管MongoDB

1. 安装MongoDB服务器
2. 创建数据库和用户
3. 配置安全访问

## 部署选项

### 方法1：Vercel部署（推荐）

1. 注册Vercel账户：https://vercel.com/signup
2. 安装Vercel CLI（可选）：`npm i -g vercel`
3. 在GitHub上创建仓库并推送代码
4. 从Vercel导入项目
   - 在Dashboard中点击"New Project"
   - 选择你的GitHub仓库
   - 配置项目设置
5. 配置环境变量
   - MONGODB_URI：你的MongoDB连接字符串
   - JWT_SECRET：生成一个强密钥（可使用`openssl rand -base64 32`命令）
   - NODE_ENV：production
6. 部署项目
   - Vercel会自动检测并部署你的项目

### 方法2：分离部署

#### 前端部署到Netlify

1. 注册Netlify账户：https://app.netlify.com/signup
2. 在GitHub上创建仓库并推送代码
3. 从Netlify导入项目
   - 点击"New site from Git"
   - 选择你的GitHub仓库
   - 配置构建设置：
     - 构建命令：`cd frontend && npm install && npm run build`
     - 发布目录：`frontend/build`
4. 配置环境变量
   - REACT_APP_API_URL：你的API地址

#### 后端部署到Railway

1. 注册Railway账户：https://railway.app
2. 创建新项目并选择GitHub仓库
3. 配置环境变量
   - MONGODB_URI：你的MongoDB连接字符串
   - JWT_SECRET：强密钥
   - CLIENT_URL：你的前端URL（用于CORS）
   - PORT：5001
   - NODE_ENV：production
4. 部署项目

### 方法3：云服务器部署

1. 在阿里云/腾讯云/AWS等购买服务器
2. 安装Node.js环境
3. 上传项目文件
4. 安装PM2进程管理器：`npm install -g pm2`
5. 启动应用：`pm2 start backend/dist/server.js`
6. 配置Nginx反向代理

## 自动化部署流程（CI/CD）

### GitHub Actions配置

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 注意事项

1. 数据库安全
   - 使用强密码
   - 限制IP访问
   - 定期备份数据

2. 应用安全
   - 使用HTTPS
   - 设置强JWT密钥
   - 保护敏感API路由

3. 性能优化
   - 配置缓存
   - 使用CDN
   - 添加监控 