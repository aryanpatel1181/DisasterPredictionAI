import pytest
from fastapi import FastAPI, WebSocket
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from apps.api.proxy_guard import ProxyGuard


def make_client(token='test-only-proxy-value'):
    app = FastAPI()
    app.add_middleware(ProxyGuard, token=token)

    @app.get('/api/v1/health')
    @app.get('/api/v1/events')
    @app.post('/api/v1/chat')
    def ok():
        return {'ok': True}

    @app.websocket('/ws/v1/events')
    async def websocket(ws: WebSocket):
        await ws.accept()
        await ws.send_json({'ok': True})
        await ws.close()

    return TestClient(app)


def test_auth_and_health():
    client = make_client()
    assert client.get('/api/v1/health').status_code == 200
    assert client.get('/api/v1/events').status_code == 401
    assert client.get('/docs').status_code == 401
    assert client.get('/api/v1/events', headers={'X-TerraGuard-Proxy-Token': 'wrong'}).status_code == 401
    assert client.get('/api/v1/events', headers={'X-TerraGuard-Proxy-Token': 'test-only-proxy-value'}).status_code == 200


def test_private_network_mode_unchanged():
    assert make_client(token='').get('/api/v1/events').status_code == 200


def test_chat_limit_and_expiry(monkeypatch):
    monkeypatch.setattr('apps.api.proxy_guard.time.monotonic', lambda: 1000)
    client = make_client()
    headers = {'X-TerraGuard-Proxy-Token': 'test-only-proxy-value'}
    for _ in range(6):
        assert client.post('/api/v1/chat', headers=headers).status_code == 200
    response = client.post('/api/v1/chat', headers=headers)
    assert response.status_code == 429
    assert response.headers['Retry-After'] == '60'
    assert client.get('/api/v1/events', headers=headers).status_code == 200
    monkeypatch.setattr('apps.api.proxy_guard.time.monotonic', lambda: 1061)
    assert client.post('/api/v1/chat', headers=headers).status_code == 200


def test_general_limit():
    client = make_client()
    headers = {'X-TerraGuard-Proxy-Token': 'test-only-proxy-value'}
    for _ in range(120):
        assert client.get('/api/v1/events', headers=headers).status_code == 200
    assert client.get('/api/v1/events', headers=headers).status_code == 429
    assert client.get('/api/v1/health').status_code == 200


def test_websocket_cannot_bypass_guard():
    client = make_client()
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect('/ws/v1/events'):
            pass
