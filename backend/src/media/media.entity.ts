import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  storagePath: string;

  @Column({ nullable: true })
  tags: string;

  @Column({ nullable: true })
  studentId: number;

  @Column({ default: 0 })
  uploadedBy: number;

  @CreateDateColumn()
  createdAt: Date;
}
