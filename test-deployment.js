#!/usr/bin/env node

const https = require('https');
const chalk = require('chalk');

// 如果没有安装chalk，将使用简单的控制台输出
let log = {
  info: (msg) => console.log(`ℹ️ ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️ ${msg}`)
};

try {
  const chalkModule = require('chalk');
  log = {
    info: (msg) => console.log(chalk.blue(`ℹ️ ${msg}`)),
    success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
    error: (msg) => console.log(chalk.red(`❌ ${msg}`)),
    warn: (msg) => console.log(chalk.yellow(`⚠️ ${msg}`))
  };
} catch (e) {
  console.log('提示: 安装chalk包可以获得彩色输出 (npm install chalk)');
}

// 部署URL
const baseUrl = process.argv[2] || 'https://your-vercel-deployment-url.vercel.app';

log.info(`开始测试部署: ${baseUrl}`);

// 测试路径
const testPaths = [
  { path: '/', name: '前端首页' },
  { path: '/api/test', name: 'API测试端点' }
];

// 计数器
let succeeded = 0;
let failed = 0;

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    log.info(`测试中: ${endpoint.name} (${endpoint.path})`);
    
    const url = `${baseUrl}${endpoint.path}`;
    const startTime = Date.now();
    
    https.get(url, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          succeeded++;
          log.success(`${endpoint.name}: 成功 (HTTP ${res.statusCode}, ${duration}ms)`);
          
          if (endpoint.path.startsWith('/api/')) {
            try {
              const jsonData = JSON.parse(data);
              log.info(`响应数据: ${JSON.stringify(jsonData).substring(0, 100)}${JSON.stringify(jsonData).length > 100 ? '...' : ''}`);
            } catch (e) {
              log.warn(`无法解析JSON响应: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`);
            }
          }
        } else {
          failed++;
          log.error(`${endpoint.name}: 失败 (HTTP ${res.statusCode}, ${duration}ms)`);
          log.info(`响应内容: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        }
        resolve();
      });
    }).on('error', (err) => {
      failed++;
      log.error(`${endpoint.name}: 错误 - ${err.message}`);
      resolve();
    });
  });
}

async function runTests() {
  for (const endpoint of testPaths) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n----- 测试结果摘要 -----');
  log.info(`总计: ${testPaths.length} 个端点`);
  log.success(`成功: ${succeeded} 个端点`);
  
  if (failed > 0) {
    log.error(`失败: ${failed} 个端点`);
    process.exit(1);
  } else {
    log.success('所有测试通过！');
  }
}

if (baseUrl === 'https://your-vercel-deployment-url.vercel.app') {
  log.warn('请提供正确的部署URL作为参数');
  log.info('使用方法: node test-deployment.js https://your-app-name.vercel.app');
  process.exit(1);
}

runTests(); 