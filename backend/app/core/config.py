from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    app_name: str = "TechPulse API"
    debug: bool = False
    database_url: str = "sqlite:///./techpulse.db"
    secret_key: str = "your-secret-key-here"
    
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
    
    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()