'use client';

import { useState } from 'react';
import { Search, AlertCircle, MessageSquare, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const mockDisputes = [
  { id: 'DSP-001', taskId: 'TASK-111', taskTitle: 'AC Repair', raisedBy: 'customer', reason: 'Poor service', description: 'The helper did not complete the work properly and left without fixing the issue.', status: 'open', amount: 500, createdAt: '2024-02-02T10:00:00' },
  { id: 'DSP-002', taskId: 'TASK-222', taskTitle: 'Plumbing', raisedBy: 'helper', reason: 'Customer not paying', description: 'Customer refused to pay after the service was completed.', status: 'under_review', amount: 350, createdAt: '2024-02-01T14:00:00' },
  { id: 'DSP-003', taskId: 'TASK-333', taskTitle: 'Cleaning', raisedBy: 'customer', reason: 'Damage to property', description: 'The helper damaged my furniture during cleaning.', status: 'resolved', amount: 800, createdAt: '2024-01-30T09:00:00', resolvedAt: '2024-02-01' },
];

export default function DisputesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredDisputes = mockDisputes.filter((dispute) => {
    const matchesSearch = dispute.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.taskTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleResolve = (disputeId: string, resolution: string) => {
    toast.success(`Dispute ${disputeId} resolved with: ${resolution}`);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispute Management</h1>
          <p className="text-muted-foreground">Resolve customer and helper disputes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Open Disputes</p>
          <p className="text-2xl font-bold text-red-600">{filteredDisputes.filter(d => d.status === 'open').length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Under Review</p>
          <p className="text-2xl font-bold text-blue-600">{filteredDisputes.filter(d => d.status === 'under_review').length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Resolved This Week</p>
          <p className="text-2xl font-bold text-green-600">{filteredDisputes.filter(d => d.status === 'resolved').length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total at Stake</p>
          <p className="text-2xl font-bold">₹{filteredDisputes.reduce((sum, d) => sum + d.amount, 0)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search disputes..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredDisputes.map((dispute) => (
          <div key={dispute.id} className="bg-card rounded-lg border overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{dispute.taskTitle}</h3>
                      <StatusBadge status={dispute.status} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">{dispute.id} • {dispute.taskId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{dispute.amount}</p>
                  <p className="text-sm text-muted-foreground">at stake</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Raised by:</span>
                  <span className="capitalize font-medium">{dispute.raisedBy}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(dispute.createdAt)}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Reason: {dispute.reason}</p>
                <p className="text-sm text-muted-foreground mt-1">{dispute.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/30">
              {dispute.status === 'open' || dispute.status === 'under_review' ? (
                <>
                  <button onClick={() => handleResolve(dispute.id, 'refund')} className="btn-outline btn-sm">
                    <DollarSign className="h-4 w-4 mr-1" />Issue Refund
                  </button>
                  <button onClick={() => handleResolve(dispute.id, 'favor_helper')} className="btn-outline btn-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />Favor Helper
                  </button>
                  <button onClick={() => handleResolve(dispute.id, 'favor_customer')} className="btn-primary btn-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />Favor Customer
                  </button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Resolved on {formatDate(dispute.resolvedAt || '')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
