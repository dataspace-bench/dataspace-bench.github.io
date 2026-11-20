const DAY_MS = 24 * 60 * 60 * 1000

export function isRecentSubmission(date: string, now: number) {
  const published = Date.parse(`${date}T00:00:00Z`)
  if (!Number.isFinite(published) || !Number.isFinite(now)) return false
  const today = Math.floor(now / DAY_MS) * DAY_MS
  const daysOld = (today - published) / DAY_MS
  return daysOld >= 0 && daysOld < 30
}
