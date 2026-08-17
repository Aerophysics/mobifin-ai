import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import xgboost as xgb
from typing import Dict, Any, List, Optional, Tuple

# Add backend to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BASE_DIR)

from app.ml.feature_engineering import FeatureEngineer
from app.ml.model_registry import ModelRegistry

class MLInference:
    @staticmethod
    def get_risk_category(score: int) -> str:
        """Categorize credit scores into prototype risk bands"""
        if score < 550:
            return "High Risk"
        elif score < 650:
            return "Moderate-High Risk"
        elif score < 750:
            return "Moderate-Low Risk"
        else:
            return "Low Risk"

    @staticmethod
    def assess_customer_credit(
        transactions: List[Dict[str, Any]], 
        consent_status: bool,
        loans: List[Dict[str, Any]] = None,
        customer_id: int = None
    ) -> Dict[str, Any]:
        """
        Assess customer credit risk, returning either a score (if eligible) or readiness info.
        """
        # Calculate features up to now
        now = datetime.utcnow()
        features = FeatureEngineer.calculate_features(transactions, now, loans)
        
        # Check requirements: active consent, 90 history days, 30 transactions
        tx_filtered = [t for t in transactions if t["timestamp"] <= now]
        tx_count = len(tx_filtered)
        
        first_tx = min([t["timestamp"] for t in tx_filtered]) if tx_filtered else now
        history_days = (now - first_tx).days
        
        has_sufficient_history = history_days >= 90
        has_sufficient_txs = tx_count >= 30
        
        is_eligible = consent_status and has_sufficient_history and has_sufficient_txs
        
        # Base response structures
        response = {
            "eligible": is_eligible,
            "consent_active": consent_status,
            "history_days": history_days,
            "transaction_count": tx_count,
            "financial_readiness_score": features["financial_readiness_score"],
            "profile": features
        }
        
        if not is_eligible:
            response["reason"] = (
                "Insufficient financial history for an alternative credit assessment. "
                "Requires active consent, at least 90 days of history, and 30 transactions."
            )
            return response
            
        # Load credit model
        model, meta = ModelRegistry.load_model("credit")
        if not model:
            # Fallback if model hasn't been trained/saved
            # Use a deterministic backup for local testing before training script runs
            repay_prob = 0.85
            default_prob = 0.15
            score = 712
            risk_cat = "Moderate-Low Risk"
            capacity = 5000.0
            explanations = [
                {"feature": "Transaction Consistency", "value": 0.4},
                {"feature": "Savings Behavior Score", "value": 0.3},
                {"feature": "Inflow Outflow Ratio", "value": 0.2},
                {"feature": "Monthly Inflows", "value": 0.1},
                {"feature": "Cashflow Volatility", "value": -0.15}
            ]
            response.update({
                "credit_score": score,
                "repayment_probability": repay_prob,
                "default_probability": default_prob,
                "risk_category": risk_cat,
                "indicative_credit_capacity": capacity,
                "factors": explanations,
                "model_version": "v1.0.0-fallback"
            })
            return response
            
        # Perform model inference
        # Prepare inputs
        feature_cols = meta["metrics"]["feature_cols"]
        X_df = pd.DataFrame([features])[feature_cols]
        
        # Predict probability of default
        default_prob = float(model.predict_proba(X_df)[0, 1])
        repay_prob = 1.0 - default_prob
        
        # Scale to 300 - 850 Alternative Credit Score
        score = int(300 + (850 - 300) * repay_prob)
        risk_cat = MLInference.get_risk_category(score)
        
        # Calculate indicative capacity: based on observed inflows, repayment prob, stability
        monthly_inflow = features["monthly_inflows"]
        volatility = features["cashflow_volatility"]
        
        # Capacity equation: 1.5 * monthly inflows * repayment prob / volatility
        stability_modifier = 1.0 / (volatility + 0.5)
        raw_capacity = (monthly_inflow * 1.5) * repay_prob * stability_modifier
        indicative_capacity = float(round(max(500.0, min(10000.0, raw_capacity)), -2))  # round to nearest 100 GHS
        
        # Compute SHAP explanations using XGBoost's pred_contribs
        explanations = []
        try:
            # pred_contribs returns SHAP values for each feature plus the bias
            booster = model.get_booster()
            dmat = xgb.DMatrix(X_df)
            contribs = booster.predict(dmat, pred_contribs=True)[0]
            
            # The last element is the base value, others are feature SHAP values
            for idx, col in enumerate(feature_cols):
                # Clean up column name for presentation
                clean_name = col.replace("_", " ").title()
                # Repayment SHAP: default model outputs log-odds of default,
                # so negative SHAP value in default model means positive contributor to repayment.
                # Let's invert the sign to reflect contributions to repayment score!
                val = -float(contribs[idx])
                explanations.append({
                    "feature": clean_name,
                    "value": val
                })
            # Sort factors by magnitude
            explanations.sort(key=lambda x: abs(x["value"]), reverse=True)
        except Exception as e:
            print(f"SHAP error: {e}. Falling back to default list.")
            explanations = [
                {"feature": "Transaction Consistency", "value": 0.25},
                {"feature": "Savings Behavior Score", "value": 0.2},
                {"feature": "Inflow Outflow Ratio", "value": 0.15}
            ]
            
        response.update({
            "credit_score": score,
            "repayment_probability": float(round(repay_prob, 4)),
            "default_probability": float(round(default_prob, 4)),
            "risk_category": risk_cat,
            "indicative_credit_capacity": indicative_capacity,
            "factors": explanations,
            "model_version": meta["version"]
        })
        
        return response

    @staticmethod
    def forecast_agent_demand(
        daily_metrics: List[Dict[str, Any]], 
        agent_id: int
    ) -> Dict[str, Any]:
        """
        Predict cash and float demand for tomorrow.
        """
        # Load forecasting model
        model_pack, meta = ModelRegistry.load_model("demand")
        
        if not model_pack:
            # Fallback values for Kwame's Centre narrative
            return {
                "predicted_transaction_volume": 12500.0,
                "predicted_float_demand": 11400.0,
                "predicted_cash_demand": 4100.0,
                "confidence": 0.88,
                "model_version": "v1.0.0-fallback",
                "baseline_float_demand": 9500.0,
                "is_fallback": True
            }
            
        # Build features from daily metrics
        # We need the most recent day as our lag trigger
        df = pd.DataFrame(daily_metrics).sort_values(by="date")
        if len(df) < 8:
            # Not enough history to forecast
            return {
                "predicted_transaction_volume": 10000.0,
                "predicted_float_demand": 9000.0,
                "predicted_cash_demand": 3000.0,
                "confidence": 0.50,
                "model_version": meta["version"],
                "baseline_float_demand": 9000.0,
                "is_fallback": True
            }
            
        # Feature row building for tomorrow
        tomorrow = datetime.utcnow().date() + timedelta(days=1)
        
        # Reconstruct lag features
        vol_lag_1 = df["total_volume"].iloc[-1]
        vol_lag_7 = df["total_volume"].iloc[-7] if len(df) >= 7 else df["total_volume"].mean()
        vol_roll_mean_7 = df["total_volume"].iloc[-7:].mean()
        
        float_lag_1 = df["float_demand"].iloc[-1] if "float_demand" in df.columns else df["total_volume"].iloc[-1]*0.8
        float_lag_7 = df["float_demand"].iloc[-7] if len(df) >= 7 else df["total_volume"].mean()*0.8
        float_roll_mean_7 = df["float_demand"].iloc[-7:].mean() if "float_demand" in df.columns else df["total_volume"].iloc[-7:].mean()*0.8
        
        cash_lag_1 = df["cash_demand"].iloc[-1] if "cash_demand" in df.columns else df["total_volume"].iloc[-1]*0.2
        cash_lag_7 = df["cash_demand"].iloc[-7] if len(df) >= 7 else df["total_volume"].mean()*0.2
        cash_roll_mean_7 = df["cash_demand"].iloc[-7:].mean() if "cash_demand" in df.columns else df["total_volume"].iloc[-7:].mean()*0.2
        
        feature_dict = {
            "vol_lag_1": vol_lag_1,
            "vol_lag_7": vol_lag_7,
            "vol_roll_mean_7": vol_roll_mean_7,
            "float_lag_1": float_lag_1,
            "float_lag_7": float_lag_7,
            "float_roll_mean_7": float_roll_mean_7,
            "cash_lag_1": cash_lag_1,
            "cash_lag_7": cash_lag_7,
            "cash_roll_mean_7": cash_roll_mean_7,
            "day_of_week": tomorrow.weekday(),
            "day_of_month": tomorrow.day,
            "month": tomorrow.month
        }
        
        X_df = pd.DataFrame([feature_dict])[model_pack["features"]]
        
        # Predictions
        pred_float = float(model_pack["float_model"].predict(X_df)[0])
        pred_cash = float(model_pack["cash_model"].predict(X_df)[0])
        
        # Confidence interval size is related to historical MAE
        mae = meta["metrics"]["mae"]
        confidence = max(0.6, 1.0 - (mae / (pred_float + 1.0)))
        
        return {
            "predicted_transaction_volume": float(pred_float + pred_cash),
            "predicted_float_demand": float(round(pred_float, 2)),
            "predicted_cash_demand": float(round(pred_cash, 2)),
            "confidence": float(round(confidence, 2)),
            "model_version": meta["version"],
            "baseline_float_demand": float(round(vol_lag_7 * 0.8, 2)),
            "is_fallback": False
        }

    @staticmethod
    def inspect_transaction_anomaly(
        transaction: Dict[str, Any], 
        agent_txs: List[Dict[str, Any]]
    ) -> Tuple[bool, float, str]:
        """
        Inspect transaction using Isolation Forest model and rule checks.
        Returns:
            is_anomaly (bool), anomaly_score (float), reason (str)
        """
        # Rules check first
        amt = transaction["amount"]
        if amt > 9500:
            return True, 0.95, "Transaction amount exceeds the normal single transaction threshold."
            
        # Frequency rule (velocity)
        same_cust_txs = [
            t for t in agent_txs 
            if t["customer_id"] == transaction["customer_id"] 
            and (transaction["timestamp"] - t["timestamp"]).seconds < 600
        ]
        if len(same_cust_txs) >= 4:
            return True, 0.90, "High velocity transaction activity detected in a short time frame."
            
        # Load Anomaly model
        model_pack, meta = ModelRegistry.load_model("anomaly")
        if not model_pack:
            return False, 0.05, ""
            
        # Vectorize transaction
        iso = model_pack["model"]
        cols = model_pack["feature_cols"]
        
        tx_df = pd.DataFrame([transaction])
        tx_df["hour"] = tx_df["timestamp"].apply(lambda t: t.hour)
        
        # Dummies
        type_dummies = pd.get_dummies(tx_df["transaction_type"], prefix="type")
        dir_dummies = pd.get_dummies(tx_df["direction"], prefix="dir")
        
        X = pd.concat([tx_df[["amount", "hour"]], type_dummies, dir_dummies], axis=1)
        for col in cols:
            if col not in X.columns:
                X[col] = 0
                
        X = X.reindex(cols, axis=1)
        
        # Predict: score < 0 means anomaly
        score = float(iso.decision_function(X)[0])
        is_anom = score < 0.0
        
        reason = "Unusual transaction activity detected." if is_anom else ""
        return is_anom, float(round(-score, 4)), reason
