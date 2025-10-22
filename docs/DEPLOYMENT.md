# Deployment Guide

## Prerequisites

- Node.js 18+ (production server)
- PostgreSQL 14+
- Redis 6+ (optional but recommended)
- MinIO or S3-compatible storage
- SSL certificate (for HTTPS)
- Domain name

## Environment Preparation

1. **Create production environment file:**
```bash
cp .env.example .env.production
```

2. **Update production variables:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/blue_ocean_prod
JWT_SECRET=<generate-secure-32+-char-secret>
ADMIN_PASSWORD=<strong-admin-password>
BASE_URL=https://your-domain.com
```

3. **Generate secure secrets:**
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32
```

## Build Process

1. **Install dependencies:**
```bash
pnpm install --frozen-lockfile
```

2. **Run database migrations:**
```bash
pnpm db:migrate:prod
```

3. **Build the application:**
```bash
pnpm build
```

## Deployment Options

### Option 1: Docker Deployment

1. **Build Docker image:**
```bash
docker build -t blue-ocean-explorer:latest .
```

2. **Run with Docker Compose:**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: blue-ocean-explorer:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: blue_ocean_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

3. **Start services:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Manual Deployment

1. **Install PM2:**
```bash
npm install -g pm2
```

2. **Create PM2 ecosystem file:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'blue-ocean-explorer',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

3. **Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Platform-Specific Deployment

#### Vercel

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

#### Railway

1. **Connect GitHub repository**
2. **Set environment variables in Railway dashboard**
3. **Deploy automatically on push**

#### DigitalOcean App Platform

1. **Create new app from GitHub**
2. **Configure build command:** `pnpm build`
3. **Configure run command:** `pnpm start`
4. **Set environment variables**

## Nginx Configuration

For production, use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Database Backup

Set up automated backups:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="blue_ocean_prod"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

## Monitoring Setup

### 1. Health Checks

Monitor these endpoints:
- `/health` - Basic health check
- `/health/live` - Liveness check
- `/health/ready` - Readiness check

### 2. Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

### 3. Application Monitoring

Configure Sentry:
```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 4. Log Aggregation

Use PM2 logs or ship to:
- ELK Stack
- Datadog
- New Relic

## Performance Optimization

### 1. Enable Caching

Ensure Redis is configured:
```env
REDIS_URL=redis://localhost:6379
```

### 2. CDN Setup

Use Cloudflare or similar:
1. Add domain to Cloudflare
2. Enable caching
3. Configure page rules

### 3. Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_opportunities_user_status ON opportunities(user_id, status);
CREATE INDEX idx_markets_user_industry ON markets(user_id, industry);
CREATE INDEX idx_transactions_user_created ON credit_transactions(user_id, created_at);
```

## Security Checklist

- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] Database password strong
- [ ] Admin password changed
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Security headers set
- [ ] Firewall configured
- [ ] SSH key-only access
- [ ] Regular security updates

## Rollback Plan

1. **Database backup before deployment**
2. **Tag releases:**
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

3. **Quick rollback:**
```bash
# Docker
docker-compose down
docker run previous-image-tag

# PM2
pm2 stop all
git checkout previous-tag
pnpm install
pnpm build
pm2 restart all
```

## Post-Deployment

1. **Verify deployment:**
```bash
curl https://your-domain.com/health
```

2. **Check logs:**
```bash
pm2 logs
docker logs container-name
```

3. **Monitor metrics:**
   - Response times
   - Error rates
   - CPU/Memory usage
   - Database connections

4. **Run smoke tests:**
```bash
pnpm test:e2e -- --grep smoke
```