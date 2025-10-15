"""
Integration tests for Recommendation API endpoints.

Tests cover:
- GET /api/v1/recommendations - Get personalized recommendations
- POST /api/v1/recommendations/refresh - Refresh recommendations
- POST /api/v1/recommendations/{id}/click - Mark recommendation clicked
- GET /api/v1/recommendations/stats - Get recommendation statistics
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.card import TechCard, SourceType
from app.models.user_preference import UserPreference
from app.models.behavior import UserBehavior, ActionType, UserRecommendation


# ==================== Test Fixtures ====================

@pytest.fixture
def recommend_test_cards(test_db: Session):
    """Create cards for recommendation testing"""
    cards = []

    # High quality ML cards
    for i in range(3):
        card = TechCard(
            title=f"Machine Learning Project {i+1}",
            source=SourceType.GITHUB,
            original_url=f"https://github.com/test/ml-{i}",
            summary=f"ML project {i+1}",
            chinese_tags=["机器学习", "Python", "深度学习"],
            tech_stack=["Python", "PyTorch"],
            quality_score=8.0 + i * 0.5,
            created_at=datetime.utcnow() - timedelta(days=i)
        )
        test_db.add(card)
        cards.append(card)

    # Web development cards
    for i in range(2):
        card = TechCard(
            title=f"Web Development {i+1}",
            source=SourceType.GITHUB,
            original_url=f"https://github.com/test/web-{i}",
            summary=f"Web dev {i+1}",
            chinese_tags=["Web开发", "JavaScript", "React"],
            tech_stack=["JavaScript", "React"],
            quality_score=7.0,
            created_at=datetime.utcnow() - timedelta(days=i)
        )
        test_db.add(card)
        cards.append(card)

    # Old card (should rank lower)
    old_card = TechCard(
        title="Old ML Article",
        source=SourceType.ARXIV,
        original_url="https://arxiv.org/abs/old",
        summary="Old content",
        chinese_tags=["机器学习"],
        quality_score=7.0,
        created_at=datetime.utcnow() - timedelta(days=90)
    )
    test_db.add(old_card)
    cards.append(old_card)

    test_db.commit()
    for card in cards:
        test_db.refresh(card)

    return cards


@pytest.fixture
def user_preferences_ml(test_db: Session, test_user):
    """Create ML preferences for test user"""
    prefs = [
        UserPreference(
            user_id=test_user.id,
            preference_type='tag',
            preference_value='机器学习'
        ),
        UserPreference(
            user_id=test_user.id,
            preference_type='tag',
            preference_value='深度学习'
        ),
        UserPreference(
            user_id=test_user.id,
            preference_type='tag',
            preference_value='Python'
        )
    ]

    for pref in prefs:
        test_db.add(pref)
    test_db.commit()

    return prefs


# ==================== GET /recommendations Tests ====================

@pytest.mark.integration
@pytest.mark.api
class TestGetRecommendations:
    """Tests for GET /api/v1/recommendations endpoint"""

    def test_get_recommendations_with_preferences(
        self, client: TestClient, test_user, recommend_test_cards, user_preferences_ml
    ):
        """Test getting recommendations with user preferences"""
        response = client.get(f"/api/v1/recommendations?user_id={test_user.id}")

        assert response.status_code == 200
        data = response.json()

        assert "recommendations" in data
        assert "total" in data
        assert "user_tags" in data

        # Should return ML-related cards (matching preferences)
        assert data["total"] > 0
        assert len(data["user_tags"]) == 3

    def test_get_recommendations_without_preferences(
        self, client: TestClient, test_user, recommend_test_cards, test_db: Session
    ):
        """Test getting recommendations without user preferences"""
        # Ensure no preferences exist
        test_db.query(UserPreference).filter(
            UserPreference.user_id == test_user.id
        ).delete()
        test_db.commit()

        response = client.get(f"/api/v1/recommendations?user_id={test_user.id}")

        assert response.status_code == 200
        data = response.json()

        # Should return high quality content as fallback
        assert "recommendations" in data
        assert "message" in data
        assert "兴趣标签" in data["message"]

    def test_get_recommendations_with_limit(
        self, client: TestClient, test_user, recommend_test_cards, user_preferences_ml
    ):
        """Test getting recommendations with limit"""
        response = client.get(
            f"/api/v1/recommendations?user_id={test_user.id}&limit=2"
        )

        assert response.status_code == 200
        data = response.json()

        assert len(data["recommendations"]) <= 2

    def test_get_recommendations_with_min_score(
        self, client: TestClient, test_user, recommend_test_cards, user_preferences_ml
    ):
        """Test getting recommendations with minimum score filter"""
        response = client.get(
            f"/api/v1/recommendations?user_id={test_user.id}&min_score=0.5"
        )

        assert response.status_code == 200
        data = response.json()

        # All recommendations should have score >= 0.5
        for rec in data["recommendations"]:
            assert rec["score"] >= 0.5

    def test_get_recommendations_scoring(
        self, client: TestClient, test_user, recommend_test_cards, user_preferences_ml
    ):
        """Test recommendations are properly scored"""
        response = client.get(f"/api/v1/recommendations?user_id={test_user.id}")

        assert response.status_code == 200
        data = response.json()

        recommendations = data["recommendations"]
        if len(recommendations) > 1:
            # Should be sorted by score (descending)
            for i in range(len(recommendations) - 1):
                assert recommendations[i]["score"] >= recommendations[i + 1]["score"]

    def test_get_recommendations_matched_tags(
        self, client: TestClient, test_user, recommend_test_cards, user_preferences_ml
    ):
        """Test recommendations include matched tags"""
        response = client.get(f"/api/v1/recommendations?user_id={test_user.id}")

        assert response.status_code == 200
        data = response.json()

        # At least some recommendations should have matched tags
        has_matched_tags = any(
            len(rec["matched_tags"]) > 0
            for rec in data["recommendations"]
        )
        assert has_matched_tags

    def test_get_recommendations_creates_records(
        self, client: TestClient, test_db: Session, test_user,
        recommend_test_cards, user_preferences_ml
    ):
        """Test getting recommendations creates UserRecommendation records"""
        response = client.get(f"/api/v1/recommendations?user_id={test_user.id}")

        assert response.status_code == 200

        # Verify recommendation records were created
        records = test_db.query(UserRecommendation).filter(
            UserRecommendation.user_id == test_user.id
        ).all()

        assert len(records) > 0

    def test_get_recommendations_result_structure(
        self, client: TestClient, test_user, recommend_test_cards, user_preferences_ml
    ):
        """Test recommendation result structure"""
        response = client.get(f"/api/v1/recommendations?user_id={test_user.id}")

        assert response.status_code == 200
        data = response.json()

        if data["total"] > 0:
            rec = data["recommendations"][0]

            assert "card" in rec
            assert "score" in rec
            assert "reason" in rec
            assert "matched_tags" in rec

            # Check card structure
            assert "id" in rec["card"]
            assert "title" in rec["card"]
            assert "quality_score" in rec["card"]

    def test_get_recommendations_missing_user_id(self, client: TestClient):
        """Test getting recommendations without user_id"""
        response = client.get("/api/v1/recommendations")

        assert response.status_code == 422  # Validation error

    def test_get_recommendations_invalid_limit(self, client: TestClient, test_user):
        """Test getting recommendations with invalid limit"""
        response = client.get(
            f"/api/v1/recommendations?user_id={test_user.id}&limit=100"
        )

        assert response.status_code == 422  # Exceeds max limit of 50


# ==================== POST /recommendations/refresh Tests ====================

@pytest.mark.integration
@pytest.mark.api
class TestRefreshRecommendations:
    """Tests for POST /api/v1/recommendations/refresh endpoint"""

    def test_refresh_recommendations_basic(
        self, client: TestClient, test_user, recommend_test_cards, user_preferences_ml
    ):
        """Test basic refresh recommendations"""
        response = client.post(
            f"/api/v1/recommendations/refresh?user_id={test_user.id}&limit=5"
        )

        assert response.status_code == 200
        data = response.json()

        assert "recommendations" in data
        assert "total" in data

    def test_refresh_recommendations_exclude_ids(
        self, client: TestClient, test_user, recommend_test_cards, user_preferences_ml
    ):
        """Test refresh with excluded IDs"""
        # Get initial recommendations
        response1 = client.get(f"/api/v1/recommendations?user_id={test_user.id}&limit=3")
        data1 = response1.json()

        if len(data1["recommendations"]) >= 2:
            # Exclude first 2 cards
            exclude_ids = [rec["card"]["id"] for rec in data1["recommendations"][:2]]

            # Build query string with multiple exclude_ids
            exclude_params = "&".join([f"exclude_ids={id}" for id in exclude_ids])

            # Refresh with exclusions - request more cards
            response2 = client.post(
                f"/api/v1/recommendations/refresh?user_id={test_user.id}&limit=10&{exclude_params}"
            )

            assert response2.status_code == 200
            data2 = response2.json()

            # Excluded IDs should not appear in new results
            new_ids = [rec["card"]["id"] for rec in data2["recommendations"]]
            for excluded_id in exclude_ids:
                assert excluded_id not in new_ids, f"Excluded ID {excluded_id} found in new results: {new_ids}"

    def test_refresh_recommendations_without_preferences(
        self, client: TestClient, test_user, recommend_test_cards
    ):
        """Test refresh without user preferences"""
        response = client.post(
            f"/api/v1/recommendations/refresh?user_id={test_user.id}"
        )

        assert response.status_code == 200
        data = response.json()

        # Should return empty with message
        assert "message" in data
        assert "兴趣标签" in data["message"]


# ==================== POST /recommendations/{id}/click Tests ====================

@pytest.mark.integration
@pytest.mark.api
class TestMarkRecommendationClicked:
    """Tests for POST /api/v1/recommendations/{id}/click endpoint"""

    def test_mark_recommendation_clicked_success(
        self, client: TestClient, test_db: Session, test_user, recommend_test_cards
    ):
        """Test marking recommendation as clicked"""
        # Create a recommendation record
        rec = UserRecommendation(
            user_id=test_user.id,
            card_id=recommend_test_cards[0].id,
            score=85,
            reason="Test",
            matched_tags="机器学习"
        )
        test_db.add(rec)
        test_db.commit()
        test_db.refresh(rec)

        response = client.post(f"/api/v1/recommendations/{rec.id}/click")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True

        # Verify in database
        test_db.refresh(rec)
        assert rec.is_clicked == 1
        assert rec.clicked_at is not None

    def test_mark_recommendation_clicked_not_found(self, client: TestClient):
        """Test marking non-existent recommendation"""
        response = client.post("/api/v1/recommendations/99999/click")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is False


# ==================== GET /recommendations/stats Tests ====================

@pytest.mark.integration
@pytest.mark.api
class TestGetRecommendationStats:
    """Tests for GET /api/v1/recommendations/stats endpoint"""

    def test_get_stats_basic(
        self, client: TestClient, test_db: Session, test_user, recommend_test_cards
    ):
        """Test getting basic recommendation stats"""
        # Create some recommendation records
        for i in range(5):
            rec = UserRecommendation(
                user_id=test_user.id,
                card_id=recommend_test_cards[i % len(recommend_test_cards)].id,
                score=80,
                is_clicked=1 if i < 2 else 0  # 2 clicked out of 5
            )
            test_db.add(rec)
        test_db.commit()

        response = client.get("/api/v1/recommendations/stats")

        assert response.status_code == 200
        data = response.json()

        assert "total_recommendations" in data
        assert "clicked_recommendations" in data
        assert "click_rate" in data
        assert "period_days" in data

        assert data["total_recommendations"] >= 5
        assert data["clicked_recommendations"] >= 2
        assert data["click_rate"] == 40.0  # 2/5 = 40%

    def test_get_stats_for_specific_user(
        self, client: TestClient, test_db: Session, test_user, recommend_test_cards
    ):
        """Test getting stats for specific user"""
        # Create recommendations for test_user
        for i in range(3):
            rec = UserRecommendation(
                user_id=test_user.id,
                card_id=recommend_test_cards[i].id,
                score=80,
                is_clicked=1
            )
            test_db.add(rec)
        test_db.commit()

        response = client.get(f"/api/v1/recommendations/stats?user_id={test_user.id}")

        assert response.status_code == 200
        data = response.json()

        assert data["total_recommendations"] >= 3

    def test_get_stats_with_days_filter(
        self, client: TestClient, test_db: Session, test_user, recommend_test_cards
    ):
        """Test getting stats with days filter"""
        # Create old recommendation (beyond filter)
        old_rec = UserRecommendation(
            user_id=test_user.id,
            card_id=recommend_test_cards[0].id,
            score=80,
            created_at=datetime.utcnow() - timedelta(days=10)
        )
        test_db.add(old_rec)
        test_db.commit()

        # Query for last 7 days
        response = client.get("/api/v1/recommendations/stats?days=7")

        assert response.status_code == 200
        data = response.json()

        assert data["period_days"] == 7

    def test_get_stats_no_recommendations(self, client: TestClient):
        """Test getting stats with no recommendations"""
        response = client.get("/api/v1/recommendations/stats?days=1")

        assert response.status_code == 200
        data = response.json()

        assert data["click_rate"] == 0  # No recommendations, 0% click rate

    def test_get_stats_all_clicked(
        self, client: TestClient, test_db: Session, test_user, recommend_test_cards
    ):
        """Test stats when all recommendations are clicked"""
        # Create all clicked recommendations
        for i in range(3):
            rec = UserRecommendation(
                user_id=test_user.id,
                card_id=recommend_test_cards[i].id,
                score=80,
                is_clicked=1
            )
            test_db.add(rec)
        test_db.commit()

        response = client.get(f"/api/v1/recommendations/stats?user_id={test_user.id}")

        assert response.status_code == 200
        data = response.json()

        assert data["click_rate"] == 100.0  # 100% clicked
