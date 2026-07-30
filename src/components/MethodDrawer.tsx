import { useEffect } from 'react'
import type { LeaderboardMethod } from '../data/leaderboard'
import { ArrowUpRight, CheckIcon, CloseIcon, GithubIcon, ShieldIcon } from './Icons'

type MethodDrawerProps = {
  method: LeaderboardMethod | null
  rank: number | null
  onClose: () => void
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`))
}

export function MethodDrawer({ method, rank, onClose }: MethodDrawerProps) {
  useEffect(() => {
    if (!method) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.classList.add('drawer-open')
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.classList.remove('drawer-open')
      window.removeEventListener('keydown', handleKey)
    }
  }, [method, onClose])

  return (
    <div className={`drawer-shell ${method ? 'drawer-shell--open' : ''}`} aria-hidden={!method}>
      <button className="drawer-backdrop" type="button" aria-label="Close method details" onClick={onClose} />
      <aside className="method-drawer" role="dialog" aria-modal="true" aria-label="Leaderboard method details">
        {method && (
          <>
            <div className="drawer-topline">
              <span className="drawer-rank">Rank {rank}</span>
              <button className="icon-button" type="button" onClick={onClose} aria-label="Close details">
                <CloseIcon />
              </button>
            </div>

            <div className="drawer-heading">
              <div className="method-monogram" style={{ '--method-accent': method.accent } as React.CSSProperties}>
                {method.backbone.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="drawer-kicker">{method.method}</p>
                <h3>{method.backbone}</h3>
                <p>{method.organization}</p>
              </div>
            </div>

            <div className="verified-banner">
              <ShieldIcon />
              <div>
                <strong>Trace-verified result</strong>
                <span>Predictions and execution traces reviewed by the DataSpace team.</span>
              </div>
            </div>

            <p className="drawer-description">{method.description}</p>

            <div className="drawer-score-card">
              <div>
                <span>Task Accuracy</span>
                <strong>{method.accuracy.toFixed(2)}%</strong>
              </div>
              <div className="drawer-score-card__count">
                <span>Correct</span>
                <strong>{method.correct}<small>/410</small></strong>
              </div>
              <div className="score-rail" aria-hidden="true">
                <span style={{ width: `${method.accuracy}%`, background: method.accent }} />
              </div>
            </div>

            <dl className="drawer-metadata">
              <div>
                <dt>Model snapshot</dt>
                <dd>{method.snapshot}</dd>
              </div>
              <div>
                <dt>API cost / task</dt>
                <dd>{method.costPerTask === null ? 'Not reported' : `$${method.costPerTask.toFixed(3)}`}</dd>
              </div>
              <div>
                <dt>Benchmark</dt>
                <dd>{method.benchmarkVersion}</dd>
              </div>
              <div>
                <dt>Evaluated</dt>
                <dd>{formatDate(method.evaluated)}</dd>
              </div>
              <div>
                <dt>Weights</dt>
                <dd>
                  <CheckIcon />
                  {method.openWeight ? 'Open-weight backbone' : 'Proprietary backbone'}
                </dd>
              </div>
            </dl>

            {method.codeUrl && (
              <a className="drawer-code-link" href={method.codeUrl} target="_blank" rel="noreferrer">
                <GithubIcon />
                View implementation
                <ArrowUpRight />
              </a>
            )}
          </>
        )}
      </aside>
    </div>
  )
}
