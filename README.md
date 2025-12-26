# Kanakdhara Investments Backend API

A secure, production-ready backend API for Kanakdhara Investments platform.

## 🚀 Features

- **Secure Form Handling**: IIS forms, job applications, newsletter subscriptions
- **Email Integration**: Gmail API integration with validation
- **Market Data**: Real-time market intelligence and indicators
- **Customer Management**: Customer information and reporting
- **Calendar Integration**: Google Calendar integration
- **Security**: Input validation, rate limiting, CORS protection

## 🛡️ Security Features

- Input validation and sanitization
- Rate limiting (100 requests/15min, 5 forms/15min)
- CORS protection with environment-based origins
- Error handling without information leakage
- Secure email handling with size limits
- Environment variable protection

## 📋 Prerequisites

- Node.js >= 18
- MongoDB Atlas account
- Gmail API credentials
- Google Calendar API access

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🌐 API Endpoints

### Forms
- `POST /api/iis-form` - Submit IIS form
- `POST /api/newsletter/subscribe` - Newsletter subscription
- `POST /api/job/apply` - Job application

### Market Data
- `GET /api/market/*` - Market intelligence endpoints
- `GET /api/market-mood/*` - Market mood indicators

### Customer Management
- `GET /api/leads/customerInfo` - Customer information
- `POST /api/reports/*` - Generate reports

### Utilities
- `GET /health` - Health check endpoint

## 🔒 Security Guidelines

### Environment Variables
- Never commit `.env` files
- Use strong, unique secrets
- Rotate credentials regularly
- Use environment-specific configurations

### Input Validation
- All user inputs are validated and sanitized
- Email format validation
- Phone number validation
- PAN card format validation
- File size limits enforced

### Rate Limiting
- General API: 100 requests per 15 minutes
- Form submissions: 5 requests per 15 minutes
- IP-based tracking

### Error Handling
- Production errors don't expose internal details
- All errors are logged with timestamps
- Graceful degradation for email failures

## 📊 Monitoring

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### Logging
- Request/response logging
- Error logging with stack traces (dev only)
- Email delivery status logging

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Checklist
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Health checks working
- [ ] Monitoring setup

## 🔧 Development

### Code Style
- Use consistent naming conventions
- Validate all inputs
- Handle errors gracefully
- Log important events
- Write secure code

### Testing
```bash
# Run tests (when implemented)
npm test
```

## 📝 API Documentation

### Request Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

## 🤝 Contributing

1. Follow security guidelines
2. Validate all inputs
3. Handle errors properly
4. Add appropriate logging
5. Test thoroughly

## 📄 License

ISC License - See LICENSE file for details.

## 🆘 Support

For support and questions:
- Check logs for error details
- Verify environment configuration
- Test database connectivity
- Review API documentation