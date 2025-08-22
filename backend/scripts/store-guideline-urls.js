require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { prisma } = require('../config/prisma');

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find(a => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

async function main() {
  const roomType = getArg('roomType');
  const filePath = getArg('file') || path.resolve(__dirname, 'urls.txt');

  if (!roomType) {
    console.error('Missing required arg: --roomType=<roomType>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`URLs file not found: ${filePath}`);
    process.exit(1);
  }

  const lines = fs
    .readFileSync(filePath, 'utf-8')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) {
    console.error(`No URLs found in file: ${filePath}`);
    process.exit(1);
  }

  console.log(`Inserting ${lines.length} guidelines for roomType='${roomType}' from ${filePath}`);

  for (let i = 0; i < lines.length; i += 1) {
    const stepNumber = i + 1;
    const url = lines[i];
    const title = `${roomType} - Step ${stepNumber}`;
    const description = `${roomType} step ${stepNumber}`;

    try {
      const res = await prisma.cleaningGuideline.upsert({
        where: { roomType_stepNumber: { roomType, stepNumber } },
        update: { title, description, guidelineImageUrl: url },
        create: { roomType, stepNumber, title, description, guidelineImageUrl: url },
      });
      console.log(`✔ Step ${stepNumber}: ${url}`);
    } catch (err) {
      console.error(`✖ Failed at step ${stepNumber}: ${err.message}`);
      process.exit(1);
    }
  }

  console.log('Done.');
}

main()
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 