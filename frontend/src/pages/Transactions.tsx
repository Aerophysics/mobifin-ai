import React, { useEffect, useState } from 'react';
import { Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import ApiService from '../services/api';
import { Transaction } from '../types';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(12);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Filters
  const [customerId, setCustomerId] = useState<string>('');
  const [txType, setTxType] = useState<string>('');
  const [direction, setDirection] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async (resetPage = false) => {
    setIsLoading(true);
    const activePage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    try {
      const res = await ApiService.listTransactions({
        page: activePage,
        page_size: pageSize,
        customer_id: customerId ? parseInt(customerId) : undefined,
        transaction_type: txType || undefined,
        direction: direction || undefined,
        min_amount: minAmount ? parseFloat(minAmount) : undefined,
        max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
      });
      setTransactions(res.transactions);
      setTotalCount(res.total_count);
    } catch (e) {
      console.error("Failed to load transactions", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(true);
  };

  const handleResetFilters = () => {
    setCustomerId('');
    setTxType('');
    setDirection('');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
    setIsLoading(true);
    setTimeout(() => {
      ApiService.listTransactions({ page: 1, page_size: pageSize })
        .then(res => {
          setTransactions(res.transactions);
          setTotalCount(res.total_count);
        })
        .finally(() => setIsLoading(false));
    }, 50);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-8">
      {/* Filters Form */}
      <GlassPanel className="p-5">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="text-[9px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-widest block mb-1">Customer ID</label>
            <input
              type="number"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              placeholder="Search ID"
              className="w-full text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl p-2.5 focus:outline-none focus:border-[var(--mf-accent)] text-[var(--mf-text-primary)]"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-widest block mb-1">Type</label>
            <select
              value={txType}
              onChange={e => setTxType(e.target.value)}
              className="w-full text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl p-2.5 focus:outline-none focus:border-[var(--mf-accent)] text-[var(--mf-text-primary)] dark:text-white"
            >
              <option value="" className="dark:bg-[#0c1c09]">All Types</option>
              <option value="deposit" className="dark:bg-[#0c1c09]">Deposit</option>
              <option value="withdrawal" className="dark:bg-[#0c1c09]">Withdrawal</option>
              <option value="transfer" className="dark:bg-[#0c1c09]">Transfer</option>
              <option value="airtime" className="dark:bg-[#0c1c09]">Airtime</option>
              <option value="bill_payment" className="dark:bg-[#0c1c09]">Bill Payment</option>
              <option value="merchant_payment" className="dark:bg-[#0c1c09]">Merchant Payment</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-widest block mb-1">Direction</label>
            <select
              value={direction}
              onChange={e => setDirection(e.target.value)}
              className="w-full text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl p-2.5 focus:outline-none focus:border-[var(--mf-accent)] text-[var(--mf-text-primary)] dark:text-white"
            >
              <option value="" className="dark:bg-[#0c1c09]">All Flows</option>
              <option value="inflow" className="dark:bg-[#0c1c09]">Inflow</option>
              <option value="outflow" className="dark:bg-[#0c1c09]">Outflow</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-widest block mb-1">Min Amount</label>
            <input
              type="number"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl p-2.5 focus:outline-none focus:border-[var(--mf-accent)] text-[var(--mf-text-primary)]"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-widest block mb-1">Max Amount</label>
            <input
              type="number"
              value={maxAmount}
              onChange={e => setMaxAmount(e.target.value)}
              placeholder="10000.00"
              className="w-full text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl p-2.5 focus:outline-none focus:border-[var(--mf-accent)] text-[var(--mf-text-primary)]"
            />
          </div>

          <div className="flex space-x-2">
            <GlassButton
              type="submit"
              variant="primary"
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-1.5" />
              <span>Apply</span>
            </GlassButton>
            <GlassButton
              type="button"
              onClick={handleResetFilters}
              className="p-2"
              title="Reset Filters"
            >
              <RotateCcw className="h-4 w-4" />
            </GlassButton>
          </div>
        </form>
      </GlassPanel>

      {/* Grid Table */}
      <GlassPanel className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--mf-accent)]"></div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--mf-border)] text-[var(--mf-text-secondary)] font-semibold uppercase">
                    <th className="py-3">Timestamp</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Customer ID</th>
                    <th className="py-3">Direction</th>
                    <th className="py-3 text-right">Amount</th>
                    <th className="py-3 text-right">Commission</th>
                    <th className="py-3 text-right text-[var(--mf-text-secondary)]">Cash Bal</th>
                    <th className="py-3 text-right text-[var(--mf-text-secondary)]">Float Bal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--mf-border)] text-[var(--mf-text-primary)]">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[var(--mf-text-secondary)] text-xs font-semibold">
                        No transactions matches the filtered criteria.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.transaction_id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 text-[var(--mf-text-secondary)] font-mono text-[10px]">
                          {new Date(tx.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="py-3 font-semibold capitalize">{tx.transaction_type}</td>
                        <td className="py-3 font-mono text-[var(--mf-text-secondary)]">
                          {tx.customer_id ? `#${tx.customer_id}` : 'Agent Balance Adjust'}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            tx.direction === 'inflow' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {tx.direction}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold">
                          GH₵{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right font-semibold text-emerald-500">
                          GH₵{tx.commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right text-[var(--mf-text-secondary)] font-mono">
                          GH₵{tx.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right text-[var(--mf-text-secondary)] font-mono">
                          GH₵{tx.float_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[var(--mf-border)] text-xs">
                <span className="text-[10px] font-bold text-[var(--mf-text-secondary)]">
                  Showing page {page} of {totalPages} ({totalCount} transactions found)
                </span>
                <div className="flex space-x-1.5">
                  <GlassButton
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </GlassButton>
                  <GlassButton
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </GlassButton>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassPanel>
    </div>
  );
};

export default Transactions;
