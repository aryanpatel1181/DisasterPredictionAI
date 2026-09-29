import json
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pydantic import BaseModel

class ModelMetadata(BaseModel):
    model_name: str
    model_version: str
    hazard_type: str
    training_date: str
    training_dataset_hash: str
    feature_schema: list[str]
    metrics: Dict[str, float]
    calibration_metrics: Dict[str, float]
    artifact_location: str
    deployment_state: str  # "STAGING", "PRODUCTION", "DEPRECATED"

class ModelRegistry:
    def __init__(self, registry_dir: str = "./ml/registry"):
        self.registry_dir = registry_dir
        os.makedirs(self.registry_dir, exist_ok=True)
        self.manifest_file = os.path.join(self.registry_dir, "manifest.json")
        self._load_manifest()

    def _load_manifest(self):
        if os.path.exists(self.manifest_file):
            with open(self.manifest_file, "r") as f:
                self.manifest = json.load(f)
        else:
            self.manifest = {}

    def register_model(self, meta: ModelMetadata):
        self.manifest[meta.model_name] = meta.model_dump()
        with open(self.manifest_file, "w") as f:
            json.dump(self.manifest, f, indent=2)

    def get_model_metadata(self, model_name: str) -> Optional[ModelMetadata]:
        data = self.manifest.get(model_name)
        if data:
            return ModelMetadata(**data)
        return None

    def list_models(self) -> list[Dict[str, Any]]:
        return list(self.manifest.values())

model_registry = ModelRegistry()
