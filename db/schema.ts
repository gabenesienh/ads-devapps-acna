import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usuariosTable = pgTable("usuarios", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  nome: varchar({ length: 255 }).notNull().unique(),
  senha: varchar({ length: 80 }).notNull(),
});