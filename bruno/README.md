# Bruno API Collection

This directory contains a complete Bruno API collection for testing the Discord Clone backend API.

## Collection Structure

```
bruno/
├── collection.yaml          # Main collection configuration
├── Health Check.yaml        # Health check endpoint
├── Auth/
│   ├── Register.yaml        # POST /api/v1/auth/register
│   ├── Login.yaml           # POST /api/v1/auth/login
│   └── Refresh Token.yaml   # POST /api/v1/auth/refresh
├── Users/
│   ├── Get Current User.yaml    # GET /api/v1/users/me
│   ├── Get User by ID.yaml      # GET /api/v1/users/:userId
│   └── Update Profile.yaml      # PATCH /api/v1/users/me
├── Servers/
│   ├── Create Server.yaml       # POST /api/v1/servers
│   ├── Get User Servers.yaml    # GET /api/v1/servers
│   ├── Get Server by ID.yaml    # GET /api/v1/servers/:serverId
│   ├── Update Server.yaml       # PATCH /api/v1/servers/:serverId
│   ├── Join Server.yaml         # POST /api/v1/servers/join
│   ├── Leave Server.yaml        # POST /api/v1/servers/:serverId/leave
│   └── Delete Server.yaml       # DELETE /api/v1/servers/:serverId
├── Channels/
│   ├── Create Channel.yaml      # POST /api/v1/channels/servers/:serverId/channels
│   ├── Get Server Channels.yaml # GET /api/v1/channels/servers/:serverId/channels
│   ├── Get Channel by ID.yaml   # GET /api/v1/channels/:channelId
│   ├── Update Channel.yaml      # PATCH /api/v1/channels/:channelId
│   └── Delete Channel.yaml      # DELETE /api/v1/channels/:channelId
└── Messages/
    ├── Send Message.yaml        # POST /api/v1/messages/:channelId
    ├── Get Channel Messages.yaml # GET /api/v1/messages/:channelId
    └── Delete Message.yaml      # DELETE /api/v1/messages/:messageId
```

## How to Use

### 1. Open in Bruno

1. Download and install [Bruno](https://www.usebruno.com/)
2. Open Bruno and click "Open Collection"
3. Navigate to this `bruno/` directory and select it

### 2. Environment Variables

The collection uses environment variables that are automatically set during the test flow:

- `baseUrl` - API base URL (default: http://localhost:3000)
- `accessToken` - JWT access token (auto-set after login/register)
- `refreshToken` - JWT refresh token (auto-set after login/register)
- `userId` - Current user ID (auto-set after login)
- `serverId` - Created server ID (auto-set after creating a server)
- `channelId` - Created channel ID (auto-set after creating a channel)
- `messageId` - Created message ID (auto-set after sending a message)

### 3. Recommended Test Flow

Follow this sequence to test all features:

#### Step 1: Authentication
1. **Register** - Create a new user account
2. **Login** - Login with the created account (saves accessToken)
3. **Get Current User** - Verify authentication works

#### Step 2: Server Management
4. **Create Server** - Create a server (saves serverId, creates default "general" channel)
5. **Get User Servers** - List your servers
6. **Get Server by ID** - Get server details (saves channelId from default channel)

#### Step 3: Channel Management
7. **Create Channel** - Create a new channel in the server
8. **Get Server Channels** - List all channels in the server
9. **Update Channel** - Rename a channel

#### Step 4: Messaging
10. **Send Message** - Send a message to a channel (saves messageId)
11. **Get Channel Messages** - Retrieve message history
12. **Delete Message** - Delete a message

#### Step 5: Cleanup (Optional)
13. **Delete Channel** - Remove a channel
14. **Delete Server** - Remove the server

### 4. Test Scripts

Each request includes test scripts that:
- Verify HTTP status codes
- Validate response structure
- Automatically save response data to environment variables
- Enable chained requests

Example test output:
```
✓ Status code is 201
✓ Response has access token
```

### 5. Manual Testing

You can also run individual requests by:
1. Modifying the request body/parameters as needed
2. Ensure you have valid `accessToken` in environment variables
3. Click "Send" to execute the request

## Environment Setup

### Local Development
The default environment is already configured:
```yaml
baseUrl: http://localhost:3000
```

### Custom Environment
To create a custom environment:
1. Edit `collection.yaml`
2. Add a new environment:
```yaml
environments:
  - name: Production
    variables:
      baseUrl: https://api.yourdomain.com
```

## API Authentication

Most endpoints require authentication via Bearer token:
```
Authorization: Bearer {{accessToken}}
```

The token is automatically set after successful login/register.

## Pagination

The "Get Channel Messages" endpoint supports pagination:
- `limit` - Number of messages to retrieve (default: 50, max: 100)
- `cursor` - Timestamp cursor for pagination (ISO string)

Example response:
```json
{
  "success": true,
  "data": {
    "data": [...],
    "nextCursor": "2024-01-01T12:00:00.000Z",
    "hasMore": true
  }
}
```

## WebSocket Testing

For WebSocket testing, use a WebSocket client like:
- [Postman](https://www.postman.com/)
- [WebSocket King](https://websocketking.com/)
- Browser DevTools

WebSocket URL: `ws://localhost:3000`

Authentication:
```json
{
  "auth": {
    "token": "YOUR_ACCESS_TOKEN"
  }
}
```

## Troubleshooting

### 401 Unauthorized
- Your access token may have expired (default: 15 minutes)
- Run the "Refresh Token" request to get a new access token
- Or re-run "Login" to get fresh tokens

### 403 Forbidden
- You don't have permission to access the resource
- Ensure you're a member of the server/channel

### 404 Not Found
- The resource ID (serverId, channelId, messageId) may be invalid
- Check that environment variables are set correctly
- Re-run the creation requests to get valid IDs

### Variables Not Set
- Ensure you run requests in the recommended order
- Check the test scripts are passing
- Manually set variables in the environment if needed

## Tips

1. **Run in Sequence** - Follow the recommended test flow for best results
2. **Check Tests** - Green checkmarks indicate tests passed
3. **Save Responses** - Environment variables are automatically updated
4. **Multiple Users** - Create multiple environments for testing multi-user scenarios
5. **Invite Codes** - Copy the `inviteCode` from "Create Server" response to test "Join Server"

## Additional Resources

- [Backend README](../README.md) - Backend setup instructions
- [API Documentation](../CONTEXT.md) - Full API documentation
- [Bruno Documentation](https://docs.usebruno.com/) - Bruno usage guide
