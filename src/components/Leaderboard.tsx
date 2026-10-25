import { useState } from 'react'
import type { LeaderboardMethod } from '../data/leaderboard'
import { orderLeaderboard } from '../data/leaderboardOrder'
import { DocumentIcon, GithubIcon, MedalIcon, RotateIcon } from './Icons'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

export function Leaderboard({ methods }: { methods: LeaderboardMethod[] }) {
  const [tieStart] = useState(Math.random)
  const [tieRotation, setTieRotation] = useState(0)
  const rankedMethods = orderLeaderboard(methods, tieStart, tieRotation)
  const hasTies = new Set(methods.map((method) => method.correct)).size < methods.length

  return (
    <div className="leaderboard">
      {hasTies && (
        <div className="leaderboard-toolbar">
          <p id="tie-order-note">Tied methods share a rank. Initial display order is random.</p>
          <button
            className="tie-order-button"
            type="button"
            aria-controls="leaderboard-table"
            aria-describedby="tie-order-note"
            title="Cycle the display order of tied methods"
            onClick={() => setTieRotation((rotation) => rotation + 1)}
          >
            <RotateIcon />
            Reorder ties
          </button>
        </div>
      )}
      <div className="leaderboard-table-wrap">
        <table className="leaderboard-table" id="leaderboard-table">
          <thead>
            <tr>
              <th className="rank-column">Rank</th>
              <th>Method</th>
              <th className="numeric">Accuracy</th>
              <th className="numeric optional-column">Cost / task</th>
              <th className="center resource-column">Paper</th>
              <th className="center resource-column">Code</th>
            </tr>
          </thead>
          <tbody>
            {rankedMethods.map(({ method, rank }) => (
              <tr key={method.id} className={rank === 1 ? 'leaderboard-row--first' : undefined}>
                <td className="rank-column">
                  <span className={`rank-position rank-position--${rank}`}>
                    {rank <= 3 && <MedalIcon className="rank-medal" />}
                    <strong>{rank}</strong>
                  </span>
                  <time dateTime={method.evaluated}>{formatDate(method.evaluated)}</time>
                </td>
                <td className="method-column">
                  <strong>
                    {method.websiteUrl ? (
                      <a href={method.websiteUrl} target="_blank" rel="noreferrer">
                        {method.method} + {method.backbone}
                      </a>
                    ) : (
                      <>{method.method} + {method.backbone}</>
                    )}
                  </strong>
                  <em>{method.organization}</em>
                  {method.submissionNote && <small className="method-note">{method.submissionNote}</small>}
                </td>
                <td className="numeric score-column">{method.accuracy.toFixed(2)}</td>
                <td className="numeric optional-column">
                  {method.costPerTask === null ? '—' : `$${method.costPerTask.toFixed(3)}`}
                  {method.costNote && <a className="cost-note-marker" href={`#cost-note-${method.id}`} aria-label={`Cost disclosure for ${method.method}`}>*</a>}
                </td>
                <td className="center resource-column">
                  {method.paperUrl ? (
                    <a
                      className="table-resource-link"
                      href={method.paperUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open paper for ${method.method} with ${method.backbone}`}
                    >
                      <DocumentIcon />
                    </a>
                  ) : '—'}
                </td>
                <td className="center resource-column">
                  {method.codeUrl ? (
                    <a
                      className="table-resource-link"
                      href={method.codeUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open code for ${method.method} with ${method.backbone}`}
                    >
                      <GithubIcon />
                    </a>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rankedMethods.filter(({ method }) => method.costNote).map(({ method }) => (
        <p className="leaderboard-note" id={`cost-note-${method.id}`} key={method.id}>
          * {method.method}: {method.costNote}
        </p>
      ))}
    </div>
  )
}
