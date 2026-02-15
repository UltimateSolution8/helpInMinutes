/**
 * Earnings Calculator utility for calculating helper earnings
 */

// Base rates for different task types
const TASK_TYPE_RATES = {
  DELIVERY: {
    baseRate: 50,
    perKmRate: 10,
    perMinuteRate: 2,
  },
  PICKUP_DROP: {
    baseRate: 60,
    perKmRate: 12,
    perMinuteRate: 2.5,
  },
  ERRAND: {
    baseRate: 40,
    perKmRate: 8,
    perMinuteRate: 1.5,
  },
  HOUSEHOLD: {
    baseRate: 100,
    perHourRate: 150,
    minimumHours: 1,
  },
  MOVING: {
    baseRate: 200,
    perHourRate: 300,
    minimumHours: 2,
  },
  CLEANING: {
    baseRate: 150,
    perHourRate: 200,
    minimumHours: 1,
  },
  OTHER: {
    baseRate: 50,
    perKmRate: 10,
    perMinuteRate: 2,
  },
};

// Platform commission percentage
const PLATFORM_COMMISSION = 0.15; // 15%

// Peak hour multiplier
const PEAK_HOUR_MULTIPLER = 1.25;

// Surge pricing multiplier ranges
const SURGE_MIN = 1.0;
const SURGE_MAX = 2.0;

/**
 * Calculate task earnings
 */
export const calculateTaskEarnings = (task) => {
  const {
    taskType = 'OTHER',
    distance = 0,
    estimatedDuration = 30, // in minutes
    urgency = 'NORMAL',
    specialRequirements = [],
  } = task;

  const rates = TASK_TYPE_RATES[taskType] || TASK_TYPE_RATES.OTHER;
  
  let earnings = rates.baseRate;

  // Add distance-based earnings
  if (rates.perKmRate && distance > 0) {
    earnings += rates.perKmRate * Math.ceil(distance);
  }

  // Add time-based earnings
  if (rates.perMinuteRate && estimatedDuration > 0) {
    earnings += rates.perMinuteRate * Math.ceil(estimatedDuration);
  }

  if (rates.perHourRate && estimatedDuration >= 60) {
    const hours = Math.ceil(estimatedDuration / 60);
    const hoursRate = rates.perHourRate * hours;
    earnings = Math.max(earnings, hoursRate);
  }

  // Apply surge pricing
  const surgeMultiplier = calculateSurgeMultiplier(urgency);
  earnings *= surgeMultiplier;

  // Apply peak hour bonus (simplified - would check actual time)
  // const isPeakHour = checkIfPeakHour();
  // if (isPeakHour) earnings *= PEAK_HOUR_MULTIPLER;

  // Special requirements bonus
  specialRequirements.forEach((req) => {
    earnings += req.bonus || 0;
  });

  // Round to nearest 10
  earnings = Math.ceil(earnings / 10) * 10;

  // Calculate platform commission
  const platformCommission = earnings * PLATFORM_COMMISSION;
  const helperEarnings = earnings - platformCommission;

  return {
    grossEarnings: earnings,
    platformCommission,
    helperEarnings: Math.round(helperEarnings * 100) / 100,
    breakdown: {
      baseRate: rates.baseRate,
      distanceEarnings: rates.perKmRate ? rates.perKmRate * Math.ceil(distance) : 0,
      timeEarnings: rates.perMinuteRate ? rates.perMinuteRate * Math.ceil(estimatedDuration) : 0,
      surgeMultiplier,
      specialBonus: specialRequirements.reduce((sum, req) => sum + (req.bonus || 0), 0),
    },
  };
};

/**
 * Calculate surge multiplier based on demand
 */
export const calculateSurgeMultiplier = (urgency) => {
  switch (urgency) {
    case 'URGENT':
      return SURGE_MAX;
    case 'HIGH':
      return 1.5;
    case 'LOW':
      return SURGE_MIN;
    default:
      return 1.0;
  }
};

/**
 * Calculate daily earnings summary
 */
export const calculateDailyEarnings = (tasks) => {
  let totalEarnings = 0;
  let totalTasks = 0;
  let totalDistance = 0;
  let totalTime = 0;

  tasks.forEach((task) => {
    const taskEarnings = calculateTaskEarnings(task);
    totalEarnings += taskEarnings.helperEarnings;
    totalTasks += 1;
    totalDistance += task.distance || 0;
    totalTime += task.estimatedDuration || 0;
  });

  return {
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    totalTasks,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalTime,
    averagePerTask: totalTasks > 0 ? Math.round((totalEarnings / totalTasks) * 100) / 100 : 0,
  };
};

/**
 * Calculate weekly earnings summary
 */
export const calculateWeeklyEarnings = (dailySummaries) => {
  let totalEarnings = 0;
  let totalTasks = 0;
  let totalDays = dailySummaries.length;
  let bestDay = { date: null, earnings: 0 };

  dailySummaries.forEach((day) => {
    totalEarnings += day.totalEarnings;
    totalTasks += day.totalTasks;
    if (day.totalEarnings > bestDay.earnings) {
      bestDay = { date: day.date, earnings: day.totalEarnings };
    }
  });

  return {
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    totalTasks,
    totalDays,
    averagePerDay: totalDays > 0 ? Math.round((totalEarnings / totalDays) * 100) / 100 : 0,
    averagePerTask: totalTasks > 0 ? Math.round((totalEarnings / totalTasks) * 100) / 100 : 0,
    bestDay,
    dailyBreakdown: dailySummaries,
  };
};

/**
 * Calculate monthly earnings summary
 */
export const calculateMonthlyEarnings = (weeklySummaries) => {
  let totalEarnings = 0;
  let totalTasks = 0;
  let totalWeeks = weeklySummaries.length;

  weeklySummaries.forEach((week) => {
    totalEarnings += week.totalEarnings;
    totalTasks += week.totalTasks;
  });

  return {
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    totalTasks,
    totalWeeks,
    averagePerWeek: totalWeeks > 0 ? Math.round((totalEarnings / totalWeeks) * 100) / 100 : 0,
    averagePerTask: totalTasks > 0 ? Math.round((totalEarnings / totalTasks) * 100) / 100 : 0,
    weeklyBreakdown: weeklySummaries,
  };
};

/**
 * Calculate payout amount with processing fees
 */
export const calculatePayoutAmount = (amount) => {
  const processingFee = Math.max(amount * 0.01, 5); // 1% min ₹5
  const gstOnFee = processingFee * 0.18; // 18% GST on fee
  const totalDeduction = processingFee + gstOnFee;
  const netAmount = amount - totalDeduction;

  return {
    requestedAmount: amount,
    processingFee: Math.round(processingFee * 100) / 100,
    gst: Math.round(gstOnFee * 100) / 100,
    totalDeduction: Math.round(totalDeduction * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Calculate earnings growth/projection
 */
export const calculateEarningsProjection = (historicalEarnings, targetEarnings) => {
  if (historicalEarnings.length < 7) {
    return {
      projectedWeekly: targetEarnings,
      confidence: 'LOW',
      message: 'Need more data for accurate projection',
    };
  }

  // Simple linear regression for projection
  const recentEarnings = historicalEarnings.slice(-7);
  const average = recentEarnings.reduce((sum, e) => sum + e, 0) / recentEarnings.length;
  const projectedWeekly = Math.round(average * 7);

  return {
    projectedWeekly,
    projectedMonthly: Math.round(projectedWeekly * 4.33),
    confidence: 'MEDIUM',
    growthTrend: calculateGrowthTrend(recentEarnings),
  };
};

/**
 * Calculate growth trend
 */
const calculateGrowthTrend = (earnings) => {
  if (earnings.length < 2) return 'STABLE';

  const firstHalf = earnings.slice(0, Math.floor(earnings.length / 2));
  const secondHalf = earnings.slice(Math.floor(earnings.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (percentChange > 10) return 'GROWING';
  if (percentChange < -10) return 'DECLINING';
  return 'STABLE';
};

/**
 * Get earnings statistics
 */
export const getEarningsStats = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return {
      total: 0,
      average: 0,
      maximum: 0,
      minimum: 0,
      median: 0,
      totalTasks: 0,
    };
  }

  const earningsList = tasks.map((task) => calculateTaskEarnings(task).helperEarnings);
  earningsList.sort((a, b) => a - b);

  const total = earningsList.reduce((sum, e) => sum + e, 0);
  const average = total / earningsList.length;
  const median = earningsList[Math.floor(earningsList.length / 2)];

  return {
    total: Math.round(total * 100) / 100,
    average: Math.round(average * 100) / 100,
    maximum: Math.max(...earningsList),
    minimum: Math.min(...earningsList),
    median: Math.round(median * 100) / 100,
    totalTasks: earningsList.length,
  };
};

export default {
  calculateTaskEarnings,
  calculateSurgeMultiplier,
  calculateDailyEarnings,
  calculateWeeklyEarnings,
  calculateMonthlyEarnings,
  calculatePayoutAmount,
  formatCurrency,
  calculateEarningsProjection,
  getEarningsStats,
  TASK_TYPE_RATES,
  PLATFORM_COMMISSION,
};
