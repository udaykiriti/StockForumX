# Troubleshooting Guide

Common issues and their solutions for StockForumX.

## Installation Issues

### MongoDB Connection Failed

**Error:**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**

1. **Check if MongoDB is running:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. **Verify MongoDB is accessible:**
   ```bash
   mongosh
   # Should connect successfully
   ```

3. **Check MONGODB_URI in `.env`:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/stockforumx
   ```

4. **For MongoDB Atlas:**
   - Whitelist your IP address
   - Check username/password
   - Verify connection string

---

### Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**

**Windows:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9
```

**Or change port:**
```env
# server/.env
PORT=5001
```

---

### Dependencies Installation Failed

**Error:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use legacy peer deps:**
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Update Node.js:**
   - Ensure Node.js v18 or higher
   - Download from [nodejs.org](https://nodejs.org/)

---

## Runtime Issues

### JWT Token Invalid

**Error:**
```
Error: Invalid token
```

**Solutions:**

1. **Check JWT_SECRET:**
   - Ensure same secret in `.env`
   - Don't change secret with active tokens

2. **Token expired:**
   - Login again to get new token
   - Increase `JWT_EXPIRES_IN` if needed

3. **Clear localStorage:**
   ```javascript
   // In browser console
   localStorage.clear();
   ```

---

### CORS Errors

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

1. **Check CLIENT_URL in server `.env`:**
   ```env
   CLIENT_URL=http://localhost:5173
   ```

2. **Verify CORS configuration:**
   ```javascript
   // server/index.js
   app.use(cors({
       origin: process.env.CLIENT_URL || 'http://localhost:5173'
   }));
   ```

3. **For production:**
   ```env
   CLIENT_URL=https://yourdomain.com
   ```

---

### Email Not Sending

**Error:**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solutions:**

1. **For Gmail:**
   - Enable 2-factor authentication
   - Generate App Password
   - Use App Password in `.env`

2. **Check email configuration:**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

3. **Test email service:**
   ```javascript
   // Create test file
   import { sendOTPEmail } from './utils/email.js';
   await sendOTPEmail('test@test.com', '123456', 'verify');
   ```

4. **Alternative SMTP services:**
   - SendGrid
   - Mailgun
   - AWS SES

---

### WebSocket Connection Failed

**Error:**
```
WebSocket connection to 'ws://localhost:5000/socket.io/' failed
```

**Solutions:**

1. **Check server is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Verify Socket.io configuration:**
   ```javascript
   // server/index.js
   const io = new Server(httpServer, {
       cors: {
           origin: process.env.CLIENT_URL,
           methods: ['GET', 'POST']
       }
   });
   ```

3. **Check client connection:**
   ```javascript
   // client/src/context/SocketContext.jsx
   const socket = io('http://localhost:5000');
   ```

4. **For production with HTTPS:**
   - Use `wss://` instead of `ws://`
   - Ensure proper proxy configuration

---

## Frontend Issues

### Blank Page / White Screen

**Solutions:**

1. **Check browser console for errors**

2. **Verify API connection:**
   ```javascript
   // Check in browser console
   fetch('http://localhost:5000/api/health')
       .then(r => r.json())
       .then(console.log);
   ```

3. **Check Vite proxy:**
   ```javascript
   // vite.config.js
   export default {
       server: {
           proxy: {
               '/api': 'http://localhost:5000'
           }
       }
   };
   ```

4. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux)
   - Hard refresh: `Cmd+Shift+R` (macOS)

---

### Components Not Updating

**Solutions:**

1. **Check React DevTools:**
   - Verify state changes
   - Check props

2. **Add console logs:**
   ```javascript
   useEffect(() => {
       console.log('State changed:', state);
   }, [state]);
   ```

3. **Check dependency arrays:**
   ```javascript
   // Missing dependency
   useEffect(() => {
       fetchData();
   }, []); // Add dependencies!
   ```

---

### Styling Issues

**Solutions:**

1. **Check CSS import order:**
   ```javascript
   // Import global styles first
   import './index.css';
   import './Component.css';
   ```

2. **Verify CSS class names:**
   - Check for typos
   - Ensure classes exist

3. **Check CSS specificity:**
   - Use more specific selectors
   - Use `!important` sparingly

---

## Backend Issues

### Route Not Found (404)

**Solutions:**

1. **Check route registration:**
   ```javascript
   // server/index.js
   app.use('/api/stocks', stockRoutes);
   ```

2. **Verify route path:**
   ```javascript
   // Correct
   router.get('/', getStocks);
   // Access: /api/stocks
   
   // Not
   router.get('/stocks', getStocks);
   // Access: /api/stocks/stocks
   ```

3. **Check HTTP method:**
   - GET vs POST vs PUT vs DELETE

---

### Database Query Slow

**Solutions:**

1. **Add indexes:**
   ```javascript
   questionSchema.index({ stockId: 1, createdAt: -1 });
   ```

2. **Use `.select()` to limit fields:**
   ```javascript
   User.find().select('username reputation');
   ```

3. **Use `.lean()` for read-only:**
   ```javascript
   User.find().lean();
   ```

4. **Limit results:**
   ```javascript
   Question.find().limit(20);
   ```

5. **Check query with `.explain()`:**
   ```javascript
   const result = await Question.find().explain('executionStats');
   console.log(result);
   ```

---

### Memory Leak

**Symptoms:**
- Increasing memory usage
- Application crashes
- Slow performance

**Solutions:**

1. **Check for unclosed connections:**
   ```javascript
   // Always close database connections
   mongoose.connection.close();
   ```

2. **Remove event listeners:**
   ```javascript
   useEffect(() => {
       socket.on('message', handler);
       
       return () => {
           socket.off('message', handler);
       };
   }, []);
   ```

3. **Monitor with PM2:**
   ```bash
   pm2 monit
   ```

4. **Use memory profiling:**
   ```bash
   node --inspect index.js
   # Open chrome://inspect
   ```

---

## Production Issues

### Application Crashes

**Solutions:**

1. **Check logs:**
   ```bash
   pm2 logs stockforumx-api
   ```

2. **Enable auto-restart:**
   ```bash
   pm2 start index.js --name stockforumx-api --watch
   ```

3. **Check error tracking:**
   - Install Sentry
   - Review error reports

---

### High CPU Usage

**Solutions:**

1. **Identify bottleneck:**
   ```bash
   pm2 monit
   ```

2. **Optimize database queries**
3. **Add caching**
4. **Scale horizontally:**
   ```bash
   pm2 start index.js -i max
   ```

---

### SSL Certificate Issues

**Error:**
```
NET::ERR_CERT_AUTHORITY_INVALID
```

**Solutions:**

1. **Renew certificate:**
   ```bash
   sudo certbot renew
   ```

2. **Check certificate expiry:**
   ```bash
   sudo certbot certificates
   ```

3. **Force HTTPS redirect:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

---

## Development Tips

### Enable Debug Mode

**Backend:**
```bash
DEBUG=* npm run dev
```

**Frontend:**
```javascript
// In browser console
localStorage.debug = '*';
```

### Clear All Data

**Database:**
```bash
mongosh
> use stockforumx
> db.dropDatabase()
```

**Frontend:**
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
```

### Reset Everything

```bash
# Stop all processes
pm2 kill

# Clear database
mongosh
> use stockforumx
> db.dropDatabase()
> exit

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm run install:all

# Reseed database
cd server && npm run seed

# Restart
npm run dev
```

---

## Getting Help

If you can't find a solution:

1. **Search existing issues** on GitHub
2. **Check documentation** in `docs/`
3. **Ask in Discussions** on GitHub
4. **Create new issue** with:
   - Error message
   - Steps to reproduce
   - Environment details
   - What you've tried

---

## Common Error Messages

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| `ECONNREFUSED` | Service not running | Start the service |
| `EADDRINUSE` | Port in use | Kill process or change port |
| `401 Unauthorized` | Invalid/missing token | Login again |
| `404 Not Found` | Wrong URL/route | Check endpoint |
| `500 Internal Server Error` | Server-side bug | Check logs |
| `CORS error` | Origin not allowed | Update CORS config |
| `ValidationError` | Invalid input | Check request data |
