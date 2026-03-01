#!/usr/bin/env bash
# =============================================================================
# Discord Clone — Deploy to EC2
# =============================================================================
# Usage: ./scripts/deploy.sh <elastic-ip> <path-to-ssh-key>
#
# Example:
#   ./scripts/deploy.sh 54.123.45.67 ~/.ssh/discord-key.pem
#
# Prerequisites:
#   - Frontend built: cd discord_frontend && npm run build
#   - .env.prod configured with real secrets
#   - EC2 instance provisioned via terraform apply
#   - SSH key has correct permissions: chmod 400 <key>.pem
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------
if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <elastic-ip> <path-to-ssh-key>"
  echo "Example: $0 54.123.45.67 ~/.ssh/discord-key.pem"
  exit 1
fi

HOST="$1"
SSH_KEY="$2"
REMOTE_USER="ec2-user"
REMOTE_DIR="/opt/discord-clone"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"

echo "============================================"
echo "  Discord Clone — Deploy to EC2"
echo "============================================"
echo "  Host:    $HOST"
echo "  Key:     $SSH_KEY"
echo "  Project: $PROJECT_ROOT"
echo "============================================"

# ---------------------------------------------------------------------------
# Step 1: Build frontend
# ---------------------------------------------------------------------------
echo ""
echo ">>> Step 1: Building frontend..."
cd "$PROJECT_ROOT/discord_frontend"

if ! command -v npm &> /dev/null; then
  echo "ERROR: npm is not installed"
  exit 1
fi

npm run build
echo "    Frontend built successfully."

# ---------------------------------------------------------------------------
# Step 2: Sync files to EC2
# ---------------------------------------------------------------------------
echo ""
echo ">>> Step 2: Syncing files to EC2..."

# Create remote directories
ssh $SSH_OPTS "$REMOTE_USER@$HOST" "mkdir -p $REMOTE_DIR/{nginx,scripts,frontend}"

# Sync backend source (for Docker build on the server)
echo "    Syncing backend..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude 'dist' \
  --exclude 'coverage' \
  --exclude '.git' \
  -e "ssh $SSH_OPTS" \
  "$PROJECT_ROOT/discord_backend/" \
  "$REMOTE_USER@$HOST:$REMOTE_DIR/backend/"

# Sync frontend build output
echo "    Syncing frontend build..."
rsync -avz --delete \
  -e "ssh $SSH_OPTS" \
  "$PROJECT_ROOT/discord_frontend/dist/" \
  "$REMOTE_USER@$HOST:$REMOTE_DIR/frontend/"

# Sync deploy scripts
echo "    Syncing scripts..."
rsync -avz \
  -e "ssh $SSH_OPTS" \
  "$PROJECT_ROOT/scripts/backup-db.sh" \
  "$REMOTE_USER@$HOST:$REMOTE_DIR/scripts/"

echo "    Files synced."

# ---------------------------------------------------------------------------
# Step 3: Build and start containers on EC2
# ---------------------------------------------------------------------------
echo ""
echo ">>> Step 3: Building and starting containers on EC2..."

ssh $SSH_OPTS "$REMOTE_USER@$HOST" << 'REMOTE_SCRIPT'
  set -euo pipefail
  cd /opt/discord-clone/backend

  # Update the docker-compose.prod.yml nginx volume to point to the synced frontend
  # The frontend is at /opt/discord-clone/frontend (absolute path on EC2)

  echo "  Pulling base images..."
  docker compose -f docker-compose.prod.yml pull postgres valkey nginx 2>/dev/null || true

  echo "  Building backend image..."
  docker compose -f docker-compose.prod.yml build backend

  echo "  Starting services..."
  docker compose -f docker-compose.prod.yml up -d

  echo "  Waiting for services to be healthy..."
  sleep 10

  echo ""
  echo "  Container status:"
  docker compose -f docker-compose.prod.yml ps

  echo ""
  echo "  Checking backend health..."
  for i in {1..12}; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
      echo "  ✓ Backend is healthy!"
      break
    fi
    if [[ $i -eq 12 ]]; then
      echo "  ✗ Backend health check failed after 60s"
      echo "  Checking logs:"
      docker compose -f docker-compose.prod.yml logs --tail=30 backend
      exit 1
    fi
    echo "  Waiting for backend... ($i/12)"
    sleep 5
  done

  # Make backup script executable
  chmod +x /opt/discord-clone/scripts/backup-db.sh
REMOTE_SCRIPT

# ---------------------------------------------------------------------------
# Step 4: Verify
# ---------------------------------------------------------------------------
echo ""
echo ">>> Step 4: Verifying deployment..."

echo "  Testing health endpoint..."
if curl -sf "http://$HOST/health" > /dev/null 2>&1; then
  echo "  ✓ Health check passed"
else
  echo "  ✗ Health check failed — Nginx may still be starting"
  echo "  Try: curl http://$HOST/health"
fi

echo "  Testing frontend..."
if curl -sf "http://$HOST/" > /dev/null 2>&1; then
  echo "  ✓ Frontend is serving"
else
  echo "  ✗ Frontend not serving — check Nginx logs"
fi

echo ""
echo "============================================"
echo "  Deployment complete!"
echo "============================================"
echo "  App URL:  http://$HOST"
echo "  SSH:      ssh $SSH_OPTS $REMOTE_USER@$HOST"
echo "  Logs:     ssh ... 'cd /opt/discord-clone/backend && docker compose -f docker-compose.prod.yml logs -f'"
echo "============================================"
