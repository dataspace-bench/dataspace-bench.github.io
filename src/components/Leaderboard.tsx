import { useEffect, useMemo, useRef, useState } from 'react'
import type { LeaderboardMethod } from '../data/leaderboard'
import { CheckIcon, ChevronDownIcon, GithubIcon, SearchIcon } from './Icons'
import { MethodDrawer } from './MethodDrawer'

type SortMode = 'accuracy' | 'cost' | 'recent'

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'accuracy', label: 'Accuracy' },
  { value: 'cost', label: 'Cost / task' },
  { value: 'recent', label: 'Most recent' },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`))
}

export function Leaderboard({ methods }: { methods: LeaderboardMethod[] }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('accuracy')
  const [sortOpen, setSortOpen] = useState(false)
  const [selected, setSelected] = useState<LeaderboardMethod | null>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sortOpen) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) setSortOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSortOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [sortOpen])

  const canonicalRanking = useMemo(
    () =>
      new Map(
        [...methods]
          .sort((a, b) => b.accuracy - a.accuracy)
          .map((method, index) => [method.id, index + 1]),
      ),
    [methods],
  )

  const visibleMethods = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const filtered = normalized
      ? methods.filter((method) =>
          [method.method, method.backbone, method.organization].some((value) =>
            value.toLowerCase().includes(normalized),
          ),
        )
      : [...methods]

    return filtered.sort((a, b) => {
      if (sort === 'cost') {
        return (a.costPerTask ?? Number.POSITIVE_INFINITY) - (b.costPerTask ?? Number.POSITIVE_INFINITY)
      }
      if (sort === 'recent') {
        return b.evaluated.localeCompare(a.evaluated) || b.accuracy - a.accuracy
      }
      return b.accuracy - a.accuracy
    })
  }, [methods, query, sort])

  return (
    <>
      <div className="leaderboard-toolbar">
        <label className="search-field">
          <SearchIcon />
          <span className="sr-only">Search leaderboard</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search method or organization"
          />
        </label>
        <div className="sort-field">
          <span>Sort by</span>
          <div className={`sort-control ${sortOpen ? 'sort-control--open' : ''}`} ref={sortMenuRef}>
            <button
              className="sort-trigger"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((open) => !open)}
            >
              <span>{sortOptions.find((option) => option.value === sort)?.label}</span>
              <ChevronDownIcon />
            </button>
            {sortOpen && (
              <div className="sort-menu" role="listbox" aria-label="Sort leaderboard">
                {sortOptions.map((option) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={sort === option.value}
                    className={sort === option.value ? 'sort-option sort-option--selected' : 'sort-option'}
                    key={option.value}
                    onClick={() => {
                      setSort(option.value)
                      setSortOpen(false)
                    }}
                  >
                    <span>{option.label}</span>
                    {sort === option.value && <CheckIcon />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="leaderboard-frame">
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Method</th>
                <th>Organization</th>
                <th className="numeric">Accuracy</th>
                <th className="numeric">Cost / task</th>
                <th className="center">Code</th>
                <th>Evaluated</th>
              </tr>
            </thead>
            <tbody>
              {visibleMethods.map((method) => {
                const rank = canonicalRanking.get(method.id) ?? 0
                return (
                  <tr
                    key={method.id}
                    className={rank <= 3 ? `leaderboard-row leaderboard-row--top leaderboard-row--${rank}` : 'leaderboard-row'}
                    onClick={() => setSelected(method)}
                  >
                    <td>
                      <span className={`rank-mark rank-mark--${Math.min(rank, 4)}`}>
                        {rank < 10 ? `0${rank}` : rank}
                      </span>
                    </td>
                    <td>
                      <button className="method-cell" type="button" onClick={() => setSelected(method)}>
                        <span
                          className="method-cell__dot"
                          style={{ '--method-accent': method.accent } as React.CSSProperties}
                        />
                        <span>
                          <strong>{method.method}</strong>
                          <small>{method.backbone}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="organization-cell">{method.organization}</span>
                    </td>
                    <td className="numeric">
                      <div className="accuracy-cell">
                        <strong>{method.accuracy.toFixed(2)}</strong>
                        <span>%</span>
                      </div>
                    </td>
                    <td className="numeric">
                      {method.costPerTask === null ? (
                        <span className="muted-dash">—</span>
                      ) : (
                        <span className="cost-cell">${method.costPerTask.toFixed(3)}</span>
                      )}
                    </td>
                    <td className="center">
                      {method.codeUrl ? (
                        <a
                          className="code-link"
                          href={method.codeUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open code for ${method.method} with ${method.backbone}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <GithubIcon />
                        </a>
                      ) : (
                        <span className="muted-dash">—</span>
                      )}
                    </td>
                    <td>
                      <span className="date-cell">{formatDate(method.evaluated)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="leaderboard-footer">
          <span>{visibleMethods.length} trace-verified entries</span>
          <button type="button" onClick={() => document.querySelector('#submit')?.scrollIntoView({ behavior: 'smooth' })}>
            How to submit
          </button>
        </div>
      </div>

      <MethodDrawer
        method={selected}
        rank={selected ? (canonicalRanking.get(selected.id) ?? null) : null}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
