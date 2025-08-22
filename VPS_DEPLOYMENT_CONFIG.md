# VPS Deployment Configuration for IP: 162.43.30.178

## Environment Variables Setup

### 1. Frontend Environment (`.env.local`)
```bash
# API URL pointing to your VPS backend
NEXT_PUBLIC_API_URL=http://162.43.30.178:3001

# Optional: Use HTTPS if you have SSL certificate
# NEXT_PUBLIC_API_URL=https://162.43.30.178:3001
```

### 2. Backend Environment (`backend/.env`)
```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=pikapika_cleaning
DB_PASSWORD=your_actual_password
DB_PORT=5432
DATABASE_URL=postgresql://postgres:your_actual_password@localhost:5432/pikapika_cleaning?schema=public

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_BUCKET_NAME=your_bucket_name
GOOGLE_CLOUD_KEY_FILE=./service-account-key.json

# Frontend URL (for CORS) - Your VPS IP
FRONTEND_URL=http://162.43.30.178:3000

# LINE Configuration (optional)
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_access_token
```

## VPS Firewall Configuration

```bash
# Open required ports on your VPS
sudo ufw allow 3001  # Backend API
sudo ufw allow 3000  # Frontend (if running on VPS)
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 22    # SSH (keep this open)
sudo ufw enable
sudo ufw status
```

## Deployment Commands

### Backend Deployment
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm start
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Testing Global Access

### From another device, test:
```bash
# Test backend health
curl http://162.43.30.178:3001/api/health

# Test frontend loads
curl http://162.43.30.178:3000
```

## Security Notes

1. **CORS**: Now restricted to your VPS IP and localhost only
2. **Ports**: Backend runs on 3001, Frontend on 3000
3. **Database**: Ensure PostgreSQL is accessible from your backend
4. **SSL**: Consider adding HTTPS with Let's Encrypt for production

## Quick Start

1. Create `backend/.env` with the above variables
2. Create `.env.local` in root with `NEXT_PUBLIC_API_URL=http://162.43.30.178:3001`
3. Open ports 3001 and 3000 on VPS
4. Start backend: `cd backend && npm start`
5. Start frontend: `npm start`
6. Access from anywhere: `http://162.43.30.178:3000`
