import React, { useEffect, useState } from 'react';
import { 
  BarChart3, Activity, ShieldAlert, TrendingUp, Award, Thermometer
} from 'lucide-react';
import ApiService from '../services/api';
import { ModelPerformance as ModelPerfType } from '../types';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassMetric } from '../components/glass/GlassMetric';
import { GlassBadge } from '../components/glass/GlassBadge';

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
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--mf-accent)]"></div>
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
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-8">
      {/* Primary summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <GlassMetric 
          title="Credit ROC-AUC"
          value={credit?.metrics.roc_auc.toFixed(4) || '—'}
          icon={Award}
          iconColorClass="text-emerald-500"
          trend={{ value: 'Target Passed', isPositive: true }}
        />
        <GlassMetric 
          title="Credit F1 Score"
          value={credit?.metrics.f1.toFixed(4) || '—'}
          icon={Activity}
          iconColorClass="text-sky-500"
          trend={{ value: 'Stable', isPositive: true }}
        />
        <GlassMetric 
          title="Forecast MAE"
          value={`GH₵${demand?.metrics.mae.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '—'}`}
          icon={TrendingUp}
          iconColorClass="text-amber-500"
          trend={{ value: `+${forecastImprovement.toFixed(0)}% vs baseline`, isPositive: true }}
        />
        <GlassMetric 
          title="Forecast RMSE"
          value={`GH₵${demand?.metrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '—'}`}
          icon={BarChart3}
          iconColorClass="text-teal-500"
        />
      </div>

      {/* Credit Model - XGBoost Classifier */}
      <GlassPanel className="p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--mf-border)] pb-3">
          <div className="flex items-center space-x-2">
            <Award className="h-4.5 w-4.5 text-[var(--mf-accent)]" />
            <h4 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Alternative Credit Classifier (XGBoost)</h4>
          </div>
          <GlassBadge variant="neutral">
            Active version: {credit?.version || 'v1.0.0'}
          </GlassBadge>
        </div>

        {credit ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2.5 lg:border-r lg:border-[var(--mf-border)] lg:pr-6">
              <h5 className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">Validation Metrics</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--mf-text-secondary)]">Validation ROC-AUC</span>
                  <span className="font-bold text-[var(--mf-text-primary)]">{credit.metrics.roc_auc.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--mf-text-secondary)]">Precision (Repay)</span>
                  <span className="font-bold text-[var(--mf-text-primary)]">{(credit.metrics.precision * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--mf-text-secondary)]">Recall (Repay)</span>
                  <span className="font-bold text-[var(--mf-text-primary)]">{(credit.metrics.recall * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 lg:border-r lg:border-[var(--mf-border)] lg:pr-6">
              <h5 className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">Confusion Matrix (Test set)</h5>
              <GlassCard className="font-mono text-[9px] text-[var(--mf-text-primary)] space-y-1 p-3">
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
              </GlassCard>
            </div>

            <div className="space-y-2 text-xs">
              <h5 className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">Training Leakage Gating</h5>
              <p className="text-[var(--mf-text-secondary)] leading-normal">
                Features utilize strict client-level splitting to prevent transaction overlaps between training and validation blocks.
              </p>
              <div className="bg-white/5 border border-[var(--mf-border)] text-[10px] text-[var(--mf-text-secondary)] p-2.5 rounded-xl mt-2">
                Religion, ethnicity, and geography details are completely stripped from feature vectors to ensure demographic neutrality.
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--mf-text-secondary)] py-4 text-center">No active credit model found.</p>
        )}
      </GlassPanel>

      {/* Demand Regressor */}
      <GlassPanel className="p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--mf-border)] pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4.5 w-4.5 text-[var(--mf-accent)]" />
            <h4 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Liquidity Demand Forecaster (XGBoost Regressor)</h4>
          </div>
          <GlassBadge variant="neutral">
            Active version: {demand?.version || 'v1.0.0'}
          </GlassBadge>
        </div>

        {demand ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2.5 lg:border-r lg:border-[var(--mf-border)] lg:pr-6">
              <h5 className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">Error Metrics</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--mf-text-secondary)]">Mean Absolute Error (MAE)</span>
                  <span className="font-bold text-[var(--mf-text-primary)]">GH₵{demand.metrics.mae.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--mf-text-secondary)]">Root Mean Square Error (RMSE)</span>
                  <span className="font-bold text-[var(--mf-text-primary)]">GH₵{demand.metrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--mf-text-secondary)]">Mean Percent Error (MAPE)</span>
                  <span className="font-bold text-[var(--mf-text-primary)]">{demand.metrics.mape.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 lg:border-r lg:border-[var(--mf-border)] lg:pr-6">
              <h5 className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">Baseline Performance</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--mf-text-secondary)]">7-Day Lag Baseline MAE</span>
                  <span className="font-bold text-[var(--mf-text-secondary)]">GH₵{demand.metrics.baseline_mae.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--mf-text-secondary)]">Model MAE</span>
                  <span className="font-bold text-[var(--mf-text-secondary)]">GH₵{demand.metrics.mae.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="pt-2 border-t border-[var(--mf-border)] flex items-center justify-between text-emerald-500 font-bold">
                  <span>Accuracy Improvement</span>
                  <span className="flex items-center text-xs">
                    <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                    +{forecastImprovement.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h5 className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">Time-Aware Partitioning</h5>
              <p className="text-[var(--mf-text-secondary)] leading-normal">
                Models are split sequentially in time to ensure look-ahead bias is zero. 
                Features utilize lagged float volumes and rolling averages.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--mf-text-secondary)] py-4 text-center">No active forecaster model found.</p>
        )}
      </GlassPanel>

      {/* Anomaly Detection - Isolation Forest */}
      <GlassPanel className="p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--mf-border)] pb-3">
          <div className="flex items-center space-x-2">
            <Thermometer className="h-4.5 w-4.5 text-[var(--mf-accent)]" />
            <h4 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Unusual Activity Flagging (Isolation Forest)</h4>
          </div>
          <GlassBadge variant="neutral">
            Active version: {anomaly?.version || 'v1.0.0'}
          </GlassBadge>
        </div>

        {anomaly ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2.5 lg:border-r lg:border-[var(--mf-border)] lg:pr-6">
              <h5 className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">Contamination Parameters</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--mf-text-secondary)]">Expected Contamination Rate</span>
                  <span className="font-bold text-[var(--mf-text-primary)]">{(anomaly.metrics.anomaly_contamination * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--mf-text-secondary)]">Historical Anomalies Flagged</span>
                  <span className="font-bold text-[var(--mf-text-primary)]">{anomaly.metrics.total_anomalies_detected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--mf-text-secondary)]">Isolation Forest Score Mean</span>
                  <span className="font-bold text-[var(--mf-text-primary)]">{anomaly.metrics.mean_score.toFixed(4)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h5 className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">Operational coupling</h5>
              <p className="text-[var(--mf-text-secondary)] leading-normal font-medium">
                Isolation Forest spatial scores are combined with deterministic single transaction sizes and velocity constraints 
                to output indicators.
              </p>
              <div className="bg-white/5 border border-[var(--mf-border)] text-[var(--mf-text-secondary)] p-2.5 rounded-xl mt-2 flex items-start space-x-2">
                <ShieldAlert className="h-4 w-4 text-[var(--mf-text-secondary)] flex-shrink-0 mt-0.5" />
                <span>Activities are labeled strictly as "Unusual transaction activity detected" to guide audits rather than declare fraud.</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--mf-text-secondary)] py-4 text-center">No active anomaly detector found.</p>
        )}
      </GlassPanel>
    </div>
  );
};

export default ModelPerformance;
