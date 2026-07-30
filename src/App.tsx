import { useState } from 'react'
import './App.css'
import { CostChart } from './components/CostChart'
import {
  ArrowRight,
  ArrowUpRight,
  BrandMark,
  BracesIcon,
  CheckIcon,
  DatabaseIcon,
  DocumentIcon,
  DownloadIcon,
  GithubIcon,
  MailIcon,
  ShieldIcon,
  TableIcon,
  VideoIcon,
} from './components/Icons'
import { Leaderboard } from './components/Leaderboard'
import { OrbitVisual } from './components/OrbitVisual'
import { leaderboardMethods, resourceLinks } from './data/leaderboard'

const benchmarkStats = [
  { value: '410', label: 'traceable tasks', note: 'all inputs public' },
  { value: '6', label: 'data modalities', note: 'structured to video' },
  { value: '15.0', suffix: 'GB', label: 'workspace context', note: '7,439 artifacts' },
  { value: '60', label: 'public references', note: 'for local evaluation' },
]

const modalities = [
  { label: 'CSV', icon: <TableIcon />, tone: 'lilac' },
  { label: 'JSON', icon: <BracesIcon />, tone: 'blue' },
  { label: 'SQLite', icon: <DatabaseIcon />, tone: 'mint' },
  { label: 'Markdown', icon: <DocumentIcon />, tone: 'yellow' },
  { label: 'PDF', icon: <DocumentIcon />, tone: 'coral' },
  { label: 'Video', icon: <VideoIcon />, tone: 'violet' },
]

function SectionHeading({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="section-heading">
      <div className="section-heading__index">{index}</div>
      <div>
        <p className="section-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="section-description">{description}</p>
      </div>
    </div>
  )
}

function App() {
  const [navOpen, setNavOpen] = useState(false)

  const closeNav = () => setNavOpen(false)

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="DataSpace home" onClick={closeNav}>
          <BrandMark className="brand__mark" />
          <span>
            <strong>DataSpace</strong>
            <small>Data Agent Benchmark</small>
          </span>
        </a>

        <button
          className={`nav-toggle ${navOpen ? 'nav-toggle--open' : ''}`}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((open) => !open)}
        >
          <span />
          <span />
        </button>

        <nav className={`site-nav ${navOpen ? 'site-nav--open' : ''}`} aria-label="Primary navigation">
          <a href="#leaderboard" onClick={closeNav}>Leaderboard</a>
          <a href="#efficiency" onClick={closeNav}>Efficiency</a>
          <a href="#benchmark" onClick={closeNav}>Benchmark</a>
          <a href="#submit" onClick={closeNav}>Submit</a>
        </nav>

        <a className="header-code-link" href={resourceLinks.code} target="_blank" rel="noreferrer">
          <GithubIcon />
          <span>Code</span>
          <ArrowUpRight />
        </a>
      </header>

      <main>
        <section className="hero-section" id="top">
          <div className="hero-grid">
            <div className="hero-copy">
              <a className="competition-pill" href={resourceLinks.competition} target="_blank" rel="noreferrer">
                <span className="competition-pill__signal" />
                Official KDD Cup 2026 benchmark
                <ArrowUpRight />
              </a>

              <p className="hero-overline">VERIFIABLE ANALYTICS · HETEROGENEOUS WORKSPACES</p>
              <h1>
                Benchmark the agent,
                <span>not just the answer.</span>
              </h1>
              <p className="hero-lead">
                DataSpace measures whether data agents can navigate structured files,
                databases, long documents, and video—then return the exact table a user asked for.
              </p>

              <div className="hero-actions">
                <a className="button button--primary" href="#leaderboard">
                  Explore leaderboard
                  <ArrowRight />
                </a>
                <a className="button button--secondary" href={resourceLinks.dataset} target="_blank" rel="noreferrer">
                  <DownloadIcon />
                  Download dataset
                </a>
              </div>

              <div className="hero-proof">
                <div className="proof-stack" aria-hidden="true">
                  <span>CSV</span>
                  <span>DB</span>
                  <span>PDF</span>
                  <span>VID</span>
                </div>
                <p>
                  <strong>One task-local workspace.</strong>
                  <span>Complete tabular results, scored exactly.</span>
                </p>
              </div>
            </div>

            <div className="hero-visual-wrap">
              <div className="hero-visual-label hero-visual-label--top">
                <span>workspace</span>
                01 / inspect
              </div>
              <OrbitVisual />
              <div className="hero-visual-label hero-visual-label--bottom">
                02 / integrate
                <span>verify</span>
              </div>
            </div>
          </div>

          <div className="stats-band">
            {benchmarkStats.map((stat, index) => (
              <div className="stat-card" key={stat.label}>
                <span className="stat-card__number">0{index + 1}</span>
                <div className="stat-card__value">
                  {stat.value}
                  {stat.suffix && <small>{stat.suffix}</small>}
                </div>
                <strong>{stat.label}</strong>
                <span>{stat.note}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section leaderboard-section" id="leaderboard">
          <div className="section-inner">
            <SectionHeading
              index="01"
              eyebrow="Official leaderboard"
              title="One benchmark. One verified score."
              description="Every listed result is evaluated on all 410 tasks and reviewed against its submitted predictions and end-to-end traces."
            />

            <div className="verification-note">
              <ShieldIcon />
              <p>
                <strong>Trace-verified by the DataSpace team.</strong>
                We verify submissions and execution traces; participant systems are not rerun by us.
              </p>
              <span>410-task release</span>
            </div>

            <Leaderboard methods={leaderboardMethods} />
          </div>
        </section>

        <section className="content-section efficiency-section" id="efficiency">
          <div className="section-inner">
            <SectionHeading
              index="02"
              eyebrow="Efficiency"
              title="Accuracy is only half the story."
              description="Explore the monetary trade-off behind the official controlled baselines. Only entries with auditable API usage appear in this view."
            />
            <CostChart methods={leaderboardMethods} />
          </div>
        </section>

        <section className="content-section benchmark-section" id="benchmark">
          <div className="section-inner">
            <SectionHeading
              index="03"
              eyebrow="The benchmark"
              title="One question. A workspace full of evidence."
              description="DataSpace replaces a preselected table with the kind of mixed, task-local workspace an analyst actually has to navigate."
            />

            <div className="benchmark-bento">
              <article className="bento-card bento-card--workspace">
                <div className="bento-card__heading">
                  <span className="bento-number">A</span>
                  <div>
                    <p>Heterogeneous by design</p>
                    <h3>Six modalities, one analytical path.</h3>
                  </div>
                </div>
                <div className="modality-grid">
                  {modalities.map((modality) => (
                    <div className={`modality-chip modality-chip--${modality.tone}`} key={modality.label}>
                      <span>{modality.icon}</span>
                      {modality.label}
                    </div>
                  ))}
                </div>
                <p className="bento-copy">
                  Evidence may cross files and representations, requiring discovery,
                  extraction, joins, filtering, aggregation, and temporal reasoning.
                </p>
              </article>

              <article className="bento-card bento-card--output">
                <div className="bento-card__heading">
                  <span className="bento-number">B</span>
                  <div>
                    <p>Exact output contract</p>
                    <h3>A complete table, not a plausible paragraph.</h3>
                  </div>
                </div>
                <div className="output-preview">
                  <div className="output-preview__bar">
                    <span>prediction.csv</span>
                    <i><CheckIcon /> valid relation</i>
                  </div>
                  <div className="output-preview__row output-preview__row--head">
                    <span>region</span><span>quarter</span><span>revenue</span>
                  </div>
                  <div className="output-preview__row">
                    <span>APAC</span><span>2025-Q4</span><span>$18.42M</span>
                  </div>
                  <div className="output-preview__row">
                    <span>EMEA</span><span>2025-Q4</span><span>$16.08M</span>
                  </div>
                </div>
              </article>

              <article className="bento-card bento-card--language">
                <div className="language-orbit" aria-hidden="true">
                  <span className="language-orbit__en">EN</span>
                  <span className="language-orbit__zh">中</span>
                  <i />
                </div>
                <div>
                  <p>Cross-language task spaces</p>
                  <h3>Language belongs to the whole question–workspace pair.</h3>
                </div>
              </article>

              <article className="bento-card bento-card--evaluation">
                <div className="evaluation-seal">
                  <ShieldIcon />
                  <span>semantic</span>
                  <strong>Task Accuracy</strong>
                </div>
                <div>
                  <p>Deterministic evaluation</p>
                  <h3>Flexible about headers. Strict about the result.</h3>
                  <ul>
                    <li><CheckIcon /> One-to-one column alignment</li>
                    <li><CheckIcon /> Type-aware value comparison</li>
                    <li><CheckIcon /> Ordered or multiset rows</li>
                  </ul>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="content-section submit-section" id="submit">
          <div className="section-inner">
            <SectionHeading
              index="04"
              eyebrow="Submit"
              title="Built for auditable results."
              description="Community results enter the board after official scoring and trace review. We do not require participants to hand over a runnable codebase."
            />

            <div className="submission-panel">
              <div className="submission-flow">
                <article>
                  <span>01</span>
                  <div className="submission-icon"><TableIcon /></div>
                  <h3>Package predictions</h3>
                  <p>Include one rectangular <code>prediction.csv</code> for every task.</p>
                </article>
                <div className="submission-connector"><ArrowRight /></div>
                <article>
                  <span>02</span>
                  <div className="submission-icon"><DocumentIcon /></div>
                  <h3>Attach run traces</h3>
                  <p>Provide end-to-end logs and the exact model and system configuration.</p>
                </article>
                <div className="submission-connector"><ArrowRight /></div>
                <article>
                  <span>03</span>
                  <div className="submission-icon"><ShieldIcon /></div>
                  <h3>Score and review</h3>
                  <p>We evaluate all 410 tasks, audit the traces, and publish accepted results.</p>
                </article>
              </div>

              <div className="submission-cta">
                <div>
                  <MailIcon />
                  <p>
                    <strong>Submission channel opening soon</strong>
                    The official email and package template will be published here.
                  </p>
                </div>
                <span className="status-pill"><i /> Preparing launch</span>
              </div>
            </div>
          </div>
        </section>

        <section className="resource-section">
          <div className="section-inner">
            <div className="resource-intro">
              <p>Build with DataSpace</p>
              <h2>Everything you need to start evaluating.</h2>
            </div>
            <div className="resource-grid">
              <a href={resourceLinks.dataset} target="_blank" rel="noreferrer">
                <span className="resource-icon resource-icon--yellow"><DownloadIcon /></span>
                <div><strong>Dataset</strong><small>410 public task inputs</small></div>
                <ArrowUpRight />
              </a>
              <a href={resourceLinks.code} target="_blank" rel="noreferrer">
                <span className="resource-icon resource-icon--lilac"><GithubIcon /></span>
                <div><strong>Code</strong><small>Evaluator and baselines</small></div>
                <ArrowUpRight />
              </a>
              <a href={resourceLinks.competition} target="_blank" rel="noreferrer">
                <span className="resource-icon resource-icon--mint"><ShieldIcon /></span>
                <div><strong>KDD Cup 2026</strong><small>Official Data Agent track</small></div>
                <ArrowUpRight />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <a className="brand brand--footer" href="#top">
            <BrandMark className="brand__mark" />
            <span><strong>DataSpace</strong><small>Data Agent Benchmark</small></span>
          </a>
          <p>Verifiable analytics over heterogeneous workspaces.</p>
        </div>
        <div className="footer-links">
          <a href={resourceLinks.dataset} target="_blank" rel="noreferrer">Dataset</a>
          <a href={resourceLinks.code} target="_blank" rel="noreferrer">GitHub</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="#submit">Submit</a>
        </div>
        <p className="footer-meta">© 2026 DataSpace Benchmark · HKUST(GZ)</p>
      </footer>
    </div>
  )
}

export default App
