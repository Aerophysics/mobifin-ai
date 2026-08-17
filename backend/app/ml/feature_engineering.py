import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Union

class FeatureEngineer:
    @staticmethod
    def calculate_features(
        transactions: List[Dict[str, Any]], 
        cutoff_date: datetime,
        loans: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Extract derived customer features from a list of transactions up to a cutoff_date.
        Prevents data leakage by ignoring transactions after cutoff_date.
        """
        # Filter transactions by cutoff_date (Time-aware extraction)
        tx_filtered = [
            t for t in transactions 
            if isinstance(t["timestamp"], datetime) and t["timestamp"] <= cutoff_date
        ]
        
        if not tx_filtered:
            return FeatureEngineer.get_empty_profile()
            
        # Parse into pandas for convenient aggregation
        df = pd.DataFrame(tx_filtered)
        
        # Baselines & longevity
        first_tx = df["timestamp"].min()
        history_days = max((cutoff_date - first_tx).days, 1)
        history_months = history_days / 30.0
        
        # Transaction activity
        tx_count = len(df)
        tx_volume = df["amount"].sum()
        avg_tx_value = df["amount"].mean()
        median_tx_value = df["amount"].median()
        
        # Inflows/Outflows
        inflow_df = df[df["direction"] == "inflow"]
        outflow_df = df[df["direction"] == "outflow"]
        
        total_inflow = inflow_df["amount"].sum()
        total_outflow = outflow_df["amount"].sum()
        
        # Observed Inflows monthly average
        monthly_inflows = total_inflow / max(history_months, 0.1)
        monthly_outflows = total_outflow / max(history_months, 0.1)
        inflow_outflow_ratio = total_inflow / (total_outflow + 1e-5)
        
        # Volatility: Standard deviation of monthly inflows (or daily inflows normalized)
        # To avoid problems with short histories, we aggregate inflows by week
        df["week_commencing"] = df["timestamp"].apply(lambda d: d - timedelta(days=d.weekday()))
        weekly_inflows = df[df["direction"] == "inflow"].groupby("week_commencing")["amount"].sum()
        
        if len(weekly_inflows) > 1:
            # Coefficient of variation (volatility relative to mean)
            weekly_mean = weekly_inflows.mean()
            cashflow_volatility = weekly_inflows.std() / (weekly_mean + 1e-5)
        else:
            cashflow_volatility = 1.0  # High default uncertainty for single observation
            
        # Consistency
        active_days = df["timestamp"].dt.date.nunique()
        tx_consistency = active_days / history_days
        
        # Savings & Financial Discipline
        # We classify bill payments, airtime purchases, merchant payments, and deposits (savings)
        savings_txs = df[df["transaction_type"].isin(["deposit", "bill_payment", "merchant_payment"])]
        savings_behavior_score = (len(savings_txs) / tx_count) * 100.0 if tx_count > 0 else 0.0
        
        # Activity growth rate: Compare volume of second half of period to first half
        mid_point = first_tx + timedelta(days=history_days / 2)
        volume_h1 = df[df["timestamp"] < mid_point]["amount"].sum()
        volume_h2 = df[df["timestamp"] >= mid_point]["amount"].sum()
        activity_growth_rate = (volume_h2 - volume_h1) / (volume_h1 + 1e-5)
        
        # Repayment history score (from loans)
        repayment_history_score = 80.0  # Default score for customers without loans (neutral)
        if loans:
            loans_filtered = [
                l for l in loans 
                if isinstance(l["start_date"], datetime) and l["start_date"] <= cutoff_date
            ]
            if loans_filtered:
                total_days_late = sum(l.get("days_late", 0) for l in loans_filtered)
                total_terms = sum(l.get("term", 30) for l in loans_filtered)
                # Compute score where 100 is perfect, 0 is heavily defaulted/late
                repayment_history_score = max(0.0, 100.0 - (total_days_late / max(total_terms, 1)) * 100.0)
                
        # Anomaly score (mock metric from raw transactions, will be set during pipeline run)
        anomaly_score = 0.0
        
        # Assemble feature dict
        features = {
            "activity_days": active_days,
            "transaction_count": tx_count,
            "transaction_volume": float(tx_volume),
            "average_transaction_value": float(avg_tx_value),
            "median_transaction_value": float(median_tx_value),
            "monthly_inflows": float(monthly_inflows),
            "monthly_outflows": float(monthly_outflows),
            "inflow_outflow_ratio": float(inflow_outflow_ratio),
            "cashflow_volatility": float(cashflow_volatility),
            "transaction_consistency": float(tx_consistency),
            "savings_behavior_score": float(savings_behavior_score),
            "activity_growth_rate": float(activity_growth_rate),
            "financial_history_months": float(history_months),
            "repayment_history_score": float(repayment_history_score),
            "anomaly_score": float(anomaly_score)
        }
        
        # Calculate Financial Readiness Score (0-100)
        readiness_score = FeatureEngineer.calculate_readiness_score(features, history_days)
        features["financial_readiness_score"] = float(readiness_score)
        
        return features

    @staticmethod
    def calculate_readiness_score(features: Dict[str, Any], history_days: int) -> float:
        """
        Calculate the 0-100 Financial Readiness Score.
        Weightings:
        - History Length: 30%
        - Transaction Activity: 25%
        - Transaction Consistency: 20%
        - Observed Inflow Consistency: 15%
        - Savings/Financial Discipline: 10%
        """
        # 1. History length score (Target 90 days)
        h_score = min(history_days / 90.0, 1.0) * 100.0
        
        # 2. Transaction activity (Target 30 transactions)
        act_score = min(features["transaction_count"] / 30.0, 1.0) * 100.0
        
        # 3. Transaction consistency (Active ratio target of 25% of history days)
        cons_score = min(features["transaction_consistency"] / 0.25, 1.0) * 100.0
        
        # 4. Observed Inflow consistency
        # Higher observed inflows and lower volatility increase this score
        inflow_vol_ratio = 1.0 / (features["cashflow_volatility"] + 0.1)
        inflow_score = min(features["monthly_inflows"] / 300.0, 1.0) * 50.0 + min(inflow_vol_ratio / 5.0, 1.0) * 50.0
        
        # 5. Savings / discipline
        discipline_score = features["savings_behavior_score"]
        
        # Weighted aggregate
        readiness = (
            0.30 * h_score +
            0.25 * act_score +
            0.20 * cons_score +
            0.15 * inflow_score +
            0.10 * discipline_score
        )
        
        return round(max(0.0, min(100.0, readiness)), 2)

    @staticmethod
    def get_empty_profile() -> Dict[str, Any]:
        return {
            "activity_days": 0,
            "transaction_count": 0,
            "transaction_volume": 0.0,
            "average_transaction_value": 0.0,
            "median_transaction_value": 0.0,
            "monthly_inflows": 0.0,
            "monthly_outflows": 0.0,
            "inflow_outflow_ratio": 0.0,
            "cashflow_volatility": 1.0,
            "transaction_consistency": 0.0,
            "savings_behavior_score": 0.0,
            "activity_growth_rate": 0.0,
            "financial_history_months": 0.0,
            "repayment_history_score": 80.0,
            "anomaly_score": 0.0,
            "financial_readiness_score": 0.0
        }
