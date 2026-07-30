export type LeaderboardMethod = {
  id: string
  method: string
  backbone: string
  organization: string
  description: string
  accuracy: number
  correct: number
  costPerTask: number | null
  codeUrl: string | null
  evaluated: string
  snapshot: string
  benchmarkVersion: string
  accent: string
  openWeight: boolean
}

export const leaderboardMethods: LeaderboardMethod[] = [
  {
    id: 'dataspace-grok-45',
    method: 'DataSpace-Agent',
    backbone: 'Grok 4.5',
    organization: 'DataSpace Team',
    description:
      'Controlled ReAct-style baseline with a multimodal Grok 4.5 backbone and three task-agnostic tools.',
    accuracy: 66.34,
    correct: 272,
    costPerTask: 0.169,
    codeUrl: 'https://github.com/HKUSTDial/DataSpace/tree/main/baseline',
    evaluated: '2026-07-24',
    snapshot: 'xai/grok-4.5 · 2026-07',
    benchmarkVersion: 'DataSpace · 410 tasks',
    accent: '#8b7cf6',
    openWeight: false,
  },
  {
    id: 'dataspace-gpt-56-sol',
    method: 'DataSpace-Agent',
    backbone: 'GPT-5.6 Sol',
    organization: 'DataSpace Team',
    description:
      'The same controlled agent implementation paired with OpenAI GPT-5.6 Sol under provider-default reasoning.',
    accuracy: 64.63,
    correct: 265,
    costPerTask: 0.2,
    codeUrl: 'https://github.com/HKUSTDial/DataSpace/tree/main/baseline',
    evaluated: '2026-07-24',
    snapshot: 'openai/gpt-5.6-sol · 2026-07',
    benchmarkVersion: 'DataSpace · 410 tasks',
    accent: '#55b8e8',
    openWeight: false,
  },
  {
    id: 'dataspace-kimi-k3',
    method: 'DataSpace-Agent',
    backbone: 'Kimi K3',
    organization: 'DataSpace Team',
    description:
      'Controlled DataSpace-Agent baseline using the open-weight Kimi K3 multimodal backbone.',
    accuracy: 53.41,
    correct: 219,
    costPerTask: 0.235,
    codeUrl: 'https://github.com/HKUSTDial/DataSpace/tree/main/baseline',
    evaluated: '2026-07-24',
    snapshot: 'moonshotai/kimi-k3 · 2026-07',
    benchmarkVersion: 'DataSpace · 410 tasks',
    accent: '#77d8bd',
    openWeight: true,
  },
  {
    id: 'dataspace-mimo-v25',
    method: 'DataSpace-Agent',
    backbone: 'MiMo-V2.5',
    organization: 'DataSpace Team',
    description:
      'Controlled DataSpace-Agent baseline using the open-weight MiMo-V2.5 multimodal backbone.',
    accuracy: 39.27,
    correct: 161,
    costPerTask: 0.011,
    codeUrl: 'https://github.com/HKUSTDial/DataSpace/tree/main/baseline',
    evaluated: '2026-07-24',
    snapshot: 'xiaomi/mimo-v2.5 · 2026-04',
    benchmarkVersion: 'DataSpace · 410 tasks',
    accent: '#ffd36a',
    openWeight: true,
  },
  {
    id: 'dataspace-claude-sonnet-5',
    method: 'DataSpace-Agent',
    backbone: 'Claude Sonnet 5',
    organization: 'DataSpace Team',
    description:
      'The controlled baseline paired with Claude Sonnet 5 and the same local data-workbench boundary.',
    accuracy: 32.93,
    correct: 135,
    costPerTask: 0.224,
    codeUrl: 'https://github.com/HKUSTDial/DataSpace/tree/main/baseline',
    evaluated: '2026-07-24',
    snapshot: 'anthropic/claude-sonnet-5 · 2026-06',
    benchmarkVersion: 'DataSpace · 410 tasks',
    accent: '#ff9f8f',
    openWeight: false,
  },
  {
    id: 'dataspace-minimax-m3',
    method: 'DataSpace-Agent',
    backbone: 'MiniMax M3',
    organization: 'DataSpace Team',
    description:
      'Controlled DataSpace-Agent baseline using the open-weight MiniMax M3 multimodal backbone.',
    accuracy: 28.54,
    correct: 117,
    costPerTask: 0.042,
    codeUrl: 'https://github.com/HKUSTDial/DataSpace/tree/main/baseline',
    evaluated: '2026-07-24',
    snapshot: 'minimax/minimax-m3 · 2026-06',
    benchmarkVersion: 'DataSpace · 410 tasks',
    accent: '#c58cf2',
    openWeight: true,
  },
]

export const resourceLinks = {
  dataset: 'https://huggingface.co/datasets/HKUSTDial/DataSpace',
  code: 'https://github.com/HKUSTDial/DataSpace',
  competition: 'https://dataagent.top',
}
