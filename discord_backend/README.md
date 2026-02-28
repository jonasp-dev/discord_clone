# Discord Clone Backend - Phase 1

A real-time communication backend built with Node.js, Express, Socket.io, PostgreSQL, and Redis.

## Features

### Phase 1 (Completed ✅)
- ✅ JWT-based authentication with access and refresh tokens
- ✅ User registration, login, and profile management
- ✅ Server creation and management with invite codes
- ✅ Text channel creation and organization
- ✅ Real-time messaging via WebSocket (Socket.io)
- ✅ Message history with cursor-based pagination
- ✅ Typing indicators
- ✅ User presence tracking (online/offline/idle/dnd)
- ✅ Permission-based access control
- ✅ Rate limiting and error handling
- ✅ Redis pub/sub for horizontal scaling

## Tech Stack

- **Runtime:** Node.js (latest stable)
- **Framework:** Express.js
- **WebSocket:** Socket.io
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Cache/PubSub:** Redis
- **Authentication:** JWT
- **Validation:** Zod
- **Logging:** Pino
- **Language:** TypeScript (strict mode)

## Prerequisites

### For Docker Setup (Recommended) 🐳
- Docker Desktop (includes Docker Compose)

### For Manual Setup
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- npm (v8 or higher)

## Getting Started

### Option 1: Docker Setup (Recommended) 🐳

The easiest way to run the entire stack locally:

**1. Start all services:**
```bash
docker-compose up
```

This will start:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- Backend API (port 3000)

**2. Access the application:**
- HTTP API: http://localhost:3000
- WebSocket: ws://localhost:3000
- Health Check: http://localhost:3000/health

**3. Useful Docker commands:**
```bash
# Run in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build
```

**Note:** The Docker setup automatically:
- Creates the database
- Runs migrations
- Hot-reloads on code changes in development mode

---

### Option 2: Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000

# PostgreSQL connection
DATABASE_URL=postgresql://username:password@localhost:5432/discord_clone

# Redis connection
REDIS_URL=redis://localhost:6379

# JWT secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS (your frontend URL)
CORS_ORIGIN=http://localhost:5173
```

### 3. Database Setup

Create the PostgreSQL database:

```bash
createdb discord_clone
```

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Redis

Make sure Redis is running:

```bash
# On Windows (if installed via Chocolatey or MSI)
redis-server

# On Linux/Mac
redis-server
```

### 5. Start the Server

Development mode (with hot reload):

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/:userId` - Get user by ID
- `GET /api/v1/users/username/:username` - Get user by username
- `PATCH /api/v1/users/me` - Update profile

### Servers
- `POST /api/v1/servers` - Create server
- `GET /api/v1/servers` - Get user's servers
- `GET /api/v1/servers/:serverId` - Get server details
- `PATCH /api/v1/servers/:serverId` - Update server
- `DELETE /api/v1/servers/:serverId` - Delete server
- `POST /api/v1/servers/join` - Join server via invite
- `POST /api/v1/servers/:serverId/leave` - Leave server

### Channels
- `POST /api/v1/channels/servers/:serverId/channels` - Create channel
- `GET /api/v1/channels/servers/:serverId/channels` - Get channels
- `GET /api/v1/channels/:channelId` - Get channel
- `PATCH /api/v1/channels/:channelId` - Update channel
- `DELETE /api/v1/channels/:channelId` - Delete channel

### Messages
- `POST /api/v1/messages/:channelId` - Send message
- `GET /api/v1/messages/:channelId` - Get messages (paginated)
- `DELETE /api/v1/messages/:messageId` - Delete message

## WebSocket Events

### Client → Server
- `channel:join` - Join a channel
- `channel:leave` - Leave a channel
- `message:send` - Send a message
- `typing:start` - Start typing
- `typing:stop` - Stop typing
- `presence:status` - Update status

### Server → Client
- `message:new` - New message in channel
- `user:joined` - User joined channel
- `user:left` - User left channel
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `presence:update` - User status changed

## WebSocket Authentication

Connect with JWT token in handshake:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Development Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Environment & logger configuration
│   ├── modules/         # Feature modules
│   │   ├── auth/        # Authentication
│   │   ├── users/       # User management
│   │   ├── servers/     # Server management
│   │   ├── channels/    # Channel management
│   │   └── messages/    # Message management
│   ├── realtime/        # WebSocket gateway
│   ├── db/              # Prisma client
│   ├── redis/           # Redis client & pub/sub
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utilities & helpers
│   ├── types/           # TypeScript types
│   ├── app.ts           # Express app setup
│   ├── socket.ts        # Socket.io setup
│   └── server.ts        # Main entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── package.json
├── tsconfig.json
└── .env.example
```

## Database Schema

- **User** - Authentication and profile
- **Server** - Community servers
- **Channel** - Text/voice channels
- **Membership** - User-server relationships with roles
- **Message** - Chat messages

## Authentication Flow

1. User registers/logs in → Receives access + refresh tokens
2. Access token (15min) used for API requests
3. Refresh token (7 days) used to get new access token
4. Tokens sent in Authorization header: `Bearer <token>`

## Scaling Considerations

- Redis pub/sub enables horizontal scaling of WebSocket servers
- Stateless HTTP endpoints can be load balanced
- PostgreSQL can be scaled with read replicas
- Messages use cursor-based pagination for performance

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Rate limiting on all endpoints
- CORS protection
- Request validation with Zod
- SQL injection protection via Prisma

## Next Steps (Phase 2)

- [ ] Custom roles and permissions
- [ ] Direct messaging (DMs)
- [ ] File uploads (images, attachments)
- [ ] Markdown support
- [ ] Message reactions
- [ ] User mentions
- [ ] Notifications
- [ ] Server categories

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env
- Check database exists: `psql -l`

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping`
- Verify REDIS_URL in .env

### Port Already in Use
- Change PORT in .env
- Or kill process using the port

### TypeScript Errors
- Regenerate Prisma client: `npm run prisma:generate`
- Clear and reinstall: `rm -rf node_modules && npm install`

## License

ISC
