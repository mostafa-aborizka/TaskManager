# TaskManager

TaskManager is a dockerized full-stack task management application built with Node.js, Express, PostgreSQL, Prisma ORM, and JWT authentication. Users can create an account, sign in, and manage their own todo items through the web application and REST API.

## Features

- User registration and login
- Password hashing with `bcryptjs`
- JWT-based authentication with 24-hour tokens
- User-specific todo lists
- Create, read, update, and delete todo items
- A default welcome task for newly registered users
- PostgreSQL persistence through Prisma ORM
- Docker Compose development environment
- Automatic database migration deployment when the app container starts

## Technology stack

- Node.js 22
- Express 5
- PostgreSQL 16
- Prisma ORM 7
- `@prisma/adapter-pg`
- JSON Web Tokens
- Docker and Docker Compose

## Project structure

```text
.
├── prisma/
│   ├── migrations/          # Database migrations
│   └── schema.prisma        # Prisma data model
├── public/                  # Frontend files
├── src/
│   ├── middleware/          # JWT authentication middleware
│   ├── routes/              # Authentication and todo routes
│   ├── prismaClient.js      # Prisma client configuration
│   └── server.js            # Express server entry point
├── Dockerfile
├── docker-compose.yaml
├── prisma.config.ts
└── package.json
```

## Requirements

- Node.js 22 or later
- npm
- Docker Desktop with the Linux engine enabled

## Configuration

Create a `.env` file in the project root:

```env
JWT_SECRET=replace-with-a-secure-secret
PORT=5003
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task_manager?schema=public
```

The Docker Compose configuration supplies a container-specific `DATABASE_URL` automatically. Do not commit `.env` or production secrets to source control.

## Run with Docker Compose

Build and start the application and PostgreSQL database:

```bash
docker compose up --build
```

The application is available at:

```text
http://localhost:5003
```

The app waits for PostgreSQL to become healthy, applies checked-in Prisma migrations, and then starts the server. PostgreSQL data is stored in the named `postgres_data` volume.

Stop the services while keeping database data:

```bash
docker compose down
```

Stop the services and delete the database volume:

```bash
docker compose down -v
```

The `-v` option permanently deletes the local development database.

## Run locally

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Apply existing migrations:

```bash
npx prisma migrate deploy
```

Start the development server:

```bash
npm run dev
```

For local development, PostgreSQL must be running and `DATABASE_URL` must point to it.

## Deploy with Snap Deploy and Neon

Production uses [Neon](https://neon.tech) for PostgreSQL and [Snap Deploy](https://snapdeploy.dev) for the application container.

1. Create a Neon PostgreSQL project and copy its connection string. It should include `sslmode=require`:

   ```text
   postgresql://user:password@host.neon.tech/neondb?sslmode=require
   ```

2. In Snap Deploy, deploy this repository as a container from the `Dockerfile`.
3. Configure the container port as `5003`, unless Snap Deploy provides a different `PORT` automatically.
4. Add these environment variables in Snap Deploy:

   ```text
   DATABASE_URL=<your Neon connection string>
   JWT_SECRET=<a long random secret>
   NODE_ENV=production
   ```

   Mark `DATABASE_URL` and `JWT_SECRET` as secrets. Do not commit them or add them to the Dockerfile.

5. Deploy the container. The image generates the Prisma client during its build, then applies checked-in migrations and starts the server when it runs.

The production container runs:

```text
npx prisma migrate deploy && node ./src/server.js
```

To deploy a schema change, create a migration locally, commit it, and push it to the deployment branch:

```bash
npx prisma migrate dev --name describe-your-change
git add prisma/schema.prisma prisma/migrations
git commit -m "Update database schema"
git push
```

Snap Deploy applies the migration with `prisma migrate deploy` during the next container startup. Do not use `prisma migrate dev` against the production database.

## Database migrations

Create and apply a development migration after changing `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name describe-your-change
```

When using Docker Compose, run the command inside the app container:

```bash
docker compose run --rm app npx prisma migrate dev --name describe-your-change
```

The application container uses `prisma migrate deploy` at startup to apply existing migrations. Do not use `migrate dev` as the production deployment command.

## API

All request and response bodies use JSON.

### Authentication

#### Register

```http
POST /auth/register
Content-Type: application/json
```

```json
{
  "username": "user@example.com",
  "password": "password"
}
```

Returns a JWT token. A duplicate username returns `409 Conflict`.

#### Login

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "username": "user@example.com",
  "password": "password"
}
```

Returns a JWT token.

### Todos

Todo endpoints require the token returned by registration or login:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/todos` | List the authenticated user's todos |
| `POST` | `/todos` | Create a todo with `{ "task": "..." }` |
| `PUT` | `/todos/:id` | Update completion with `{ "completed": true }` |
| `DELETE` | `/todos/:id` | Delete one of the authenticated user's todos |

The browser application is served from `/` when the server is running.

## Database inspection

To open PostgreSQL's interactive shell in the running database container:

```bash
docker exec -it postgres-db psql -U postgres -d task_manager
```

Because Prisma creates quoted table names, query them with double quotes:

```sql
SELECT * FROM "User";
SELECT * FROM "Todo";
```
