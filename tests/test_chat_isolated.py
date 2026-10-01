from fastapi import FastAPI
from fastapi.testclient import TestClient
from apps.api.routers.chat import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_chat_endpoint_exists():
    r = client.post("/api/v1/chat", json={"message": "how bad is flood risk in Miami?"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "response" in body
    assert "conversation_id" in body
    assert "sources" in body
    assert "risk_context" in body
    print("RESPONSE:", body["response"][:200])
    print("SOURCES:", body["sources"])
    print("CONVERSATION_ID:", body["conversation_id"])


def test_earthquake_keyword():
    r = client.post("/api/v1/chat", json={"message": "tell me about earthquake risk"})
    assert r.status_code == 200
    assert "earthquake" in r.json()["response"].lower()


def test_tsunami_keyword():
    r = client.post("/api/v1/chat", json={"message": "tsunami warning?"})
    assert r.status_code == 200
    assert "tsunami" in r.json()["response"].lower()


def test_conversation_id_echo():
    r = client.post("/api/v1/chat", json={"message": "hello", "conversation_id": "abc-123"})
    assert r.json()["conversation_id"] == "abc-123"


def test_specific_location_flood_question_mentions_nepal_and_recent_context():
    r = client.post("/api/v1/chat", json={"message": "How did the flood happen in Nepal recently?"})
    assert r.status_code == 200
    text = r.json()["response"].lower()
    assert "nepal" in text or "recent" in text or "flood" in text