import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class HuggingFaceScraper:
    def __init__(self):
        self.base_url = "https://huggingface.co/api"
        self.models_url = f"{self.base_url}/models"
        self.datasets_url = f"{self.base_url}/datasets"
    
    async def get_trending_models(self, task: Optional[str] = None, limit: int = 30) -> List[Dict]:
        """
        获取 HuggingFace 热门模型
        """
        try:
            params = {
                "sort": "downloads",
                "direction": -1,
                "limit": limit
            }
            
            if task:
                params["filter"] = task
            
            response = requests.get(self.models_url, params=params, timeout=30)
            response.raise_for_status()
            
            models = response.json()
            result = []
            
            for model in models:
                model_data = {
                    "title": model.get("modelId", ""),
                    "author": model.get("author", ""),
                    "downloads": model.get("downloads", 0),
                    "likes": model.get("likes", 0),
                    "url": f"https://huggingface.co/{model.get('modelId', '')}",
                    "tags": model.get("tags", []),
                    "pipeline_tag": model.get("pipeline_tag"),
                    "library_name": model.get("library_name"),
                    "created_at": model.get("createdAt"),
                    "last_modified": model.get("lastModified"),
                    "raw_data": model
                }
                result.append(model_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching HuggingFace models: {e}")
            return []
    
    async def get_daily_trending_models(self, limit: int = 20) -> List[Dict]:
        """
        获取最新AI模型 - 按下载量和最近更新时间
        """
        try:
            # 获取不同类型的热门AI模型
            ai_tasks = [
                "text-generation",
                "text-to-image",
                "image-generation", 
                "automatic-speech-recognition",
                "question-answering",
                "translation",
                "summarization",
                "feature-extraction"
            ]
            
            all_models = []
            
            # 首先获取按下载量排序的热门模型
            for task in ai_tasks[:4]:  # 限制请求数量
                params = {
                    "sort": "downloads",
                    "direction": -1,
                    "limit": 8,
                    "filter": task
                }
                
                response = requests.get(self.models_url, params=params, timeout=30)
                if response.status_code == 200:
                    models = response.json()
                    
                    for model in models:
                        # 避免重复
                        if not any(m["title"] == model.get("modelId", "") for m in all_models):
                            model_data = {
                                "title": model.get("modelId", ""),
                                "author": model.get("author", ""),
                                "downloads": model.get("downloads", 0),
                                "likes": model.get("likes", 0),
                                "url": f"https://huggingface.co/{model.get('modelId', '')}",
                                "tags": model.get("tags", []),
                                "pipeline_tag": model.get("pipeline_tag"),
                                "library_name": model.get("library_name"),
                                "created_at": model.get("createdAt"),
                                "last_modified": model.get("lastModified"),
                                "task_category": task,
                                "raw_data": model
                            }
                            all_models.append(model_data)
            
            # 然后获取最近更新的模型
            recent_params = {
                "sort": "lastModified",
                "direction": -1,
                "limit": 15
            }
            
            response = requests.get(self.models_url, params=recent_params, timeout=30)
            if response.status_code == 200:
                models = response.json()
                
                for model in models:
                    # 避免重复
                    if not any(m["title"] == model.get("modelId", "") for m in all_models):
                        model_data = {
                            "title": model.get("modelId", ""),
                            "author": model.get("author", ""),
                            "downloads": model.get("downloads", 0),
                            "likes": model.get("likes", 0),
                            "url": f"https://huggingface.co/{model.get('modelId', '')}",
                            "tags": model.get("tags", []),
                            "pipeline_tag": model.get("pipeline_tag"),
                            "library_name": model.get("library_name"),
                            "created_at": model.get("createdAt"),
                            "last_modified": model.get("lastModified"),
                            "task_category": "recent",
                            "raw_data": model
                        }
                        all_models.append(model_data)
            
            # 按下载量排序，但保持最近更新的模型也有机会被选中
            # 混合排序：70%按下载量，30%按最近更新
            popular_models = sorted([m for m in all_models if m.get("downloads", 0) > 1000], 
                                   key=lambda x: x.get("downloads", 0), reverse=True)[:int(limit*0.7)]
            recent_models = sorted([m for m in all_models if m not in popular_models], 
                                  key=lambda x: x.get("last_modified") or "", reverse=True)[:int(limit*0.3)]
            
            all_models = popular_models + recent_models
            return all_models[:limit]
            
        except Exception as e:
            logger.error(f"Error fetching daily trending models: {e}")
            return []
    
    async def get_trending_datasets(self, task: Optional[str] = None, limit: int = 30) -> List[Dict]:
        """
        获取 HuggingFace 热门数据集
        """
        try:
            params = {
                "sort": "downloads",
                "direction": -1,
                "limit": limit
            }
            
            if task:
                params["filter"] = task
            
            response = requests.get(self.datasets_url, params=params, timeout=30)
            response.raise_for_status()
            
            datasets = response.json()
            result = []
            
            for dataset in datasets:
                dataset_data = {
                    "title": dataset.get("id", ""),
                    "author": dataset.get("author", ""),
                    "downloads": dataset.get("downloads", 0),
                    "likes": dataset.get("likes", 0),
                    "url": f"https://huggingface.co/datasets/{dataset.get('id', '')}",
                    "tags": dataset.get("tags", []),
                    "task_categories": dataset.get("task_categories", []),
                    "created_at": dataset.get("createdAt"),
                    "last_modified": dataset.get("lastModified"),
                    "raw_data": dataset
                }
                result.append(dataset_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching HuggingFace datasets: {e}")
            return []
    
    async def get_model_details(self, model_id: str) -> Optional[Dict]:
        """
        获取特定模型的详细信息
        """
        try:
            url = f"{self.models_url}/{model_id}"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            model = response.json()
            
            model_data = {
                "title": model.get("modelId", ""),
                "author": model.get("author", ""),
                "downloads": model.get("downloads", 0),
                "likes": model.get("likes", 0),
                "url": f"https://huggingface.co/{model_id}",
                "tags": model.get("tags", []),
                "pipeline_tag": model.get("pipeline_tag"),
                "library_name": model.get("library_name"),
                "license": model.get("license"),
                "created_at": model.get("createdAt"),
                "last_modified": model.get("lastModified"),
                "raw_data": model
            }
            
            readme_content = await self._get_model_readme(model_id)
            if readme_content:
                model_data["readme"] = readme_content
            
            return model_data
            
        except Exception as e:
            logger.error(f"Error fetching HuggingFace model {model_id}: {e}")
            return None
    
    async def _get_model_readme(self, model_id: str) -> str:
        """
        获取模型的 README 内容
        """
        try:
            url = f"https://huggingface.co/{model_id}/raw/main/README.md"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                return response.text[:2000]
            
            return ""
            
        except Exception as e:
            logger.error(f"Error fetching README for {model_id}: {e}")
            return ""
    
    def get_task_categories(self) -> Dict[str, str]:
        """
        获取任务类别映射
        """
        return {
            "text-classification": "文本分类",
            "token-classification": "命名实体识别",
            "question-answering": "问答系统",
            "text-generation": "文本生成",
            "translation": "机器翻译",
            "summarization": "文本摘要",
            "image-classification": "图像分类",
            "object-detection": "目标检测",
            "image-to-text": "图像描述",
            "text-to-image": "文本生成图像",
            "automatic-speech-recognition": "语音识别",
            "text-to-speech": "语音合成"
        }