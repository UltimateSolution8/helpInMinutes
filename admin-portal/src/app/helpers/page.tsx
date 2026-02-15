'use client';

import { useState } from 'react';
import { Search, Filter, Download, MoreHorizontal, Star, MapPin, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock data for demonstration
const mockHelpers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91 98765 43210',
    city: 'Bangalore',
    skills: ['Plumbing', 'Electrical'],
    rating: 4.8,
    totalTasks: 156,
    totalEarnings: 125000,
    isOnline: true,
    kycStatus: 'approved',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+91 98765 43211',
    city: 'Mumbai',
    skills: ['Cleaning', 'Cooking'],
    rating: 4.9,
    totalTasks: 203,
    totalEarnings: 180000,
    isOnline: false,
    kycStatus: 'approved',
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '+91 98765 43212',
    city: 'Delhi',
    skills: ['Carpentry', 'Painting'],
    rating: 4.6,
    totalTasks: 89,
    totalEarnings: 75000,
    isOnline: true,
    kycStatus: 'pending',
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    phone: '+91 98765 43213',
    city: 'Bangalore',
    skills: ['Gardening', 'Pest Control'],
    rating: 4.7,
    totalTasks: 134,
    totalEarnings: 98000,
    isOnline: true,
    kycStatus: 'under_review',
    createdAt: '2024-01-20',
  },
];

export default function HelpersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([]);

  const filteredHelpers = mockHelpers.filter((helper) => {
    const matchesSearch =
      helper.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      helper.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      helper.phone.includes(searchTerm);
    
    const matchesStatus =
      statusFilter === 'all' || helper.kycStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedHelpers.length === filteredHelpers.length) {
      setSelectedHelpers([]);
    } else {
      setSelectedHelpers(filteredHelpers.map((h) => h.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedHelpers((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Helpers Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all registered helpers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="btn-primary">
            Add Helper
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search helpers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedHelpers.length > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/10">
          <span className="text-sm font-medium">
            {selectedHelpers.length} helper(s) selected
          </span>
          <button className="btn-outline btn-sm">Approve KYC</button>
          <button className="btn-outline btn-sm text-destructive">Deactivate</button>
          <button
            className="btn-ghost btn-sm ml-auto"
            onClick={() => setSelectedHelpers([])}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Helpers Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedHelpers.length === filteredHelpers.length && filteredHelpers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-input"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">Helper</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Skills</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Tasks</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Earnings</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredHelpers.map((helper) => (
                <tr key={helper.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedHelpers.includes(helper.id)}
                      onChange={() => toggleSelect(helper.id)}
                      className="rounded border-input"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {helper.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{helper.name}</p>
                        <p className="text-sm text-muted-foreground">{helper.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {helper.city}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {helper.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-full bg-muted text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{helper.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{helper.totalTasks}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatCurrency(helper.totalEarnings)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          helper.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <StatusBadge status={helper.kycStatus} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(helper.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative group">
                      <button className="p-1 rounded hover:bg-accent">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-40 bg-card rounded-lg border shadow-lg z-10">
                        <a
                          href={`/helpers/${helper.id}`}
                          className="block px-3 py-2 text-sm hover:bg-accent"
                        >
                          View Profile
                        </a>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent">
                          Edit Details
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent text-destructive">
                          Deactivate
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {filteredHelpers.length} of {mockHelpers.length} helpers
          </p>
          <div className="flex items-center gap-2">
            <button className="btn-outline btn-sm" disabled>
              Previous
            </button>
            <button className="btn-outline btn-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
