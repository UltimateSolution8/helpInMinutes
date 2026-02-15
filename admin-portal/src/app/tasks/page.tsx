'use client';

import { useState } from 'react';
import { Search, Filter, MapPin, Calendar, DollarSign, MoreHorizontal } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';

// Mock data for demonstration
const mockTasks = [
  {
    id: 'TASK-001',
    title: 'Fix leaking bathroom tap',
    category: 'Plumbing',
    customer: 'Rajesh Kumar',
    helper: 'John Doe',
    status: 'in_progress',
    priority: 'high',
    price: 500,
    location: 'Indiranagar, Bangalore',
    scheduledAt: '2024-02-02T14:00:00',
    createdAt: '2024-02-02T10:00:00',
  },
  {
    id: 'TASK-002',
    title: 'Deep cleaning of 2BHK apartment',
    category: 'Cleaning',
    customer: 'Priya Sharma',
    helper: 'Jane Smith',
    status: 'pending',
    priority: 'medium',
    price: 2000,
    location: 'Marathahalli, Bangalore',
    scheduledAt: '2024-02-03T09:00:00',
    createdAt: '2024-02-02T08:00:00',
  },
  {
    id: 'TASK-003',
    title: 'Install ceiling fan',
    category: 'Electrical',
    customer: 'Amit Patel',
    helper: '-',
    status: 'assigned',
    priority: 'low',
    price: 350,
    location: 'Whitefield, Bangalore',
    scheduledAt: '2024-02-04T11:00:00',
    createdAt: '2024-02-01T16:00:00',
  },
  {
    id: 'TASK-004',
    title: 'Repair wooden door lock',
    category: 'Carpentry',
    customer: 'Sneha Reddy',
    helper: 'Mike Johnson',
    status: 'completed',
    priority: 'medium',
    price: 600,
    location: 'HSR Layout, Bangalore',
    scheduledAt: '2024-02-01T15:00:00',
    createdAt: '2024-02-01T10:00:00',
  },
  {
    id: 'TASK-005',
    title: 'Garden maintenance',
    category: 'Gardening',
    customer: 'Vikram Singh',
    helper: 'Sarah Wilson',
    status: 'cancelled',
    priority: 'low',
    price: 800,
    location: 'Electronic City, Bangalore',
    scheduledAt: '2024-02-02T07:00:00',
    createdAt: '2024-02-02T06:00:00',
  },
];

export default function TasksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredTasks = mockTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage all service tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline">
            Export Report
          </button>
          <button className="btn-primary">
            Create Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks by title, ID, or customer..."
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
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button className="btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            More
          </button>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.location.href = `/tasks/${task.id}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs text-muted-foreground">{task.id}</span>
                <h3 className="font-semibold mt-1">{task.title}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-muted text-xs">{task.category}</span>
                <StatusBadge status={task.status} size="sm" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-primary font-medium">{task.customer}</span>
                <span className="text-muted-foreground">→</span>
                <span>{task.helper}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{task.location}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatRelativeTime(task.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold">{formatCurrency(task.price)}</span>
              </div>
              <button className="p-1 rounded hover:bg-accent">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tasks found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
