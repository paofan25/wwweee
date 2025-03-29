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

## 本地开发

1. 安装依赖
```bash
# 安装主项目依赖
npm install

# 安装前端依赖
cd frontend && npm install
```

2. 配置环境变量
   - 在`backend/.env`文件中配置MongoDB连接字符串和JWT密钥
   - 根据需要调整前端和后端的URL配置

3. 运行开发服务器
```bash
# 同时运行前端和后端
npm run dev

# 或者分别运行
npm run dev:backend
npm run dev:frontend
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