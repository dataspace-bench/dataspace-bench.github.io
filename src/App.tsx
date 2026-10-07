import './App.css'
import {
  DatabaseIcon,
  DocumentIcon,
  GithubIcon,
  UploadIcon,
} from './components/Icons'
import { Leaderboard } from './components/Leaderboard'
import { leaderboardMethods, resourceLinks } from './data/leaderboard'

const newsItems = [
  {
    date: '2026-10',
    title: 'Jitto Build + Claude Opus 5.5 added to the leaderboard.',
    detail: 'JamLabs achieves 81.22% Task Accuracy (333/410) on the official benchmark.',
    href: '#leaderboard',
  },
  {
    date: '2026-08',
    title: 'DataSpace paper released on arXiv.',
    detail: 'The paper describes the benchmark design, construction framework, and full evaluation results.',
    href: resourceLinks.paper,
  },
  {
    date: '2026-07',
    title: 'Dataset and baselines released.',
    detail: 'All 410 task inputs and 60 public reference packages are now available.',
    href: resourceLinks.dataset,
  },
  {
    date: '2026-07',
    title: 'Initial leaderboard published.',
    detail: 'Six DataSpace-Agent baselines establish the first official results.',
    href: '#leaderboard',
  },
  {
    date: '2026-07',
    title: 'Official Data Agent Track benchmark.',
    detail: 'DataSpace serves as the official benchmark for the KDD Cup 2026 Data Agent Track.',
    href: resourceLinks.competition,
  },
]

const citation = `@article{li2026dataspace,
  title   = {DataSpace: Benchmarking Data Agents for Verifiable Analytics over Heterogeneous Workspaces},
  author  = {Boyan Li and Zhuowen Liang and Yupeng Xie and Xiaotian Lin and Tianqi Luo and Xinyu Liu and Yizhang Zhu and Zhangyang Peng and Yuan Li and Zhengxuan Zhang and Jiayi Zhang and Nan Tang and Guoliang Li and Yuyu Luo},
  journal = {arXiv preprint arXiv:2608.03451},
  year    = {2026},
  url     = {https://arxiv.org/abs/2608.03451}
}`

function App() {
  return (
    <div className="site-shell" id="top">
      <header className="academic-hero">
        <div className="academic-hero__inner">
          <div className="affiliation-marks" aria-label="Project affiliations">
            <a
              className="affiliation-mark affiliation-mark--university"
              href="https://www.hkust-gz.edu.cn/"
              target="_blank"
              rel="noreferrer"
              aria-label="The Hong Kong University of Science and Technology (Guangzhou)"
            >
              <img src="/hkust-gz-logo-white.png" alt="HKUST Guangzhou" />
            </a>
            <span className="affiliation-divider" aria-hidden="true" />
            <a
              className="affiliation-mark affiliation-mark--lab"
              href="https://github.com/HKUSTDial"
              target="_blank"
              rel="noreferrer"
              aria-label="Data Intelligence and Analytics Lab at HKUST Guangzhou"
            >
              <img src="/dial-lab-logo.png" alt="" />
              <span>DIAL LAB</span>
            </a>
          </div>
          <h1>DataSpace</h1>
          <p>Evaluating Data Agents on Verifiable Analytics over Heterogeneous Workspaces</p>
          <div className="venue-line">
            <strong>KDD Cup 2026</strong>
            <span>Official Data Agent Track Benchmark</span>
          </div>
        </div>
      </header>

      <main className="content-layout">
        <aside className="side-column">
          <section className="info-panel about-panel" id="about" aria-labelledby="about-title">
            <div className="panel-body">
              <h2 id="about-title">About DataSpace</h2>
              <p>
                DataSpace evaluates autonomous data agents on 410 cross-language tasks across financial,
                macroeconomic, and healthcare analytics. The benchmark comprises 7,439 artifacts (15.01 GB)
                in six formats and 13 modality combinations, with questions and evidence in Chinese and
                English. Given only a natural-language question and a self-contained workspace, agents must
                discover relevant sources, integrate heterogeneous multimodal evidence, perform complex
                analytical reasoning, and return a complete result table. Deterministic, semantics-aware
                evaluation recognizes equivalent representations while rejecting incomplete or incorrect
                outputs.
              </p>

              <div className="resource-grid">
                <a href={resourceLinks.paper} target="_blank" rel="noreferrer">
                  <DocumentIcon /> Paper
                </a>
                <a href={resourceLinks.dataset} target="_blank" rel="noreferrer">
                  <DatabaseIcon /> Dataset
                </a>
                <a href={resourceLinks.code} target="_blank" rel="noreferrer">
                  <GithubIcon /> Code
                </a>
                <a href="/submission-guidelines.html" target="_blank" rel="noreferrer">
                  <UploadIcon /> Submit
                </a>
              </div>
            </div>
          </section>

          <section className="info-panel news-panel" aria-labelledby="news-title">
            <div className="panel-body">
              <h2 id="news-title">News</h2>
              <ul className="news-list">
                {newsItems.map((item) => {
                  const external = item.href.startsWith('http')
                  return (
                    <li key={`${item.date}-${item.title}`}>
                      <time>{item.date}</time>
                      <div>
                        <a
                          href={item.href}
                          target={external ? '_blank' : undefined}
                          rel={external ? 'noreferrer' : undefined}
                        >
                          {item.title}
                        </a>
                        <p>{item.detail}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>

          <section className="info-panel why-panel" aria-labelledby="why-title">
            <div className="panel-body">
              <h2 id="why-title">Why DataSpace?</h2>
              <p>
                Real analytical work rarely begins with one clean, preselected table. Evidence may be
                distributed across databases, structured files, long documents, and video, alongside
                valid but irrelevant files.
              </p>
              <p>
                DataSpace evaluates the complete workflow: discovering sources, combining evidence,
                performing multi-step computation, and returning a verifiable tabular result.
              </p>
              <figure className="paper-figure">
                <a href="/dataspace-figure1.png" target="_blank" rel="noreferrer">
                  <img
                    src="/dataspace-figure1.png"
                    loading="lazy"
                    alt="DataSpace task example showing a question, a heterogeneous task workspace, the data-agent workflow, and a complete tabular answer"
                  />
                </a>
                <figcaption>
                  Figure 1. A DataSpace task combining structured files, SQLite, a long PDF, and video.{' '}
                  <a href={resourceLinks.paper} target="_blank" rel="noreferrer">View paper</a>
                </figcaption>
              </figure>
            </div>
          </section>

          <section className="info-panel questions-panel" aria-labelledby="questions-title">
            <div className="panel-body">
              <h2 id="questions-title">Have Questions?</h2>
              <p>
                For questions about the dataset, evaluator, baselines, or leaderboard submissions,
                please open a{' '}
                <a href={`${resourceLinks.code}/issues`} target="_blank" rel="noreferrer">
                  GitHub issue
                </a>{' '}
                or contact <a href="mailto:bli303@connect.hkust-gz.edu.cn">Boyan Li</a> directly.
              </p>
            </div>
          </section>

          <section className="info-panel citation-panel" aria-labelledby="citation-title">
            <div className="panel-body">
              <h2 id="citation-title">Citation</h2>
              <p>If you use DataSpace in your research, please cite:</p>
              <pre><code>{citation}</code></pre>
            </div>
          </section>
        </aside>

        <div className="main-column">
          <section className="info-panel leaderboard-panel" id="leaderboard" aria-labelledby="leaderboard-title">
            <header className="panel-titlebar">
              <h2 id="leaderboard-title">Leaderboard</h2>
            </header>
            <div className="panel-body leaderboard-body">
              <Leaderboard methods={leaderboardMethods} />
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div>
          <span>DataSpace Benchmark · HKUST(GZ)</span>
          <nav aria-label="Footer navigation">
            <a href={resourceLinks.paper} target="_blank" rel="noreferrer">Paper</a>
            <a href={resourceLinks.dataset} target="_blank" rel="noreferrer">Dataset</a>
            <a href={resourceLinks.code} target="_blank" rel="noreferrer">Code</a>
            <a href="#leaderboard">Leaderboard</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

export default App
