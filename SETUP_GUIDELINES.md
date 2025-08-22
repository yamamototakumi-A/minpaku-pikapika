# Cleaning Guidelines Setup Guide

## Overview
This system stores cleaning guideline images in Google Cloud Storage and displays them dynamically in the staff dashboard.

## Setup Steps

### 1. Environment Configuration

Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8888
```

### 2. Database Setup
The system will automatically create the `cleaning_guidelines` table when the backend starts.

### 3. Upload Images to Google Cloud Storage

Run the population script to upload your ITEMS folder images:

```bash
cd backend
npm run populate-guidelines
```

This script will:
- Upload all PNG images from the `ITEMS/` folder to Google Cloud Storage
- Store the URLs in the database
- Map room types to their corresponding images

### 4. Room Type Mapping
The system maps room types to folders as follows:
- トイレ → `ITEMS/1.トイレ/` (1-1.png, 1-2.png, 1-3.png)
- 洗面台 → `ITEMS/2.洗面台/` (2-1.png, 2-2.png)
- 洗濯機 → `ITEMS/3.洗濯機/` (3-1.png)
- お風呂 → `ITEMS/4.お風呂/` (4-1.png, 4-2.png, 4-3.png)
- キッチン → `ITEMS/5.キッチン/` (5-1.png to 5-7.png)
- ベッド → `ITEMS/6.ベッド/` (6-1.png, 6-2.png)
- リビング → `ITEMS/7.リビング/` (7-1.png to 7-4.png)
- その他 → `ITEMS/8.その他/` (8-1.png, 8-2.png)
- 特別清掃 → No images (handled specially)

### 5. API Endpoints

The system provides these endpoints:

- `GET /api/auth/guidelines/:roomType` - Get guidelines for a specific room type
- `GET /api/auth/guidelines` - Get all available room types
- `POST /api/auth/guidelines` - Add new guideline (Admin)
- `PUT /api/auth/guidelines/:id` - Update guideline (Admin)
- `DELETE /api/auth/guidelines/:id` - Delete guideline (Admin)

### 6. Frontend Features

The staff dashboard now includes:
- Dynamic loading of guidelines from the database
- Horizontal scrolling gallery of all guideline images
- Step-by-step navigation with current step highlighting
- Loading states and error handling
- Special handling for "特別清掃" (no images)

### 7. Database Schema

```sql
CREATE TABLE cleaning_guidelines (
  id SERIAL PRIMARY KEY,
  room_type VARCHAR(50) NOT NULL,
  step_number INTEGER NOT NULL,
  title VARCHAR(255),
  description TEXT,
  guideline_image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_type, step_number)
);
```

## Usage

1. Staff logs in and enters facility ID
2. Staff selects room type from dropdown
3. System fetches guidelines from database
4. Guidelines are displayed horizontally with navigation
5. Staff can scroll through all images and see current step details

## Troubleshooting

- If images don't load, check Google Cloud Storage bucket permissions
- If guidelines don't appear, run the population script again
- Check browser console for API errors
- Verify environment variables are set correctly
