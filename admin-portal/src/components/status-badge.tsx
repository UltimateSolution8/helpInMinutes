'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      // Task statuses
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' },
      assigned: { label: 'Assigned', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
      in_progress: { label: 'In Progress', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
      disputed: { label: 'Disputed', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' },
      
      // KYC statuses
      under_review: { label: 'Under Review', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
      documents_requested: { label: 'Documents Requested', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' },
      
      // Helper statuses
      active: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100' },
      online: { label: 'Online', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      
      // Payment statuses
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
      refunded: { label: 'Refunded', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' },
      
      // Payout statuses
      processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
      
      // Dispute statuses
      open: { label: 'Open', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
      under_review_dispute: { label: 'Under Review', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
      resolved: { label: 'Resolved', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      closed: { label: 'Closed', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100' },
    };
    
    return configs[status] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100' };
  };

  const config = getStatusConfig(status);
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.className,
        sizeClasses[size]
      )}
    >
      {config.label}
    </span>
  );
}
