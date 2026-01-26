# API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All API responses follow this structure:

**Success:**
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error:**
```json
{
  "error": "Error message",
  "details": [ ... ]
}
```

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Body:**
```json
{
  "username": "johndoe",
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "isVerified": false
  }
}
```

### Verify Email
```http
POST /auth/verify-email
```

**Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Login
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "reputation": 0
  }
}
```

### Get Current User
```http
GET /auth/me
```
🔒 **Requires Authentication**

### Login with OTP (Init)
```http
POST /auth/login-otp-init
```

**Body:**
```json
{
  "email": "john@example.com"
}
```

### Login with OTP (Verify)
```http
POST /auth/login-otp-verify
```

**Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Forgot Password
```http
POST /auth/forgot-password
```

**Body:**
```json
{
  "email": "john@example.com"
}
```

### Reset Password
```http
POST /auth/reset-password
```

**Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

---

## Stock Endpoints

### Get All Stocks
```http
GET /stocks
```

**Query Parameters:**
- `sector` (optional): Filter by sector
- `search` (optional): Search by name or symbol

**Response:**
```json
{
  "stocks": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "sector": "Technology",
      "currentPrice": 150.25,
      "change": 2.50,
      "changePercent": 1.69
    }
  ]
}
```

### Get Stock Details
```http
GET /stocks/:symbol
```

**Response:**
```json
{
  "stock": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "sector": "Technology",
    "currentPrice": 150.25,
    "previousClose": 147.75,
    "volume": 52000000,
    "marketCap": 2500000000000,
    "high24h": 151.00,
    "low24h": 148.50,
    "description": "..."
  }
}
```

### Get Trending Questions for Stock
```http
GET /stocks/:symbol/trending
```

**Query Parameters:**
- `limit` (optional, default: 5): Number of questions

---

## Question Endpoints

### Get Questions
```http
GET /questions
```

**Query Parameters:**
- `stockId` (optional): Filter by stock
- `userId` (optional): Filter by user
- `tag` (optional): Filter by tag
- `sort` (optional): `recent`, `popular`, `unanswered`
- `limit` (optional, default: 20)
- `page` (optional, default: 1)

### Get Question Details
```http
GET /questions/:id
```

**Response:**
```json
{
  "question": {
    "id": "...",
    "title": "Is AAPL a good buy?",
    "content": "...",
    "stockId": { ... },
    "userId": { ... },
    "tags": ["analysis", "long-term"],
    "upvotes": 15,
    "views": 120,
    "answerCount": 3,
    "answers": [ ... ]
  }
}
```

### Create Question
```http
POST /questions
```
🔒 **Requires Authentication**

**Body:**
```json
{
  "stockId": "...",
  "title": "Is AAPL a good buy?",
  "content": "I'm considering buying AAPL...",
  "tags": ["analysis", "long-term"]
}
```

### Create Answer
```http
POST /questions/:id/answers
```
🔒 **Requires Authentication**

**Body:**
```json
{
  "content": "Yes, AAPL is a solid long-term investment because..."
}
```

### Upvote Question
```http
PUT /questions/:id/upvote
```
🔒 **Requires Authentication**

### Downvote Question
```http
PUT /questions/:id/downvote
```
🔒 **Requires Authentication**

### Upvote Answer
```http
PUT /questions/answers/:answerId/upvote
```
🔒 **Requires Authentication**

### Downvote Answer
```http
PUT /questions/answers/:answerId/downvote
```
🔒 **Requires Authentication**

### Accept Answer
```http
PUT /questions/:questionId/answers/:answerId/accept
```
🔒 **Requires Authentication** (Question author only)

---

## Prediction Endpoints

### Get Predictions
```http
GET /predictions
```

**Query Parameters:**
- `stockId` (optional): Filter by stock
- `userId` (optional): Filter by user
- `timeframe` (optional): `1h`, `1d`, `1w`, `1m`
- `evaluated` (optional): `true`, `false`
- `limit` (optional, default: 20)

### Create Prediction
```http
POST /predictions
```
🔒 **Requires Authentication**

**Body (Price Prediction):**
```json
{
  "stockId": "...",
  "predictionType": "price",
  "targetPrice": 160.00,
  "timeframe": "1w",
  "reasoning": "Based on recent earnings..."
}
```

**Body (Direction Prediction):**
```json
{
  "stockId": "...",
  "predictionType": "direction",
  "direction": "up",
  "timeframe": "1d",
  "reasoning": "Market sentiment is positive..."
}
```

### Get User Predictions
```http
GET /predictions/user/:userId
```

### Get Prediction Stats
```http
GET /predictions/stats
```
🔒 **Requires Authentication**

**Response:**
```json
{
  "stats": {
    "totalPredictions": 50,
    "accuratePredictions": 35,
    "accuracy": 70,
    "byTimeframe": {
      "1h": { "total": 10, "accurate": 6 },
      "1d": { "total": 20, "accurate": 15 }
    }
  }
}
```

---

## User Endpoints

### Get Leaderboard
```http
GET /users/leaderboard
```

**Query Parameters:**
- `limit` (optional, default: 10)

**Response:**
```json
{
  "leaderboard": [
    {
      "username": "johndoe",
      "reputation": 250.5,
      "totalPredictions": 100,
      "accuracy": 75.5
    }
  ]
}
```

### Get User Profile
```http
GET /users/:userId
```

**Response:**
```json
{
  "user": {
    "username": "johndoe",
    "fullName": "John Doe",
    "bio": "...",
    "reputation": 250.5,
    "totalPredictions": 100,
    "accuratePredictions": 75,
    "accuracy": 75.5,
    "tradingExperience": "intermediate",
    "location": "New York"
  }
}
```

### Get User Stats
```http
GET /users/:userId/stats
```

**Response:**
```json
{
  "stats": {
    "predictions": {
      "total": 100,
      "accurate": 75,
      "accuracy": 75.5
    },
    "questions": {
      "asked": 20,
      "answered": 35
    },
    "reputation": {
      "current": 250.5,
      "tier": "Expert",
      "history": [ ... ]
    }
  }
}
```

### Update Profile
```http
PUT /users/profile
```
🔒 **Requires Authentication**

**Body:**
```json
{
  "fullName": "John Doe",
  "bio": "Experienced trader...",
  "location": "New York",
  "tradingExperience": "expert",
  "phone": "+1234567890"
}
```

---

## Health Check

### Check API Health
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "message": "StockForumX API is running"
}
```

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Response** (when exceeded):
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
