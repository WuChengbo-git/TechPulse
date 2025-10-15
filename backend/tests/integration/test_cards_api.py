"""
Integration tests for Cards API endpoints.

Tests cover:
- GET /api/v1/cards - List cards with filters
- GET /api/v1/cards/stats - Get card statistics
- GET /api/v1/cards/overview-stats - Get overview statistics
- GET /api/v1/cards/{id} - Get card by ID
- POST /api/v1/cards - Create new card
- PUT /api/v1/cards/{id} - Update card
- DELETE /api/v1/cards/{id} - Delete card
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.card import TechCard, SourceType, TrialStatus


# ==================== Test Fixtures ====================

@pytest.fixture
def sample_card_data():
    """Sample card data for testing"""
    return {
        "title": "GPT-4 Vision API",
        "source": "github",
        "original_url": "https://github.com/openai/gpt-4-vision",
        "summary": "Official OpenAI GPT-4 Vision API implementation",
        "chinese_tags": ["机器学习", "视觉", "GPT"],
        "ai_category": ["LLM", "CV"],
        "tech_stack": ["Python", "PyTorch"],
        "license": "MIT",
        "stars": 15000,
        "forks": 2500,
        "issues": 120,
        "quality_score": 9.5,
        "trial_suggestion": "Excellent vision model for production use",
        "status": "not_tried"
    }


@pytest.fixture
def sample_cards(test_db: Session):
    """Create multiple sample cards in database"""
    cards = [
        TechCard(
            title="Llama 3.1 Model",
            source=SourceType.HUGGINGFACE,
            original_url="https://huggingface.co/meta-llama/llama-3.1",
            summary="Meta's latest open source LLM",
            chinese_tags=["大语言模型", "开源"],
            ai_category=["LLM"],
            tech_stack=["Python", "PyTorch"],
            license="Apache-2.0",
            stars=25000,
            quality_score=9.8,
            status=TrialStatus.SUCCESS
        ),
        TechCard(
            title="Stable Diffusion XL",
            source=SourceType.GITHUB,
            original_url="https://github.com/stability-ai/sdxl",
            summary="High-quality image generation model",
            chinese_tags=["图像生成", "扩散模型"],
            ai_category=["CV", "GenerativeAI"],
            tech_stack=["Python", "PyTorch"],
            stars=18000,
            quality_score=9.2,
            status=TrialStatus.TRIED
        ),
        TechCard(
            title="BERT for NLP",
            source=SourceType.ARXIV,
            original_url="https://arxiv.org/abs/1810.04805",
            summary="Bidirectional encoder representations from transformers",
            chinese_tags=["自然语言处理", "BERT"],
            ai_category=["NLP"],
            tech_stack=["Python", "TensorFlow"],
            stars=5000,
            quality_score=8.5,
            status=TrialStatus.NOT_TRIED
        ),
        TechCard(
            title="FastAPI Tutorial (Zenn)",
            source=SourceType.ZENN,
            original_url="https://zenn.dev/example/fastapi-tutorial",
            summary="Comprehensive FastAPI tutorial in Japanese",
            chinese_tags=["教程", "FastAPI"],
            tech_stack=["Python", "FastAPI"],
            quality_score=7.5,
            status=TrialStatus.NOT_TRIED
        ),
    ]

    for card in cards:
        test_db.add(card)
    test_db.commit()

    # Refresh to get IDs
    for card in cards:
        test_db.refresh(card)

    return cards


# ==================== GET /cards Tests ====================

@pytest.mark.integration
@pytest.mark.api
class TestGetCards:
    """Tests for GET /api/v1/cards endpoint"""

    def test_get_cards_basic(self, client: TestClient, sample_cards):
        """Test getting cards without filters"""
        response = client.get("/api/v1/cards/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4

        # Verify all expected cards are present
        titles = [card["title"] for card in data]
        assert "Llama 3.1 Model" in titles
        assert "Stable Diffusion XL" in titles
        assert "BERT for NLP" in titles
        assert "FastAPI Tutorial (Zenn)" in titles

    def test_get_cards_pagination(self, client: TestClient, sample_cards):
        """Test pagination with skip and limit"""
        # Get first 2 cards
        response = client.get("/api/v1/cards/?skip=0&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # Get next 2 cards
        response = client.get("/api/v1/cards/?skip=2&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_get_cards_filter_by_source(self, client: TestClient, sample_cards):
        """Test filtering cards by source"""
        response = client.get("/api/v1/cards/?source=github")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["source"] == "github"
        assert data[0]["title"] == "Stable Diffusion XL"

    def test_get_cards_filter_by_status(self, client: TestClient, sample_cards):
        """Test filtering cards by status"""
        response = client.get("/api/v1/cards/?status=not_tried")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # BERT and FastAPI Tutorial
        for card in data:
            assert card["status"] == "not_tried"

    def test_get_cards_search(self, client: TestClient, sample_cards):
        """Test searching cards by title"""
        response = client.get("/api/v1/cards/?search=FastAPI")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert "FastAPI" in data[0]["title"]

    def test_get_cards_combined_filters(self, client: TestClient, sample_cards):
        """Test combining multiple filters"""
        response = client.get("/api/v1/cards/?source=huggingface&status=success")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["source"] == "huggingface"
        assert data[0]["status"] == "success"

    def test_get_cards_empty_result(self, client: TestClient, sample_cards):
        """Test query that returns no results"""
        response = client.get("/api/v1/cards/?search=NonExistentCard")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    def test_get_cards_limit_validation(self, client: TestClient, sample_cards):
        """Test limit parameter validation"""
        # Limit too high (max is 100)
        response = client.get("/api/v1/cards/?limit=200")
        assert response.status_code == 422  # Validation error

        # Limit too low
        response = client.get("/api/v1/cards/?limit=0")
        assert response.status_code == 422

    def test_get_cards_skip_validation(self, client: TestClient, sample_cards):
        """Test skip parameter validation"""
        # Negative skip
        response = client.get("/api/v1/cards/?skip=-1")
        assert response.status_code == 422  # Validation error


# ==================== GET /cards/stats Tests ====================

@pytest.mark.integration
@pytest.mark.api
class TestGetCardsStats:
    """Tests for GET /api/v1/cards/stats endpoint"""

    def test_get_stats_basic(self, client: TestClient, sample_cards):
        """Test getting basic card statistics"""
        response = client.get("/api/v1/cards/stats")

        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "total_cards" in data
        assert "today_cards" in data
        assert "sources_stats" in data

        # Check values
        assert data["total_cards"] == 4
        assert data["today_cards"] == 4  # All created today

        # Check sources stats
        sources = data["sources_stats"]
        assert "github" in sources
        assert "huggingface" in sources
        assert "arxiv" in sources
        assert "zenn" in sources

        # Verify counts
        assert sources["github"]["total"] == 1
        assert sources["huggingface"]["total"] == 1
        assert sources["arxiv"]["total"] == 1
        assert sources["zenn"]["total"] == 1

    def test_get_stats_last_update(self, client: TestClient, sample_cards):
        """Test last_update field in stats"""
        response = client.get("/api/v1/cards/stats")

        assert response.status_code == 200
        data = response.json()
        sources = data["sources_stats"]

        # All sources should have last_update
        for source in ["github", "huggingface", "arxiv", "zenn"]:
            assert sources[source]["last_update"] is not None
            # Should be valid ISO format
            datetime.fromisoformat(sources[source]["last_update"])

    def test_get_stats_empty_database(self, client: TestClient, test_db: Session):
        """Test stats with no cards"""
        response = client.get("/api/v1/cards/stats")

        assert response.status_code == 200
        data = response.json()

        assert data["total_cards"] == 0
        assert data["today_cards"] == 0

        # All sources should have zero counts
        for source in ["github", "huggingface", "arxiv", "zenn"]:
            assert data["sources_stats"][source]["total"] == 0
            assert data["sources_stats"][source]["today"] == 0
            assert data["sources_stats"][source]["last_update"] is None


# ==================== GET /cards/overview-stats Tests ====================

@pytest.mark.integration
@pytest.mark.api
class TestGetOverviewStats:
    """Tests for GET /api/v1/cards/overview-stats endpoint"""

    def test_get_overview_stats_basic(self, client: TestClient, sample_cards):
        """Test getting overview statistics"""
        response = client.get("/api/v1/cards/overview-stats")

        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "total_cards" in data
        assert "today_cards" in data
        assert "sources_stats" in data
        assert "trending_tags" in data

        # Check values
        assert data["total_cards"] == 4
        assert data["today_cards"] == 4

    def test_get_overview_stats_sources(self, client: TestClient, sample_cards):
        """Test sources stats in overview"""
        response = client.get("/api/v1/cards/overview-stats")

        assert response.status_code == 200
        data = response.json()
        sources = data["sources_stats"]

        # Verify source counts (simpler format than /stats)
        assert sources["github"] == 1
        assert sources["huggingface"] == 1
        assert sources["arxiv"] == 1
        assert sources["zenn"] == 1

    def test_get_overview_stats_trending_tags(self, client: TestClient, sample_cards):
        """Test trending tags calculation"""
        response = client.get("/api/v1/cards/overview-stats")

        assert response.status_code == 200
        data = response.json()
        tags = data["trending_tags"]

        # Should have tags
        assert isinstance(tags, list)
        assert len(tags) > 0

        # Each tag should have tag and count
        for tag_item in tags:
            assert "tag" in tag_item
            assert "count" in tag_item
            assert isinstance(tag_item["tag"], str)
            assert isinstance(tag_item["count"], int)

        # Tags should be sorted by count (descending)
        if len(tags) > 1:
            assert tags[0]["count"] >= tags[1]["count"]

    def test_get_overview_stats_empty(self, client: TestClient, test_db: Session):
        """Test overview stats with no cards"""
        response = client.get("/api/v1/cards/overview-stats")

        assert response.status_code == 200
        data = response.json()

        assert data["total_cards"] == 0
        assert data["today_cards"] == 0
        assert data["trending_tags"] == []


# ==================== GET /cards/{id} Tests ====================

@pytest.mark.integration
@pytest.mark.api
class TestGetCardById:
    """Tests for GET /api/v1/cards/{id} endpoint"""

    def test_get_card_by_id_success(self, client: TestClient, sample_cards):
        """Test getting a card by valid ID"""
        card_id = sample_cards[0].id
        response = client.get(f"/api/v1/cards/{card_id}")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == card_id
        assert data["title"] == sample_cards[0].title
        assert data["source"] == sample_cards[0].source.value
        assert data["original_url"] == sample_cards[0].original_url

    def test_get_card_by_id_not_found(self, client: TestClient, sample_cards):
        """Test getting a card with non-existent ID"""
        response = client.get("/api/v1/cards/99999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_card_by_id_invalid_id(self, client: TestClient):
        """Test getting a card with invalid ID format"""
        response = client.get("/api/v1/cards/invalid")

        assert response.status_code == 422  # Validation error


# ==================== POST /cards Tests ====================

@pytest.mark.integration
@pytest.mark.api
class TestCreateCard:
    """Tests for POST /api/v1/cards endpoint"""

    def test_create_card_success(self, client: TestClient, test_db: Session, sample_card_data):
        """Test creating a new card"""
        response = client.post("/api/v1/cards/", json=sample_card_data)

        assert response.status_code == 200
        data = response.json()

        # Verify response
        assert "id" in data
        assert data["title"] == sample_card_data["title"]
        assert data["source"] == sample_card_data["source"]
        assert data["stars"] == sample_card_data["stars"]

        # Verify in database
        card = test_db.query(TechCard).filter(TechCard.id == data["id"]).first()
        assert card is not None
        assert card.title == sample_card_data["title"]

    def test_create_card_minimal_fields(self, client: TestClient, test_db: Session):
        """Test creating a card with only required fields"""
        minimal_data = {
            "title": "Minimal Card",
            "source": "github",
            "original_url": "https://github.com/test/minimal"
        }

        response = client.post("/api/v1/cards/", json=minimal_data)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == minimal_data["title"]
        assert data["quality_score"] == 5.0  # Default value
        assert data["status"] == "not_tried"  # Default value

    def test_create_card_missing_required_fields(self, client: TestClient):
        """Test creating a card with missing required fields"""
        incomplete_data = {
            "title": "Incomplete Card"
            # Missing source and original_url
        }

        response = client.post("/api/v1/cards/", json=incomplete_data)
        assert response.status_code == 422  # Validation error

    def test_create_card_invalid_source(self, client: TestClient, sample_card_data):
        """Test creating a card with invalid source"""
        sample_card_data["source"] = "invalid_source"

        response = client.post("/api/v1/cards/", json=sample_card_data)
        assert response.status_code == 422

    def test_create_card_invalid_status(self, client: TestClient, sample_card_data):
        """Test creating a card with invalid status"""
        sample_card_data["status"] = "invalid_status"

        response = client.post("/api/v1/cards/", json=sample_card_data)
        assert response.status_code == 422


# ==================== PUT /cards/{id} Tests ====================

@pytest.mark.integration
@pytest.mark.api
class TestUpdateCard:
    """Tests for PUT /api/v1/cards/{id} endpoint"""

    def test_update_card_success(self, client: TestClient, sample_cards):
        """Test updating a card"""
        card_id = sample_cards[0].id
        update_data = {
            "title": "Updated Llama 3.2 Model",
            "stars": 30000,
            "status": "tried"
        }

        response = client.put(f"/api/v1/cards/{card_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == card_id
        assert data["title"] == update_data["title"]
        assert data["stars"] == update_data["stars"]
        assert data["status"] == update_data["status"]

    def test_update_card_partial(self, client: TestClient, sample_cards):
        """Test partial update of a card"""
        card_id = sample_cards[0].id
        original_title = sample_cards[0].title

        update_data = {
            "stars": 35000  # Only update stars
        }

        response = client.put(f"/api/v1/cards/{card_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()

        assert data["stars"] == 35000
        assert data["title"] == original_title  # Title unchanged

    def test_update_card_not_found(self, client: TestClient):
        """Test updating a non-existent card"""
        update_data = {"title": "New Title"}

        response = client.put("/api/v1/cards/99999", json=update_data)
        assert response.status_code == 404

    def test_update_card_invalid_data(self, client: TestClient, sample_cards):
        """Test updating with invalid data"""
        card_id = sample_cards[0].id
        update_data = {"stars": "not_a_number"}  # Invalid type (should be int)

        response = client.put(f"/api/v1/cards/{card_id}", json=update_data)
        # Should reject invalid data types
        assert response.status_code == 422


# ==================== DELETE /cards/{id} Tests ====================

@pytest.mark.integration
@pytest.mark.api
class TestDeleteCard:
    """Tests for DELETE /api/v1/cards/{id} endpoint"""

    def test_delete_card_success(self, client: TestClient, test_db: Session, sample_cards):
        """Test deleting a card"""
        card_id = sample_cards[0].id

        response = client.delete(f"/api/v1/cards/{card_id}")

        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"].lower()

        # Verify card is deleted from database
        card = test_db.query(TechCard).filter(TechCard.id == card_id).first()
        assert card is None

    def test_delete_card_not_found(self, client: TestClient):
        """Test deleting a non-existent card"""
        response = client.delete("/api/v1/cards/99999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_delete_card_invalid_id(self, client: TestClient):
        """Test deleting with invalid ID format"""
        response = client.delete("/api/v1/cards/invalid")

        assert response.status_code == 422
