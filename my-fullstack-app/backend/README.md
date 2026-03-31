# Express Backend Template (PostgreSQL)

Express.js backend template with PostgreSQL database integration.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL (Docker)
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres

# Create users table (connect to DB and run)
# CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100));

# Start server
npm run dev
```

## Available Routes

- `GET /api/health` - Health check
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Environment Variables

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=postgres
```
