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
