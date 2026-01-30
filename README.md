# StockForumX 


<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/udaykiriti/StockForumX/ci.yml?label=CI&style=for-the-badge" />
  <img src="https://img.shields.io/github/actions/workflow/status/udaykiriti/StockForumX/docker-publish.yml?label=Docker&style=for-the-badge" />
  <img src="https://img.shields.io/github/license/udaykiriti/StockForumX?style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/udaykiriti/StockForumX?style=for-the-badge" />
  <img src="https://img.shields.io/github/issues/udaykiriti/StockForumX?style=for-the-badge" />
</p>

<p align="center">
  <strong>A real-time stock discussion and prediction platform</strong><br/>
  Accuracy-based reputation · Time-expiring knowledge · Live analytics
</p>-time stock discussion and prediction platform with accuracy-based reputation, time-expiring knowledge, and live analytics.

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
- **Microservices:** Go (Golang)
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
│
│   ├── services/       # Microservices
│   │   └── price-updater/ # Go service for stock updates
│   │
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

> [!WARNING]
> **Security Notice**
>
> Do **NOT** commit your `.env` file to version control.  
> Always use strong, unique secrets in production and rotate them regularly.
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

- <span style="color:#2ecc71;"><strong>Users</strong></span> – User accounts, authentication, and reputation data  
- <span style="color:#3498db;"><strong>Stocks</strong></span> – Stock metadata and pricing information (mock or live)  
- <span style="color:#9b59b6;"><strong>Questions</strong></span> – User-submitted questions related to stocks  
- <span style="color:#e67e22;"><strong>Answers</strong></span> – Time-expiring answers using TTL indexes to prevent outdated information  
- <span style="color:#e74c3c;"><strong>Predictions</strong></span> – Stock price predictions with accuracy evaluation and scoring  
- <span style="color:#1abc9c;"><strong>ChatMessages</strong></span> – Real-time, stock-specific chat messages  
- <span style="color:#f1c40f;"><strong>ReputationSnapshots</strong></span> – Historical snapshots of user reputation over time  

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

> [!NOTE]
> ## Testing
>
> **Backend tests**
> ```bash
> cd server && npm test
> ```
>
> **Frontend tests**
> ```bash
> cd client && npm test
> ```


## Development Roadmap

- [X] Project setup
- [x] Authentication system
- [x] User Profiles
- [x] Stock listing
- [x] Q&A system
- [x] Prediction system
- [x] Reputation algorithm
- [x] Real-time chat
- [x] Analytics dashboard
- [x] Performance Optimizations (Lazy Loading, Memoization, Go Microservices)
- [x] Advanced features (Manipulation Detection)
- [x] Deployment (Docker, Nginx)

## License

MIT

## Contributing

<span style="color: green;">Contributions are welcome! Please open an issue or submit a pull request.</span>
