# 🇯🇵 Japanese Timezone (JST) Setup Guide

This guide explains how to set up and use the Japanese timezone system for the cleaning company application.

## 🌏 Timezone Information

- **JST (Japanese Standard Time)**: UTC+9 hours
- **Used by**: Japan, South Korea, and parts of Russia
- **Business hours**: Typically 9:00 AM - 6:00 PM JST

## 🚀 Quick Setup

### 1. Run the Japanese Timezone Setup Script

```bash
cd backend
node scripts/setup-japanese-timezone.js
```

This script will:
- Test timezone conversion
- Check database configuration
- Verify timestamp creation
- Provide setup instructions

### 2. Fix Existing Timestamps (if any)

If you have existing data with incorrect timestamps:

```bash
cd backend
node scripts/fix-timestamps.js
```

This will convert all UTC timestamps to JST.

### 3. Restart the Backend Server

```bash
npm start
```

## 🔧 How It Works

### Backend Timezone Handling

1. **Automatic Conversion**: The Prisma client automatically converts all timestamps to JST
2. **Database Storage**: Timestamps are stored in UTC (PostgreSQL standard)
3. **API Responses**: All timestamps are automatically converted to JST before sending to frontend
4. **New Records**: New records use `nowJst()` for proper JST timestamps

### Frontend Timezone Handling

1. **Import Utilities**: Use the Japanese date utilities from `lib/japanese-date.ts`
2. **Automatic Display**: All dates from the API are already in JST
3. **Formatting**: Use Japanese date formatting functions for display

## 📅 Available Date Functions

### Backend (`backend/utils/timezone.js`)

```javascript
const { nowJst, toJst, formatJapaneseDate } = require('../utils/timezone');

// Get current time in JST
const currentTime = nowJst();

// Convert any date to JST
const jstDate = toJst(someDate);

// Format date in Japanese
const japaneseDate = formatJapaneseDate(someDate);
```

### Frontend (`lib/japanese-date.ts`)

```typescript
import { 
  formatJapaneseDate, 
  formatJapaneseShortDate,
  getRelativeTimeJapanese 
} from '@/lib/japanese-date';

// Format full date: 2024年01月15日 14:30
const fullDate = formatJapaneseDate(someDate);

// Format short date: 01月15日
const shortDate = formatJapaneseShortDate(someDate);

// Relative time: 3時間前, 昨日, 先週
const relativeTime = getRelativeTimeJapanese(someDate);
```

## 🗄️ Database Tables with Timestamps

The following tables automatically handle JST timestamps:

- **users**: `created_at`, `updated_at`
- **companies**: `created_at`, `updated_at`
- **facilities**: `created_at`, `updated_at`
- **cleaning_images**: `uploaded_at`, `updated_at`
- **cleaning_records**: `created_at`, `updated_at`
- **client_applications**: `created_at`, `updated_at`

## 🧪 Testing the System

### Test Client Registration

1. Register a new client with a facility ID
2. Check that a facility record is created in the `facilities` table
3. Verify timestamps are in JST (UTC+9)

### Test Timestamp Display

1. Check any date fields in the UI
2. Verify they show Japanese time (not 9 hours behind)
3. Use browser dev tools to check API responses

## 🔍 Troubleshooting

### Timestamps Still Showing UTC

1. **Check Prisma Middleware**: Ensure `backend/config/prisma.js` is properly configured
2. **Restart Server**: Restart the backend after configuration changes
3. **Clear Cache**: Clear browser cache and reload

### Database Timezone Issues

1. **PostgreSQL Configuration**: Consider setting `timezone = 'Asia/Tokyo'` in `postgresql.conf`
2. **Connection String**: Add `?options=-c%20timezone=Asia/Tokyo` to DATABASE_URL
3. **Application Level**: The current solution handles this at the application level

### Frontend Date Display Issues

1. **Import Utilities**: Ensure Japanese date utilities are imported
2. **API Response**: Check that API returns JST timestamps
3. **Date Objects**: Ensure dates are properly converted before display

## 📋 Best Practices

1. **Always Use Utilities**: Use `nowJst()` for new timestamps
2. **Consistent Formatting**: Use Japanese date formatting functions
3. **Timezone Awareness**: Remember that JST = UTC+9
4. **Testing**: Test with different times to ensure proper conversion

## 🌟 Features

- ✅ **Automatic JST Conversion**: All timestamps automatically converted
- ✅ **Japanese Date Formatting**: Proper Japanese date display
- ✅ **Relative Time**: Human-readable time differences in Japanese
- ✅ **Database Consistency**: All tables use consistent timezone handling
- ✅ **Frontend Integration**: Easy-to-use utilities for date display

## 🔗 Related Files

- `backend/utils/timezone.js` - Backend timezone utilities
- `backend/config/prisma.js` - Prisma client with timezone middleware
- `lib/japanese-date.ts` - Frontend date utilities
- `backend/scripts/setup-japanese-timezone.js` - Setup script
- `backend/scripts/fix-timestamps.js` - Timestamp fix script

## 📞 Support

If you encounter issues with the timezone system:

1. Check the console logs for error messages
2. Verify the Prisma middleware is working
3. Test with the setup script
4. Check database connection and configuration

---

**🇯🇵 このシステムは日本の清掃会社向けに設計されており、日本標準時（JST）で動作します。**
