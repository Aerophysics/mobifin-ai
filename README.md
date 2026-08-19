# MobiFin

> **Tagline:** Turn transactions into intelligence. Turn intelligence into opportunity.

MobiFin is an AI-powered financial intelligence and alternative credit assessment platform for mobile money agents and financial institutions in developing markets like Ghana. It is designed to solve two core challenges:
1. **Agent Liquidity Stockouts:** Preventing mobile money agents from running out of cash or electronic float by forecasting demand and generating rebalancing suggestions.
2. **Alternative Credit for the Underbanked:** Building opt-in, demographically-neutral financial profiles for customers using transactional behavioral indicators to score creditworthiness without conventional credit history.

---

## Technical Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons
- **Backend:** Python, FastAPI, SQLAlchemy, Alembic, Pydantic, Uvicorn
- **Database:** PostgreSQL (canonical) with SQLite fallback logic for local development
- **Machine Learning:** XGBoost (Credit Classification & Demand Forecasting), Isolation Forest (Anomaly Detection), and SHAP (Model Explainability)

---

## Getting Started

### 1. Installation & Environment Configuration
Clone the repository, then copy the environment variables:
```bash
# In the root directory
cp .env.example .env
```

Install backend dependencies:
```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

Install frontend dependencies:
```bash
cd frontend
npm install
```

### 2. Database Setup & Alembic Migrations
Start your PostgreSQL database (a `docker-compose.yml` is provided at root):
```bash
docker-compose up -d
```
*Note: If Docker/PostgreSQL is unavailable, the application automatically falls back to a local SQLite database (`backend/mobifin.db`) without changing application logic or schemas.*

Apply the database schema migrations:
```bash
cd backend
venv/bin/alembic upgrade head
```

### 3. Machine Learning Training Pipeline
Run the offline ML training pipeline to register the models and generate performance metrics:
```bash
# From the root directory
backend/venv/bin/python3 backend/app/ml/train.py
```
This script runs the feature engineering pipeline, trains models, evaluates metrics, and registers them in `backend/app/ml/artifacts/`.

### 4. Running the System
Start the backend server:
```bash
# From root directory
backend/venv/bin/uvicorn backend.app.main:app --reload --port 8000
```

Start the frontend Vite server:
```bash
# In a separate terminal, from the frontend directory
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Demo Presets (Deterministic Scenario)
MobiFin is seeded with Kwame's Centre and Customer #1048. Click the **"Reset Demo Data"** button on the bottom sidebar to initialize the databases, then select a role in the header to switch perspectives:

1. **Agent (Kwame's Centre):** See Kwame's operational health dashboard (~87/100 Health Score, ~GH₵4,850 Cash, ~GH₵7,200 Float). Inspect the **Liquidity Demand** tab to observe tomorrow's predicted peak demand of ~GH₵11,400, warning of a shortfall, and the recommendation to rebalance GH₵4,000 before 10:30 AM.
2. **Financial Institution (Forms Capital):** Switch to this role to view **Customer Intelligence**. Search **Customer #1048** to view their consented credit profile. Observe their Alternative Credit Score in the mid/high 700s, repayment probability ~90%+, and the exact model feature contributions under **"Factors influencing this assessment."**
3. **Admin:** Full access to **Data Explorer** (database counts and consent stats) and **Model Performance** (actual ROC-AUC, Precision, Recall, MAE, RMSE metrics).
