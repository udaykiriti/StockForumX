# Quick Start Guide

Get StockForumX running in 5 minutes.

## Prerequisites

- Node.js v18+
- MongoDB running locally

## Installation

```bash
# 1. Clone repository
git clone <your-repo-url>
cd StockForumX

# 2. Install dependencies
npm run install:all

# 3. Configure environment
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 4. Seed database
npm run seed

# 5. Start application
cd ..
npm run dev
```

## Access Application

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Health: http://localhost:5000/api/health

## Test Account

After seeding, login with:

**Email**: `test@example.com`  
**Password**: `password123`

## Quick Tour

### Browse Stocks

Navigate to Stocks to see available stocks with live prices.

### Ask Questions

Click on stock → Ask Question → Fill form → Submit

### Make Predictions

Stock detail page → Predictions tab → Create prediction

### View Leaderboard

Navigate to Leaderboard to see top users by reputation

### Real-time Chat

Stock detail page → Chat tab → Send messages

## Next Steps

- [Architecture Overview](../architecture/ARCHITECTURE.md) - Understand the system
- [API Documentation](../api/API.md) - Endpoint details
- [Development Guide](../guides/DEVELOPMENT.md) - Development workflow

## Need Help?

Check [Troubleshooting Guide](../support/TROUBLESHOOTING.md) for common issues.
