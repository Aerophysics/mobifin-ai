from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.models.db_models import (
    User, Agent, Customer, Transaction, Loan, 
    CustomerFinancialProfile, AgentDailyMetrics, 
    Anomaly, Forecast, Recommendation
)
from backend.app.ml.data_generator import SyntheticDataGenerator
from backend.app.ml.inference import MLInference
from backend.app.services.recommender import RecommenderService
from backend.app.services.analytics import AnalyticsService
from backend.app.api.auth import get_password_hash
import datetime

router = APIRouter(prefix="/demo", tags=["Demo Mode"])

@router.post("/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    """
    Clears current tables and seeds a full, realistic demo dataset.
    Sets up Kwame's Centre (Agent 1) and Customer #1048.
    """
    try:
        # Clear existing data in reverse dependency order
        db.query(Recommendation).delete()
        db.query(Anomaly).delete()
        db.query(Forecast).delete()
        db.query(AgentDailyMetrics).delete()
        db.query(CustomerFinancialProfile).delete()
        db.query(Loan).delete()
        db.query(Transaction).delete()
        db.query(User).delete()
        db.query(Customer).delete()
        db.query(Agent).delete()
        db.commit()
        
        # 1. Generate Synthetic Data
        print("Generating synthetic data...")
        agents_data, customers_data, txs_data, loans_data = SyntheticDataGenerator.generate_all(
            num_agents=5, 
            num_customers=50, # 50 customers is enough for high-fidelity local performance
            days_history=180
        )
        
        # 2. Insert Agents
        agent_objects = {}
        for a in agents_data:
            db_agent = Agent(
                agent_id=a["agent_id"],
                name=a["name"],
                location=a["location"],
                business_age=a["business_age"],
                operating_hours=a["operating_hours"],
                cash_balance=a["cash_balance"],
                float_balance=a["float_balance"],
                commission_rate=a["commission_rate"],
                created_at=a["created_at"]
            )
            db.add(db_agent)
            agent_objects[a["agent_id"]] = db_agent
            
        # 3. Insert Customers
        customer_objects = {}
        for c in customers_data:
            db_customer = Customer(
                customer_id=c["customer_id"],
                display_name=c["display_name"],
                consent_status=c["consent_status"],
                consent_timestamp=c["consent_timestamp"],
                profile_created_at=c["profile_created_at"],
                created_at=c["created_at"]
            )
            db.add(db_customer)
            customer_objects[c["customer_id"]] = db_customer
            
        db.commit()
        
        # 4. Insert Transactions and detect anomalies along the way
        print("Inserting transactions...")
        transaction_objects = []
        for t in txs_data:
            db_tx = Transaction(
                transaction_id=t["transaction_id"],
                agent_id=t["agent_id"],
                customer_id=t["customer_id"],
                timestamp=t["timestamp"],
                transaction_type=t["transaction_type"],
                amount=t["amount"],
                direction=t["direction"],
                cash_balance=t["cash_balance"],
                float_balance=t["float_balance"],
                commission=t["commission"],
                location=t["location"]
            )
            db.add(db_tx)
            transaction_objects.append(db_tx)
            
        db.commit()
        
        # 5. Insert Loans
        print("Inserting loans...")
        for l in loans_data:
            db_loan = Loan(
                loan_id=l["loan_id"],
                customer_id=l["customer_id"],
                amount=l["amount"],
                start_date=l["start_date"],
                term=l["term"],
                status=l["status"],
                repayment_status=l["repayment_status"],
                days_late=l["days_late"],
                default_flag=l["default_flag"]
            )
            db.add(db_loan)
            
        db.commit()
        
        # 6. Seed Default Users with RBAC roles
        print("Seeding users...")
        users = [
            User(username="kwame", password_hash=get_password_hash("kwame123"), role="AGENT", agent_id=1),
            User(username="forms_capital", password_hash=get_password_hash("forms123"), role="FINANCIAL_INSTITUTION"),
            User(username="admin", password_hash=get_password_hash("admin123"), role="ADMIN")
        ]
        for u in users:
            db.add(u)
        db.commit()
        
        # 7. Aggregate AgentDailyMetrics and Flag Anomalies
        print("Calculating daily metrics and running anomaly scans...")
        # Sort transactions chronologically
        txs_sorted = sorted(transaction_objects, key=lambda x: x.timestamp)
        
        # Group by agent and date
        daily_groups = {}
        for tx in txs_sorted:
            a_id = tx.agent_id
            date_str = tx.timestamp.date()
            key = (a_id, date_str)
            if key not in daily_groups:
                daily_groups[key] = []
            daily_groups[key].append(tx)
            
        # Scan and insert anomalies + compute metrics
        for (a_id, d), day_txs in daily_groups.items():
            tot_vol = sum(t.amount for t in day_txs)
            tot_comm = sum(t.commission for t in day_txs)
            avg_cash = sum(t.cash_balance for t in day_txs) / len(day_txs)
            avg_float = sum(t.float_balance for t in day_txs) / len(day_txs)
            
            anom_count = 0
            # Inspect transactions for anomalies (Isolation Forest / Rule checks)
            for tx in day_txs:
                # Form simple dictionary representing transaction
                tx_dict = {
                    "amount": tx.amount,
                    "direction": tx.direction,
                    "transaction_type": tx.transaction_type,
                    "timestamp": tx.timestamp,
                    "customer_id": tx.customer_id
                }
                
                # Check anomaly
                is_anom, score, reason = MLInference.inspect_transaction_anomaly(tx_dict, [])
                if is_anom:
                    db_anom = Anomaly(
                        agent_id=tx.agent_id,
                        transaction_id=tx.transaction_id,
                        severity="High" if tx.amount > 5000 else "Medium",
                        reason=reason,
                        score=score,
                        created_at=tx.timestamp
                    )
                    db.add(db_anom)
                    anom_count += 1
                    
            db_metric = AgentDailyMetrics(
                agent_id=a_id,
                date=d,
                total_transactions=len(day_txs),
                total_volume=float(round(tot_vol, 2)),
                total_commission=float(round(tot_comm, 2)),
                avg_cash_balance=float(round(avg_cash, 2)),
                avg_float_balance=float(round(avg_float, 2)),
                anomaly_count=anom_count
            )
            db.add(db_metric)
            
        db.commit()
        
        # 8. Force Kwame's Centre and Customer 1048 parameters to match narrative
        # Seed daily metrics for Kwame (last 30 days) to allow forecast calculation
        kwame = db.query(Agent).filter(Agent.agent_id == 1).first()
        kwame.cash_balance = 4850.0
        kwame.float_balance = 7200.0
        db.commit()
        
        # 9. Pre-calculate tomorrow's forecast & rebalancing recommendation
        # Fetch Kwame's daily metrics
        metrics = db.query(AgentDailyMetrics).filter(
            AgentDailyMetrics.agent_id == 1
        ).order_by(AgentDailyMetrics.date.desc()).limit(30).all()
        
        metrics_list = []
        for m in reversed(metrics):
            metrics_list.append({
                "date": m.date,
                "total_transactions": m.total_transactions,
                "total_volume": m.total_volume,
                "total_commission": m.total_commission,
                "float_demand": m.total_volume * 0.8,
                "cash_demand": m.total_volume * 0.2,
            })
            
        # Run Forecast
        forecast_data = MLInference.forecast_agent_demand(metrics_list, 1)
        
        # Insert Forecast object
        tomorrow = datetime.datetime.utcnow().date() + datetime.timedelta(days=1)
        db_forecast = Forecast(
            agent_id=1,
            forecast_date=tomorrow,
            predicted_transaction_volume=forecast_data["predicted_transaction_volume"],
            predicted_float_demand=forecast_data["predicted_float_demand"],
            predicted_cash_demand=forecast_data["predicted_cash_demand"],
            confidence=forecast_data["confidence"],
            model_version=forecast_data["model_version"]
        )
        db.add(db_forecast)
        db.commit()
        
        # Generate Rebalancing recommendation
        RecommenderService.generate_recommendation(db, 1, forecast_data)
        
        return {"status": "success", "message": "Demo data successfully seeded for Kwame's Centre and Customer #1048."}
        
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
        raise HTTPException(status_code=500, detail=f"Database seeding failed: {str(e)}")
