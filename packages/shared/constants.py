from enum import Enum

class HazardType(str, Enum):
    FLOOD = "flood"
    EARTHQUAKE = "earthquake"
    TSUNAMI = "tsunami"
    SEVERE_WEATHER = "severe_weather"
    CYCLONE = "cyclone"
    WILDFIRE = "wildfire"
    VOLCANO = "volcano"
    LANDSLIDE = "landslide"
    DROUGHT = "drought"
    EXTREME_HEAT = "extreme_heat"
    WINTER_STORM = "winter_storm"

class HazardStatus(str, Enum):
    OBSERVED = "OBSERVED"
    FORECAST = "FORECAST"
    AI_RISK_ESTIMATE = "AI_RISK_ESTIMATE"
    OFFICIAL_WARNING = "OFFICIAL_WARNING"

class HazardSeverity(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ProviderStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    DOWN = "DOWN"
    DEV_MOCK = "DEV_MOCK"
