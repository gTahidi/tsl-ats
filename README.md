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

1. Clone the repository
```bash
git clone [repository-url]
cd oss-ats
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.production.template .env
```

4. Start local services
```bash
docker-compose up -d
```

5. Run database migrations
```bash
npx prisma migrate deploy
```

6. Start development server
```bash
npm run dev
```

## License

MIT License - see LICENSE file for details
