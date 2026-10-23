import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding baseline campus reference data (departments only)...');

  const deptData = [
    { name: 'Electrical Maintenance', code: 'ELEC', contactEmail: 'elec@campus.edu', contactPhone: '555-0101', description: 'Handles electrical wiring, lighting, fans, AC, and power systems' },
    { name: 'Civil & Plumbing', code: 'PLUMB', contactEmail: 'plumbing@campus.edu', contactPhone: '555-0102', description: 'Handles water supply, washrooms, leakage, desks, and civil repairs' },
    { name: 'IT Infrastructure & Networking', code: 'IT-NET', contactEmail: 'it.helpdesk@campus.edu', contactPhone: '555-0103', description: 'Handles campus Wi-Fi, computer labs, projectors, and network switches' },
    { name: 'Campus Estate & Facilities', code: 'ESTATE', contactEmail: 'estate@campus.edu', contactPhone: '555-0104', description: 'Handles classrooms, seminar halls, lifts, building structures, and grounds' },
    { name: 'Housekeeping & Sanitation', code: 'HOUSE', contactEmail: 'clean@campus.edu', contactPhone: '555-0105', description: 'Handles campus sanitation, waste management, hygiene, and cleanliness' },
    { name: 'Campus Safety & Security', code: 'SEC', contactEmail: 'security@campus.edu', contactPhone: '555-0106', description: 'Handles campus safety, emergency response, and security personnel' },
  ];

  for (const d of deptData) {
    await prisma.department.upsert({
      where: { name: d.name },
      update: { description: d.description, contactEmail: d.contactEmail, contactPhone: d.contactPhone },
      create: d,
    });
  }

  console.log(`[SUCCESS] Verified ${deptData.length} core campus departments.`);
  console.log('Note: No fake users, complaints, or demo items are seeded. Real accounts can be registered or created via admin panel.');
}

main()
  .catch((e) => {
    console.error('[ERROR] Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
