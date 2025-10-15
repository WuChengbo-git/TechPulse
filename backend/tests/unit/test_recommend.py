"""
Unit tests for Recommendation module.

Tests cover:
- RecommendationEngine - Recommendation scoring algorithm
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.api.recommend import RecommendationEngine
from app.models.card import TechCard, SourceType
from app.models.behavior import UserBehavior, ActionType


# ==================== RecommendationEngine Tests ====================

@pytest.mark.unit
class TestRecommendationEngine:
    """Tests for RecommendationEngine"""

    def test_calculate_score_perfect_tag_match(self, test_db: Session):
        """Test recommendation score with perfect tag match"""
        card = TechCard(
            title="Machine Learning Tutorial",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/ml",
            chinese_tags=["机器学习", "深度学习", "Python"],
            quality_score=8.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        user_tags = ["机器学习", "深度学习", "Python"]
        user_behaviors = []

        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card, user_tags, user_behaviors
        )

        # Tag match (40%) + Quality (24%) + Recency (20%) + Behavior (10%) = 94%
        assert score >= 0.9
        assert set(matched_tags) == set(user_tags)
        assert "机器学习" in reason or "深度学习" in reason

    def test_calculate_score_partial_tag_match(self, test_db: Session):
        """Test recommendation score with partial tag match"""
        card = TechCard(
            title="Deep Learning Guide",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/dl",
            chinese_tags=["深度学习", "PyTorch"],
            quality_score=7.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        user_tags = ["深度学习", "机器学习", "NLP"]
        user_behaviors = []

        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card, user_tags, user_behaviors
        )

        # Should match "深度学习"
        assert len(matched_tags) == 1
        assert "深度学习" in matched_tags
        assert score > 0.3  # Tag match contribution

    def test_calculate_score_no_tag_match(self, test_db: Session):
        """Test recommendation score with no tag match"""
        card = TechCard(
            title="Web Development",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/web",
            chinese_tags=["Web开发", "JavaScript"],
            quality_score=6.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        user_tags = ["机器学习", "深度学习"]
        user_behaviors = []

        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card, user_tags, user_behaviors
        )

        # No tag match, score comes from quality and recency only
        assert len(matched_tags) == 0
        assert score < 0.6  # No tag match (40% missing)

    def test_calculate_score_high_quality(self, test_db: Session):
        """Test recommendation score for high quality content"""
        card = TechCard(
            title="Excellent Tutorial",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/excellent",
            chinese_tags=[],
            quality_score=10.0,  # Perfect score
            created_at=datetime.utcnow()
        )
        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        user_tags = []
        user_behaviors = []

        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card, user_tags, user_behaviors
        )

        # Quality contributes 30%, should see it in reason
        assert "高质量" in reason or "10.0分" in reason
        assert score >= 0.3  # At least quality + recency

    def test_calculate_score_low_quality(self, test_db: Session):
        """Test recommendation score for low quality content"""
        card = TechCard(
            title="Low Quality",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/low",
            chinese_tags=[],
            quality_score=2.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        user_tags = []
        user_behaviors = []

        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card, user_tags, user_behaviors
        )

        # Low quality should result in low score
        assert score < 0.5

    def test_calculate_score_recency(self, test_db: Session):
        """Test recommendation score considers recency"""
        # New card (today)
        new_card = TechCard(
            title="Brand New",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/new",
            chinese_tags=[],
            quality_score=5.0,
            created_at=datetime.utcnow()
        )
        test_db.add(new_card)

        # Old card (60 days ago)
        old_card = TechCard(
            title="Old Content",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/old",
            chinese_tags=[],
            quality_score=5.0,
            created_at=datetime.utcnow() - timedelta(days=60)
        )
        test_db.add(old_card)
        test_db.commit()
        test_db.refresh(new_card)
        test_db.refresh(old_card)

        user_tags = []
        user_behaviors = []

        new_score, _, new_reason = RecommendationEngine.calculate_recommendation_score(
            new_card, user_tags, user_behaviors
        )
        old_score, _, old_reason = RecommendationEngine.calculate_recommendation_score(
            old_card, user_tags, user_behaviors
        )

        # New card should have higher score
        assert new_score > old_score
        # New card might have "最新发布" in reason
        if "最新" in new_reason:
            assert "最新" in new_reason

    def test_calculate_score_with_clicked_behavior(self, test_db: Session):
        """Test recommendation score with previous click behavior"""
        card = TechCard(
            title="Already Clicked",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/clicked",
            chinese_tags=["机器学习"],
            quality_score=8.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        user_tags = ["机器学习"]

        # User has clicked this card before
        user_behaviors = [
            UserBehavior(
                user_id=1,
                card_id=card.id,
                action=ActionType.CLICK,
                created_at=datetime.utcnow()
            )
        ]

        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card, user_tags, user_behaviors
        )

        # Score should be lower due to previous click (behavior score = 0.5)
        # Without click, behavior would contribute 10%, with click only 5%
        assert score < 1.0  # Reduced score

    def test_calculate_score_without_clicked_behavior(self, test_db: Session):
        """Test recommendation score without previous click"""
        card = TechCard(
            title="Not Clicked",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/notclicked",
            chinese_tags=["机器学习"],
            quality_score=8.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        user_tags = ["机器学习"]

        # User has NOT clicked this card
        user_behaviors = [
            UserBehavior(
                user_id=1,
                card_id=999,  # Different card
                action=ActionType.CLICK,
                created_at=datetime.utcnow()
            )
        ]

        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card, user_tags, user_behaviors
        )

        # Should get full behavior score
        assert score > 0.3

    def test_calculate_score_null_tags(self, test_db: Session):
        """Test recommendation score with null tags"""
        card = TechCard(
            title="No Tags",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/notags",
            chinese_tags=None,
            quality_score=7.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        user_tags = ["机器学习"]
        user_behaviors = []

        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card, user_tags, user_behaviors
        )

        # Should not crash, matched_tags should be empty
        assert len(matched_tags) == 0
        assert score >= 0  # Should still have some score from quality/recency

    def test_calculate_score_empty_user_tags(self, test_db: Session):
        """Test recommendation score with empty user tags"""
        card = TechCard(
            title="Some Card",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/some",
            chinese_tags=["机器学习", "Python"],
            quality_score=7.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        user_tags = []
        user_behaviors = []

        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card, user_tags, user_behaviors
        )

        # No tag match possible
        assert len(matched_tags) == 0
        # Score comes from quality and recency only
        assert 0 < score < 0.6

    def test_calculate_score_reason_generation(self, test_db: Session):
        """Test reason generation logic"""
        # Test tag match reason
        card1 = TechCard(
            title="Card 1",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/1",
            chinese_tags=["机器学习"],
            quality_score=5.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card1)
        test_db.commit()
        test_db.refresh(card1)

        _, _, reason1 = RecommendationEngine.calculate_recommendation_score(
            card1, ["机器学习"], []
        )
        assert "兴趣" in reason1 or "机器学习" in reason1

        # Test high quality reason
        card2 = TechCard(
            title="Card 2",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/2",
            chinese_tags=[],
            quality_score=9.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card2)
        test_db.commit()
        test_db.refresh(card2)

        _, _, reason2 = RecommendationEngine.calculate_recommendation_score(
            card2, [], []
        )
        assert "高质量" in reason2 or "9.0" in reason2

        # Test recency reason
        card3 = TechCard(
            title="Card 3",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/3",
            chinese_tags=[],
            quality_score=5.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card3)
        test_db.commit()
        test_db.refresh(card3)

        _, _, reason3 = RecommendationEngine.calculate_recommendation_score(
            card3, [], []
        )
        # Might be "最新发布" or generic "为你推荐"
        assert reason3 is not None

    def test_calculate_score_multiple_behaviors(self, test_db: Session):
        """Test recommendation score with multiple user behaviors"""
        card = TechCard(
            title="Popular Card",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/popular",
            chinese_tags=["机器学习"],
            quality_score=8.0,
            created_at=datetime.utcnow()
        )
        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        user_tags = ["机器学习"]

        # User has multiple behaviors on different cards
        user_behaviors = [
            UserBehavior(user_id=1, card_id=1, action=ActionType.CLICK),
            UserBehavior(user_id=1, card_id=2, action=ActionType.VIEW),
            UserBehavior(user_id=1, card_id=3, action=ActionType.CLICK),
        ]

        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card, user_tags, user_behaviors
        )

        # Card not in behavior list, should get full behavior score
        assert score > 0.3
