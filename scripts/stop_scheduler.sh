#!/bin/bash
# 停止数据收集调度器守护进程

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"
PID_FILE="$LOGS_DIR/scheduler.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "⚠️  Scheduler PID file not found. Is it running?"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "⚠️  Scheduler (PID: $PID) is not running"
    rm -f "$PID_FILE"
    exit 1
fi

echo "🛑 Stopping TechPulse Data Collection Scheduler (PID: $PID)..."
kill -TERM "$PID"

# 等待最多10秒
for i in {1..10}; do
    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo "✅ Scheduler stopped successfully"
        rm -f "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# 如果还没停止，强制杀死
echo "⚠️  Scheduler did not stop gracefully, force killing..."
kill -9 "$PID"
rm -f "$PID_FILE"
echo "✅ Scheduler force stopped"
