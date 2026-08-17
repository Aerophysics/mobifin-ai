import React, { useEffect, useState } from 'react';
import { 
  Sparkles, BrainCircuit, AlertTriangle, TrendingUp, 
  HelpCircle, ShieldCheck, RefreshCw, Layers
} from 'lucide-react';
import ApiService from '../services/api';
import { BusinessHealth, LiquidityRecommendations, Anomaly } from '../types';

const AIInsights: React.FC = () => {
  const [health, setHealth] = useState<BusinessHealth | null>(null);
  const [recs, setRecs] = useState<LiquidityRecommendations | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Kwame is agent_id = 1
      const healthData = await ApiService.getBusinessHealth(1);
      setHealth(healthData);
      
      const recData = await ApiService.getLiquidityRecommendations(1);
      setRecs(recData);

      const anomalyData = await ApiService.listAnomalies(1);
      setAnomalies(anomalyData.slice(0, 10)); // Grab first 10 anomalies
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Health Score Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card bg-white flex flex-col justify-between h-fit">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center">
              <BrainCircuit className="h-4 w-4 text-teal-605 mr-1.5" />
              Operational Score Audit
            </h4>
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative h-20 w-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="#f1f5f9" strokeWidth="5" fill="transparent" />
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="34" 
                    stroke="#0d9488" 
                    strokeWidth="5" 
                    fill="transparent" 
                    strokeDasharray="213"
                    strokeDashoffset={213 - (213 * (health?.business_health_score || 85)) / 100}
                  />
                </svg>
                <span className="absolute text-base font-extrabold text-slate-800">{health?.business_health_score || 87}%</span>
              </div>
              <span className="text-[10px] font-bold text-teal-700 mt-3 uppercase tracking-wider">Operational Health</span>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Consistency</span>
                <span className="font-semibold text-slate-850">{(health?.metrics.commission_consistency || 92).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Float Buffer Safety</span>
                <span className="font-semibold text-slate-850">{(health?.metrics.liquidity_stability || 85).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* AI Audits Info */}
          <div className="premium-card bg-slate-900 border-slate-800 text-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-teal-400 mb-3 flex items-center">
              <Sparkles className="h-4.5 w-4.5 text-teal-400 mr-1.5" />
              Grounded AI Engine
            </h4>
            <p className="text-[10px] text-slate-350 leading-normal">
              Insights are calculated deterministically from raw database records to eliminate hallucinations. 
              Decisions are coupled with your local XGBoost and Isolation Forest models.
            </p>
          </div>
        </div>

        {/* Right Columns: Active Recommendations & Anomalies */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommendations List */}
          <div className="premium-card bg-white space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Calculated Action Recommendations</h4>
            
            <div className="space-y-3.5">
              {recs && recs.recommendation ? (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold text-xs text-slate-900">{recs.recommendation.title}</h5>
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      recs.recommendation.severity === 'High' 
                        ? 'bg-red-50 text-red-700 border border-red-100' 
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {recs.recommendation.severity} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">{recs.recommendation.description}</p>
                  {recs.recommendation.recommended_amount && (
                    <div className="pt-2 flex items-center space-x-6 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Transfer Amount</span>
                        <span className="font-bold text-slate-850">GH₵{recs.recommendation.recommended_amount.toLocaleString()}</span>
                      </div>
                      {recs.recommendation.recommended_time && (
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Execution Deadline</span>
                          <span className="font-bold text-slate-850">{recs.recommendation.recommended_time}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No active liquidity recommendations found. Liquidity is balanced.</p>
              )}
            </div>
          </div>

          {/* Anomaly Inspection List */}
          <div className="premium-card bg-white space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500 mr-1.5" />
              Recent Unusual Activities Flagged
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5">Alert Date</th>
                    <th className="py-2.5">Severity</th>
                    <th className="py-2.5">Indicator</th>
                    <th className="py-2.5 text-right font-normal text-slate-400">Anomaly Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {anomalies.map(a => (
                    <tr key={a.anomaly_id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-mono text-[9px] text-slate-400">
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          a.severity === 'High' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {a.severity}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-800">{a.reason}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-500">
                        {a.score.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                  {anomalies.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-xs text-slate-400 py-4 font-semibold">No anomalies logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
