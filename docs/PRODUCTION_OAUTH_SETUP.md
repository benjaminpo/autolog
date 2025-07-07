# Production Google OAuth Setup Guide

## 🚨 Fixing "redirect_uri_mismatch" Error

This error occurs when your production URL is not registered in Google Cloud Console.

### Quick Fix Steps

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project
   - Navigate to **APIs & Services** → **Credentials**

2. **Update OAuth 2.0 Client**
   - Click on your OAuth 2.0 Client ID
   - Add these URIs to **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/callback/google
     https://autolog.vercel.app/api/auth/callback/google
     ```
   - Add these to **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://autolog.vercel.app
     ```

3. **Save and Wait**
   - Click **Save**
   - Wait 5-10 minutes for changes to propagate

## 🔧 Complete Production Setup Checklist

### Environment Variables on Vercel

Make sure these are set in your Vercel dashboard:

```bash
# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# NextAuth
NEXTAUTH_URL=https://autolog.vercel.app
NEXTAUTH_SECRET=your_secure_random_secret_32_chars_min

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Google Cloud Console Configuration

#### 1. OAuth 2.0 Client Settings
```
Application type: Web application
Name: Vehicle Expense Tracker (Production)

Authorized JavaScript origins:
- http://localhost:3000 (for development)
- https://autolog.vercel.app (for production)

Authorized redirect URIs:
- http://localhost:3000/api/auth/callback/google (for development)
- https://autolog.vercel.app/api/auth/callback/google (for production)
```

#### 2. APIs & Services
Ensure these APIs are enabled:
- Google Identity API
- Google+ API (if using profile information)

### NextAuth Configuration

Your current setup in `authOptions.ts` is correct. NextAuth automatically handles the redirect URI based on `NEXTAUTH_URL`.

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. Still getting redirect_uri_mismatch after updating
- **Wait longer**: Google can take up to 15 minutes to propagate changes
- **Clear browser cache**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- **Check exact URL match**: Ensure there are no trailing slashes or typos

#### 2. OAuth works locally but not in production
- **Check NEXTAUTH_URL**: Must match your production domain exactly
- **Verify environment variables**: All OAuth vars must be set in Vercel
- **Domain verification**: Ensure your domain is verified if required

#### 3. Users can't sign in with Google
- **Check OAuth consent screen**: Make sure it's configured and published
- **Verify scopes**: Ensure you have the minimum required scopes
- **Test mode**: If app is in testing mode, only test users can sign in

### Error Messages & Fixes

| Error | Cause | Solution |
|-------|-------|----------|
| `redirect_uri_mismatch` | Production URL not in Google Console | Add production URL to authorized redirect URIs |
| `unauthorized_client` | Client ID/Secret incorrect | Verify environment variables match Google Console |
| `access_denied` | User denied permission | Normal user behavior, handle gracefully |
| `invalid_request` | NEXTAUTH_URL incorrect | Set correct production URL in environment |

## 🔍 Verification Steps

After setup, test these scenarios:

### Development Testing
1. Visit: `http://localhost:3000/auth/login`
2. Click "Continue with Google"
3. Should redirect and authenticate successfully

### Production Testing
1. Visit: `https://autolog.vercel.app/auth/login`
2. Click "Continue with Google"
3. Should redirect and authenticate successfully

## 📋 Quick Commands

### Check Environment Variables (Vercel CLI)
```bash
vercel env ls
```

### View Logs for OAuth Issues
```bash
vercel logs --follow
```

### Test OAuth Callback URL
```bash
curl -I https://autolog.vercel.app/api/auth/callback/google
```

## 🛠️ Advanced Configuration

### Custom Domain Setup
If using a custom domain:

1. **Update Google Console** with your custom domain:
   ```
   https://your-custom-domain.com/api/auth/callback/google
   ```

2. **Update NEXTAUTH_URL**:
   ```bash
   NEXTAUTH_URL=https://your-custom-domain.com
   ```

### Multiple Environments
For staging/production environments:

1. **Create separate OAuth clients** for each environment
2. **Use different environment variables** per deployment
3. **Configure redirect URIs** for each domain

## 🚀 Production Deployment Best Practices

1. **Separate OAuth Clients**: Use different clients for dev/staging/production
2. **Environment-specific Secrets**: Never share secrets between environments
3. **Monitor OAuth Usage**: Check Google Cloud Console for usage analytics
4. **Regular Security Reviews**: Rotate secrets periodically
5. **Error Monitoring**: Set up alerts for OAuth failures

## 📞 Support Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth Google Provider Docs](https://next-auth.js.org/providers/google)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Remember**: After making changes in Google Cloud Console, always wait 5-10 minutes before testing! 