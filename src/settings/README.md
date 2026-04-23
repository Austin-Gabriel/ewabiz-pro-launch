# settings

Domain folder for **settings** features. Currently a placeholder — no code lives here yet.

## When you add code here
- UI components for the settings domain go in this folder.
- Cross-domain shared UI lives in `src/components/`.
- Route files stay in `src/routes/` (TanStack file-based routing). Each route should be a thin wrapper that imports its UI from this folder.
- Pure utilities/hooks scoped to settings also live here. App-wide utilities go in `src/lib/`.
- Mock data fixtures go in `src/data/`, not here.
