# TechPulse 数据收集调度器使用指南

## 概述

TechPulse 数据收集调度器是一个独立的后台进程，负责自动收集和更新技术内容数据。它可以独立于主应用运行，确保即使在开发或维护期间，数据收集也不会中断。

## 功能特性

### 自动调度任务

1. **增量更新** - 每2小时执行一次
   - 收集最新的技术内容
   - 对新数据进行AI增强（生成摘要、提取标签等）

2. **全量更新** - 每天凌晨2:00执行
   - 全面收集所有数据源
   - 处理所有未增强的卡片

3. **健康检查** - 每小时执行一次
   - 检查上次收集时间
   - 如果超过2小时未收集，自动触发增量更新

### 数据源

- **GitHub** - 热门开源项目
- **arXiv** - 最新学术论文
- **Hugging Face** - AI模型和数据集
- **Zenn** - 日本技术文章

## 使用方法

### 启动调度器

```bash
./scripts/start_scheduler.sh
```

输出示例：
```
✅ Virtual environment activated
🚀 Starting TechPulse Data Collection Scheduler...
✅ Scheduler started successfully!
   PID: 123456
   Log: /home/AI/TechPulse/logs/scheduler.log

To stop: ./scripts/stop_scheduler.sh
To check status: ./scripts/status_scheduler.sh
```

### 停止调度器

```bash
./scripts/stop_scheduler.sh
```

### 检查状态

```bash
./scripts/status_scheduler.sh
```

输出示例：
```
==========================================
TechPulse Scheduler Status
==========================================
Status: ✅ RUNNING
PID: 123456

Process info:
    PID    PPID CMD                             ELAPSED %CPU %MEM
 123456       1 python scheduler_daemon.py        01:23  0.5  0.2

Last 10 log entries:
----------------------------------------
2025-11-12 09:53:53 - INFO - Scheduler started successfully
2025-11-12 09:53:53 - INFO - Schedule: Every 2 hours
...
==========================================
```

### 查看日志

实时查看日志：
```bash
tail -f /home/AI/TechPulse/logs/scheduler.log
```

查看最近的日志：
```bash
tail -100 /home/AI/TechPulse/logs/scheduler.log
```

## 系统集成

### 作为系统服务运行（推荐）

如果你希望调度器在系统启动时自动运行，可以创建一个 systemd 服务：

1. 创建服务文件：
```bash
sudo nano /etc/systemd/system/techpulse-scheduler.service
```

2. 添加以下内容：
```ini
[Unit]
Description=TechPulse Data Collection Scheduler
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/AI/TechPulse/backend
ExecStart=/home/AI/TechPulse/backend/venv/bin/python /home/AI/TechPulse/backend/scheduler_daemon.py
Restart=always
RestartSec=10
StandardOutput=append:/home/AI/TechPulse/logs/scheduler.log
StandardError=append:/home/AI/TechPulse/logs/scheduler.log

[Install]
WantedBy=multi-user.target
```

3. 启用并启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable techpulse-scheduler
sudo systemctl start techpulse-scheduler
```

4. 检查状态：
```bash
sudo systemctl status techpulse-scheduler
```

### 使用 cron（备选方案）

如果不使用 systemd，可以用 cron 确保调度器始终运行：

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每5分钟检查一次，如果没运行就启动）
*/5 * * * * /home/AI/TechPulse/scripts/start_scheduler.sh > /dev/null 2>&1
```

## 配置

### 环境变量

调度器使用以下环境变量（在 `.env` 文件中配置）：

```bash
# 数据收集间隔（小时）
COLLECTION_INTERVAL_HOURS=2

# 数据库
DATABASE_URL=sqlite:///./techpulse.db

# LLM API（用于AI增强）
OPENAI_API_KEY=your_key_here
# 或使用 Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=swallow-8B-Instruct-v0.3-Q4_K_M

# 翻译服务
TRANSLATION_PROVIDER=ollama  # 或 openai
```

### 调整收集频率

修改 `backend/app/services/scheduler.py` 中的调度设置：

```python
# 每N小时执行增量更新
schedule.every(N).hours.do(self._run_data_collection)

# 每天特定时间执行全量更新
schedule.every().day.at("02:00").do(self._run_full_collection)
```

## 监控和维护

### 日志级别

默认日志级别为 INFO。如需更详细的日志，修改 `scheduler_daemon.py`：

```python
logging.basicConfig(
    level=logging.DEBUG,  # 改为 DEBUG
    ...
)
```

### 磁盘空间

定期清理旧日志：

```bash
# 只保留最近7天的日志
find /home/AI/TechPulse/logs -name "*.log" -mtime +7 -delete
```

### 性能监控

使用 `htop` 或 `top` 监控调度器进程：

```bash
# 实时监控
htop -p $(cat /home/AI/TechPulse/logs/scheduler.pid)
```

## 故障排查

### 调度器无法启动

1. 检查虚拟环境：
```bash
ls /home/AI/TechPulse/backend/venv/bin/python
```

2. 检查权限：
```bash
chmod +x /home/AI/TechPulse/scripts/*.sh
chmod +x /home/AI/TechPulse/backend/scheduler_daemon.py
```

3. 检查依赖：
```bash
cd /home/AI/TechPulse/backend
source venv/bin/activate
pip install -r requirements.txt
```

### 调度器运行但不收集数据

1. 检查日志中的错误信息：
```bash
grep ERROR /home/AI/TechPulse/logs/scheduler.log
```

2. 检查网络连接
3. 检查 API 配置（GitHub token、OpenAI key 等）

### 调度器意外停止

1. 检查系统日志：
```bash
journalctl -u techpulse-scheduler -n 50
```

2. 检查是否是内存不足（OOM）：
```bash
dmesg | grep -i "out of memory"
```

## 与主应用的关系

- **独立运行**：调度器和主应用（FastAPI）可以分别启动/停止
- **共享数据库**：两者使用同一个 SQLite 数据库
- **互不影响**：主应用停止不影响数据收集，调度器停止不影响用户访问

这种设计确保：
- 开发时可以随意重启主应用
- 数据收集持续进行
- 用户始终能看到最新数据

## 最佳实践

1. **生产环境**：使用 systemd 服务
2. **开发环境**：使用脚本手动启动/停止
3. **定期检查**：每周查看日志，确保正常运行
4. **备份数据**：定期备份 SQLite 数据库
5. **监控资源**：确保有足够的磁盘空间和内存

## 常见问题

**Q: 调度器会重复收集数据吗？**
A: 不会。数据收集器会检查是否已存在，避免重复。

**Q: 可以手动触发数据收集吗？**
A: 可以通过主应用的 API 端点触发，或重启调度器。

**Q: 调度器占用多少资源？**
A: 空闲时几乎不占用资源，收集数据时会短暂增加 CPU 和网络使用。

**Q: 可以同时运行多个调度器吗？**
A: 不建议。多个调度器会导致数据重复收集和潜在的数据库冲突。

## 总结

独立的调度器设计让 TechPulse 的数据收集更加可靠和灵活。无论是开发、测试还是生产环境，都能确保数据的持续更新。
