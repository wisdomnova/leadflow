export type WarmupPlan = {
  totalDays: number
  dailyLimits: number[]
}

// Default 14-day plan, starting at 25 and ramping
export const DEFAULT_WARMUP_PLAN: WarmupPlan = {
  totalDays: 14,
  dailyLimits: [
    25, 35, 50, 75, 100, 150, 200,
    300, 400, 500, 650, 800, 1000, 1200,
  ],
}

export function getDailyLimit(dayNumber: number, plan: WarmupPlan = DEFAULT_WARMUP_PLAN): number {
  const idx = Math.max(1, Math.min(dayNumber, plan.totalDays)) - 1
  return plan.dailyLimits[idx]
}

export function getNextDay(currentDay: number, plan: WarmupPlan = DEFAULT_WARMUP_PLAN): number {
  return Math.min(currentDay + 1, plan.totalDays)
}

export function isCompleted(currentDay: number, plan: WarmupPlan = DEFAULT_WARMUP_PLAN): boolean {
  return currentDay >= plan.totalDays
}
