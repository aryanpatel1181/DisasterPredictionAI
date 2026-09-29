import math

def compute_omori_aftershock_rate(
    mainshock_mag: float, elapsed_days: float, K: float = 0.05, c: float = 0.05, p: float = 1.0
) -> float:
    """Modified Omori law aftershock rate: n(t) = K / (t + c)^p."""
    if elapsed_days < 0:
        return 0.0
    rate = (10 ** (mainshock_mag - 5.0) * K) / ((elapsed_days + c) ** p)
    return max(0.0, min(rate, 100.0))

def compute_tsunami_trigger_probability(
    magnitude: float, depth_km: float, distance_to_coast_km: float
) -> float:
    """Calculate tsunami potential based on focal depth, magnitude, and ocean proximity."""
    if distance_to_coast_km > 100.0 or depth_km > 100.0 or magnitude < 6.5:
        return 0.02
    
    base_score = (magnitude - 6.5) * 0.35
    depth_penalty = max(0.0, (depth_km - 10.0) / 90.0) * 0.4
    dist_penalty = max(0.0, distance_to_coast_km / 100.0) * 0.3
    
    prob = base_score - depth_penalty - dist_penalty
    return max(0.05, min(prob, 0.98))
