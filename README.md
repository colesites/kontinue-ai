# Kontinue AI Monorepo

This repository is a monorepo with:

- `web/` - Next.js web app
- `mobile/` - Expo React Native app
- `convex/` - shared Convex backend

Both apps are configured to use the same generated Convex API from `convex/_generated`.

## Prerequisites

- Bun `1.3.5+`
- Convex account
- Clerk account

## Install

From repository root:

```bash
bun install
```

## Environment Setup

Use `env.example` in the repo root as the source of truth.

For full web-only provider keys (AI gateway, etc.), also reference `web/env.example`.

Set the same Convex URL for both:

- `web/.env.local` -> `NEXT_PUBLIC_CONVEX_URL`
- `mobile/.env` -> `EXPO_PUBLIC_CONVEX_URL`

## Development

Run each process from separate terminals:

```bash
bun run dev:convex
bun run dev:web
bun run dev:mobile
```

## Convex Commands

From repository root:

```bash
bun run convex:codegen
bun run convex:deploy
```

## Quality Checks

```bash
bun run typecheck:web
bun run typecheck:mobile
```
