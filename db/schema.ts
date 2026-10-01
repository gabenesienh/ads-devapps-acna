import { pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

// Possíveis status de um usuário
export const statusEnum = pgEnum('status', ['ativo', 'banido']);

// Cadastros de usuários que se cadastraram no site
export const usuariosTable = pgTable("usuarios", {
  usuarioId: serial().primaryKey(),
  criadoEm: timestamp().notNull().defaultNow(),
  deletadoEm: timestamp(),
  email: varchar({ length: 256 }).unique().notNull(),
  nome: varchar({ length: 80 }).unique().notNull(),
  senha: varchar({ length: 80 }).notNull(),
  status: statusEnum().notNull(),
});