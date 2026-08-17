import os
import pickle
import json
import datetime
from typing import Any, Dict, Optional, Tuple

class ModelRegistry:
    """
    Manages saving, loading, and versioning of machine learning models.
    Persists artifacts to backend/app/ml/artifacts/.
    """
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
    REGISTRY_FILE = os.path.join(ARTIFACTS_DIR, "registry.json")
    _cache: Dict[str, Tuple[Any, Dict[str, Any]]] = {}

    @classmethod
    def initialize(cls):
        """Ensure artifacts folder and registry list exists"""
        if not os.path.exists(cls.ARTIFACTS_DIR):
            os.makedirs(cls.ARTIFACTS_DIR)
        if not os.path.exists(cls.REGISTRY_FILE):
            with open(cls.REGISTRY_FILE, "w") as f:
                json.dump({"models": {}}, f, indent=4)

    @classmethod
    def _read_registry(cls) -> Dict[str, Any]:
        cls.initialize()
        try:
            with open(cls.REGISTRY_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {"models": {}}

    @classmethod
    def _write_registry(cls, data: Dict[str, Any]):
        cls.initialize()
        with open(cls.REGISTRY_FILE, "w") as f:
            json.dump(data, f, indent=4)

    @classmethod
    def register_model(
        cls, 
        model_type: str, 
        model_obj: Any, 
        metrics: Dict[str, Any], 
        version: str = None
    ) -> str:
        """
        Saves a trained model and registers its metadata.
        Args:
            model_type: 'credit', 'demand', or 'anomaly'
            model_obj: The actual sklearn/xgboost object
            metrics: Performance indicators (e.g. accuracy, F1, MAE)
            version: Optional custom version string
        Returns:
            The registered version string
        """
        cls.initialize()
        registry = cls._read_registry()
        
        # Calculate new version if not supplied
        if not version:
            existing = [v for k, v in registry["models"].items() if v["type"] == model_type]
            version = f"v{len(existing) + 1}.0.0"
            
        filename = f"{model_type}_{version}.pkl"
        filepath = os.path.join(cls.ARTIFACTS_DIR, filename)
        
        # Save model object
        with open(filepath, "wb") as f:
            pickle.dump(model_obj, f)
            
        # Update registry metadata
        metadata = {
            "type": model_type,
            "version": version,
            "filename": filename,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "metrics": metrics
        }
        
        registry["models"][f"{model_type}_{version}"] = metadata
        cls._write_registry(registry)
        
        print(f"Registered model {model_type} {version} at {filepath}")
        return version

    @classmethod
    def load_model(cls, model_type: str, version: str = None) -> Tuple[Optional[Any], Optional[Dict[str, Any]]]:
        """
        Loads a registered model and its metadata.
        If version is None, loads the latest version of that model type.
        Returns:
            (model_object, metadata_dict)
        """
        cls.initialize()
        registry = cls._read_registry()
        
        candidates = [
            v for k, v in registry["models"].items() 
            if v["type"] == model_type
        ]
        
        if not candidates:
            print(f"No registered models found for type: {model_type}")
            return None, None
            
        # If no version specified, sort by timestamp to find the latest
        if not version:
            candidates.sort(key=lambda x: x["timestamp"], reverse=True)
            target = candidates[0]
            version = target["version"]
        else:
            target = next((c for c in candidates if c["version"] == version), None)
            
        if not target:
            print(f"Model version {version} not found for type: {model_type}")
            return None, None
            
        cache_key = f"{model_type}_{version}"
        if cache_key in cls._cache:
            return cls._cache[cache_key]

        filepath = os.path.join(cls.ARTIFACTS_DIR, target["filename"])
        if not os.path.exists(filepath):
            print(f"Model file {filepath} does not exist on disk.")
            return None, None
            
        with open(filepath, "rb") as f:
            model_obj = pickle.load(f)
            
        cls._cache[cache_key] = (model_obj, target)
        return model_obj, target

    @classmethod
    def get_all_metrics(cls) -> Dict[str, Any]:
        """Gets metadata/metrics for the active (latest) model versions"""
        metrics_dict = {}
        for m_type in ["credit", "demand", "anomaly"]:
            _, meta = cls.load_model(m_type)
            if meta:
                metrics_dict[m_type] = meta
        return metrics_dict
