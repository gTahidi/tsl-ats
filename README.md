# Open Source ATS Platform

![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)

![Open Source ATS Platform](./src/public/ats-oss.png)

This project aims to be a simple, open-source Applicant Tracking System (ATS) platform 
that can be self-hosted and customized to your needs.

## Demo

A live demo of the project can be found [here](https://demo.ats-oss.org/), the admin
password is `admin`.

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
- Vercel's Blob Storage for file storage (will add compatibility with S3-compatible storage)

## Local Development

You will need to have `pnpm` and `docker-compose` installed on your machine.

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

## License

This project is licensed under GNU GPLv3.

### Why GPL?

The whole point of this project is that there's so many ATS platforms out there that are either 
too expensive, too complicated, or too restrictive. This project aims to be a simple, open-source alternative 
that can be self-hosted and customized to your needs.

For that reason, I've chosen the GNU GPLv3 license to ensure that any modifications or improvements made to this project
are shared back with the community. This is to prevent any one entity from taking the project and making it proprietary.

## Contributing

Contributions are welcome! Just create an issue or pull request and I'll take a look.
