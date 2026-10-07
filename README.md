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

Local submission archives and versioned evaluation records live in the
Git-ignored `leaderboard-private/` directory. See
[`docs/leaderboard-maintenance.md`](docs/leaderboard-maintenance.md) for intake,
evaluation, backups, and dataset-version refresh commands.

## Deployment

Pushes to `main` are built and deployed through GitHub Actions. The repository
must use **GitHub Actions** as its Pages source.
