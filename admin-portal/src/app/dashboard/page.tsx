'use client';

import { useState, useEffect } from 'react';
import { StatCard, StatCardSkeleton } from '@/components/stat-card';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import {
  ClipboardList,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
} from 'lucide-react';

// Mock data for demonstration
const mockMetrics = {
  activeTasks: 127,
  onlineHelpers: 89,
  bookingsToday: 45,
  completionRate: 94.5,
  revenueToday: 125000,
  revenueThisMonth: 3200000,
  newHelpersThisMonth: 23,
  pendingKycCount: 12,
};

const mockActivityFeed = [
  { id: 1, type: 'task', title: 'Task #1234 completed', description: 'Plumbing service at MG Road', timestamp: new Date(Date.now() - 5 * 60000) },
  { id: 2, type: 'kyc', title: 'New KYC submission', description: 'Helper #567 submitted documents', timestamp: new Date(Date.now() - 15 * 60000) },
  { id: 3, type: 'payout', title: 'Payout processed', description: '₹45,000 to helper #890', timestamp: new Date(Date.now() - 30 * 60000) },
  { id: 4, type: 'dispute', title: 'New dispute raised', description: 'Task #1111 - Customer complaint', timestamp: new Date(Date.now() - 45 * 60000) },
  { id: 5, type: 'user', title: 'New helper registered', description: 'John Doe from Bangalore', timestamp: new Date(Date.now() - 60 * 60000) },
];

const mockRevenueData = [
  { name: 'Mon', revenue: 45000 },
  { name: 'Tue', revenue: 52000 },
  { name: 'Wed', revenue: 48000 },
  { name: 'Thu', revenue: 61000 },
  { name: 'Fri', revenue: 55000 },
  { name: 'Sat', revenue: 67000 },
  { name: 'Sun', revenue: 72000 },
];

const mockTaskStatusData = [
  { name: 'Pending', value: 25, color: '#eab308' },
  { name: 'In Progress', value: 45, color: '#3b82f6' },
  { name: 'Completed', value: 120, color: '#22c55e' },
  { name: 'Cancelled', value: 10, color: '#ef4444' },
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState(mockMetrics);
  const [activityFeed, setActivityFeed] = useState(mockActivityFeed);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setIsLoading(true);
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <ClipboardList className="h-4 w-4 text-blue-500" />;
      case 'kyc':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'payout':
        return <DollarSign className="h-4 w-4 text-purple-500" />;
      case 'dispute':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'user':
        return <Users className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            Export Report
          </button>
          <button className="btn-primary">
            View Details
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton title="Active Tasks" />
            <StatCardSkeleton title="Online Helpers" />
            <StatCardSkeleton title="Bookings Today" />
            <StatCardSkeleton title="Completion Rate" />
          </>
        ) : (
          <>
            <StatCard
              title="Active Tasks"
              value={metrics.activeTasks}
              icon={ClipboardList}
              trend={8}
              trendLabel="vs yesterday"
              onClick={() => window.location.href = '/tasks'}
            />
            <StatCard
              title="Online Helpers"
              value={metrics.onlineHelpers}
              icon={Users}
              trend={12}
              trendLabel="vs yesterday"
              onClick={() => window.location.href = '/helpers'}
            />
            <StatCard
              title="Bookings Today"
              value={metrics.bookingsToday}
              icon={TrendingUp}
              trend={5}
              trendLabel="vs yesterday"
            />
            <StatCard
              title="Completion Rate"
              value={`${metrics.completionRate}%`}
              icon={CheckCircle}
              trend={2}
              trendLabel="vs last week"
            />
          </>
        )}
      </div>

      {/* Second Row Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton title="Revenue Today" />
            <StatCardSkeleton title="Revenue This Month" />
            <StatCardSkeleton title="New Helpers" />
            <StatCardSkeleton title="Pending KYC" />
          </>
        ) : (
          <>
            <StatCard
              title="Revenue Today"
              value={formatCurrency(metrics.revenueToday)}
              icon={DollarSign}
              trend={15}
              trendLabel="vs yesterday"
            />
            <StatCard
              title="Revenue This Month"
              value={formatCurrency(metrics.revenueThisMonth)}
              icon={DollarSign}
              trend={22}
              trendLabel="vs last month"
            />
            <StatCard
              title="New Helpers"
              value={metrics.newHelpersThisMonth}
              icon={Users}
              trend={18}
              trendLabel="this month"
              onClick={() => window.location.href = '/helpers'}
            />
            <StatCard
              title="Pending KYC"
              value={metrics.pendingKycCount}
              icon={Clock}
              className={metrics.pendingKycCount > 10 ? 'border-yellow-500' : ''}
              onClick={() => window.location.href = '/kyc-review'}
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Revenue</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {mockRevenueData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                  style={{ height: `${(day.revenue / 72000) * 100}%`, minHeight: '20px' }}
                />
                <span className="text-xs text-muted-foreground">{day.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Status Chart */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Task Status Distribution</h3>
          <div className="flex items-center justify-center h-64">
            <div className="flex gap-8">
              {mockTaskStatusData.map((status, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: `${status.color}20`, color: status.color }}
                  >
                    {status.value}
                  </div>
                  <span className="text-sm text-muted-foreground">{status.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-card rounded-lg border">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <a href="/audit" className="text-sm text-primary hover:underline">
            View all
          </a>
        </div>
        <div className="divide-y">
          {activityFeed.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="mt-1">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <button
            onClick={() => window.location.href = '/kyc-review'}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <Clock className="h-8 w-8 text-yellow-500" />
            <span className="text-sm font-medium">Review KYC</span>
          </button>
          <button
            onClick={() => window.location.href = '/disputes'}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <AlertCircle className="h-8 w-8 text-red-500" />
            <span className="text-sm font-medium">Resolve Disputes</span>
          </button>
          <button
            onClick={() => window.location.href = '/payouts'}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <DollarSign className="h-8 w-8 text-green-500" />
            <span className="text-sm font-medium">Process Payouts</span>
          </button>
          <button
            onClick={() => window.location.href = '/skills'}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <ClipboardList className="h-8 w-8 text-blue-500" />
            <span className="text-sm font-medium">Manage Skills</span>
          </button>
        </div>
      </div>
    </div>
  );
}
