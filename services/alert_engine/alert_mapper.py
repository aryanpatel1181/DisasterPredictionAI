from typing import List
from packages.schemas.alerts import OfficialCAPAlert
from packages.schemas.hazard import OfficialWarningSummary

def map_raw_alerts_to_summaries(cap_alerts: List[OfficialCAPAlert]) -> List[OfficialWarningSummary]:
    summaries = []
    for alert in cap_alerts:
        summaries.append(
            OfficialWarningSummary(
                alert_id=alert.alert_id,
                headline=alert.info.headline or alert.info.event,
                severity=alert.info.severity,
                issuing_authority=alert.sender,
                sent_at=alert.sent_at,
                url=alert.source_url,
            )
        )
    return summaries
