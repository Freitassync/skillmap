# Database Management with Prisma

## Overview

This project uses **Prisma ORM** for all database operations. Database schema and migrations are managed through Prisma, not manual SQL files.

## Database Initialization

### Docker Compose Setup

The database is automatically created by Docker when the PostgreSQL container starts:

```yaml
postgres:
  environment:
    POSTGRES_USER: skillmap
    POSTGRES_PASSWORD: skillmap123
    POSTGRES_DB: skillmap  # Automatically created on first run
```

**Connection URL:**
```
postgresql://skillmap:skillmap123@localhost:5432/skillmap
```

### First-Time Setup

After starting Docker containers for the first time:

```bash
# Start containers
docker-compose up -d

# Run Prisma migrations
cd backend
DATABASE_URL="postgresql://skillmap:skillmap123@localhost:5432/skillmap" npx prisma migrate deploy

# Seed database with initial data
DATABASE_URL="postgresql://skillmap:skillmap123@localhost:5432/skillmap" npm run prisma:seed
```

## Prisma Commands

### Generate Prisma Client

After changing the schema, regenerate the client:

```bash
npx prisma generate
```

### Create a New Migration

When you modify `prisma/schema.prisma`:

```bash
DATABASE_URL="postgresql://skillmap:skillmap123@localhost:5432/skillmap" npx prisma migrate dev --name description_of_change
```

### Apply Migrations (Production)

```bash
DATABASE_URL="$PRODUCTION_URL" npx prisma migrate deploy
```

### Reset Database (Development Only)

**WARNING: This drops all data!**

```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes reset database" \
DATABASE_URL="postgresql://skillmap:skillmap123@localhost:5432/skillmap" \
npx prisma migrate reset --force
```

### Seed Database

Populate with initial data (60 skills):

```bash
DATABASE_URL="postgresql://skillmap:skillmap123@localhost:5432/skillmap" npm run prisma:seed
```

### Open Prisma Studio

Visual database browser:

```bash
DATABASE_URL="postgresql://skillmap:skillmap123@localhost:5432/skillmap" npx prisma studio
```

## Common Issues

### Issue: "database does not exist"

**Cause:** PostgreSQL container started but database not created, or volume has old data.

**Solution 1 - Clear volumes (development):**
```bash
docker-compose down -v  # Remove volumes
docker-compose up -d    # Restart with fresh database
cd backend
DATABASE_URL="postgresql://skillmap:skillmap123@localhost:5432/skillmap" npx prisma migrate deploy
DATABASE_URL="postgresql://skillmap:skillmap123@localhost:5432/skillmap" npm run prisma:seed
```

**Solution 2 - Manual database creation:**
```bash
docker exec -it skillmap-postgres psql -U skillmap -c "CREATE DATABASE skillmap;"
```

### Issue: "type does not exist" or Schema Errors

**Cause:** Old SQL migrations mixed with Prisma schema.

**Solution:** Reset database with Prisma:
```bash
cd backend
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes reset" \
DATABASE_URL="postgresql://skillmap:skillmap123@localhost:5432/skillmap" \
npx prisma migrate reset --force
```

### Issue: Prisma Client not generated

**Solution:**
```bash
npx prisma generate
```

## Database Schema

Current schema includes:

- **users** - User accounts with XP system
- **skills** - Hard and soft skills catalog (60 seeded)
- **roadmaps** - User career roadmaps
- **roadmap_skills** - Skills in each roadmap (junction table)
- **chat_messages** - AI chatbot conversation history
- **skill_resources** - Learning resources for skills
- **activity_log** - User activity tracking

## Migration Files

Migrations are stored in `prisma/migrations/` and tracked by Prisma:

```
prisma/migrations/
  └─ 20251117182558_init/
    └─ migration.sql
```

**DO NOT** manually edit migration SQL files. Always use `prisma migrate dev` to create new migrations.

## Environment Variables

Required in `.env`:

```env
DATABASE_URL=postgresql://skillmap:skillmap123@localhost:5432/skillmap
```

For Docker containers, this is set in `docker-compose.yml`.

## Backup & Restore

### Backup

```bash
docker exec skillmap-postgres pg_dump -U skillmap skillmap > backup.sql
```

### Restore

```bash
cat backup.sql | docker exec -i skillmap-postgres psql -U skillmap skillmap
```

## Production Considerations

1. **Use strong passwords** - Change `skillmap123` to a secure password
2. **Connection pooling** - Prisma uses connection pooling by default (max 20 connections)
3. **Migrations** - Use `prisma migrate deploy` (not `migrate dev`) in production
4. **Backups** - Set up automated backups for production database
5. **Environment** - Store DATABASE_URL in secure secrets management

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
