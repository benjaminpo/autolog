# MongoDB Atlas Production Connection Troubleshooting

## 🚨 Current Issue: DNS Resolution Error

You're getting this error in production:
```
Error in MongoDB connection: [Error: querySrv ENOTFOUND _mongodb._tcp.your-cluster.mongodb.net]
```

This is a **DNS lookup failure** for your MongoDB Atlas cluster.

## 🔍 Root Cause Analysis

Based on your config, you may have different MongoDB clusters:
1. **Production cluster**: `your-cluster.mongodb.net`
2. **Backup cluster**: `your-backup-cluster.mongodb.net`

This suggests your `MONGODB_URI` environment variable in Vercel is either:
- Not set (using fallback)
- Set to the wrong/invalid connection string

## 🛠️ Step-by-Step Fix

### Step 1: Check Your MongoDB Atlas Cluster

1. **Login to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Go to your project**
3. **Click on your cluster** (should be named something like "vehicle-expense-tracker")
4. **Click "Connect"** → **"Connect your application"**
5. **Copy the connection string** - it should look like:
   ```
   mongodb+srv://<username>:<password>@your-cluster.mongodb.net/?retryWrites=true&w=majority&appName=your-app-name
   ```

### Step 2: Verify Vercel Environment Variables

**Check Current Environment Variables:**
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Check environment variables
vercel env ls
```

**Set the Correct MongoDB URI:**
```bash
# Remove old MONGODB_URI if it exists
vercel env rm MONGODB_URI

# Add the correct MONGODB_URI
vercel env add MONGODB_URI
# When prompted, paste your MongoDB Atlas connection string
```

### Step 3: MongoDB Atlas Network Access

**Check IP Whitelist:**
1. In MongoDB Atlas, go to **Network Access**
2. Make sure you have one of these:
   - `0.0.0.0/0` (allow all IPs) - **Recommended for Vercel**
   - Specific Vercel IP ranges (complex, not recommended)

**If you need to add 0.0.0.0/0:**
1. Click **"Add IP Address"**
2. Click **"Allow Access from Anywhere"**
3. Click **"Confirm"**

### Step 4: MongoDB Atlas Database User

**Verify Database User:**
1. Go to **Database Access** in MongoDB Atlas
2. Make sure your user has **Read and write to any database** permissions
3. Note the username and password

### Step 5: Connection String Format

Your connection string should be in this format:
```
mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority&appName=<app-name>
```

**Example:**
```
mongodb+srv://myuser:mypassword@your-cluster.mongodb.net/your-database?retryWrites=true&w=majority&appName=YourAppName
```

## 🔧 Quick Diagnostic Commands

### Test MongoDB Connection Locally
```bash
# Test with Node.js
node -e "
const { MongoClient } = require('mongodb');
const uri = 'your_mongodb_uri_here';
MongoClient.connect(uri)
  .then(client => {
    console.log('✅ Connected successfully');
    client.close();
  })
  .catch(err => console.error('❌ Connection failed:', err));
"
```

### Check DNS Resolution
```bash
# Test DNS resolution (replace with your cluster hostname)
nslookup your-cluster.mongodb.net
```

## 🐛 Common Issues & Solutions

### 1. Wrong Connection String
**Problem**: Using old/invalid connection string
**Solution**: Get fresh connection string from MongoDB Atlas

### 2. Environment Variables Not Set
**Problem**: `MONGODB_URI` not set in Vercel
**Solution**: Set environment variable correctly

### 3. Network Access Restrictions
**Problem**: Vercel IPs blocked by MongoDB Atlas
**Solution**: Allow all IPs (0.0.0.0/0) in Network Access

### 4. Database User Permissions
**Problem**: User doesn't have proper database access
**Solution**: Grant "Read and write to any database" permissions

### 5. DNS Propagation Issues
**Problem**: New cluster DNS not propagated
**Solution**: Wait 5-10 minutes, or use connection string IP

## 📋 Environment Variables Checklist

Make sure these are set in your Vercel project:

```bash
# Required MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Required NextAuth
NEXTAUTH_URL=https://autolog.vercel.app
NEXTAUTH_SECRET=your-secret-key

# Optional Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🚀 Quick Fix Commands

### Option 1: Use Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/update `MONGODB_URI` with correct connection string

### Option 2: Use Vercel CLI
```bash
# Set MongoDB URI
vercel env add MONGODB_URI production
# Paste your connection string when prompted

# Redeploy to apply changes
vercel --prod
```

## 🔍 Verification Steps

After fixing the connection string:

1. **Redeploy your app**:
   ```bash
   vercel --prod
   ```

2. **Check logs**:
   ```bash
   vercel logs --follow
   ```

3. **Test connection**: Visit your app and try to use features that require database access

## 📊 Monitoring MongoDB Connections

### MongoDB Atlas Monitoring
1. Go to your cluster in MongoDB Atlas
2. Click **"Metrics"** tab
3. Monitor **"Connections"** and **"Operations"** charts

### Vercel Function Logs
```bash
# View real-time logs
vercel logs --follow

# View specific function logs
vercel logs --follow --scope=<function-name>
```

## 🆘 Emergency Backup Solution

If you can't fix the connection immediately, temporarily use the fallback cluster:

1. **Update your config** to use the working cluster
2. **Deploy the fix**
3. **Fix the main cluster** connection later

## 📞 Additional Resources

- [MongoDB Atlas Troubleshooting](https://docs.atlas.mongodb.com/troubleshoot-connection/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [MongoDB Connection String Reference](https://docs.mongodb.com/manual/reference/connection-string/)

---

**Most likely fix**: Set the correct `MONGODB_URI` environment variable in Vercel with your proper MongoDB Atlas connection string! 