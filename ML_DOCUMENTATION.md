# Machine Learning Documentation - MobiFin

This document details the ML features, pipelines, data leakage controls, scoring scales, and explanation frameworks of MobiFin.

---

## 1. Data Leakage Preventions
To ensure rigorous validation and prevent over-optimistic performance metrics, we implement four strict leakage controls:
1. **By-Customer Train/Test Splitting:** When evaluating the credit model, datasets are partitioned by `customer_id` rather than transaction rows. This guarantees that transactions belonging to a single customer cannot span both train and test sets.
2. **Time-Aware Feature Engineering:** For any labeled loan record, customer features are computed strictly up to the `start_date` of that specific loan. Transaction histories occurring after the loan release are ignored.
3. **Decoupled Target Generation:** The default/repayment label is simulated using a latent probability equations containing random Gaussian noise representing unobserved behavior, rather than a deterministic mapping of the features themselves. This forces the model to genuinely learn signals.
4. **Location Feature Exclusion:** Ghanaian regions/locales are used strictly for operational trends, and are explicitly removed from the credit scoring feature matrix to prevent regional biases.

---

## 2. Three Distinct Scoring Paradigms

### A. Alternative Credit Score (300–850)
Predicts the customer's likelihood to repay.
1. The XGBoost classifier outputs the probability of default $P(\text{default})$.
2. The repayment probability is $P(\text{repayment}) = 1.0 - P(\text{default})$.
3. The Alternative Credit Score is scaled linearly:
   $$\text{Alternative Credit Score} = 300 + (850 - 300) \times P(\text{repayment})$$
4. Risk bands:
   - `300–549`: High Risk
   - `550–649`: Moderate-High Risk
   - `650–749`: Moderate-Low Risk
   - `750–850`: Low Risk

### B. Financial Readiness Score (0–100)
Measures profile data maturity and transaction consistency before credit underwriting can trigger.
- **Constraints:** If the customer fails to meet **90 days of history**, **30 transactions**, or has **inactive consent**, we block alternative credit scoring and show the Financial Readiness Score instead.
- **Weighting:**
  - History length (days vs 90): 30%
  - Transaction activity (count vs 30): 25%
  - Transaction consistency (active days ratio): 20%
  - Observed inflow consistency (volume/stability ratio): 15%
  - Savings/discipline indicators (bill/merchant payment count ratio): 10%

### C. Agent Business Health Score (0–100)
Evaluates the agent's cash flow consistency, transaction volume growth (week-over-week), liquidity buffer safety, and anomaly frequency. Used purely for agent operational diagnostics.

---

## 3. Liquidity Demand Forecasting (XGBoost Regressor)
We train an XGBoost Regressor to forecast tomorrow's cash and float demand.
- **Features:** 1-day lag, 7-day lag, 7-day rolling average of volumes, day-of-week, day-of-month, and month.
- **Leakage Prevention:** Time-aware sequential splitting (train on first 80% dates, test on last 20% dates) prevents future transaction details from leaking into history.
- **Baseline Comparison:** The model performance is validated against a 7-day lag baseline (previous comparable-period demand) and displays actual MAE, RMSE, and MAPE metrics on the admin dashboard.

---

## 4. SHAP Model Explanations
Individual credit scoring decisions are explained using feature contribution values.
- **Mechanism:** We leverage XGBoost's fast `predict(..., pred_contribs=True)` API to calculate SHAP values.
- **Sign Inversion:** The model predicts default probability, so negative contributions in default log-odds are inverted to display positive impacts on the customer's alternative repayment score.
- **UI Label:** Explanations are rendered under the explicit, non-judgmental heading: **"Factors influencing this assessment"**.
