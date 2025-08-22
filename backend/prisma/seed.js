/* eslint-disable no-console */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Companies
  const hq = await prisma.company.upsert({
    where: { companyId: 'HQ-001' },
    update: {},
    create: {
      companyId: 'HQ-001',
      role: 'headquarter',
      address: '1 Main Street, Capital City',
      passwordHash: await bcrypt.hash('hq_password', 10),
    },
  });

  const branch = await prisma.company.upsert({
    where: { companyId: 'BR-001' },
    update: {},
    create: {
      companyId: 'BR-001',
      role: 'branch',
      address: '99 Branch Ave, Suburb',
      passwordHash: await bcrypt.hash('branch_password', 10),
    },
  });

  // Users
  const staffUser = await prisma.user.upsert({
    where: { userId: 'staff001' },
    update: {},
    create: {
      userId: 'staff001',
      surname: 'Doe',
      mainName: 'John',
      role: 'staff',
      userType: 'company',
      passwordHash: await bcrypt.hash('password123', 10),
      company: { connect: { id: branch.id } },
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { userId: 'client001' },
    update: {},
    create: {
      userId: 'client001',
      surname: 'Smith',
      mainName: 'Alice',
      role: 'client',
      userType: 'client',
      passwordHash: await bcrypt.hash('clientpass', 10),
      address: '100 Client Rd',
    },
  });

  // Facilities
  const facilityA = await prisma.facility.upsert({
    where: { facilityId: 'FAC-001' },
    update: {},
    create: {
      facilityId: 'FAC-001',
      name: 'Main Office',
      address: '1 Main Street, Capital City',
      company: { connect: { id: hq.id } },
    },
  });

  const facilityB = await prisma.facility.upsert({
    where: { facilityId: 'FAC-002' },
    update: {},
    create: {
      facilityId: 'FAC-002',
      name: 'Branch Office',
      address: '99 Branch Ave, Suburb',
      company: { connect: { id: branch.id } },
    },
  });

  // Cleaning guidelines (a couple of examples)
  await prisma.cleaningGuideline.upsert({
    where: { roomType_stepNumber: { roomType: 'toilet', stepNumber: 1 } },
    update: {},
    create: {
      roomType: 'toilet',
      stepNumber: 1,
      title: 'Gather supplies',
      description: 'Prepare cleaning tools and disinfectants',
      guidelineImageUrl: '/guidelines/1-1.png',
    },
  });

  await prisma.cleaningGuideline.upsert({
    where: { roomType_stepNumber: { roomType: 'toilet', stepNumber: 2 } },
    update: {},
    create: {
      roomType: 'toilet',
      stepNumber: 2,
      title: 'Apply cleaner',
      description: 'Spray and wait for dwell time',
      guidelineImageUrl: '/guidelines/1-2.png',
    },
  });

  // Example cleaning record
  await prisma.cleaningRecord.create({
    data: {
      facility: { connect: { id: facilityA.id } },
      roomType: 'toilet',
      roomId: 101,
      cleaningDate: new Date(),
      beforeImages: [],
      afterImages: [],
      staff: { connect: { id: staffUser.id } },
      status: 'pending',
    },
  });

  // Example client application
  await prisma.clientApplication.create({
    data: {
      client: { connect: { id: clientUser.id } },
      facility: { connect: { id: facilityB.id } },
      roomType: 'office',
      roomId: 12,
      applicationDate: new Date(),
      status: 'pending',
      notes: 'Weekly cleaning request',
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


