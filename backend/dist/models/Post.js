"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const postSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [{
            content: { type: String, required: true },
            author: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }],
    createdAt: { type: Date, default: Date.now }
});
exports.default = mongoose_1.default.model('Post', postSchema);
