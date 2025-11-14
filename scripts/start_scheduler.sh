#!/bin/bash
# 启动数据收集调度器守护进程

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
LOGS_DIR="$PROJECT_ROOT/logs"
PID_FILE="$LOGS_DIR/scheduler.pid"

# 创建日志目录
mkdir -p "$LOGS_DIR"

# 检查是否已经在运行
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️  Scheduler is already running (PID: $PID)"
        exit 1
    else
        echo "🧹 Removing stale PID file"
        rm -f "$PID_FILE"
    fi
fi

# 进入后端目录
cd "$BACKEND_DIR" || exit 1

# 激活虚拟环境
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "❌ Virtual environment not found at $BACKEND_DIR/venv"
    exit 1
fi

# 启动调度器
echo "🚀 Starting TechPulse Data Collection Scheduler..."
nohup python scheduler_daemon.py > "$LOGS_DIR/scheduler.log" 2>&1 &
SCHEDULER_PID=$!

# 保存 PID
echo $SCHEDULER_PID > "$PID_FILE"

# 等待2秒检查是否成功启动
sleep 2

if ps -p "$SCHEDULER_PID" > /dev/null 2>&1; then
    echo "✅ Scheduler started successfully!"
    echo "   PID: $SCHEDULER_PID"
    echo "   Log: $LOGS_DIR/scheduler.log"
    echo ""
    echo "To stop: $SCRIPT_DIR/stop_scheduler.sh"
    echo "To check status: $SCRIPT_DIR/status_scheduler.sh"
else
    echo "❌ Scheduler failed to start. Check logs at $LOGS_DIR/scheduler.log"
    rm -f "$PID_FILE"
    exit 1
fi
