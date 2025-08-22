// Deprecated direct pg usage. Prisma is the primary DB access layer now.
// Keeping a minimal stub for backward compatibility in case any leftover imports exist.
module.exports = {
  pool: { connect: async () => ({ release: () => {} }) },
  query: async () => {
    throw new Error('Direct SQL access removed. Use Prisma via require("../config/prisma").prisma');
  },
  initializeDatabase: async () => {}
};
