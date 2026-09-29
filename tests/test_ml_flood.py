from ml.flood.model import FloodPredictionModel
from services.feature_engine.flood_features import compute_flood_feature_vector

def test_flood_model_training_and_inference():
    model = FloodPredictionModel(model_type="random_forest")
    X, y = model.generate_synthetic_training_dataset(300)
    metrics = model.train_and_evaluate(X, y)

    assert metrics["roc_auc"] > 0.60
    assert "brier_score" in metrics

    # Inference test
    vector = compute_flood_feature_vector(
        precip_30m=5.0,
        precip_1h=12.0,
        precip_3h=35.0,
        precip_6h=65.0,
        precip_12h=110.0,
        precip_24h=195.0,
        precip_72h=320.0,
        forecast_precip_24h=180.0,
        river_discharge_m3s=12000.0,
        river_discharge_percentile=98.5,
        soil_wetness_index=0.92,
        antecedent_precipitation_index=150.0,
        elevation_m=8.0,
        terrain_slope_deg=1.2,
        distance_to_river_km=0.3,
        historical_flood_freq_per_decade=4.0,
        land_cover_impervious_ratio=0.75,
        population_density_km2=2500.0,
    )

    prob, severity = model.predict_risk(vector)
    assert 0.0 <= prob <= 1.0
    assert severity in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
