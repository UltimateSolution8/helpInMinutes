'use client';

import { useState } from 'react';
import { Search, Download, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const mockLedgerEntries = [
  { id: 'L-001', helperId: 'H-101', helperName: 'John Doe', type: 'task_payment', amount: 425, balance: 15000, description: 'Task TASK-001 completed', createdAt: '2024-02-02T10:30:00' },
  { id: 'L-002', helperId: 'H-101', helperName: 'John Doe', type: 'payout', amount: -5000, balance: 10000, description: 'Bank transfer payout', createdAt: '2024-02-01T14:00:00' },
  { id: 'L-003', helperId: 'H-102', helperName: 'Jane Smith', type: 'task_payment', amount: 1700, balance: 8500, description: 'Task TASK-002 completed', createdAt: '2024-02-02T09:15:00' },
  { id: 'L-004', helperId: 'H-103', helperName: 'Mike Johnson', type: 'bonus', amount: 500, balance: 12500, description: 'Performance bonus - January', createdAt: '2024-02-01T00:00:00' },
  { id: 'L-005', helperId: 'H-104', helperName: 'Sarah Wilson', type: 'refund', amount: -200, balance: 6200, description: 'Customer refund - Task TASK-005', createdAt: '2024-01-31T16:00:00' },
];

export default function LedgerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredEntries = mockLedgerEntries.filter((entry) => {
    const matchesSearch = entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.helperName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task_payment': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'payout': return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
      case 'bonus': return <Wallet className="h-4 w-4 text-purple-500" />;
      case 'refund': return <ArrowDownLeft className="h-4 w-4 text-red-500" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Ledger</h1>
          <p className="text-muted-foreground">Track all financial transactions and balances</p>
        </div>
        <button className="btn-outline"><Download className="h-4 w-4 mr-2" />Export CSV</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Platform Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(1250000)}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Helper Payouts</p>
          <p className="text-2xl font-bold">{formatCurrency(980000)}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Platform Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(270000)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search ledger entries..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">All Types</option>
          <option value="task_payment">Task Payment</option>
          <option value="payout">Payout</option>
          <option value="bonus">Bonus</option>
          <option value="refund">Refund</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Entry ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Helper</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Balance</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{entry.id}</td>
                  <td className="px-4 py-3 text-sm">{entry.helperName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(entry.type)}
                      <span className="text-sm capitalize">{entry.type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.amount >= 0 ? '+' : ''}{formatCurrency(entry.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(entry.balance)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{entry.description}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
