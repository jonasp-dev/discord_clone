# Docker Quick Start Guide

## Prerequisites
- Docker Desktop installed and running

## Start the Application

```bash
# From the backend directory
docker-compose up
```

This single command will:
1. ✅ Start PostgreSQL database (port 5432)
2. ✅ Start Redis cache (port 6379)
3. ✅ Build and start the backend API (port 3000)
4. ✅ Automatically run database migrations
5. ✅ Enable hot-reload for development

## Access the Application

- **HTTP API:** http://localhost:3000
- **WebSocket:** ws://localhost:3000
- **Health Check:** http://localhost:3000/health

## Test the API

### Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

You'll receive an `accessToken` - use it for authenticated requests:

### Create a Server
```bash
curl -X POST http://localhost:3000/api/v1/servers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "My First Server"
  }'
```

## Docker Commands

```bash
# Start in background (detached mode)
docker-compose up -d

# View logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d discord_clone

# Access Redis CLI
docker-compose exec redis redis-cli
```

## Troubleshooting

### Port Already in Use
If you see "port is already allocated" error:
- Stop other services using ports 3000, 5432, or 6379
- Or modify ports in `docker-compose.yml`

### Database Connection Issues
```bash
# Check if PostgreSQL is healthy
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres
```

### Redis Connection Issues
```bash
# Test Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Backend Not Starting
```bash
# Check backend logs
docker-compose logs backend

# Restart backend service
docker-compose restart backend
```

## Development Workflow

1. **Start services:** `docker-compose up -d`
2. **Make code changes** - changes auto-reload
3. **View logs:** `docker-compose logs -f backend`
4. **Test API** using curl, Postman, or your frontend
5. **Stop when done:** `docker-compose down`

## Environment Variables

Default development values are set in `docker-compose.yml`:
- Database: `postgresql://postgres:postgres@postgres:5432/discord_clone`
- Redis: `redis://redis:6379`
- JWT secrets: Development defaults (change for production!)

For custom configuration, create a `.env` file and modify `docker-compose.yml` to use it.

## Next Steps

- Use Postman or Thunder Client to test all API endpoints
- Connect a WebSocket client to test real-time features
- Build a frontend that connects to the API
- Review logs to understand the application flow

## Production Deployment

For production, build the production image:

```bash
docker build --target production -t discord-backend:prod .
```

Then deploy with proper environment variables and orchestration (Kubernetes, ECS, etc.)
