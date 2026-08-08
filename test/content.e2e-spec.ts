import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

jest.setTimeout(30000);

describe('Content modules (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const email = `e2e-${Date.now().toString(36)}@test.local`;
  const password = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: 'e2e-' } } });
    await app.close();
  });

  it('registers and logs in (cookie session)', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'E2E Tester' })
      .expect(201);
    expect(register.headers['set-cookie']?.[0] ?? '').toContain(
      'access_token=',
    );

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', register.headers['set-cookie'])
      .expect(200);
    expect(me.body.email).toBe(email);
  });

  it('skills: full owned lifecycle', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `e2e-b-${Date.now()}@test.com`,
        password,
        name: 'E2E B',
      })
      .expect(201);
    const cookie = register.headers['set-cookie'];

    const created = await request(app.getHttpServer())
      .post('/skills')
      .set('Cookie', cookie)
      .send({ name: 'GraphQL', category: 'Backend', proficiency: 60 })
      .expect(201);
    expect(created.body.userId).toBeTruthy();
    expect(created.body.order).toBe(0);

    const updated = await request(app.getHttpServer())
      .patch(`/skills/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ proficiency: 75 })
      .expect(200);
    expect(updated.body.proficiency).toBe(75);

    await request(app.getHttpServer())
      .patch('/skills/reorder')
      .set('Cookie', cookie)
      .send({ items: [{ id: created.body.id, order: 5 }] })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/skills/${created.body.id}`)
      .set('Cookie', cookie)
      .expect(200);
  });

  it('skills: anonymous requests are rejected and CRUD is scoped', async () => {
    await request(app.getHttpServer())
      .post('/skills')
      .send({ name: 'Hack', category: 'Backend', proficiency: 1 })
      .expect(401);

    const other = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `e2e-c-${Date.now()}@test.com`,
        password,
        name: 'E2E C',
      })
      .expect(201);

    const victim = await request(app.getHttpServer())
      .post('/skills')
      .set('Cookie', other.headers['set-cookie'])
      .send({ name: 'Victim', category: 'Frontend', proficiency: 1 })
      .expect(201);

    const attacker = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `e2e-d-${Date.now()}@test.com`,
        password,
        name: 'E2E D',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/skills/${victim.body.id}`)
      .set('Cookie', attacker.headers['set-cookie'])
      .send({ proficiency: 99 })
      .expect(404);
  });

  it('rejects invalid DTO payloads', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `e2e-e-${Date.now()}@test.com`,
        password,
        name: 'E2E E',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/skills')
      .set('Cookie', register.headers['set-cookie'])
      .send({ name: '', category: 'NotACategory', proficiency: 500 })
      .expect(400);
  });
});
