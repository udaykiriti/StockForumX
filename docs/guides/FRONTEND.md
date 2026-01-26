# Frontend Guide

## Overview

The frontend is built with React 18 and Vite, featuring a modern, responsive UI with real-time capabilities.

## Project Structure

```
client/src/
├── components/          # Reusable components
│   ├── common/         # Shared components
│   ├── predictions/    # Prediction components
│   ├── questions/      # Q&A components
│   ├── profile/        # Profile components
│   └── search/         # Search components
├── pages/              # Route pages
├── context/            # React Context
├── services/           # API layer
├── App.jsx             # Root component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Key Components

### Common Components

#### Navbar
**Location**: `components/common/Navbar.jsx`

Navigation bar with authentication state.

```javascript
import { useAuth } from '../../context/AuthContext';

function Navbar() {
    const { user, logout } = useAuth();
    
    return (
        <nav className="navbar">
            <Link to="/">StockForumX</Link>
            {user ? (
                <>
                    <Link to="/profile">{user.username}</Link>
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <Link to="/login">Login</Link>
            )}
        </nav>
    );
}
```

#### Loader
**Location**: `components/common/Loader.jsx`

Loading spinner component.

```javascript
function Loader() {
    return (
        <div className="loader">
            <div className="spinner"></div>
        </div>
    );
}
```

#### EmptyState
**Location**: `components/common/EmptyState.jsx`

Display when no data is available.

```javascript
function EmptyState({ icon, title, message, action }) {
    return (
        <div className="empty-state">
            <div className="icon">{icon}</div>
            <h3>{title}</h3>
            <p>{message}</p>
            {action && <button>{action}</button>}
        </div>
    );
}
```

### Question Components

#### QuestionList
**Location**: `components/questions/QuestionList.jsx`

Displays list of questions with filtering.

**Props:**
- `stockId`: Filter by stock (optional)
- `userId`: Filter by user (optional)

#### AskQuestionModal
**Location**: `components/questions/AskQuestionModal.jsx`

Modal for creating new questions.

**Features:**
- Form validation
- Tag selection
- Similar question detection
- Real-time preview

### Prediction Components

#### PredictionForm
**Location**: `components/predictions/PredictionForm.jsx`

Form for creating predictions.

**Types:**
- Price prediction (target price)
- Direction prediction (up/down)

**Timeframes:**
- 1 hour
- 1 day
- 1 week
- 1 month

#### PredictionStats
**Location**: `components/predictions/PredictionStats.jsx`

Displays user prediction statistics with charts.

## Pages

### Home
**Location**: `pages/Home.jsx`

Landing page with trending stocks and questions.

**Features:**
- Trending stocks
- Recent questions
- Top predictions
- Search functionality

### StockDetail
**Location**: `pages/StockDetail.jsx`

Detailed stock view with tabs.

**Tabs:**
- Overview (price, chart)
- Questions (Q&A)
- Predictions (user predictions)
- Chat (real-time chat)

### Profile
**Location**: `pages/Profile.jsx`

User profile with stats and activity.

**Sections:**
- User info
- Reputation stats
- Prediction history
- Questions/Answers
- Edit profile

### Leaderboard
**Location**: `pages/Leaderboard.jsx`

Top users ranked by reputation.

## Context Providers

### AuthContext
**Location**: `context/AuthContext.jsx`

Manages authentication state.

**Provides:**
- `user`: Current user object
- `loading`: Loading state
- `login(email, password)`: Login function
- `logout()`: Logout function
- `register(data)`: Register function

**Usage:**
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
    const { user, login, logout } = useAuth();
    
    if (!user) {
        return <Login />;
    }
    
    return <div>Welcome {user.username}</div>;
}
```

### SocketContext
**Location**: `context/SocketContext.jsx`

Manages WebSocket connection.

**Provides:**
- `socket`: Socket.io instance

**Usage:**
```javascript
import { useSocket } from '../context/SocketContext';

function Chat() {
    const socket = useSocket();
    
    useEffect(() => {
        socket.on('chat:message', handleMessage);
        return () => socket.off('chat:message', handleMessage);
    }, []);
}
```

## Services

### API Service
**Location**: `services/api.js`

Centralized API calls using Axios.

**Example:**
```javascript
import axios from 'axios';

const API_BASE = '/api';

export const getStocks = (params) => 
    axios.get(`${API_BASE}/stocks`, { params });

export const createQuestion = (data) => 
    axios.post(`${API_BASE}/questions`, data);
```

**Usage:**
```javascript
import { getStocks } from '../services/api';

const fetchStocks = async () => {
    try {
        const { data } = await getStocks({ sector: 'Technology' });
        setStocks(data.stocks);
    } catch (error) {
        console.error(error);
    }
};
```

## Styling

### CSS Organization

Each component has its own CSS file:
```
Component.jsx
Component.css
```

### Global Styles
**Location**: `index.css`

Contains:
- CSS variables
- Reset styles
- Utility classes
- Global layouts

**CSS Variables:**
```css
:root {
    --primary: #3b82f6;
    --success: #10b981;
    --danger: #ef4444;
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f1f5f9;
}
```

### Responsive Design

Mobile-first approach with breakpoints:
```css
/* Mobile first */
.container {
    padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
    .container {
        padding: 2rem;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .container {
        padding: 3rem;
    }
}
```

## State Management

### Local State (useState)

For component-specific state:
```javascript
const [stocks, setStocks] = useState([]);
const [loading, setLoading] = useState(false);
```

### Context (useContext)

For global state (auth, socket):
```javascript
const { user } = useAuth();
const socket = useSocket();
```

## Routing

### Route Configuration
**Location**: `App.jsx`

```javascript
<Routes>
    <Route path="/" element={<Home />} />
    <Route path="/stocks" element={<StockList />} />
    <Route path="/stock/:symbol" element={<StockDetail />} />
    <Route path="/question/:id" element={<QuestionDetail />} />
    <Route path="/profile/:id" element={<Profile />} />
    <Route path="/leaderboard" element={<Leaderboard />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
</Routes>
```

### Protected Routes

```javascript
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    
    if (loading) return <Loader />;
    if (!user) return <Navigate to="/login" />;
    
    return children;
}

// Usage
<Route path="/profile" element={
    <ProtectedRoute>
        <Profile />
    </ProtectedRoute>
} />
```

## Best Practices

### 1. Component Structure

```javascript
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Component.css';

function Component({ prop1, prop2 }) {
    // 1. State
    const [state, setState] = useState(null);
    
    // 2. Effects
    useEffect(() => {
        // Side effects
    }, []);
    
    // 3. Handlers
    const handleClick = () => {
        // Handle event
    };
    
    // 4. Render
    return (
        <div className="component">
            {/* JSX */}
        </div>
    );
}

Component.propTypes = {
    prop1: PropTypes.string.isRequired,
    prop2: PropTypes.number
};

export default Component;
```

### 2. Error Handling

```javascript
const fetchData = async () => {
    try {
        setLoading(true);
        const { data } = await api.getData();
        setData(data);
    } catch (error) {
        console.error(error);
        toast.error('Failed to load data');
    } finally {
        setLoading(false);
    }
};
```

### 3. Loading States

```javascript
if (loading) return <Loader />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <DataDisplay data={data} />;
```

### 4. Memoization

```javascript
import { useMemo, useCallback } from 'react';

// Expensive calculation
const expensiveValue = useMemo(() => {
    return calculateExpensiveValue(data);
}, [data]);

// Callback function
const handleClick = useCallback(() => {
    doSomething(id);
}, [id]);
```

## Performance Tips

1. **Code Splitting**: Use `React.lazy()` for route-based splitting
2. **Virtualization**: Use `react-window` for long lists
3. **Debouncing**: Debounce search inputs
4. **Image Optimization**: Lazy load images
5. **Memoization**: Use `React.memo`, `useMemo`, `useCallback`

## Testing

### Component Testing

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('renders component', () => {
    render(<Component />);
    expect(screen.getByText(/hello/i)).toBeInTheDocument();
});

test('handles click', async () => {
    render(<Component />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/clicked/i)).toBeInTheDocument();
});
```
