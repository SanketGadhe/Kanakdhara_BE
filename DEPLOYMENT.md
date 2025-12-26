# Production Deployment Guide

## Environment Setup

### Required Environment Variables
```bash
# Server Configuration
NODE_ENV=production
PORT=4000

# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/database

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
INTERNAL_NOTIFICATION_EMAIL=ops@yourcompany.com

# JWT Configuration
JWT_SECRET=your_strong_jwt_secret_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google/callback

# PDF Service
PDFSHIFT_API_KEY=your_pdfshift_api_key
```

## Security Checklist

### ✅ Completed
- [x] Environment variables secured
- [x] Input validation and sanitization
- [x] Rate limiting implemented
- [x] CORS properly configured
- [x] Error handling improved
- [x] Logging implemented
- [x] Database connection secured
- [x] Email service secured

### 🔄 Additional Recommendations
- [ ] Implement JWT authentication for admin routes
- [ ] Add API versioning
- [ ] Implement request/response compression
- [ ] Add health monitoring
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Implement database backups
- [ ] Add API documentation (Swagger)

## Deployment Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in all required values
   - Never commit `.env` to version control

3. **Database Setup**
   - Ensure MongoDB Atlas cluster is configured
   - Whitelist production server IP
   - Test database connection

4. **Security Configuration**
   - Configure firewall rules
   - Set up SSL certificates
   - Configure reverse proxy

5. **Start Application**
   ```bash
   npm start
   ```

## Monitoring

- Monitor application logs
- Set up health check endpoints
- Monitor database performance
- Track API response times
- Monitor error rates

## Backup Strategy

- Regular database backups
- Environment configuration backups
- Application code versioning
- Disaster recovery plan