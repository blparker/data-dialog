# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests

## Architecture Overview

Data Dialog is a Next.js 15 application that provides a conversational interface for data analysis and transformation. The core architecture centers around a split-pane interface where users can visualize data transformations on the left and interact with an AI assistant on the right.

### Core Components

**Route Structure:**
- `(chat)` route group: Contains the main chat interface with data visualization
- `(web)` route group: Contains landing/marketing pages
- App Router with React Server Components

**Database Layer:**
- PostgreSQL with Drizzle ORM for application data (chats, messages, users, transformation steps)
- DuckDB for analytics and data processing (configured as external package in Next.js)
- Database files stored in `/dbs/` directory

**Data Transformation System:**
- `TransformationStep` entities represent data processing operations
- Step types: `source`, `edit-fields` (with extensible `dynamic` type)
- Each step has SQL, reads/writes dependencies, and hierarchical relationships
- Steps are linked to chats and can have parent-child relationships

### Key Technologies

- **Next.js 15** with App Router and React 19
- **DuckDB** integration via `@duckdb/node-api` and `@duckdb/node-bindings`
- **Clerk** for authentication and user management
- **Drizzle ORM** with PostgreSQL
- **TanStack Query** for server state management
- **shadcn/ui** components with Tailwind CSS v4
- **Framer Motion** for animations

### Component Architecture

**Chat Interface (`src/app/(chat)/_components/`):**
- `chat-layout.tsx`: Main split-pane layout (2/3 data, 1/3 chat)
- `data-pane.tsx`: Left pane for data visualization and tables
- `chat-pane.tsx`: Right pane for AI conversation
- `data-table.tsx`: Virtualized data table component
- `sidebar/`: Chat history and navigation

**Shared Components (`src/components/`):**
- `ui/`: shadcn/ui component library
- Path alias `@/components` configured

**Hooks (`src/hooks/`):**
- `use-data-table.ts`: Data table state management
- `use-mock-data.ts`: Development data utilities
- `use-mobile.ts`: Responsive design utilities

### Database Schema Highlights

**Core Entities:**
- `Chat`: Conversation sessions with optional `analysisDb` reference
- `Message`: Chat messages with parts and attachments
- `TransformationStep`: Data processing operations with SQL and dependencies
- `DataSource`: File/data source references
- `User`: Clerk-integrated user accounts

**Relationships:**
- Chats have many messages and transformation steps
- Transformation steps can have parent-child relationships
- All entities use UUID primary keys

### Development Notes

**Path Aliases:**
- `@/*` maps to `src/*`
- Component paths: `@/components`, `@/lib`, `@/hooks`

**Testing:**
- Jest with Next.js integration
- Testing Library for React components
- Test files in `__tests__/` and `*.test.ts` pattern
- Setup file: `jest.setup.ts`

**External Packages:**
- DuckDB packages configured as `serverExternalPackages` in `next.config.ts`
- Required for Node.js native bindings compatibility

**Provider Setup:**
- `Providers` component wraps app with Clerk and TanStack Query
- Query client configured with 1-minute stale time
- React Scan included for development debugging