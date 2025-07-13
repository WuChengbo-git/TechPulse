#!/bin/bash

# TechPulse 一键启动脚本
echo "🚀 Starting TechPulse..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

# 检查依赖
echo -e "${BLUE}📋 Checking dependencies...${NC}"
DEPS_OK=true

if ! check_command "poetry"; then
    echo -e "${YELLOW}⚠️  Poetry not found. Please install poetry first:${NC}"
    echo "curl -sSL https://install.python-poetry.org | python3 -"
    DEPS_OK=false
fi

if ! check_command "node"; then
    echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js first${NC}"
    DEPS_OK=false
fi

if ! check_command "npm"; then
    echo -e "${YELLOW}⚠️  npm not found. Please install npm first${NC}"
    DEPS_OK=false
fi

if [ "$DEPS_OK" = false ]; then
    echo -e "${RED}❌ Some dependencies are missing. Please install them first.${NC}"
    exit 1
fi

# 项目根目录
PROJECT_ROOT=$(pwd)

# 创建日志目录
mkdir -p logs

# 后端设置
echo -e "${BLUE}🔧 Setting up backend...${NC}"
cd backend

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found, creating from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}📝 Please edit backend/.env file with your API keys${NC}"
fi

# 安装后端依赖
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
poetry install

# 启动后端服务
echo -e "${GREEN}🚀 Starting backend server...${NC}"
poetry run python run.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

# 等待后端启动
echo -e "${BLUE}⏳ Waiting for backend to start...${NC}"
sleep 5

# 检查后端是否启动成功
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend started successfully at http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Backend failed to start. Check logs/backend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 前端设置
cd $PROJECT_ROOT/frontend
echo -e "${BLUE}🔧 Setting up frontend...${NC}"

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install
fi

# 启动前端服务
echo -e "${GREEN}🚀 Starting frontend server...${NC}"
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# 等待前端启动
echo -e "${BLUE}⏳ Waiting for frontend to start...${NC}"
sleep 8

# 检查前端是否启动成功
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Frontend started successfully at http://localhost:5173${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may still be starting. Check logs/frontend.log${NC}"
fi

# 输出服务信息
echo ""
echo -e "${GREEN}🎉 TechPulse is now running!${NC}"
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo -e "   Frontend:    ${GREEN}http://localhost:5173${NC}"
echo -e "   Backend:     ${GREEN}http://localhost:8000${NC}"
echo -e "   API Docs:    ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}📋 Process IDs:${NC}"
echo -e "   Backend PID: ${BACKEND_PID}"
echo -e "   Frontend PID: ${FRONTEND_PID}"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   Backend:  ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "   Frontend: ${YELLOW}tail -f logs/frontend.log${NC}"
echo ""
echo -e "${YELLOW}💡 To stop services, run: ${NC}./stop.sh"
echo ""

# 保存 PID 到文件
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

# 等待用户中断
echo -e "${BLUE}Press Ctrl+C to stop all services...${NC}"
trap 'echo -e "\n${YELLOW}🛑 Stopping services...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# 保持脚本运行
wait