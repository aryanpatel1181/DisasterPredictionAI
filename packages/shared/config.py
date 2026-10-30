import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str = "terraguard_secret_key_change_in_production_32bytes"
    # Same server-only value on the API and Next.js for split hosting.
    API_PROXY_TOKEN: str = ""
    
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    POSTGRES_USER: str = "terraguard"
    POSTGRES_PASSWORD: str = "terraguard_dev_pass"
    POSTGRES_DB: str = "terraguard_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "postgresql+asyncpg://terraguard:terraguard_dev_pass@localhost:5432/terraguard_db"
    
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://localhost:6379/0"
    
    USGS_API_URL: str = "https://earthquake.usgs.gov/fdsnws/event/1/"
    GDACS_API_URL: str = "https://www.gdacs.org/xml/rss.xml"
    WMO_CAP_FEED_URL: str = "https://alert.worldweather.wmo.int/"
    NASA_EARTHDATA_TOKEN: str = ""
    COPERNICUS_CDS_API_KEY: str = ""
    
    MODEL_REGISTRY_PATH: str = "./ml/registry"

    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "openrouter/free"

settings = Settings()
