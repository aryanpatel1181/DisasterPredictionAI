# Machine Learning & Risk Engine - TerraGuard AI

## 1. Predictive Risk Framework
TerraGuard AI employs calibrated probabilistic classification and spatial regression models for natural hazard evaluation.

### Separate Outputs Required for Every Model
1. `risk_probability`: Calibrated likelihood $[0.0, 1.0]$.
2. `confidence`: Unbiased indicator $[0.0, 1.0]$ based on data completeness and freshness.
3. `severity`: Categorical classification (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
4. `forecast_window`: Time range during which the prediction applies (e.g., `6h`, `12h`, `24h`, `72h`).
5. `model_version`: Immutable semantic identifier (e.g., `flood_xgboost_v1.2.0`).
6. `data_quality`: Health score of input telemetry $[0.0, 1.0]$.
7. `data_freshness`: Time delta in seconds since newest feature timestamp.

## 2. Flood Risk Pipeline (Milestone 2 Target)
- **Features**: 30m to 72h precipitation, river discharge percentile, soil wetness index, elevation slope, distance to river, land cover, historical flood frequency.
- **Algorithms**: Comparison between Logistic Regression, Random Forest, XGBoost, and LightGBM.
- **Validation**: Strict spatial block cross-validation and time-based split (preventing temporal data leakage).
- **Explainability**: SHAP TreeExplainer calculating exact feature attributions for every prediction.

## 3. Model Registry
Models are registered with metadata tracking:
- Training dataset hash & date
- Calibration metrics (Brier score, ECE - Expected Calibration Error)
- Evaluation metrics (ROC-AUC, PR-AUC, Precision, Recall, F1)
- Feature schema hash
- Artifact storage location
