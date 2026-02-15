'use client';

import { useState } from 'react';
import { Search, FileText, CheckCircle, XCircle, Clock, Eye, Download } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

// Mock KYC data
const mockKycSubmissions = [
  {
    id: 'KYC-001',
    helperId: 'H-101',
    helperName: 'John Doe',
    email: 'john@example.com',
    phone: '+91 98765 43210',
    documents: [
      { type: 'Aadhaar Card', status: 'verified', url: '#' },
      { type: 'PAN Card', status: 'verified', url: '#' },
      { type: 'Bank Statement', status: 'pending', url: '#' },
    ],
    submittedAt: '2024-02-02T10:00:00',
    status: 'under_review',
  },
  {
    id: 'KYC-002',
    helperId: 'H-102',
    helperName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+91 98765 43211',
    documents: [
      { type: 'Aadhaar Card', status: 'verified', url: '#' },
      { type: 'PAN Card', status: 'verified', url: '#' },
      { type: 'Passport', status: 'verified', url: '#' },
    ],
    submittedAt: '2024-02-01T14:00:00',
    status: 'pending',
  },
  {
    id: 'KYC-003',
    helperId: 'H-103',
    helperName: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '+91 98765 43212',
    documents: [
      { type: 'Aadhaar Card', status: 'verified', url: '#' },
      { type: 'Driving License', status: 'rejected', url: '#' },
    ],
    submittedAt: '2024-01-30T09:00:00',
    status: 'documents_requested',
  },
];

export default function KycReviewPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedKyc, setSelectedKyc] = useState<string | null>(null);

  const filteredKyc = mockKycSubmissions.filter((kyc) => {
    const matchesSearch =
      kyc.helperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || kyc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (kycId: string) => {
    toast.success(`KYC ${kycId} approved successfully`);
  };

  const handleReject = (kycId: string) => {
    toast.error(`KYC ${kycId} rejected`);
  };

  const handleRequestMore = (kycId: string) => {
    toast(`Additional documents requested for ${kycId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">KYC Review Queue</h1>
          <p className="text-muted-foreground">
            Review and verify helper identity documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <span className="font-medium">{filteredKyc.filter(k => k.status === 'pending').length}</span> Pending
          </div>
          <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <span className="font-medium">{filteredKyc.filter(k => k.status === 'under_review').length}</span> In Review
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by helper name, email, or KYC ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="documents_requested">Documents Requested</option>
        </select>
      </div>

      {/* KYC List */}
      <div className="space-y-4">
        {filteredKyc.map((kyc) => (
          <div
            key={kyc.id}
            className="bg-card rounded-lg border overflow-hidden"
          >
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">
                      {kyc.helperName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{kyc.helperName}</h3>
                      <StatusBadge status={kyc.status} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">{kyc.email}</p>
                    <p className="text-sm text-muted-foreground">{kyc.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{kyc.id}</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted {formatDate(kyc.submittedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="p-4 bg-muted/30">
              <h4 className="text-sm font-medium mb-3">Documents</h4>
              <div className="grid gap-3 md:grid-cols-3">
                {kyc.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === 'verified' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {doc.status === 'pending' && (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      {doc.status === 'rejected' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <button className="p-1 rounded hover:bg-accent">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 rounded hover:bg-accent">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <button
                onClick={() => handleRequestMore(kyc.id)}
                className="btn-outline btn-sm"
              >
                Request More Info
              </button>
              <button
                onClick={() => handleReject(kyc.id)}
                className="btn-destructive btn-sm"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(kyc.id)}
                className="btn-primary btn-sm"
              >
                Approve KYC
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredKyc.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No KYC submissions found</p>
        </div>
      )}
    </div>
  );
}
