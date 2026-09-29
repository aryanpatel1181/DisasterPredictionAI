import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from packages.shared.config import settings
from packages.shared.logging import get_logger
from apps.api.database import init_db
from apps.api.routers import health, sources, events, hazards, location, alerts, models, history, predictions, chat
from apps.api.routers.events import get_or_refresh_events

logger = get_logger("api_main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing TerraGuard AI Database & Service Connections...")
    try:
        await init_db()
    except Exception as exc:
        logger.warning(f"Database initialization warning (dev fallback active): {exc}")
    yield
    logger.info("Shutting down TerraGuard AI Service Engine.")

app = FastAPI(
    title="TerraGuard AI API Engine",
    description="Autonomous, Global AI-Powered Natural-Disaster Intelligence, Forecasting, Risk-Assessment & Early-Warning Platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(sources.router)
app.include_router(events.router)
app.include_router(hazards.router)
app.include_router(location.router)
app.include_router(alerts.router)
app.include_router(models.router)
app.include_router(history.router)
app.include_router(predictions.router)
app.include_router(chat.router)
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected.")

    async def broadcast_event(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/ws/v1/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        initial_events = await get_or_refresh_events()
        await websocket.send_text(json.dumps({
            "type": "INITIAL_EVENTS_LOAD",
            "count": len(initial_events),
            "events": [e.model_dump() for e in initial_events[:15]],
        }, default=str))

        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as exc:
        logger.warning(f"WebSocket error: {exc}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host=settings.HOST, port=settings.PORT, reload=True)
