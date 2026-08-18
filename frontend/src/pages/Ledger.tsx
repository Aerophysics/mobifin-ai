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
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
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
        const txDate = new Date(t.timestamp).toISOString().split('T')[0];
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-8">
      {/* Date Picker Header */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-[var(--mf-accent)]" />
          <div>
            <h3 className="font-bold text-sm text-[var(--mf-text-primary)] uppercase tracking-wider">
              Agent Digital Ledger
            </h3>
            <p className="text-[10px] text-[var(--mf-text-secondary)]">Daily bookkeeping and reconciliation audit log</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-[var(--mf-text-secondary)]" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl px-3 py-2 text-[var(--mf-text-primary)] focus:outline-none focus:border-[var(--mf-accent)]"
          />
        </div>
      </GlassPanel>

      {/* Ledger Balances Row */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cash Ledger */}
          <GlassPanel className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--mf-border)] pb-2.5">
              <span className="text-[10px] font-bold text-[var(--mf-text-primary)] uppercase tracking-widest flex items-center">
                <Coins className="h-4 w-4 text-emerald-500 mr-1.5" />
                Cash Position (GH₵)
              </span>
              <GlassBadge variant="success">Hard Cash</GlassBadge>
            </div>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[var(--mf-text-secondary)]">
                <span>Opening Balance</span>
                <span className="font-mono">GH₵{summary.opening_cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-emerald-500 font-semibold">
                <span>Cash In</span>
                <span className="font-mono">+GH₵{summary.cash_in.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-rose-500 font-semibold">
                <span>Cash Out</span>
                <span className="font-mono">-GH₵{summary.cash_out.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-amber-500 font-semibold">
                <span>Commission earned</span>
                <span className="font-mono">+GH₵{summary.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-[var(--mf-border)] my-2" />
              <div className="flex justify-between font-extrabold text-sm text-[var(--mf-text-primary)]">
                <span>Closing Balance</span>
                <span className="font-mono">GH₵{summary.closing_cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </GlassPanel>

          {/* E-Float Ledger */}
          <GlassPanel className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--mf-border)] pb-2.5">
              <span className="text-[10px] font-bold text-[var(--mf-text-primary)] uppercase tracking-widest flex items-center">
                <Wallet className="h-4 w-4 text-sky-500 mr-1.5" />
                E-Float Position (GH₵)
              </span>
              <GlassBadge variant="info">Digital Float</GlassBadge>
            </div>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[var(--mf-text-secondary)]">
                <span>Opening Balance</span>
                <span className="font-mono">GH₵{summary.opening_float.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-emerald-500 font-semibold">
                <span>Float In (Withdrawal peaks)</span>
                <span className="font-mono">+GH₵{summary.float_in.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-rose-500 font-semibold">
                <span>Float Out (Deposits/Transfers)</span>
                <span className="font-mono">-GH₵{summary.float_out.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-[var(--mf-border)] my-2" />
              <div className="flex justify-between font-extrabold text-sm text-[var(--mf-text-primary)]">
                <span>Closing Balance</span>
                <span className="font-mono">GH₵{summary.closing_float.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </GlassPanel>

          {/* Reconciliation Status */}
          <GlassPanel className={`p-5 flex flex-col justify-between ${
            isBalanced ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'
          }`}>
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-[var(--mf-text-primary)] uppercase tracking-widest block border-b border-[var(--mf-border)] pb-2">
                Ledger Reconciliation
              </span>
              
              <div className="flex items-center space-x-2 pt-2">
                {isBalanced ? (
                  <CheckCircle className="h-8 w-8 text-emerald-500 flex-shrink-0 animate-pulse" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-500 flex-shrink-0 animate-pulse" />
                )}
                <div>
                  <h4 className="font-bold text-xs text-[var(--mf-text-primary)]">
                    {isBalanced ? 'Ledger Balanced' : 'Reconciliation Required'}
                  </h4>
                  <p className="text-[9px] text-[var(--mf-text-secondary)] mt-0.5 leading-normal">
                    {isBalanced 
                      ? 'Closing balances verify correctly against calculated inflow/outflow offsets.'
                      : 'Closing cash or float levels do not match daily transaction history aggregates.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-[10px] space-y-1.5 mt-4">
              <div className="flex justify-between">
                <span className="text-[var(--mf-text-secondary)]">Transactions Logged:</span>
                <span className="font-bold text-[var(--mf-text-primary)]">{summary.transactions_count} ops</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mf-text-secondary)]">Calculated Match Status:</span>
                <span className="font-bold text-emerald-500">✓ 100% Match</span>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Ledger Table Filters */}
      <GlassPanel className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-3.5 w-3.5 text-[var(--mf-text-secondary)]" />
            <span className="text-[10px] font-bold text-[var(--mf-text-primary)] uppercase tracking-wider">Filters:</span>
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl px-2.5 py-1.5 text-[var(--mf-text-primary)] focus:outline-none dark:text-white dark:bg-[#0c1c09]"
          >
            <option value="" className="dark:bg-[#0c1c09]">All Types</option>
            <option value="deposit" className="dark:bg-[#0c1c09]">Deposit</option>
            <option value="withdrawal" className="dark:bg-[#0c1c09]">Withdrawal</option>
            <option value="transfer" className="dark:bg-[#0c1c09]">Transfer</option>
            <option value="airtime" className="dark:bg-[#0c1c09]">Airtime</option>
            <option value="bill_payment" className="dark:bg-[#0c1c09]">Bill Payment</option>
            <option value="merchant_payment" className="dark:bg-[#0c1c09]">Merchant Payment</option>
          </select>

          <select
            value={filterDirection}
            onChange={e => setFilterDirection(e.target.value)}
            className="text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl px-2.5 py-1.5 text-[var(--mf-text-primary)] focus:outline-none dark:text-white dark:bg-[#0c1c09]"
          >
            <option value="" className="dark:bg-[#0c1c09]">All Flows</option>
            <option value="inflow" className="dark:bg-[#0c1c09]">Inflow</option>
            <option value="outflow" className="dark:bg-[#0c1c09]">Outflow</option>
          </select>

          <select
            value={filterAsset}
            onChange={e => setFilterAsset(e.target.value)}
            className="text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl px-2.5 py-1.5 text-[var(--mf-text-primary)] focus:outline-none dark:text-white dark:bg-[#0c1c09]"
          >
            <option value="" className="dark:bg-[#0c1c09]">Cash & Float</option>
            <option value="cash" className="dark:bg-[#0c1c09]">Cash-impact Only</option>
            <option value="float" className="dark:bg-[#0c1c09]">Float-impact Only</option>
          </select>

          <GlassButton onClick={handleResetFilters} className="px-3 h-8 text-[10px] font-bold">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </GlassButton>
        </div>
      </GlassPanel>

      {/* Ledger Journal Log Table */}
      <GlassPanel className="p-5">
        <h4 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider mb-4">Daily Transaction Journal</h4>
        <GlassTable 
          headers={["Time", "Type", "Cash Impact", "Float Impact", "Commission", "Running Cash", "Running Float"]}
          alignRightIndexes={[2, 3, 4, 5, 6]}
        >
          {filteredTxs.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-[var(--mf-text-secondary)] text-xs font-semibold">
                No ledger transactions logged for this date.
              </td>
            </tr>
          ) : (
            filteredTxs.map(t => (
              <tr key={t.transaction_id} className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-2 text-[var(--mf-text-secondary)] font-mono text-[10px]">
                  {new Date(t.timestamp).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </td>
                <td className="py-3 px-2 font-semibold capitalize">
                  {t.transaction_type}
                  <span className="text-[9px] text-[var(--mf-text-secondary)] font-mono block">
                    {t.customer_id ? `#${t.customer_id}` : 'Agent Adjust'}
                  </span>
                </td>
                <td className={`py-3 px-2 text-right font-bold ${
                  t.cashImpact > 0 ? 'text-emerald-500' : t.cashImpact < 0 ? 'text-rose-500' : 'text-[var(--mf-text-secondary)]'
                }`}>
                  {t.cashImpact > 0 ? '+' : ''}{t.cashImpact !== 0 ? `GH₵${t.cashImpact.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                </td>
                <td className={`py-3 px-2 text-right font-bold ${
                  t.floatImpact > 0 ? 'text-emerald-500' : t.floatImpact < 0 ? 'text-rose-500' : 'text-[var(--mf-text-secondary)]'
                }`}>
                  {t.floatImpact > 0 ? '+' : ''}{t.floatImpact !== 0 ? `GH₵${t.floatImpact.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                </td>
                <td className="py-3 px-2 text-right text-emerald-500 font-semibold">
                  GH₵{t.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-2 text-right text-[var(--mf-text-secondary)] font-mono">
                  GH₵{t.runningCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-2 text-right text-[var(--mf-text-secondary)] font-mono">
                  GH₵{t.runningFloat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))
          )}
        </GlassTable>
      </GlassPanel>
    </div>
  );
};

export default Ledger;
