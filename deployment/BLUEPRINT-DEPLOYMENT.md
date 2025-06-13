# 🚀 SolariHub Blueprint Deployment Guide

## 📋 **Configuration Overview**

Your `render.yaml` is configured for production deployment with:

- **Service Name**: `solarihub-backend-api`
- **Custom Domain**: `api.app.solarihub.net`
- **Region**: Frankfurt (EU Central)
- **Runtime**: Docker with multi-stage build
- **Auto-Deploy**: Enabled on every push to main

---

## 🎯 **Step-by-Step Blueprint Deployment**

### **Step 1: Commit Configuration**
```bash
# Your render.yaml is already configured - commit the changes
git add render.yaml apps/frontend/vercel.json
git commit -m "configure production Blueprint deployment with custom domain and environment variables"
git push origin main
```

### **Step 2: Access Render Dashboard**
1. **Go to**: [render.com](https://render.com)
2. **Sign in** with your GitHub account
3. **Ensure Render has access** to `vessel-net/SolariHub-v4.1` repository

### **Step 3: Create Blueprint**
1. **Click "New +"** (top right corner)
2. **Select "Blueprint"** (NOT Web Service)
3. **Choose Repository**: `vessel-net/SolariHub-v4.1`
4. **Select Branch**: `main`
5. **Render automatically detects** your `render.yaml` file

### **Step 4: Review Blueprint Configuration**
Render will show your configuration:
```yaml
✅ Service: solarihub-backend-api
✅ Type: Web Service  
✅ Runtime: Docker
✅ Dockerfile: ./deployment/docker/Dockerfile.backend
✅ Region: Frankfurt
✅ Plan: Starter
✅ Custom Domain: api.app.solarihub.net
✅ Health Check: /api
✅ Auto Deploy: Yes
```

### **Step 5: Configure Environment Variables**
**CRITICAL**: You must add the secret values manually in Render:

```bash
# After Blueprint creation, go to Environment tab and add:
ENODE_CLIENT_SECRET = [your_enode_client_secret]
JWT_SECRET = [your_jwt_secret_key]
MONGODB_URI = [your_mongodb_connection_string]
PINATA_JWT = [your_pinata_jwt_token]
RECAPTCHA_SECRET_KEY = [your_recaptcha_secret]
SENDGRID_API_KEY = [your_sendgrid_api_key]
SENTRY_DSN = [your_sentry_dsn_url]

# These are already configured in render.yaml:
✅ NODE_ENV = production
✅ PORT = 4000
✅ FRONTEND_URL = https://app.solarihub.net
✅ FROM_EMAIL = no-reply@solarihub.net
```

### **Step 6: Deploy**
1. **Click "Apply"** to create the Blueprint
2. **Render will start building** immediately
3. **Monitor build progress** in the service dashboard

---

## 🔧 **Custom Domain Setup**

### **DNS Configuration Required**
You need to configure your DNS for `api.app.solarihub.net`:

1. **In Render Dashboard**:
   - Go to your service → **Settings** → **Custom Domains**
   - Domain should show: `api.app.solarihub.net`
   - Note the **CNAME target** (e.g., `solarihub-backend-api.onrender.com`)

2. **In Your DNS Provider** (e.g., Cloudflare, Namecheap):
   ```
   Type: CNAME
   Name: api.app
   Target: solarihub-backend-api.onrender.com
   TTL: Auto or 300
   ```

3. **SSL Certificate**:
   - Render automatically provisions SSL
   - May take 5-15 minutes after DNS propagation

---

## 📊 **Expected Build Process**

### **Build Timeline:**
```
⏰ Repository Clone: 30 seconds
⏰ Docker Build Stage 1 (Builder): 4-6 minutes
   ├── Install 987+ packages
   ├── Build Nx backend
   └── Optimize bundle
⏰ Docker Build Stage 2 (Production): 1-2 minutes
   ├── Copy built application
   ├── Install runtime dependencies
   └── Configure health checks
⏰ Deploy & Health Check: 30-60 seconds
⏰ Total Time: 6-9 minutes
```

### **Successful Build Indicators:**
```bash
✅ "Building with Docker"
✅ "RUN npx nx build backend" → Success
✅ "Health check passed"
✅ "Deploy live"
✅ Service shows "Live" status
```

---

## 🧪 **Testing Your Deployment**

### **1. Health Check**
```bash
curl https://api.app.solarihub.net/api
# Expected: {"message": "Welcome to api!"}
```

### **2. Environment Variables Test**
```bash
# Test that environment variables are loaded
curl https://api.app.solarihub.net/api/health
# Should return 200 OK with environment info
```

### **3. Frontend Integration**
Your frontend will automatically use:
```javascript
// Configured in vercel.json
VITE_API_URL = "https://api.app.solarihub.net"
```

---

## 🔍 **Environment Variables Details**

### **Auto-Configured (via render.yaml):**
```yaml
✅ NODE_ENV=production          # Runtime environment
✅ PORT=4000                    # Service port
✅ FRONTEND_URL=https://app.solarihub.net  # CORS origin
✅ FROM_EMAIL=no-reply@solarihub.net       # Email sender
```

### **Manual Configuration Required:**
```yaml
🔐 ENODE_CLIENT_SECRET     # Energy data API credentials
🔐 JWT_SECRET              # Authentication token signing
🔐 MONGODB_URI            # Database connection string
🔐 PINATA_JWT              # IPFS storage for blockchain data
🔐 RECAPTCHA_SECRET_KEY    # Anti-bot protection
🔐 SENDGRID_API_KEY        # Email service
🔐 SENTRY_DSN             # Error monitoring
```

**Note**: Variables marked with `sync: false` won't sync from your local `.env` - you must add them manually in Render dashboard for security.

---

## 🛠️ **Troubleshooting**

### **Blueprint Not Detected:**
```bash
# Ensure render.yaml is in repository root
ls -la render.yaml

# Check file syntax
cat render.yaml | head -10
```

### **Build Fails:**
```bash
# Check build logs for:
1. Docker build stages completing
2. "npx nx build backend" success
3. No missing dependencies
4. Proper file paths
```

### **Environment Variables Missing:**
```bash
# Go to service → Environment tab
# Verify all required variables are set
# Check for typos in variable names
```

### **Custom Domain Issues:**
```bash
# Verify DNS configuration:
dig api.app.solarihub.net

# Should show CNAME pointing to:
# solarihub-backend-api.onrender.com
```

---

## 🎯 **Success Checklist**

### **✅ Pre-Deployment:**
- [x] render.yaml configured with your settings
- [x] Environment variables planned
- [x] DNS provider access ready
- [x] Changes committed and pushed

### **✅ During Deployment:**
- [ ] Blueprint created successfully
- [ ] Build completes without errors
- [ ] Health check passes
- [ ] Service shows "Live" status

### **✅ Post-Deployment:**
- [ ] API responds at https://api.app.solarihub.net/api
- [ ] Custom domain SSL certificate active
- [ ] Environment variables properly loaded
- [ ] Frontend can connect to API
- [ ] Auto-deploy working on new commits

---

## 🚀 **Next Steps After Successful Deployment**

1. **✅ Verify API is live** and responding
2. **🔗 Test frontend integration** with new API URL
3. **📊 Monitor service** in Render dashboard
4. **🔄 Test auto-deployment** (push a small change)
5. **📈 Configure monitoring** (Sentry integration)
6. **🗄️ Connect MongoDB Atlas** and test database operations
7. **⛓️ Test blockchain integrations** (PINATA, ENODE)

Your production-grade SolariHub API is now ready for your cleantech application! 🌱⚡️🔗 