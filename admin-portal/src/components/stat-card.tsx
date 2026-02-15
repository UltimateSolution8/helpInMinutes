'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
  onClick,
}: StatCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div
      className={cn(
        'stat-card',
        onClick && 'cursor-pointer hover:border-primary/50',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-card-label">{title}</p>
          <p className="stat-card-value mt-1">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
              {isNegative && (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive && 'text-green-500',
                  isNegative && 'text-red-500',
                  trend === 0 && 'text-muted-foreground'
                )}
              >
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-sm text-muted-foreground">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

interface StatCardSkeletonProps {
  title: string;
}

export function StatCardSkeleton({ title }: StatCardSkeletonProps) {
  return (
    <div className="stat-card animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="stat-card-label">{title}</p>
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="p-3 rounded-lg bg-muted">
          <div className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
