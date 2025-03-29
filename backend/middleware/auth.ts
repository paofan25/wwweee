import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// 获取JWT密钥，使用环境变量或备用密钥
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('JWT_SECRET环境变量未设置，使用备用密钥');
    return 'Wt0RnYoFJTev6UQy'; // 备用密钥，仅用于开发环境
  }
  return secret;
};

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('未提供认证令牌');
    }

    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({ error: error.message || '请先登录' });
  }
};

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('未提供认证令牌');
    }

    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    if (!decoded.isAdmin) {
      throw new Error('需要管理员权限');
    }
    
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(403).json({ error: error.message || '权限不足' });
  }
}; 