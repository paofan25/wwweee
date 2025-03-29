#!/bin/bash

echo "=== 开始构建流程 ==="

# 确保关键目录存在
mkdir -p frontend/build
mkdir -p api

# 检查环境
echo "=== 检查环境 ==="
node -v
npm -v

# 安装主项目依赖
echo "=== 安装主项目依赖 ==="
npm install

# 安装API依赖
echo "=== 安装API依赖 ==="
if [ -f "api/package.json" ]; then
  echo "安装API服务器依赖..."
  cd api
  npm install
  cd ..
else
  echo "创建API依赖文件..."
  mkdir -p api
  cat > api/package.json << 'EOF'
{
  "name": "api-service-backend",
  "version": "1.0.0",
  "description": "API服务后端",
  "main": "server.js",
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "path": "^0.12.7"
  },
  "engines": {
    "node": ">=14.0.0"
  },
  "license": "MIT"
}
EOF
  cd api
  npm install
  cd ..
fi

# 创建基本server.js（如果不存在）
if [ ! -f "api/server.js" ]; then
  echo "创建服务器文件..."
  cat > api/server.js << 'EOF'
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API正常工作!',
    timestamp: new Date().toISOString() 
  });
});

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  });
});

// 提供静态文件
const staticPath = path.join(__dirname, '../frontend/build');
console.log('静态文件路径:', staticPath);
app.use(express.static(staticPath));

// 所有非API路由返回index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(staticPath, 'index.html'));
});

// 导出Express应用（用于Vercel）
module.exports = app;

// 本地开发用
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
}
EOF
fi

# 前端构建
echo "=== 前端构建 ==="
if [ -d "frontend/src" ]; then
  echo "检测到前端源代码，开始构建..."
  cd frontend 
  npm install
  npm run build
  cd ..
else
  echo "未检测到前端源代码，创建简单前端页面..."
  mkdir -p frontend/build
  cat > frontend/build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API服务调试界面</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
    }
    .container {
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
    h1 {
      color: #2c3e50;
      text-align: center;
    }
    .card {
      background: white;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .endpoint {
      background-color: #f0f8ff;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      margin: 5px 0;
    }
    button {
      background-color: #4CAF50;
      border: none;
      color: white;
      padding: 10px 15px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
      margin: 4px 2px;
      cursor: pointer;
      border-radius: 4px;
    }
    #result {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 4px;
      border-left: 4px solid #28a745;
      white-space: pre-wrap;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <h1>API服务正在运行</h1>
  
  <div class="container">
    <div class="card">
      <h2>API测试</h2>
      <p>测试API连接：</p>
      <button onclick="testAPI('/api/test')">测试API</button>
      <button onclick="testAPI('/api/health')">健康检查</button>
      <button onclick="testAPI('/api/files')">查看文件</button>
      <div id="result" style="display:none;"></div>
    </div>
  </div>

  <script>
    async function testAPI(endpoint) {
      const resultElement = document.getElementById('result');
      resultElement.style.display = 'block';
      resultElement.textContent = '请求中...';
      
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        resultElement.textContent = JSON.stringify(data, null, 2);
        resultElement.style.borderLeft = '4px solid #28a745';
      } catch (error) {
        resultElement.textContent = `错误: ${error.message}`;
        resultElement.style.borderLeft = '4px solid #dc3545';
      }
    }
  </script>
</body>
</html>
EOF
fi

# 确保vercel.json存在
if [ ! -f "vercel.json" ]; then
  echo "创建Vercel配置文件..."
  cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    { "src": "api/server.js", "use": "@vercel/node" },
    { "src": "frontend/build/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/server.js" },
    { "src": "/(.*\\.(js|css|png|jpg|jpeg|svg|ico))", "dest": "/frontend/build/$1" },
    { "src": "/(.*)", "dest": "/frontend/build/index.html" }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF
fi

# 显示文件内容
echo "=== 构建输出结构 ==="
ls -la
ls -la api
ls -la frontend/build

echo "=== 构建完成 ==="
echo "前端文件位置: $(pwd)/frontend/build"
echo "API文件位置: $(pwd)/api"

# 列出关键文件以确认
echo "=== 文件验证 ==="
if [ -f "frontend/build/index.html" ]; then
  echo "✅ 前端index.html文件存在"
else
  echo "❌ 前端index.html文件不存在"
fi

if [ -f "api/server.js" ]; then
  echo "✅ API server.js文件存在"
else
  echo "❌ API server.js文件不存在"
fi

if [ -f "vercel.json" ]; then
  echo "✅ vercel.json配置文件存在"
else
  echo "❌ vercel.json配置文件不存在"
fi

# 检查所有文件权限
echo "=== 检查文件权限 ==="
chmod -R 755 .

# 验证能否运行API
echo "=== 尝试启动API服务器 ==="
node -e "try { require('./api/server.js'); console.log('✅ API服务器加载成功'); } catch(e) { console.error('❌ API服务器加载失败', e); }"

echo "=== 构建脚本执行完成 ===" 