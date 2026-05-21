import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Repository } from 'typeorm';
import { Location } from './location.entity';

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'الغربية',
  'القليوبية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد',
  'السويس', 'الإسماعيلية', 'شمال سيناء', 'جنوب سيناء', 'بني سويف',
  'الفيوم', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
  'البحر الأحمر', 'الوادي الجديد', 'مطروح',
];

const SAMPLE_ADMINISTRATIONS: Record<string, string[]> = {
  'القاهرة': ['غرب القاهرة', 'شرق القاهرة', 'شمال القاهرة', 'جنوب القاهرة', 'وسط القاهرة', 'المعادي', 'مصر الجديدة', 'المرج', 'حلوان'],
  'الجيزة': ['شمال الجيزة', 'جنوب الجيزة', 'العمرانية', 'البدرشين', 'أوسيم'],
  'الإسكندرية': ['شرق الإسكندرية', 'غرب الإسكندرية', 'وسط الإسكندرية', 'المنتزه', 'العجمي'],
  'الدقهلية': ['المنصورة', 'طلخا', 'ميت غمر', 'دكرنس', 'السنبلاوين'],
  'الشرقية': ['الزقازيق', 'بلبيس', 'أبو حماد', 'العاشر من رمضان', 'فاقوس'],
  'الغربية': ['طنطا', 'المحلة الكبرى', 'كفر الزيات', 'بسيون', 'قطور'],
  'القليوبية': ['بنها', 'شبرا الخيمة', 'قليوب', 'الخانكة', 'طوخ'],
  'المنوفية': ['شبين الكوم', 'الباجور', 'أشمون', 'منوف', 'تلا'],
  'البحيرة': ['دمنهور', 'كفر الدوار', 'إيتاي البارود', 'رشيد', 'أبو المطامير'],
  'كفر الشيخ': ['كفر الشيخ', 'دسوق', 'بيلا', 'سيدي سالم', 'فوه'],
  'دمياط': ['دمياط', 'فارسكور', 'كفر سعد', 'الزرقا'],
  'بورسعيد': ['بورسعيد', 'بورفؤاد', 'الزهور', 'المناخ'],
  'السويس': ['السويس', 'فيصل', 'الأربعين', 'عتاقة'],
  'الإسماعيلية': ['الإسماعيلية', 'فايد', 'القصاصين', 'أبو صوير'],
  'شمال سيناء': ['العريش', 'الشيخ زويد', 'رفح', 'بئر العبد'],
  'جنوب سيناء': ['الطور', 'شرم الشيخ', 'دهب', 'نويبع', 'سانت كاترين'],
  'بني سويف': ['بني سويف', 'الواسطى', 'الفشن', 'أهناسيا', 'ببا'],
  'الفيوم': ['الفيوم', 'أطسا', 'إبشواي', 'سنورس', 'يوسف الصديق'],
  'المنيا': ['المنيا', 'ملوي', 'أبو قرقاص', 'سمالوط', 'مغاغة'],
  'أسيوط': ['أسيوط', 'منفلوط', 'الغنايم', 'أبنوب', 'الفتح'],
  'سوهاج': ['سوهاج', 'أخميم', 'جرجا', 'طهطا', 'المراغة'],
  'قنا': ['قنا', 'نجع حمادي', 'الأقصر قديماً', 'دشنا', 'فرشوط'],
  'الأقصر': ['الأقصر', 'إسنا', 'البياضية', 'الطود', 'الزينية'],
  'أسوان': ['أسوان', 'دراو', 'الرديسية', 'إدفو', 'نصر النوبة'],
  'البحر الأحمر': ['الغردقة', 'القصير', 'مرسى علم', 'رأس غارب', 'الشلاتين'],
  'الوادي الجديد': ['الخارجة', 'الداخلة', 'باريس', 'بلاط', 'الفرافرة'],
  'مطروح': ['مطروح', 'برج العرب', 'الحمام', 'العلمين', 'النجيلة'],
};

@Injectable()
export class LocationsService implements OnModuleInit {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async onModuleInit() {
    const count = await this.locationRepository.count();
    if (count > 0) return;

    for (const gov of GOVERNORATES) {
      const govEntity = this.locationRepository.create({ type: 'governorate', name: gov });
      const saved = await this.locationRepository.save(govEntity);

      const dirEntity = this.locationRepository.create({ type: 'directorate', name: `مديرية التربية والتعليم بـ${gov}`, parentId: saved.id });
      const savedDir = await this.locationRepository.save(dirEntity);

      const admins = SAMPLE_ADMINISTRATIONS[gov] || [];
      for (const admin of admins) {
        this.locationRepository.save(this.locationRepository.create({ type: 'administration', name: `إدارة ${admin} التعليمية`, parentId: savedDir.id }));
      }
    }
    this.logger.info(`seeded ${GOVERNORATES.length} governorates with directorates and administrations`);
  }

  async findAll(type?: string, parentId?: number) {
    const where: any = {};
    if (type) where.type = type;
    if (parentId !== undefined) where.parentId = parentId;
    return this.locationRepository.find({ where, order: { name: 'ASC' } });
  }
}
