import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

jest.setTimeout(120000);

describe('المرحلة الأولى — MVP (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api — فحص الصحة', () => {
    return request(app.getHttpServer()).get('/api').expect(200).expect({ status: 'ok', service: 'khatwa-backend' });
  });

  it('POST /api/auth/login — رفض كلمة مرور خاطئة', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong-password' })
      .expect(401);
  });

  it('GET /api/students — بدون توكن يرفض', () => {
    return request(app.getHttpServer()).get('/api/students').expect(401);
  });

  it('تسلسل كامل: تسجيل دخول، طالب، خطة IEP، هدف، تقرير', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password' });

    expect([200, 201]).toContain(login.status);
    expect(login.body.access_token).toBeDefined();
    const token = login.body.access_token as string;

    const createStudent = await request(app.getHttpServer())
      .post('/api/students')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'طالب اختبار e2e',
        gender: 'ذكر',
        disabilityType: 'اختبار',
        status: 'active',
      });

    expect([200, 201]).toContain(createStudent.status);
    const studentId = createStudent.body.id as number;

    await request(app.getHttpServer())
      .get(`/api/iep/plans/student/${studentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const plan = await request(app.getHttpServer())
      .post('/api/iep/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId, status: 'active' });

    expect([200, 201]).toContain(plan.status);
    const planId = plan.body.id as number;

    const goal = await request(app.getHttpServer())
      .post('/api/iep/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        planId,
        title: 'هدف اختبار',
        targetPercentage: 100,
        currentPercentage: 0,
        status: 'in_progress',
      });

    expect([200, 201]).toContain(goal.status);
    const goalId = goal.body.id as number;

    await request(app.getHttpServer())
      .put(`/api/iep/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ planId, status: 'done', currentPercentage: 100 })
      .expect(200);

    const summary = await request(app.getHttpServer()).get('/api/reports/summary').set('Authorization', `Bearer ${token}`).expect(200);

    expect(summary.body).toHaveProperty('students');
    expect(summary.body).toHaveProperty('activeIepPlans');
    expect(summary.body).toHaveProperty('objectivesCompleted');
    expect(summary.body).toHaveProperty('weeklyProgress');

    await request(app.getHttpServer()).delete(`/api/students/${studentId}`).set('Authorization', `Bearer ${token}`).expect(200);
  });
});
