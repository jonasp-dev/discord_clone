# Discord Clone — AWS Deployment Guide

This guide covers deploying the Discord clone to AWS using EC2 + Docker Compose.

## Table of Contents

- [Architecture](#architecture)
- [Cost Breakdown](#cost-breakdown)
- [Prerequisites](#prerequisites)
- [Initial Deployment](#initial-deployment)
- [Updating & Redeploying](#updating--redeploying)
- [Accessing the Server](#accessing-the-server)
- [Database Access](#database-access)
- [Monitoring & Logs](#monitoring--logs)
- [Backup & Restore](#backup--restore)
- [Teardown](#teardown)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)

---

## Architecture

```
EC2 Instance (t4g.small, 2 vCPU, 2 GB RAM)
├── Nginx :80
│   ├── / → serves React SPA (static files)
│   ├── /api/* → proxy to backend:3000
│   └── /socket.io/* → proxy to backend:3000 (WebSocket)
├── Backend Container :3000 (Node.js + Express + Socket.IO)
├── PostgreSQL Container :5432 (internal only)
└── Valkey Container :6379 (internal only)

S3 Bucket: Daily database backups (automated via cron)
Elastic IP: Static public IP address
```

**Deployment Model**: Single EC2 instance running docker-compose with 4 containers.

**Files on EC2**:
- `/opt/discord-clone/backend/` — backend source code + Dockerfile
- `/opt/discord-clone/frontend/` — compiled React build
- `/opt/discord-clone/scripts/` — backup script

---

## Cost Breakdown

### Monthly Costs (us-east-1)

| Service | Configuration | Cost |
|---|---|---|
| EC2 | t4g.small (730 hrs) | $12.26 |
| EBS | 30 GB gp3 | $2.40 |
| Elastic IP | 1 attached | $3.65 |
| S3 | ~1 GB backups | $0.02 |
| Data Transfer | ~5 GB outbound | $0.45 |
| **Total** | | **~$18.78/month** |

### With Free Tier (New Account, 12 Months)

- 750 hours/month EC2 t4g.micro (use instead of t4g.small)
- 30 GB EBS
- 100 GB data transfer
- **Estimated cost: ~$11/month** (mainly Elastic IP)

### Cost Optimization Tips

1. **Use t4g.micro** instead of t4g.small if traffic is low — saves ~$6/month
2. **Stop the instance** when not in use (charges paused except EBS + Elastic IP)
3. **Release Elastic IP** when stopped to avoid $3.65/month charge
4. Set **S3 lifecycle policy** to 7 days instead of 30 (already configured)

---

## Prerequisites

### Local Machine Requirements

```bash
# Verify tools are installed
terraform --version   # 1.5+
aws --version         # AWS CLI v2
docker --version
node --version        # 18+
npm --version
```

### AWS Account Setup

1. **Create AWS account** if you don't have one
2. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter Access Key ID
   # Enter Secret Access Key
   # Region: us-east-1
   # Output: json
   ```
3. **Create access keys** (if needed):
   - AWS Console → IAM → Users → Your User → Security credentials → Create access key

---

## Initial Deployment

### Step 1: Create EC2 Key Pair

```bash
aws ec2 create-key-pair \
  --key-name discord-clone \
  --key-type rsa \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/discord-clone.pem

chmod 400 ~/.ssh/discord-clone.pem
```

### Step 2: Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
region           = "us-east-1"
environment      = "production"
instance_type    = "t4g.small"          # or "t4g.micro" for free tier
key_pair_name    = "discord-clone"
allowed_ssh_cidr = "YOUR_IP/32"         # Get your IP: curl ifconfig.me
volume_size      = 30
```

> **Security**: Replace `0.0.0.0/0` with your actual IP to restrict SSH access.

### Step 3: Provision Infrastructure

```bash
cd terraform

terraform init
terraform plan
terraform apply
```

Type `yes` when prompted.

**Note the outputs**:
```
public_ip = "X.X.X.X"
app_url = "http://X.X.X.X"
ssh_command = "ssh -i ~/.ssh/discord-clone.pem ec2-user@X.X.X.X"
```

### Step 4: Wait for EC2 Initialization (~2-3 minutes)

The instance installs Docker on first boot. Verify it's ready:

```bash
ssh -i ~/.ssh/discord-clone.pem ec2-user@<elastic-ip>

# Check if Docker is running
docker --version
docker compose version

# Exit when confirmed
exit
```

If Docker is not installed yet, wait and check again. Monitor progress:
```bash
sudo tail -f /var/log/cloud-init-output.log
```

### Step 5: Install Missing Dependencies on EC2

```bash
ssh -i ~/.ssh/discord-clone.pem ec2-user@<elastic-ip>

# Install rsync (required by deploy script)
sudo dnf install -y rsync

# Install cronie (for automated backups)
sudo dnf install -y cronie
sudo systemctl enable crond
sudo systemctl start crond

# Set up backup cron job
sudo bash -c 'cat > /etc/cron.d/discord-backup << EOF
0 3 * * * root /opt/discord-clone/scripts/backup-db.sh >> /var/log/discord-backup.log 2>&1
EOF'
sudo chmod 644 /etc/cron.d/discord-backup

exit
```

### Step 6: Configure Production Environment

```bash
cd discord_backend
```

Edit `.env.prod` with real values:

```bash
# Generate secrets
echo "POSTGRES_PASSWORD: $(openssl rand -base64 32)"
echo "JWT_SECRET: $(openssl rand -base64 48)"
echo "JWT_REFRESH_SECRET: $(openssl rand -base64 48)"
```

Update `.env.prod`:

```env
POSTGRES_USER=discord
POSTGRES_PASSWORD=<paste-generated-password>
POSTGRES_DB=discord_clone

NODE_ENV=production
PORT=3000

DATABASE_URL=postgresql://discord:<same-password>@postgres:5432/discord_clone
REDIS_URL=redis://valkey:6379

JWT_SECRET=<paste-generated-secret>
JWT_REFRESH_SECRET=<paste-generated-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://<elastic-ip>
FRONTEND_DIST_PATH=/opt/discord-clone/frontend
```

### Step 7: Install Frontend Dependencies

```bash
cd discord_frontend
npm install
cd ..
```

### Step 8: Deploy

```bash
./scripts/deploy.sh <elastic-ip> ~/.ssh/discord-clone.pem
```

This takes **3-5 minutes** on first run (building Docker images).

### Step 9: Verify

```bash
# Health check
curl http://<elastic-ip>/health

# Open in browser
open http://<elastic-ip>
```

You should see the Discord clone login/register page.

### Step 10: Test Full Flow

1. **Register** a new user
2. **Login** with credentials
3. **Create a server**
4. **Create a channel**
5. **Send a message**
6. Open **second browser/incognito**, register second user, join server
7. Verify **real-time messaging** works between both users

---

## Updating & Redeploying

### For Any Code Changes (Backend or Frontend)

```bash
./scripts/deploy.sh <elastic-ip> ~/.ssh/discord-clone.pem
```

The deploy script automatically:
- Builds the frontend (`npm run build`)
- Syncs all changes to EC2
- Rebuilds backend Docker image
- Restarts containers

**Downtime**: ~10-30 seconds while containers restart.

### For Database Schema Changes

Schema changes via Prisma migrations are **automatic**. The Dockerfile runs `prisma migrate deploy` on container startup.

After adding a migration locally:

```bash
# Generate migration
npm run prisma:migrate:dev

# Deploy
./scripts/deploy.sh <elastic-ip> ~/.ssh/discord-clone.pem
```

### For Environment Variable Changes

```bash
ssh -i ~/.ssh/discord-clone.pem ec2-user@<elastic-ip>

cd /opt/discord-clone/backend
nano .env.prod  # or vim

# Restart containers
docker compose -f docker-compose.prod.yml restart
```

### For Nginx Config Changes

```bash
# Edit locally: discord_backend/nginx/nginx.conf
# Then deploy:
./scripts/deploy.sh <elastic-ip> ~/.ssh/discord-clone.pem

# Or restart just nginx:
ssh -i ~/.ssh/discord-clone.pem ec2-user@<elastic-ip>
cd /opt/discord-clone/backend
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Accessing the Server

### SSH Access

```bash
ssh -i ~/.ssh/discord-clone.pem ec2-user@<elastic-ip>
```

### Common Directories

```bash
/opt/discord-clone/
├── backend/              # Backend source + Dockerfile + docker-compose
├── frontend/             # Compiled React build
└── scripts/              # Backup script
```

### Docker Commands

```bash
cd /opt/discord-clone/backend

# View all containers
docker compose -f docker-compose.prod.yml ps

# View logs (all)
docker compose -f docker-compose.prod.yml logs

# View logs (specific service)
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d
```

---

## Database Access

### Connect to PostgreSQL

```bash
ssh -i ~/.ssh/discord-clone.pem ec2-user@<elastic-ip>

# Connect via docker exec
docker exec -it discord-prod-postgres psql -U discord -d discord_clone
```

### Common SQL Queries

```sql
-- List all tables
\dt

-- View users
SELECT id, username, email, created_at FROM users;

-- View servers
SELECT id, name, owner_id, invite_code, created_at FROM servers;

-- View channels
SELECT id, name, type, server_id FROM channels;

-- View messages (last 10)
SELECT m.id, m.content, u.username, m.created_at
FROM messages m
JOIN users u ON m.user_id = u.id
ORDER BY m.created_at DESC
LIMIT 10;

-- Exit
\q
```

---

## Monitoring & Logs

### Application Logs

```bash
# Backend logs
docker compose -f docker-compose.prod.yml logs -f backend

# Nginx access/error logs
docker compose -f docker-compose.prod.yml logs -f nginx

# PostgreSQL logs
docker compose -f docker-compose.prod.yml logs -f postgres

# All logs
docker compose -f docker-compose.prod.yml logs -f
```

### Disk Usage

```bash
# Check disk space
df -h

# Check Docker disk usage
docker system df

# Clean up unused Docker resources
docker system prune -a
```

### Container Health

```bash
# View container status
docker compose -f docker-compose.prod.yml ps

# Check resource usage
docker stats

# Inspect specific container
docker inspect discord-prod-backend
```

---

## Backup & Restore

### Automated Backups

Backups run **daily at 3 AM UTC** via cron, uploading to S3.

Check backup logs:
```bash
sudo tail -f /var/log/discord-backup.log
```

View backups in S3:
```bash
aws s3 ls s3://discord-clone-backups-<random>/backups/
```

### Manual Backup

```bash
ssh -i ~/.ssh/discord-clone.pem ec2-user@<elastic-ip>
/opt/discord-clone/scripts/backup-db.sh
```

### Restore from Backup

```bash
# Download backup from S3
aws s3 cp s3://discord-clone-backups-<id>/backups/<timestamp>.sql.gz ./backup.sql.gz

# Copy to EC2
scp -i ~/.ssh/discord-clone.pem backup.sql.gz ec2-user@<elastic-ip>:/tmp/

# SSH into EC2
ssh -i ~/.ssh/discord-clone.pem ec2-user@<elastic-ip>

# Restore
gunzip /tmp/backup.sql.gz
docker exec -i discord-prod-postgres psql -U discord -d discord_clone < /tmp/backup.sql
```

---

## Teardown

### Destroy All Infrastructure

```bash
cd terraform
terraform destroy
```

Type `yes` when prompted.

This removes:
- EC2 instance (stops all charges)
- Elastic IP
- Security group
- IAM role
- S3 bucket (including all backups)

**Data Loss**: All data is permanently deleted.

### Preserve Backups Before Destroying

```bash
# Download all backups to local machine
aws s3 sync s3://discord-clone-backups-<id> ./backups/

# Then destroy
terraform destroy
```

---

## Troubleshooting

### 403 Forbidden on Homepage

**Cause**: Frontend files not mounted in Nginx container.

**Fix**:
```bash
ssh -i ~/.ssh/discord-clone.pem ec2-user@<elastic-ip>
cd /opt/discord-clone/backend

# Verify frontend files exist
ls -la /opt/discord-clone/frontend/

# Check if mounted in nginx
docker compose -f docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html/

# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### Backend Health Check Failing

```bash
# View backend logs
docker compose -f docker-compose.prod.yml logs backend

# Common issues:
# 1. Database connection failed — check DATABASE_URL in .env.prod
# 2. Prisma migration failed — check migration files
# 3. Port 3000 already in use — check docker ps
```

### WebSocket Connection Failed

**Symptom**: Messages don't appear in real-time.

**Check**:
1. Browser console shows WebSocket errors
2. Nginx logs: `docker compose -f docker-compose.prod.yml logs nginx`
3. CORS_ORIGIN in `.env.prod` matches the actual URL

**Fix**: Ensure `nginx.conf` has WebSocket upgrade headers for `/socket.io/` path.

### Database Migration Error

```bash
# View migration status
docker exec discord-prod-postgres psql -U discord -d discord_clone -c "\d"

# Reset migrations (CAUTION: data loss)
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

### Out of Disk Space

```bash
# Check usage
df -h

# Clean Docker
docker system prune -a
docker volume prune
```

### SSH Permission Denied

```bash
# Fix key permissions
chmod 400 ~/.ssh/discord-clone.pem

# Check key name matches terraform.tfvars
grep key_pair_name terraform/terraform.tfvars
```

---

## Known Limitations

### 1. No HTTPS

Traffic is **unencrypted over HTTP**. Passwords and JWTs are visible on the wire.

**Impact**: Not suitable for real users with sensitive data.

**Fix**: Add Let's Encrypt with Certbot (requires a custom domain):
```bash
# Install certbot
sudo dnf install -y certbot python3-certbot-nginx

# Get certificate (requires domain pointed to Elastic IP)
sudo certbot --nginx -d your-domain.com
```

### 2. Single Point of Failure

One EC2 instance means:
- Instance failure = complete downtime
- No redundancy or failover
- Manual restart required

**Acceptable for**: Hobby projects, demos, development testing.

### 3. No Horizontal Scaling

Docker Compose on a single instance can't scale horizontally.

**Workaround**: Vertical scaling (use larger instance type).

**Long-term fix**: Migrate to ECS Fargate, EKS, or multiple EC2 instances with load balancer.

### 4. No Socket.IO Redis Adapter

The backend uses custom Redis pub/sub, not the official `@socket.io/redis-adapter`.

**Impact**: Can't scale to multiple backend instances without adding the adapter.

**Fix** (if scaling is needed):
```bash
npm install @socket.io/redis-adapter
# Update socket.ts to use adapter
```

### 5. Rate Limiting is In-Memory

`express-rate-limit` uses in-memory store, which doesn't work across multiple instances.

**Fix** (if scaling is needed):
```bash
npm install rate-limit-redis
# Update rate-limit.middleware.ts
```

### 6. SSH Open to 0.0.0.0/0

Default config allows SSH from anywhere.

**Security Risk**: Brute-force attacks.

**Fix**: Update `terraform.tfvars`:
```hcl
allowed_ssh_cidr = "YOUR_IP/32"  # Replace with: curl ifconfig.me
```

### 7. No Monitoring/Alerts

No CloudWatch alarms or uptime monitoring.

**Impact**: You won't know if the server goes down.

**Fix**: Set up CloudWatch alarms for:
- EC2 instance status checks
- Disk usage >80%
- Memory usage >80%

### 8. Manual Deployment

No CI/CD pipeline — all deploys are manual.

**Impact**: Deployment is error-prone, no automated testing.

**Future**: Add GitHub Actions workflow (deferred from initial implementation).

### 9. Database Backups Not Tested

Automated backups run daily, but restore procedure is untested.

**Recommendation**: Test restore process at least once to verify backups work.

---

## Support

For issues or questions, check:
1. Container logs: `docker compose -f docker-compose.prod.yml logs`
2. EC2 user data logs: `sudo cat /var/log/cloud-init-output.log`
3. System logs: `sudo journalctl -xe`

---

**Deployed Infrastructure**: All files in `terraform/`, `scripts/`, and `discord_backend/nginx/` are deployment-specific. Do not modify unless you understand the consequences.

**Cost Monitoring**: Check AWS Billing Dashboard regularly to avoid unexpected charges.
