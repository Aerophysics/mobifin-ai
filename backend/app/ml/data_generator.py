import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
import uuid

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

GHANAIAN_LOCATIONS = [
    "Greater Accra - Central Accra",
    "Greater Accra - Madina",
    "Ashanti - Kumasi Central",
    "Ashanti - Obuasi",
    "Northern - Tamale",
    "Western - Takoradi",
    "Volta - Ho",
    "Eastern - Koforidua",
    "Central - Cape Coast"
]

CUSTOMER_NAMES = [
    "Kwaku Mensah", "Abena Osei", "Kofi Boateng", "Ama Serwaa", "Yaw Owusu",
    "Esi Addo", "Kojo Asante", "Yaa Konadu", "Kwame Appiah", "Akua Agyemang",
    "Kofi Mensah", "Afia Amankwah", "Kwesi Boadu", "Akosua Ofori", "Kweku Baah",
    "Ama Dufie", "Yaw Frimpong", "Esi Koomson", "Kofi Arthur", "Abena Donkor"
]

class SyntheticDataGenerator:
    """
    Generates realistic, longitudinal data for MobiFin AI.
    Features 5 customer personas and Kwame's Mobile Money Centre.
    """
    
    @staticmethod
    def generate_all(
        num_agents: int = 10, 
        num_customers: int = 200, 
        days_history: int = 420
    ):
        """
        Generates agents, customers, transactions, and loans.
        Returns:
            agents (list), customers (list), transactions (list), loans (list)
        """
        # 1. Create Agents
        agents = []
        # Kwame's Centre - Hero Agent
        agents.append({
            "agent_id": 1,
            "name": "Kwame's Mobile Money Centre",
            "location": "Greater Accra - Central Accra",
            "business_age": 24,  # months
            "operating_hours": "08:00 - 20:00",
            "cash_balance": 4850.0,
            "float_balance": 7200.0,
            "commission_rate": 0.015,
            "created_at": datetime.utcnow() - timedelta(days=days_history)
        })
        
        for i in range(2, num_agents + 1):
            agents.append({
                "agent_id": i,
                "name": f"{random.choice(['Ama', 'Kojo', 'Yaaba', 'Elikem', 'Kofi'])}'s Mobile Money {random.choice(['Hub', 'Link', 'Express', 'Centre'])}",
                "location": random.choice(GHANAIAN_LOCATIONS),
                "business_age": random.randint(6, 36),
                "operating_hours": "08:00 - 18:00",
                "cash_balance": float(random.randint(2000, 8000)),
                "float_balance": float(random.randint(3000, 10000)),
                "commission_rate": 0.015,
                "created_at": datetime.utcnow() - timedelta(days=random.randint(180, days_history))
            })
            
        # 2. Create Customers
        customers = []
        # Customer 1048 - Hero Customer
        customers.append({
            "customer_id": 1048,
            "display_name": "Customer #1048", # Anonymized name for credit page
            "real_name": "Kofi Mensah (Demo)", # Kept separately for reference or settings
            "consent_status": True,
            "consent_timestamp": datetime.utcnow() - timedelta(days=400),
            "profile_created_at": datetime.utcnow() - timedelta(days=400),
            "created_at": datetime.utcnow() - timedelta(days=420),
            "persona": "stable_worker"
        })
        
        personas = ["stable_worker", "informal_trader", "disciplined_saver", "high_risk", "growing_entrepreneur"]
        
        for i in range(1, num_customers):
            # Reserve ID 1048
            cust_id = i if i < 1048 else i + 1
            if cust_id == 1048:
                cust_id = num_customers + 1
                
            persona = random.choice(personas)
            consent = random.random() > 0.3  # 70% opt-in rate
            consent_time = datetime.utcnow() - timedelta(days=random.randint(30, 360)) if consent else None
            
            customers.append({
                "customer_id": cust_id,
                "display_name": f"Customer #{cust_id}",
                "real_name": f"{random.choice(CUSTOMER_NAMES)} #{cust_id}",
                "consent_status": consent,
                "consent_timestamp": consent_time,
                "profile_created_at": consent_time,
                "created_at": datetime.utcnow() - timedelta(days=random.randint(90, days_history)),
                "persona": persona
            })
            
        # 3. Create Transactions and Loans
        transactions = []
        loans = []
        tx_id_counter = 1
        loan_id_counter = 1
        
        start_date = datetime.utcnow() - timedelta(days=days_history)
        
        # Loop through each customer to build longitudinal history
        for cust in customers:
            persona = cust["persona"]
            cust_created = cust["created_at"]
            
            # Base variables depending on persona
            if persona == "stable_worker":
                inflow_freq = 30  # Monthly salary
                inflow_amount = random.randint(3000, 6000)
                daily_tx_prob = 0.15
                savings_rate = 0.2
                default_propensity = -2.0  # Log-odds of default (very low)
            elif persona == "informal_trader":
                inflow_freq = 1  # Daily high volume
                inflow_amount = random.randint(200, 800)
                daily_tx_prob = 0.8
                savings_rate = 0.05
                default_propensity = 0.2  # Moderate default risk
            elif persona == "disciplined_saver":
                inflow_freq = 7  # Weekly
                inflow_amount = random.randint(800, 1500)
                daily_tx_prob = 0.25
                savings_rate = 0.4
                default_propensity = -1.5  # Low risk
            elif persona == "high_risk":
                inflow_freq = 15  # Irregular
                inflow_amount = random.randint(500, 2000)
                daily_tx_prob = 0.4
                savings_rate = 0.01
                default_propensity = 1.5  # High risk
            else:  # growing_entrepreneur
                inflow_freq = 3  # Semi-regular
                inflow_amount = random.randint(600, 1800)
                daily_tx_prob = 0.5
                savings_rate = 0.15
                default_propensity = -0.5  # Moderate-low risk
                
            # Make sure Customer 1048 matches the Kwame's narrative: Stable worker
            if cust["customer_id"] == 1048:
                inflow_freq = 30
                inflow_amount = 5500
                daily_tx_prob = 0.2
                savings_rate = 0.25
                default_propensity = -2.5  # Deterministic high quality
                
            # Iterate day by day from customer creation to today
            current_day = cust_created
            today = datetime.utcnow()
            days_active = 0
            
            # History of loans for this customer
            cust_loans = []
            
            # Simulated balances tracker for Kwame (Agent 1) to match Kwame's current status
            # We'll assign Kwame to a solid block of customer transactions
            agent_id = 1 if cust["customer_id"] % 2 == 0 or cust["customer_id"] == 1048 else random.randint(1, num_agents)
            agent_ref = next(a for a in agents if a["agent_id"] == agent_id)
            
            # Initial state for transaction aggregation
            while current_day < today:
                # Inflow trigger (salaries or sales)
                is_inflow_day = False
                if inflow_freq == 1:
                    is_inflow_day = random.random() > 0.1  # 90% of days
                elif inflow_freq == 7:
                    is_inflow_day = current_day.weekday() == 4  # Every Friday
                elif inflow_freq == 30:
                    is_inflow_day = current_day.day == 28  # Monthly
                elif inflow_freq == 15:
                    is_inflow_day = current_day.day in [15, 30]
                else:  # 3 days
                    is_inflow_day = current_day.day % 3 == 0
                    
                if is_inflow_day:
                    # Inflow transaction
                    amt = inflow_amount * random.uniform(0.8, 1.2)
                    # Agent balances update
                    agent_ref["cash_balance"] += amt
                    agent_ref["float_balance"] -= amt
                    
                    transactions.append({
                        "transaction_id": tx_id_counter,
                        "agent_id": agent_id,
                        "customer_id": cust["customer_id"],
                        "timestamp": current_day + timedelta(hours=random.randint(8, 12)),
                        "transaction_type": "deposit",
                        "amount": float(round(amt, 2)),
                        "direction": "inflow",
                        "cash_balance": float(round(agent_ref["cash_balance"], 2)),
                        "float_balance": float(round(agent_ref["float_balance"], 2)),
                        "commission": float(round(amt * agent_ref["commission_rate"], 2)),
                        "location": agent_ref["location"]
                    })
                    tx_id_counter += 1
                    days_active += 1
                    
                # Other daily transactions (withdrawals, transfers, merchant bills)
                if random.random() < daily_tx_prob:
                    tx_type = random.choice(["withdrawal", "transfer", "airtime", "bill_payment", "merchant_payment"])
                    amt = random.randint(10, 500) if tx_type != "withdrawal" else random.randint(50, 1500)
                    
                    # Update Agent Balances based on tx direction
                    if tx_type == "withdrawal":
                        # Customer withdraws cash (agent gives cash, receives e-float)
                        agent_ref["cash_balance"] -= amt
                        agent_ref["float_balance"] += amt
                        direction = "outflow"
                    else:
                        # Transfers, bill payments, airtime: agent transfers float
                        agent_ref["cash_balance"] += amt
                        agent_ref["float_balance"] -= amt
                        direction = "outflow"
                        
                    transactions.append({
                        "transaction_id": tx_id_counter,
                        "agent_id": agent_id,
                        "customer_id": cust["customer_id"],
                        "timestamp": current_day + timedelta(hours=random.randint(13, 19)),
                        "transaction_type": tx_type,
                        "amount": float(round(amt, 2)),
                        "direction": direction,
                        "cash_balance": float(round(agent_ref["cash_balance"], 2)),
                        "float_balance": float(round(agent_ref["float_balance"], 2)),
                        "commission": float(round(amt * agent_ref["commission_rate"], 2)),
                        "location": agent_ref["location"]
                    })
                    tx_id_counter += 1
                    days_active += 1
                    
                # Add occasional loans for repayment training (only if consented and has been active for some time)
                if cust["consent_status"] and (current_day - cust_created).days > 120 and len(cust_loans) < 4:
                    if random.random() < 0.05:  # low probability of triggering a loan event on any day
                        # Check if no active loans
                        if not any(l["status"] == "active" for l in cust_loans):
                            loan_amt = random.choice([500, 1000, 2000, 3000])
                            # Deterministic with noise repayment outcome
                            # Use default propensity + random noise
                            score_lat = default_propensity + np.random.normal(0, 0.4)
                            default_flag = score_lat > 0.0
                            
                            days_late = 0
                            if default_flag:
                                days_late = random.randint(31, 90)
                                loan_status = "defaulted"
                                repayment_status = "defaulted"
                            else:
                                if random.random() > 0.7:
                                    days_late = random.randint(1, 15)  # Paid late but not defaulted
                                    loan_status = "paid"
                                    repayment_status = "late"
                                else:
                                    days_late = 0
                                    loan_status = "paid"
                                    repayment_status = "current"
                                    
                            start_dt = current_day
                            term = 30
                            
                            # If loan is still in the active window (started in last 30 days)
                            if (today - start_dt).days < 30:
                                loan_status = "active"
                                repayment_status = "current" if days_late == 0 else "late"
                                default_flag = False
                                days_late = max(0, (today - start_dt).days - 30)
                                if days_late > 30:
                                    repayment_status = "defaulted"
                                    default_flag = True
                                    
                            loan_item = {
                                "loan_id": loan_id_counter,
                                "customer_id": cust["customer_id"],
                                "amount": float(loan_amt),
                                "start_date": start_dt,
                                "term": term,
                                "status": loan_status,
                                "repayment_status": repayment_status,
                                "days_late": days_late,
                                "default_flag": default_flag
                            }
                            loans.append(loan_item)
                            cust_loans.append(loan_item)
                            loan_id_counter += 1
                            
                current_day += timedelta(days=1)
                
        # Final adjustment of Kwame's balances to match exactly the required narrative
        # "Cash approximately GH₵4,850 and Float approximately GH₵7,200"
        kwame = next(a for a in agents if a["agent_id"] == 1)
        kwame["cash_balance"] = 4850.0
        kwame["float_balance"] = 7200.0
        
        # Ensure Customer 1048 has correct loan record
        # Kwame's Centre and Customer 1048 narrative requires:
        # "mid/high 700s, Low risk, ~90%+ repayment prob, clear explainability, active consent, 14 months of history"
        # We will add 3 clean paid loans for Customer 1048 to seed their repayment score
        c1048_loans = [l for l in loans if l["customer_id"] == 1048]
        if not c1048_loans:
            # Seed loans
            for idx, days_ago in enumerate([250, 150, 50]):
                loans.append({
                    "loan_id": loan_id_counter,
                    "customer_id": 1048,
                    "amount": float(1000 + idx * 500),
                    "start_date": datetime.utcnow() - timedelta(days=days_ago),
                    "term": 30,
                    "status": "paid",
                    "repayment_status": "current",
                    "days_late": 0,
                    "default_flag": False
                })
                loan_id_counter += 1
                
        return agents, customers, transactions, loans
