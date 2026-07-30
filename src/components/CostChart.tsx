import { useMemo, useState } from 'react'
import type { LeaderboardMethod } from '../data/leaderboard'

const width = 760
const height = 390
const margin = { top: 26, right: 34, bottom: 62, left: 68 }
const xMax = 0.25
const yMin = 20
const yMax = 70

function xScale(value: number) {
  return margin.left + (value / xMax) * (width - margin.left - margin.right)
}

function yScale(value: number) {
  return margin.top + ((yMax - value) / (yMax - yMin)) * (height - margin.top - margin.bottom)
}

export function CostChart({ methods }: { methods: LeaderboardMethod[] }) {
  const points = useMemo(
    () => methods.filter((method): method is LeaderboardMethod & { costPerTask: number } => method.costPerTask !== null),
    [methods],
  )
  const [activeId, setActiveId] = useState(points[0]?.id ?? '')
  const active = points.find((point) => point.id === activeId) ?? points[0]
  const frontier = points
    .filter((point) => ['dataspace-mimo-v25', 'dataspace-grok-45'].includes(point.id))
    .sort((a, b) => a.costPerTask - b.costPerTask)

  const xTicks = [0, 0.05, 0.1, 0.15, 0.2, 0.25]
  const yTicks = [20, 30, 40, 50, 60, 70]

  return (
    <div className="cost-chart-shell">
      <div className="cost-chart-main">
        <div className="chart-legend">
          <span><i className="legend-line" /> Pareto frontier</span>
          <span><i className="legend-dot" /> Official baseline</span>
        </div>
        <svg
          className="cost-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Scatter plot comparing Task Accuracy and API cost per task"
        >
          <defs>
            <linearGradient id="frontier-gradient" x1="0" x2="1">
              <stop stopColor="#ffd36a" />
              <stop offset="1" stopColor="#8b7cf6" />
            </linearGradient>
            <filter id="point-shadow" x="-80%" y="-80%" width="260%" height="260%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity=".16" />
            </filter>
          </defs>

          {yTicks.map((tick) => (
            <g key={`y-${tick}`}>
              <line
                className="chart-gridline"
                x1={margin.left}
                x2={width - margin.right}
                y1={yScale(tick)}
                y2={yScale(tick)}
              />
              <text className="chart-tick" x={margin.left - 14} y={yScale(tick) + 4} textAnchor="end">
                {tick}%
              </text>
            </g>
          ))}
          {xTicks.map((tick) => (
            <g key={`x-${tick}`}>
              <line
                className="chart-gridline chart-gridline--vertical"
                x1={xScale(tick)}
                x2={xScale(tick)}
                y1={margin.top}
                y2={height - margin.bottom}
              />
              <text className="chart-tick" x={xScale(tick)} y={height - margin.bottom + 26} textAnchor="middle">
                ${tick.toFixed(2)}
              </text>
            </g>
          ))}

          <text className="chart-axis-title" x={margin.left} y={15}>
            TASK ACCURACY
          </text>
          <text className="chart-axis-title" x={width - margin.right} y={height - 12} textAnchor="end">
            API COST / TASK
          </text>

          <path
            className="frontier-path"
            d={frontier
              .map((point, index) => `${index ? 'L' : 'M'}${xScale(point.costPerTask)},${yScale(point.accuracy)}`)
              .join(' ')}
          />

          {points.map((point) => {
            const activePoint = point.id === active.id
            return (
              <g
                className={`chart-point ${activePoint ? 'chart-point--active' : ''}`}
                key={point.id}
                tabIndex={0}
                role="button"
                aria-label={`${point.backbone}: ${point.accuracy}% accuracy at $${point.costPerTask.toFixed(3)} per task`}
                onMouseEnter={() => setActiveId(point.id)}
                onFocus={() => setActiveId(point.id)}
              >
                <circle
                  className="chart-point__halo"
                  cx={xScale(point.costPerTask)}
                  cy={yScale(point.accuracy)}
                  r={activePoint ? 18 : 13}
                  fill={point.accent}
                />
                <circle
                  className="chart-point__core"
                  cx={xScale(point.costPerTask)}
                  cy={yScale(point.accuracy)}
                  r={activePoint ? 7 : 5.5}
                  fill={point.accent}
                  filter="url(#point-shadow)"
                />
              </g>
            )
          })}
        </svg>
      </div>

      <aside className="chart-inspector">
        <div className="chart-inspector__eyebrow">
          <i style={{ background: active.accent }} />
          Selected baseline
        </div>
        <h3>{active.backbone}</h3>
        <p>{active.method}</p>
        <dl>
          <div>
            <dt>Accuracy</dt>
            <dd>{active.accuracy.toFixed(2)}%</dd>
          </div>
          <div>
            <dt>Cost / task</dt>
            <dd>${active.costPerTask.toFixed(3)}</dd>
          </div>
          <div>
            <dt>Correct</dt>
            <dd>{active.correct} / 410</dd>
          </div>
        </dl>
        <span className="chart-inspector__note">
          Costs use provider pricing at evaluation time.
        </span>
      </aside>
    </div>
  )
}
