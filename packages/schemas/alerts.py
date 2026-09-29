from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class CAPAlertInfo(BaseModel):
    category: str
    event: str
    urgency: str
    severity: str
    certainty: str
    headline: Optional[str] = None
    description: Optional[str] = None
    instruction: Optional[str] = None
    area_description: Optional[str] = None

class OfficialCAPAlert(BaseModel):
    alert_id: str
    sender: str
    sent_at: datetime
    status: str
    msg_type: str
    scope: str
    info: CAPAlertInfo
    geometry_geojson: Optional[dict] = None
    source_url: Optional[str] = None
