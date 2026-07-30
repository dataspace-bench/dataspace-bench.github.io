import {
  BracesIcon,
  DatabaseIcon,
  DocumentIcon,
  TableIcon,
  VideoIcon,
} from './Icons'

const nodes = [
  { key: 'csv', label: 'CSV', className: 'orbit-node--csv', icon: <TableIcon /> },
  { key: 'json', label: 'JSON', className: 'orbit-node--json', icon: <BracesIcon /> },
  { key: 'sqlite', label: 'SQLite', className: 'orbit-node--sqlite', icon: <DatabaseIcon /> },
  { key: 'markdown', label: 'Markdown', className: 'orbit-node--markdown', icon: <DocumentIcon /> },
  { key: 'pdf', label: 'PDF', className: 'orbit-node--pdf', icon: <DocumentIcon /> },
  { key: 'video', label: 'Video', className: 'orbit-node--video', icon: <VideoIcon /> },
]

export function OrbitVisual() {
  return (
    <div className="orbit-visual" aria-label="Six data modalities connect through a data agent to a tabular result">
      <div className="orbit-glow orbit-glow--one" />
      <div className="orbit-glow orbit-glow--two" />
      <div className="orbit-ring orbit-ring--outer" />
      <div className="orbit-ring orbit-ring--inner" />
      <svg className="orbit-paths" viewBox="0 0 560 520" aria-hidden="true">
        <defs>
          <linearGradient id="path-gradient" x1="82" y1="62" x2="456" y2="432">
            <stop stopColor="#9b8df7" stopOpacity=".12" />
            <stop offset=".5" stopColor="#71c8e7" stopOpacity=".72" />
            <stop offset="1" stopColor="#82dfc4" stopOpacity=".1" />
          </linearGradient>
        </defs>
        <path d="M106 109C190 151 195 213 280 256" />
        <path d="M450 93C385 156 359 199 280 256" />
        <path d="M476 282C394 280 354 270 280 256" />
        <path d="M413 424C362 353 338 302 280 256" />
        <path d="M128 415C177 345 216 302 280 256" />
        <path d="M72 269C153 268 206 263 280 256" />
        <path className="orbit-output-path" d="M280 292v101" />
      </svg>

      {nodes.map((node) => (
        <div className={`orbit-node ${node.className}`} key={node.key}>
          <span className="orbit-node__icon">{node.icon}</span>
          <span>{node.label}</span>
        </div>
      ))}

      <div className="agent-core">
        <div className="agent-core__pulse" />
        <div className="agent-core__glyph">
          <span />
          <span />
          <span />
        </div>
        <strong>Data Agent</strong>
        <small>reason · inspect · compute</small>
      </div>

      <div className="orbit-output">
        <span className="orbit-output__status">verified</span>
        <div className="orbit-output__table">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <strong>prediction.csv</strong>
      </div>
    </div>
  )
}
