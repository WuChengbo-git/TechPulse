from sqlalchemy import Column, Integer, String, Boolean, Text, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..core.database import Base


class UserSettings(Base):
    """用户系统设置模型"""
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # AI模型配置
    # OpenAI
    openai_api_key = Column(Text)  # 加密存储
    openai_model = Column(String(50), default='gpt-3.5-turbo')
    openai_base_url = Column(String(255))
    openai_organization = Column(String(255))

    # Azure OpenAI
    azure_api_key = Column(Text)  # 加密存储
    azure_endpoint = Column(String(255))
    azure_deployment = Column(String(100))
    azure_api_version = Column(String(50), default='2024-02-01')

    # Ollama
    ollama_server_url = Column(String(255), default='http://localhost:11434')
    ollama_model = Column(String(50), default='llama2')

    # 知识库集成
    # Notion
    notion_api_token = Column(Text)  # 加密存储
    notion_database_id = Column(String(100))
    notion_sync_frequency = Column(String(20), default='daily')

    # 个性化设置
    enable_recommendation = Column(Boolean, default=True)
    recommendation_algorithm = Column(String(20), default='hybrid')  # content/collaborative/hybrid
    enable_behavior_tracking = Column(Boolean, default=True)
    show_recommendation_reason = Column(Boolean, default=True)
    anonymous_mode = Column(Boolean, default=False)

    # 用户偏好
    preferred_language = Column(String(10), default='zh')
    theme_mode = Column(String(10), default='light')  # light/dark/auto
    items_per_page = Column(Integer, default=20)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<UserSettings user_id={self.user_id}>"


class DataSourceConfig(Base):
    """数据源配置模型 - 用户特定的数据源收集配置"""
    __tablename__ = "data_source_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    source_type = Column(String(20), nullable=False)  # github/arxiv/huggingface/zenn

    # 通用配置
    enabled = Column(Boolean, default=True)

    # 配置数据（JSON格式存储在Text字段中）
    # 对于GitHub: languages, topics, min_stars, max_age_days等
    # 对于arXiv: categories, keywords, max_age_days等
    # 对于HuggingFace: pipeline_tags, model_types等
    # 对于Zenn: topics, article_types等
    config_data = Column(Text, nullable=False)  # JSON string

    # 调度配置
    schedule_enabled = Column(Boolean, default=False)
    schedule_frequency = Column(String(20), default='daily')  # hourly/daily/weekly
    schedule_time = Column(String(10), default='09:00')
    schedule_timezone = Column(String(50), default='Asia/Tokyo')

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<DataSourceConfig user_id={self.user_id} source={self.source_type}>"
