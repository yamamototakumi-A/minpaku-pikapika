# Client Registration and Login System Changes

## Overview
This document outlines the complete implementation of the new client registration and login system that allows clients to register and login using only their Facility ID and password, removing the need for User ID and Address fields.

## Changes Made

### 1. Frontend Changes

#### A. Client Registration Page (`app/client-register/page.tsx`)
- **Removed fields**: User ID and Address fields completely removed
- **Added fields**: Facility ID field only
- **Updated validation**: Now validates Facility ID, Password, and Confirm Password only
- **Updated form submission**: Sends only `facilityId`, `password`, and `confirmPassword`
- **Updated success message**: Shows only Facility ID in confirmation

#### B. Login Page (`app/page.tsx`)
- **Added login type toggle**: Users can switch between "会社・スタッフ" (Company/Staff) and "クライアント" (Client)
- **Dynamic field labels**: Shows "ユーザーID" for company users and "施設ID" for clients
- **Dynamic icons**: Shows User icon for company users and Building2 icon for clients
- **Updated login logic**: Sends either `userId` or `facilityId` based on selected login type

#### C. Client Dashboard (`app/client-dashboard/page.tsx`)
- **Complete rewrite**: Now matches the branch dashboard structure exactly
- **Single facility view**: Only shows data for the client's specific facility
- **Hierarchical display**: Shows cleaning records organized by year → month → day → room → before/after
- **Receipt management**: Includes receipt upload and viewing functionality
- **Image viewer**: Uses the same enhanced image viewer modal as staff dashboard
- **Removed features**: No bulk delete, no image selection (clients are view-only)

### 2. Backend Changes

#### A. Authentication Service (`lib/auth.ts`)
- **Updated interfaces**:
  - `LoginData`: Made `userId` optional, added `facilityId` optional
  - `RegisterData`: Added `facilityId` optional, made `address` optional
  - `User`: Added `facilityId` optional, made `address` optional
  - Added new `ClientRegisterData` interface
- **Updated methods**:
  - `registerClient()`: Now accepts `ClientRegisterData` instead of `RegisterData`
  - `login()`: Supports both `userId` and `facilityId` login

#### B. Backend API Routes (`backend/routes/auth.js`)

##### Client Registration Endpoint (`/register/client`)
- **Updated validation**: Now validates `facilityId`, `password`, `confirmPassword`
- **Facility uniqueness**: Checks if facility ID already exists for any client
- **Database storage**: Stores `facilityId` in separate field, generates unique `userId` as `client_${facilityId}`
- **Error handling**: Returns appropriate error messages for duplicate facility IDs

##### Login Endpoint (`/login`)
- **Flexible validation**: Accepts either `userId` or `facilityId`
- **Dual login support**: 
  - For `facilityId`: Searches for client users with matching facility ID
  - For `userId`: Searches for company users with matching user ID
- **Enhanced JWT**: Includes `facilityId` in token payload
- **Response enhancement**: Returns `facilityId` in user object

##### New Client-Specific Endpoints

###### `/client/hierarchy` (GET)
- **Authentication**: Requires client user token
- **Data scope**: Returns only cleaning images for the client's facility
- **Organization**: Groups images by year → month → day → room → before/after
- **Response format**: Matches branch dashboard hierarchy structure

###### `/client/receipts` (GET)
- **Authentication**: Requires client user token
- **Data scope**: Returns only receipts for the client's facility
- **Organization**: Groups receipts by month (YYYY-MM format)
- **Response format**: Returns receipts organized by month

###### `/client/receipts/upload` (POST)
- **Authentication**: Requires client user token
- **File upload**: Supports multiple receipt images (max 10 files)
- **Storage**: Uploads to GCS and stores in database
- **Association**: Automatically associates receipts with client's facility

#### C. Database Schema (`backend/prisma/schema.prisma`)
- **User model enhancement**: Added `facilityId` field (String, optional)
- **Index addition**: Added index on `facilityId` for performance
- **Migration required**: Database migration needed to add the new field

### 3. Key Features

#### A. Registration System
- **Simplified process**: Only 3 fields required (Facility ID, Password, Confirm Password)
- **Unique facility constraint**: Each facility can only have one client account
- **Automatic user ID generation**: Creates unique user ID internally
- **Password validation**: 8+ characters required

#### B. Login System
- **Dual login support**: Single login page supports both user types
- **Visual distinction**: Clear UI indicators for different login types
- **Automatic routing**: Redirects to appropriate dashboard based on user type
- **Secure authentication**: JWT tokens include user type and facility information

#### C. Dashboard Features
- **View-only access**: Clients cannot delete or modify cleaning images
- **Facility-specific data**: Only sees data for their registered facility
- **Receipt management**: Can upload and view facility receipts
- **Image viewing**: High-quality image viewer with zoom and navigation
- **Responsive design**: Works on all device sizes

### 4. Security Considerations

#### A. Data Isolation
- **Facility-level isolation**: Clients can only access their own facility data
- **API-level protection**: All client endpoints verify user type and facility ID
- **Token-based security**: JWT tokens include facility ID for validation

#### B. Input Validation
- **Backend validation**: All inputs validated on server side
- **SQL injection protection**: Uses Prisma ORM for safe database queries
- **File upload security**: Validates file types and sizes

### 5. Database Migration Required

To implement these changes, run the following command in the backend directory:

```bash
cd backend
npx prisma migrate dev --name add-facility-id-to-users
```

This will:
1. Create a new migration file
2. Apply the migration to add the `facility_id` column to the `users` table
3. Generate the updated Prisma client

### 6. Testing Checklist

#### Registration Testing
- [ ] Client can register with valid Facility ID and password
- [ ] Registration fails with duplicate Facility ID
- [ ] Registration fails with invalid password (too short)
- [ ] Registration fails with mismatched password confirmation

#### Login Testing
- [ ] Client can login with Facility ID and password
- [ ] Company users can still login with User ID and password
- [ ] Login fails with invalid credentials
- [ ] Login type toggle works correctly

#### Dashboard Testing
- [ ] Client dashboard loads only their facility data
- [ ] Hierarchy display works correctly
- [ ] Image viewer functions properly
- [ ] Receipt upload and viewing works
- [ ] No delete functionality is available to clients

### 7. Deployment Notes

1. **Database migration must be run first** before deploying the new code
2. **Backend server restart required** after schema changes
3. **Frontend deployment** can be done after backend is updated
4. **Test thoroughly** with both client and company user accounts

### 8. Future Enhancements

- **Client profile management**: Allow clients to update their information
- **Notification system**: Alert clients when new cleaning records are added
- **Reporting features**: Generate cleaning reports for clients
- **Mobile optimization**: Enhance mobile experience for client dashboard 