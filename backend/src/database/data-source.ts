import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
config();

function parseDbUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port),
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
  };
}

const dbUrl = process.env.DATABASE_URL;
const dbParsed = dbUrl ? parseDbUrl(dbUrl) : undefined;

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: dbParsed?.host || process.env.DATABASE_HOST || 'localhost',
  port: dbParsed?.port || Number(process.env.DATABASE_PORT || 5432),
  username: dbParsed?.username || process.env.DATABASE_USERNAME || 'khatwa',
  password: dbParsed?.password || process.env.DATABASE_PASSWORD || 'khatwa_pass',
  database: dbParsed?.database || process.env.DATABASE_NAME || 'khatwa_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  ssl: dbParsed || process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
