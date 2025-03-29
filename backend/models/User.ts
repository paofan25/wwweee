import mongoose from 'mongoose';

export interface IUser {
  username: string;
  password: string;
  isAdmin: boolean;
  createdAt: Date;
  wallet: number;
  avatar: string;
  activeSkin: string;
  purchasedSkins: string[];
}

const userSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  wallet: {
    type: Number,
    default: 0 // 普通用户初始钱包为0
  },
  avatar: {
    type: String,
    default: '/avatars/default.png'
  },
  activeSkin: {
    type: String,
    default: 'default'
  },
  purchasedSkins: {
    type: [String],
    default: ['default']
  }
});

export default mongoose.model<IUser>('User', userSchema); 