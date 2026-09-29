from datetime import datetime, timezone
from typing import AsyncGenerator
from sqlalchemy import Column, String, Float, DateTime, JSON, Integer, Text, Boolean
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from packages.shared.config import settings

Base = declarative_base()

class HazardEventRecord(Base):
    __tablename__ = "hazard_events"

    event_id = Column(String(128), primary_key=True, index=True)
    hazard_type = Column(String(64), index=True, nullable=False)
    status = Column(String(64), index=True, nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    geometry_json = Column(JSON, nullable=False)
    country = Column(String(128), index=True, default="Global")
    admin_region = Column(String(128), nullable=True)
    nearest_populated_location = Column(String(256), nullable=True)
    
    detected_timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    forecast_start = Column(DateTime(timezone=True), nullable=True)
    forecast_end = Column(DateTime(timezone=True), nullable=True)
    
    severity = Column(String(32), index=True, nullable=False)
    risk_probability = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    
    model_version = Column(String(64), nullable=False)
    data_quality = Column(Float, default=1.0)
    data_freshness_seconds = Column(Float, default=0.0)
    
    sources_json = Column(JSON, nullable=False)
    feature_values_json = Column(JSON, nullable=False)
    feature_contributions_json = Column(JSON, nullable=False)
    explanation_json = Column(JSON, nullable=False)
    official_warnings_json = Column(JSON, nullable=False)
    population_exposure = Column(Integer, default=0)

# Async SQLite fallback for dev/testing if Postgres isn't running locally
db_url = settings.DATABASE_URL
if "postgresql" in db_url and not settings.ENVIRONMENT == "production":
    # Allows seamless development testing even without live PostgreSQL instance
    db_url = "sqlite+aiosqlite:///./terraguard_dev.db"

engine = create_async_engine(db_url, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
