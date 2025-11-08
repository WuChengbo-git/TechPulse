"""
元数据增强服务

用于从已存在的 TechCard 的 URL 提取最新的元数据
- GitHub: stars, forks, issues, watchers, language
- arXiv: citations (通过 Semantic Scholar API)
- HuggingFace: downloads, likes, library_name
- Zenn: likes (如果有API支持)
"""

import requests
import logging
import re
from typing import Optional, Dict, Any
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)


class MetadataEnricher:
    """元数据增强器 - 从各个平台API获取最新元数据"""

    def __init__(self, github_token: Optional[str] = None):
        """
        初始化元数据增强器

        Args:
            github_token: GitHub Personal Access Token (可选，但强烈推荐以提高速率限制)
        """
        self.github_token = github_token
        self.github_headers = {}
        if github_token:
            self.github_headers = {"Authorization": f"Bearer {github_token}"}

        # API 端点
        self.github_api = "https://api.github.com"
        self.semantic_scholar_api = "https://api.semanticscholar.org/graph/v1"
        self.huggingface_api = "https://huggingface.co/api"

    async def enrich_card_metadata(self, card: Any) -> Dict[str, Any]:
        """
        增强单个卡片的元数据

        Args:
            card: TechCard 对象

        Returns:
            包含更新字段的字典
        """
        try:
            source = card.source.value if hasattr(card.source, 'value') else str(card.source)
            url = card.original_url

            if source == 'github':
                return await self._enrich_github(url)
            elif source == 'arxiv':
                return await self._enrich_arxiv(url, card.title)
            elif source == 'huggingface':
                return await self._enrich_huggingface(url)
            elif source == 'zenn':
                return await self._enrich_zenn(url)
            else:
                logger.warning(f"Unknown source type: {source}")
                return {}

        except Exception as e:
            logger.error(f"Error enriching metadata for card {card.id}: {e}")
            return {}

    async def _enrich_github(self, url: str) -> Dict[str, Any]:
        """
        从 GitHub API 获取仓库元数据

        Returns:
            {
                'stars': int,
                'forks': int,
                'issues': int,
                'language': str,
                'license': str,
                'raw_data': dict
            }
        """
        try:
            # 从 URL 提取 owner/repo
            # https://github.com/owner/repo
            match = re.search(r'github\.com/([^/]+)/([^/]+)', url)
            if not match:
                logger.warning(f"Invalid GitHub URL format: {url}")
                return {}

            owner, repo = match.groups()
            # 移除可能的 .git 后缀
            repo = repo.rstrip('.git')

            # 调用 GitHub API
            api_url = f"{self.github_api}/repos/{owner}/{repo}"
            response = requests.get(
                api_url,
                headers=self.github_headers,
                timeout=10
            )

            if response.status_code == 404:
                logger.warning(f"GitHub repo not found: {owner}/{repo}")
                return {}

            response.raise_for_status()
            data = response.json()

            # 提取元数据
            metadata = {
                'stars': data.get('stargazers_count', 0),
                'forks': data.get('forks_count', 0),
                'issues': data.get('open_issues_count', 0),
                'tech_stack': [data.get('language')] if data.get('language') else [],
                'license': data.get('license', {}).get('name') if data.get('license') else None,
                'raw_data': {
                    'watchers': data.get('watchers_count', 0),
                    'subscribers': data.get('subscribers_count', 0),
                    'size': data.get('size', 0),
                    'default_branch': data.get('default_branch'),
                    'topics': data.get('topics', []),
                    'homepage': data.get('homepage'),
                    'description': data.get('description'),
                    'created_at': data.get('created_at'),
                    'updated_at': data.get('updated_at'),
                    'pushed_at': data.get('pushed_at')
                }
            }

            logger.info(f"Successfully enriched GitHub metadata for {owner}/{repo}: {metadata['stars']} stars")
            return metadata

        except requests.RequestException as e:
            logger.error(f"Error fetching GitHub metadata for {url}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error in _enrich_github: {e}")
            return {}

    async def _enrich_arxiv(self, url: str, title: str) -> Dict[str, Any]:
        """
        从 arXiv 和 Semantic Scholar 获取论文元数据

        主要获取引用数量

        Returns:
            {
                'raw_data': {
                    'citations': int,
                    'influential_citations': int,
                    'semantic_scholar_id': str
                }
            }
        """
        try:
            # 从 URL 提取 arXiv ID
            # https://arxiv.org/abs/2301.12345
            match = re.search(r'arxiv\.org/abs/(\d+\.\d+)', url)
            if not match:
                logger.warning(f"Invalid arXiv URL format: {url}")
                return {}

            arxiv_id = match.group(1)

            # 使用 Semantic Scholar API 获取引用数量
            # 先搜索论文
            search_url = f"{self.semantic_scholar_api}/paper/search"
            params = {
                'query': f"arXiv:{arxiv_id}",
                'fields': 'paperId,citationCount,influentialCitationCount,title'
            }

            response = requests.get(search_url, params=params, timeout=10)

            if response.status_code != 200:
                logger.warning(f"Semantic Scholar API returned {response.status_code} for {arxiv_id}")
                return {}

            data = response.json()

            if not data.get('data'):
                # 如果通过 arXiv ID 找不到，尝试用标题搜索
                params['query'] = title
                response = requests.get(search_url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()

            if data.get('data') and len(data['data']) > 0:
                paper = data['data'][0]
                metadata = {
                    'raw_data': {
                        'citations': paper.get('citationCount', 0),
                        'influential_citations': paper.get('influentialCitationCount', 0),
                        'semantic_scholar_id': paper.get('paperId'),
                        'arxiv_id': arxiv_id
                    }
                }

                logger.info(f"Successfully enriched arXiv metadata for {arxiv_id}: {metadata['raw_data']['citations']} citations")
                return metadata
            else:
                logger.info(f"No citation data found for arXiv {arxiv_id}")
                return {}

        except requests.RequestException as e:
            logger.error(f"Error fetching arXiv metadata for {url}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error in _enrich_arxiv: {e}")
            return {}

    async def _enrich_huggingface(self, url: str) -> Dict[str, Any]:
        """
        从 HuggingFace API 获取模型/数据集元数据

        Returns:
            {
                'raw_data': {
                    'downloads': int,
                    'likes': int,
                    'library_name': str,
                    'pipeline_tag': str
                }
            }
        """
        try:
            # 从 URL 提取 model_id
            # https://huggingface.co/username/model-name
            match = re.search(r'huggingface\.co/([^/]+/[^/?#]+)', url)
            if not match:
                logger.warning(f"Invalid HuggingFace URL format: {url}")
                return {}

            model_id = match.group(1)

            # 调用 HuggingFace API
            api_url = f"{self.huggingface_api}/models/{model_id}"
            response = requests.get(api_url, timeout=10)

            if response.status_code == 404:
                # 可能是数据集，尝试数据集 API
                api_url = f"{self.huggingface_api}/datasets/{model_id}"
                response = requests.get(api_url, timeout=10)

            if response.status_code != 200:
                logger.warning(f"HuggingFace API returned {response.status_code} for {model_id}")
                return {}

            data = response.json()

            metadata = {
                'raw_data': {
                    'downloads': data.get('downloads', 0),
                    'likes': data.get('likes', 0),
                    'library_name': data.get('library_name'),
                    'pipeline_tag': data.get('pipeline_tag'),
                    'tags': data.get('tags', []),
                    'author': data.get('author'),
                    'created_at': data.get('createdAt'),
                    'last_modified': data.get('lastModified')
                }
            }

            logger.info(f"Successfully enriched HuggingFace metadata for {model_id}: {metadata['raw_data']['downloads']} downloads, {metadata['raw_data']['likes']} likes")
            return metadata

        except requests.RequestException as e:
            logger.error(f"Error fetching HuggingFace metadata for {url}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error in _enrich_huggingface: {e}")
            return {}

    async def _enrich_zenn(self, url: str) -> Dict[str, Any]:
        """
        从 Zenn 获取文章元数据

        注意: Zenn 没有公开的官方 API，这里暂时返回空字典
        未来可以考虑：
        1. 网页爬虫提取点赞数
        2. 使用非官方 API (如果存在)

        Returns:
            空字典或包含 likes 的字典
        """
        try:
            # Zenn 的元数据提取需要爬虫或非官方API
            # 这里暂时返回空，标记为 TODO
            logger.info(f"Zenn metadata enrichment not yet implemented for {url}")
            return {}

        except Exception as e:
            logger.error(f"Error in _enrich_zenn: {e}")
            return {}

    async def enrich_cards_batch(self, cards: list, batch_size: int = 10, delay: float = 1.0) -> Dict[int, Dict[str, Any]]:
        """
        批量增强多个卡片的元数据

        Args:
            cards: TechCard 对象列表
            batch_size: 批处理大小
            delay: 每批之间的延迟(秒)，避免API限流

        Returns:
            字典 {card_id: metadata_dict}
        """
        results = {}

        for i in range(0, len(cards), batch_size):
            batch = cards[i:i+batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}/{(len(cards)-1)//batch_size + 1}")

            # 并发处理当前批次
            tasks = [self.enrich_card_metadata(card) for card in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            # 收集结果
            for card, metadata in zip(batch, batch_results):
                if isinstance(metadata, Exception):
                    logger.error(f"Error enriching card {card.id}: {metadata}")
                    continue

                if metadata:  # 只保存非空结果
                    results[card.id] = metadata

            # 延迟以避免 API 限流
            if i + batch_size < len(cards):
                await asyncio.sleep(delay)

        logger.info(f"Batch enrichment completed: {len(results)}/{len(cards)} cards enriched")
        return results


# 便捷函数
async def enrich_single_card(card, github_token: Optional[str] = None) -> Dict[str, Any]:
    """
    增强单个卡片元数据的便捷函数

    Usage:
        metadata = await enrich_single_card(card, github_token="ghp_xxx")
    """
    enricher = MetadataEnricher(github_token=github_token)
    return await enricher.enrich_card_metadata(card)


async def enrich_multiple_cards(cards: list, github_token: Optional[str] = None, batch_size: int = 10) -> Dict[int, Dict[str, Any]]:
    """
    批量增强多个卡片元数据的便捷函数

    Usage:
        results = await enrich_multiple_cards(cards, github_token="ghp_xxx")
    """
    enricher = MetadataEnricher(github_token=github_token)
    return await enricher.enrich_cards_batch(cards, batch_size=batch_size)
