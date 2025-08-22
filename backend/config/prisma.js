const { PrismaClient } = require('@prisma/client');
const { toJst } = require('../utils/timezone');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Middleware to automatically convert UTC timestamps to JST for Japanese timezone
prisma.$use(async (params, next) => {
  // Convert timestamps to JST before sending to database
  if (params.action === 'create' || params.action === 'update') {
    if (params.data && typeof params.data === 'object') {
      // Handle createdAt and updatedAt fields
      if (params.data.createdAt === undefined && params.action === 'create') {
        params.data.createdAt = new Date();
      }
      if (params.data.updatedAt === undefined) {
        params.data.updatedAt = new Date();
      }
    }
  }
  
  const result = await next(params);
  
  // Convert UTC timestamps back to JST for responses
  if (result && typeof result === 'object') {
    convertTimestampsToJst(result);
  }
  
  return result;
});

// Recursively convert all timestamp fields to JST
function convertTimestampsToJst(obj) {
  if (!obj || typeof obj !== 'object') return;
  
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      // Convert UTC timestamp to JST
      obj[key] = toJst(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively convert nested objects
      convertTimestampsToJst(value);
    } else if (Array.isArray(value)) {
      // Convert array items
      value.forEach(item => {
        if (item && typeof item === 'object') {
          convertTimestampsToJst(item);
        }
      });
    }
  }
}

module.exports = { prisma };


