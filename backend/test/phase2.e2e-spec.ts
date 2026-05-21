import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

jest.setTimeout(120000);

describe('المرحلة الثانية — E2E شامل (جميع الموديولات)', () => {
  let app: INestApplication;
  let token: string;
  let adminToken: string;
  let studentId: number;
  let planId: number;
  let goalId: number;
  let assessmentId: number;
  let accommodationId: number;
  let dailyPlanId: number;
  let notificationId: number;

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

  describe('1. الصحة (Health)', () => {
    it('GET /api — فحص صحة التطبيق', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect({ status: 'ok', service: 'khatwa-backend' });
    });

    it('GET /api/health — فحص صحة مخصص', async () => {
      const res = await request(app.getHttpServer()).get('/api/health').expect(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('khatwa-backend');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('2. المصادقة (Auth)', () => {
    it('POST /api/auth/login — رفض كلمة مرور خاطئة', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong-password' })
        .expect(401);
    });

    it('POST /api/auth/login — رفض جسم فارغ', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('POST /api/auth/login — تسجيل دخول ناجح (مستخدم عادي)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'password' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('admin');
      token = res.body.access_token;
    });

    it('GET /api/auth/profile — جلب الملف الشخصي', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.username).toBe('admin');
    });

    it('GET /api/auth/profile — بدون توكن يرفض', () => {
      return request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('PUT /api/auth/profile — تحديث الملف الشخصي', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ governorate: 'القاهرة' })
        .expect(200);
      expect(res.body.message).toBe('تم تحديث الملف الشخصي');
    });

    it('GET /api/auth/locations — جلب المواقع', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/locations?field=governorate')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/auth/change-password — تغيير كلمة المرور', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'password', newPassword: 'newpass123' })
        .expect(200);
      expect(res.body.message).toBe('تم تغيير كلمة المرور بنجاح');

      // إعادة تغيير كلمة المرور إلى الأصل للاختبارات اللاحقة
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'newpass123', newPassword: 'password' })
        .expect(200);
    });

    it('POST /api/auth/change-password — رفض كلمة مرور قديمة خاطئة', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'wrong', newPassword: 'newpass' })
        .expect(401);
    });

    it('GET /api/auth/users (admin فقط) — قائمة المستخدمين', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/auth/users/:id — مستخدم معين', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/users/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.id).toBe(1);
    });

    it('POST /api/auth/users — إنشاء مستخدم', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'testteacher', role: 'teacher_m', password: 'test123' })
        .expect(201);
      expect(res.body.username).toBe('testteacher');

      // تسجيل الدخول بالمستخدم الجديد للحصول على token منفصل
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'testteacher', password: 'test123' });
      adminToken = loginRes.body.access_token;
    });

    it('POST /api/auth/users — رفض اسم مكرر', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'testteacher', role: 'teacher_m' })
        .expect(400);
    });

    it('PUT /api/auth/users/:id — تحديث مستخدم', async () => {
      await request(app.getHttpServer())
        .put('/api/auth/users/2')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'teacher_f' })
        .expect(200);
    });

    it('DELETE /api/auth/users/:id — حذف مستخدم', async () => {
      await request(app.getHttpServer())
        .delete('/api/auth/users/2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('3. الطلاب (Students)', () => {
    it('GET /api/students — قائمة الطلاب (مصفوفة)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
    });

    it('POST /api/students — إنشاء طالب', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fullName: 'طالب اختبار شامل',
          gender: 'ذكر',
          disabilityType: 'صعوبات تعلم',
          diagnosis: 'عسر القراءة',
          status: 'active',
        })
        .expect(201);
      expect(res.body.fullName).toBe('طالب اختبار شامل');
      expect(res.body.id).toBeDefined();
      studentId = res.body.id;
    });

    it('GET /api/students/:id — عرض طالب', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/students/${studentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.fullName).toBe('طالب اختبار شامل');
    });

    it('GET /api/students?search= — بحث في الطلاب', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/students?search=اختبار&take=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PUT /api/students/:id — تحديث طالب', async () => {
      await request(app.getHttpServer())
        .put(`/api/students/${studentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fullName: 'اسم محدث' })
        .expect(200);
    });
  });

  describe('4. خطط IEP', () => {
    it('GET /api/iep/plans/student/:id — خطط الطالب', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/iep/plans/student/${studentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/iep/plans — إنشاء خطة', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/iep/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId, status: 'active' })
        .expect(201);
      expect(res.body.studentId).toBe(studentId);
      planId = res.body.id;
    });

    it('GET /api/iep/plans — كل الخطط', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/iep/plans')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/iep/goals — إنشاء هدف', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/iep/goals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId,
          title: 'هدف اختبار شامل',
          targetPercentage: 100,
          currentPercentage: 0,
          status: 'in_progress',
        })
        .expect(201);
      expect(res.body.title).toBe('هدف اختبار شامل');
      goalId = res.body.id;
    });

    it('PUT /api/iep/goals/:id — تحديث الهدف', async () => {
      await request(app.getHttpServer())
        .put(`/api/iep/goals/${goalId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPercentage: 75, status: 'in_progress' })
        .expect(200);
    });

    it('DELETE /api/iep/goals/:id — حذف هدف', async () => {
      await request(app.getHttpServer())
        .delete(`/api/iep/goals/${goalId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('5. التقارير (Reports)', () => {
    it('GET /api/reports/summary — ملخص التقارير', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toHaveProperty('students');
      expect(res.body).toHaveProperty('activeIepPlans');
      expect(res.body).toHaveProperty('weeklyProgress');
      expect(res.body.weeklyProgress).toHaveLength(7);
    });

    it('GET /api/reports/iep/:id/pdf — تصدير PDF', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/iep/${studentId}/pdf`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.body).toBeInstanceOf(Buffer);
    });

    it('GET /api/reports/attendance/:id/csv — تصدير CSV', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/attendance/${studentId}/csv`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('student_id,student_name,date,status');
    });
  });

  describe('6. تقييمات السلوك (Behavior)', () => {
    it('POST /api/behavior/assessments — إنشاء تقييم', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/behavior/assessments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          date: '2026-05-13',
          indicators: { attention: 8, response: 7, interaction: 6, agitation: 2, eye_contact: 9 },
          notes: 'تقييم شامل',
        })
        .expect(201);
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.indicators.attention).toBe(8);
      assessmentId = res.body.id;
    });

    it('GET /api/behavior/assessments/student/:id — قائمة التقييمات', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/behavior/assessments/student/${studentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/behavior/trend/:id — اتجاهات السلوك', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/behavior/trend/${studentId}?indicator=attention`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/behavior/assessments — رفض بيانات ناقصة', async () => {
      await request(app.getHttpServer())
        .post('/api/behavior/assessments')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId })
        .expect(400);
    });

    it('DELETE /api/behavior/assessments/:id — حذف تقييم', async () => {
      await request(app.getHttpServer())
        .delete(`/api/behavior/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('7. الدمج (Inclusion)', () => {
    it('POST /api/inclusion/accommodations — إنشاء تكييف', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/inclusion/accommodations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          accommodationType: 'سماعات',
          description: 'استخدام سماعات أثناء الحصة',
          subject: 'رياضيات',
          status: 'active',
        })
        .expect(201);
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.accommodationType).toBe('سماعات');
      accommodationId = res.body.id;
    });

    it('GET /api/inclusion/accommodations/student/:id — قائمة التكييفات', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/inclusion/accommodations/student/${studentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('PUT /api/inclusion/accommodations/:id — تحديث تكييف', async () => {
      await request(app.getHttpServer())
        .put(`/api/inclusion/accommodations/${accommodationId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'inactive', description: 'محدث' })
        .expect(200);
    });

    it('DELETE /api/inclusion/accommodations/:id — حذف تكييف', async () => {
      await request(app.getHttpServer())
        .delete(`/api/inclusion/accommodations/${accommodationId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('8. الخطط اليومية (Daily Plan)', () => {
    it('POST /api/daily-plan — إنشاء نشاط', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/daily-plan')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          title: 'نشاط اختبار شامل',
          date: '2026-05-13',
          startTime: '09:00',
          endTime: '10:00',
          type: 'academic',
          priority: 'high',
          status: 'pending',
        })
        .expect(201);
      expect(res.body.title).toBe('نشاط اختبار شامل');
      dailyPlanId = res.body.id;
    });

    it('GET /api/daily-plan — قائمة الأنشطة', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/daily-plan?date=2026-05-13`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/daily-plan/:id — عرض نشاط', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/daily-plan/${dailyPlanId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.id).toBe(dailyPlanId);
    });

    it('PUT /api/daily-plan/:id — تحديث نشاط', async () => {
      await request(app.getHttpServer())
        .put(`/api/daily-plan/${dailyPlanId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'done' })
        .expect(200);
    });

    it('DELETE /api/daily-plan/:id — حذف نشاط', async () => {
      await request(app.getHttpServer())
        .delete(`/api/daily-plan/${dailyPlanId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('9. الإشعارات (Notifications)', () => {
    it('POST /api/notifications — إنشاء إشعار', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: 1,
          title: 'إشعار اختبار',
          body: 'نص الإشعار',
          type: 'info',
        })
        .expect(201);
      expect(res.body.title).toBe('إشعار اختبار');
      notificationId = res.body.id;
    });

    it('GET /api/notifications — قائمة الإشعارات', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/notifications/unread-count — عدد غير المقروء', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(typeof res.body).toBe('number');
      expect(res.body).toBeGreaterThanOrEqual(1);
    });

    it('PUT /api/notifications/:id/read — تعيين كمقروء', async () => {
      await request(app.getHttpServer())
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('PUT /api/notifications/read-all — تعيين الكل كمقروء', async () => {
      await request(app.getHttpServer())
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('10. المواقع (Locations)', () => {
    it('GET /api/locations — قائمة المواقع', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/locations?type=governorate')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/locations — تصفية حسب parentId', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/locations?type=directorate&parentId=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('11. الصلاحيات (RBAC)', () => {
    it('GET /api/auth/users — teacher ممنوع من قائمة المستخدمين', async () => {
      // إنشاء مستخدم teacher مؤقت
      const createRes = await request(app.getHttpServer())
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'rbactest', password: 'test123', role: 'teacher_m' })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'rbactest', password: 'test123' });
      const teacherToken = loginRes.body.access_token;

      await request(app.getHttpServer())
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      // تنظيف
      await request(app.getHttpServer())
        .delete('/api/auth/users/' + createRes.body.id)
        .set('Authorization', `Bearer ${token}`);
    });
  });

  describe('12. تنظيف البيانات', () => {
    it('DELETE /api/students/:id — حذف الطالب مع كل المرتبط', async () => {
      await request(app.getHttpServer())
        .delete(`/api/students/${studentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // تأكيد الحذف
      await request(app.getHttpServer())
        .get(`/api/students/${studentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => expect(res.body).toBeNull());
    });

    it('رفض حذف آخر مشرف', async () => {
      await request(app.getHttpServer())
        .delete('/api/auth/users/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});
