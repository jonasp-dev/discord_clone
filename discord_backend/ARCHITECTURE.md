# Backend Architecture — Discord Clone (Phase 1)

This document defines the backend architecture for the Discord clone project, **Phase 1**.  
The backend is a **separate service** from the frontend, exposing:

- A **REST API** for CRUD and authentication.
- A **WebSocket (Socket.io)** gateway for real-time events (messages, typing, presence).

---

## Core Principles

- **Single Responsibility per Service:** Backend is responsible for business logic, persistence, auth, and real-time events. No rendering.
- **API-First:** All functionality is accessible via versioned HTTP APIs (`/api/v1/...`) and documented request/response types.
- **Real-Time Native:** WebSockets are a first-class citizen, not an afterthought.
- **Relational Consistency:** Use a relational database (PostgreSQL) for all core entities: Users, Servers, Channels, Memberships, Messages.
- **Stateless HTTP, Stateful WebSockets:** HTTP endpoints are stateless; WebSocket connections track session and room membership in memory/Redis.

---

## High-Level Components

1. **API Server (HTTP)**
   - Tech: Node.js + Express or NestJS
   - Responsibilities:
     - Auth (login, register, refresh tokens)
     - Servers & channels CRUD
     - Message history (pagination)
     - User profile management

2. **Real-Time Gateway (WebSocket)**
   - Tech: Socket.io (Node.js)
   - Responsibilities:
     - User connection & authentication
     - Channel joining/leaving
     - Real-time message broadcasting
     - Typing indicators & presence updates

3. **Database Layer**
   - Tech: PostgreSQL
   - ORM: Prisma or Drizzle
   - Responsibilities:
     - Strong data modeling and constraints
     - Migrations and schema evolution
     - Query abstraction with type safety

4. **Cache & Pub/Sub (Optional but Recommended)**
   - Tech: Redis
   - Responsibilities:
     - Pub/Sub for cross-instance event broadcasting
     - Session / presence caching (optional in Phase 1)
     - Rate limiting keys (optional)

5. **Auth & Security**
   - Tech: JWT (access + refresh) or opaque tokens in Redis
   - Responsibilities:
     - Issuing & validating tokens
     - Role & membership checks
     - Ensuring endpoint and event authorization

---

## Process Boundary and Deployment Model

For Phase 1, you can choose between:

- **Option A — Single Backend Process (Simple Start, Easy Dev)**
  - One Node.js application handling:
    - Express (REST)
    - Socket.io
    - DB and Redis connections
  - Good for early development and small scale.

- **Option B — API + WS Split (More Scalable)**
  - **API Service:** Express/NestJS app for REST only.
  - **Gateway Service:** Socket.io app that connects to the same DB & Redis for coordination.
  - Communication over **Redis Pub/Sub** or direct DB reads.

**Recommended for Phase 1:** Option A (single process), structured in a way that’s easy to split later.

---

## Backend Folder Structure

```text
/backend
  /src
    /config
      env.ts                 # Load & validate environment variables
      logger.ts              # Logger (pino/winston)
    /app.ts                  # Express/HTTP server bootstrap
    /socket.ts               # Socket.io server bootstrap
    /server.ts               # Entry point (starts HTTP + WebSocket)

    /modules                 # Feature modules
      /auth
        auth.controller.ts   # HTTP handlers (login, register, refresh)
        auth.service.ts      # Business logic
        auth.routes.ts       # Express router
        auth.types.ts        # DTOs & interfaces
        auth.middleware.ts   # JWT validation, user extraction
      /users
        users.controller.ts
        users.service.ts
        users.routes.ts
        users.types.ts
      /servers
        servers.controller.ts
        servers.service.ts
        servers.routes.ts
        servers.types.ts
      /channels
        channels.controller.ts
        channels.service.ts
        channels.routes.ts
        channels.types.ts
      /messages
        messages.controller.ts
        messages.service.ts
        messages.routes.ts
        messages.types.ts

    /realtime
      socket.events.ts       # Event registration (connection handler)
      socket.types.ts        # Payload types for socket events
      channel.gateway.ts     # Join/leave channel, room management
      message.gateway.ts     # new_message, typing, etc.
      presence.gateway.ts    # online/offline, optional in Phase 1

    /db
      prisma.ts              # Prisma client instance
      migrations/            # Prisma migrations (auto-generated)

    /redis
      redis.client.ts        # Redis client init (if used)
      pubsub.ts              # Helper for publishing/subscribing (optional)

    /middleware
      error.middleware.ts    # Global error handler
      auth.middleware.ts     # Attach user to request if token valid
      rate-limit.middleware.ts # Optional

    /utils
      http-exception.ts      # Error classes
      validators.ts          # Request validation helpers (zod/yup)
      pagination.ts          # Cursor-based pagination helpers
      permissions.ts         # Permission checks (e.g., canSendMessage)

    /types
      context.ts             # Shared types for request context
      api.ts                 # Generic ApiResponse<T> type

  prisma/
    schema.prisma            # Database models