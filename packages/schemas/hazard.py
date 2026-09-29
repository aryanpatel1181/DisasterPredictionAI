from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict
from packages.shared.constants import HazardType, HazardStatus, HazardSeverity

class GeometryGeoJSON(BaseModel):
    type: str = Field(default="Point", description="GeoJSON geometry type: Point, Polygon, etc.")
    coordinates: Union[List[float], List[List[float]], List[List[List[float]]]] = Field(
        ..., description="Coordinates array according to GeoJSON specification"
    )

class FeatureContribution(BaseModel):
    feature: str = Field(..., description="Name of the input feature")
    value: Union[float, int, str] = Field(..., description="Observed feature value")
    unit: str = Field(..., description="Physical unit of measurement")
    contribution: float = Field(..., description="SHAP or model contribution score")

class StructuredExplanation(BaseModel):
    risk_probability: float = Field(..., ge=0.0, le=1.0)
    primary_drivers: List[FeatureContribution] = Field(default_factory=list)
    human_summary: str = Field(..., description="Deterministic human-readable explanation")

class OfficialWarningSummary(BaseModel):
    alert_id: str
    headline: str
    severity: str
    issuing_authority: str
    sent_at: datetime
    url: Optional[str] = None

class DataProvenance(BaseModel):
    provider: str
    provider_record_id: str
    source_timestamp: datetime
    ingestion_timestamp: datetime
    original_unit: Optional[str] = None
    normalized_unit: Optional[str] = None
    processing_version: str = "v1.0.0"
    source_url: Optional[str] = None

class NormalizedHazardEvent(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    event_id: str = Field(..., description="Unique event identifier (UUID or provider ID)")
    hazard_type: HazardType = Field(..., description="Primary hazard classification")
    status: HazardStatus = Field(..., description="OBSERVED, FORECAST, AI_RISK_ESTIMATE, or OFFICIAL_WARNING")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    geometry: GeometryGeoJSON = Field(...)
    country: Optional[str] = Field(default="Global/International")
    admin_region: Optional[str] = Field(default=None)
    nearest_populated_location: Optional[str] = Field(default=None)
    
    detected_timestamp: datetime = Field(..., description="Timestamp event was detected or recorded")
    forecast_start: Optional[datetime] = Field(default=None)
    forecast_end: Optional[datetime] = Field(default=None)
    
    severity: HazardSeverity = Field(default=HazardSeverity.MODERATE)
    risk_probability: float = Field(..., ge=0.0, le=1.0, description="Calibrated risk likelihood")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Data completeness and model certainty score")
    
    model_version: str = Field(default="v1.0.0-baseline")
    data_quality: float = Field(default=1.0, ge=0.0, le=1.0)
    data_freshness_seconds: float = Field(default=0.0, ge=0.0)
    
    sources: List[DataProvenance] = Field(default_factory=list)
    feature_values: Dict[str, Any] = Field(default_factory=dict)
    feature_contributions: List[FeatureContribution] = Field(default_factory=list)
    explanation: StructuredExplanation = Field(...)
    official_warnings: List[OfficialWarningSummary] = Field(default_factory=list)
    population_exposure: int = Field(default=0, ge=0, description="Estimated affected population count")

class LocationRiskResponse(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    query_timestamp: datetime
    hazard_risks: Dict[str, Dict[str, Any]] = Field(
        ...,
        description="Hazard risk breakdown by disaster category, containing risk_probability, severity, confidence, etc."
    )
    methodology_note: str = Field(
        default="Risks are calculated independently per hazard category using calibrated predictive engines. Individual hazard probabilities are not averaged into a single synthetic score to preserve physical meaning."
    )
