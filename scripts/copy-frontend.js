const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 确保目标目录存在
const publicDir = path.join(__dirname, '../backend/dist/public');

try {
  // 先删除目标目录
  if (fs.existsSync(publicDir)) {
    if (process.platform === 'win32') {
      execSync(`rmdir /s /q "${publicDir}"`);
    } else {
      execSync(`rm -rf "${publicDir}"`);
    }
  }

  // 创建目标目录
  fs.mkdirSync(publicDir, { recursive: true });

  // 源目录
  const sourceDir = path.join(__dirname, '../frontend/dist');
  
  // 检查前端构建目录是否存在
  if (!fs.existsSync(sourceDir)) {
    console.error('前端构建目录不存在。请先运行 npm run build:frontend');
    process.exit(1);
  }

  // 复制文件
  if (process.platform === 'win32') {
    // Windows
    execSync(`xcopy /E /I /Y "${sourceDir}\\*" "${publicDir}"`);
  } else {
    // Linux/Mac
    execSync(`cp -r "${sourceDir}/"* "${publicDir}"`);
  }

  console.log('前端文件复制完成！');
} catch (error) {
  console.error('复制前端文件时出错:', error);
  process.exit(1);
} 