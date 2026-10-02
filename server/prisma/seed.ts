import { PrismaClient, SystemRole, TaskStatus, TaskPriority, ReportPeriod } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding process...');

  // Hash password
  const defaultPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  // Clean existing data to prevent unique constraint errors during re-seeding
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();
  await prisma.position.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.directorate.deleteMany();

  // Create Directorates
  console.log('Creating directorates...');
  const strategyDir = await prisma.directorate.create({ data: { name: 'Strategy and Brand' } });
  const hrDir = await prisma.directorate.create({ data: { name: 'HR' } });
  const itDir = await prisma.directorate.create({ data: { name: 'IT' } });
  const riskDir = await prisma.directorate.create({ data: { name: 'Risk and Compliance' } });
  const financeDir = await prisma.directorate.create({ data: { name: 'Finance and Investment' } });
  const auditDir = await prisma.directorate.create({ data: { name: 'Audit' } });
  const resourceDir = await prisma.directorate.create({ data: { name: 'Resource and Partnership' } });
  const channelDir = await prisma.directorate.create({ data: { name: 'Channel and Customer Experience' } });
  const creditDir = await prisma.directorate.create({ data: { name: 'Credit' } });
  const legalDir = await prisma.directorate.create({ data: { name: 'Legal' } });

  // Create Units
  console.log('Creating units...');
  const strategyUnit = await prisma.unit.create({ data: { name: 'Strategy Unit', directorateId: strategyDir.id } });
  const brandUnit = await prisma.unit.create({ data: { name: 'Brand Unit', directorateId: strategyDir.id } });

  // Create Positions
  console.log('Creating positions...');
  const ceoPos = await prisma.position.create({ data: { name: 'Chief Executive Officer' } });
  const directorPos = await prisma.position.create({ data: { name: 'Director' } });
  const managerPos = await prisma.position.create({ data: { name: 'Manager' } });
  const officerPos = await prisma.position.create({ data: { name: 'Officer' } });
  const adminPos = await prisma.position.create({ data: { name: 'System Administrator' } });

  // Create Users
  console.log('Creating users...');
  
  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@nisirtasker.com',
      username: 'admin',
      firstName: 'System',
      lastName: 'Admin',
      passwordHash,
      systemRole: SystemRole.ADMIN,
      positionId: adminPos.id,
    }
  });

  // 2. CEO
  const ceo = await prisma.user.create({
    data: {
      email: 'ceo@nisirtasker.com',
      username: 'ceo',
      firstName: 'Jane',
      lastName: 'CEO',
      passwordHash,
      systemRole: SystemRole.CEO,
      positionId: ceoPos.id,
    }
  });

  // 3. Director (Strategy & Brand)
  const director = await prisma.user.create({
    data: {
      email: 'director@nisirtasker.com',
      username: 'director',
      firstName: 'David',
      lastName: 'Director',
      passwordHash,
      systemRole: SystemRole.DIRECTOR,
      positionId: directorPos.id,
      directorateId: strategyDir.id,
      managerId: ceo.id
    }
  });

  // 4. Manager (Strategy Unit)
  const manager = await prisma.user.create({
    data: {
      email: 'manager@nisirtasker.com',
      username: 'manager',
      firstName: 'Maria',
      lastName: 'Manager',
      passwordHash,
      systemRole: SystemRole.MANAGER,
      positionId: managerPos.id,
      directorateId: strategyDir.id,
      unitId: strategyUnit.id,
      managerId: director.id
    }
  });

  // 5. Staff (Strategy Unit)
  const staff = await prisma.user.create({
    data: {
      email: 'staff@nisirtasker.com',
      username: 'staff',
      firstName: 'Sam',
      lastName: 'Staff',
      passwordHash,
      systemRole: SystemRole.STAFF,
      positionId: officerPos.id,
      directorateId: strategyDir.id,
      unitId: strategyUnit.id,
      managerId: manager.id
    }
  });

  // Create Sample Task
  console.log('Creating sample tasks...');
  await prisma.task.create({
    data: {
      title: 'Prepare Q4 Strategic Plan',
      description: 'Draft the initial strategic goals for Q4 and gather data.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      progress: 50,
      startDate: new Date(),
      dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      creatorId: manager.id,
      assigneeId: staff.id,
      directorateId: strategyDir.id,
      unitId: strategyUnit.id,
    }
  });

  console.log('Seeding completed successfully!');
  console.log('Default credentials for all accounts: Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
