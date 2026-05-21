import { DataSource } from 'typeorm';
import { dataSourceOptions } from './data-source';
import { EarlyWarningConfig } from '../early-warning/entities/early-warning-config.entity';

async function seed() {
  const ds = new DataSource(dataSourceOptions);
  await ds.initialize();
  const repo = ds.getRepository(EarlyWarningConfig);

  const existing = await repo.count();
  if (existing > 0) {
    console.log('Seed data already exists, skipping...');
    await ds.destroy();
    return;
  }

  const defaults: Partial<EarlyWarningConfig>[] = [
    { indicator: 'absenteeism', weight: 3, threshold: 15, description: 'غياب الطالب (أيام)', active: true },
    { indicator: 'behavior_incidents', weight: 5, threshold: 10, description: 'عدد حوادث السلوك', active: true },
    { indicator: 'academic_score', weight: 2, threshold: 50, description: 'انخفاض الدرجات الأكاديمية', active: true },
    { indicator: 'iep_goal_stagnation', weight: 4, threshold: 20, description: 'ركود تقدم أهداف IEP', active: true },
    { indicator: 'suspension_days', weight: 5, threshold: 5, description: 'أيام الإيقاف', active: true },
    { indicator: 'referrals', weight: 3, threshold: 8, description: 'الإحالات للدعم النفسي', active: true },
  ];

  await repo.save(defaults);
  console.log(`Seeded ${defaults.length} early warning configs`);
  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
