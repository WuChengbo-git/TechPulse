"""
数据质量评分系统

对不同数据源的内容进行质量评分，过滤低质量内容
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class QualityScorer:
    """数据质量评分器"""

    # 质量阈值（低于此分数的内容会被过滤）
    MIN_QUALITY_SCORE = 5.0

    def __init__(self):
        self.weights = {
            'github': {
                'stars': 0.3,
                'star_growth': 0.25,
                'activity': 0.25,
                'documentation': 0.2
            },
            'arxiv': {
                'author_reputation': 0.3,
                'citation_potential': 0.3,
                'completeness': 0.2,
                'recency': 0.2
            },
            'huggingface': {
                'downloads': 0.3,
                'download_growth': 0.25,
                'documentation': 0.25,
                'community': 0.2
            },
            'zenn': {
                'likes': 0.3,
                'comments': 0.2,
                'is_premium': 0.3,
                'author_reputation': 0.2
            }
        }

    def score_item(self, item: Dict[str, Any], source: str) -> float:
        """
        对单个内容进行评分

        Args:
            item: 内容数据字典
            source: 数据源（github/arxiv/huggingface/zenn）

        Returns:
            质量评分（0-10分）
        """
        source = source.lower()

        if source == 'github':
            return self._score_github(item)
        elif source == 'arxiv':
            return self._score_arxiv(item)
        elif source == 'huggingface':
            return self._score_huggingface(item)
        elif source == 'zenn':
            return self._score_zenn(item)
        else:
            logger.warning(f"Unknown source: {source}")
            return 5.0  # 默认中等分数

    def _score_github(self, repo: Dict[str, Any]) -> float:
        """
        GitHub仓库评分

        评分维度：
        - Star数量：基础人气指标
        - Star增速：近期热度
        - Commit活跃度：维护状态
        - 文档完整性：README/Wiki/文档
        """
        score = 0.0

        # 1. Star数量得分（最高3分）
        stars = repo.get('stars', 0) or 0
        if stars >= 10000:
            score += 3.0
        elif stars >= 5000:
            score += 2.5
        elif stars >= 1000:
            score += 2.0
        elif stars >= 500:
            score += 1.5
        elif stars >= 100:
            score += 1.0
        else:
            score += 0.5

        # 2. Star增速得分（最高2.5分）
        # 如果有star_growth_rate字段（需要后续采集）
        star_growth = repo.get('star_growth_rate', 0) or 0
        score += min(star_growth * 100, 2.5)

        # 3. 活跃度得分（最高2.5分）
        # 检查最近30天的commit数
        commit_count = repo.get('commit_count_30d', 0) or 0
        if commit_count >= 100:
            score += 2.5
        elif commit_count >= 50:
            score += 2.0
        elif commit_count >= 20:
            score += 1.5
        elif commit_count >= 10:
            score += 1.0
        elif commit_count >= 5:
            score += 0.5

        # 4. 文档完整性得分（最高2分）
        description = repo.get('description', '') or ''
        summary = repo.get('summary', '') or ''
        has_readme = len(description) > 50 or len(summary) > 50

        if has_readme:
            score += 1.0
            # 如果描述详细（超过200字符），额外加分
            if len(description + summary) > 200:
                score += 1.0

        return min(score, 10.0)

    def _score_arxiv(self, paper: Dict[str, Any]) -> float:
        """
        arXiv论文评分

        评分维度：
        - 作者影响力：是否来自知名机构
        - 引用潜力：摘要质量、主题热度
        - 完整性：是否有完整摘要
        - 时效性：发布时间
        """
        score = 0.0

        # 1. 作者影响力（最高3分）
        authors = paper.get('authors', '') or ''

        # 处理authors字段可能是list的情况
        if isinstance(authors, list):
            authors = ', '.join(str(a) for a in authors if a)

        authors_str = str(authors) if authors else ''

        # 知名机构关键词
        prestigious_orgs = [
            'OpenAI', 'Google', 'DeepMind', 'Microsoft', 'Meta', 'FAIR',
            'Stanford', 'MIT', 'Berkeley', 'CMU', 'Oxford', 'Cambridge',
            'Anthropic', 'Hugging Face', 'Stability AI'
        ]

        for org in prestigious_orgs:
            if org.lower() in authors_str.lower():
                score += 3.0
                break
        else:
            # 如果有多位作者（协作研究），加1分
            if authors_str.count(',') >= 2:
                score += 1.0

        # 2. 引用潜力（最高3分）
        # 基于摘要长度和关键词
        abstract = paper.get('summary', '') or ''
        if len(abstract) > 500:
            score += 1.5
        elif len(abstract) > 200:
            score += 1.0

        # 热门主题关键词
        hot_topics = [
            'large language model', 'llm', 'transformer', 'attention',
            'diffusion', 'reinforcement learning', 'rlhf', 'multimodal',
            'vision-language', 'agent', 'reasoning', 'chain-of-thought'
        ]

        abstract_lower = abstract.lower()
        for topic in hot_topics:
            if topic in abstract_lower:
                score += 1.5
                break

        # 3. 完整性（最高2分）
        if len(abstract) > 100:
            score += 1.0

        title = paper.get('title', '') or ''
        if len(title) > 20:
            score += 1.0

        # 4. 时效性（最高2分）
        created_at = paper.get('created_at')
        if created_at:
            try:
                if isinstance(created_at, str):
                    pub_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                else:
                    pub_date = created_at

                days_ago = (datetime.now(pub_date.tzinfo) - pub_date).days

                if days_ago <= 7:
                    score += 2.0
                elif days_ago <= 30:
                    score += 1.5
                elif days_ago <= 90:
                    score += 1.0
            except Exception as e:
                logger.warning(f"Error parsing date: {e}")

        return min(score, 10.0)

    def _score_huggingface(self, model: Dict[str, Any]) -> float:
        """
        HuggingFace模型评分

        评分维度：
        - 下载量：使用广泛度
        - 下载增速：近期热度
        - 文档质量：描述完整性
        - 社区互动：点赞数
        """
        score = 0.0

        # 1. 下载量得分（最高3分）
        downloads = model.get('downloads', 0) or 0
        if downloads >= 1000000:
            score += 3.0
        elif downloads >= 100000:
            score += 2.5
        elif downloads >= 10000:
            score += 2.0
        elif downloads >= 1000:
            score += 1.5
        elif downloads >= 100:
            score += 1.0
        else:
            score += 0.5

        # 2. 下载增速（最高2.5分）
        # 如果有download_growth字段（需要后续采集）
        download_growth = model.get('download_growth_rate', 0) or 0
        score += min(download_growth * 100, 2.5)

        # 3. 文档质量（最高2.5分）
        description = model.get('description', '') or model.get('summary', '') or ''

        if len(description) > 500:
            score += 2.5
        elif len(description) > 200:
            score += 2.0
        elif len(description) > 100:
            score += 1.5
        elif len(description) > 50:
            score += 1.0

        # 4. 社区互动（最高2分）
        likes = model.get('likes', 0) or 0
        if likes >= 1000:
            score += 2.0
        elif likes >= 500:
            score += 1.5
        elif likes >= 100:
            score += 1.0
        elif likes >= 10:
            score += 0.5

        return min(score, 10.0)

    def _score_zenn(self, article: Dict[str, Any]) -> float:
        """
        Zenn文章评分

        评分维度：
        - 点赞数：内容质量认可
        - 评论数：互动热度
        - Premium标识：付费内容通常质量更高
        - 作者声誉：历史文章质量
        """
        score = 0.0

        # 1. 点赞数（最高3分）
        likes = article.get('likes', 0) or 0
        if likes >= 100:
            score += 3.0
        elif likes >= 50:
            score += 2.5
        elif likes >= 20:
            score += 2.0
        elif likes >= 10:
            score += 1.5
        elif likes >= 5:
            score += 1.0
        else:
            score += 0.5

        # 2. 评论数（最高2分）
        comments = article.get('comments', 0) or 0
        if comments >= 20:
            score += 2.0
        elif comments >= 10:
            score += 1.5
        elif comments >= 5:
            score += 1.0
        elif comments >= 2:
            score += 0.5

        # 3. Premium标识（最高3分）
        is_premium = article.get('is_premium', False) or False
        if is_premium:
            score += 3.0

        # 4. 作者声誉（最高2分）
        # 基于文章长度和完整性
        summary = article.get('summary', '') or ''
        if len(summary) > 300:
            score += 2.0
        elif len(summary) > 150:
            score += 1.5
        elif len(summary) > 50:
            score += 1.0

        return min(score, 10.0)

    def should_keep(self, score: float) -> bool:
        """
        判断是否应该保留该内容

        Args:
            score: 质量评分

        Returns:
            True表示保留，False表示过滤
        """
        return score >= self.MIN_QUALITY_SCORE

    def get_quality_level(self, score: float) -> str:
        """
        获取质量等级标签

        Args:
            score: 质量评分

        Returns:
            质量等级字符串
        """
        if score >= 8.5:
            return "优秀"
        elif score >= 7.0:
            return "良好"
        elif score >= 5.0:
            return "中等"
        elif score >= 3.0:
            return "一般"
        else:
            return "较低"

    def get_star_rating(self, score: float) -> int:
        """
        获取星级评分（1-5星）

        Args:
            score: 质量评分（0-10）

        Returns:
            星级（1-5）
        """
        if score >= 9.0:
            return 5
        elif score >= 7.5:
            return 4
        elif score >= 5.5:
            return 3
        elif score >= 3.5:
            return 2
        else:
            return 1


# 全局单例
quality_scorer = QualityScorer()
