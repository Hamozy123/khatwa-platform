import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('abc_records')
export class AbcRecord {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  studentId: number;

  @Column({ type: 'text' })
  antecedent: string;

  @Column({ type: 'text' })
  behavior: string;

  @Column({ type: 'text' })
  consequence: string;

  @Column({ nullable: true })
  date: string;

  @Column({ nullable: true })
  time: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 0 })
  recordedBy: number;

  @CreateDateColumn()
  createdAt: Date;
}
