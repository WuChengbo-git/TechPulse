# TechPulse 快速启动指南

> **版本**: v0.2.0
> **更新**: 2025-10-09

---

## 🚀 快速启动

### 1. 启动后端服务

```bash
cd /home/AI/TechPulse
./scripts/start.sh
```

**检查状态**:
```bash
# 后端应该在 http://localhost:8001 运行
curl http://localhost:8001/health
# 返回: {"status":"healthy"}
```

### 2. 启动前端服务

```bash
cd /home/AI/TechPulse/frontend
npm run dev
```

**访问地址**: `http://YOUR_IP:5174`

**注意**:
- 不要用 `localhost`，因为浏览器和服务器可能不在同一台机器
- 使用服务器的实际IP地址

---

## 🎯 新功能使用指南

### 功能1: 查看质量徽章 ⭐

1. 登录系统
2. 访问 **GitHub页面**
3. 查看每个项目旁边的**彩色徽章**
4. 鼠标悬停查看详细评分信息

**徽章说明**:
- ⭐⭐⭐⭐⭐ 金色 - 优秀（≥8.0分）
- ⭐⭐⭐⭐ 绿色 - 良好（6.0-8.0分）
- ⭐⭐⭐ 蓝色 - 中等（4.0-6.0分）
- ⭐⭐ 橙色 - 一般（2.0-4.0分）
- ⭐ 灰色 - 较低（<2.0分）

### 功能2: 完成兴趣问卷 📝

**触发方式**:

**方法A**: 注册新账号（推荐）
```
1. 点击右上角"退出登录"
2. 点击"还没有账号？立即注册"
3. 填写注册信息
4. 登录后自动弹出问卷
```

**方法B**: 重置现有用户的问卷状态
```sql
-- 在数据库中执行
sqlite3 /home/AI/TechPulse/backend/techpulse.db
UPDATE users SET preferences = '{}' WHERE username = 'YOUR_USERNAME';
.quit
```
然后重新登录

**问卷内容**:
1. **关注领域**（多选）
   - 🤖 大语言模型 (LLM)
   - 👁️ 计算机视觉 (CV)
   - 🎮 强化学习 (RL)
   - 🤝 AI Agent
   - 🎨 多模态
   - ⚡ 模型量化
   - 🛠️ 开源工具
   - 💬 NLP

2. **技术角色**（单选）
   - 🔬 研究员
   - 👨‍💻 工程师
   - 📊 产品经理
   - 🎓 学生

3. **内容偏好**（多选）
   - 📄 前沿论文
   - 📦 开源项目
   - 🔧 实用工具
   - 📈 行业趋势

**提交后**:
- ✅ 偏好保存到数据库
- ✅ 显示欢迎提示
- ✅ 后续用于个性化推荐

---

## 🔧 开发者工具

### 运行测试套件

```bash
cd /home/AI/TechPulse/backend
python scripts/test_new_features.py
```

**测试内容**:
- ✅ 质量评分系统
- ✅ 数据分布统计
- ✅ 用户偏好API
- ✅ 前端组件检查

### 查看API文档

访问: `http://localhost:8001/docs`

**新增API端点**:
- `GET /api/v1/preferences/` - 获取用户偏好
- `POST /api/v1/preferences/` - 更新偏好
- `POST /api/v1/preferences/onboarding` - 完成问卷

### 数据库操作

```bash
# 进入数据库
sqlite3 /home/AI/TechPulse/backend/techpulse.db

# 查看质量评分分布
SELECT
  CASE
    WHEN quality_score >= 8.0 THEN '优秀'
    WHEN quality_score >= 6.0 THEN '良好'
    WHEN quality_score >= 4.0 THEN '中等'
    ELSE '较低'
  END as level,
  COUNT(*) as count
FROM tech_cards
GROUP BY level;

# 查看用户偏好
SELECT username, preferences FROM users;

# 退出
.quit
```

---

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [产品规划](docs/PRODUCT_ROADMAP.md) | 详细的产品路线图和技术方案 |
| [实现进度](docs/IMPLEMENTATION_PROGRESS.md) | 当前开发进度和待办事项 |
| [会话总结](docs/SESSION_SUMMARY_2025-10-09.md) | 本次开发的详细总结 |
| [语言切换](docs/SIMPLE_LANGUAGE_SWITCH.md) | 多语言支持说明 |

---

## 🐛 常见问题

### Q1: 前端显示"Network Error"
**原因**: 浏览器访问的是localhost，但服务器在其他机器

**解决**:
1. 使用服务器的实际IP地址访问
2. 确保 `frontend/.env` 中 `VITE_API_URL` 是空的
3. Vite会自动代理到后端

### Q2: 登录后没有弹出问卷
**原因**: 用户已经完成过问卷

**解决**:
```sql
UPDATE users SET preferences = '{}' WHERE username = 'YOUR_USERNAME';
```

### Q3: GitHub页面看不到质量徽章
**原因**:
1. 数据没有quality_score字段
2. 前端缓存

**解决**:
```bash
# 1. 运行评分脚本
cd /home/AI/TechPulse/backend
python scripts/add_quality_score.py

# 2. 硬刷新浏览器
Ctrl + Shift + R
```

### Q4: 质量评分都是5.0
**原因**: 数据缺少关键字段（stars、downloads等）

**解决**:
- 重新采集数据
- 或手动添加测试数据

---

## 🎨 自定义配置

### 调整质量评分阈值

编辑 `backend/app/services/quality_filter.py`:

```python
class QualityScorer:
    # 修改这个值来改变过滤阈值
    MIN_QUALITY_SCORE = 5.0  # 默认5.0
```

### 修改问卷选项

编辑 `frontend/src/components/InterestSurvey.tsx`:

```typescript
// 添加新的兴趣领域
const interestOptions = [
  { label: '你的新领域', value: 'NEW_FIELD', emoji: '🆕' },
  // ... 其他选项
];
```

### 更改语言

右上角用户菜单 → 语言切换 → 选择语言

支持:
- 🇨🇳 简体中文
- 🇺🇸 English
- 🇯🇵 日本語

---

## 📈 性能优化

### 前端优化

```bash
# 生产构建
cd /home/AI/TechPulse/frontend
npm run build

# 预览生产版本
npm run preview
```

### 后端优化

```bash
# 使用生产级服务器
cd /home/AI/TechPulse/backend
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

---

## 🔐 安全注意事项

1. **不要在生产环境使用默认密码**
2. **定期备份数据库**
   ```bash
   cp /home/AI/TechPulse/backend/techpulse.db \
      /home/AI/TechPulse/backend/techpulse.db.backup.$(date +%Y%m%d)
   ```
3. **使用HTTPS**（生产环境）
4. **定期更新依赖**
   ```bash
   cd /home/AI/TechPulse/backend
   pip install --upgrade -r requirements.txt

   cd /home/AI/TechPulse/frontend
   npm update
   ```

---

## 🤝 获取帮助

### 查看日志

**后端日志**:
```bash
# 实时查看
tail -f /home/AI/TechPulse/backend/logs/app.log

# 搜索错误
grep "ERROR" /home/AI/TechPulse/backend/logs/app.log
```

**前端日志**:
打开浏览器控制台（F12）查看

### 重启服务

```bash
# 重启后端
pkill -f "uvicorn app.main:app"
cd /home/AI/TechPulse
./scripts/start.sh

# 重启前端（在前端终端按Ctrl+C，然后）
npm run dev
```

---

**祝使用愉快！** 🎉

有问题请查看 [docs/SESSION_SUMMARY_2025-10-09.md](docs/SESSION_SUMMARY_2025-10-09.md)
