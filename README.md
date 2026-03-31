# Clawco

Clawco is a cinematic Three.js command center for exploring how a multi-agent organization is structured, who collaborates with whom, and what each agent is working on.

Example capture from a squad-built run:

![Clawco example capture](./docs/chrome-capture-2026-03-30-2.gif)

## Scripts

- `pnpm dev` starts the local Vite dev server.
- `pnpm build` runs the production build.
- `pnpm test` runs the unit and render smoke tests.
- `pnpm typecheck` checks the TypeScript project.

## Runtime Snapshot Mode

Clawco now prefers a live snapshot at `/api/snapshot` and falls back to the built-in demo organization when no runtime snapshot is available.

For local development, point the Vite server at a snapshot file:

```bash
CLAWCO_SNAPSHOT_PATH=/absolute/path/to/snapshot.json pnpm dev
```

The dev server will serve that file from `/api/snapshot` on each request, so you can regenerate the JSON in place while the UI stays open.

The expected snapshot shape matches the `clawtask snapshot` output:

- `team` metadata for the current squad
- `agents` with hierarchy, status, workload, task stats, and active task summaries
- `collaborations` between agents
- `tasks` for the full queue view

If the endpoint is missing or fails to load, Clawco shows the demo organization and labels the view as a fallback.
