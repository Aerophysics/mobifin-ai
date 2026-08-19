import { 
  UserProfile, TokenResponse, AgentProfile, CustomerProfile, 
  TransactionPagedResponse, CreditAssessment, Forecast, 
  LiquidityRecommendations, StressTestScenario, BusinessHealth, 
  Anomaly, DataExplorerMetrics, ModelPerformance 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  public static isDemoMode(): boolean {
    return localStorage.getItem('mobifin_demo_mode') === 'true';
  }

  public static setDemoMode(val: boolean): void {
    localStorage.setItem('mobifin_demo_mode', val ? 'true' : 'false');
  }

  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('mobifin_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private static handleDemoRequest<T>(endpoint: string, options: RequestInit): T {
    const cleanUrl = endpoint.split('?')[0];
    const params = new URLSearchParams(endpoint.includes('?') ? endpoint.split('?')[1] : '');
    
    // Auth Login
    if (cleanUrl === '/auth/login') {
      const body = JSON.parse(options.body as string || '{}');
      const username = body.username || 'kwame';
      let role = 'AGENT';
      let agent_id = 1;
      if (username === 'forms_capital') {
        role = 'FINANCIAL_INSTITUTION';
        agent_id = null as any;
      } else if (username === 'admin') {
        role = 'ADMIN';
        agent_id = null as any;
      }
      return {
        access_token: 'demo_token_xyz',
        token_type: 'bearer',
        role: role,
        username: username,
        agent_id: agent_id
      } as any;
    }
    
    // Status
    if (cleanUrl === '/status') {
      return {
        status: "healthy",
        database: "SQLite Fallback (Demo Mode)",
        sqlite_active: true,
        timestamp: new Date().toISOString()
      } as any;
    }
    
    // Agents me
    if (cleanUrl === '/agents/me') {
      return {
        agent_id: 1,
        name: "Kwame's Mobile Money Centre",
        location: "Greater Accra",
        business_age: 12,
        operating_hours: "08:00 - 18:00",
        cash_balance: 4850.0,
        float_balance: 7200.0,
        commission_rate: 0.015,
        city: "Accra",
        specific_location: "Central Market"
      } as any;
    }

    // Forecasts
    if (cleanUrl === '/forecasts') {
      return {
        forecast_id: 1,
        agent_id: 1,
        target_date: new Date(Date.now() + 24*3600*1000).toISOString().split('T')[0],
        predicted_cash_demand: 8200.0,
        predicted_float_demand: 11400.0,
        historical_average_cash: 7500.0,
        historical_average_float: 9000.0,
        confidence_interval_low_cash: 7200.0,
        confidence_interval_high_cash: 9200.0,
        confidence_interval_low_float: 10400.0,
        confidence_interval_high_float: 12400.0,
        model_version: "v1.2.0",
        created_at: new Date().toISOString()
      } as any;
    }

    // Customers list
    if (cleanUrl === '/customers') {
      const refs = JSON.parse(localStorage.getItem('mobifin_demo_referrals') || '[]');
      const is1048Consented = refs.some((r: any) => r.customer_id === 1048 && r.consent_status === 'CONSENT_ACTIVE');
      return [
        {
          customer_id: 1048,
          display_name: "Customer #1048",
          phone: "0541234567",
          location: "Accra Central",
          type: "retail",
          notes: "Regular agent customer",
          status: "active",
          consent_status: is1048Consented
        }
      ] as any;
    }

    // Customer details
    if (cleanUrl.startsWith('/customers/')) {
      const refs = JSON.parse(localStorage.getItem('mobifin_demo_referrals') || '[]');
      const is1048Consented = refs.some((r: any) => r.customer_id === 1048 && r.consent_status === 'CONSENT_ACTIVE');
      return {
        customer_id: 1048,
        display_name: "Customer #1048",
        phone: "0541234567",
        location: "Accra Central",
        type: "retail",
        notes: "Regular agent customer",
        status: "active",
        consent_status: is1048Consented
      } as any;
    }

    // Health
    if (cleanUrl === '/analytics/health') {
      return {
        agent_id: 1,
        business_health_score: 87,
        metrics: {
          commission_consistency: 92,
          volume_growth: 15,
          liquidity_stability: 85,
          anomaly_penalty: 0,
          recent_volume: 45000.0,
          recent_commission: 675.0
        },
        insights: [
          "Strong float turnaround ratio observed over past 30 days.",
          "Reconciliations match baseline agent logs with zero discrepancies."
        ]
      } as any;
    }

    // Recommendations
    if (cleanUrl === '/liquidity/recommendations') {
      return {
        predicted_shortfall: 4200.0,
        warning_level: "High",
        recommendation: {
          recommended_amount: 4000.0,
          recommended_time: "10:30 AM"
        },
        trusted_sources_count: 2
      } as any;
    }

    // Stress test
    if (cleanUrl === '/liquidity/stress-test') {
      return [
        { scenario: 'Baseline (Default)', projected_shortfall: 4200.0, risk_level: 'High', recommendation: 'Fund e-float early' },
        { scenario: 'Demand Spike (+10%)', projected_shortfall: 5300.0, risk_level: 'Critical', recommendation: 'Execute prompt rebalance' },
        { scenario: 'Demand Surge (+20%)', projected_shortfall: 6400.0, risk_level: 'Critical', recommendation: 'Immediate rebalance required' }
      ] as any;
    }

    // Daily metric / Ledger
    if (cleanUrl === '/ledger/daily') {
      return {
        date: params.get('date_str') || new Date().toISOString().split('T')[0],
        opening_cash: 5000.0,
        opening_float: 7000.0,
        cash_in: 12000.0,
        cash_out: 12200.0,
        commission: 50.0,
        closing_cash: 4850.0,
        closing_float: 7200.0,
        float_in: 5000.0,
        float_out: 4800.0,
        reconciliation_status: "Balanced",
        transactions_count: 24
      } as any;
    }

    // Transactions
    if (cleanUrl === '/transactions') {
      return {
        transactions: [
          { transaction_id: 101, timestamp: new Date(Date.now() - 3600000).toISOString(), transaction_type: "deposit", amount: 150.0, direction: "inflow", cash_balance: 4850.0, float_balance: 7200.0, location: "Accra" },
          { transaction_id: 102, timestamp: new Date(Date.now() - 7200000).toISOString(), transaction_type: "withdrawal", amount: 200.0, direction: "outflow", cash_balance: 4700.0, float_balance: 7400.0, location: "Accra" },
          { transaction_id: 103, timestamp: new Date(Date.now() - 14400000).toISOString(), transaction_type: "deposit", amount: 500.0, direction: "inflow", cash_balance: 4900.0, float_balance: 7200.0, location: "Accra" }
        ],
        total_count: 3
      } as any;
    }

    // Anomalies
    if (cleanUrl === '/anomalies') {
      return [] as any;
    }

    // Notifications
    if (cleanUrl === '/notifications') {
      return [
        { notification_id: 1, message: "Welcome to MobiFin AI Platform!", is_read: false, created_at: new Date().toISOString() }
      ] as any;
    }

    // Referrals (POST & GET)
    let referrals = JSON.parse(localStorage.getItem('mobifin_demo_referrals') || '[]');
    if (referrals.length === 0) {
      referrals = [
        {
          referral_id: 101,
          agent_id: 1,
          customer_id: 1048,
          institution_id: 60,
          requested_amount: 5000.0,
          purpose: "Shop inventory restock",
          status: "CONSENT_REQUESTED",
          consent_status: "AWAITING_CONSENT",
          created_at: new Date().toISOString(),
          consent_requested_at: new Date().toISOString(),
          application_status: "PENDING",
          customer_name: "Customer #1048",
          agent_name: "Kwame's Mobile Money Centre"
        }
      ];
      localStorage.setItem('mobifin_demo_referrals', JSON.stringify(referrals));
    }

    if (cleanUrl === '/referrals') {
      if (options.method === 'POST') {
        const body = JSON.parse(options.body as string || '{}');
        const is1048 = body.name?.includes('1048');
        const newRef = {
          referral_id: Date.now(),
          agent_id: 1,
          customer_id: is1048 ? 1048 : Date.now() + 10,
          institution_id: body.institution_id || 60,
          requested_amount: body.requested_amount || 5000.0,
          purpose: body.purpose || 'Business funding',
          status: 'CONSENT_REQUESTED',
          consent_status: 'AWAITING_CONSENT',
          created_at: new Date().toISOString(),
          consent_requested_at: new Date().toISOString(),
          application_status: 'PENDING',
          customer_name: body.name || 'New Customer',
          agent_name: "Kwame's Mobile Money Centre"
        };
        referrals.push(newRef);
        localStorage.setItem('mobifin_demo_referrals', JSON.stringify(referrals));
        setTimeout(() => window.dispatchEvent(new Event('ussd_update')), 200);
        return newRef as any;
      }
      return referrals as any;
    }

    // USSD pending
    if (cleanUrl === '/ussd/pending-requests') {
      return referrals
        .filter((r: any) => r.consent_status === 'AWAITING_CONSENT')
        .map((r: any) => ({
          referral_id: r.referral_id,
          requested_amount: r.requested_amount,
          customer_name: r.customer_name
        })) as any;
    }

    // USSD respond
    if (cleanUrl === '/ussd/consent-respond') {
      const referralId = parseInt(params.get('referral_id') || '0');
      const selection = parseInt(params.get('selection') || '0');
      referrals = referrals.map((r: any) => {
        if (r.referral_id === referralId) {
          if (selection === 1) {
            return {
              ...r,
              consent_status: 'CONSENT_ACTIVE',
              status: 'CONSENT_GRANTED',
              consent_responded_at: new Date().toISOString(),
              consent_expiry: new Date(Date.now() + 90*24*3600*1000).toISOString()
            };
          } else {
            return {
              ...r,
              consent_status: 'CONSENT_DECLINED',
              status: 'CONSENT_DECLINED',
              consent_responded_at: new Date().toISOString()
            };
          }
        }
        return r;
      });
      localStorage.setItem('mobifin_demo_referrals', JSON.stringify(referrals));
      setTimeout(() => window.dispatchEvent(new Event('ussd_update')), 200);
      return { message: "USSD handled successfully." } as any;
    }

    // USSD revoke
    if (cleanUrl === '/ussd/consent-revoke') {
      const referralId = parseInt(params.get('referral_id') || '0');
      referrals = referrals.map((r: any) => {
        if (r.referral_id === referralId) {
          return {
            ...r,
            consent_status: 'CONSENT_REVOKED',
            status: 'CANCELLED'
          };
        }
        return r;
      });
      localStorage.setItem('mobifin_demo_referrals', JSON.stringify(referrals));
      setTimeout(() => window.dispatchEvent(new Event('ussd_update')), 200);
      return { message: "USSD revoked successfully." } as any;
    }

    // FI referrals
    if (cleanUrl === '/institution/referrals') {
      return referrals as any;
    }

    // FI Profile
    if (cleanUrl.startsWith('/institution/referral/') && cleanUrl.endsWith('/profile')) {
      const parts = cleanUrl.split('/');
      const referralId = parseInt(parts[3] || '0');
      const ref = referrals.find((r: any) => r.referral_id === referralId);
      if (!ref || ref.consent_status !== 'CONSENT_ACTIVE') {
        throw new Error('Customer consent is required before financial information can be accessed.');
      }
      
      const is1048 = ref.customer_id === 1048;
      if (is1048) {
        return {
          display_name: "Customer #1048",
          consent_status: "CONSENT_ACTIVE",
          consent_expiry: ref.consent_expiry || new Date(Date.now() + 90*24*3600*1000).toISOString(),
          history_days: 95,
          transaction_count: 35,
          is_ready_for_credit: true,
          financial_readiness_score: 94,
          assessment: {
            credit_score: 764,
            repayment_probability: 0.91,
            default_probability: 0.09,
            risk_category: "Low Risk",
            indicative_credit_capacity: 7500.0,
            factors: [
              { feature: "Savings Behavior Score", value: 0.35 },
              { feature: "Inflow Outflow Ratio", value: 0.25 },
              { feature: "Cashflow Volatility", value: -0.15 }
            ]
          }
        } as any;
      } else {
        return {
          display_name: ref.customer_name || "New Customer",
          consent_status: "CONSENT_ACTIVE",
          consent_expiry: ref.consent_expiry || new Date(Date.now() + 90*24*3600*1000).toISOString(),
          history_days: 45,
          transaction_count: 18,
          is_ready_for_credit: false,
          financial_readiness_score: 55,
          assessment: null
        } as any;
      }
    }

    // FI decision
    if (cleanUrl.startsWith('/institution/referral/') && cleanUrl.endsWith('/decision')) {
      const parts = cleanUrl.split('/');
      const referralId = parseInt(parts[3] || '0');
      const decision = params.get('decision') || 'APPROVED';
      referrals = referrals.map((r: any) => {
        if (r.referral_id === referralId) {
          return {
            ...r,
            application_status: decision,
            status: decision
          };
        }
        return r;
      });
      localStorage.setItem('mobifin_demo_referrals', JSON.stringify(referrals));
      return { message: "Decision registered." } as any;
    }

    // FI portfolio summary
    if (cleanUrl === '/credit/portfolio-summary') {
      const activeCount = referrals.filter((r: any) => r.consent_status === 'CONSENT_ACTIVE').length;
      const readyCount = referrals.filter((r: any) => r.consent_status === 'CONSENT_ACTIVE' && r.customer_id === 1048).length;
      return {
        consented_customers: activeCount,
        credit_ready_customers: readyCount,
        average_credit_score: 764,
        indicative_credit_capacity: readyCount * 7500.0,
        pipeline: { building_history: activeCount - readyCount, consent_required: referrals.length - activeCount, credit_ready: readyCount, assessed: readyCount },
        risk_distribution: [
          { category: "Low", count: readyCount, percentage: readyCount > 0 ? 100 : 0 },
          { category: "Moderate-Low", count: 0, percentage: 0 },
          { category: "Moderate-High", count: 0, percentage: 0 },
          { category: "High", count: 0, percentage: 0 }
        ],
        recent_events: readyCount > 0 ? [
          { customer_id: 1048, event_type: "Alternative credit assessment completed", score: 764, risk: "Low", capacity: 7500.0 }
        ] : []
      } as any;
    }

    // Explorer
    if (cleanUrl === '/models/explorer') {
      return {
        agent_count: 1,
        customer_count: referrals.length,
        transaction_count: 124,
        consented_customer_count: referrals.filter((r: any) => r.consent_status === 'CONSENT_ACTIVE').length,
        sufficient_history_count: referrals.filter((r: any) => r.customer_id === 1048 && r.consent_status === 'CONSENT_ACTIVE').length,
        db_type: "SQLite Fallback (Demo Mode)"
      } as any;
    }

    // Models performance
    if (cleanUrl === '/models/performance') {
      return {
        credit_model: {
          name: "Alternative Credit XGBoost Underwriter",
          version: "v2.1.4",
          metrics: {
            roc_auc: 0.925,
            f1_score: 0.887,
            precision: 0.892,
            recall: 0.882
          }
        },
        demand_model: {
          name: "XGBoost Float Demand Predictor",
          version: "v1.2.0",
          metrics: {
            mae: 180.4,
            rmse: 245.2,
            baseline_mae: 220.5
          }
        },
        anomaly_model: {
          name: "Isolation Forest Transaction Auditor",
          version: "v0.9.1",
          metrics: {
            contamination: 0.02,
            precision: 0.950,
            recall: 0.910
          }
        }
      } as any;
    }
    
    // Onboarding businesses
    if (cleanUrl === '/onboarding/businesses') {
      return [
        {
          agent_id: 1,
          business_name: "Kwame's Mobile Money Centre",
          owner_name: "Kwame Centre",
          phone: "0541234567",
          location: "Greater Accra",
          city: "Accra",
          specific_location: "Central Market",
          business_age: 12,
          operating_hours: "08:00 - 18:00"
        }
      ] as any;
    }

    // Trusted Liquidity Sources
    if (cleanUrl === '/trusted-sources') {
      return [
        {
          source_id: 1,
          user_id: 1,
          agent_id: 1,
          name: "Kofi Super Agent",
          phone: "0244112233",
          location: "Accra Central",
          type: "Super Agent",
          notes: "Primary liquidity partner",
          status: "Active"
        },
        {
          source_id: 2,
          user_id: 1,
          agent_id: 1,
          name: "Ama Financial Services",
          phone: "0209988776",
          location: "Accra Plaza",
          type: "Financial Institution",
          notes: "Secondary emergency float channel",
          status: "Active"
        }
      ] as any;
    }

    // Seed
    if (cleanUrl === '/demo/seed') {
      localStorage.removeItem('mobifin_demo_referrals');
      return { message: "Demo data reset successfully." } as any;
    }

    return {} as any;
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (this.isDemoMode()) {
      return this.handleDemoRequest<T>(endpoint, options);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second API timeout

    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      ...options,
      signal: controller.signal,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, defaultOptions);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorDetail = 'API Error';
        try {
          const errBody = await response.json();
          errorDetail = errBody.detail || errBody.message || errorDetail;
        } catch {
          // ignore parsing error
        }
        throw new Error(errorDetail);
      }
      
      return await response.json() as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error(`API request failed on ${endpoint}:`, error);

      if (error.name === 'AbortError') {
        throw new Error("Unable to reach MobiFin services. Request timed out.");
      }
      
      const msg = error.message || '';
      if (msg.includes('fetch') || msg.includes('Load failed') || msg.includes('NetworkError') || error.name === 'TypeError') {
        throw new Error("We couldn't connect to MobiFin services. Please check your connection and try again.");
      }
      throw error;
    }
  }

  // --- AUTHENTICATION ---
  static async login(username: string, password: string): Promise<TokenResponse> {
    const res = await this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('mobifin_token', res.access_token);
    localStorage.setItem('mobifin_role', res.role);
    localStorage.setItem('mobifin_username', res.username);
    if (res.agent_id) {
      localStorage.setItem('mobifin_agent_id', res.agent_id.toString());
    } else {
      localStorage.removeItem('mobifin_agent_id');
    }
    return res;
  }

  static logout(): void {
    localStorage.removeItem('mobifin_token');
    localStorage.removeItem('mobifin_role');
    localStorage.removeItem('mobifin_username');
    localStorage.removeItem('mobifin_agent_id');
  }

  static getCurrentUser(): UserProfile | null {
    const token = localStorage.getItem('mobifin_token');
    const role = localStorage.getItem('mobifin_role') as any;
    const username = localStorage.getItem('mobifin_username');
    const agentIdStr = localStorage.getItem('mobifin_agent_id');
    
    if (!token || !role || !username) return null;
    
    return {
      username,
      role,
      agent_id: agentIdStr ? parseInt(agentIdStr) : null,
    };
  }

  // --- AGENTS ---
  static async getMe(): Promise<AgentProfile> {
    return this.request<AgentProfile>('/agents/me');
  }

  static async getAgentProfile(agentId: number): Promise<AgentProfile> {
    return this.request<AgentProfile>(`/agents/${agentId}`);
  }

  // --- CUSTOMERS ---
  static async listCustomers(search?: string, consentOnly?: boolean): Promise<CustomerProfile[]> {
    let query = '';
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (consentOnly !== undefined) params.push(`consent_only=${consentOnly}`);
    if (params.length > 0) {
      query = `?${params.join('&')}`;
    }
    return this.request<CustomerProfile[]>(`/customers${query}`);
  }

  static async getCustomerDetails(customerId: number): Promise<CustomerProfile> {
    return this.request<CustomerProfile>(`/customers/${customerId}`);
  }

  static async updateConsent(customerId: number, consentStatus: boolean): Promise<CustomerProfile> {
    return this.request<CustomerProfile>(`/customers/${customerId}/consent`, {
      method: 'POST',
      body: JSON.stringify({ consent_status: consentStatus }),
    });
  }

  // --- TRANSACTIONS ---
  static async listTransactions(params: {
    page?: number;
    page_size?: number;
    agent_id?: number;
    customer_id?: number;
    transaction_type?: string;
    direction?: string;
    min_amount?: number;
    max_amount?: number;
  } = {}): Promise<TransactionPagedResponse> {
    const queryParts = [];
    if (params.page) queryParts.push(`page=${params.page}`);
    if (params.page_size) queryParts.push(`page_size=${params.page_size}`);
    if (params.agent_id) queryParts.push(`agent_id=${params.agent_id}`);
    if (params.customer_id) queryParts.push(`customer_id=${params.customer_id}`);
    if (params.transaction_type) queryParts.push(`transaction_type=${params.transaction_type}`);
    if (params.direction) queryParts.push(`direction=${params.direction}`);
    if (params.min_amount !== undefined) queryParts.push(`min_amount=${params.min_amount}`);
    if (params.max_amount !== undefined) queryParts.push(`max_amount=${params.max_amount}`);
    
    const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return this.request<TransactionPagedResponse>(`/transactions${query}`);
  }

  // --- ANALYTICS & HEALTH ---
  static async getBusinessHealth(agentId?: number): Promise<BusinessHealth> {
    const query = agentId ? `?agent_id=${agentId}` : '';
    return this.request<BusinessHealth>(`/analytics/health${query}`);
  }

  // --- FORECASTS ---
  static async getForecast(agentId?: number): Promise<Forecast> {
    const query = agentId ? `?agent_id=${agentId}` : '';
    return this.request<Forecast>(`/forecasts${query}`);
  }

  // --- LIQUIDITY & STRESS TEST ---
  static async getLiquidityRecommendations(agentId?: number): Promise<LiquidityRecommendations> {
    const query = agentId ? `?agent_id=${agentId}` : '';
    return this.request<LiquidityRecommendations>(`/liquidity/recommendations${query}`);
  }

  static async getStressTest(agentId?: number): Promise<StressTestScenario[]> {
    const query = agentId ? `?agent_id=${agentId}` : '';
    return this.request<StressTestScenario[]>(`/liquidity/stress-test${query}`);
  }

  // --- CREDIT & FINANCIAL READINESS ---
  static async getCreditAssessment(customerId: number): Promise<CreditAssessment> {
    return this.request<CreditAssessment>(`/credit/assessment/${customerId}`);
  }

  static async getReadinessScore(customerId: number): Promise<any> {
    return this.request<any>(`/credit/readiness/${customerId}`);
  }

  static async getPortfolioSummary(): Promise<any> {
    return this.request<any>('/credit/portfolio-summary');
  }

  // --- ANOMALIES ---
  static async listAnomalies(agentId?: number): Promise<Anomaly[]> {
    const query = agentId ? `?agent_id=${agentId}` : '';
    return this.request<Anomaly[]>(`/anomalies${query}`);
  }

  // --- DEMO SEED ---
  static async seedDemoData(): Promise<any> {
    return this.request<any>('/demo/seed', { method: 'POST' });
  }

  // --- ADMIN MODEL CONTROLS ---
  static async getModelPerformance(): Promise<ModelPerformance> {
    return this.request<ModelPerformance>('/models/performance');
  }

  static async getDataExplorerMetrics(): Promise<DataExplorerMetrics> {
    return this.request<DataExplorerMetrics>('/models/explorer');
  }

  // --- MOBIFIN FEATURE REDESIGN ADDITIONS ---
  static async registerAgent(onboardingData: any): Promise<any> {
    return this.request<any>('/onboarding', {
      method: 'POST',
      body: JSON.stringify(onboardingData),
    });
  }

  static async getDailyLedger(dateStr?: string, agentId?: number): Promise<any> {
    const queryParts = [];
    if (dateStr) queryParts.push(`date_str=${dateStr}`);
    if (agentId) queryParts.push(`agent_id=${agentId}`);
    const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return this.request<any>(`/ledger/daily${query}`);
  }

  static async getProductCatalog(): Promise<any[]> {
    return this.request<any[]>('/financial-services/products');
  }

  static async submitFinancingRequest(requestData: any): Promise<any> {
    return this.request<any>('/financing/request', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  static async listFinancingRequests(): Promise<any[]> {
    return this.request<any[]>('/financing/requests');
  }

  static async getNotifications(): Promise<any[]> {
    return this.request<any[]>('/notifications');
  }

  static async markNotificationAsRead(notificationId: number): Promise<any> {
    return this.request<any>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  // --- SYSTEM STATUS ---
  static async getSystemStatus(): Promise<any> {
    return this.request<any>('/status');
  }

  // --- TRUSTED LIQUIDITY SOURCES ---
  static async getTrustedSources(): Promise<any[]> {
    return this.request<any[]>('/trusted-sources');
  }

  static async createTrustedSource(data: any): Promise<any> {
    return this.request<any>('/trusted-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateTrustedSource(id: number, data: any): Promise<any> {
    return this.request<any>(`/trusted-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async toggleTrustedSourceStatus(id: number, status: string): Promise<any> {
    return this.request<any>(`/trusted-sources/${id}/status?status=${status}`, {
      method: 'POST',
    });
  }

  // --- CUSTOMER REFERRALS & USSD CONSENT ---
  static async getReferrals(): Promise<any[]> {
    return this.request<any[]>('/referrals');
  }

  static async createReferral(data: any): Promise<any> {
    return this.request<any>('/referrals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getInstitutionReferrals(): Promise<any[]> {
    return this.request<any[]>('/institution/referrals');
  }

  static async getReferredCustomerProfile(id: number): Promise<any> {
    return this.request<any>(`/institution/referral/${id}/profile`);
  }

  static async postLendingDecision(id: number, decision: string): Promise<any> {
    return this.request<any>(`/institution/referral/${id}/decision?decision=${decision}`, {
      method: 'POST',
    });
  }

  static async ussdGetPendingRequests(): Promise<any[]> {
    return this.request<any[]>('/ussd/pending-requests');
  }

  static async ussdConsentRespond(referralId: number, selection: number): Promise<any> {
    return this.request<any>(`/ussd/consent-respond?referral_id=${referralId}&selection=${selection}`, {
      method: 'POST',
    });
  }

  static async ussdConsentRevoke(referralId: number): Promise<any> {
    return this.request<any>(`/ussd/consent-revoke?referral_id=${referralId}`, {
      method: 'POST',
    });
  }
}

export default ApiService;
