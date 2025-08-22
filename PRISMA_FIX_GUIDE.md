# Prisma Fix Guide

## Issue
You're seeing a "Prisma Client Error" when trying to access Prisma Studio at `localhost:5555`. This is because the database schema was updated but the Prisma client hasn't been regenerated.

## Quick Fix Steps

### Step 1: Stop all running processes
```bash
# Press Ctrl+C to stop any running servers
# Close any terminal windows running the backend
```

### Step 2: Navigate to backend directory
```bash
cd backend
```

### Step 3: Generate Prisma client
```bash
npx prisma generate
```

### Step 4: Run database migration
```bash
npx prisma migrate dev --name add-facility-id-to-users
```

### Step 5: Generate client again
```bash
npx prisma generate
```

### Step 6: Test database connection
```bash
node test-db-connection.js
```

### Step 7: Start backend server
```bash
npm run dev
```

### Step 8: Open Prisma Studio (in a new terminal)
```bash
cd backend
npx prisma studio
```

## Alternative: Use the Fix Script

If the manual steps don't work, use the automated fix script:

```bash
cd backend
node fix-all-prisma-issues.js
```

## What Each Step Does

1. **Generate Prisma Client**: Creates the TypeScript client based on your schema
2. **Migration**: Updates your database to match the new schema (adds `facility_id` column)
3. **Regenerate Client**: Updates the client after database changes
4. **Test Connection**: Verifies everything is working
5. **Start Server**: Runs the backend with updated client
6. **Prisma Studio**: Opens the database GUI

## Common Issues & Solutions

### Issue: "Unknown column 'facility_id'"
**Solution**: Run the migration step (Step 4)

### Issue: "Cannot find module '@prisma/client'"
**Solution**: Run the generate step (Step 3)

### Issue: "Connection refused"
**Solution**: Check your DATABASE_URL in `.env` file

### Issue: "Migration failed"
**Solution**: Try resetting the database:
```bash
npx prisma migrate reset --force
```

## Expected Result

After completing these steps:
- ✅ Prisma Studio should open at `http://localhost:5555`
- ✅ You should see all your database tables
- ✅ The `users` table should have a `facility_id` column
- ✅ Backend server should start without errors
- ✅ Client registration system should work

## Testing the Client System

1. **Register a client**:
   - Go to `/client-register`
   - Enter a Facility ID (e.g., "FAC001")
   - Enter a password
   - Submit the form

2. **Login as client**:
   - Go to `/`
   - Select "クライアント" tab
   - Enter the Facility ID and password
   - Should redirect to client dashboard

3. **View client dashboard**:
   - Should show only data for that specific facility
   - Should have receipt management functionality
   - Should have hierarchical cleaning record display

## If Still Having Issues

1. Check your `.env` file has the correct `DATABASE_URL`
2. Ensure your database server (PostgreSQL) is running
3. Try the comprehensive fix script: `node fix-all-prisma-issues.js`
4. Check the console for specific error messages 