# Pikapika Cleaning System - Backend

Complete Express.js backend with authentication, PostgreSQL database, and Google Cloud Storage integration.

## Features

- **Authentication System**: JWT-based authentication with role-based access control
- **User Management**: Company-side and client-side user registration
- **Database**: PostgreSQL with automatic table creation
- **Image Storage**: Google Cloud Storage integration for large image files
- **Security**: Password hashing, rate limiting, CORS, and helmet security
- **Validation**: Input validation using express-validator

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# Server Configuration
PORT=8888
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=pikapika_cleaning
DB_PASSWORD=your_actual_password
DB_PORT=5432
# Prisma requires a single connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public
DATABASE_URL=postgresql://postgres:your_actual_password@localhost:5432/pikapika_cleaning?schema=public

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_BUCKET_NAME=your_bucket_name
GOOGLE_CLOUD_KEY_FILE=path/to/your/service-account-key.json

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. PostgreSQL Setup

1. Install PostgreSQL
2. Create database:
```sql
CREATE DATABASE pikapika_cleaning;
```

### 4. Google Cloud Storage Setup

1. Create a Google Cloud Project
2. Enable Cloud Storage API
3. Create a service account and download JSON key file
4. Create a storage bucket
5. Update environment variables

### 5. Run the Backend

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### 6. Prisma (Optional but recommended)

This project includes a Prisma schema mirroring the existing tables. To generate the Prisma Client, push the schema, and seed initial data:

```bash
cd backend
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Company Registration
- **POST** `/register/company-info` - Register a new company
- **POST** `/register/company` - Register company-side users (HQ President, Branch President, Staff)

#### Client Registration
- **POST** `/register/client` - Register client users

#### Authentication
- **POST** `/login` - User login
- **POST** `/change-password` - Change password (authenticated)
- **GET** `/me` - Get current user info (authenticated)

### Protected Routes

All routes except authentication routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Database Schema

### Tables

1. **companies** - Company information
2. **users** - User accounts (company-side and client-side)
3. **facilities** - Cleaning facilities
4. **cleaning_records** - Cleaning history with before/after images
5. **client_applications** - Client cleaning requests

### Key Relationships

- Users belong to companies (company-side users)
- Facilities belong to companies
- Cleaning records are linked to facilities and staff
- Client applications link clients to facilities

## Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: 24-hour expiration
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable origin
- **Input Validation**: Comprehensive validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **Helmet Security**: Various HTTP security headers

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message in Japanese",
  "errors": [] // For validation errors
}
```

## Development

### File Structure

```
backend/
├── config/
│   ├── database.js      # PostgreSQL configuration
│   └── storage.js       # Google Cloud Storage setup
├── middleware/
│   └── auth.js          # Authentication middleware
├── routes/
│   └── auth.js          # Authentication routes
├── server.js            # Main server file
├── package.json         # Dependencies
└── README.md           # This file
```

### Adding New Routes

1. Create route file in `routes/` directory
2. Import and use in `server.js`
3. Apply `authenticateToken` middleware for protected routes
4. Use `authorizeRole()` for role-based access control

### Database Queries

Use Prisma via `config/prisma.js`:

```javascript
const { prisma } = require('../config/prisma');
const user = await prisma.user.findUnique({ where: { id: userId } });
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure SSL for database
4. Set up proper CORS origins
5. Use environment-specific database credentials
6. Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **Database Connection**: Check PostgreSQL service and credentials
2. **JWT Errors**: Verify JWT_SECRET is set
3. **CORS Issues**: Check FRONTEND_URL configuration
4. **Image Upload**: Verify Google Cloud credentials and bucket permissions

### Logs

Check console output for detailed error messages and connection status.
