#!/bin/bash

# TechPulse 停止脚本
echo "🛑 Stopping TechPulse services..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 停止通过PID文件记录的进程
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${BLUE}🔌 Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
        sleep 2
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Force killing backend...${NC}"
            kill -9 $BACKEND_PID
        fi
        echo -e "${GREEN}✅ Backend stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend process not running${NC}"
    fi
    rm -f logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${BLUE}🔌 Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
        sleep 2
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Force killing frontend...${NC}"
            kill -9 $FRONTEND_PID
        fi
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend process not running${NC}"
    fi
    rm -f logs/frontend.pid
fi

# 额外检查并停止可能运行的进程
echo -e "${BLUE}🔍 Checking for remaining processes...${NC}"

# 停止可能的Python/uvicorn进程
PYTHON_PIDS=$(pgrep -f "python.*run.py\|uvicorn.*app.main")
if [ -n "$PYTHON_PIDS" ]; then
    echo -e "${BLUE}🐍 Stopping Python processes: $PYTHON_PIDS${NC}"
    kill $PYTHON_PIDS 2>/dev/null
fi

# 停止可能的Node.js/Vite进程
NODE_PIDS=$(pgrep -f "node.*vite\|npm.*dev")
if [ -n "$NODE_PIDS" ]; then
    echo -e "${BLUE}🟢 Stopping Node.js processes: $NODE_PIDS${NC}"
    kill $NODE_PIDS 2>/dev/null
fi

# 检查端口占用
echo -e "${BLUE}🔍 Checking port usage...${NC}"

if lsof -i :8001 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 8001 still in use:${NC}"
    lsof -i :8001
    PIDS_8001=$(lsof -t -i :8001)
    if [ -n "$PIDS_8001" ]; then
        echo -e "${BLUE}🔌 Killing processes on port 8001...${NC}"
        kill $PIDS_8001 2>/dev/null
    fi
fi

if lsof -i :5174 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 5174 still in use:${NC}"
    lsof -i :5174
    PIDS_5174=$(lsof -t -i :5174)
    if [ -n "$PIDS_5174" ]; then
        echo -e "${BLUE}🔌 Killing processes on port 5174...${NC}"
        kill $PIDS_5174 2>/dev/null
    fi
fi

echo -e "${GREEN}✅ All TechPulse services stopped${NC}"

# 显示日志信息
if [ -f "logs/backend.log" ] || [ -f "logs/frontend.log" ]; then
    echo ""
    echo -e "${BLUE}📝 Log files preserved:${NC}"
    [ -f "logs/backend.log" ] && echo -e "   Backend:  ${YELLOW}logs/backend.log${NC}"
    [ -f "logs/frontend.log" ] && echo -e "   Frontend: ${YELLOW}logs/frontend.log${NC}"
    echo ""
    echo -e "${YELLOW}💡 To clean logs, run: rm -rf logs/${NC}"
fi