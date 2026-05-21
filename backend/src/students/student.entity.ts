import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  birthDate: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  disabilityType: string;

  @Column({ nullable: true })
  diagnosis: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  schoolId: number;

  @Column({ nullable: true })
  parentId: number;

  @Column({ nullable: true })
  schoolName: string;

  @Column({ nullable: true })
  administration: string;

  @Column({ nullable: true })
  directorate: string;

  @Column({ nullable: true })
  governorate: string;

  @Column({ type: 'text', nullable: true })
  piiEncrypted: string;

  @Column({ nullable: true })
  lre: string;

  @Column({ default: 2 })
  rtiTier: number;

  @Column({ nullable: true })
  rtiTierAssessedAt: Date;

  @Column({ default: 0 })
  riskScore: number;

  @Column({ nullable: true })
  riskScoreUpdatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
