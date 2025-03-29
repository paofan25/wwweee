import mongoose from 'mongoose';
import { IUser } from './User';

interface IComment {
  content: string;
  author: string;
  createdAt: Date;
}

export interface IPost {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId | IUser;
  comments: IComment[];
  createdAt: Date;
}

const postSchema = new mongoose.Schema<IPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [{
    content: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPost>('Post', postSchema); 