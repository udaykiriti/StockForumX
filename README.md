# StockForumX 

![CI](https://github.com/udaykiriti/StockForumX/actions/workflows/ci.yml/badge.svg)
![Docker Publish](https://github.com/udaykiriti/StockForumX/actions/workflows/docker-publish.yml/badge.svg)

A real-time stock discussion and prediction platform with accuracy-based reputation, time-expiring knowledge, and live analytics.

## Features

- **Real-time Chat** - Live discussions per stock using WebSockets
- **Q&A System** - Time-expiring answers with TTL indexes
- **Prediction System** - Track price predictions with accuracy scoring
- **Smart Reputation** - `score = accuracy * log(total_predictions + 1)`
- **Live Analytics** - Trending stocks, questions, and insights
- **Manipulation Detection** - Flag pump behavior and duplicate predictions
- **Similar Question Detection** - Prevent duplicates using TF-IDF

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.io
- **Auth:** JWT
- **Jobs:** node-cron
- **Charts:** Recharts

## Project Structure

```
StockForumX/
├── client/          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── package.json
├── server/          # Express backend
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── sockets/
│   ├── jobs/
│   ├── utils/
│   └── package.json
├── shared/          # Shared constants
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (v6+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd StockForumX

# Install all dependencies
npm run install:all

# Setup environment variables
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret
```

### Running the Application

```bash
# Run both client and server concurrently
npm run dev

# Or run separately:
npm run dev:server  # Backend on http://localhost:5000
npm run dev:client  # Frontend on http://localhost:5173
```

### Docker Quick Start (Recommended)

1. **Configure Environment**
   ```bash
   cp .env.docker .env
   ```
2. **Start Services**
   ```bash
   docker-compose up -d --build
   ```
3. **Access**
   Open http://localhost

See the [Docker Deployment Guide](docs/deployment/DOCKER.md) for details.

### Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stockforumx
JWT_SECRET=your_super_secret_key_change_this
NODE_ENV=development
```

## Database Schema

### Key Collections

- **Users** - Authentication and reputation
- **Stocks** - Stock information (mock data)
- **Questions** - Q&A questions
- **Answers** - Time-expiring answers (TTL index)
- **Predictions** - Price predictions with evaluation
- **ChatMessages** - Real-time chat
- **ReputationSnapshots** - Historical reputation tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Stocks
- `GET /api/stocks` - List all stocks
- `GET /api/stocks/:symbol` - Get stock details

### Questions
- `GET /api/questions` - List questions
- `POST /api/questions` - Create question
- `POST /api/questions/:id/answers` - Post answer

### Predictions
- `GET /api/predictions` - List predictions
- `POST /api/predictions` - Create prediction

### Users
- `GET /api/users/leaderboard` - Top users by reputation
- `GET /api/users/:id` - User profile

## Real-Time Events

Socket.io events:
- `chat:message` - New chat message
- `question:new` - New question posted
- `answer:new` - New answer posted
- `prediction:new` - New prediction
- `stock:update` - Stock price update

## Testing

```bash
# Run backend tests
cd server && npm test

# Run frontend tests
cd client && npm test
```

## Development Roadmap

- [X] Project setup
- [ ] Authentication system
- [ ] Stock listing
- [ ] Q&A system
- [ ] Prediction system
- [ ] Reputation algorithm
- [ ] Real-time chat
- [ ] Analytics dashboard
- [x] Performance Optimizations (Lazy Loading, Memoization)
- [ ] Advanced features
- [ ] Deployment

## Resume Impact

**Instead of:** "Built a MERN app"

**Say:** "Built a real-time stock discussion and prediction platform with accuracy-based reputation, time-expiring knowledge, and live analytics using MERN stack, WebSockets, and MongoDB aggregation pipelines."

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a PR.
