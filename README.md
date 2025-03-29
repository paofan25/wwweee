# 博客系统 + 游戏中心

一个集博客、游戏和商城功能于一体的全栈应用。

## 功能特点

- 用户认证系统（注册、登录、个人中心）
- 博客系统（发布、编辑、删除文章和评论）
- 游戏中心（多款小游戏）
- 商城系统（皮肤、头像和游戏道具）
- 虚拟货币系统

## 技术栈

### 前端
- React 18
- TypeScript
- React Router v6
- Material UI
- Axios

### 后端
- Node.js
- Express
- TypeScript
- MongoDB / MongoDB Atlas
- JWT认证

## 应用部署指南

# API服务部署指南

这个项目包含一个简单的API服务和一个基本的前端界面，可以轻松部署到Vercel平台。

## 项目结构

```
/
├── api/              # API服务器代码
│   └── server.js     # Express服务器主文件
├── frontend/         # 前端应用
│   └── build/        # 前端构建输出目录
│       └── index.html # 基本前端页面
├── build.sh          # 构建脚本
├── package.json      # 项目依赖和脚本
├── vercel.json       # Vercel部署配置
└── test-deployment.js # 部署测试脚本
```

## 部署步骤

### 1. 准备工作

确保你已经：

- 安装了Node.js (v14或更高版本)
- 安装了Vercel CLI: `npm install -g vercel`
- 登录到Vercel账户: `vercel login`

### 2. 安装依赖

```bash
# 安装主项目依赖
npm install

# 安装API服务器依赖
cd api
npm install
cd ..
```

### 3. 本地测试

```bash
# 运行构建脚本
bash build.sh

# 启动本地开发服务器
npm run dev
```

访问 `http://localhost:3000` 查看API服务

### 4. 部署到Vercel

```bash
# 方法1: 使用部署脚本
npm run deploy

# 方法2: 手动部署
vercel --prod
```

## 验证部署

部署完成后，你可以使用测试脚本验证部署是否成功：

```bash
node test-deployment.js https://your-vercel-app-url.vercel.app
```

## API文档

### 测试端点

- `GET /api/test` - 返回API状态信息
  - 响应: `{ "status": "success", "message": "API服务正常运行!", "timestamp": "..." }`

### 健康检查

- `GET /api/health` - 返回服务健康状态
  - 响应: `{ "status": "ok", "uptime": "...", "timestamp": "..." }`

## 故障排除

如果部署出现问题，请检查：

1. `vercel.json` 文件是否正确配置
2. API服务器(`api/server.js`)是否使用了正确的导出格式
3. 前端构建(`frontend/build/index.html`)是否存在
4. 查看Vercel仪表板中的构建日志和部署日志

## 本地开发

```bash
# 启动API服务器
cd api
npm run dev

# 在另一个终端启动前端开发服务器(如果有)
cd frontend
npm run dev
```

## 生产环境部署

### 方法1: 传统部署

1. 构建应用
```bash
npm run build
```

2. 启动服务
```bash
npm start
```

### 方法2: Docker部署

1. 构建Docker镜像
```bash
docker build -t your-app-name .
```

2. 运行Docker容器
```bash
docker run -p 5001:5001 --env-file backend/.env your-app-name
```

## MongoDB数据库设置

1. 创建MongoDB数据库(推荐MongoDB Atlas)
2. 更新`backend/.env`文件中的`MONGODB_URI`为实际连接字符串
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

## 注意事项

- 生产环境部署前，请确保:
  - 更改默认管理员密码
  - 使用强JWT密钥
  - 配置正确的前端URL(CLIENT_URL)
  - 设置安全的数据库凭据 