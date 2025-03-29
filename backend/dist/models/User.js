"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
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
exports.default = mongoose_1.default.model('User', userSchema);
