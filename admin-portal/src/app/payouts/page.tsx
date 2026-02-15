'use client';

import { useState } from 'react';
import { Search, CheckCircle, Clock, XCircle, DollarSign, Banknote } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const mockPayouts = [
  { id: 'PO-001', helperId: 'H-101', helperName: 'John Doe', amount: 15000, method: 'bank_transfer', status: 'completed', requestedAt: '2024-02-01T10:00:00', completedAt: '2024-02-01T14:00:00' },
  { id: 'PO-002', helperId: 'H-102', helperName: 'Jane Smith', amount: 8500, method: 'upi', status: 'processing', requestedAt: '2024-02-02T09:00:00', completedAt: null },
  { id: 'PO-003', helperId: 'H-103', helperName: 'Mike Johnson', amount: 12500, method: 'bank_transfer', status: 'pending', requestedAt: '2024-02-02T11:00:00', completedAt: null },
  { id: 'PO-004', helperId: 'H-104', helperName: 'Sarah Wilson', amount: 6200, method: 'paytm', status: 'failed', requestedAt: '2024-01-31T15:00:00', completedAt: null },
];

export default function PayoutsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPayouts = mockPayouts.filter((payout) => {
    const matchesSearch = payout.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.helperName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleProcessPayout = (payoutId: string) => {
    toast.success(`Payout ${payoutId} processing started`);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Helper Payouts</h1>
          <p className="text-muted-foreground">Manage and process helper withdrawal requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={() => toast('Processing all pending payouts...')}>
            <DollarSign className="h-4 w-4 mr-2" />
            Process All Pending
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold">{formatCurrency(12500)}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Processing</p>
          <p className="text-2xl font-bold">{formatCurrency(8500)}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Completed This Week</p>
          <p className="text-2xl font-bold">{formatCurrency(45000)}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Failed</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(6200)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by payout ID or helper..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Payout ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Helper</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Method</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Requested</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{payout.id}</td>
                  <td className="px-4 py-3 text-sm">{payout.helperName}</td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(payout.amount)}</td>
                  <td className="px-4 py-3 text-sm capitalize">{payout.method.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={payout.status} size="sm" /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(payout.requestedAt)}</td>
                  <td className="px-4 py-3">
                    {payout.status === 'pending' && (
                      <button onClick={() => handleProcessPayout(payout.id)} className="btn-primary btn-sm">
                        Process
                      </button>
                    )}
                    {payout.status === 'failed' && (
                      <button className="btn-outline btn-sm">Retry</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
