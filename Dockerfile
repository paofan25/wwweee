FROM node:18-alpine

WORKDIR /app

# 复制项目文件
COPY package*.json ./
COPY tsconfig.json ./
COPY backend ./backend
COPY frontend ./frontend

# 安装依赖并构建应用
RUN npm install
RUN cd frontend && npm install
RUN npm run build

# 暴露端口
EXPOSE 5001

# 启动应用
CMD ["npm", "start"] 