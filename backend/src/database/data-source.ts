import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL || undefined,
  host: process.env.DATABASE_URL ? undefined : process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_URL ? undefined : Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_URL ? undefined : process.env.DATABASE_USERNAME || 'khatwa',
  password: process.env.DATABASE_URL ? undefined : process.env.DATABASE_PASSWORD || 'khatwa_pass',
  database: process.env.DATABASE_URL ? undefined : process.env.DATABASE_NAME || 'khatwa_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  ssl: process.env.DATABASE_URL || process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
