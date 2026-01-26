# Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn
- Git

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd StockForumX
```

## Step 2: Install Dependencies

The project uses npm workspaces for managing client and server dependencies.

```bash
npm run install:all
```

Or install manually:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

## Step 3: Set Up MongoDB

### Local MongoDB

Start MongoDB service:

**Windows:**
```bash
net start MongoDB
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
```

Verify MongoDB is running:
```bash
mongosh
```

### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create new cluster
3. Get connection string
4. Use in `.env` file

## Step 4: Configure Environment Variables

Navigate to server directory and copy example file:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stockforumx
JWT_SECRET=your_super_secret_key_change_this_in_production
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=StockForumX <noreply@stockforumx.com>
```

**Important Notes:**
- Use strong, random JWT_SECRET in production
- EMAIL_* required for email verification and password reset
- For Gmail, use [App Password](https://support.google.com/accounts/answer/185833)

## Step 5: Seed the Database (Optional)

Populate database with sample data:

```bash
cd server
npm run seed
```

Creates sample stocks, test users, questions, and predictions.

## Step 6: Start the Application

### Run Both Client and Server

From root directory:

```bash
npm run dev
```

Starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

### Run Separately

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
```

## Step 7: Verify Installation

1. Open browser: http://localhost:5173
2. Check backend health: http://localhost:5000/api/health

Expected response:
```json
{
  "status": "ok",
  "message": "StockForumX API is running"
}
```

## Troubleshooting

### MongoDB Connection Issues

**Error:** `MongooseServerSelectionError`

**Solutions:**
- Ensure MongoDB is running
- Check MongoDB URI in `.env`
- For Atlas, ensure IP is whitelisted

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solutions:**
- Change PORT in `server/.env`
- Kill process using port:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -ti:5000 | xargs kill -9
  ```

### Dependencies Installation Failed

**Solutions:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall
- Use Node.js v18 or higher
- Try with `--legacy-peer-deps` flag

### Email Features Not Working

**Solutions:**
- Verify EMAIL_* variables in `.env`
- For Gmail, enable 2FA and use App Password
- Check firewall/antivirus blocking SMTP

## Next Steps

- Read [Quick Start Guide](./QUICK_START.md) for basic features
- Check [Development Guide](../guides/DEVELOPMENT.md) for workflow
- See [API Documentation](../api/API.md) for endpoint details

## Production Deployment

For production deployment, see [Deployment Guide](../deployment/DEPLOYMENT.md).
