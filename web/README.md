# Kontinue AI

Continue your AI conversations from any platform. Import shared chat links from ChatGPT, Gemini, Claude, or Perplexity, and pick up where you left off.

This folder contains the Next.js app in the monorepo. Shared Convex backend code lives in `../convex`.

## Features

- **Import shared chat links** - Paste a shared link and Kontinue AI will fetch and parse the conversation
- **Manual transcript fallback** - If automatic import fails, paste the conversation text directly
- **Multi-model support** - Choose from GPT-4o, Claude Sonnet 4, Gemini 2.0 Flash, and more
- **Beautiful dark UI** - Modern, polished interface with scanning animations
- **Secure & private** - All conversations are stored securely per-user

## Tech Stack

- **Next.js 16** - Latest App Router with Turbopack
- **TypeScript** - Full type safety
- **Tailwind CSS 4** - Modern styling
- **Clerk** - Authentication (Google + email)
- **Convex** - Real-time database
- **Vercel AI SDK** - Multi-provider AI streaming
- **TanStack Query** - Data fetching/caching
- **Zustand** - State management
- **Zod** - Schema validation

## Setup

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 18+
- Clerk account (https://clerk.com)
- Convex account (https://convex.dev)
- API keys for AI providers (OpenAI, Anthropic, Google)

### 1. Clone and install dependencies

```bash
cd ..
bun install
```

### 2. Configure environment variables

Copy `env.example` to `.env.local` and fill in your values:

```bash
cp env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk Dashboard
- `CLERK_SECRET_KEY` - From Clerk Dashboard
- `CLERK_JWT_ISSUER_DOMAIN` - Your Clerk JWT issuer domain
- `NEXT_PUBLIC_CONVEX_URL` - From Convex Dashboard
- `OPENAI_API_KEY` - For GPT models
- `ANTHROPIC_API_KEY` - For Claude models
- `GOOGLE_GENERATIVE_AI_API_KEY` - For Gemini models

### 3. Configure Convex

```bash
bun run dev:convex
```

This will:
- Prompt you to log in to Convex
- Create a new project or connect to existing
- Deploy the schema and functions
- Generate type-safe API

### 4. Configure Clerk for Convex

In Clerk Dashboard:
1. Go to JWT Templates
2. Create a new template named "convex"
3. Use the Convex JWT template

Update your `.env.local`:
```
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-instance.clerk.accounts.dev
```

### 5. Run the development server

```bash
bun run dev:web
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## UI (shadcn/ui + Vercel AI Elements)

This repo uses **Bun**, so prefer `bunx` over `npx`.

- **Initialize shadcn/ui** (optional if you want to add more components via the CLI):

```bash
bunx shadcn@latest init
```

- **Install Vercel AI Elements** (official generator; adds components into your repo):

```bash
bunx ai-elements@latest
```

Note: we already include a minimal AI Elements-style `PromptInput` and shadcn-style `Button`/`Textarea` in `src/components/`.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Protected app routes
│   │   ├── chat/[chatId]/  # Chat page
│   │   └── page.tsx        # Import page (home)
│   ├── (auth)/             # Auth routes
│   │   ├── sign-in/
│   │   └── sign-up/
│   └── api/                # API routes
│       ├── chat/           # AI streaming endpoint
│       └── import/         # Import preview/commit
├── features/               # Feature modules
│   ├── auth/               # Auth components
│   ├── chat/               # Chat UI components
│   └── import/             # Import flow components
│       └── lib/providers/  # Provider parsers
├── lib/                    # Shared libraries
├── utils/                  # Utility functions
└── components/             # Shared UI components

convex/                     # Convex backend
├── schema.ts               # Database schema
├── users.ts                # User functions
├── chats.ts                # Chat functions
└── messages.ts             # Message functions
```

## How It Works

1. **User signs in** via Clerk (Google or email)
2. **Pastes a shared link** from ChatGPT, Gemini, Claude, etc.
3. **Kontinue AI fetches the page** and parses the conversation using provider-specific parsers
4. **If automatic import fails**, user can paste the transcript manually
5. **Conversation is saved** to Convex with full history
6. **User continues chatting** with their choice of AI model
7. **New messages are streamed** via Vercel AI SDK and persisted to Convex

## Supported Providers

- **ChatGPT** - chat.openai.com/share/*
- **Gemini** - gemini.google.com/share/*
- **Claude** - claude.ai/share/*
- **Perplexity** - perplexity.ai/search/*
- **Generic** - Fallback parser for unknown providers

## Notes

### Cache Components

Next.js 16 Cache Components is currently disabled because:
- Clerk requires runtime session data
- Convex provides real-time data (always fresh)
- Dynamic route params need runtime resolution

Can be re-enabled once Clerk/Convex provide better Cache Components support.

### Middleware Deprecation

Next.js 16 recommends using "proxy" instead of "middleware". The current implementation uses Clerk's middleware which still works but shows a deprecation warning.

## License

MIT
