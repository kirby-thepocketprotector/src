# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language, and Claude generates React code that renders in real-time without touching the disk.

## Commands

### Development
```bash
# Start dev server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run dev server in background (logs to logs.txt)
npm run dev:daemon
```

### Testing
```bash
# Run all tests (uses Vitest with jsdom)
npm test

# Run specific test file
npx vitest run <path-to-test-file>
```

### Database
```bash
# Initial setup (install deps + generate Prisma client + run migrations)
npm run setup

# Reset database (drops all data)
npm run db:reset

# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev
```

### Linting
```bash
npm run lint
```

## Architecture

### Virtual File System

The core innovation is a **fully in-memory virtual file system** (`src/lib/file-system.ts`). No generated code is written to disk - everything exists in memory as a tree of `FileNode` objects.

- **VirtualFileSystem class**: Manages files/directories in memory with operations like `createFile()`, `updateFile()`, `deleteFile()`, `rename()`
- **Serialization**: Files are serialized to JSON for persistence in the database (Project.data field)
- **Path handling**: All paths are normalized to start with `/`. Supports `@/` alias for root directory imports

### AI Integration

The AI chat interface (`/api/chat/route.ts`) uses the Vercel AI SDK with streaming:

1. **System prompt** (`src/lib/prompts/generation.tsx`): Instructs Claude to create React components in `/App.jsx` as the entry point
2. **AI Tools**: Claude has access to two custom tools:
   - `str_replace_editor`: View, create, edit files via string replacement or line insertion
   - `file_manager`: Rename or delete files/folders
3. **Tool execution**: When Claude calls tools, they operate on the VirtualFileSystem, and results are synced to the UI via `FileSystemContext`
4. **Mock mode**: Without `ANTHROPIC_API_KEY`, the system returns static code instead of using the LLM

### Context Architecture

Two primary React contexts manage global state:

**FileSystemContext** (`src/lib/contexts/file-system-context.tsx`):
- Wraps the VirtualFileSystem instance
- Provides file operations: `createFile`, `updateFile`, `deleteFile`, `renameFile`
- Handles AI tool calls via `handleToolCall()` to keep UI in sync with AI file operations
- Tracks selected file for the code editor
- Uses `refreshTrigger` counter to force UI updates after file changes

**ChatContext** (`src/lib/contexts/chat-context.tsx`):
- Wraps Vercel AI SDK's `useChat` hook
- Sends serialized file system state with each message
- Integrates with FileSystemContext to handle tool calls
- Tracks anonymous work for session persistence

### Preview System

The live preview (`src/components/preview/PreviewFrame.tsx`) works by:

1. **JSX Transformation** (`src/lib/transform/jsx-transformer.ts`):
   - Uses `@babel/standalone` to transpile JSX/TSX to plain JS in the browser
   - Handles TypeScript by applying both React and TypeScript presets
   - Detects and strips CSS imports, collecting them separately

2. **Import Map Generation**:
   - Creates browser-native import maps to resolve module specifiers
   - Transforms each file to blob URLs and maps them
   - External packages (React, etc.) resolve to `https://esm.sh/<package>`
   - Supports `@/` alias by mapping all variations in the import map
   - Creates placeholder modules for missing imports to prevent errors
   - Collects CSS content from `.css` files into inline `<style>` tags

3. **Preview HTML**:
   - Generates complete HTML document with import map in `<script type="importmap">`
   - Includes Tailwind CSS via CDN (`https://cdn.tailwindcss.com`)
   - Wraps app in ErrorBoundary for runtime error handling
   - Displays syntax errors prominently if Babel transformation fails
   - Loads entry point (typically `/App.jsx`) dynamically via `import()`

4. **Sandboxed iframe**: Preview renders in iframe with `sandbox="allow-scripts allow-same-origin allow-forms"` for security

### Authentication & Sessions

- **JWT-based auth** (`src/lib/auth.ts`): Sessions stored as HTTP-only cookies (7-day expiry)
- **Middleware** (`src/middleware.ts`): Protects API routes like `/api/projects` and `/api/filesystem`
- **Anonymous mode**: Users can work without signing up - work is tracked in localStorage (`src/lib/anon-work-tracker.ts`)
- **Password hashing**: Uses bcrypt for secure password storage

### Database Schema

SQLite database via Prisma (`prisma/schema.prisma`):

- **User**: Stores email (unique) and hashed password
- **Project**: Belongs to User (optional, can be anonymous)
  - `messages`: JSON-serialized chat history
  - `data`: JSON-serialized VirtualFileSystem state (all files/folders)

Prisma client is generated to `src/generated/prisma/` (not the default location).

### Component Structure

- **UI components** (`src/components/ui/`): shadcn/ui components (Radix UI primitives + Tailwind)
- **Chat components** (`src/components/chat/`): Message list, input, markdown rendering
- **Editor components** (`src/components/editor/`): File tree navigation, Monaco code editor
- **Preview component** (`src/components/preview/`): iframe-based preview with error handling

### Server Actions

Next.js server actions in `src/actions/`:
- `create-project.ts`: Creates new project for authenticated users
- `get-project.ts`: Fetches project with auth check
- `get-projects.ts`: Lists all user projects

### Routing

- `/`: Home page - anonymous or creates new project
- `/[projectId]`: Project workspace with chat, editor, and preview
- `/api/chat`: Streaming AI endpoint for component generation

### Styling

- **Tailwind CSS v4** with PostCSS
- **@tailwindcss/typography**: For markdown rendering in chat
- **tw-animate-css**: Animation utilities
- Monaco editor has separate styling integration via `@monaco-editor/react`

## Key Patterns

### File Operations Flow
1. User asks AI to create/modify components
2. AI calls `str_replace_editor` or `file_manager` tool
3. Tool executes on server-side VirtualFileSystem
4. Tool call result sent to client via streaming
5. Client's `FileSystemContext.handleToolCall()` mirrors changes in client VirtualFileSystem
6. UI components react to `refreshTrigger` changes
7. Preview automatically regenerates on file changes

### Path Resolution
- All file paths start with `/` (root of virtual FS)
- `@/` alias maps to root directory (configured in import map generation)
- Import map includes multiple variations: `/path`, `path`, `@/path`, with and without extensions

### Testing
- Vitest with jsdom environment
- React Testing Library for component tests
- Tests located in `__tests__` directories alongside source files
- Test files use `.test.ts` or `.test.tsx` extension
