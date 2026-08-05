import { useState } from 'react'
import './App.css'
import {
  ArrowUpRight,
  BrandMark,
  CheckIcon,
  DownloadIcon,
  GithubIcon,
  MailIcon,
  ShieldIcon,
} from './components/Icons'
import { Leaderboard } from './components/Leaderboard'
import { leaderboardMethods, resourceLinks } from './data/leaderboard'

const benchmarkFacts = [
  { value: '410', label: 'Tasks' },
  { value: '6', label: 'Modalities' },
  { value: '15.0 GB', label: 'Workspaces' },
  { value: '60', label: 'Public references' },
]

const newsItems = [
  {
    date: 'Aug 2026',
    title: 'DataSpace paper released on arXiv',
    detail: 'Read the benchmark design, construction framework, and full evaluation results.',
    href: resourceLinks.paper,
  },
  {
    date: 'Jul 2026',
    title: 'Dataset and baselines released',
    detail: 'All 410 task inputs and 60 public reference packages are now available.',
  },
  {
    date: 'Jul 2026',
    title: 'Initial leaderboard published',
    detail: 'Six frontier-backbone DataSpace-Agent baselines establish the first official results.',
  },
  {
    date: 'KDD Cup 2026',
    title: 'Official Data Agent Track benchmark',
    detail: 'DataSpace serves as the official benchmark for the KDD Cup 2026 Data Agent Track.',
    href: resourceLinks.competition,
  },
]

function App() {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = () => setNavOpen(false)

  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <div className="header-inner">
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
            <a href="#evaluation" onClick={closeNav}>Evaluation</a>
            <a href="#submit" onClick={closeNav}>Submit</a>
          </nav>

          <div className="header-links">
            <a href={resourceLinks.paper} target="_blank" rel="noreferrer">
              Paper
              <ArrowUpRight />
            </a>
            <a href={resourceLinks.dataset} target="_blank" rel="noreferrer">
              Dataset
              <ArrowUpRight />
            </a>
            <a href={resourceLinks.code} target="_blank" rel="noreferrer">
              <GithubIcon />
              Code
            </a>
          </div>
        </div>
      </header>

      <main className="page">
        <section className="intro-section" aria-labelledby="page-title">
          <div className="intro-copy">
            <a className="competition-label" href={resourceLinks.competition} target="_blank" rel="noreferrer">
              <span />
              KDD Cup 2026 · Official Data Agent Track Benchmark
              <ArrowUpRight />
            </a>
            <h1 id="page-title">DataSpace Leaderboard</h1>
            <p className="intro-summary">
              Evaluating data agents on verifiable analytics over heterogeneous,
              task-local workspaces.
            </p>
            <p className="intro-description">
              Each task combines a natural-language question with files, databases,
              long documents, or video. Agents must discover and integrate the relevant
              evidence, then return the complete requested table.
            </p>
            <div className="intro-actions">
              <a className="primary-link" href={resourceLinks.dataset} target="_blank" rel="noreferrer">
                <DownloadIcon />
                Download dataset
              </a>
              <a className="secondary-link" href={resourceLinks.paper} target="_blank" rel="noreferrer">
                Read paper
                <ArrowUpRight />
              </a>
              <a className="secondary-link" href={resourceLinks.code} target="_blank" rel="noreferrer">
                <GithubIcon />
                Evaluator &amp; baselines
              </a>
            </div>
          </div>

          <aside className="benchmark-summary" aria-label="Benchmark summary">
            <p>Benchmark at a glance</p>
            <div className="facts-grid">
              {benchmarkFacts.map((fact) => (
                <div key={fact.label}>
                  <strong>{fact.value}</strong>
                  <span>{fact.label}</span>
                </div>
              ))}
            </div>
            <div className="modality-line">
              <span>CSV</span>
              <span>JSON</span>
              <span>SQLite</span>
              <span>Markdown</span>
              <span>PDF</span>
              <span>Video</span>
            </div>
          </aside>
        </section>

        <section className="news-section" aria-labelledby="news-title">
          <div className="compact-heading">
            <p>Updates</p>
            <h2 id="news-title">News</h2>
          </div>
          <div className="news-list">
            {newsItems.map((item) => {
              const body = (
                <>
                  <time>{item.date}</time>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                  {item.href && <ArrowUpRight />}
                </>
              )
              return item.href ? (
                <a key={item.title} href={item.href} target="_blank" rel="noreferrer">
                  {body}
                </a>
              ) : (
                <div key={item.title}>{body}</div>
              )
            })}
          </div>
        </section>

        <section className="leaderboard-section" id="leaderboard" aria-labelledby="leaderboard-title">
          <div className="section-topline">
            <div>
              <p className="section-kicker">Official results</p>
              <h2 id="leaderboard-title">Leaderboard</h2>
              <p>
                Ranked by Task Accuracy across all 410 tasks. Select a row for full result details.
              </p>
            </div>
            <div className="verified-note">
              <ShieldIcon />
              <span>
                <strong>Trace-verified</strong>
                Predictions and execution traces reviewed by the DataSpace team
              </span>
            </div>
          </div>

          <Leaderboard methods={leaderboardMethods} />
        </section>

        <section className="protocol-grid">
          <article className="protocol-card" id="evaluation">
            <div className="protocol-card__header">
              <span className="protocol-icon"><ShieldIcon /></span>
              <div>
                <p>Scoring</p>
                <h2>Evaluation</h2>
              </div>
            </div>
            <p>
              The primary metric is Task Accuracy. A task is correct only when the
              submitted table matches the complete reference result under its task configuration.
            </p>
            <ul>
              <li><CheckIcon /> Header-invariant column alignment</li>
              <li><CheckIcon /> Type-aware value comparison</li>
              <li><CheckIcon /> Ordered sequence or unordered multiset rows</li>
              <li><CheckIcon /> Missing or invalid predictions count as incorrect</li>
            </ul>
            <a href={resourceLinks.code} target="_blank" rel="noreferrer">
              View the evaluator
              <ArrowUpRight />
            </a>
          </article>

          <article className="protocol-card" id="submit">
            <div className="protocol-card__header">
              <span className="protocol-icon protocol-icon--mint"><MailIcon /></span>
              <div>
                <p>Community results</p>
                <h2>Submit</h2>
              </div>
            </div>
            <p>
              Submit predictions for all 410 tasks together with end-to-end run traces
              and the model and system configuration. We score the private references
              and review traces before adding an entry.
            </p>
            <ol className="submit-steps">
              <li><span>1</span> Package predictions</li>
              <li><span>2</span> Attach traces and configuration</li>
              <li><span>3</span> Official scoring and review</li>
            </ol>
            <div className="coming-soon">
              <i />
              Submission email and package template coming soon
            </div>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <a className="brand brand--footer" href="#top">
            <BrandMark className="brand__mark" />
            <span>
              <strong>DataSpace</strong>
              <small>Data Agent Benchmark</small>
            </span>
          </a>
          <p>Verifiable analytics over heterogeneous workspaces.</p>
        </div>
        <div className="footer-links">
          <a href={resourceLinks.paper} target="_blank" rel="noreferrer">Paper</a>
          <a href={resourceLinks.dataset} target="_blank" rel="noreferrer">Dataset</a>
          <a href={resourceLinks.code} target="_blank" rel="noreferrer">GitHub</a>
          <a href={resourceLinks.competition} target="_blank" rel="noreferrer">KDD Cup 2026</a>
          <a href="#leaderboard">Leaderboard</a>
        </div>
        <p className="footer-meta">© 2026 DataSpace Benchmark · HKUST(GZ)</p>
      </footer>
    </div>
  )
}

export default App
