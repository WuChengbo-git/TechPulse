from notion_client import AsyncClient
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from ..core.config import settings
from ..models.card import TechCard, SourceType, TrialStatus
import logging

logger = logging.getLogger(__name__)


class NotionService:
    def __init__(self):
        if settings.notion_token:
            self.client = AsyncClient(auth=settings.notion_token)
            self.database_id = settings.notion_database_id
        else:
            self.client = None
            logger.warning("Notion API not configured")
    
    async def create_page(self, card: TechCard) -> Optional[str]:
        """
        在Notion中创建页面
        """
        if not self.client or not self.database_id:
            return None
        
        try:
            properties = self._build_page_properties(card)
            
            response = await self.client.pages.create(
                parent={"database_id": self.database_id},
                properties=properties,
                children=self._build_page_content(card)
            )
            
            return response["id"]
            
        except Exception as e:
            logger.error(f"Error creating Notion page for card {card.id}: {e}")
            return None
    
    async def update_page(self, page_id: str, card: TechCard) -> bool:
        """
        更新Notion页面
        """
        if not self.client:
            return False
        
        try:
            properties = self._build_page_properties(card)
            
            await self.client.pages.update(
                page_id=page_id,
                properties=properties
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating Notion page {page_id}: {e}")
            return False
    
    async def sync_card_to_notion(self, card: TechCard, db: Session) -> bool:
        """
        同步卡片到Notion
        """
        try:
            if card.notion_page_id:
                success = await self.update_page(card.notion_page_id, card)
            else:
                page_id = await self.create_page(card)
                if page_id:
                    card.notion_page_id = page_id
                    db.commit()
                    success = True
                else:
                    success = False
            
            return success
            
        except Exception as e:
            logger.error(f"Error syncing card {card.id} to Notion: {e}")
            return False
    
    async def sync_all_cards(self, db: Session, limit: int = 50) -> Dict[str, int]:
        """
        同步所有卡片到Notion
        """
        if not self.client:
            return {"error": "Notion not configured"}
        
        results = {"success": 0, "failed": 0, "total": 0}
        
        try:
            cards = db.query(TechCard).limit(limit).all()
            results["total"] = len(cards)
            
            for card in cards:
                success = await self.sync_card_to_notion(card, db)
                if success:
                    results["success"] += 1
                else:
                    results["failed"] += 1
            
            return results
            
        except Exception as e:
            logger.error(f"Error in sync_all_cards: {e}")
            return {"error": str(e)}
    
    def _build_page_properties(self, card: TechCard) -> Dict:
        """
        构建Notion页面属性
        """
        properties = {
            "标题": {
                "title": [
                    {
                        "text": {
                            "content": card.title[:100]
                        }
                    }
                ]
            },
            "来源": {
                "select": {
                    "name": self._get_source_name(card.source)
                }
            },
            "状态": {
                "select": {
                    "name": self._get_status_name(card.status)
                }
            },
            "链接": {
                "url": card.original_url
            },
            "创建时间": {
                "date": {
                    "start": card.created_at.isoformat()
                }
            }
        }
        
        if card.chinese_tags:
            properties["标签"] = {
                "multi_select": [
                    {"name": tag} for tag in card.chinese_tags[:10]
                ]
            }
        
        if card.summary:
            properties["摘要"] = {
                "rich_text": [
                    {
                        "text": {
                            "content": card.summary[:2000]
                        }
                    }
                ]
            }
        
        return properties
    
    def _build_page_content(self, card: TechCard) -> List[Dict]:
        """
        构建Notion页面内容
        """
        content = []
        
        if card.summary:
            content.append({
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "项目摘要"}
                        }
                    ]
                }
            })
            
            content.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": card.summary}
                        }
                    ]
                }
            })
        
        if card.trial_suggestion:
            content.append({
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "试用建议"}
                        }
                    ]
                }
            })
            
            content.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": card.trial_suggestion}
                        }
                    ]
                }
            })
        
        if card.trial_notes:
            content.append({
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": "试用记录"}
                        }
                    ]
                }
            })
            
            content.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": card.trial_notes}
                        }
                    ]
                }
            })
        
        content.append({
            "object": "block",
            "type": "divider",
            "divider": {}
        })
        
        content.append({
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": "原始链接: "},
                    },
                    {
                        "type": "text",
                        "text": {"content": card.original_url, "link": {"url": card.original_url}},
                    }
                ]
            }
        })
        
        return content
    
    def _get_source_name(self, source: SourceType) -> str:
        """
        获取来源的中文名称
        """
        source_map = {
            SourceType.GITHUB: "GitHub",
            SourceType.ARXIV: "arXiv",
            SourceType.HUGGINGFACE: "HuggingFace"
        }
        return source_map.get(source, str(source))
    
    def _get_status_name(self, status: TrialStatus) -> str:
        """
        获取状态的中文名称
        """
        status_map = {
            TrialStatus.NOT_TRIED: "未尝试",
            TrialStatus.TRIED: "已尝试",
            TrialStatus.FAILED: "失败",
            TrialStatus.SUCCESS: "成功"
        }
        return status_map.get(status, str(status))
    
    async def test_connection(self) -> Dict[str, any]:
        """
        测试Notion连接
        """
        if not self.client:
            return {"connected": False, "error": "Notion not configured"}
        
        try:
            if self.database_id:
                response = await self.client.databases.retrieve(self.database_id)
                return {
                    "connected": True,
                    "database_title": response.get("title", [{}])[0].get("plain_text", "Unknown"),
                    "database_id": self.database_id
                }
            else:
                user = await self.client.users.me()
                return {
                    "connected": True,
                    "user": user.get("name", "Unknown"),
                    "database_id": None
                }
                
        except Exception as e:
            return {"connected": False, "error": str(e)}