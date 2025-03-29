"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
// 用户注册
const registerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('注册请求体:', req.body);
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码必填' });
        }
        // 检查用户名是否已存在
        const existingUser = yield User_1.default.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: '用户名已存在' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = new User_1.default({
            username,
            password: hashedPassword,
            wallet: 0, // 初始钱包金额
            avatar: '/avatars/default.png',
            activeSkin: 'default',
            purchasedSkins: ['default']
        });
        yield user.save();
        console.log('用户注册成功:', username);
        res.status(201).json({ message: '注册成功' });
    }
    catch (error) {
        console.error('注册错误:', error);
        res.status(400).json({ error: error.message || '注册失败' });
    }
});
// 用户登录
const loginHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('登录请求体:', req.body);
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码必填' });
        }
        const user = yield User_1.default.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: '用户不存在' });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: '密码错误' });
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user._id.toString(),
            isAdmin: user.isAdmin,
            username: user.username
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
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
    }
    catch (error) {
        console.error('登录错误:', error);
        res.status(400).json({ error: error.message || '登录失败' });
    }
});
// 获取当前用户信息
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '用户未认证' });
        }
        const user = yield User_1.default.findById(req.user.userId);
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
    }
    catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ error: error.message || '获取用户信息失败' });
    }
});
// 更新用户信息
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '用户未认证' });
        }
        const { avatar, activeSkin } = req.body;
        const updateFields = {};
        if (avatar)
            updateFields.avatar = avatar;
        if (activeSkin)
            updateFields.activeSkin = activeSkin;
        const user = yield User_1.default.findByIdAndUpdate(req.user.userId, { $set: updateFields }, { new: true });
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
    }
    catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({ error: error.message || '更新用户信息失败' });
    }
});
// 注销账户
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '用户未认证' });
        }
        yield User_1.default.findByIdAndDelete(req.user.userId);
        res.json({ message: '账户已成功注销' });
    }
    catch (error) {
        console.error('注销账户错误:', error);
        res.status(500).json({ error: error.message || '注销账户失败' });
    }
});
// 添加调试端点
router.get('/debug', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('调试端点被访问');
        // 基本信息
        const debug = {
            serverTime: new Date().toISOString(),
            headers: req.headers,
            requestPath: req.path,
            apiWorking: true
        };
        // 检查数据库连接
        try {
            const dbStatus = mongoose_1.default.connection.readyState;
            const dbStatusText = dbStatus === 0 ? '已断开' :
                dbStatus === 1 ? '已连接' :
                    dbStatus === 2 ? '正在连接' :
                        dbStatus === 3 ? '正在断开' : '未知状态';
            // 检查JWT密钥
            const jwtSecret = process.env.JWT_SECRET || 'default_value';
            const jwtSecretStatus = jwtSecret ? (jwtSecret === 'your-secret-key' ? '使用了默认值' : '已设置') : '未设置';
            // 尝试获取用户数量
            const userCount = yield User_1.default.countDocuments();
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
        }
        catch (dbError) {
            debug.databaseError = {
                message: dbError.message,
                stack: process.env.NODE_ENV === 'production' ? null : dbError.stack
            };
        }
        // 返回结果
        res.json(debug);
    }
    catch (error) {
        console.error('调试端点访问失败:', error);
        res.status(500).json({
            error: '调试信息获取失败',
            message: error.message,
            stack: process.env.NODE_ENV === 'production' ? null : error.stack
        });
    }
}));
router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.get('/me', auth_1.auth, getCurrentUser);
router.put('/me', auth_1.auth, updateUser);
router.delete('/me', auth_1.auth, deleteAccount);
exports.default = router;
