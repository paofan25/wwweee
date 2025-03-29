import * as dotenv from 'dotenv';
import path from 'path';

// 尝试多种方式加载环境变量
try {
  // 先尝试从当前目录加载
  const result = dotenv.config();
  
  // 如果没找到文件，尝试指定路径
  if (result.error) {
    // 尝试从backend目录加载
    const envPath = path.resolve(process.cwd(), 'backend', '.env');
    console.log('尝试从路径加载环境变量:', envPath);
    dotenv.config({ path: envPath });
  }
  
  // 检查关键环境变量是否设置
  if (!process.env.MONGODB_URI) {
    console.log('警告: MONGODB_URI环境变量未通过.env文件设置，检查环境变量或Vercel配置');
  } else {
    console.log('环境变量MONGODB_URI已正确加载');
  }
} catch (error) {
  console.error('加载环境变量时出错:', error);
}

import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import User from './models/User';
import bcrypt from 'bcryptjs';

const app: Express = express();

// 配置CORS - 允许前端站点访问
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000', 
  'https://funarcade.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // 允许没有来源的请求（如Postman测试）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      console.log('CORS阻止了来自此源的请求:', origin);
      callback(new Error('不允许的来源'));
    }
  },
  credentials: true
}));

// 添加一个测试路由，确认API是否正常工作
app.get('/api/test', (req, res) => {
  res.json({ message: 'API正常工作!' });
});

// 解析JSON请求
app.use(express.json());

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// 数据库连接
const connectDB = async () => {
  try {
    // 使用MongoDB数据库
    let uri = process.env.MONGODB_URI;
    
    // 如果环境变量未设置，使用硬编码备用URI（仅用于开发）
    if (!uri) {
      console.warn('环境变量中未找到MONGODB_URI，使用硬编码备用URI');
      uri = 'mongodb+srv://alivecn2:Wt0RnYoFJTev6UQy@cluster0.8mvnk04.mongodb.net/appdb?retryWrites=true&w=majority';
    }
    
    console.log('正在连接MongoDB... URI:', uri.substring(0, 20) + '...');
    
    // 设置更多连接选项
    const options = {
      serverSelectionTimeoutMS: 10000, // 增加超时
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(uri);
    console.log('MongoDB数据库连接成功');
    console.log('MongoDB连接状态:', mongoose.connection.readyState);

    // 创建默认管理员账户
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        isAdmin: true,
        wallet: 10000,
        avatar: '/avatars/avatar1.jpg',
        activeSkin: 'default',
        purchasedSkins: ['default']
      });
      console.log('默认管理员用户已创建，用户名: admin，密码: admin123');
    } else {
      console.log('管理员用户已存在，无需创建');
    }
  } catch (error) {
    console.error('数据库连接失败，详细错误:', error);
    // 不要在这里结束进程，以便应用能继续运行
    console.error('应用将继续运行，但数据库功能将无法使用');
  }
};

// 启动数据库连接
connectDB();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 添加错误处理
server.on('error', (error: any) => {
  console.error('服务器错误:', error);
});

// 处理未捕获的Promise异常
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// 确定正确的静态文件路径
let publicPath: string;

// 生产环境下
if (process.env.NODE_ENV === 'production') {
  // Vercel环境
  if (process.env.VERCEL) {
    publicPath = path.join(__dirname, '..', '..', 'frontend', 'build');
  } else {
    // 普通生产环境
    publicPath = path.join(__dirname, 'public');
  }
} else {
  // 开发环境
  publicPath = path.join(__dirname, '..', 'public');
}

console.log('静态文件路径:', publicPath);

// 在其他中间件之后添加
app.use(express.static(publicPath));

// 添加路由重定向到前端
app.get('*', (req, res) => {
  // 对API请求不进行重定向
  if (req.url.startsWith('/api')) return;
  res.sendFile(path.join(publicPath, 'index.html'));
}); 