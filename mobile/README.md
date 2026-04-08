# Kontinue AI Mobile

Expo app inside the Kontinue AI monorepo.

## Environment

Create `mobile/.env` from `mobile/env.example`.

Required:

- `EXPO_PUBLIC_CONVEX_URL` (must match web's `NEXT_PUBLIC_CONVEX_URL`)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_KONTINUE_API_URL`

## Run

From repository root:

```bash
bun run dev:mobile
```

Or from `mobile/`:

```bash
bun run dev
```
