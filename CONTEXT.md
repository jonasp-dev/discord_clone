# Discord Clone Backend - Context

This document tracks the current state and progress of the Discord clone backend implementation.

## Project Overview

The backend is a Node.js/Express application with Socket.io for real-time WebSocket communication. It provides REST APIs for CRUD operations and WebSocket events for real-time messaging, typing indicators, and presence updates.

## Current Status: Phase 1 ✅ COMPLETED + Phase 2 (DMs) ✅ IN PROGRESS

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
- ✅ Socket.io authentication middleware (JWT-verified)
- ✅ Logout with Redis-backed refresh token revocation

#### Data Models (Prisma Schema)
- ✅ User (email, username, password, avatar, status)
- ✅ Server (name, icon, owner, inviteCode)
- ✅ Channel (name, type: TEXT/VOICE)
- ✅ Membership (user-server relationship with roles: OWNER/ADMIN/MEMBER)
- ✅ Message (content, channel, user, timestamps)
- ✅ Conversation (DM conversations, 1:1)
- ✅ ConversationParticipant (user-conversation relationship)
- ✅ DirectMessage (DM content, sender, conversation)

#### REST API Endpoints

**Auth** (`/api/v1/auth`)
- POST `/register` - User registration
- POST `/login` - User login
- POST `/refresh` - Refresh access token
- POST `/logout` - Logout (revokes refresh token in Redis)

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
- GET `/:channelId` - Get channel messages (cursor-based pagination by ID)
- GET `/message/:messageId` - Get message by ID
- DELETE `/:messageId` - Delete message (author or ADMIN/OWNER)

**Direct Messages** (`/api/v1/dms`)
- POST `/` - Create or get a 1:1 conversation
- GET `/` - Get user's conversations (with last message preview)
- GET `/:conversationId` - Get conversation details
- GET `/:conversationId/messages` - Get DM messages (cursor-based pagination)
- POST `/:conversationId/messages` - Send a direct message
- DELETE `/messages/:messageId` - Delete a direct message (sender only)

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

**Direct Messaging**
- `dm:send` - Send a direct message (via WebSocket)
- `dm:new` - Broadcast new DM to participants
- `dm:typing:start` - User started typing in DM
- `dm:typing:stop` - User stopped typing in DM

**Presence**
- `presence:status` - Update user status
- `presence:update` - Broadcast status change

#### Middleware & Utilities
- ✅ Global error handling middleware
- ✅ Rate limiting (global, auth, messages)
- ✅ Request validation with Zod schemas
- ✅ Permission checking utilities (canAccessServer, canManageServer, requireMessageDeletion)
- ✅ Cursor-based pagination for messages (ID-based cursors)
- ✅ HTTP exception classes

#### Real-Time Features
- ✅ WebSocket authentication (JWT-verified)
- ✅ Channel room management (join/leave) with server membership verification
- ✅ Real-time message broadcasting via Redis pub/sub (single subscriber connection)
- ✅ Typing indicators (channels and DMs)
- ✅ User presence tracking via Redis (cross-instance compatible)
- ✅ DM delivery via per-user socket rooms (`user:{userId}`)

#### Testing
- ✅ Vitest test framework with v8 coverage
- ✅ Unit tests: auth service (6 tests)
- ✅ Unit tests: messages service (9 tests)
- ✅ Unit tests: DMs service (10 tests)
- ✅ Unit tests: permissions utilities (15 tests)
- ✅ 40 total tests passing

## Tech Stack

- **Runtime:** Node.js (latest stable)
- **Framework:** Express.js
- **WebSocket:** Socket.io
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Cache/PubSub:** ValKey 8 (Redis-compatible)
- **Auth:** JWT (jsonwebtoken) with Redis-backed token revocation
- **Validation:** Zod
- **Logging:** Pino
- **Language:** TypeScript (strict mode)
- **Testing:** Vitest + supertest

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

## Phase 1 Hardening (Completed)

The following security and reliability fixes were applied to the Phase 1 codebase:

- **WebSocket channel auth** — `channel:join` now verifies server membership before granting room access
- **WebSocket message auth** — `message:send` checks `canSendMessage` permission before creating
- **Message deletion permissions** — ADMIN/OWNER can delete any message in their server; regular members can only delete their own
- **Rate limiter on messages** — Dedicated `messageRateLimiter` applied to `/api/v1/messages` route
- **Redis-backed presence** — Replaced in-memory presence tracking with Redis sets/hashes; cross-instance compatible
- **Pub/sub subscriber reuse** — Single dedicated subscriber connection instead of one per subscription
- **ID-based cursor pagination** — Messages use Prisma cursor (by ID) instead of timestamp-based pagination
- **Logout / token revocation** — `POST /auth/logout` revokes refresh tokens in Redis; `refreshToken()` validates token exists before reissuing
- **ValKey 8** — Docker Compose updated from Redis 7 to ValKey 8

## Next Steps: Phase 2 (Future)

### Planned Features
- [x] Direct messaging (DMs) between users
- [ ] Role-based permission system (custom roles)
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

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
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

## Redis / ValKey Setup

1. Ensure ValKey 8 (or Redis) is running locally or configure REDIS_URL
2. Default: `redis://localhost:6379`
3. Docker Compose starts ValKey 8 automatically

## Notes for Future Development

- All HTTP endpoints require JWT authentication (except auth endpoints)
- WebSocket connections require JWT token in handshake
- Messages are broadcast via Redis pub/sub for horizontal scaling
- Cursor-based pagination is used for message history
- Permission checks are centralized in `/utils/permissions.ts`
- All errors are handled by global error middleware
- Rate limiting is applied to prevent abuse
