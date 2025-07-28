## Features

- Job posting management
- Candidate tracking
- Application process workflow
- Document storage (only CVs for now)
- Simple global authentication system (will add additional auth providers later on)

## Tech Stack

- Next.js with TypeScript
- PostgreSQL database, with Prisma ORM
- Docker Compose for local development
- Antd for UI components
- Azure Blob Storage for file storage

## Setup

1. Install dependencies
  ```bash
  pnpm install
  ```

2. Set up environment variables
  ```bash
  cp .env.example .env
  ```
  Update the `.env` file with your specific configuration values.

3. Start local services (Postgres and Minio)
  ```bash
  docker-compose up -d
  ```

4. Run database migrations
  ```bash
  pnpm migrate
  ```

5. Start development server
  ```bash
  pnpm dev
  ```

## Grafana Faro Observability

This project includes Grafana Faro for frontend observability. To configure it:

1. Create a Frontend Observability application in your Grafana Cloud instance
2. Copy the collector URL from the Web SDK Configuration page
3. Update the `NEXT_PUBLIC_FARO_URL` in your `.env` file with this URL
4. Adjust other Faro-related environment variables as needed

The Faro integration includes:
- Frontend monitoring via `@grafana/faro-web-sdk`
- Tracing instrumentation via `@grafana/faro-web-tracing`
- Backend correlation through middleware
- OpenTelemetry integration for backend services
