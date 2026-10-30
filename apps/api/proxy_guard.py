"""Single-worker portfolio guard for an API hosted outside a private network."""
import hmac
import time
from collections import deque

from starlette.responses import JSONResponse


class ProxyGuard:
    def __init__(self, app, token: str):
        self.app = app
        self.token = token.encode()
        self.requests = deque()
        self.chats = deque()

    async def __call__(self, scope, receive, send):
        if not self.token or scope['type'] not in ('http', 'websocket'):
            return await self.app(scope, receive, send)
        if scope['type'] == 'http' and scope['path'] == '/api/v1/health':
            return await self.app(scope, receive, send)
        supplied = dict(scope.get('headers', [])).get(b'x-terraguard-proxy-token', b'')
        if not hmac.compare_digest(supplied, self.token):
            if scope['type'] == 'websocket':
                return await send({'type': 'websocket.close', 'code': 1008})
            return await JSONResponse({'detail': 'Unauthorized'}, status_code=401)(scope, receive, send)

        # Bounded global limits for a small single-worker demo, without IP storage.
        now = time.monotonic()
        is_chat = scope['path'].rstrip('/') == '/api/v1/chat' and scope.get('method') == 'POST'
        buckets = [(self.requests, 120)] + ([(self.chats, 6)] if is_chat else [])
        for bucket, limit in buckets:
            while bucket and bucket[0] <= now - 60:
                bucket.popleft()
            if len(bucket) >= limit:
                if scope['type'] == 'websocket':
                    return await send({'type': 'websocket.close', 'code': 1013})
                return await JSONResponse(
                    {'detail': 'This demo is busy. Please retry in a minute.'},
                    status_code=429, headers={'Retry-After': '60'},
                )(scope, receive, send)
        for bucket, _ in buckets:
            bucket.append(now)
        return await self.app(scope, receive, send)
