import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { auth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// 用户注册
const registerHandler: express.RequestHandler = async (req, res) => {
  try {
    console.log('注册请求体:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码必填' });
    }
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      username,
      password: hashedPassword,
      wallet: 0, // 初始钱包金额
      avatar: '/avatars/default.png',
      activeSkin: 'default',
      purchasedSkins: ['default']
    });
    
    await user.save();
    console.log('用户注册成功:', username);
    res.status(201).json({ message: '注册成功' });
  } catch (error: any) {
    console.error('注册错误:', error);
    res.status(400).json({ error: error.message || '注册失败' });
  }
};

// 用户登录
const loginHandler: express.RequestHandler = async (req, res) => {
  try {
    console.log('登录请求体:', req.body);
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
    
    // 获取JWT密钥，与中间件保持一致
    const jwtSecret = process.env.JWT_SECRET || 'Wt0RnYoFJTev6UQy';
    
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        isAdmin: user.isAdmin,
        username: user.username 
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    console.log('用户登录成功:', username);
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
  } catch (error: any) {
    console.error('登录错误:', error);
    res.status(400).json({ error: error.message || '登录失败' });
  }
};

// 获取当前用户信息
const getCurrentUser: express.RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '用户未认证' });
    }

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
  } catch (error: any) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: error.message || '获取用户信息失败' });
  }
};

// 更新用户信息
const updateUser: express.RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const { avatar, activeSkin } = req.body;
    const updateFields: any = {};

    if (avatar) updateFields.avatar = avatar;
    if (activeSkin) updateFields.activeSkin = activeSkin;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateFields },
      { new: true }
    );

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
  } catch (error: any) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: error.message || '更新用户信息失败' });
  }
};

// 注销账户
const deleteAccount: express.RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '用户未认证' });
    }

    await User.findByIdAndDelete(req.user.userId);
    res.json({ message: '账户已成功注销' });
  } catch (error: any) {
    console.error('注销账户错误:', error);
    res.status(500).json({ error: error.message || '注销账户失败' });
  }
};

// 添加调试端点
router.get('/debug', async (req, res) => {
  try {
    console.log('调试端点被访问');
    
    // 基本信息
    const debug: any = {
      serverTime: new Date().toISOString(),
      headers: req.headers,
      requestPath: req.path,
      apiWorking: true
    };
    
    // 检查数据库连接
    try {
      const dbStatus = mongoose.connection.readyState;
      const dbStatusText = dbStatus === 0 ? '已断开' :
                         dbStatus === 1 ? '已连接' :
                         dbStatus === 2 ? '正在连接' :
                         dbStatus === 3 ? '正在断开' : '未知状态';
      
      // 检查JWT密钥
      const jwtSecret = process.env.JWT_SECRET || 'default_value';
      const jwtSecretStatus = jwtSecret ? (jwtSecret === 'your-secret-key' ? '使用了默认值' : '已设置') : '未设置';
      
      // 尝试获取用户数量
      const userCount = await User.countDocuments();
      
      debug.databaseStatus = {
        connectionState: dbStatus,
        connectionStateText: dbStatusText,
        usersCount: userCount
      };
      
      debug.environment = {
        nodeEnv: process.env.NODE_ENV || '未设置',
        jwtSecretStatus: jwtSecretStatus,
        mongoDbUri: process.env.MONGODB_URI ? '已设置' : '未设置',
        clientUrl: process.env.CLIENT_URL || '未设置'
      };
    } catch (dbError: any) {
      debug.databaseError = {
        message: dbError.message,
        stack: process.env.NODE_ENV === 'production' ? null : dbError.stack
      };
    }
    
    // 返回结果
    res.json(debug);
  } catch (error: any) {
    console.error('调试端点访问失败:', error);
    res.status(500).json({ 
      error: '调试信息获取失败', 
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.get('/me', auth, getCurrentUser);
router.put('/me', auth, updateUser);
router.delete('/me', auth, deleteAccount);

export default router; 