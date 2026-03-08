# create-fs-cli

A lightning-fast, interactive CLI tool to rapidly scaffold full-stack applications.

## 🚀 Usage

The easiest way to start is by using `npx`. You don't need to install anything globally!

```bash
npx create-fs-cli my-app
# or
npx create-fs-cli
```

*(You can also optionally install it globally via `npm install -g create-fs-cli`)*

## ✨ Features

- **Clean Interactive TUI** - A sleek, minimal terminal interface to choose your stack step-by-step.
- **Frontend Frameworks** - Next.js, React + Vite, or SvelteKit.
- **Backend Frameworks** - Express, Fastify, FastAPI, or Integrated Next.js API Routes.
- **Database Ready** - PostgreSQL, MongoDB, MySQL, or No Database.
- **Instant Boilerplate** - Generates the code mapping your frontend directly to your backend.
- **Live Status Component** - Automatically injects a `BackendStatus` UI component into your frontend that actively pings the backend and database to verify connection health in real-time.

## 🛠️ Stack Options

### Frontend
- **Next.js** - React framework (TypeScript/JavaScript)
- **React + Vite** - Fast React development (TypeScript/JavaScript)
- **SvelteKit** - Modern Svelte framework (TypeScript/JavaScript)

### Backend
- **Express** - Minimalist Node.js framework
- **Fastify** - High-performance Node.js framework
- **FastAPI** - High-performance Python framework
- **Next.js API Routes** - Integrated serverless backend

### Database
- **PostgreSQL** - Relational DB
- **MongoDB** - Document DB
- **MySQL** - Relational DB
- **None** - Build without a DB

## 📂 Generated Structure

```text
my-project/
├── frontend/             # Handled by your chosen frontend framework
│   ├── src/components/
│   │   └── BackendStatus # Visual connection indicator for Backend & DB
│   └── package.json
├── backend/              # Your chosen backend framework
│   ├── config/
│   │   └── ...           # Pre-configured DB connection
│   ├── routes/
│   └── .env.example      # Safe, ready-to-use template for your credentials
├── .gitignore
└── README.md
```

## 🤝 Contributing

**PRs are highly welcome!**

Whether you want to **improve the terminal UI layout**, add support for **new frameworks/databases**, or **fix bugs**, your contributions are greatly appreciated. 

To get started:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/ui-improvements`).
3. Make your changes and test them locally.
4. Push your branch (`git push origin feature/ui-improvements`).
5. Open a Pull Request!

## 📄 License

MIT
