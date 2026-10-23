import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('=== SECURE CAMPUS ADMINISTRATOR PROVISIONING TOOL ===');

  const args = process.argv.slice(2);
  let email = process.env.ADMIN_EMAIL || '';
  let password = process.env.ADMIN_PASSWORD || '';
  let name = process.env.ADMIN_NAME || 'Campus Administrator';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) email = args[i + 1];
    if (args[i] === '--password' && args[i + 1]) password = args[i + 1];
    if (args[i] === '--name' && args[i + 1]) name = args[i + 1];
  }

  if (!email || !password) {
    console.error('\n[ERROR] Missing required credentials.');
    console.log('Usage:');
    console.log('  npm run create-admin -- --email <email> --password <password> [--name "<Full Name>"]');
    console.log('Or provide environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME\n');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('\n[ERROR] Administrator password must be at least 8 characters long.\n');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'ADMIN',
        passwordHash,
        name: name || existing.name,
      },
    });
    console.log(`\n[SUCCESS] Existing user "${updated.email}" has been updated/promoted to ADMINISTRATOR.`);
  } else {
    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name,
        role: 'ADMIN',
      },
    });
    console.log(`\n[SUCCESS] New ADMINISTRATOR created: ${created.email} (${created.name})`);
  }

  await prisma.$disconnect();
}

createAdmin().catch((err) => {
  console.error('[ERROR] Failed to provision administrator:', err);
  process.exit(1);
});
