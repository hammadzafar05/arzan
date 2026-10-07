# Contributing to Arzan

Thanks for helping! Arzan aims to stay **small, readable and free-tier safe**, so every change is judged against those three.

## Before you start
- For anything bigger than a fix, open an issue or a Discussion first, so we agree on the approach before you write code.
- Read [`AGENTS.md`](AGENTS.md). Its rules apply to people too: free tier first, migrations via `npm run db:generate`, multi-row writes in `db.batch()`, `{ error: "…" }` messages written as instructions, and a strict CSP.

## Setup
```sh
npm install
npm run dev   # creates .dev.vars with a random BETTER_AUTH_SECRET on the first run
```

## Every pull request
- `npm run check` passes (lint, typecheck, tests, build). For UI changes, `npm run test:e2e` passes too.
- New API behaviour has a test: the happy path and the refusal (`createTestApp()`).
- UI changes are checked at phone width (390 px) and in dark mode. Include a screenshot in the PR.
- Keep PRs small and focused: one change per PR, no drive-by reformatting.
- Don't add dependencies without a reason in the PR description (bundle size and Free-plan CPU matter).

## Good first issues
Look for the [`good first issue`](https://github.com/hammadzafar05/arzan/labels/good%20first%20issue) label.
