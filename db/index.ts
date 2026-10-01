import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';

// Uma única conexão com o banco, compartilhada por todas as rotas
export const db = drizzle(process.env.DATABASE_URL!);
