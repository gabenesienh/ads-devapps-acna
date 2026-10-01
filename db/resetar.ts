// ATENÇÃO: apaga TODAS as tabelas e dados do banco configurado no .env
// e o histórico de migrations do Drizzle. Use só em ambiente de desenvolvimento.
// Uso: npm run db:reset   (depois rode: npm run db:migrate && npm run db:seed)
import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { onnotice: () => {} });
  try {
    await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
    await sql`DROP SCHEMA IF EXISTS public CASCADE`;
    await sql`CREATE SCHEMA public`;
    console.log('Banco zerado! Agora rode: npm run db:migrate e depois npm run db:seed');
  } finally {
    await sql.end();
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
