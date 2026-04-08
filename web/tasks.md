# Kode AI IDE — Full Task List

Goal:
Build a modern AI coding IDE similar to Cursor with a cleaner UI and strong AI tooling.

Tech Stack:
- Next.js
- TypeScript
- Bun
- Biome
- Monaco Editor
- xterm.js
- WebContainers
- Server Actions
- Vector search for context engine

Project Rules:
- TypeScript first
- never use any type
- maximum 100–150 lines per file
- feature-based folder structure
- server components by default
- strict linting using biome
- bun for package management
- separate UI, logic, and services

Supported AI Models:

OpenAI
- codex-5
- codex-5.1
- codex-5.2
- codex-5.3
- chatgpt-5.4

Anthropic
- claude-opus-4.6

Google
- gemini-3
- gemini-3.1-pro

---

# Phase 1 — Core IDE Infrastructure

## Task 1 — Workspace System

Create project workspace environment.

Features:
- open project folder
- workspace root
- save file changes
- project metadata
- recent projects list

---

## Task 2 — File System Layer

Create file system abstraction.

Features:
- create file
- create folder
- rename file
- delete file
- move files
- drag and drop support

---

## Task 3 — File Explorer UI

Left sidebar file tree.

Features:
- expandable folders
- icons by file type
- context menu
- search files
- open file in editor

---

# Phase 2 — Monaco Editor

## Task 4 — Monaco Editor Integration

Integrate Monaco Editor.

Features:
- syntax highlighting
- multiple language support
- IntelliSense
- code folding
- minimap
- bracket matching
- diagnostics
- hover documentation

---

## Task 5 — Editor Tabs

Support multiple open files.

Features:
- tab bar
- close tab
- reorder tabs
- unsaved changes indicator

---

## Task 6 — Editor Navigation

Features:
- go to definition
- find references
- rename symbol
- search in file
- global search

---

# Phase 3 — AI Chat System

## Task 7 — AI Chat Panel

Right sidebar chat interface.

Features:
- conversation history
- markdown rendering
- syntax highlighted code blocks
- streaming responses
- copy code button

---

## Task 8 — Model Selector

Allow users to select model.

Features:
- dropdown selector
- remember last model
- model capabilities metadata

Supported models only.

---

## Task 9 — Context Attachment System

Allow attaching context to prompts.

Context types:
- file
- folder
- code selection
- terminal logs
- git diff
- URL
- documentation

Example UI:

@auth.ts  
@terminal  
@folder/components

---

## Task 10 — Context Usage Indicator

Display circular token usage indicator.

Example:

18k / 128k tokens  
or  
● 22% context used

Update dynamically as context grows.

---

# Phase 4 — AI Editing

## Task 11 — AI Code Generation

Allow AI to generate code.

Features:
- generate code
- create files
- generate functions
- generate components

---

## Task 12 — AI Refactoring

Allow AI to refactor code.

Examples:

refactor function  
optimize performance  
convert to TypeScript

---

## Task 13 — Multi-File Editing

AI can modify multiple files.

Workflow:
1. AI generates diff patches
2. user reviews changes
3. apply patch to files

---

## Task 14 — Inline AI Commands

Allow commands in editor.

Examples:

/fix  
/refactor  
/explain  
/optimize

Commands operate on selected code.

---

# Phase 5 — AI Agent System

## Task 15 — Agent Tool System

Agent tools:

read file  
write file  
create file  
delete file  
list directory  
run terminal command

---

## Task 16 — Autonomous Agent Mode

Agent can perform multi-step tasks.

Example:

"convert this project to Next.js app router"

Agent steps:
1. analyze project
2. generate plan
3. modify files
4. run build
5. fix errors

---

## Task 17 — AI Timeline

Display AI actions.

Example timeline:

created auth.ts  
edited middleware.ts  
ran bun install  
fixed build error

Allow undo actions.

---

# Phase 6 — Terminal System

## Task 18 — Terminal Integration

Use xterm.js.

Features:
- run commands
- command history
- scroll logs
- multiple terminal tabs

---

## Task 19 — AI Terminal Integration

AI can run commands.

Workflow:

User prompt:
install prisma

AI runs:

bun add prisma  
bun prisma init

User can approve or reject commands.

---

## Task 20 — Terminal Context

Terminal output can be used as AI context.

Examples:

build errors  
stack traces  
runtime logs

---

# Phase 7 — Code Execution

## Task 21 — WebContainers Integration

Run code in browser.

Features:
- run dev server
- install packages
- live preview
- restart server

---

## Task 22 — Preview Panel

Show running application.

Features:
- iframe preview
- refresh button
- open in new tab

---

# Phase 8 — Codebase Indexing

## Task 23 — Code Indexing Engine

Index project files.

Steps:
1. parse code
2. chunk files
3. generate embeddings
4. store vectors

---

## Task 24 — Semantic Code Search

Allow AI to search codebase.

Examples:

find where auth middleware is used  
show all API routes

---

# Phase 9 — Git Integration

## Task 25 — Git Operations

Features:
- commit changes
- view diff
- create branch
- switch branch

---

## Task 26 — Repository Import

Allow users to import Git repositories.

Sources:
- GitHub
- local upload

---

# Phase 10 — Command System

## Task 27 — Command Palette

Shortcut:

CMD + K

Features:
- open file
- run AI command
- switch model
- create file

---

# Phase 11 — UI System

## Task 28 — Layout

Layout structure:

Top bar  
Left sidebar → file explorer  
Center → editor  
Bottom → terminal  
Right sidebar → AI chat

---

## Task 29 — Theme System

Themes:

dark  
light

Editor theme sync.

---

## Task 30 — Clean UI

Goals:

minimal design  
fast interactions  
smooth animations

---

# Phase 12 — Performance

## Task 31 — Streaming Responses

Use streaming for AI responses.

Benefits:
- faster feedback
- better UX

---

## Task 32 — Background Jobs

Use job queue.

Tasks:

AI indexing  
agent tasks  
large refactors

---

## Task 33 — Caching

Cache:

AI responses  
file metadata  
project indexing

---

# Phase 13 — Monitoring

## Task 34 — Usage Tracking

Track:

AI tokens  
model usage  
errors

---

## Task 35 — Error Monitoring

Log:

API failures  
editor errors  
agent crashes

---

# Future Features

## Collaboration

Multi-user editing.

Possible stack:

CRDT  
Yjs

---

## Plugin System

Allow third-party extensions.

---

## Cloud Projects

Store projects in cloud workspace.

note: Kode should only open on laptop, if it's not a laptop, it should not open, tell the users to access it with a laptop. a nice user friendly message should be displayed.