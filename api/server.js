// api/server.js - Vercel Serverless Function
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

// 初始化Express应用
const app = express();

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 中间件
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// 调试路由 - 显示请求信息
app.get('/api/debug-request', (req, res) => {
  res.json({
    method: req.method,
    url: req.url,
    path: req.path,
    params: req.params,
    query: req.query,
    headers: req.headers,
    serverTime: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV || '未设置',
    nodeEnv: process.env.NODE_ENV || '未设置'
  });
});

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API服务正常运行!',
    timestamp: new Date().toISOString()
  });
});

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// 查看当前目录文件结构
app.get('/api/files', (req, res) => {
  const fs = require('fs');
  const currentDir = __dirname;
  const rootDir = path.resolve(__dirname, '..');
  
  try {
    const currentDirFiles = fs.readdirSync(currentDir);
    let rootDirFiles = [];
    let frontendDir = [];
    
    try {
      rootDirFiles = fs.readdirSync(rootDir);
    } catch (e) {
      console.error('无法读取根目录:', e);
    }
    
    try {
      const frontendPath = path.resolve(rootDir, 'frontend', 'build');
      if (fs.existsSync(frontendPath)) {
        frontendDir = fs.readdirSync(frontendPath);
      }
    } catch (e) {
      console.error('无法读取前端目录:', e);
    }
    
    res.json({
      currentDirectory: currentDir,
      rootDirectory: rootDir,
      apiDirFiles: currentDirFiles,
      rootDirFiles: rootDirFiles,
      frontendBuildFiles: frontendDir,
      serverFile: __filename
    });
  } catch (error) {
    res.status(500).json({
      error: '无法读取文件系统',
      message: error.message
    });
  }
});

// 静态文件目录
let frontendPath;

try {
  // 尝试多种可能的前端路径
  const possiblePaths = [
    path.resolve(__dirname, '../frontend/build'),
    path.resolve(__dirname, '../dist'),
    path.resolve(__dirname, '../public'),
    path.resolve(__dirname, '../../frontend/build')
  ];
  
  for (const testPath of possiblePaths) {
    if (require('fs').existsSync(testPath)) {
      frontendPath = testPath;
      console.log(`找到静态文件目录: ${frontendPath}`);
      break;
    }
  }
  
  if (!frontendPath) {
    console.log('警告: 未找到静态文件目录，将尝试使用默认路径');
    frontendPath = path.resolve(__dirname, '../frontend/build');
  }
} catch (error) {
  console.error('确定静态文件路径时出错:', error);
  frontendPath = path.resolve(__dirname, '../frontend/build');
}

// 提供静态文件
console.log(`正在提供静态文件，路径: ${frontendPath}`);
app.use(express.static(frontendPath));

// 提供API路由
console.log('正在注册API路由...');

// 所有非API路由返回index.html
app.get('*', (req, res, next) => {
  // 跳过API请求
  if (req.path.startsWith('/api/')) {
    return next();
  }
  console.log(`返回前端页面，请求路径: ${req.path}`);
  
  const indexPath = path.join(frontendPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`错误: 找不到index.html文件: ${indexPath}`);
    res.status(404).send(`找不到前端页面文件: ${indexPath}`);
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// 处理404错误
app.use((req, res) => {
  console.log(`404 - 找不到路径: ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: `找不到请求的路径: ${req.originalUrl}`
  });
});

// 使用端口变量以便本地和生产环境都能运行
const PORT = process.env.PORT || 3000;

// 本地开发环境下直接启动服务器
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`API服务器运行在 http://localhost:${PORT}`);
    console.log('环境:', process.env.NODE_ENV || 'development');
  });
}

// 记录启动信息
console.log('服务器初始化完成，等待请求...');
console.log('Node环境:', process.env.NODE_ENV);
console.log('Vercel环境:', process.env.VERCEL_ENV || '未设置');

// 导出Express应用以便Vercel部署
module.exports = app; 