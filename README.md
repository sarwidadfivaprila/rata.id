# Healthcare Scheduling System

RATA Skill Test — Backend Engineer submission. A microservice-based system for clinics to manage
consultation schedules between doctors and patients.

## Architecture

Two independent NestJS + GraphQL services, each with its own PostgreSQL database, communicating
over HTTP:

```mermaid
flowchart LR
    Client -->|GraphQL| Auth[Auth Service :3001]
    Client -->|GraphQL + Bearer token| Schedule[Schedule Service :3002]
    Schedule -->|validateToken query| Auth
    Auth --> AuthDB[(auth-postgres)]
    Schedule --> ScheduleDB[(schedule-postgres)]
    Schedule --> Redis[(Redis cache)]
```

- **Auth Service** (`auth-service/`, port 3001): registration, login, and token validation. Owns
  the `users` table.
- **Schedule Service** (`schedule-service/`, port 3002): customers, doctors, and schedules. Owns
  the `customers`/`doctors`/`schedules` tables. Every request must carry
  `Authorization: Bearer <token>`; a guard forwards that token to the Auth Service's
  `validateToken` query on each request (no local JWT verification) and rejects the request if it
  comes back invalid.
- List queries (`customers`, `doctors`, `schedules`) are cached in Redis for 30s, keyed by their
  query arguments, and invalidated on the matching create/update/delete.

## Running the project

Requires Docker and Docker Compose.

```bash
cp .env.example .env   # DB credentials + JWT secret used by docker-compose.yml
docker compose up --build
```

This builds both services, starts their own Postgres instances plus Redis, waits for each
dependency to be healthy, and runs Prisma migrations automatically before each service starts.
Once it's up:

- Auth Service GraphQL API + schema explorer: http://localhost:3001/graphql
- Schedule Service GraphQL API + schema explorer: http://localhost:3002/graphql

To stop and remove containers (keeping data): `docker compose down`. To also wipe the databases:
`docker compose down -v`.

### Running a service locally without Docker

Each service is a standalone NestJS app:

```bash
cd auth-service   # or schedule-service
npm install
cp .env.example .env   # adjust DATABASE_URL etc. to point at a local Postgres
npx prisma migrate deploy
npm run start:dev
```

### Tests

```bash
cd auth-service        # or schedule-service
npm test                # run unit tests
npm run test:cov        # run with coverage report
```

## Environment variables

### auth-service

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string for the auth database | `postgresql://postgres:postgres@auth-postgres:5432/auth_db?schema=public` |
| `JWT_SECRET` | Secret used to sign/verify access tokens | `dev-only-auth-secret-change-me` |
| `JWT_EXPIRES_IN` | Access token expiry | `1h` |
| `PORT` | HTTP port | `3001` |

### schedule-service

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string for the schedule database | `postgresql://postgres:postgres@schedule-postgres:5432/schedule_db?schema=public` |
| `AUTH_SERVICE_URL` | Auth Service GraphQL endpoint, used to validate tokens | `http://auth-service:3001/graphql` |
| `REDIS_HOST` | Redis host used for list-query caching | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `PORT` | HTTP port | `3002` |

When running via `docker-compose up`, `docker-compose.yml` builds these from a root-level `.env`
(copy `.env.example` to get started — it holds the DB credentials and `JWT_SECRET` as
`AUTH_DB_USER`/`AUTH_DB_PASSWORD`/`AUTH_DB_NAME`, `SCHEDULE_DB_USER`/`SCHEDULE_DB_PASSWORD`/
`SCHEDULE_DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`) plus the fixed container hostnames
(`auth-postgres`, `schedule-postgres`, `redis`, `auth-service`). Nothing is hardcoded in the
compose file itself, and `.env` is gitignored. Each service's own `.env.example` documents the
same variables (in `DATABASE_URL` form) for running it standalone outside Docker.

## Example GraphQL operations

More runnable examples (every mutation/query in both services) are in
[`docs/graphql-examples.md`](docs/graphql-examples.md). Typical flow:

**1. Register and log in (Auth Service, `:3001/graphql`)**

```graphql
mutation {
  register(input: { email: "doctor.admin@clinic.com", password: "supersecret" }) {
    id
    email
  }
}

mutation {
  login(input: { email: "doctor.admin@clinic.com", password: "supersecret" }) {
    accessToken
  }
}
```

**2. Use the token against the Schedule Service (`:3002/graphql`)**

Send the returned `accessToken` as an `Authorization: Bearer <token>` header on every request below.

```graphql
mutation {
  createDoctor(input: { name: "Dr. Alice" }) {
    id
  }
}

mutation {
  createCustomer(input: { name: "John Doe", email: "john@example.com" }) {
    id
  }
}

mutation {
  createSchedule(
    input: {
      objective: "Annual checkup"
      customerId: "<customer id>"
      doctorId: "<doctor id>"
      scheduledAt: "2026-09-01T09:00:00.000Z"
    }
  ) {
    id
    objective
    customer { name }
    doctor { name }
  }
}

query {
  schedules(page: 1, limit: 10, doctorId: "<doctor id>") {
    total
    data {
      objective
      scheduledAt
    }
  }
}
```

## Project structure

```
rata.id/
├── docker-compose.yml
├── README.md
├── docs/
│   └── graphql-examples.md
├── auth-service/
│   ├── Dockerfile
│   ├── prisma/
│   └── src/
└── schedule-service/
    ├── Dockerfile
    ├── prisma/
    └── src/
```
