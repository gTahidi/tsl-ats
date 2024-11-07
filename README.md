# Open Source ATS Platform

A modern Application Tracking System built with Next.js, PostgreSQL, and MinIO.

## Features

- Job posting management
- Candidate tracking
- Application process workflow
- Document storage (CVs, etc.)
- Simple authentication system

## Tech Stack

- Next.js 14 with TypeScript
- PostgreSQL database
- MinIO for S3-compatible storage
- Docker Compose for local development
- Tailwind CSS for styling

## Local Development

1. Install dependencies
```bash
npm install
```

2. Set up environment variables
```bash
cp .env.example .env
```

3. Start local services
```bash
docker-compose up -d
```

4. Run database migrations
```bash
npm run migrate
```

5. Start development server
```bash
npm run dev
```

## License

MIT License - see LICENSE file for details
