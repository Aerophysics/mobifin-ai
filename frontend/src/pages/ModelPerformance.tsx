import React, { useEffect, useState } from 'react';
import { 
  BarChart3, Activity, ShieldAlert, Sparkles, ChevronRight, CheckCircle2,
  TrendingUp, Award, Thermometer
} from 'lucide-react';
import ApiService from '../services/api';
import { ModelPerformance as ModelPerfType } from '../types';

const ModelPerformance: React.FC = () => {
  const [perf, setPerf] = useState<ModelPerfType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchPerformanceMetrics();
  }, []);

  const fetchPerformanceMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.getModelPerformance();
      setPerf(res);
    } catch (e) {
      console.error("Failed to load model metrics", e);
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

  const credit = perf?.credit_model;
  const demand = perf?.demand_model;
  const anomaly = perf?.anomaly_model;

  let forecastImprovement = 0;
  if (demand && demand.metrics) {
    const baseMae = demand.metrics.baseline_mae || 1;
    const modelMae = demand.metrics.mae || 1;
    forecastImprovement = ((baseMae - modelMae) / baseMae) * 100;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Primary summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Credit ROC-AUC</span>
          <span className="text-xl font-bold text-slate-800 block mt-1.5">{credit?.metrics.roc_auc.toFixed(4) || '—'}</span>
        </div>
        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Credit F1 Score</span>
          <span className="text-xl font-bold text-slate-800 block mt-1.5">{credit?.metrics.f1.toFixed(4) || '—'}</span>
        </div>
        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Forecast MAE</span>
          <span className="text-xl font-bold text-slate-800 block mt-1.5">
            GH₵{demand?.metrics.mae.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '—'}
          </span>
        </div>
        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Forecast RMSE</span>
          <span className="text-xl font-bold text-slate-800 block mt-1.5">
            GH₵{demand?.metrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '—'}
          </span>
        </div>
      </div>

      {/* Credit Model - XGBoost Classifier */}
      <div className="premium-card bg-white space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="h-4.5 w-4.5 text-teal-650" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Alternative Credit Classifier (XGBoost)</h4>
          </div>
          <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Active version: {credit?.version || 'v1.0.0'}
          </span>
        </div>

        {credit ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2.5 lg:border-r lg:border-slate-100 lg:pr-6">
              <h5 className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Validation Metrics</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Validation ROC-AUC</span>
                  <span className="font-bold text-slate-800">{credit.metrics.roc_auc.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Precision (Repay)</span>
                  <span className="font-bold text-slate-800">{(credit.metrics.precision * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recall (Repay)</span>
                  <span className="font-bold text-slate-800">{(credit.metrics.recall * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 lg:border-r lg:border-slate-100 lg:pr-6">
              <h5 className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Confusion Matrix (Test set)</h5>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg font-mono text-[9px] text-slate-650 space-y-1">
                <div className="flex justify-between">
                  <span>True Negative:</span>
                  <span className="font-bold">{credit.metrics.confusion_matrix[0][0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>False Positive:</span>
                  <span className="font-bold">{credit.metrics.confusion_matrix[0][1]}</span>
                </div>
                <div className="flex justify-between">
                  <span>False Negative:</span>
                  <span className="font-bold">{credit.metrics.confusion_matrix[1][0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>True Positive:</span>
                  <span className="font-bold">{credit.metrics.confusion_matrix[1][1]}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h5 className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Training Leakage Gating</h5>
              <p className="text-slate-500 leading-normal">
                Features utilize strict client-level splitting to prevent transaction overlaps between training and validation blocks.
              </p>
              <div className="bg-teal-50 border border-teal-150 text-[10px] text-teal-800 p-2.5 rounded-lg mt-2">
                Religion, ethnicity, and geography details are completely stripped from feature vectors to ensure demographic neutrality.
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No active credit model found.</p>
        )}
      </div>

      {/* Demand Regressor */}
      <div className="premium-card bg-white space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4.5 w-4.5 text-teal-650" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Liquidity Demand Forecaster (XGBoost Regressor)</h4>
          </div>
          <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Active version: {demand?.version || 'v1.0.0'}
          </span>
        </div>

        {demand ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2.5 lg:border-r lg:border-slate-100 lg:pr-6">
              <h5 className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Error Metrics</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mean Absolute Error (MAE)</span>
                  <span className="font-bold text-slate-800">GH₵{demand.metrics.mae.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Root Mean Square Error (RMSE)</span>
                  <span className="font-bold text-slate-800">GH₵{demand.metrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mean Percent Error (MAPE)</span>
                  <span className="font-bold text-slate-800">{demand.metrics.mape.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 lg:border-r lg:border-slate-100 lg:pr-6">
              <h5 className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Baseline Performance</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">7-Day Lag Baseline MAE</span>
                  <span className="font-bold text-slate-700">GH₵{demand.metrics.baseline_mae.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Model MAE</span>
                  <span className="font-bold text-slate-700">GH₵{demand.metrics.mae.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="pt-2 border-t border-slate-150 flex items-center justify-between text-emerald-600 font-bold">
                  <span>Accuracy Improvement</span>
                  <span className="flex items-center text-xs">
                    <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                    +{forecastImprovement.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h5 className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Time-Aware Partitioning</h5>
              <p className="text-slate-500 leading-normal">
                Models are split sequentially in time to ensure look-ahead bias is zero. 
                Features utilize lagged float volumes and rolling averages.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No active forecaster model found.</p>
        )}
      </div>

      {/* Anomaly Detection - Isolation Forest */}
      <div className="premium-card bg-white space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Thermometer className="h-4.5 w-4.5 text-teal-650" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Unusual Activity Flagging (Isolation Forest)</h4>
          </div>
          <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Active version: {anomaly?.version || 'v1.0.0'}
          </span>
        </div>

        {anomaly ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2.5 lg:border-r lg:border-slate-100 lg:pr-6">
              <h5 className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Contamination Parameters</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected Contamination Rate</span>
                  <span className="font-bold text-slate-800">{(anomaly.metrics.anomaly_contamination * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Historical Anomalies Flagged</span>
                  <span className="font-bold text-slate-800">{anomaly.metrics.total_anomalies_detected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Isolation Forest Score Mean</span>
                  <span className="font-bold text-slate-800">{anomaly.metrics.mean_score.toFixed(4)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h5 className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Operational coupling</h5>
              <p className="text-slate-500 leading-normal font-medium">
                Isolation Forest spatial scores are combined with deterministic single transaction sizes and velocity constraints 
                to output indicators.
              </p>
              <div className="bg-slate-50 border border-slate-200 text-slate-500 p-2.5 rounded text-[10px] mt-2 flex items-start space-x-2">
                <ShieldAlert className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>Activities are labeled strictly as "Unusual transaction activity detected" to guide audits rather than declare fraud.</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No active anomaly detector found.</p>
        )}
      </div>
    </div>
  );
};

export default ModelPerformance;
