from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "TechPulse API"
    debug: bool = False
    database_url: str = "sqlite:///./techpulse.db"
    secret_key: str
    
    openai_api_key: Optional[str] = None
    openai_api_base: Optional[str] = None
    openai_api_version: str = "2023-12-01-preview"
    
    notion_token: Optional[str] = None
    notion_database_id: Optional[str] = None
    
    class Config:
        env_file = ".env"


settings = Settings()