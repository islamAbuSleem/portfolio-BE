import "dotenv/config";
import { PrismaClient, SkillCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: '$2b$10$placeholder',
      name: 'Islam Abu Sleem',
    },
  });

  await prisma.about.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      bio: 'Full-Stack Developer passionate about building beautiful, performant web applications. Experienced with React, Next.js, Vue, Nuxt, Node.js, NestJS, Java, Spring Boot, and modern cloud infrastructure.',
      userId: user.id,
    },
  });

  const skills = [
    { name: 'React', category: SkillCategory.Frontend, proficiency: 95 },
    { name: 'Next.js', category: SkillCategory.Frontend, proficiency: 90 },
    { name: 'Vue', category: SkillCategory.Frontend, proficiency: 80 },
    { name: 'Nuxt', category: SkillCategory.Frontend, proficiency: 75 },
    { name: 'TypeScript', category: SkillCategory.Frontend, proficiency: 90 },
    { name: 'Node.js', category: SkillCategory.Backend, proficiency: 90 },
    { name: 'Express', category: SkillCategory.Backend, proficiency: 85 },
    { name: 'NestJS', category: SkillCategory.Backend, proficiency: 80 },
    { name: 'Java', category: SkillCategory.Backend, proficiency: 70 },
    { name: 'Spring Boot', category: SkillCategory.Backend, proficiency: 65 },
    { name: 'PostgreSQL', category: SkillCategory.Backend, proficiency: 80 },
    { name: 'Docker', category: SkillCategory.DevOps, proficiency: 60 },
    { name: 'Git', category: SkillCategory.Tools, proficiency: 90 },
  ];

  for (let i = 0; i < skills.length; i++) {
    await prisma.skill.create({
      data: { ...skills[i], order: i, userId: user.id },
    });
  }

  const experiences = [
    {
      company: 'Freelance',
      role: 'Full-Stack Developer',
      startDate: new Date('2023-01-01'),
      description: 'Building full-stack web applications for clients using React, Next.js, Node.js, and PostgreSQL.',
      order: 0,
    },
  ];

  for (const exp of experiences) {
    await prisma.experience.create({
      data: { ...exp, userId: user.id },
    });
  }

  const projects = [
    {
      title: 'Portfolio Platform',
      description: 'A creative, interactive portfolio with an admin panel for managing content dynamically.',
      techs: ['Next.js', 'TypeScript', 'Tailwind CSS', 'NestJS', 'PostgreSQL', 'Prisma'],
      featured: true,
      order: 0,
    },
    {
      title: 'E-Commerce Dashboard',
      description: 'Full-stack admin dashboard for managing products, orders, and customers with real-time analytics.',
      techs: ['React', 'Node.js', 'PostgreSQL', 'Chart.js'],
      featured: false,
      order: 1,
    },
  ];

  for (const project of projects) {
    await prisma.project.create({
      data: { ...project, userId: user.id },
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });