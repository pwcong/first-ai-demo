# First AI Demo

A personal finance management application built with modern web technologies.

## Project Structure

```
.
├── apps
│   └── web           # Main web application
├── packages
│   ├── database     # Database implementation and models
│   ├── shared       # Shared utilities and types
│   └── ui           # Shared UI components
```

## Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Setup

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Test
pnpm test

# Clean
pnpm clean
```

## Tech Stack

- Package Manager: pnpm
- Monorepo Tool: Turborepo
- Frontend: Next.js + React
- Database: IndexedDB
- UI: Tailwind CSS 