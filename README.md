# خطوة - منصة إدارة تعليمية ذكية للطلاب ذوي الاحتياجات الخاصة

منصة متكاملة لدعم المدارس في إدارة طلاب الدمج، مع لوحة تحكم، إدارة الطلاب، خطط IEP، تقارير، ومصادقة متعددة المستأجرين.

## المكونات

- `backend/`: NestJS API
- `frontend/`: Next.js واجهة المستخدم
- `docker/`: تكوين قاعدة بيانات PostgreSQL و Redis

## تشغيل المشروع

1. إنشاء ملف `.env` في المجلد الجذر من نسخة `.env.example`
2. تشغيل الحاويات:
   ```powershell
   docker compose -f docker/docker-compose.yml up -d
   ```
3. تثبيت التبعيات لكل جزء:
   - `cd backend && npm install`
   - `cd frontend && npm install`
4. تشغيل الخدمات:
   - `cd backend && npm run start:dev`
   - `cd frontend && npm run dev`

## اختبار المرحلة الأولى (e2e)

يتطلب PostgreSQL شغّالًا بنفس إعدادات `.env` (مثلاً عبر `docker compose -f docker/docker-compose.yml up -d`).

```powershell
cd backend
npm run test:e2e
```

الاختبارات تغطي: الصحة، تسجيل الدخول، حماية JWT، إنشاء طالب وخطة IEP وهدف، التقارير، ثم حذف الطالب.

## الملاحظات

- الواجهة الأمامية تستخدم `NEXT_PUBLIC_API_URL` (الافتراضي في `.env.example`: `http://localhost:3001/api`)
- أول تشغيل للخلفية: يُنشأ مستخدم `admin` / `password` عند فراغ جدول المستخدمين
- قاعدة البيانات PostgreSQL متاحة على `localhost:5432`
