# Repository Tour

## 🎯 What This Repository Does

**tsl-ats** is an AI-powered Applicant Tracking System (ATS) called "Qchungi 0.0.1" designed to help organizations find hidden talent gems through intelligent CV analysis and streamlined recruitment workflows.

**Key responsibilities:**
- Manage job postings with AI-powered job description processing
- Parse and rank CVs using Google Gemini AI with intelligent matching algorithms
- Track candidates through customizable recruitment process workflows
- Schedule and manage interviews with integrated calendar systems
- Provide comprehensive candidate analytics and reporting

---

## 🏗️ Architecture Overview

### System Context
```
[HR Users] → [Next.js ATS Platform] → [PostgreSQL Database]
                     ↓
[Google Gemini AI] ← [Azure Blob Storage] → [Email/Calendar Services]
                     ↓
[Grafana Faro] ← [Sentry Monitoring]
```

### Key Components
- **Job Management System** - Create, edit, and manage job postings with AI-powered JD text extraction
- **AI CV Parser** - Google Gemini-powered CV analysis, ranking, and candidate matching
- **Candidate Workflow Engine** - Customizable process steps for tracking recruitment progress
- **Interview Management** - Cal.com integration for scheduling and meeting coordination
- **RBAC System** - Role-based access control with granular permissions
- **Vector Search** - Embedding-based CV search and similarity matching

### Data Flow
1. **Job Creation**: HR uploads job description → Gemini extracts and processes text → Job stored with metadata
2. **CV Processing**: Candidate uploads CV → Gemini parses and ranks against job → Creates persona and candidate records → Generates vector embeddings
3. **Workflow Tracking**: Candidates progress through customizable process steps → Interview scheduling → Final hiring decisions
4. **Analytics**: Real-time candidate analytics and recruitment pipeline insights

---

## 📁 Project Structure [Partial Directory Tree]

```
tsl-ats/
├── src/
│   ├── app/                    # Next.js App Router structure
│   │   ├── (auth)/            # Authentication routes (login/register)
│   │   ├── (authenticated)/   # Protected routes (jobs, candidates, etc.)
│   │   ├── api/               # Backend API endpoints
│   │   ├── components/        # Reusable UI components
│   │   └── contexts/          # React context providers
│   ├── db/                    # Database configuration and schema
│   │   ├── schema.ts          # Drizzle ORM schema definitions
│   │   └── seed.ts            # Database seeding scripts
│   ├── lib/                   # Core business logic and integrations
│   │   ├── gemini/            # Google Gemini AI integration
│   │   ├── azure-storage.ts   # Azure Blob Storage client
│   │   ├── auth.ts            # Authentication utilities
│   │   └── rbac.ts            # Role-based access control
│   └── utils/                 # Utility functions
├── drizzle/                   # Database migrations
├── scripts/                   # Build and utility scripts
├── docker-compose.yml         # Local development environment
├── Dockerfile                 # Production container configuration
└── package.json               # Dependencies and scripts
```

### Key Files to Know

| File | Purpose | When You'd Touch It |
|------|---------|---------------------|
| `src/db/schema.ts` | Database schema with all table definitions | Adding new entities or relationships |
| `src/lib/gemini/cv-parser.ts` | AI-powered CV parsing and ranking logic | Modifying CV analysis algorithms |
| `src/app/api/jobs/route.ts` | Job management API endpoints | Adding job-related features |
| `src/app/api/candidates/route.ts` | Candidate management API | Modifying candidate workflows |
| `src/middleware.ts` | Authentication and route protection | Changing auth behavior |
| `drizzle.config.ts` | Database connection configuration | Database setup changes |
| `docker-compose.yml` | Local development environment | Adding new services |

---

## 🔧 Technology Stack

### Core Technologies
- **Language:** TypeScript - Provides type safety across the full stack
- **Framework:** Next.js 15.3.5 - Modern React framework with App Router for full-stack development
- **Database:** PostgreSQL with pgvector - Relational database with vector search capabilities
- **ORM:** Drizzle ORM - Type-safe database toolkit with excellent TypeScript integration

### Key Libraries
- **Ant Design (antd)** - Comprehensive UI component library for consistent design
- **Google Gemini AI** - Advanced AI for CV parsing, text extraction, and candidate ranking
- **Azure Blob Storage** - Scalable cloud storage for CV files and documents
- **React Query (@tanstack/react-query)** - Server state management and caching
- **Zod** - Runtime type validation and schema parsing

### Development Tools
- **Drizzle Kit** - Database migration and schema management
- **ESLint** - Code linting and style enforcement
- **TypeScript** - Static type checking and enhanced developer experience
- **Docker** - Containerization for consistent development and deployment

---

## 🌐 External Dependencies

### Required Services
- **Google Gemini AI** - CV parsing, text extraction, and intelligent candidate ranking (critical for core functionality)
- **Azure Blob Storage** - File storage for CVs and job description documents (critical for document management)
- **PostgreSQL Database** - Primary data storage with vector search capabilities (critical for all operations)

### Optional Integrations
- **Cal.com** - Interview scheduling and calendar management (fallback: manual scheduling)
- **Postmark** - Email notifications for candidate communications (fallback: no email notifications)
- **Grafana Faro** - Frontend observability and performance monitoring (fallback: basic logging)
- **Sentry** - Error tracking and performance monitoring (fallback: console logging)

### Environment Variables

```bash
# Required
POSTGRES_PRISMA_URL=          # PostgreSQL connection string
GEMINI_API_KEY=               # Google Gemini AI API key
AZURE_STORAGE_CONNECTION_STRING= # Azure storage connection
AZURE_STORAGE_CONTAINER_NAME= # Azure container name

# Authentication
JWT_SECRET=                   # JWT signing secret
ADMIN_PASSWORD=               # Simple admin authentication

# Optional
CALCOM_API_KEY=              # Cal.com integration
POSTMARK_API_KEY=            # Email service
NEXT_PUBLIC_FARO_URL=        # Grafana Faro collector
NEXT_PUBLIC_SENTRY_DSN=      # Sentry error tracking
```

---

## 🔄 Common Workflows

### Job Creation and Management
1. **HR creates job posting** → Uploads optional JD file → Gemini extracts text content
2. **Job is published** → Available for candidate applications → Linked to process group workflow
3. **Job analytics** → Track application metrics → Monitor candidate pipeline

**Code path:** `src/app/(authenticated)/jobs` → `src/app/api/jobs/route.ts` → `src/lib/gemini/text-extractor.ts`

### CV Processing and Candidate Creation
1. **CV upload** → File stored in Azure Blob Storage → Gemini AI parses content
2. **Candidate ranking** → AI matches against job requirements → Generates match score and summary
3. **Persona creation** → Extract contact info → Create candidate record → Generate vector embeddings
4. **Workflow initiation** → Assign to process group → Create initial process step

**Code path:** `src/app/cv-upload` → `src/app/api/cv/upload-and-process/route.ts` → `src/lib/gemini/cv-parser.ts` → `src/utils/candidate-creation.ts`

### Interview Scheduling and Management
1. **Interview request** → Select candidate and interviewers → Choose time slot
2. **Cal.com integration** → Create booking → Generate meeting URL → Send notifications
3. **Interview tracking** → Update status → Record notes → Progress candidate workflow

**Code path:** `src/app/interviews` → `src/app/api/interviews/route.ts` → `src/lib/calcom.ts`

---

## 📈 Performance & Scale

### Performance Considerations
- **Vector Embeddings:** CV chunks stored with pgvector for fast similarity search
- **AI Processing:** Asynchronous CV parsing to prevent blocking operations
- **File Storage:** Azure Blob Storage for scalable document management
- **Database Indexing:** Optimized queries with proper indexing on frequently accessed fields

### Monitoring
- **Metrics:** Grafana Faro tracks frontend performance, user interactions, and API response times
- **Alerts:** Sentry monitors errors, performance issues, and AI processing failures
- **Logging:** Structured logging throughout API middleware for debugging and analytics

---

## 🚨 Things to Be Careful About

### 🔒 Security Considerations
- **Authentication:** Simple password-based system (expandable to OAuth providers)
- **Data handling:** CV files contain sensitive personal information - ensure proper access controls
- **API Keys:** Gemini AI and Azure storage keys must be securely managed
- **RBAC:** Granular permissions system controls access to candidate data and admin functions

### 🤖 AI Integration Notes
- **Gemini API Limits:** Monitor usage and implement rate limiting for CV processing
- **Parsing Accuracy:** AI responses include self-correction mechanisms for improved data quality
- **Cost Management:** CV processing can be expensive - consider batch processing for large volumes

### 📊 Database Considerations
- **Vector Storage:** pgvector extension required for embedding functionality
- **Migration Management:** Use Drizzle Kit for schema changes to avoid data loss
- **Backup Strategy:** Critical candidate data requires regular backups and disaster recovery

*Updated at: 2025-01-27 UTC*