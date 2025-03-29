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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const posts_1 = __importDefault(require("./routes/posts"));
const User_1 = __importDefault(require("./models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const path_1 = __importDefault(require("path"));
// 先加载环境变量
dotenv_1.default.config();
const app = (0, express_1.default)();
// 配置CORS - 允许前端站点访问
const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'https://funarcade.vercel.app'
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // 允许没有来源的请求（如Postman测试）
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost')) {
            callback(null, true);
        }
        else {
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
app.use(express_1.default.json());
// 注册路由
app.use('/api/auth', auth_1.default);
app.use('/api/posts', posts_1.default);
// 数据库连接
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 使用MongoDB数据库
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('未设置MONGODB_URI环境变量');
            process.exit(1);
        }
        console.log('正在连接MongoDB... URI:', uri.substring(0, 20) + '...');
        // 设置更多连接选项
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };
        yield mongoose_1.default.connect(uri);
        console.log('MongoDB数据库连接成功');
        console.log('MongoDB连接状态:', mongoose_1.default.connection.readyState);
        // 创建默认管理员账户
        const adminExists = yield User_1.default.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = yield bcryptjs_1.default.hash('admin123', 10);
            yield User_1.default.create({
                username: 'admin',
                password: hashedPassword,
                isAdmin: true,
                wallet: 10000,
                avatar: '/avatars/avatar1.jpg',
                activeSkin: 'default',
                purchasedSkins: ['default']
            });
            console.log('默认管理员用户已创建，用户名: admin，密码: admin123');
        }
        else {
            console.log('管理员用户已存在，无需创建');
        }
    }
    catch (error) {
        console.error('数据库连接失败，详细错误:', error);
        process.exit(1);
    }
});
// 启动数据库连接
connectDB();
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
// 添加错误处理
server.on('error', (error) => {
    console.error('服务器错误:', error);
});
// 处理未捕获的Promise异常
process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});
// 确定正确的静态文件路径
let publicPath;
// 生产环境下
if (process.env.NODE_ENV === 'production') {
    // Vercel环境
    if (process.env.VERCEL) {
        publicPath = path_1.default.join(__dirname, '..', '..', 'frontend', 'build');
    }
    else {
        // 普通生产环境
        publicPath = path_1.default.join(__dirname, 'public');
    }
}
else {
    // 开发环境
    publicPath = path_1.default.join(__dirname, '..', 'public');
}
console.log('静态文件路径:', publicPath);
// 在其他中间件之后添加
app.use(express_1.default.static(publicPath));
// 添加路由重定向到前端
app.get('*', (req, res) => {
    // 对API请求不进行重定向
    if (req.url.startsWith('/api'))
        return;
    res.sendFile(path_1.default.join(publicPath, 'index.html'));
});
