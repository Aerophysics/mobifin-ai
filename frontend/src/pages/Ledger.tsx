import React, { useEffect, useState } from 'react';
import { 
  BookOpen, Calendar, HelpCircle, CheckCircle, AlertTriangle, 
  Search, Filter, RotateCcw, Coins, Wallet, Sparkles
} from 'lucide-react';
import ApiService from '../services/api';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';
import { GlassTable } from '../components/glass/GlassTable';
import { GlassMetric } from '../components/glass/GlassMetric';
import { SectionCard, PillButton } from '../components/dash/DashKit';

interface LedgerDetail {
  date: string;
  opening_cash: number;
  cash_in: number;
  cash_out: number;
  commission: number;
  closing_cash: number;
  opening_float: number;
  float_in: number;
  float_out: number;
  closing_float: number;
  reconciliation_status: string;
  transactions_count: number;
}

export const Ledger: React.FC = () => {
  // Dates are compared in the user's local time zone, not UTC
  const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState<string>(() => localDay(new Date()));
  
  const [summary, setSummary] = useState<LedgerDetail | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTxs, setFilteredTxs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Filter States
  const [filterType, setFilterType] = useState<string>('');
  const [filterDirection, setFilterDirection] = useState<string>('');
  const [filterAsset, setFilterAsset] = useState<string>('');

  useEffect(() => {
    fetchLedgerData();
  }, [selectedDate]);

  const fetchLedgerData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch daily summary
      const ledgerSum = await ApiService.getDailyLedger(selectedDate);
      setSummary(ledgerSum);

      // 2. Fetch all transactions (large page size) to filter locally by date
      const txPaged = await ApiService.listTransactions({ page_size: 100 });
      
      // Filter transactions matching query date
      const targetDateStr = selectedDate;
      const dayTxs = txPaged.transactions.filter(t => {
        const txDate = localDay(new Date(t.timestamp));
        return txDate === targetDateStr;
      }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Reconstruct running balances and impacts
      let runningCash = ledgerSum.opening_cash;
      let runningFloat = ledgerSum.opening_float;
      
      const computedTxs = dayTxs.map(t => {
        let cashImpact = 0;
        let floatImpact = 0;
        
        if (t.transaction_type === 'withdrawal') {
          cashImpact = -t.amount;
          floatImpact = t.amount;
        } else {
          cashImpact = t.amount;
          floatImpact = -t.amount;
        }
        
        runningCash += cashImpact;
        runningFloat += floatImpact;
        
        // Add running balances for ledger rows
        return {
          ...t,
          cashImpact,
          floatImpact,
          runningCash,
          runningFloat
        };
      });

      setTransactions(computedTxs);
      applyFilters(computedTxs, filterType, filterDirection, filterAsset);
    } catch (e) {
      console.error("Ledger fetch failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (
    list: any[], 
    type: string, 
    dir: string, 
    asset: string
  ) => {
    let result = [...list];
    if (type) {
      result = result.filter(r => r.transaction_type === type);
    }
    if (dir) {
      result = result.filter(r => r.direction === dir);
    }
    if (asset) {
      if (asset === 'cash') {
        result = result.filter(r => r.cashImpact !== 0);
      } else if (asset === 'float') {
        result = result.filter(r => r.floatImpact !== 0);
      }
    }
    setFilteredTxs(result);
  };

  useEffect(() => {
    applyFilters(transactions, filterType, filterDirection, filterAsset);
  }, [filterType, filterDirection, filterAsset]);

  const handleResetFilters = () => {
    setFilterType('');
    setFilterDirection('');
    setFilterAsset('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--mf-accent)]"></div>
      </div>
    );
  }

  const isBalanced = summary?.reconciliation_status === 'Balanced';
  const money = (n: number) => `GH₵${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const selectCls = 'h-9 px-3 rounded-full border border-[var(--mf-border-strong)] bg-[var(--mf-surface)] text-[13px] text-[var(--mf-text-primary)] focus:outline-none focus:border-[var(--mf-accent)] cursor-pointer';

  const Line: React.FC<{ label: string; value: string; tone?: 'in' | 'out' | 'total' | 'muted' }> = ({ label, value, tone = 'muted' }) => (
    <div className={`flex justify-between items-center py-3 border-t border-[var(--mf-border)] first:border-t-0 text-[14px] ${tone === 'total' ? 'font-semibold' : ''}`}>
      <span className={tone === 'total' ? 'text-[var(--mf-text-primary)]' : 'text-[var(--mf-text-secondary)]'}>{label}</span>
      <span className={`mf-tabular ${
        tone === 'in' ? 'text-[var(--mf-success-ink)] font-semibold' : tone === 'out' ? 'text-[var(--mf-danger-ink)] font-semibold' : 'text-[var(--mf-text-primary)]'
      } ${tone === 'total' ? 'mf-display text-[18px]' : ''}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Date */}
      <div className="flex justify-end -mt-2">
        <label className="h-10 pl-3.5 pr-2 rounded-full border border-[var(--mf-border-strong)] bg-[var(--mf-surface)] flex items-center gap-2 text-[13px] font-medium">
          <Calendar className="h-4 w-4 text-[var(--mf-text-secondary)]" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-[13px] text-[var(--mf-text-primary)] focus:outline-none"
          />
        </label>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            <GlassMetric title="Closing cash" icon={Coins} value={money(summary.closing_cash)} subtitle={`Opened at ${money(summary.opening_cash)}`} />
            <GlassMetric title="Closing e-float" icon={Wallet} value={money(summary.closing_float)} subtitle={`Opened at ${money(summary.opening_float)}`} />
            <GlassMetric title="Commission earned" icon={Sparkles} value={money(summary.commission)} subtitle={`${summary.transactions_count} transactions`} />
            <GlassMetric
              title="Reconciliation"
              icon={isBalanced ? CheckCircle : AlertTriangle}
              value={isBalanced ? 'Balanced' : 'Check needed'}
              trend={{ value: isBalanced ? 'Matches history' : 'Mismatch', isPositive: isBalanced }}
              subtitle="Closing vs. transactions"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <SectionCard title="Cash position" icon={Coins} actions={<GlassBadge variant="success">Physical cash</GlassBadge>}>
              <Line label="Opening balance" value={money(summary.opening_cash)} />
              <Line label="Cash in" value={`+${money(summary.cash_in)}`} tone="in" />
              <Line label="Cash out" value={`−${money(summary.cash_out)}`} tone="out" />
              <Line label="Commission earned" value={`+${money(summary.commission)}`} tone="in" />
              <Line label="Closing balance" value={money(summary.closing_cash)} tone="total" />
            </SectionCard>
            <SectionCard title="E-float position" icon={Wallet} actions={<GlassBadge variant="info">Digital float</GlassBadge>}>
              <Line label="Opening balance" value={money(summary.opening_float)} />
              <Line label="Float in (from withdrawals)" value={`+${money(summary.float_in)}`} tone="in" />
              <Line label="Float out (deposits & transfers)" value={`−${money(summary.float_out)}`} tone="out" />
              <Line label="Closing balance" value={money(summary.closing_float)} tone="total" />
            </SectionCard>
          </div>
        </>
      )}

      <SectionCard
        title="Daily journal"
        icon={BookOpen}
        actions={
          <div className="hidden md:flex items-center gap-2">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectCls}>
              <option value="">All types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="airtime">Airtime</option>
              <option value="bill_payment">Bill payment</option>
              <option value="merchant_payment">Merchant payment</option>
            </select>
            <select value={filterDirection} onChange={e => setFilterDirection(e.target.value)} className={selectCls}>
              <option value="">All flows</option>
              <option value="inflow">Inflow</option>
              <option value="outflow">Outflow</option>
            </select>
            <select value={filterAsset} onChange={e => setFilterAsset(e.target.value)} className={selectCls}>
              <option value="">Cash & float</option>
              <option value="cash">Cash impact</option>
              <option value="float">Float impact</option>
            </select>
            <PillButton icon={RotateCcw} onClick={handleResetFilters}>Reset</PillButton>
          </div>
        }
      >
        <GlassTable
          headers={['Time', 'Type', 'Cash impact', 'Float impact', 'Commission', 'Running cash', 'Running float']}
          alignRightIndexes={[2, 3, 4, 5, 6]}
          className="text-[14px]"
        >
          {filteredTxs.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-[var(--mf-text-secondary)]">No transactions recorded for this date.</td>
            </tr>
          ) : filteredTxs.map(t => (
            <tr key={t.transaction_id} className="hover:bg-[var(--mf-card-glass)] transition-colors">
              <td className="py-3.5 px-2 text-[var(--mf-text-secondary)] mf-tabular">
                {new Date(t.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="py-3.5 px-2">
                <span className="font-semibold capitalize">{t.transaction_type.replace('_', ' ')}</span>
                <span className="block text-[12px] text-[var(--mf-text-secondary)]">{t.customer_id ? `Customer #${t.customer_id}` : 'Agent adjustment'}</span>
              </td>
              <td className={`py-3.5 px-2 text-right mf-tabular font-semibold ${t.cashImpact > 0 ? 'text-[var(--mf-success-ink)]' : t.cashImpact < 0 ? 'text-[var(--mf-danger-ink)]' : ''}`}>
                {t.cashImpact === 0 ? '—' : `${t.cashImpact > 0 ? '+' : '−'}${money(Math.abs(t.cashImpact))}`}
              </td>
              <td className={`py-3.5 px-2 text-right mf-tabular font-semibold ${t.floatImpact > 0 ? 'text-[var(--mf-success-ink)]' : t.floatImpact < 0 ? 'text-[var(--mf-danger-ink)]' : ''}`}>
                {t.floatImpact === 0 ? '—' : `${t.floatImpact > 0 ? '+' : '−'}${money(Math.abs(t.floatImpact))}`}
              </td>
              <td className="py-3.5 px-2 text-right mf-tabular">{money(t.commission)}</td>
              <td className="py-3.5 px-2 text-right mf-tabular text-[var(--mf-text-secondary)]">{money(t.runningCash)}</td>
              <td className="py-3.5 px-2 text-right mf-tabular text-[var(--mf-text-secondary)]">{money(t.runningFloat)}</td>
            </tr>
          ))}
        </GlassTable>
      </SectionCard>
    </div>
  );
};

export default Ledger;
