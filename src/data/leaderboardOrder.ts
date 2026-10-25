import type { LeaderboardMethod } from './leaderboard'

export function orderLeaderboard(methods: LeaderboardMethod[]) {
  const sorted = [...methods].sort((a, b) => {
    if (a.correct !== b.correct) return b.correct - a.correct
    if (a.costPerTask === b.costPerTask) return 0
    return (a.costPerTask ?? Infinity) - (b.costPerTask ?? Infinity)
  })

  return sorted.map((method) => ({
    method,
    rank: sorted.findIndex((entry) => entry.correct === method.correct) + 1,
  }))
}
