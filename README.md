# FullStack CLI

A CLI tool to scaffold full-stack applications with interactive terminal UI.

## Installation

```bash
npm install -g fullstack-cli
```

## Usage

```bash
# Run the CLI
fullstack

# Or with a project name
fullstack create my-app
```

## Features

- 🎨 **Interactive prompts** - Choose your stack step by step
- ⚡ **Multiple frontends** - Next.js, React + Vite, SvelteKit
- 🔧 **Multiple backends** - Express, Fastify, FastAPI, or Next.js API Routes
- 🗄️ **Database ready** - PostgreSQL, MongoDB, MySQL, Supabase
- 📊 **Backend status indicator** - Visual connection status in your frontend

## Stack Options

### Frontend
- **Next.js** - React framework with SSR/SSG
- **React + Vite** - Fast React development
- **SvelteKit** - Svelte framework

### Backend
- **Next.js API Routes** - Integrated with Next.js frontend
- **Express** - Minimalist Node.js framework
- **Fastify** - Fast Node.js framework
- **FastAPI** - Modern Python framework

### Database
- **PostgreSQL** - Relational database
- **MongoDB** - Document database
- **MySQL** - Relational database
- **Supabase** - PostgreSQL with extras
- **None** - No database setup

## Generated Structure

```
my-project/
├── frontend/          # Your chosen frontend framework
│   └── components/
│       └── BackendStatus  # Connection status indicator
├── backend/           # Your chosen backend (if not Next.js API)
│   ├── config/
│   │   └── db.js      # Database configuration
│   ├── routes/
│   └── .env           # Environment variables
├── .gitignore
└── README.md
```

## License

MIT
