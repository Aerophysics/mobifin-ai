import { 
  UserProfile, TokenResponse, AgentProfile, CustomerProfile, 
  TransactionPagedResponse, CreditAssessment, Forecast, 
  LiquidityRecommendations, StressTestScenario, BusinessHealth, 
  Anomaly, DataExplorerMetrics, ModelPerformance 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
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

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        let errorDetail = 'API Error';
        try {
          const errBody = await response.json();
          errorDetail = errBody.detail || errorDetail;
        } catch {
          // ignore parsing error
        }
        throw new Error(errorDetail);
      }
      
      return await response.json() as T;
    } catch (error: any) {
      console.error(`API request failed on ${endpoint}:`, error);
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
}

export default ApiService;
