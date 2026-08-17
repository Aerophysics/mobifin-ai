# Data Dictionary - MobiFin AI

This document defines the schema structures for database tables and Pydantic models.

---

## 1. Relational Database Tables (SQLAlchemy Models)

### `users` (Authentication Credentials)
- `user_id` (Integer, Primary Key)
- `username` (String, Unique) - Login credentials
- `password_hash` (String) - Bcrypt password hash
- `role` (String) - AGENT, FINANCIAL_INSTITUTION, or ADMIN
- `agent_id` (Integer, Foreign Key to `agents`, Nullable)

### `agents` (Mobile Money Agents)
- `agent_id` (Integer, Primary Key)
- `name` (String) - Kwame's Centre, Ama's Hub, etc.
- `location` (String) - Ghanaian region (Greater Accra, Ashanti, etc.)
- `business_age` (Integer) - Business history length in months
- `operating_hours` (String) - Daily working hours (e.g. 08:00 - 20:00)
- `cash_balance` (Float) - Current physical cash holdings
- `float_balance` (Float) - Current electronic money reserves
- `commission_rate` (Float) - Default commission payout fraction (e.g. 0.015)
- `created_at` (DateTime) - Account timestamp

### `customers` (Anonymized Profiles)
- `customer_id` (Integer, Primary Key) - Demographic-neutral identifier (e.g. 1048)
- `display_name` (String) - Anonymized label (e.g. "Customer #1048")
- `consent_status` (Boolean) - Profile opt-in profiling permission
- `consent_timestamp` (DateTime, Nullable) - Opt-in timestamp
- `profile_created_at` (DateTime, Nullable) - Profile generation timestamp
- `created_at` (DateTime) - Database record creation timestamp

### `transactions` (Base Transactions Ledger)
- `transaction_id` (Integer, Primary Key)
- `agent_id` (Integer, Foreign Key to `agents`)
- `customer_id` (Integer, Foreign Key to `customers`, Nullable)
- `timestamp` (DateTime) - Occurrence timestamp
- `transaction_type` (String) - deposit, withdrawal, transfer, airtime, bill_payment, merchant_payment
- `amount` (Float) - Transaction monetary amount
- `direction` (String) - inflow, outflow
- `cash_balance` (Float) - Post-transaction cash balance of the Agent
- `float_balance` (Float) - Post-transaction float balance of the Agent
- `commission` (Float) - Commission earned by the Agent
- `location` (String) - Ghanaian region where transaction was logged

### `loans` (Customer Loan History)
- `loan_id` (Integer, Primary Key)
- `customer_id` (Integer, Foreign Key to `customers`)
- `amount` (Float) - Requested principal GHS
- `start_date` (DateTime) - Loan release date
- `term` (Integer) - Repayment window in days (e.g., 30)
- `status` (String) - active, paid, defaulted
- `repayment_status` (String) - current, late, defaulted
- `days_late` (Integer) - Number of days repayment was delayed
- `default_flag` (Boolean) - Set to true if loan defaulted (>30 days late)

### `customer_financial_profiles` (Derived Features)
- `customer_id` (Integer, Primary Key, Foreign Key to `customers`)
- `activity_days` (Integer) - Unique active transaction days
- `transaction_count` (Integer) - Total transaction count
- `transaction_volume` (Float) - Sum of transaction amounts
- `average_transaction_value` (Float) - Average amount per transaction
- `median_transaction_value` (Float) - Median amount per transaction
- `monthly_inflows` (Float) - Monthly aggregated observed inflows
- `monthly_outflows` (Float) - Monthly aggregated outflows
- `inflow_outflow_ratio` (Float) - Ratio of inflows over outflows
- `cashflow_volatility` (Float) - Weekly transaction volume variance index
- `transaction_consistency` (Float) - Ratio of active days over total history days
- `savings_behavior_score` (Float) - Volumetric share of bill/merchant/deposits
- `activity_growth_rate` (Float) - growth indicator (second-half volume vs first-half)
- `financial_history_months` (Float) - Total history days divided by 30
- `repayment_history_score` (Float) - Loan repayment quality indicator
- `anomaly_score` (Float) - Anomaly rate index
- `updated_at` (DateTime) - Record refresh timestamp

### `agent_daily_metrics` (Aggregated Daily Operational Data)
- `metric_id` (Integer, Primary Key)
- `agent_id` (Integer, Foreign Key to `agents`)
- `date` (Date) - Reference date
- `total_transactions` (Integer) - Total daily count
- `total_volume` (Float) - Total daily transaction volume
- `total_commission` (Float) - Commission earned
- `avg_cash_balance` (Float) - Average cash holdings post-transactions
- `avg_float_balance` (Float) - Average float holdings post-transactions
- `anomaly_count` (Integer) - Count of anomalies flagged

### `credit_assessments` (ML Underwriting Estimates)
- `assessment_id` (Integer, Primary Key)
- `customer_id` (Integer, Foreign Key to `customers`)
- `model_version` (String) - Model registry version
- `repayment_probability` (Float) - Estimated probability of repayment (0 - 1)
- `default_probability` (Float) - Estimated default likelihood (0 - 1)
- `credit_score` (Integer) - Normed 300 - 850 Alternative Credit Score
- `risk_category` (String) - High, Moderate-High, Moderate-Low, Low Risk
- `indicative_credit_capacity` (Float) - Recommended financing limit (GHS)
- `assessment_date` (DateTime) - Calculation timestamp

### `credit_explanations` (SHAP Values)
- `explanation_id` (Integer, Primary Key)
- `assessment_id` (Integer, Foreign Key to `credit_assessments`)
- `feature_name` (String) - Feature tag
- `importance_value` (Float) - Feature's SHAP impact value

### `forecasts` (ML Liquidity Predictions)
- `forecast_id` (Integer, Primary Key)
- `agent_id` (Integer, Foreign Key to `agents`)
- `forecast_date` (Date) - Target date
- `predicted_transaction_volume` (Float) - Estimated GHS volume
- `predicted_float_demand` (Float) - Estimated e-float demand
- `predicted_cash_demand` (Float) - Estimated cash withdrawal demand
- `confidence` (Float) - Uncertainty score (0 - 1)
- `model_version` (String) - Model registry version

### `anomalies` (Isolation Forest Detections)
- `anomaly_id` (Integer, Primary Key)
- `agent_id` (Integer, Foreign Key to `agents`)
- `transaction_id` (Integer, Foreign Key to `transactions`, Nullable)
- `severity` (String) - Low, Medium, High
- `reason` (String) - "Unusual transaction activity detected"
- `score` (Float) - Isolation Forest score
- `created_at` (DateTime) - Flagged timestamp

### `recommendations` (Actionable Rebalancing Scripts)
- `recommendation_id` (Integer, Primary Key)
- `agent_id` (Integer, Foreign Key to `agents`)
- `type` (String) - rebalance
- `severity` (String) - Low, Medium, High
- `title` (String) - Title text
- `description` (Text) - Detailed rebalancing message
- `recommended_amount` (Float, Nullable) - Recommended rebalancing GHS
- `recommended_time` (String, Nullable) - Recommended time (e.g. 10:30 AM)
- `created_at` (DateTime) - Generated timestamp
- `status` (String) - active, snoozed, applied
