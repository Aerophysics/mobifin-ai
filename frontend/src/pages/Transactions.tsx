import React, { useEffect, useState } from 'react';
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import ApiService from '../services/api';
import { Transaction } from '../types';

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
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Filters Form */}
      <div className="premium-card bg-white">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Customer ID</label>
            <input
              type="number"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              placeholder="Search ID"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Type</label>
            <select
              value={txType}
              onChange={e => setTxType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-800"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="airtime">Airtime</option>
              <option value="bill_payment">Bill Payment</option>
              <option value="merchant_payment">Merchant Payment</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Direction</label>
            <select
              value={direction}
              onChange={e => setDirection(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-800"
            >
              <option value="">All Flows</option>
              <option value="inflow">Inflow</option>
              <option value="outflow">Outflow</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Min Amount</label>
            <input
              type="number"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Max Amount</label>
            <input
              type="number"
              value={maxAmount}
              onChange={e => setMaxAmount(e.target.value)}
              placeholder="10000.00"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-800"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center space-x-1.5 transition"
            >
              <Search className="h-4 w-4" />
              <span>Apply</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 p-2.5 rounded-lg flex items-center justify-center transition"
              title="Reset Filters"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Grid Table */}
      <div className="premium-card bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                    <th className="py-3">Timestamp</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Customer ID</th>
                    <th className="py-3">Direction</th>
                    <th className="py-3 text-right">Amount</th>
                    <th className="py-3 text-right">Commission</th>
                    <th className="py-3 text-right text-slate-400">Cash Bal</th>
                    <th className="py-3 text-right text-slate-400">Float Bal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs font-semibold">
                        No transactions matches the filtered criteria.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.transaction_id} className="hover:bg-slate-50/50">
                        <td className="py-3 text-slate-500 font-mono text-[10px]">
                          {new Date(tx.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="py-3 font-semibold capitalize text-slate-800">{tx.transaction_type}</td>
                        <td className="py-3 font-mono text-slate-500">
                          {tx.customer_id ? `#${tx.customer_id}` : 'Agent Balance Adjust'}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            tx.direction === 'inflow' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {tx.direction}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          GH₵{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right font-medium text-emerald-600">
                          GH₵{tx.commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right text-slate-400 font-mono">
                          GH₵{tx.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right text-slate-400 font-mono">
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
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                <span className="text-[10px] font-bold text-slate-400">
                  Showing page {page} of {totalPages} ({totalCount} transactions found)
                </span>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-slate-200 rounded-lg bg-white text-slate-650 hover:bg-slate-50 transition disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-slate-200 rounded-lg bg-white text-slate-655 hover:bg-slate-50 transition disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
