#!/bin/bash
echo "启动 QLinkNote..."

# 启动开发服务器
echo "1. 启动 Vite 开发服务器..."
npm run dev &

# 等待服务器启动
echo "2. 等待服务器启动..."
sleep 5

# 启动 Electron
echo "3. 启动 Electron 应用..."
npx electron .

echo "QLinkNote 已启动！"