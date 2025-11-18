# SkillMap Backend Architecture Summary

## Overview

The SkillMap backend is a production-ready Node.js/Express API with TypeScript, Prisma ORM, PostgreSQL, and Pino logging, containerized with Docker.

## Technology Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma 6.19
- **Logger**: Pino (with pino-pretty for development)
- **Authentication**: JWT with bcrypt
- **Container**: Docker with multi-stage builds

## Architecture Decisions

### 1. Prisma ORM over Raw SQL

**Benefit**: Type-safe database access, automated migrations, and better developer experience.

**Migration Path**:
- Converted all 4 controllers from raw SQL `query()` to Prisma Client
- Schema defined in `prisma/schema.prisma`
- Migrations tracked in `prisma/migrations/`

**Usage**:
```typescript
// OLD: Raw SQL
const result = await query('SELECT * FROM users WHERE email = $1', [email]);
const user = result.rows[0];

// NEW: Prisma (type-safe, autocomplete)
const user = await prisma.user.findUnique({ where: { email } });
```

### 2. Pino Logger over console.log

**Benefit**: Asynchronous logging prevents event loop blocking, ~100x faster, lower memory overhead.

**Changes**:
- Replaced ALL `console.log/error/warn` with Pino across 9 files
- Removed ALL emojis for professional production logs
- Structured JSON logging for analysis

**Usage**:
```typescript
// OLD: Blocking console.log
console.log('User logged in:', userId);

// NEW: Async Pino with structured data
logger.info({ userId }, 'User logged in');
```

### 3. Docker Database Management

**Solution**: PostgreSQL creates the database automatically on first run via `POSTGRES_DB` environment variable.

**Configuration**:
```yaml
postgres:
  environment:
    POSTGRES_USER: skillmap
    POSTGRES_PASSWORD: skillmap123
    POSTGRES_DB: skillmap  # Auto-created
```

**No manual database creation needed** - Docker handles initialization.

**After first run**, Prisma manages all schema changes:
```bash
npx prisma migrate deploy  # Apply migrations
npm run prisma:seed        # Seed initial data (60 skills)
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/       # Route handlers (Prisma-based)
│   │   ├── auth.controller.ts
│   │   ├── skill.controller.ts
│   │   ├── roadmap.controller.ts
│   │   └── chat.controller.ts
│   ├── middleware/        # Auth, error handling
│   ├── routes/            # Express routes
│   ├── lib/
│   │   ├── prisma.ts      # Prisma client singleton
│   │   └── logger.ts      # Pino logger config
│   ├── config/
│   │   ├── database.ts    # Legacy pool (for old code)
│   │   └── migrations.ts  # Legacy migrations
│   └── index.ts           # Express app entry
├── prisma/
│   ├── schema.prisma      # Database schema (source of truth)
│   ├── migrations/        # Migration history
│   └── seed.ts            # Database seeding
├── docs/
│   ├── MEMORY_MANAGEMENT.md      # Pino logger guide
│   ├── DATABASE_MANAGEMENT.md    # Prisma/Docker guide
│   └── ARCHITECTURE_SUMMARY.md   # This file
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Service orchestration
└── package.json
```

## Database Schema

**7 Tables managed by Prisma**:

1. **users** - User accounts (auth + XP system)
2. **skills** - Skills catalog (60 seeded: hard/soft)
3. **roadmaps** - User career roadmaps
4. **roadmap_skills** - Junction table (many-to-many)
5. **chat_messages** - AI chatbot history
6. **skill_resources** - Learning resources
7. **activity_log** - User activity tracking

**4 Enums**:
- SkillType: `hard | soft`
- ChatRole: `user | assistant | system`
- ResourceType: `course | article | exercise | podcast | video`
- ResourceLevel: `beginner | intermediate | advanced`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login with JWT
- `GET /api/auth/verify` - Verify session
- `PUT /api/auth/xp` - Update user XP

### Skills
- `GET /api/skills` - List all skills
- `GET /api/skills/:id` - Get skill details
- `GET /api/skills/:id/resources` - Get learning resources

### Roadmaps
- `POST /api/roadmaps` - Create roadmap
- `GET /api/roadmaps/:userId` - Get user roadmaps
- `GET /api/roadmaps/:id` - Get specific roadmap
- `PUT /api/roadmaps/:id/skills/:skillId` - Toggle skill completion
- `DELETE /api/roadmaps/:id` - Delete roadmap

### Chat
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history/:userId` - Get chat history
- `DELETE /api/chat/history/:userId` - Clear history

## Environment Variables

**Required in `.env`**:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://skillmap:skillmap123@localhost:5432/skillmap

# Auth
JWT_SECRET=your-secret-here

# Optional
OPENAI_API_KEY=sk-proj-...
LOG_LEVEL=info
```

## Docker Commands

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Restart backend only
docker-compose restart backend

# Rebuild after code changes
docker-compose build backend
docker-compose up -d backend

# Stop all services
docker-compose down

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Prisma Operations

```bash
# Inside backend directory

# Generate client (after schema changes)
npx prisma generate

# Create migration
DATABASE_URL="..." npx prisma migrate dev --name migration_name

# Apply migrations (production)
DATABASE_URL="..." npx prisma migrate deploy

# Seed database
DATABASE_URL="..." npm run prisma:seed

# Open Prisma Studio (visual DB browser)
DATABASE_URL="..." npx prisma studio

# Reset database (dev only)
DATABASE_URL="..." npx prisma migrate reset --force
```

## Performance Optimizations

### Pino Logger
- Asynchronous writes (non-blocking)
- Buffer reuse (low GC pressure)
- ~100x faster than console.log
- Minimal memory allocation

### Prisma ORM
- Connection pooling (max 20 connections)
- Prepared statements (query optimization)
- Type-safe queries (no runtime overhead)
- Efficient serialization

### Docker
- Multi-stage builds (small images)
- Alpine base (~50MB vs ~900MB)
- Layer caching (fast rebuilds)
- Health checks (reliable startup)

## Security Features

1. **JWT Authentication** - 7-day expiration, secure secret
2. **Password Hashing** - bcrypt with 10 salt rounds
3. **SQL Injection Protection** - Prisma parameterized queries
4. **CORS Configuration** - Whitelist-based origins
5. **Environment Secrets** - .env file (git-ignored)

## Monitoring & Debugging

### Pino Logs (Development)
```
[2025-11-17 19:26:21.408 +0000] INFO: Incoming request
    method: "POST"
    path: "/api/auth/register"
```

### Pino Logs (Production - JSON)
```json
{"level":30,"time":1699564800000,"msg":"Incoming request","method":"POST","path":"/api/auth/register"}
```

### Prisma Query Logging
Enable in development:
```typescript
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});
```

### Health Check
```bash
curl http://localhost:3000/health
# {"success":true,"status":"healthy","timestamp":"...","environment":"development"}
```

## Testing

Currently manual testing via curl/Postman. Example:

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","senha":"password123"}'

# Response: JWT token + user object
```

## Migration Summary

### Completed
✅ Prisma ORM integration (all controllers)
✅ Pino logger (all files, no emojis)
✅ Docker database auto-initialization
✅ Multi-stage Docker builds
✅ Comprehensive documentation
✅ Type-safe database access
✅ Production-ready logging

### Files Changed
- 4 controllers migrated to Prisma
- 3 config files updated with Pino
- 1 main index.ts updated
- 1 Dockerfile updated (Prisma generation)
- 1 docker-compose.yml cleaned up
- 3 documentation files created

## Next Steps (Optional)

1. **Testing**: Add Jest unit/integration tests
2. **Validation**: Add Zod schema validation
3. **Rate Limiting**: Add express-rate-limit
4. **Error Tracking**: Add Sentry integration
5. **API Docs**: Add Swagger/OpenAPI
6. **CI/CD**: Add GitHub Actions pipeline

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Pino Documentation](https://getpino.io/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
