<h1 align="center">StockForumX</h1>

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/udaykiriti/StockForumX/ci.yml?label=CI&style=for-the-badge&logo=github" />
  <img src="https://img.shields.io/github/actions/workflow/status/udaykiriti/StockForumX/docker-publish.yml?label=Docker%20Build&style=for-the-badge&logo=docker" />
  <img src="https://img.shields.io/github/license/udaykiriti/StockForumX?label=License&style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/udaykiriti/StockForumX?label=Stars&style=for-the-badge&logo=github" />
  <img src="https://img.shields.io/github/forks/udaykiriti/StockForumX?label=Forks&style=for-the-badge&logo=github" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/-Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" />
  <img src="https://img.shields.io/badge/-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<p align="center">
  <strong>A real-time stock discussion and prediction platform.</strong><br/>
  Accuracy-based reputation · Time-expiring knowledge · Live analytics
</p>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
  - [Docker Quick Start](#docker-quick-start)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Real-Time Events](#real-time-events)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Real-time Chat** - Live discussions per stock using WebSockets.
- **Q&A System** - Time-expiring answers with TTL indexes.
- **Prediction System** - Track price predictions with accuracy scoring.
- **Smart Reputation** - Calculated as `score = accuracy * log(total_predictions + 1)`.
- **Live Analytics** - Trending stocks, questions, and insights.
- **Manipulation Detection** - Flag pump behavior and duplicate predictions.
- **Similar Question Detection** - Prevent duplicates using TF-IDF logic.

## Tech Stack

| Area | Technology |
|------|------------|
| **Frontend** | React, Vite |
| **Backend** | Node.js, Express |
| **Database** | MongoDB (Mongoose) |
| **Real-time** | Socket.io |
| **Auth** | JWT |
| **Jobs** | node-cron |
| **Microservices** | Go (Golang) |
| **Charts** | Recharts |

## Project Structure

```text
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
├── services/        # Microservices
│   └── price-updater/ # Go service for stock updates
├── shared/          # Shared constants
├── docs/            # Detailed documentation
└── package.json
```

## Getting Started

### Prerequisites

> [!IMPORTANT]
> Ensure you have the following installed before proceeding as they are critical for the application to run.

- **Node.js** (v18+)
- **MongoDB** (v6+)
- **npm** or **yarn**

> [!NOTE]
> **Go (Golang)** is only required if you intend to run or modify the independent microservices (e.g., `services/price-updater`). The core application runs fine without it.

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/udaykiriti/StockForumX.git
    cd StockForumX
    ```

2.  **Install all dependencies**

    ```bash
    npm run install:all
    ```

3.  **Setup environment variables**

    ```bash
    cp server/.env.example server/.env
    ```

> [!CAUTION]
> Never commit your `.env` file to version control. It contains sensitive secrets like your database URI and JWT keys.

### Running the Application

 You can run both the client and server concurrently with a single command:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:server  # Backend on http://localhost:5000
npm run dev:client  # Frontend on http://localhost:5173
```

### Docker Quick Start

For a consistent environment, Docker is recommended.

1.  **Configure Environment**

    ```bash
    cp .env.docker .env
    ```

2.  **Start Services**

    ```bash
    docker-compose up -d --build
    ```

3.  **Access App**
    Open [http://localhost](http://localhost) in your browser.

> [!TIP]
> See the [Docker Deployment Guide](docs/deployment/DOCKER.md) for advanced configuration options.

## Configuration

Create a `server/.env` file with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stockforumx
JWT_SECRET=your_super_secret_key_change_this
NODE_ENV=development
```

## Database Schema

The application uses MongoDB with the following key collections:

- **Users**: User accounts, authentication, and reputation data.
- **Stocks**: Stock metadata and pricing information.
- **Questions**: User-submitted questions.
- **Answers**: Time-expiring answers (TTL).
- **Predictions**: Price predictions with scoring.
- **ChatMessages**: Real-time stock chat lines.
- **ReputationSnapshots**: Historical reputation data.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user context

### Stocks
- `GET /api/stocks` - List all stocks
- `GET /api/stocks/:symbol` - Get specific stock details

### Questions & Answers
- `GET /api/questions` - List questions
- `POST /api/questions` - Create a question
- `POST /api/questions/:id/answers` - Answer a question

### Predictions
- `GET /api/predictions` - Get recent predictions
- `POST /api/predictions` - Submit a new prediction

### Users
- `GET /api/users/leaderboard` - View top users
- `GET /api/users/:id` - View user profile

## Real-Time Events

We use Socket.io for real-time updates.

| Event Name | Description |
|------------|-------------|
| `chat:message` | New message in a stock chat room |
| `question:new` | A new question has been posted |
| `answer:new` | A new answer has been posted |
| `prediction:new`| A new price prediction |
| `stock:update` | Real-time price update |

## Documentation

We have comprehensive documentation available for all parts of the system:

### Sub-Project Guides

- **Frontend**: [Client Documentation](client/README.md) - Setup, scripts, and component structure.
- **Backend**: [Server Documentation](server/README.md) - API overview, jobs, and architecture.
- **Services**: [Price Updater Service](services/price-updater/README.md) - Go microservice details.

### Detailed Documentation (`docs/`)

- **[Getting Started](docs/getting-started/QUICK_START.md)**: Quick setup guide.
- **[API Reference](docs/api/API.md)**: Complete endpoint specifications.
- **[Architecture](docs/architecture/ARCHITECTURE.md)**: System design and data flow.
- **[Database Schema](docs/architecture/DATABASE.md)**: Collections and relationship diagrams.
- **[Authentication](docs/architecture/AUTHENTICATION.md)**: Auth flows and security.
- **[Real-Time Events](docs/architecture/REALTIME.md)**: WebSocket event reference.
- **[Deployment](docs/deployment/DEPLOYMENT.md)**: Production deployment guides.
- **[Troubleshooting](docs/support/TROUBLESHOOTING.md)**: Common issues and fixes.

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

> [!NOTE]
> Please ensure you add tests for any new features.
>
> **Backend tests**: `cd server && npm test`
> **Frontend tests**: `cd client && npm test`

## License

MIT
