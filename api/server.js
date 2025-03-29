// api/server.js - Vercel Serverless Function
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

// 初始化Express应用
const app = express();

// 中间件
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// 连接MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('未设置MONGODB_URI环境变量');
      return;
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
};

connectDB();

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
    timestamp: new Date().toISOString()
  });
});

// 用户模型
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  wallet: { type: Number, default: 0 },
  avatar: { type: String, default: '/avatars/default.png' },
  activeSkin: { type: String, default: 'default' },
  purchasedSkins: { type: [String], default: ['default'] }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// 创建默认管理员账户
const createAdminUser = async () => {
  try {
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
      console.log('默认管理员用户已创建');
    }
  } catch (error) {
    console.error('创建管理员账户失败:', error);
  }
};

createAdminUser();

// 认证中间件
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Wt0RnYoFJTev6UQy');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '请先登录' });
  }
};

// 用户路由
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码必填' });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      username,
      password: hashedPassword,
      wallet: 0,
      avatar: '/avatars/default.png',
      activeSkin: 'default',
      purchasedSkins: ['default']
    });
    
    await user.save();
    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(400).json({ error: error.message || '注册失败' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码必填' });
    }
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(400).json({ error: '用户不存在' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: '密码错误' });
    }
    
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        isAdmin: user.isAdmin,
        username: user.username 
      },
      process.env.JWT_SECRET || 'Wt0RnYoFJTev6UQy',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      user: {
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        wallet: user.wallet,
        avatar: user.avatar,
        activeSkin: user.activeSkin,
        purchasedSkins: user.purchasedSkins
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(400).json({ error: error.message || '登录失败' });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      wallet: user.wallet,
      avatar: user.avatar,
      activeSkin: user.activeSkin,
      purchasedSkins: user.purchasedSkins
    });
  } catch (error) {
    res.status(500).json({ error: error.message || '获取用户信息失败' });
  }
});

app.get('/api/auth/debug', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = dbStatus === 0 ? '已断开' :
                        dbStatus === 1 ? '已连接' :
                        dbStatus === 2 ? '正在连接' :
                        dbStatus === 3 ? '正在断开' : '未知状态';
    
    res.json({
      serverTime: new Date().toISOString(),
      databaseStatus: {
        connectionState: dbStatus,
        connectionStateText: dbStatusText,
        usersCount: await User.countDocuments()
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || '未设置',
        mongoDbUri: process.env.MONGODB_URI ? '已设置' : '未设置',
        jwtSecret: process.env.JWT_SECRET ? '已设置' : '未设置'
      }
    });
  } catch (error) {
    res.status(500).json({ error: '调试信息获取失败', message: error.message });
  }
});

// 添加前端路由支持
if (process.env.NODE_ENV === 'production') {
  // 提供前端静态文件
  const frontendPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(frontendPath));
  
  // 处理所有非API路由请求，返回前端页面
  app.get('*', (req, res, next) => {
    // 如果是API请求，跳过处理
    if (req.url.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

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
  res.status(404).json({
    status: 'error',
    message: `找不到请求的路径: ${req.path}`
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

// 导出Express应用以便Vercel部署
module.exports = app; 