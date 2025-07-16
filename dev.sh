#!/bin/bash

# TechPulse 开发模式启动脚本
echo "🛠️  Starting TechPulse in development mode..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查依赖
check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

# 快速依赖检查
if ! check_command "poetry" || ! check_command "node"; then
    echo -e "${RED}❌ Missing dependencies. Please run ./start.sh for full setup.${NC}"
    exit 1
fi

PROJECT_ROOT=$(pwd)
mkdir -p logs

# 检查 .env 文件
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Creating .env file from template...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}📝 Please edit backend/.env with your API keys${NC}"
fi

# 启动后端
echo -e "${BLUE}🚀 Starting backend in development mode...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo -e "${BLUE}Creating virtual environment...${NC}"
    python -m venv venv
    source venv/bin/activate
    pip install fastapi uvicorn sqlalchemy alembic pydantic pydantic-settings requests feedparser notion-client openai python-multipart python-jose python-dotenv httpx
else
    source venv/bin/activate
fi
python run.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# 启动前端
cd $PROJECT_ROOT/frontend
echo -e "${BLUE}🚀 Starting frontend in development mode...${NC}"
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# 保存 PID
echo $BACKEND_PID > ../logs/backend.pid
echo $FRONTEND_PID > ../logs/frontend.pid

echo ""
echo -e "${GREEN}🎉 Development servers started!${NC}"
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo -e "Frontend (Local): ${GREEN}http://localhost:5174${NC}"
echo -e "Frontend (LAN):   ${GREEN}http://$LOCAL_IP:5174${NC}"
echo -e "Backend (Local):  ${GREEN}http://localhost:8001${NC}"
echo -e "Backend (LAN):    ${GREEN}http://$LOCAL_IP:8001${NC}"
echo -e "API Docs:         ${GREEN}http://localhost:8001/docs${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# 等待用户中断
trap 'echo -e "\n${YELLOW}🛑 Stopping development servers...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
wait