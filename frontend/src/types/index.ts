export interface UserProfile {
  username: string;
  role: 'AGENT' | 'FINANCIAL_INSTITUTION' | 'ADMIN';
  agent_id: number | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  username: string;
  agent_id: number | null;
}

export interface AgentProfile {
  agent_id: number;
  name: string;
  location: string;
  business_age: number;
  operating_hours: string;
  cash_balance: number;
  float_balance: number;
  commission_rate: number;
  created_at: string;
}

export interface CustomerProfile {
  customer_id: number;
  display_name: string;
  consent_status: boolean;
  consent_timestamp: string | null;
  profile_created_at: string | null;
  created_at: string;
}

export interface Transaction {
  transaction_id: number;
  agent_id: number;
  customer_id: number | null;
  timestamp: string;
  transaction_type: string;
  amount: number;
  direction: string;
  cash_balance: number;
  float_balance: number;
  commission: number;
  location: string;
}

export interface TransactionPagedResponse {
  transactions: Transaction[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface CreditFactor {
  feature: string;
  value: number;
}

export interface CreditAssessment {
  eligible: boolean;
  consent_active: boolean;
  history_days: number;
  transaction_count: number;
  financial_readiness_score: number;
  credit_score: number | null;
  repayment_probability: number | null;
  default_probability: number | null;
  risk_category: string | null;
  indicative_credit_capacity: number | null;
  factors: CreditFactor[] | null;
  model_version: string | null;
  reason: string | null;
  profile: any | null;
}

export interface Forecast {
  agent_id: number;
  forecast_date: string;
  predicted_transaction_volume: number;
  predicted_float_demand: number;
  predicted_cash_demand: number;
  confidence: number;
  model_version: string;
  baseline_float_demand: number;
}

export interface Recommendation {
  recommendation_id: number;
  agent_id: number;
  type: string;
  severity: string;
  title: string;
  description: string;
  recommended_amount: number | null;
  recommended_time: string | null;
  created_at: string;
  status: string;
}

export interface LiquidityRecommendations {
  expected_float_demand: number;
  current_float: number;
  predicted_shortfall: number;
  recommendation: Recommendation | null;
  warning_level: 'Low' | 'Medium' | 'High';
}

export interface StressTestScenario {
  stress_level: string;
  multiplier: number;
  original_demand: number;
  stressed_demand: number;
  current_holdings: number;
  projected_shortfall: number;
  risk_status: 'Critical' | 'Elevated' | 'Stable';
}

export interface BusinessHealth {
  agent_id: number;
  business_health_score: number;
  metrics: {
    commission_consistency: number;
    volume_growth: number;
    liquidity_stability: number;
    anomaly_penalty: number;
    recent_volume: number;
    recent_commission: number;
  };
  insights: string[];
}

export interface Anomaly {
  anomaly_id: number;
  agent_id: number;
  transaction_id: number | null;
  severity: string;
  reason: string;
  score: number;
  created_at: string;
}

export interface DataExplorerMetrics {
  agent_count: number;
  customer_count: number;
  transaction_count: number;
  consented_customer_count: number;
  sufficient_history_count: number;
  db_type: string;
}

export interface ModelPerformance {
  credit_model: any | null;
  demand_model: any | null;
  anomaly_model: any | null;
}
