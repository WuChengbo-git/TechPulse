# TechPulse Backend Test Suite

> **测试框架**: pytest
> **覆盖率目标**: 70%+
> **更新时间**: 2025-10-15

---

## 📋 目录

- [快速开始](#快速开始)
- [测试结构](#测试结构)
- [运行测试](#运行测试)
- [编写测试](#编写测试)
- [最佳实践](#最佳实践)

---

## 🚀 快速开始

### 安装测试依赖

```bash
cd /home/AI/TechPulse/backend
pip install -r requirements-test.txt
```

### 运行所有测试

```bash
# 使用脚本
./scripts/run_tests.sh all

# 或直接使用 pytest
pytest tests/
```

### 运行特定类型的测试

```bash
# 只运行单元测试
./scripts/run_tests.sh unit

# 只运行集成测试
./scripts/run_tests.sh integration

# 只运行认证相关测试
./scripts/run_tests.sh auth

# 只运行快速测试（跳过慢速测试）
./scripts/run_tests.sh fast
```

---

## 📁 测试结构

```
tests/
├── __init__.py
├── conftest.py              # 共享fixtures和配置
├── README.md               # 本文件
│
├── unit/                   # 单元测试 (70%)
│   ├── __init__.py
│   ├── test_security.py    # 安全模块测试
│   ├── test_quality_scorer.py    # 质量评分
│   └── test_recommender.py       # 推荐算法
│
├── integration/            # 集成测试 (25%)
│   ├── __init__.py
│   ├── test_auth_api.py    # 认证API
│   ├── test_cards_api.py   # 卡片API
│   └── test_preferences_api.py  # 偏好API
│
└── fixtures/               # 测试数据
    ├── users.py            # 用户测试数据
    └── cards.py            # 卡片测试数据
```

---

## 🧪 当前测试覆盖

### ✅ 已完成的测试模块

#### 1. 单元测试 - 安全模块 (`tests/unit/test_security.py`)

**测试类**:
- `TestPasswordHashing` - 密码加密功能
  - ✅ 基础密码哈希
  - ✅ 密码验证（正确/错误）
  - ✅ 哈希唯一性（盐值）
  - ✅ 空密码处理
  - ✅ 特殊字符密码
  - ✅ 大小写敏感性
  - ✅ 长密码处理

- `TestJWTTokens` - JWT令牌功能
  - ✅ 基础令牌创建
  - ✅ 带用户ID的令牌
  - ✅ 自定义过期时间
  - ✅ 令牌解码
  - ✅ 过期令牌处理
  - ✅ 无效签名检测
  - ✅ 畸形令牌处理
  - ✅ 必需字段验证
  - ✅ 数据完整性

- `TestSecurityEdgeCases` - 边界情况
  - ✅ None值处理
  - ✅ Unicode密码
  - ✅ 空数据令牌
  - ✅ 大载荷令牌

**测试数量**: 32个测试

#### 2. 集成测试 - 认证API (`tests/integration/test_auth_api.py`)

**测试类**:
- `TestUserRegistration` - 用户注册
  - ✅ 成功注册新用户
  - ✅ 重复用户名检测
  - ✅ 重复邮箱检测
  - ✅ 必填字段验证
  - ✅ 邮箱格式验证
  - ✅ 弱密码检测

- `TestUserLogin` - 用户登录
  - ✅ 成功登录
  - ✅ 错误密码
  - ✅ 不存在的用户
  - ✅ 邮箱登录（可选）
  - ✅ 非活跃用户
  - ✅ 缺失凭据
  - ✅ 大小写敏感性

- `TestTokenAuthentication` - 令牌认证
  - ✅ 有效令牌访问受保护路由
  - ✅ 无令牌访问
  - ✅ 无效令牌
  - ✅ 过期令牌
  - ✅ 不同Header格式

- `TestUserProfile` - 用户资料
  - ✅ 获取当前用户
  - ✅ 更新用户资料

- `TestCompleteAuthFlow` - 完整流程
  - ✅ 注册→登录→访问流程
  - ✅ 多个登录会话

**测试数量**: 25个测试

### 📊 测试统计

- **总测试数**: 57个
- **单元测试**: 32个 (56%)
- **集成测试**: 25个 (44%)
- **预计覆盖率**: 70%+

---

## 🏃 运行测试

### 基础命令

```bash
# 运行所有测试
pytest

# 详细输出
pytest -v

# 显示测试摘要
pytest -v --tb=short

# 运行单个文件
pytest tests/unit/test_security.py

# 运行单个测试类
pytest tests/unit/test_security.py::TestPasswordHashing

# 运行单个测试函数
pytest tests/unit/test_security.py::TestPasswordHashing::test_password_hashing_basic
```

### 使用标记过滤

```bash
# 只运行单元测试
pytest -m unit

# 只运行集成测试
pytest -m integration

# 只运行认证相关测试
pytest -m auth

# 只运行API测试
pytest -m api

# 排除慢速测试
pytest -m "not slow"

# 组合标记
pytest -m "unit and auth"
```

### 代码覆盖率

```bash
# 生成覆盖率报告
pytest --cov=app --cov-report=html

# 查看HTML报告
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux

# 只显示未覆盖的行
pytest --cov=app --cov-report=term-missing

# 指定最低覆盖率
pytest --cov=app --cov-fail-under=70
```

### 并行运行

```bash
# 使用多核并行运行
pytest -n auto

# 使用4个进程
pytest -n 4
```

### 其他有用选项

```bash
# 遇到第一个失败就停止
pytest -x

# 只运行上次失败的测试
pytest --lf

# 先运行失败的测试
pytest --ff

# 显示最慢的10个测试
pytest --durations=10

# 输出print语句
pytest -s
```

---

## ✍️ 编写测试

### 单元测试示例

```python
# tests/unit/test_example.py
import pytest
from app.services.example import some_function

@pytest.mark.unit
class TestExampleFunction:
    """测试某个函数"""

    def test_basic_usage(self):
        """测试基本用法"""
        result = some_function("input")
        assert result == "expected_output"

    def test_edge_case(self):
        """测试边界情况"""
        result = some_function(None)
        assert result is None

    @pytest.mark.parametrize("input,expected", [
        ("a", "A"),
        ("b", "B"),
        ("c", "C"),
    ])
    def test_multiple_cases(self, input, expected):
        """测试多个情况"""
        result = some_function(input)
        assert result == expected
```

### 集成测试示例

```python
# tests/integration/test_example_api.py
import pytest
from fastapi.testclient import TestClient

@pytest.mark.integration
@pytest.mark.api
class TestExampleAPI:
    """测试某个API端点"""

    def test_get_endpoint(self, client: TestClient):
        """测试GET请求"""
        response = client.get("/api/v1/example")
        assert response.status_code == 200
        assert "data" in response.json()

    def test_post_endpoint(self, client: TestClient):
        """测试POST请求"""
        response = client.post(
            "/api/v1/example",
            json={"key": "value"}
        )
        assert response.status_code == 201
```

### 使用Fixtures

```python
@pytest.fixture
def sample_user(test_db):
    """创建测试用户"""
    user = User(username="test", email="test@example.com")
    test_db.add(user)
    test_db.commit()
    return user

def test_with_fixture(sample_user):
    """使用fixture的测试"""
    assert sample_user.username == "test"
```

---

## 📝 测试最佳实践

### 1. 测试命名

```python
# ✅ 好的命名
def test_user_registration_with_valid_data_should_create_user():
    pass

def test_login_with_wrong_password_should_return_401():
    pass

# ❌ 不好的命名
def test_1():
    pass

def test_user():
    pass
```

### 2. AAA模式（Arrange-Act-Assert）

```python
def test_password_hashing():
    # Arrange - 准备测试数据
    password = "test123"

    # Act - 执行被测试的功能
    hashed = get_password_hash(password)

    # Assert - 验证结果
    assert verify_password(password, hashed)
```

### 3. 一个测试一个断言（尽可能）

```python
# ✅ 好的做法
def test_user_creation():
    user = create_user("test")
    assert user.username == "test"

def test_user_is_active_by_default():
    user = create_user("test")
    assert user.is_active is True

# ❌ 不推荐（但有时必要）
def test_user():
    user = create_user("test")
    assert user.username == "test"
    assert user.is_active is True
    assert user.email is not None
    # ...很多断言
```

### 4. 测试隔离

```python
# ✅ 每个测试独立
def test_user_a(test_db):
    user = create_user(test_db, "usera")
    assert user.username == "usera"

def test_user_b(test_db):
    user = create_user(test_db, "userb")
    assert user.username == "userb"
```

### 5. 不要测试第三方库

```python
# ❌ 不需要测试
def test_sqlalchemy_add():
    db.add(user)
    db.commit()

# ✅ 测试你的业务逻辑
def test_create_user_saves_to_database(test_db):
    user = User(username="test")
    test_db.add(user)
    test_db.commit()

    saved_user = test_db.query(User).first()
    assert saved_user.username == "test"
```

---

## 🐛 调试测试

### 使用pdb调试器

```python
def test_something():
    result = some_function()
    import pdb; pdb.set_trace()  # 在这里暂停
    assert result == expected
```

运行:
```bash
pytest -s  # -s 允许pdb交互
```

### 查看详细错误

```bash
# 显示完整的traceback
pytest --tb=long

# 只显示失败的测试
pytest --tb=short

# 显示局部变量
pytest --tb=long -vv
```

### 只运行失败的测试

```bash
pytest --lf  # last-failed
```

---

## 📊 持续集成

### GitHub Actions配置示例

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.10

    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install -r requirements-test.txt

    - name: Run tests
      run: |
        pytest --cov=app --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

---

## 🎯 下一步计划

### 待添加的测试模块

1. **质量评分系统** (`test_quality_scorer.py`)
2. **推荐算法** (`test_recommender.py`)
3. **数据采集器** (`test_data_collector.py`)
4. **卡片API** (`test_cards_api.py`)
5. **偏好API** (`test_preferences_api.py`)
6. **行为日志** (`test_behavior_api.py`)
7. **搜索API** (`test_search_api.py`)

---

## 📞 需要帮助？

- 查看 [pytest 文档](https://docs.pytest.org/)
- 查看项目 [QUICKSTART.md](../../QUICKSTART.md)
- 提交 Issue

---

**Happy Testing!** 🧪✅
