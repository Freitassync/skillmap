# SkillMap Backend API

Node.js/Express REST API with PostgreSQL database for the SkillMap 4.0 mobile application.

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Containerization**: Docker + Docker Compose

## Features

- ✅ JWT-based authentication
- ✅ RESTful API endpoints
- ✅ PostgreSQL database with triggers and views
- ✅ OpenAI gpt-4.1-mini integration with web search
- ✅ CORS-enabled for mobile app
- ✅ Docker containerization
- ✅ TypeScript for type safety
- ✅ 123 pre-seeded skills database

## Quick Start with Docker

### Prerequisites

- Docker Desktop installed
- Docker Compose installed

### 1. Setup Environment Variables

Copy the example .env file and configure:

```bash
cp .env.example .env
```

Edit `.env` and set your values (especially `OPENAI_API_KEY` if you want ChatBot features):

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://skillmap:skillmap123@postgres:5432/skillmap
JWT_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=sk-proj-your-api-key-here
CORS_ORIGINS=http://localhost:8081,http://localhost:19000
```

### 2. Start Services

Start PostgreSQL + Backend API with one command:

```bash
npm run docker:up
```

This will:
- Pull PostgreSQL 16 image
- Create database volume
- Run migrations (create tables, triggers, views)
- Seed 123 skills into database
- Build and start the backend API
- Expose backend on `http://localhost:3000`
- Expose PostgreSQL on `localhost:5432`

### 3. Verify Services

Check health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-11-17T15:00:00.000Z",
  "environment": "development"
}
```

View logs:

```bash
npm run docker:logs
```

### 4. Stop Services

```bash
npm run docker:down
```

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (returns JWT token)
- `GET /api/auth/verify` - Verify JWT token (protected)
- `PUT /api/auth/xp` - Update user XP (protected)

### Roadmaps (`/api/roadmaps`)

- `POST /api/roadmaps` - Create roadmap with skills (protected)
- `GET /api/roadmaps/user/:userId` - Get all user roadmaps (protected)
- `GET /api/roadmaps/:id` - Get single roadmap (protected)
- `PUT /api/roadmaps/:id/skills/:skillId` - Mark skill as completed (protected)
- `DELETE /api/roadmaps/:id` - Delete roadmap (protected)

### Skills (`/api/skills`)

- `GET /api/skills` - Get all skills
- `GET /api/skills/:id` - Get single skill
- `GET /api/skills/:id/resources` - Get resources for skill

### Chat (`/api/chat`)

- `POST /api/chat/send` - Send message to AI chatbot (protected)
- `GET /api/chat/history/:userId` - Get chat history (protected)
- `DELETE /api/chat/history/:userId` - Clear chat history (protected)

**Protected routes** require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Development (Without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ installed locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

Create PostgreSQL database:

```bash
psql -U postgres
CREATE DATABASE skillmap;
CREATE USER skillmap WITH PASSWORD 'skillmap123';
GRANT ALL PRIVILEGES ON DATABASE skillmap TO skillmap;
\q
```

Run migrations:

```bash
psql -U skillmap -d skillmap -f db/migrations/001_initial_schema.sql
psql -U skillmap -d skillmap -f db/002_seed_skills.sql
```

### 3. Configure Environment

Update `.env` with your local database URL:

```env
DATABASE_URL=postgresql://skillmap:skillmap123@localhost:5432/skillmap
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000` with hot reload.

## Database Schema

### Tables

- `users` - User accounts
- `roadmaps` - Learning roadmaps
- `skills` - Skill definitions (123 pre-seeded)
- `roadmap_skills` - Junction table for roadmap-skill relationships
- `chat_messages` - Chat conversation history
- `skill_resources` - Learning resources per skill
- `activity_log` - User activity tracking

### Triggers (Automatic Processes)

1. **auto_update_roadmap_progress** - Updates roadmap completion percentage when skills are completed
2. **auto_award_xp_skill** - Awards 50 XP when a skill is completed
3. **log_skill_completion** - Logs skill completion to activity_log
4. **check_roadmap_completion** - Awards 500 XP bonus when roadmap reaches 100%

### Views

- `user_performance_metrics` - Aggregated user statistics (roadmaps, skills, XP, etc.)

## Project Structure

```
backend/
├── db/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    # Database schema
│   │   └── 002_seed_skills.sql       # 123 skills
│   └── ...
├── src/
│   ├── config/
│   │   └── database.ts               # PostgreSQL connection
│   ├── controllers/
│   │   ├── auth.controller.ts        # Auth logic
│   │   ├── roadmap.controller.ts     # Roadmap logic
│   │   ├── skill.controller.ts       # Skill logic
│   │   └── chat.controller.ts        # ChatBot logic
│   ├── middleware/
│   │   └── auth.middleware.ts        # JWT verification
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── roadmap.routes.ts
│   │   ├── skill.routes.ts
│   │   └── chat.routes.ts
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   └── index.ts                      # Express server
├── Dockerfile                         # Docker image config
├── docker-compose.yml                 # Multi-container setup
├── package.json
├── tsconfig.json
└── .env                               # Environment variables
```

## Deployment

### Railway (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Add PostgreSQL database:
```bash
railway add postgresql
```

4. Set environment variables:
```bash
railway variables set JWT_SECRET=your-production-secret
railway variables set OPENAI_API_KEY=sk-proj-...
railway variables set CORS_ORIGINS=https://yourapp.com
```

5. Deploy:
```bash
railway up
```

### Render / Fly.io

Similar process:
1. Connect GitHub repository
2. Add PostgreSQL database
3. Set environment variables
4. Deploy from Docker or buildpack

## Troubleshooting

### Port Already in Use

If port 3000 or 5432 is already in use:

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in .env
```

### Database Connection Failed

```bash
# Check if PostgreSQL container is running
docker ps

# Restart containers
npm run docker:down
npm run docker:up
```

### Migration Errors

If migrations fail, reset database:

```bash
docker-compose down -v  # Remove volumes
npm run docker:up       # Recreate from scratch
```

## License

MIT
