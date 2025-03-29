#!/bin/bash

echo "=== 开始构建流程 ==="

# 确保关键目录存在
mkdir -p frontend/build
mkdir -p api

# 检查环境
echo "=== 检查环境 ==="
node -v
npm -v

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
  cat > frontend/build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API服务</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .container { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
    .endpoint { background-color: #eee; padding: 5px; margin: 5px 0; font-family: monospace; }
    button { background-color: #4CAF50; color: white; border: none; padding: 10px; cursor: pointer; }
    #result { margin-top: 20px; padding: 10px; background-color: #f0f0f0; display: none; }
  </style>
</head>
<body>
  <h1>API服务正在运行</h1>
  <div class="container">
    <p>测试API连接：</p>
    <button onclick="testAPI()">测试API</button>
    <div id="result"></div>
  </div>
  <script>
    async function testAPI() {
      try {
        const response = await fetch('/api/test');
        const data = await response.json();
        document.getElementById('result').style.display = 'block';
        document.getElementById('result').textContent = JSON.stringify(data);
      } catch (error) {
        document.getElementById('result').style.display = 'block';
        document.getElementById('result').textContent = '错误: ' + error.message;
      }
    }
  </script>
</body>
</html>
EOF
fi

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

echo "=== 构建脚本执行完成 ===" 