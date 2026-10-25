import type { LeaderboardMethod } from './leaderboard'

export function orderLeaderboard(methods: LeaderboardMethod[], start: number, rotation: number) {
  const sorted = [...methods].sort((a, b) => b.correct - a.correct)
  const ordered: { method: LeaderboardMethod; rank: number }[] = []

  for (let first = 0; first < sorted.length;) {
    let end = first + 1
    while (end < sorted.length && sorted[end].correct === sorted[first].correct) end++

    const group = sorted.slice(first, end)
    // A random starting position gives every tied method the same chance to lead.
    // Each click then advances the group by one, so reordering always takes effect.
    const offset = (Math.floor(start * group.length) + rotation) % group.length
    for (let index = 0; index < group.length; index++) {
      ordered.push({ method: group[(offset + index) % group.length], rank: first + 1 })
    }

    first = end
  }

  return ordered
}
