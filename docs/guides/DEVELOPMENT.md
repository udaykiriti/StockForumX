# Development Guide

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB v6+
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Clone and Install:**
```bash
git clone <repo-url>
cd StockForumX
npm run install:all
```

2. **Configure Environment:**
```bash
cd server
cp .env.example .env
# Edit .env with your settings
```

3. **Seed Database:**
```bash
npm run seed
```

4. **Start Development:**
```bash
cd ..
npm run dev
```

## Project Structure

### Frontend (`client/`)

```
client/
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/         # Shared (Navbar, Loader, etc.)
│   │   ├── predictions/    # Prediction-related
│   │   ├── questions/      # Q&A-related
│   │   ├── profile/        # Profile-related
│   │   └── search/         # Search-related
│   ├── pages/              # Route pages
│   ├── context/            # React Context
│   │   ├── AuthContext.jsx
│   │   └── SocketContext.jsx
│   ├── services/           # API calls
│   │   └── api.js
│   ├── App.jsx             # Root component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
└── package.json
```

### Backend (`server/`)

```
server/
├── config/                 # Configuration
│   ├── db.js              # MongoDB connection
│   └── validateEnv.js     # Env validation
├── models/                # Mongoose schemas
│   ├── User.js
│   ├── Stock.js
│   ├── Question.js
│   ├── Answer.js
│   ├── Prediction.js
│   ├── ChatMessage.js
│   └── ReputationSnapshot.js
├── routes/                # Express routes
│   ├── auth.js
│   ├── stocks.js
│   ├── questions.js
│   ├── predictions.js
│   └── users.js
├── sockets/               # Socket.io handlers
│   ├── chat.js
│   └── updates.js
├── jobs/                  # Cron jobs
│   ├── predictionEvaluator.js
│   ├── reputationUpdater.js
│   └── stockPriceUpdater.js
├── middleware/            # Custom middleware
│   └── auth.js
├── utils/                 # Utilities
│   ├── email.js
│   ├── reputation.js
│   ├── similarity.js
│   └── seeders.js
├── index.js               # Entry point
└── package.json
```

## Development Workflow

### 1. Feature Development

**Branch Strategy:**
```bash
git checkout -b feature/your-feature-name
```

**Development Cycle:**
1. Create/modify components
2. Test locally
3. Commit changes
4. Push and create PR

### 2. Adding a New Feature

#### Example: Add "Watchlist" Feature

**Step 1: Backend Model**
```javascript
// server/models/Watchlist.js
import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stocks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock'
    }]
}, { timestamps: true });

export default mongoose.model('Watchlist', watchlistSchema);
```

**Step 2: Backend Route**
```javascript
// server/routes/watchlist.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import Watchlist from '../models/Watchlist.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
    const watchlist = await Watchlist.findOne({ userId: req.user.id })
        .populate('stocks');
    res.json({ watchlist });
});

router.post('/add/:stockId', auth, async (req, res) => {
    let watchlist = await Watchlist.findOne({ userId: req.user.id });
    
    if (!watchlist) {
        watchlist = new Watchlist({ userId: req.user.id, stocks: [] });
    }
    
    if (!watchlist.stocks.includes(req.params.stockId)) {
        watchlist.stocks.push(req.params.stockId);
        await watchlist.save();
    }
    
    res.json({ watchlist });
});

export default router;
```

**Step 3: Register Route**
```javascript
// server/index.js
import watchlistRoutes from './routes/watchlist.js';
app.use('/api/watchlist', watchlistRoutes);
```

**Step 4: Frontend API Service**
```javascript
// client/src/services/api.js
export const getWatchlist = () => axios.get('/api/watchlist');
export const addToWatchlist = (stockId) => 
    axios.post(`/api/watchlist/add/${stockId}`);
```

**Step 5: Frontend Component**
```javascript
// client/src/components/watchlist/WatchlistButton.jsx
import { useState } from 'react';
import { addToWatchlist } from '../../services/api';
import toast from 'react-hot-toast';

function WatchlistButton({ stockId }) {
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        setLoading(true);
        try {
            await addToWatchlist(stockId);
            toast.success('Added to watchlist!');
        } catch (error) {
            toast.error('Failed to add');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick={handleAdd} disabled={loading}>
            {loading ? 'Adding...' : 'Add to Watchlist'}
        </button>
    );
}
```

### 3. Code Style

#### JavaScript/React

**Naming Conventions:**
- Components: `PascalCase` (e.g., `UserProfile.jsx`)
- Functions: `camelCase` (e.g., `getUserData`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- Files: Match component name

**Import Order:**
```javascript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Internal utilities/services
import { formatDate } from '../utils/helpers';
import { getStocks } from '../services/api';

// 3. Components
import Navbar from '../components/common/Navbar';

// 4. Styles
import './Home.css';
```

**Component Structure:**
```javascript
function MyComponent({ prop1, prop2 }) {
    // 1. Hooks
    const [state, setState] = useState(null);
    
    // 2. Effects
    useEffect(() => {
        // ...
    }, []);
    
    // 3. Event handlers
    const handleClick = () => {
        // ...
    };
    
    // 4. Render helpers
    const renderItem = (item) => {
        // ...
    };
    
    // 5. Return JSX
    return (
        <div>
            {/* ... */}
        </div>
    );
}

export default MyComponent;
```

#### Backend

**Route Structure:**
```javascript
// GET /api/resource
router.get('/', async (req, res) => {
    try {
        const data = await Model.find();
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/resource
router.post('/', auth, validate, async (req, res) => {
    try {
        const item = await Model.create(req.body);
        res.status(201).json({ item });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

### 4. Testing

#### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] Error handling works
- [ ] Loading states display correctly
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] Network requests succeed

#### API Testing with cURL

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Get stocks (with auth)
curl http://localhost:5000/api/stocks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Debugging

#### Frontend Debugging

**React DevTools:**
- Install React DevTools extension
- Inspect component props/state
- Track re-renders

**Console Logging:**
```javascript
console.log('User data:', user);
console.table(stocks); // For arrays
console.error('Error:', error);
```

**Network Tab:**
- Check API requests
- Verify request/response data
- Check status codes

#### Backend Debugging

**Console Logging:**
```javascript
console.log('Request body:', req.body);
console.log('User:', req.user);
console.error('Error:', error);
```

**MongoDB Queries:**
```javascript
// Log query
const users = await User.find().explain('executionStats');
console.log(users);
```

**Nodemon:**
Auto-restarts on file changes (already configured)

### 6. Common Tasks

#### Add New Route

1. Create route file in `server/routes/`
2. Import and register in `server/index.js`
3. Add API function in `client/src/services/api.js`

#### Add New Page

1. Create page in `client/src/pages/`
2. Add route in `client/src/App.jsx`
3. Add navigation link in `Navbar.jsx`

#### Add New Model

1. Create model in `server/models/`
2. Add indexes if needed
3. Update seeder if needed

#### Update Database Schema

1. Modify model
2. Create migration script if needed
3. Run migration on existing data

### 7. Performance Tips

#### Frontend

- Use `React.memo` for expensive components
- Implement pagination for large lists
- Lazy load images
- Debounce search inputs
- Use `useMemo` and `useCallback`

#### Backend

- Add database indexes
- Use `.select()` to fetch only needed fields
- Use `.lean()` for read-only queries
- Implement caching (Redis)
- Use aggregation pipelines

### 8. Git Workflow

```bash
# Start new feature
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add watchlist feature"

# Push to remote
git push origin feature/my-feature

# Create Pull Request on GitHub

# After merge, update main
git checkout main
git pull origin main
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

### 9. Environment Variables

**Development:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stockforumx
JWT_SECRET=dev_secret_key
CLIENT_URL=http://localhost:5173
```

**Production:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/stockforumx
JWT_SECRET=super_secure_random_string
CLIENT_URL=https://yourapp.com
```

### 10. Useful Commands

```bash
# Install dependencies
npm run install:all

# Start development
npm run dev

# Start only server
npm run dev:server

# Start only client
npm run dev:client

# Seed database
cd server && npm run seed

# Clear MongoDB
mongosh
> use stockforumx
> db.dropDatabase()
```

## Resources

- [React Docs](https://react.dev/)
- [Express Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [Socket.io Docs](https://socket.io/docs/)
