"""
Unit tests for TechCard model.

Tests cover:
- Model creation and validation
- Enum types (SourceType, TrialStatus)
- Default values
- Field constraints
- JSON fields handling
"""
import pytest
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.card import TechCard, SourceType, TrialStatus


# ==================== Enum Tests ====================

@pytest.mark.unit
class TestSourceTypeEnum:
    """Tests for SourceType enum"""

    def test_source_type_values(self):
        """Test SourceType enum values"""
        assert SourceType.GITHUB.value == "github"
        assert SourceType.ARXIV.value == "arxiv"
        assert SourceType.HUGGINGFACE.value == "huggingface"
        assert SourceType.ZENN.value == "zenn"

    def test_source_type_members(self):
        """Test all SourceType members"""
        members = [e.value for e in SourceType]
        assert "github" in members
        assert "arxiv" in members
        assert "huggingface" in members
        assert "zenn" in members
        assert len(members) == 4


@pytest.mark.unit
class TestTrialStatusEnum:
    """Tests for TrialStatus enum"""

    def test_trial_status_values(self):
        """Test TrialStatus enum values"""
        assert TrialStatus.NOT_TRIED.value == "not_tried"
        assert TrialStatus.TRIED.value == "tried"
        assert TrialStatus.FAILED.value == "failed"
        assert TrialStatus.SUCCESS.value == "success"

    def test_trial_status_members(self):
        """Test all TrialStatus members"""
        members = [e.value for e in TrialStatus]
        assert "not_tried" in members
        assert "tried" in members
        assert "failed" in members
        assert "success" in members
        assert len(members) == 4


# ==================== Model Creation Tests ====================

@pytest.mark.unit
class TestTechCardModel:
    """Tests for TechCard model"""

    def test_create_card_minimal(self, test_db: Session):
        """Test creating a card with minimal required fields"""
        card = TechCard(
            title="Test Card",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/repo"
        )

        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        assert card.id is not None
        assert card.title == "Test Card"
        assert card.source == SourceType.GITHUB
        assert card.original_url == "https://github.com/test/repo"

    def test_create_card_full_fields(self, test_db: Session):
        """Test creating a card with all fields"""
        card = TechCard(
            title="Full Featured Card",
            source=SourceType.HUGGINGFACE,
            original_url="https://huggingface.co/test/model",
            summary="A comprehensive test card",
            chinese_tags=["测试", "机器学习"],
            ai_category=["LLM", "NLP"],
            tech_stack=["Python", "PyTorch"],
            license="MIT",
            stars=1000,
            forks=200,
            issues=50,
            quality_score=8.5,
            trial_suggestion="Worth trying",
            status=TrialStatus.TRIED,
            trial_notes="Tested successfully",
            notion_page_id="abc123",
            raw_data={"key": "value"}
        )

        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        assert card.id is not None
        assert card.title == "Full Featured Card"
        assert card.chinese_tags == ["测试", "机器学习"]
        assert card.ai_category == ["LLM", "NLP"]
        assert card.tech_stack == ["Python", "PyTorch"]
        assert card.stars == 1000
        assert card.quality_score == 8.5
        assert card.status == TrialStatus.TRIED

    def test_card_default_values(self, test_db: Session):
        """Test default values for optional fields"""
        card = TechCard(
            title="Default Card",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/default"
        )

        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        # Test defaults
        assert card.stars == 0
        assert card.forks == 0
        assert card.issues == 0
        assert card.quality_score == 5.0
        assert card.status == TrialStatus.NOT_TRIED

    def test_card_timestamps(self, test_db: Session):
        """Test automatic timestamp fields"""
        card = TechCard(
            title="Timestamp Card",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/time"
        )

        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        # created_at should be set
        assert card.created_at is not None
        assert isinstance(card.created_at, datetime)

        # updated_at should be set
        assert card.updated_at is not None
        assert isinstance(card.updated_at, datetime)

    def test_card_json_fields(self, test_db: Session):
        """Test JSON field handling"""
        test_tags = ["AI", "机器学习", "深度学习"]
        test_categories = ["LLM", "CV", "NLP"]
        test_stack = ["Python", "PyTorch", "FastAPI"]
        test_raw = {
            "author": "test",
            "description": "test description",
            "metadata": {"version": "1.0"}
        }

        card = TechCard(
            title="JSON Test Card",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/json",
            chinese_tags=test_tags,
            ai_category=test_categories,
            tech_stack=test_stack,
            raw_data=test_raw
        )

        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        # Verify JSON fields are properly stored and retrieved
        assert card.chinese_tags == test_tags
        assert card.ai_category == test_categories
        assert card.tech_stack == test_stack
        assert card.raw_data == test_raw

    def test_card_long_title(self, test_db: Session):
        """Test card with long title (max 500 chars)"""
        long_title = "A" * 500  # Max length

        card = TechCard(
            title=long_title,
            source=SourceType.GITHUB,
            original_url="https://github.com/test/long"
        )

        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        assert card.title == long_title
        assert len(card.title) == 500

    def test_card_long_url(self, test_db: Session):
        """Test card with long URL (max 1000 chars)"""
        base_url = "https://github.com/test/repo"
        long_url = base_url + "?" + ("param=value&" * 100)
        long_url = long_url[:1000]  # Truncate to max length

        card = TechCard(
            title="Long URL Card",
            source=SourceType.GITHUB,
            original_url=long_url
        )

        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        assert card.original_url == long_url

    def test_card_text_fields(self, test_db: Session):
        """Test Text fields (summary, trial_suggestion, trial_notes)"""
        long_text = "This is a very long text. " * 100  # ~2700 chars

        card = TechCard(
            title="Text Fields Card",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/text",
            summary=long_text,
            trial_suggestion=long_text,
            trial_notes=long_text
        )

        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        assert card.summary == long_text
        assert card.trial_suggestion == long_text
        assert card.trial_notes == long_text


# ==================== Model Field Constraints Tests ====================

@pytest.mark.unit
class TestTechCardConstraints:
    """Tests for field constraints and validation"""

    def test_card_quality_score_range(self, test_db: Session):
        """Test quality score can be set to various values"""
        # Minimum
        card1 = TechCard(
            title="Low Score",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/low",
            quality_score=0.0
        )
        test_db.add(card1)
        test_db.commit()
        test_db.refresh(card1)
        assert card1.quality_score == 0.0

        # Maximum
        card2 = TechCard(
            title="High Score",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/high",
            quality_score=10.0
        )
        test_db.add(card2)
        test_db.commit()
        test_db.refresh(card2)
        assert card2.quality_score == 10.0

        # Decimal
        card3 = TechCard(
            title="Decimal Score",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/decimal",
            quality_score=7.5
        )
        test_db.add(card3)
        test_db.commit()
        test_db.refresh(card3)
        assert card3.quality_score == 7.5

    def test_card_github_stats(self, test_db: Session):
        """Test GitHub statistics fields"""
        card = TechCard(
            title="GitHub Stats",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/stats",
            stars=50000,
            forks=10000,
            issues=500
        )

        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        assert card.stars == 50000
        assert card.forks == 10000
        assert card.issues == 500

    def test_card_empty_json_fields(self, test_db: Session):
        """Test cards with empty JSON fields"""
        card = TechCard(
            title="Empty JSON",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/empty",
            chinese_tags=[],
            ai_category=[],
            tech_stack=[]
        )

        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        assert card.chinese_tags == []
        assert card.ai_category == []
        assert card.tech_stack == []

    def test_card_null_optional_fields(self, test_db: Session):
        """Test cards with null optional fields"""
        card = TechCard(
            title="Null Fields",
            source=SourceType.GITHUB,
            original_url="https://github.com/test/null",
            summary=None,
            chinese_tags=None,
            trial_suggestion=None,
            notion_page_id=None
        )

        test_db.add(card)
        test_db.commit()
        test_db.refresh(card)

        assert card.summary is None
        assert card.chinese_tags is None
        assert card.trial_suggestion is None
        assert card.notion_page_id is None


# ==================== Model Relationships and Queries Tests ====================

@pytest.mark.unit
class TestTechCardQueries:
    """Tests for querying TechCard models"""

    def test_query_by_source(self, test_db: Session):
        """Test querying cards by source"""
        # Create cards from different sources
        card1 = TechCard(title="GitHub 1", source=SourceType.GITHUB,
                        original_url="https://github.com/test/1")
        card2 = TechCard(title="GitHub 2", source=SourceType.GITHUB,
                        original_url="https://github.com/test/2")
        card3 = TechCard(title="ArXiv 1", source=SourceType.ARXIV,
                        original_url="https://arxiv.org/test/1")

        test_db.add_all([card1, card2, card3])
        test_db.commit()

        # Query GitHub cards
        github_cards = test_db.query(TechCard).filter(
            TechCard.source == SourceType.GITHUB
        ).all()

        assert len(github_cards) == 2
        for card in github_cards:
            assert card.source == SourceType.GITHUB

    def test_query_by_status(self, test_db: Session):
        """Test querying cards by trial status"""
        card1 = TechCard(title="Not Tried", source=SourceType.GITHUB,
                        original_url="https://github.com/test/1",
                        status=TrialStatus.NOT_TRIED)
        card2 = TechCard(title="Tried", source=SourceType.GITHUB,
                        original_url="https://github.com/test/2",
                        status=TrialStatus.TRIED)
        card3 = TechCard(title="Success", source=SourceType.GITHUB,
                        original_url="https://github.com/test/3",
                        status=TrialStatus.SUCCESS)

        test_db.add_all([card1, card2, card3])
        test_db.commit()

        # Query by status
        tried_cards = test_db.query(TechCard).filter(
            TechCard.status == TrialStatus.TRIED
        ).all()

        assert len(tried_cards) == 1
        assert tried_cards[0].status == TrialStatus.TRIED

    def test_query_by_quality_score(self, test_db: Session):
        """Test querying cards by quality score"""
        card1 = TechCard(title="Low Quality", source=SourceType.GITHUB,
                        original_url="https://github.com/test/1",
                        quality_score=3.0)
        card2 = TechCard(title="High Quality", source=SourceType.GITHUB,
                        original_url="https://github.com/test/2",
                        quality_score=9.5)
        card3 = TechCard(title="Medium Quality", source=SourceType.GITHUB,
                        original_url="https://github.com/test/3",
                        quality_score=7.0)

        test_db.add_all([card1, card2, card3])
        test_db.commit()

        # Query high quality cards (>= 8.0)
        high_quality = test_db.query(TechCard).filter(
            TechCard.quality_score >= 8.0
        ).all()

        assert len(high_quality) == 1
        assert high_quality[0].quality_score == 9.5

    def test_order_by_created_at(self, test_db: Session):
        """Test ordering cards by creation time"""
        from datetime import datetime, timedelta

        # Create cards with explicit timestamps
        now = datetime.utcnow()

        card1 = TechCard(title="First", source=SourceType.GITHUB,
                        original_url="https://github.com/test/1")
        card1.created_at = now - timedelta(seconds=10)
        test_db.add(card1)
        test_db.commit()
        test_db.refresh(card1)

        card2 = TechCard(title="Second", source=SourceType.GITHUB,
                        original_url="https://github.com/test/2")
        card2.created_at = now
        test_db.add(card2)
        test_db.commit()
        test_db.refresh(card2)

        # Query ordered by created_at desc
        cards = test_db.query(TechCard).order_by(
            TechCard.created_at.desc()
        ).all()

        assert len(cards) == 2
        # Second should be first (most recent)
        assert cards[0].id == card2.id
        assert cards[1].id == card1.id

    def test_count_cards(self, test_db: Session):
        """Test counting cards"""
        # Create multiple cards
        for i in range(5):
            card = TechCard(
                title=f"Card {i}",
                source=SourceType.GITHUB,
                original_url=f"https://github.com/test/{i}"
            )
            test_db.add(card)
        test_db.commit()

        # Count all cards
        count = test_db.query(TechCard).count()
        assert count == 5

        # Count by source
        github_count = test_db.query(TechCard).filter(
            TechCard.source == SourceType.GITHUB
        ).count()
        assert github_count == 5
