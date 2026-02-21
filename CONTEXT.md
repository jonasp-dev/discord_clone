# Discord Clone Backend - Context

This document tracks the current state and progress of the Discord clone backend implementation.

## Project Overview

The backend is a Node.js/Express application with Socket.io for real-time WebSocket communication. It provides REST APIs for CRUD operations and WebSocket events for real-time messaging, typing indicators, and presence updates.

## Current Status: Phase 1 ✅ COMPLETED

### Implemented Features

#### Core Infrastructure
- ✅ TypeScript configuration with strict mode
- ✅ Node.js + Express REST API
- ✅ Socket.io WebSocket gateway
- ✅ PostgreSQL database with Prisma ORM
- ✅ Redis for pub/sub and caching
- ✅ Pino logger for structured logging
- ✅ Environment variable validation with Zod

#### Authentication & Authorization
- ✅ JWT-based authentication (access + refresh tokens)
- ✅ User registration and login
- ✅ Password hashing with bcrypt
- ✅ Auth middleware for protected routes
- ✅ Socket.io authentication middleware

#### Data Models (Prisma Schema)
- ✅ User (email, username, password, avatar, status)
- ✅ Server (name, icon, owner, inviteCode)
- ✅ Channel (name, type: TEXT/VOICE)
- ✅ Membership (user-server relationship with roles: OWNER/ADMIN/MEMBER)
- ✅ Message (content, channel, user, timestamps)

#### REST API Endpoints

**Auth** (`/api/v1/auth`)
- POST `/register` - User registration
- POST `/login` - User login
- POST `/refresh` - Refresh access token

**Users** (`/api/v1/users`)
- GET `/me` - Get current user profile
- GET `/:userId` - Get user by ID
- GET `/username/:username` - Get user by username
- PATCH `/me` - Update user profile

**Servers** (`/api/v1/servers`)
- POST `/` - Create server (auto-creates 'general' channel)
- GET `/` - Get user's servers
- GET `/:serverId` - Get server details
- PATCH `/:serverId` - Update server
- DELETE `/:serverId` - Delete server
- POST `/join` - Join server via invite code
- POST `/:serverId/leave` - Leave server

**Channels** (`/api/v1/channels`)
- POST `/servers/:serverId/channels` - Create channel
- GET `/servers/:serverId/channels` - Get server channels
- GET `/:channelId` - Get channel details
- PATCH `/:channelId` - Update channel
- DELETE `/:channelId` - Delete channel

**Messages** (`/api/v1/messages`)
- POST `/:channelId` - Send message
- GET `/:channelId` - Get channel messages (paginated)
- GET `/message/:messageId` - Get message by ID
- DELETE `/:messageId` - Delete message

#### WebSocket Events

**Connection**
- `connection` - User connects (authenticated)
- `disconnect` - User disconnects

**Channel Management**
- `channel:join` - Join a channel room
- `channel:leave` - Leave a channel room
- `user:joined` - Broadcast when user joins channel
- `user:left` - Broadcast when user leaves channel

**Messaging**
- `message:send` - Send a message
- `message:new` - Broadcast new message to channel
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

**Presence**
- `presence:status` - Update user status
- `presence:update` - Broadcast status change

#### Middleware & Utilities
- ✅ Global error handling middleware
- ✅ Rate limiting (global, auth, messages)
- ✅ Request validation with Zod schemas
- ✅ Permission checking utilities
- ✅ Cursor-based pagination for messages
- ✅ HTTP exception classes

#### Real-Time Features
- ✅ WebSocket authentication
- ✅ Channel room management (join/leave)
- ✅ Real-time message broadcasting via Redis pub/sub
- ✅ Typing indicators
- ✅ User presence tracking (online/offline/idle/dnd)

## Tech Stack

- **Runtime:** Node.js (latest stable)
- **Framework:** Express.js
- **WebSocket:** Socket.io
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Cache/PubSub:** Redis
- **Auth:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Logging:** Pino
- **Language:** TypeScript (strict mode)

## Project Structure

```
/backend
  /src
    /config           # Environment & logger configuration
    /modules          # Feature modules (auth, users, servers, channels, messages)
    /realtime         # WebSocket gateway & event handlers
    /db               # Prisma client
    /redis            # Redis client & pub/sub
    /middleware       # Error handling, auth, rate limiting
    /utils            # Helpers, validators, permissions
    /types            # Shared TypeScript types
    app.ts            # Express app setup
    socket.ts         # Socket.io server setup
    server.ts         # Main entry point
  /prisma
    schema.prisma     # Database schema
```

## Next Steps: Phase 2 (Future)

### Planned Features
- [ ] Role-based permission system (custom roles)
- [ ] Direct messaging (DMs) between users
- [ ] Rich media support (file uploads, markdown)
- [ ] URL previews/unfurling
- [ ] Enhanced presence (Rich Presence)
- [ ] Message reactions
- [ ] User mentions and notifications
- [ ] Server member management
- [ ] Channel categories

## Development Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio
npm run prisma:studio
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Frontend URL for CORS

## Database Setup

1. Ensure PostgreSQL is running
2. Create a database: `createdb discord_clone`
3. Run migrations: `npm run prisma:migrate`
4. (Optional) Seed data if needed

## Redis Setup

1. Ensure Redis is running locally or configure REDIS_URL
2. Default: `redis://localhost:6379`

## Notes for Future Development

- All HTTP endpoints require JWT authentication (except auth endpoints)
- WebSocket connections require JWT token in handshake
- Messages are broadcast via Redis pub/sub for horizontal scaling
- Cursor-based pagination is used for message history
- Permission checks are centralized in `/utils/permissions.ts`
- All errors are handled by global error middleware
- Rate limiting is applied to prevent abuse
