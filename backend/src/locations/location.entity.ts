import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  type: 'governorate' | 'directorate' | 'administration';

  @Column()
  name: string;

  @Column({ nullable: true })
  parentId: number;
}
