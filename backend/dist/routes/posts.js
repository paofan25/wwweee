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
const Post_1 = __importDefault(require("../models/Post"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 获取所有文章
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield Post_1.default.find()
            .sort({ createdAt: -1 })
            .populate('author', 'username');
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ error: error.message || '获取文章失败' });
    }
}));
// 获取单个文章
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const post = yield Post_1.default.findById(req.params.id)
            .populate('author', 'username');
        if (!post) {
            return res.status(404).json({ error: '文章不存在' });
        }
        res.json(post);
    }
    catch (error) {
        res.status(500).json({ error: '获取文章失败' });
    }
}));
// 创建文章（需要登录）
router.post('/', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new Error('未授权');
        }
        const { title, content } = req.body;
        const post = new Post_1.default({
            title,
            content,
            author: req.user.userId
        });
        yield post.save();
        res.status(201).json(post);
    }
    catch (error) {
        res.status(400).json({ error: error.message || '创建文章失败' });
    }
}));
// 更新文章（需要是作者或管理员）
router.put('/:id', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            throw new Error('未授权');
        }
        const post = yield Post_1.default.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: '文章不存在' });
        }
        if (post.author.toString() !== req.user.userId && !req.user.isAdmin) {
            return res.status(403).json({ error: '没有权限修改此文章' });
        }
        const { title, content } = req.body;
        Object.assign(post, { title, content });
        yield post.save();
        res.json(post);
    }
    catch (error) {
        res.status(400).json({ error: error.message || '更新文章失败' });
    }
}));
// 删除文章（需要是作者或管理员）
router.delete('/:id', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未授权' });
        }
        const post = yield Post_1.default.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: '文章不存在' });
        }
        if (post.author.toString() !== req.user.userId && !req.user.isAdmin) {
            return res.status(403).json({ error: '没有权限删除此文章' });
        }
        yield post.deleteOne();
        res.json({ message: '文章已删除' });
    }
    catch (error) {
        res.status(500).json({ error: '删除文章失败' });
    }
}));
// 添加评论
router.post('/:id/comments', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未授权' });
        }
        const post = yield Post_1.default.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: '文章不存在' });
        }
        const { content } = req.body;
        post.comments.push({
            content,
            author: req.user.userId,
            createdAt: new Date()
        });
        yield post.save();
        res.status(201).json(post);
    }
    catch (error) {
        res.status(400).json({ error: '添加评论失败' });
    }
}));
exports.default = router;
