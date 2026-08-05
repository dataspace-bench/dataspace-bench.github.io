# DataSpace Leaderboard

Source for [dataspace-bench.github.io](https://dataspace-bench.github.io), the
official DataSpace benchmark and leaderboard website.

Paper: [arXiv:2608.03451](https://arxiv.org/abs/2608.03451).

## Development

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run lint
npm run build
```

## Leaderboard data

Official entries are maintained in
[`src/data/leaderboard.ts`](src/data/leaderboard.ts). Every public entry should
correspond to a score produced by the private 410-task evaluator after the
DataSpace team has reviewed its submitted predictions and execution traces.

## Deployment

Pushes to `main` are built and deployed through GitHub Actions. The repository
must use **GitHub Actions** as its Pages source.
