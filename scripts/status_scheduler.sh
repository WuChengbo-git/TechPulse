#!/bin/bash
# 检查数据收集调度器状态

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"
PID_FILE="$LOGS_DIR/scheduler.pid"

echo "=========================================="
echo "TechPulse Scheduler Status"
echo "=========================================="

if [ ! -f "$PID_FILE" ]; then
    echo "Status: ❌ NOT RUNNING (no PID file)"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo "Status: ✅ RUNNING"
    echo "PID: $PID"
    echo ""

    # 显示进程信息
    echo "Process info:"
    ps -p "$PID" -o pid,ppid,cmd,etime,pcpu,pmem
    echo ""

    # 显示最后几行日志
    if [ -f "$LOGS_DIR/scheduler.log" ]; then
        echo "Last 10 log entries:"
        echo "----------------------------------------"
        tail -n 10 "$LOGS_DIR/scheduler.log"
    fi
else
    echo "Status: ❌ NOT RUNNING (PID $PID not found)"
    rm -f "$PID_FILE"
    exit 1
fi

echo "=========================================="
