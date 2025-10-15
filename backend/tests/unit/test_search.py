"""
Unit tests for Search module.

Tests cover:
- IntentClassifier - Query intent classification
- SearchEngine - Relevance scoring and suggestions
"""
import pytest
from datetime import datetime
from sqlalchemy.orm import Session

from app.api.search import IntentClassifier, SearchEngine
from app.models.card import TechCard, SourceType


# ==================== IntentClassifier Tests ====================

@pytest.mark.unit
class TestIntentClassifier:
    """Tests for IntentClassifier"""

    def test_query_intent_search_keywords(self):
        """Test query intent with search keywords"""
        queries = [
            "搜索机器学习",
            "查找深度学习资源",
            "有没有关于NLP的项目",
            "寻找FastAPI教程"
        ]

        for query in queries:
            intent = IntentClassifier.classify(query)
            assert intent == 'query', f"Failed for: {query}"

    def test_query_intent_topic_keywords(self):
        """Test query intent with topic keywords"""
        queries = [
            "关于Transformer的",
            "NLP方面的",
            "机器学习教程",
            "深度学习项目",
            "NLP资源"
        ]

        for query in queries:
            intent = IntentClassifier.classify(query)
            assert intent == 'query', f"Failed for: {query}"

    def test_analyze_intent_comparison(self):
        """Test analyze intent with comparison keywords"""
        queries = [
            "分析PyTorch和TensorFlow",
            "比较不同的LLM模型",
            "对比BERT和GPT",
            "两者的区别是什么"
        ]

        for query in queries:
            intent = IntentClassifier.classify(query)
            assert intent == 'analyze', f"Failed for: {query}"

    def test_analyze_intent_recommendation(self):
        """Test analyze intent with recommendation keywords"""
        queries = [
            "推荐适合初学者的框架",
            "建议使用哪个模型",
            "选择PyTorch还是TensorFlow",
            "什么适合做推荐系统"
        ]

        for query in queries:
            intent = IntentClassifier.classify(query)
            assert intent == 'analyze', f"Failed for: {query}"

    def test_analyze_intent_how_to(self):
        """Test analyze intent with how-to questions"""
        queries = [
            "如何使用FastAPI",
            "怎么训练一个模型",
            "怎样部署推荐系统",
            "怎么办才能提高准确率"
        ]

        for query in queries:
            intent = IntentClassifier.classify(query)
            assert intent == 'analyze', f"Failed for: {query}"

    def test_analyze_intent_why_questions(self):
        """Test analyze intent with why questions"""
        queries = [
            "为什么选择PyTorch",
            "为何使用Transformer",
            "原因是什么",
            "优缺点分析"
        ]

        for query in queries:
            intent = IntentClassifier.classify(query)
            assert intent == 'analyze', f"Failed for: {query}"

    def test_default_query_intent(self):
        """Test default intent for ambiguous queries"""
        queries = [
            "深度学习",
            "FastAPI",
            "机器学习模型",
            "自然语言处理"
        ]

        for query in queries:
            intent = IntentClassifier.classify(query)
            assert intent == 'query', f"Failed for: {query}"

    def test_empty_query(self):
        """Test empty query"""
        intent = IntentClassifier.classify("")
        assert intent == 'query'  # Default

    def test_english_query(self):
        """Test English query (should default to query)"""
        queries = [
            "machine learning",
            "deep learning tutorial",
            "PyTorch vs TensorFlow"
        ]

        for query in queries:
            intent = IntentClassifier.classify(query)
            assert intent == 'query', f"Failed for: {query}"


# ==================== SearchEngine Tests ====================

@pytest.mark.unit
class TestSearchEngine:
    """Tests for SearchEngine"""

    def test_calculate_relevance_title_match(self, test_db: Session):
        """Test relevance score for title match"""
        card = TechCard(
            title="FastAPI Tutorial for Beginners",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/fastapi"
        )

        score, highlights = SearchEngine.calculate_relevance_score(card, "FastAPI")

        assert score == 0.5  # Title match only (50%)
        assert "标题" in highlights

    def test_calculate_relevance_summary_match(self, test_db: Session):
        """Test relevance score for summary match"""
        card = TechCard(
            title="Complete Guide",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/guide",
            summary="A comprehensive FastAPI tutorial for building APIs"
        )

        score, highlights = SearchEngine.calculate_relevance_score(card, "FastAPI")

        assert score == 0.25  # Summary match only (25%)
        assert "摘要" in highlights

    def test_calculate_relevance_tag_match(self, test_db: Session):
        """Test relevance score for tag match"""
        card = TechCard(
            title="API Development",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/api",
            chinese_tags=["FastAPI", "Python", "Web开发"]
        )

        score, highlights = SearchEngine.calculate_relevance_score(card, "FastAPI")

        assert score == 0.15  # Tag match only (15%)
        assert any("标签:FastAPI" in h for h in highlights)

    def test_calculate_relevance_tech_stack_match(self, test_db: Session):
        """Test relevance score for tech stack match"""
        card = TechCard(
            title="Web Application",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/webapp",
            tech_stack=["FastAPI", "PostgreSQL", "Docker"]
        )

        score, highlights = SearchEngine.calculate_relevance_score(card, "FastAPI")

        assert score == 0.1  # Tech stack match only (10%)
        assert any("技术:FastAPI" in h for h in highlights)

    def test_calculate_relevance_multiple_matches(self, test_db: Session):
        """Test relevance score with multiple matches"""
        card = TechCard(
            title="FastAPI Complete Tutorial",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/tutorial",
            summary="Learn FastAPI from scratch",
            chinese_tags=["FastAPI", "教程"],
            tech_stack=["FastAPI", "Python"]
        )

        score, highlights = SearchEngine.calculate_relevance_score(card, "FastAPI")

        # Title (50%) + Summary (25%) + Tag (15%) + Tech (10%) = 100%
        assert score == 1.0
        assert len(highlights) == 4

    def test_calculate_relevance_no_match(self, test_db: Session):
        """Test relevance score with no match"""
        card = TechCard(
            title="Django Tutorial",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/django",
            summary="Complete Django guide",
            chinese_tags=["Django", "Python"],
            tech_stack=["Django"]
        )

        score, highlights = SearchEngine.calculate_relevance_score(card, "FastAPI")

        assert score == 0.0
        assert len(highlights) == 0

    def test_calculate_relevance_case_insensitive(self, test_db: Session):
        """Test relevance score is case-insensitive"""
        card = TechCard(
            title="fastapi tutorial",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/tutorial"
        )

        score1, _ = SearchEngine.calculate_relevance_score(card, "FastAPI")
        score2, _ = SearchEngine.calculate_relevance_score(card, "fastapi")
        score3, _ = SearchEngine.calculate_relevance_score(card, "FASTAPI")

        assert score1 == score2 == score3

    def test_calculate_relevance_partial_match(self, test_db: Session):
        """Test relevance score with partial match"""
        card = TechCard(
            title="FastAPI and FastStream Integration",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/integration"
        )

        score, highlights = SearchEngine.calculate_relevance_score(card, "Fast")

        assert score == 0.5  # Title match
        assert "标题" in highlights

    def test_calculate_relevance_null_fields(self, test_db: Session):
        """Test relevance score with null optional fields"""
        card = TechCard(
            title="FastAPI Tutorial",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/tutorial",
            summary=None,
            chinese_tags=None,
            tech_stack=None
        )

        score, highlights = SearchEngine.calculate_relevance_score(card, "FastAPI")

        assert score == 0.5  # Only title match
        assert len(highlights) == 1

    def test_generate_suggestions_basic(self, test_db: Session):
        """Test basic suggestion generation"""
        suggestions = SearchEngine.generate_suggestions("PyTorch", test_db)

        assert isinstance(suggestions, list)
        assert len(suggestions) <= 3
        # Should not suggest the query itself
        assert "PyTorch" not in suggestions

    def test_generate_suggestions_filters_query(self, test_db: Session):
        """Test suggestions filter out the query term"""
        suggestions = SearchEngine.generate_suggestions("深度学习", test_db)

        # Should not include the query term
        for sug in suggestions:
            assert "深度学习" not in sug

    def test_generate_suggestions_limit(self, test_db: Session):
        """Test suggestions are limited to 3"""
        suggestions = SearchEngine.generate_suggestions("test", test_db)

        assert len(suggestions) <= 3

    def test_generate_suggestions_empty_query(self, test_db: Session):
        """Test suggestions with empty query"""
        suggestions = SearchEngine.generate_suggestions("", test_db)

        assert isinstance(suggestions, list)
        assert len(suggestions) >= 0
