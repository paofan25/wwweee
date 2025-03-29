import express, { Request, Response } from 'express';
import Post from '../models/Post';
import { auth, adminAuth } from '../middleware/auth';

const router = express.Router();

// 获取所有文章
router.get('/', async (req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username');
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取文章失败' });
  }
});

// 获取单个文章
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username');
    if (!post) {
      return res.status(404).json({ error: '文章不存在' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: '获取文章失败' });
  }
});

// 创建文章（需要登录）
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new Error('未授权');
    }

    const { title, content } = req.body;
    const post = new Post({
      title,
      content,
      author: req.user.userId
    });
    await post.save();
    res.status(201).json(post);
  } catch (error: any) {
    res.status(400).json({ error: error.message || '创建文章失败' });
  }
});

// 更新文章（需要是作者或管理员）
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new Error('未授权');
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: '文章不存在' });
    }

    if (post.author.toString() !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: '没有权限修改此文章' });
    }

    const { title, content } = req.body;
    Object.assign(post, { title, content });
    await post.save();
    res.json(post);
  } catch (error: any) {
    res.status(400).json({ error: error.message || '更新文章失败' });
  }
});

// 删除文章（需要是作者或管理员）
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: '文章不存在' });
    }

    if (post.author.toString() !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: '没有权限删除此文章' });
    }

    await post.deleteOne();
    res.json({ message: '文章已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除文章失败' });
  }
});

// 添加评论
router.post('/:id/comments', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: '文章不存在' });
    }

    const { content } = req.body;
    post.comments.push({
      content,
      author: req.user.userId,
      createdAt: new Date()
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: '添加评论失败' });
  }
});

export default router; 