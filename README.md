# 🧹 Pikapika Cleaning Management System

A comprehensive web-based cleaning management system built with Next.js, React, and Node.js for managing cleaning records, receipts, and facility operations across multiple companies and branches.

## ✨ Features

### 🔐 **Authentication & Authorization**
- **Multi-role System**: HQ President, Branch President, Staff, and Client roles
- **Secure JWT Authentication**: Token-based authentication with automatic validation
- **Route Protection**: Middleware-based protection for all dashboard routes
- **Automatic Redirects**: Unauthenticated users redirected to login page

### 🏢 **Company Management**
- **Hierarchical Structure**: HQ → Branch → Facility → Room organization
- **Company Registration**: Support for headquarter and branch companies
- **Individual Registration**: Staff and president registration with company association
- **Client Registration**: Facility-based client registration system

### 📸 **Image Management**
- **Before/After Cleaning Photos**: Comprehensive photo documentation system
- **Image Upload**: Drag & drop, multiple file selection
- **Image Viewer**: High-resolution image viewing with zoom and navigation
- **Image Organization**: Hierarchical organization by facility, date, room, and cleaning state
- **Batch Operations**: Bulk image deletion and management

### 🧾 **Receipt Management**
- **Receipt Upload**: Multiple receipt image upload support
- **Monthly Organization**: Receipts organized by month for easy tracking
- **Receipt Viewer**: High-quality receipt viewing with zoom capabilities
- **Receipt Search**: Easy navigation through receipt archives

### 💬 **Communication System**
- **Internal Chat**: Real-time messaging between staff members
- **Notification System**: LINE integration for automated notifications
- **Message History**: Persistent chat history and unread message tracking

### 📊 **Dashboard Features**
- **HQ Dashboard**: Company-wide overview and management
- **Branch Dashboard**: Branch-specific operations and monitoring
- **Staff Dashboard**: Cleaning task management and photo uploads
- **Client Dashboard**: Facility-specific cleaning record viewing

### 🎨 **Modern UI/UX**
- **Responsive Design**: Mobile-first responsive design
- **Gradient Themes**: Beautiful gradient-based color schemes
- **Smooth Animations**: CSS transitions and hover effects
- **Loading States**: Comprehensive loading indicators and progress bars

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Google Cloud Storage (for image storage)
- LINE Messaging API credentials (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pikapika-cleaning-system
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Frontend (.env.local)
   NEXT_PUBLIC_API_URL=http://localhost:8888
   
   # Backend (.env)
   DATABASE_URL="postgresql://username:password@localhost:5432/pikapika_cleaning"
   JWT_SECRET="your-jwt-secret-key"
   GOOGLE_CLOUD_PROJECT_ID="your-gcp-project-id"
   GOOGLE_CLOUD_BUCKET_NAME="your-gcs-bucket-name"
   LINE_CHANNEL_ID="your-line-channel-id"
   LINE_CHANNEL_SECRET="your-line-channel-secret"
   LINE_ACCESS_TOKEN="your-line-access-token"
   ```

4. **Database Setup**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the application**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm start
   
   # Terminal 2: Start frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8888

## 🏗️ **System Architecture**

### **Frontend (Next.js 14)**
```
app/
├── hq-dashboard/          # HQ President Dashboard
├── branch-dashboard/      # Branch President Dashboard  
├── staff-dashboard/       # Staff Dashboard
├── client-dashboard/      # Client Dashboard
├── company-register/      # Company Registration
├── individual-register/   # Staff Registration
├── client-register/       # Client Registration
└── components/            # Reusable UI Components
```

### **Backend (Node.js + Express)**
```
backend/
├── routes/
│   ├── auth.js           # Authentication & User Management
│   └── middleware/
│       └── auth.js       # JWT Authentication Middleware
├── services/
│   └── lineService.js    # LINE Notification Service
├── config/
│   └── storage.js        # Google Cloud Storage Configuration
└── prisma/
    └── schema.prisma     # Database Schema
```

### **Database Schema (PostgreSQL)**
- **Users**: Multi-role user management
- **Companies**: Company hierarchy and information
- **Facilities**: Facility details and relationships
- **CleaningRecords**: Cleaning operation records
- **Images**: Image metadata and storage references
- **Receipts**: Receipt management and organization
- **LineNotifications**: LINE notification logging

## 🔧 **Configuration**

### **Google Cloud Storage**
- Configure GCS bucket for image storage
- Set up service account with appropriate permissions
- Configure CORS for web access

### **LINE Messaging API**
- Create LINE Official Account
- Configure webhook endpoints
- Set up channel credentials

### **Database**
- PostgreSQL with proper indexing
- Connection pooling configuration
- Backup and recovery procedures

## 📱 **Usage Guide**

### **For HQ Presidents**
1. **Login** with HQ credentials
2. **View Company Overview** across all branches
3. **Monitor Cleaning Records** from all facilities
4. **Manage Receipts** for all facilities
5. **Generate Reports** and analytics

### **For Branch Presidents**
1. **Login** with branch credentials
2. **View Branch Facilities** and their status
3. **Monitor Staff Activities** and cleaning progress
4. **Manage Receipts** for branch facilities
5. **Communicate** with HQ and staff

### **For Staff Members**
1. **Login** with staff credentials
2. **Select Facility** for cleaning operations
3. **Upload Before Photos** of cleaning areas
4. **Perform Cleaning** tasks
5. **Upload After Photos** for verification
6. **Submit Reports** with photo documentation

### **For Clients**
1. **Login** with facility credentials
2. **View Cleaning Records** for their facility
3. **Access Receipts** and documentation
4. **Monitor Cleaning Quality** through photos

## 🛡️ **Security Features**

- **JWT Token Authentication**: Secure token-based authentication
- **Route Protection**: Middleware-based route security
- **Input Validation**: Comprehensive input sanitization
- **CORS Configuration**: Proper cross-origin resource sharing
- **Environment Variables**: Secure configuration management

## 📊 **Performance Features**

- **Image Optimization**: Next.js Image component optimization
- **Lazy Loading**: Progressive image loading
- **Caching**: Efficient data caching strategies
- **Database Indexing**: Optimized database queries
- **CDN Integration**: Google Cloud Storage CDN

## 🔄 **API Endpoints**

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/logout` - User logout

### **Company Management**
- `GET /api/auth/companies` - List companies
- `POST /api/auth/companies` - Create company
- `GET /api/auth/companies/:id/facilities` - Company facilities

### **Image Management**
- `POST /api/auth/cleaning-images/upload` - Upload cleaning images
- `GET /api/auth/cleaning-images` - Get cleaning images
- `DELETE /api/auth/cleaning-images/batch-delete` - Batch delete images

### **Receipt Management**
- `POST /api/auth/facilities/:id/receipts` - Upload receipts
- `GET /api/auth/facilities/:id/receipts` - Get facility receipts

## 🧪 **Testing**

```bash
# Run frontend tests
npm test

# Run backend tests
cd backend
npm test

# Run E2E tests
npm run test:e2e
```

## 📦 **Deployment**

### **Frontend (Vercel)**
```bash
npm run build
vercel --prod
```

### **Backend (Google Cloud Run)**
```bash
cd backend
gcloud run deploy pikapika-backend
```

### **Database (Cloud SQL)**
- Use Google Cloud SQL for PostgreSQL
- Configure connection pooling
- Set up automated backups

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: Check the docs folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

## 🔮 **Roadmap**

- [ ] **Mobile App**: React Native mobile application
- [ ] **Advanced Analytics**: Business intelligence dashboard
- [ ] **AI Integration**: Automated cleaning quality assessment
- [ ] **Multi-language**: Internationalization support
- [ ] **API Documentation**: Swagger/OpenAPI documentation
- [ ] **Performance Monitoring**: Application performance monitoring
- [ ] **Automated Testing**: Comprehensive test coverage

## 📈 **System Requirements**

### **Minimum Requirements**
- **Frontend**: Modern browser with ES6+ support
- **Backend**: Node.js 18+, 2GB RAM, 10GB storage
- **Database**: PostgreSQL 14+, 4GB RAM, 20GB storage

### **Recommended Requirements**
- **Frontend**: Chrome 90+, Firefox 88+, Safari 14+
- **Backend**: Node.js 20+, 4GB RAM, 20GB storage
- **Database**: PostgreSQL 15+, 8GB RAM, 50GB storage

---

**Built with ❤️ by the Pikapika Development Team**

*Last updated: January 2025*
