# Deployment Guide

## Production Checklist

Before deploying to production, ensure:

- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] HTTPS/SSL certificates installed
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Monitoring setup
- [ ] Domain configured
- [ ] Email service working

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, etc.)

#### Prerequisites
- Ubuntu 20.04+ server
- Domain name
- SSH access

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

#### Step 2: Clone and Setup Project

```bash
# Clone repository
cd /var/www
sudo git clone <your-repo-url> stockforumx
cd stockforumx

# Install dependencies
sudo npm run install:all

# Build frontend
cd client
sudo npm run build
cd ..
```

#### Step 3: Configure Environment

```bash
cd server
sudo nano .env
```

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stockforumx
JWT_SECRET=your_super_secure_random_string_here
CLIENT_URL=https://yourdomain.com

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=StockForumX <noreply@stockforumx.com>
```

#### Step 4: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/stockforumx
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /var/www/stockforumx/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/stockforumx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

#### Step 6: Start Application with PM2

```bash
cd /var/www/stockforumx/server
pm2 start index.js --name stockforumx-api
pm2 save
pm2 startup
```

#### Step 7: Configure Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

### Option 2: Heroku

#### Prerequisites
- Heroku account
- Heroku CLI installed

#### Step 1: Prepare Application

**Create `Procfile` in root:**
```
web: cd server && npm start
```

**Update `server/package.json`:**
```json
{
  "scripts": {
    "start": "node index.js",
    "build": "cd ../client && npm run build"
  }
}
```

#### Step 2: Deploy

```bash
# Login
heroku login

# Create app
heroku create stockforumx

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret_here
heroku config:set CLIENT_URL=https://stockforumx.herokuapp.com

# Deploy
git push heroku main

# Open app
heroku open
```

---

### Option 3: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel --prod
```

**Configure:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

#### Backend on Railway

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Add MongoDB plugin
5. Set environment variables
6. Deploy

---

### Option 4: Docker

#### Dockerfile (Backend)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
```

#### Dockerfile (Frontend)

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/stockforumx
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - mongodb

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

**Deploy:**
```bash
docker-compose up -d
```

---

## Environment Variables

### Required

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<strong-random-string>
CLIENT_URL=<your-frontend-url>
```

### Optional

```env
# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<app-password>
EMAIL_FROM=StockForumX <noreply@stockforumx.com>

# JWT
JWT_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## Database Backup

### MongoDB Atlas (Automated)

Atlas provides automatic backups. Configure in dashboard.

### Manual Backup

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/stockforumx" --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://localhost:27017/stockforumx" /backup/20240126
```

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mongodump --uri="mongodb://localhost:27017/stockforumx" --out="$BACKUP_DIR/$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

**Cron job:**
```bash
0 2 * * * /path/to/backup.sh
```

---

## Monitoring

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs stockforumx-api

# Restart on crash
pm2 startup
pm2 save
```

### Application Monitoring

**Install monitoring tools:**
- [New Relic](https://newrelic.com/)
- [Datadog](https://www.datadoghq.com/)
- [Sentry](https://sentry.io/) for error tracking

---

## Performance Optimization

### 1. Enable Compression

```javascript
import compression from 'compression';
app.use(compression());
```

### 2. Static File Caching

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Indexing

Ensure all indexes are created (see DATABASE.md)

### 4. CDN for Static Assets

Use Cloudflare or AWS CloudFront

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Helmet.js installed
- [ ] Input validation enabled
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Secure headers set

### Install Security Packages

```bash
npm install helmet express-mongo-sanitize xss-clean
```

```javascript
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
```

---

## Troubleshooting

### Application Won't Start

1. Check logs: `pm2 logs`
2. Verify environment variables
3. Check MongoDB connection
4. Verify port availability

### High Memory Usage

1. Check for memory leaks
2. Optimize database queries
3. Implement caching
4. Scale horizontally

### Slow Performance

1. Enable compression
2. Add database indexes
3. Implement caching
4. Use CDN
5. Optimize images

---

## Scaling

### Horizontal Scaling

1. Use load balancer (Nginx, AWS ELB)
2. Run multiple instances with PM2:
   ```bash
   pm2 start index.js -i max
   ```
3. Use Redis for session storage
4. Implement database replication

### Vertical Scaling

1. Upgrade server resources
2. Optimize code
3. Add caching layer

---

## Maintenance

### Regular Tasks

- **Daily:** Check logs for errors
- **Weekly:** Review performance metrics
- **Monthly:** Update dependencies
- **Quarterly:** Security audit

### Updating Application

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm run install:all

# Build frontend
cd client && npm run build

# Restart backend
pm2 restart stockforumx-api
```
