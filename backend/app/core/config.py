from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    app_name: str = "TechPulse API"
    debug: bool = False
    database_url: str = "sqlite:///./techpulse.db"
    secret_key: str = "your-secret-key-here"

    # JWT Configuration
    jwt_secret_key: Optional[str] = None
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30  # 30 分钟
    refresh_token_expire_days: int = 30  # 30 天

    # OAuth2 Configuration
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    microsoft_client_id: Optional[str] = None
    microsoft_client_secret: Optional[str] = None
    oauth_redirect_uri: str = "http://localhost:5173/auth/callback"

    # Email Configuration
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: str = "TechPulse"

    # Frontend URL
    frontend_url: str = "http://localhost:5173"

    # Security Settings
    password_min_length: int = 8
    password_reset_token_expire_hours: int = 24
    email_verification_token_expire_hours: int = 48
    max_login_attempts: int = 5
    lockout_duration_minutes: int = 30

    # Azure OpenAI Configuration
    azure_openai_api_key: Optional[str] = None
    azure_openai_endpoint: Optional[str] = None
    azure_openai_api_version: str = "2024-02-15-preview"
    azure_openai_deployment_name: str = "gpt-4o"
    azure_openai_embedding_deployment_name: str = "text-embedding-ada-002"

    # Translation & Summarization
    default_language: str = "zh"  # zh=Chinese, ja=Japanese, en=English
    enable_translation: bool = True
    enable_summarization: bool = True

    # GitHub Configuration
    github_token: Optional[str] = None

    # Hugging Face Configuration
    huggingface_token: Optional[str] = None

    # Notion Integration
    notion_token: Optional[str] = None
    notion_database_id: Optional[str] = None

    # Data Collection Settings
    collection_interval_hours: int = 6
    max_items_per_source: int = 50
    ai_keywords: str = "machine learning,deep learning,neural network,artificial intelligence,tensorflow,pytorch,keras,scikit-learn,transformers,llm,gpt,bert,stable diffusion,generative ai,chatbot,computer vision,nlp,data science"

    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/backend.log"

    @property
    def ai_keywords_list(self) -> List[str]:
        return [keyword.strip() for keyword in self.ai_keywords.split(",")]

    @property
    def jwt_secret(self) -> str:
        return self.jwt_secret_key or self.secret_key

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()