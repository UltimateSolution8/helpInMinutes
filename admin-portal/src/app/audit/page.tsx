'use client';

import { useState } from 'react';
import { Search, Download, User, Shield, FileText, DollarSign, Settings, CheckCircle, XCircle } from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';

const mockAuditLogs = [
  { id: 'AUD-001', user: 'Admin User', action: 'approve', resourceType: 'kyc', resourceId: 'KYC-001', ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: '2024-02-02T10:30:00' },
  { id: 'AUD-002', user: 'Admin User', action: 'update', resourceType: 'task', resourceId: 'TASK-001', ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: '2024-02-02T09:15:00' },
  { id: 'AUD-003', user: 'System', action: 'login', resourceType: 'user', resourceId: 'U-102', ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: '2024-02-02T08:00:00' },
  { id: 'AUD-004', user: 'Admin User', action: 'reject', resourceType: 'kyc', resourceId: 'KYC-003', ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: '2024-02-01T16:45:00' },
  { id: 'AUD-005', user: 'Admin User', action: 'process', resourceType: 'payout', resourceId: 'PO-001', ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: '2024-02-01T14:20:00' },
];

const getActionIcon = (action: string) => {
  switch (action) {
    case 'approve': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'reject': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'login': return <User className="h-4 w-4 text-blue-500" />;
    default: return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

export default function AuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch = log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Trail</h1>
          <p className="text-muted-foreground">Track all administrative actions and system events</p>
        </div>
        <button className="btn-outline"><Download className="h-4 w-4 mr-2" />Export Logs</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search audit logs..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">All Actions</option>
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
          <option value="update">Update</option>
          <option value="login">Login</option>
          <option value="process">Process</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="divide-y">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="mt-1">{getActionIcon(log.action)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.user}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="capitalize text-sm">{log.action}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-primary">{log.resourceType}</span>
                    <code className="text-xs bg-muted px-1 rounded">{log.resourceId}</code>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{log.ipAddress}</span>
                    <span>{formatRelativeTime(log.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
