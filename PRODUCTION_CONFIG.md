# Production Configuration for Vehicle Expense Tracker

## MongoDB Database Connection
- **Connection String**: mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=YourAppName
- **Username**: your-mongodb-username
- **Password**: your-mongodb-password
- **Database Name**: vehicle_expense_tracker_prod

## Environment Files
- `.env.production`: Contains production environment variables

## Docker Configuration
- `Dockerfile`: Multi-stage build for optimized Node.js application
- `docker-compose.production.yml`: Production Docker Compose configuration

## Deployment
- Use `./deploy-production.sh` for automated deployment
- The application will be available at port 3000 by default

## 🔒 Security Requirements (CRITICAL)

**⚠️ IMPORTANT**: This file previously contained exposed MongoDB credentials. All actual credentials have been removed for security.

### Before Deployment:
1. **Set Environment Variables**: Create `.env.production` with your actual credentials
2. **Rotate All Credentials**: Change all passwords and secrets if they were previously exposed
3. **Verify No Hardcoded Secrets**: Ensure no actual credentials remain in any files
4. **Use Secure Values**: Generate strong, unique passwords for all services

### Required Environment Variables:
```env
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database?retryWrites=true&w=majority&appName=YourAppName
NEXTAUTH_SECRET=your-secure-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Security Best Practices:
- Generate NextAuth secret: `openssl rand -base64 32`
- Use MongoDB Atlas IP whitelist (0.0.0.0/0 for Vercel)
- Enable HTTPS in production
- Regular credential rotation
- Use secrets management services for enterprise deployments

### MongoDB Atlas Setup:
1. Create new database user with secure password
2. Get connection string from Atlas dashboard
3. Replace placeholder values with actual credentials
4. Test connection before deployment

## Performance Considerations
- The application is configured to use Next.js standalone output for better container performance
- Connection pooling is enabled for MongoDB connections

## Monitoring
- Docker logs are available via: `docker-compose -f docker-compose.production.yml logs -f`
- Consider setting up external monitoring for production deployments
