import pytest
from app import app
import routes.ai as ai_module


@pytest.fixture
def client():
    with app.test_client() as client:
        yield client


def test_ai_chat_no_token(client, monkeypatch):
    # force token to None
    monkeypatch.setattr(ai_module, "GITHUB_TOKEN", None)

    res = client.post("/ai/chat", json={"question": "Why is e1 concurrent with e2?"})

    data = res.get_json()

    assert res.status_code == 200
    assert data["ok"] is True
    assert "not configured" in data["reply"]


def test_ai_chat_success(client, monkeypatch):
    monkeypatch.setattr(ai_module, "GITHUB_TOKEN", "fake-token")

    # mock requests.post
    class MockResponse:
        def json(self):
            return {
                "choices": [
                    {"message": {"content": "e1 and e2 are concurrent."}}
                ]
            }

    def mock_post(*args, **kwargs):
        return MockResponse()

    monkeypatch.setattr(ai_module.requests, "post", mock_post)

    res = client.post("/ai/chat", json={"question": "Why is e1 concurrent with e2?"})

    data = res.get_json()

    assert res.status_code == 200
    assert data["ok"] is True
    assert "concurrent" in data["reply"]


def test_ai_chat_api_failure(client, monkeypatch):
    monkeypatch.setattr(ai_module, "GITHUB_TOKEN", "fake-token")

    def mock_post(*args, **kwargs):
        raise Exception("API failed")

    monkeypatch.setattr(ai_module.requests, "post", mock_post)

    res = client.post("/ai/chat", json={"question": "test"})

    data = res.get_json()

    assert res.status_code == 400
    assert data["ok"] is False
    assert "API failed" in data["error"]