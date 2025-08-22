# 🚀 VPS Deployment Checklist for Pikapika Cleaning System

## ✅ **COMPLETED FIXES**
- [x] Removed all hardcoded `localhost:8888` URLs from frontend components
- [x] Updated backend CORS to restrict origins to VPS IP and localhost
- [x] Fixed port configuration (Backend: 3001, Frontend: 3000)
- [x] Updated test scripts to use correct port
- [x] Created VPS deployment configuration guide

## 🔧 **VPS SERVER SETUP**

### 1. **Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. **Database Setup**
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE pikapika_cleaning;
CREATE USER pikapika_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE pikapika_cleaning TO pikapika_user;
\q
```

### 3. **Environment Files**

#### **Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=http://162.43.30.178:3001
```

#### **Backend (.env)**
```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_USER=pikapika_user
DB_HOST=localhost
DB_NAME=pikapika_cleaning
DB_PASSWORD=your_secure_password
DB_PORT=5432
DATABASE_URL=postgresql://pikapika_user:your_secure_password@localhost:5432/pikapika_cleaning?schema=public

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=your_service_account_email
GOOGLE_CLOUD_CLIENT_ID=your_client_id
GOOGLE_CLOUD_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_CLOUD_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_CLOUD_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your_service_account_email

# LINE Messaging API (Optional)
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
```

## 🚀 **DEPLOYMENT STEPS**

### 1. **Clone Repository**
```bash
git clone <your-github-repo-url>
cd pikapika-cleaning-system
```

### 2. **Frontend Deployment**
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start with PM2
pm2 start npm --name "pikapika-frontend" -- start
pm2 save
pm2 startup
```

### 3. **Backend Deployment**
```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start with PM2
pm2 start server.js --name "pikapika-backend"
pm2 save
pm2 startup
```

### 4. **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/pikapika
server {
    listen 80;
    server_name 162.43.30.178;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. **Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/pikapika /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 **SECURITY CHECKLIST**
- [ ] Firewall configured (UFW)
- [ ] SSH key authentication only
- [ ] Environment variables secured
- [ ] Database user has minimal privileges
- [ ] HTTPS/SSL certificate installed (Let's Encrypt)
- [ ] Regular security updates enabled

## 📊 **MONITORING**
```bash
# Check PM2 status
pm2 status
pm2 logs

# Check nginx status
sudo systemctl status nginx

# Check database
sudo -u postgres psql -d pikapika_cleaning -c "SELECT version();"
```

## 🌐 **ACCESS URLs**
- **Frontend**: http://162.43.30.178:3000
- **Backend API**: http://162.43.30.178:3001
- **Database**: localhost:5432 (internal only)

## 🚨 **TROUBLESHOOTING**
- **Port conflicts**: Check `netstat -tlnp | grep :300`
- **Permission issues**: Check file ownership and nginx user
- **Database connection**: Verify DATABASE_URL and PostgreSQL status
- **CORS errors**: Check backend CORS configuration

## 📝 **POST-DEPLOYMENT**
- [ ] Test all user roles (Staff, Branch, Client, HQ)
- [ ] Verify image uploads work
- [ ] Test LINE notifications (if configured)
- [ ] Monitor error logs
- [ ] Set up backup strategy
- [ ] Document any custom configurations
