#!/bin/bash

# 确保前端构建目录存在
mkdir -p frontend/build

# 如果是在本地测试，可以尝试构建前端
if [ -d "frontend/src" ]; then
  echo "检测到前端源代码，尝试构建..."
  cd frontend && npm install && npm run build
  cd ..
else
  echo "未检测到前端源代码，仅使用API部分"
  
  # 创建简单的前端页面
  echo '<html><body><h1>API服务器正在运行</h1><p>请访问 <a href="/api/test">/api/test</a> 测试API</p></body></html>' > frontend/build/index.html
fi

# 确保api目录正确设置
if [ ! -d "api" ]; then
  echo "创建API目录..."
  mkdir -p api
  
  # 如果server.js不存在，创建一个简单的API服务
  if [ ! -f "api/server.js" ]; then
    echo "创建基本API服务..."
    cat > api/server.js << 'EOF'
const express = require('express');
const app = express();

app.get('/api/test', (req, res) => {
  res.json({ message: 'API正常工作!' });
});

app.get('*', (req, res) => {
  res.sendFile('index.html', { root: '../frontend/build' });
});

module.exports = app;
EOF
  fi
fi

echo "构建完成!" 