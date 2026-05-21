import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('accommodations')
export class Accommodation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  studentId: number;

  @Column()
  accommodationType: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  startDate: string;

  @Column({ nullable: true })
  endDate: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: 0 })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;
}
