'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Star,
  Timer,
} from 'lucide-react';

export interface VendorMetrics {
  totalWorkOrders: number;
  completedWorkOrders: number;
  averageCompletionTime: number; // in hours
  completionRate: number; // percentage
  rating: number; // out of 5
  pendingWorkOrders: number;
  inProgressWorkOrders: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  // Comparison with previous period
  completionRateChange: number; // percentage change
  averageTimeChange: number; // hours change (negative is better)
}

interface VendorPerformanceCardProps {
  metrics: VendorMetrics;
}

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  trendPositive,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  trendPositive?: boolean;
}) => {
  const trendColor =
    trend === 'neutral'
      ? 'text-[#BDBDBE]'
      : trendPositive
        ? 'text-[#00CB5C]'
        : 'text-[#EF4444]';
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <div className='bg-[#FFFFFF08] rounded-xl p-4 flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <span className='text-[#BDBDBE] text-sm font-medium'>{title}</span>
        <div className='bg-[#F77F00]/20 rounded-lg p-2'>
          <Icon className='h-5 w-5 text-[#F77F00]' />
        </div>
      </div>
      <div className='flex items-end justify-between'>
        <div>
          <div className='text-white text-2xl font-bold'>{value}</div>
          {subtitle && (
            <div className='text-[#BDBDBE] text-xs mt-1'>{subtitle}</div>
          )}
        </div>
        {trend && TrendIcon && trendValue && (
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className='h-4 w-4' />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const VendorPerformanceCard: React.FC<VendorPerformanceCardProps> = ({
  metrics,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(0)}h`;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-white text-xl font-semibold'>
            Performance Metrics
          </h2>
          <p className='text-[#BDBDBE] text-sm mt-1'>
            Track your performance and earnings
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <MetricCard
          title='Completion Rate'
          value={`${metrics.completionRate}%`}
          subtitle='Work orders completed'
          icon={CheckCircle}
          trend={
            metrics.completionRateChange > 0
              ? 'up'
              : metrics.completionRateChange < 0
                ? 'down'
                : 'neutral'
          }
          trendValue={`${Math.abs(metrics.completionRateChange)}%`}
          trendPositive={metrics.completionRateChange > 0}
        />

        <MetricCard
          title='Avg. Completion Time'
          value={formatHours(metrics.averageCompletionTime)}
          subtitle='Time to resolve'
          icon={Timer}
          trend={
            metrics.averageTimeChange < 0
              ? 'down'
              : metrics.averageTimeChange > 0
                ? 'up'
                : 'neutral'
          }
          trendValue={formatHours(Math.abs(metrics.averageTimeChange))}
          trendPositive={metrics.averageTimeChange < 0}
        />

        <MetricCard
          title='Rating'
          value={metrics.rating.toFixed(1)}
          subtitle='Out of 5 stars'
          icon={Star}
        />

        <MetricCard
          title='This Month'
          value={formatCurrency(metrics.thisMonthEarnings)}
          subtitle='Earnings'
          icon={TrendingUp}
        />
      </div>

      {/* Work Order Stats */}
      <div className='bg-[#FFFFFF08] rounded-xl p-5'>
        <h3 className='text-white text-lg font-semibold mb-4'>
          Work Order Summary
        </h3>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-white'>
              {metrics.totalWorkOrders}
            </div>
            <div className='text-[#BDBDBE] text-sm mt-1'>Total</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-[#00CB5C]'>
              {metrics.completedWorkOrders}
            </div>
            <div className='text-[#BDBDBE] text-sm mt-1'>Completed</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-[#F77F00]'>
              {metrics.inProgressWorkOrders}
            </div>
            <div className='text-[#BDBDBE] text-sm mt-1'>In Progress</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-[#BDBDBE]'>
              {metrics.pendingWorkOrders}
            </div>
            <div className='text-[#BDBDBE] text-sm mt-1'>Pending</div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className='bg-gradient-to-r from-[#F77F00]/10 to-[#F77F00]/5 rounded-xl p-5 border border-[#F77F00]/20'>
        <h3 className='text-white text-lg font-semibold mb-3 flex items-center gap-2'>
          <Star className='h-5 w-5 text-[#F77F00]' />
          Tips to Improve Performance
        </h3>
        <ul className='space-y-2 text-[#BDBDBE] text-sm'>
          <li className='flex items-start gap-2'>
            <Clock className='h-4 w-4 mt-0.5 text-[#F77F00]' />
            <span>
              Respond to new work orders within 24 hours to improve your
              acceptance rate
            </span>
          </li>
          <li className='flex items-start gap-2'>
            <CheckCircle className='h-4 w-4 mt-0.5 text-[#F77F00]' />
            <span>
              Complete work orders promptly to maintain a high completion rate
            </span>
          </li>
          <li className='flex items-start gap-2'>
            <Timer className='h-4 w-4 mt-0.5 text-[#F77F00]' />
            <span>
              Faster completion times lead to better ratings and more work
              orders
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VendorPerformanceCard;
