# TechPulse 快速启动指南

> **版本**: v0.2.1
> **更新**: 2025-10-14
> **文档**: [完整文档](docs/README.md)

---

## 🚀 5分钟快速启动

### 1. 启动后端服务

```bash
cd /home/AI/TechPulse/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**检查状态**:
```bash
# 后端应该在 http://localhost:8000 运行
curl http://localhost:8000/health
# 返回: {"status":"healthy"}
```

**查看 API 文档**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. 启动前端服务

```bash
cd /home/AI/TechPulse/frontend
npm run dev
```

**访问地址**:
- 本地: [http://localhost:5174](http://localhost:5174)
- 远程: `http://YOUR_SERVER_IP:5174`

**注意**:
- 如果浏览器和服务器不在同一台机器，使用服务器的实际 IP 地址
- Vite 会自动代理 API 请求到后端

---

### 3. 登录系统

**默认管理员账户**:
```
用户名: w357771580
密码:   w357771580
```

**首次登录**:
1. 系统会自动弹出兴趣问卷
2. 选择你感兴趣的技术领域
3. 提交后即可开始使用

---

## 🎯 核心功能快速体验

### 功能 1: 浏览技术内容 📚

**步骤**:
1. 登录后进入 Dashboard
2. 点击左侧导航：**GitHub** / **arXiv** / **HuggingFace** / **Zenn**
3. 查看每条内容的**质量评分徽章**（⭐）

**质量徽章说明**:
- ⭐⭐⭐⭐⭐ 金色 - 优秀（≥8.0分）
- ⭐⭐⭐⭐ 绿色 - 良好（6.0-8.0分）
- ⭐⭐⭐ 蓝色 - 中等（4.0-6.0分）
- ⭐⭐ 橙色 - 一般（2.0-4.0分）
- ⭐ 灰色 - 较低（<2.0分）

---

### 功能 2: 查看趋势分析 📈

**步骤**:
1. 点击左侧导航 **Trends**
2. 查看：
   - 7天/30天数据趋势
   - 编程语言热度
   - 技术领域分布
   - 热门标签云

**交互功能**:
- 点击标签云中的标签可以过滤内容
- 鼠标悬停查看详细统计

---

### 功能 3: 个性化推荐 💡

**设置兴趣偏好**:

**方式 A - 首次登录**（自动弹出）:
1. 注册新账号
2. 登录后自动显示问卷
3. 选择关注领域、技术角色、内容偏好
4. 提交保存

**方式 B - 重新设置**:
1. 右上角用户菜单 → **个人设置**
2. 找到 **兴趣偏好** 部分
3. 重新选择你的兴趣标签

**问卷选项**:

**关注领域**（多选）:
- 🤖 大语言模型 (LLM)
- 👁️ 计算机视觉 (CV)
- 🎮 强化学习 (RL)
- 🤝 AI Agent
- 🎨 多模态
- ⚡ 模型量化
- 🛠️ 开源工具
- 💬 NLP

**技术角色**（单选）:
- 🔬 研究员
- 👨‍💻 工程师
- 📊 产品经理
- 🎓 学生

**内容偏好**（多选）:
- 📄 前沿论文
- 📦 开源项目
- 🔧 实用工具
- 📈 行业趋势

---

### 功能 4: 多语言切换 🌍

**切换语言**:
1. 右上角用户菜单
2. 点击语言图标
3. 选择：🇨🇳 中文 / 🇺🇸 English / 🇯🇵 日本語

**支持范围**:
- ✅ 界面所有文本
- ✅ 数据源标签（自动翻译）
- ✅ 错误提示信息

---

### 功能 5: 系统设置 ⚙️

**访问设置页面**:
1. 右上角用户菜单 → **系统设置**
2. 可配置项：
   - **AI 配置** - Azure OpenAI 接口设置
   - **数据源配置** - GitHub/arXiv/HF/Zenn API 参数
   - **任务管理** - 定时采集任务调度
   - **系统状态** - 资源使用监控

---

## 🛠️ 开发者工具

### 查看数据库信息

```bash
# 查看数据统计
python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('backend/techpulse.db')
cursor = conn.cursor()

# 总数据量
cursor.execute("SELECT COUNT(*) FROM tech_cards")
print(f"总内容数: {cursor.fetchone()[0]}")

# 数据源分布
cursor.execute("SELECT source, COUNT(*) FROM tech_cards GROUP BY source")
print("\n数据源分布:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} 条")

# 质量评分分布
cursor.execute("""
SELECT
  CASE
    WHEN quality_score >= 8.0 THEN '优秀(≥8.0)'
    WHEN quality_score >= 6.0 THEN '良好(6.0-8.0)'
    WHEN quality_score >= 4.0 THEN '中等(4.0-6.0)'
    ELSE '较低(<4.0)'
  END as level,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tech_cards), 1) as percent
FROM tech_cards
GROUP BY level
ORDER BY MIN(quality_score) DESC
""")
print("\n质量评分分布:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} 条 ({row[2]}%)")

conn.close()
EOF
```

---

### 运行数据采集

```bash
cd /home/AI/TechPulse/backend

# 采集 GitHub Trending
python -c "from app.services.data_collector import DataCollector; import asyncio; asyncio.run(DataCollector().collect_github_trending())"

# 采集 arXiv 论文
python -c "from app.services.data_collector import DataCollector; import asyncio; asyncio.run(DataCollector().collect_arxiv_papers())"

# 采集 HuggingFace 模型
python -c "from app.services.data_collector import DataCollector; import asyncio; asyncio.run(DataCollector().collect_huggingface_models())"

# 采集 Zenn 文章
python -c "from app.services.data_collector import DataCollector; import asyncio; asyncio.run(DataCollector().collect_zenn_articles())"
```

---

### 重新评分所有内容

```bash
cd /home/AI/TechPulse/backend
python scripts/rescore_all_cards.py
```

**评分算法**:
- GitHub: Star数、Fork率、Issue活跃度、最近更新
- arXiv: 作者数量、引用潜力、关键词匹配
- HuggingFace: 下载量、点赞数、标签相关性
- Zenn: 点赞数、评论数、阅读时长

---

## 📚 文档导航

### 规划类文档
- [产品路线图](docs/planning/PRODUCT_ROADMAP.md) - 产品愿景和三层架构
- [功能路线图](docs/planning/FEATURE_ROADMAP.md) - 详细功能规划（P0-P3）
- [实现状态](docs/planning/IMPLEMENTATION_STATUS.md) - 当前开发进度

### 实现类文档
- [P0 优化总结](docs/implementation/P0_OPTIMIZATION_SUMMARY.md) - 质量系统和性能优化
- [P1 智能搜索设计](docs/implementation/P1_SMART_SEARCH_DESIGN.md) - 搜索和推荐系统
- [P1 实现总结](docs/implementation/P1_IMPLEMENTATION_SUMMARY.md) - 后端实现详情

### 系统类文档
- [开发环境配置](docs/system/SETUP_GUIDE.md) - 环境搭建指南
- [部署指南](docs/system/DEPLOYMENT_GUIDE.md) - 生产环境部署
- [用户认证系统](docs/system/AUTH_COMPLETE.md) - 认证机制说明
- [系统管理](docs/system/SETTINGS_IMPLEMENTATION.md) - 系统配置详解

### 完整文档索引
查看 [docs/README.md](docs/README.md) 获取所有文档的导航

---

## 🐛 常见问题

### Q1: 前端显示 "Network Error"
**原因**: API 请求失败

**解决步骤**:
1. 检查后端是否运行
   ```bash
   curl http://localhost:8000/health
   ```
2. 检查前端配置（frontend/vite.config.ts）
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:8000',
       changeOrigin: true
     }
   }
   ```
3. 重启前端服务

---

### Q2: 登录失败，没有错误提示
**原因**: 后端缺少 argon2-cffi 依赖

**解决**:
```bash
pip install argon2-cffi
# 重启后端
pkill -f "uvicorn app.main:app"
cd /home/AI/TechPulse/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### Q3: 登录后没有弹出问卷
**原因**: 用户已经完成过问卷

**解决**（重置问卷状态）:
```bash
python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('backend/techpulse.db')
cursor = conn.cursor()
cursor.execute("UPDATE users SET preferences = '{}' WHERE username = 'w357771580'")
conn.commit()
conn.close()
print("✅ 问卷状态已重置，请重新登录")
EOF
```

---

### Q4: 看不到质量徽章
**原因**: 数据没有 quality_score 字段

**解决**:
```bash
cd /home/AI/TechPulse/backend
python scripts/rescore_all_cards.py
# 然后刷新浏览器（Ctrl + Shift + R）
```

---

### Q5: 端口被占用
**错误**: `Address already in use`

**解决**:
```bash
# 找到占用端口的进程
lsof -i :8000
# 或
netstat -tlnp | grep 8000

# 杀死进程
kill -9 <PID>

# 重新启动
cd /home/AI/TechPulse/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🎨 自定义配置

### 修改质量评分阈值

编辑 [backend/app/services/quality_filter.py](backend/app/services/quality_filter.py):

```python
class QualityScorer:
    # GitHub 评分权重
    GITHUB_WEIGHTS = {
        'stars': 0.3,      # Star 数权重
        'activity': 0.25,  # 活跃度权重
        'community': 0.25, # 社区健康度
        'growth': 0.2      # 增长速度
    }

    # 最低质量分数阈值
    MIN_QUALITY_SCORE = 5.0  # 默认 5.0
```

---

### 修改数据采集频率

编辑 [backend/app/core/config.py](backend/app/core/config.py):

```python
class Settings(BaseSettings):
    # 采集间隔（小时）
    collection_interval_hours: int = 6  # 默认 6 小时

    # 每个数据源最大采集数量
    max_items_per_source: int = 50  # 默认 50 条
```

---

### 添加自定义兴趣标签

编辑 [frontend/src/components/InterestSurvey.tsx](frontend/src/components/InterestSurvey.tsx):

```typescript
const domainOptions = [
  { label: t('survey.domains.llm'), value: 'llm', emoji: '🤖' },
  { label: t('survey.domains.cv'), value: 'cv', emoji: '👁️' },
  // 添加你的新标签
  { label: '你的领域', value: 'your_field', emoji: '🆕' },
  // ...
];
```

---

## 📈 性能优化

### 前端生产构建

```bash
cd /home/AI/TechPulse/frontend

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 生产构建文件位于: dist/
```

---

### 后端生产部署

```bash
cd /home/AI/TechPulse/backend

# 使用多进程运行
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# 或使用 Gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

### 数据库优化

```bash
# 备份数据库
cp backend/techpulse.db backend/techpulse_backup_$(date +%Y%m%d).db

# 清理旧数据（保留最近 90 天）
python3 << 'EOF'
import sqlite3
from datetime import datetime, timedelta

conn = sqlite3.connect('backend/techpulse.db')
cursor = conn.cursor()

cutoff_date = datetime.now() - timedelta(days=90)
cursor.execute("DELETE FROM tech_cards WHERE created_at < ?", (cutoff_date,))
deleted = cursor.rowcount

conn.commit()
conn.close()
print(f"✅ 清理了 {deleted} 条旧数据")
EOF

# 优化数据库
sqlite3 backend/techpulse.db "VACUUM;"
```

---

## 🔐 安全建议

### 生产环境检查清单

- [ ] 修改默认管理员密码
- [ ] 配置 HTTPS（使用 Nginx/Caddy）
- [ ] 设置强密码策略
- [ ] 启用 CORS 白名单
- [ ] 配置防火墙规则
- [ ] 定期备份数据库
- [ ] 更新所有依赖包
- [ ] 配置日志轮转
- [ ] 设置资源限制

### 定期维护

```bash
# 每周备份数据库
0 3 * * 0 cp /home/AI/TechPulse/backend/techpulse.db /backup/techpulse_$(date +\%Y\%m\%d).db

# 每月清理旧日志
0 0 1 * * find /home/AI/TechPulse/logs -mtime +30 -delete

# 每天检查磁盘空间
0 8 * * * df -h | mail -s "Disk Usage Report" admin@example.com
```

---

## 🔄 更新升级

### 更新代码

```bash
cd /home/AI/TechPulse

# 拉取最新代码
git pull origin main

# 更新后端依赖
cd backend
pip install -r requirements.txt --upgrade

# 更新前端依赖
cd ../frontend
npm install

# 重启服务
```

---

## 🆘 获取帮助

### 查看日志

**后端日志**:
```bash
# 实时查看
tail -f /home/AI/TechPulse/backend/logs/app.log

# 搜索错误
grep "ERROR" /home/AI/TechPulse/backend/logs/app.log | tail -20

# 查看今天的日志
grep "$(date +%Y-%m-%d)" /home/AI/TechPulse/backend/logs/app.log
```

**前端日志**:
- 打开浏览器控制台（F12）
- 查看 Console 和 Network 标签

---

### 重启所有服务

```bash
# 停止所有服务
pkill -f "uvicorn app.main:app"
pkill -f "vite"

# 等待 2 秒
sleep 2

# 启动后端
cd /home/AI/TechPulse/backend
nohup python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &

# 启动前端
cd /home/AI/TechPulse/frontend
nohup npm run dev > /tmp/frontend.log 2>&1 &

echo "✅ 服务已重启"
echo "后端日志: tail -f /tmp/backend.log"
echo "前端日志: tail -f /tmp/frontend.log"
```

---

### 完全重置系统

```bash
# ⚠️ 警告：这将删除所有数据！

# 1. 备份数据库
cp backend/techpulse.db backend/techpulse_backup_$(date +%Y%m%d).db

# 2. 删除数据库
rm backend/techpulse.db

# 3. 重新初始化
cd backend
python -c "from app.core.database import init_db; init_db()"

# 4. 创建管理员账户
python scripts/create_admin.py

# 5. 重新采集数据
python scripts/collect_all_sources.py
```

---

## 📞 联系支持

### 问题反馈
- **GitHub Issues**: 报告 Bug 和功能请求
- **文档**: 查看 [完整文档](docs/README.md)
- **邮件**: wuchengbo999@gmail.com

### 版本信息
```bash
# 查看当前版本
cat VERSION.txt

# 查看 Git 提交
git log --oneline -5
```

---

## 🎯 下一步

1. ✅ 完成基本配置
2. ✅ 体验核心功能
3. ⏳ 探索 [功能路线图](docs/planning/FEATURE_ROADMAP.md)
4. ⏳ 参与 [P1 功能开发](docs/implementation/P1_IMPLEMENTATION_SUMMARY.md)

---

**祝使用愉快！** 🎉

有任何问题请查看 [完整文档](docs/README.md) 或联系技术支持。

---

<div align="center">

**TechPulse v0.2.1** - 智能技术情报聚合平台

Made with ❤️ by TechPulse Team

</div>
