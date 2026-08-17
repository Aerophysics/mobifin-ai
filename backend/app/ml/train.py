import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
import xgboost as xgb
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score, confusion_matrix

# Add backend to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BASE_DIR)

from app.ml.data_generator import SyntheticDataGenerator
from app.ml.feature_engineering import FeatureEngineer
from app.ml.model_registry import ModelRegistry

def build_credit_dataset(customers, transactions, loans):
    """
    Builds a labeled dataset of consenting customers for credit scoring.
    For each customer with a loan, extracts features at the time of the loan start.
    Target: 1 for default, 0 for successful repayment.
    """
    records = []
    
    # Fast lookup for loans and transactions
    loan_df = pd.DataFrame(loans) if loans else pd.DataFrame()
    tx_df = pd.DataFrame(transactions) if transactions else pd.DataFrame()
    
    for cust in customers:
        if not cust["consent_status"]:
            continue
            
        cust_id = cust["customer_id"]
        cust_loans = loan_df[loan_df["customer_id"] == cust_id] if not loan_df.empty else pd.DataFrame()
        
        if cust_loans.empty:
            continue
            
        # Sort by loan start date
        cust_loans = cust_loans.sort_values(by="start_date")
        
        # Take the first loan to prevent leaks (or subsequent ones using correct cutoff)
        for _, loan in cust_loans.iterrows():
            cutoff = loan["start_date"]
            
            # Extract features up to loan start (preventing leakage)
            cust_txs = tx_df[tx_df["customer_id"] == cust_id].to_dict('records')
            
            # Exclude this loan's repayment data from feature calculation
            features = FeatureEngineer.calculate_features(cust_txs, cutoff, loans=None)
            
            # Exclude Location (Location is not a feature)
            # Add target variable (1 = default, 0 = repay)
            features["customer_id"] = cust_id
            features["default_flag"] = int(loan["default_flag"])
            
            records.append(features)
            
    if not records:
        return pd.DataFrame()
        
    return pd.DataFrame(records)

def train_credit_model(df_credit):
    """Trains the credit model and registers it"""
    if df_credit.empty:
        print("Empty credit dataset. Cannot train.")
        return
        
    # Split by customer_id to prevent data leakage (transactions from same customer in both sets)
    unique_custs = df_credit["customer_id"].unique()
    train_custs, test_custs = train_test_split(unique_custs, test_size=0.2, random_state=42)
    
    train_df = df_credit[df_credit["customer_id"].isin(train_custs)]
    test_df = df_credit[df_credit["customer_id"].isin(test_custs)]
    
    # Feature columns (exclude customer_id, location, target, and computed scores that represent targets)
    feature_cols = [
        "activity_days", "transaction_count", "transaction_volume", 
        "average_transaction_value", "median_transaction_value", 
        "monthly_inflows", "monthly_outflows", "inflow_outflow_ratio", 
        "cashflow_volatility", "transaction_consistency", 
        "savings_behavior_score", "activity_growth_rate", 
        "financial_history_months"
    ]
    
    X_train = train_df[feature_cols]
    y_train = train_df["default_flag"]
    X_test = test_df[feature_cols]
    y_test = test_df["default_flag"]
    
    print(f"Credit model training shape: {X_train.shape}, Test shape: {X_test.shape}")
    
    # XGBoost classifier
    model = xgb.XGBClassifier(
        n_estimators=50,
        max_depth=3,
        learning_rate=0.1,
        random_state=42,
        eval_metric="logloss"
    )
    
    model.fit(X_train, y_train)
    
    # Predict and evaluate
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]
    
    roc_auc = float(roc_auc_score(y_test, probs))
    precision = float(precision_score(y_test, preds, zero_division=0))
    recall = float(recall_score(y_test, preds, zero_division=0))
    f1 = float(f1_score(y_test, preds, zero_division=0))
    
    cm = confusion_matrix(y_test, preds).tolist()
    
    # Calibration analysis (basic: bucket probs and check default rates)
    # Class distribution
    defaults_ratio = float(y_train.mean())
    
    metrics = {
        "roc_auc": roc_auc,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "confusion_matrix": cm,
        "class_distribution": {
            "defaults_percentage": defaults_ratio * 100,
            "non_defaults_percentage": (1 - defaults_ratio) * 100
        },
        "feature_cols": feature_cols
    }
    
    # Save to registry
    ModelRegistry.register_model("credit", model, metrics)

def build_demand_dataset(transactions):
    """
    Creates a time-series dataset of daily demand metrics for Kwame's Centre (Agent 1)
    """
    df_tx = pd.DataFrame(transactions)
    df_kwame = df_tx[df_tx["agent_id"] == 1].copy()
    
    # Group by date
    df_kwame["date"] = df_kwame["timestamp"].dt.date
    daily = df_kwame.groupby("date").agg(
        total_volume=("amount", "sum"),
        float_demand=("amount", lambda x: x[df_kwame.loc[x.index, "transaction_type"].isin(["deposit", "bill_payment", "merchant_payment"])].sum()),
        cash_demand=("amount", lambda x: x[df_kwame.loc[x.index, "transaction_type"] == "withdrawal"].sum())
    ).reset_index()
    
    # Handle dates with no activity (reindex to continuous timeline)
    if daily.empty:
        return pd.DataFrame()
        
    start_date = daily["date"].min()
    end_date = daily["date"].max()
    all_dates = pd.date_range(start=start_date, end=end_date).date
    
    daily = daily.set_index("date").reindex(all_dates, fill_value=0).reset_index()
    daily = daily.rename(columns={"index": "date"})
    
    # Feature engineering for forecasting (lags and rolling averages)
    daily["vol_lag_1"] = daily["total_volume"].shift(1)
    daily["vol_lag_7"] = daily["total_volume"].shift(7)
    daily["vol_roll_mean_7"] = daily["total_volume"].shift(1).rolling(7).mean()
    
    daily["float_lag_1"] = daily["float_demand"].shift(1)
    daily["float_lag_7"] = daily["float_demand"].shift(7)
    daily["float_roll_mean_7"] = daily["float_demand"].shift(1).rolling(7).mean()
    
    daily["cash_lag_1"] = daily["cash_demand"].shift(1)
    daily["cash_lag_7"] = daily["cash_demand"].shift(7)
    daily["cash_roll_mean_7"] = daily["cash_demand"].shift(1).rolling(7).mean()
    
    # Date parts
    daily["day_of_week"] = pd.to_datetime(daily["date"]).dt.dayofweek
    daily["day_of_month"] = pd.to_datetime(daily["date"]).dt.day
    daily["month"] = pd.to_datetime(daily["date"]).dt.month
    
    # Drop rows with NaNs resulting from shifts
    daily = daily.dropna().reset_index(drop=True)
    return daily

def train_demand_model(df_demand):
    """Trains the demand regressor and registers it"""
    if df_demand.empty or len(df_demand) < 14:
        print("Not enough forecasting records. Cannot train forecasting model.")
        return
        
    # Time-aware split: Train on first 80% of dates, test on last 20%
    split_idx = int(len(df_demand) * 0.8)
    train_df = df_demand.iloc[:split_idx]
    test_df = df_demand.iloc[split_idx:]
    
    features = [
        "vol_lag_1", "vol_lag_7", "vol_roll_mean_7",
        "float_lag_1", "float_lag_7", "float_roll_mean_7",
        "cash_lag_1", "cash_lag_7", "cash_roll_mean_7",
        "day_of_week", "day_of_month", "month"
    ]
    
    # We train a model to forecast float demand
    # And another for cash demand
    X_train = train_df[features]
    y_train_float = train_df["float_demand"]
    y_train_cash = train_df["cash_demand"]
    
    X_test = test_df[features]
    y_test_float = test_df["float_demand"]
    y_test_cash = test_df["cash_demand"]
    
    # Train float regressor
    model_float = xgb.XGBRegressor(n_estimators=30, max_depth=3, learning_rate=0.1, random_state=42)
    model_float.fit(X_train, y_train_float)
    
    # Evaluate float regressor
    preds_float = model_float.predict(X_test)
    mae_float = float(np.mean(np.abs(y_test_float - preds_float)))
    rmse_float = float(np.sqrt(np.mean((y_test_float - preds_float) ** 2)))
    
    # MAPE
    mask = y_test_float > 0
    mape_float = float(np.mean(np.abs(y_test_float[mask] - preds_float[mask]) / y_test_float[mask])) * 100 if mask.sum() > 0 else 0.0
    
    # Baseline forecast: Previous comparable period (7-day lag)
    baseline_preds = test_df["float_lag_7"].values
    baseline_mae = float(np.mean(np.abs(y_test_float.values - baseline_preds)))
    
    metrics = {
        "mae": mae_float,
        "rmse": rmse_float,
        "mape": mape_float,
        "baseline_mae": baseline_mae,
        "features": features
    }
    
    # Train cash regressor as well and packet both into a dictionary/model
    model_cash = xgb.XGBRegressor(n_estimators=30, max_depth=3, learning_rate=0.1, random_state=42)
    model_cash.fit(X_train, y_train_cash)
    
    # Store both models as a tuple
    combined_model = {
        "float_model": model_float,
        "cash_model": model_cash,
        "features": features
    }
    
    ModelRegistry.register_model("demand", combined_model, metrics)

def train_anomaly_model(transactions):
    """Trains Isolation Forest for transaction anomaly detection"""
    if not transactions:
        return
        
    df = pd.DataFrame(transactions)
    
    # Feature extraction for anomalies: amount, transaction type encoded, direction encoded, hour of day
    df["hour"] = df["timestamp"].dt.hour
    
    # One-hot encode type
    type_dummies = pd.get_dummies(df["transaction_type"], prefix="type")
    dir_dummies = pd.get_dummies(df["direction"], prefix="dir")
    
    X = pd.concat([df[["amount", "hour"]], type_dummies, dir_dummies], axis=1)
    
    # Ensure standard column sets
    for col in ["type_deposit", "type_withdrawal", "type_transfer", "type_airtime", "type_bill_payment", "type_merchant_payment", "dir_inflow", "dir_outflow"]:
        if col not in X.columns:
            X[col] = 0
            
    # Keep columns sorted to maintain structure
    X = X.reindex(sorted(X.columns), axis=1)
    
    # Isolation forest
    iso = IsolationForest(n_estimators=100, contamination=0.03, random_state=42)
    iso.fit(X)
    
    # Store training feature list inside the wrapper
    anomaly_model = {
        "model": iso,
        "feature_cols": list(X.columns)
    }
    
    # Evaluate anomaly ratios
    scores = iso.decision_function(X)
    anom_count = int((scores < 0).sum())
    
    metrics = {
        "anomaly_contamination": 0.03,
        "total_anomalies_detected": anom_count,
        "min_score": float(scores.min()),
        "mean_score": float(scores.mean())
    }
    
    ModelRegistry.register_model("anomaly", anomaly_model, metrics)

if __name__ == "__main__":
    print("Generating synthetic dataset for pipeline...")
    agents, customers, transactions, loans = SyntheticDataGenerator.generate_all(num_agents=10, num_customers=200)
    
    print("Building features for credit model...")
    df_credit = build_credit_dataset(customers, transactions, loans)
    
    print("Training credit model...")
    train_credit_model(df_credit)
    
    print("Building demand metrics time-series...")
    df_demand = build_demand_dataset(transactions)
    
    print("Training forecasting model...")
    train_demand_model(df_demand)
    
    print("Training anomaly detection model...")
    train_anomaly_model(transactions)
    
    print("ML Pipeline training completed successfully.")
