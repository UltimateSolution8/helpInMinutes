'use client';

import { useState } from 'react';
import { Search, Filter, Download, CreditCard, Smartphone, Building, Wallet } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';

const mockPayments = [
  { id: 'PAY-001', taskId: 'TASK-001', customer: 'Rajesh Kumar', amount: 500, method: 'upi', status: 'completed', transactionId: 'TXN123456', createdAt: '2024-02-02T10:30:00' },
  { id: 'PAY-002', taskId: 'TASK-002', customer: 'Priya Sharma', amount: 2000, method: 'card', status: 'completed', transactionId: 'TXN123457', createdAt: '2024-02-02T09:15:00' },
  { id: 'PAY-003', taskId: 'TASK-003', customer: 'Amit Patel', amount: 350, method: 'wallet', status: 'pending', transactionId: null, createdAt: '2024-02-02T08:00:00' },
  { id: 'PAY-004', taskId: 'TASK-004', customer: 'Sneha Reddy', amount: 600, method: 'net_banking', status: 'failed', transactionId: 'TXN123458', createdAt: '2024-02-01T16:45:00' },
  { id: 'PAY-005', taskId: 'TASK-005', customer: 'Vikram Singh', amount: 800, method: 'upi', status: 'refunded', transactionId: 'TXN123459', createdAt: '2024-02-01T14:20:00' },
];

const getMethodIcon = (method: string) => {
  switch (method) {
    case 'upi': return <Smartphone className="h-4 w-4 text-purple-500" />;
    case 'card': return <CreditCard className="h-4 w-4 text-blue-500" />;
    case 'net_banking': return <Building className="h-4 w-4 text-green-500" />;
    case 'wallet': return <Wallet className="h-4 w-4 text-orange-500" />;
    default: return <CreditCard className="h-4 w-4" />;
  }
};

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch = payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Transactions</h1>
          <p className="text-muted-foreground">View and manage all payment transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline"><Download className="h-4 w-4 mr-2" />Export</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by payment ID or customer..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Payment ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Method</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Transaction ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{payment.id}</td>
                  <td className="px-4 py-3 text-sm">{payment.customer}</td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getMethodIcon(payment.method)}
                      <span className="text-sm capitalize">{payment.method.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={payment.status} size="sm" /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{payment.transactionId || '-'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
