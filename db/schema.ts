import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Possíveis status de um usuário
export const statusEnum = pgEnum('status', ['ativo', 'banido']);

// Cargos de um usuário no fórum
export const cargoEnum = pgEnum('cargo', ['membro', 'moderador', 'admin']);

// Cadastros de usuários que se cadastraram no site
export const usuariosTable = pgTable("usuarios", {
  usuarioId: serial().primaryKey(),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletadoEm: timestamp({ withTimezone: true }),
  email: varchar({ length: 256 }).unique().notNull(),
  nome: varchar({ length: 80 }).unique().notNull(),
  senha: varchar({ length: 80 }).notNull(),
  status: statusEnum().notNull().default('ativo'),
  cargo: cargoEnum().notNull().default('membro'),
});

// Categorias que agrupam os fóruns na página inicial (ex.: "Geral", "Desenvolvimento")
export const categoriasTable = pgTable("categorias", {
  categoriaId: serial().primaryKey(),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletadoEm: timestamp({ withTimezone: true }),
  nome: varchar({ length: 80 }).notNull(),
  descricao: varchar({ length: 255 }),
  ordem: integer().notNull().default(0),
});

// Fóruns (sub-seções) dentro de cada categoria
export const forunsTable = pgTable("foruns", {
  forumId: serial().primaryKey(),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletadoEm: timestamp({ withTimezone: true }),
  categoriaId: integer().notNull().references(() => categoriasTable.categoriaId),
  nome: varchar({ length: 80 }).notNull(),
  descricao: varchar({ length: 255 }),
  icone: varchar({ length: 16 }).notNull().default('💬'),
  ordem: integer().notNull().default(0),
});

// Tópicos criados pelos usuários dentro de um fórum
export const topicosTable = pgTable("topicos", {
  topicoId: serial().primaryKey(),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletadoEm: timestamp({ withTimezone: true }),
  // Data da última resposta (usada para ordenar os tópicos)
  atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  forumId: integer().notNull().references(() => forunsTable.forumId),
  usuarioId: integer().notNull().references(() => usuariosTable.usuarioId),
  titulo: varchar({ length: 150 }).notNull(),
  fixo: boolean().notNull().default(false),
  fechado: boolean().notNull().default(false),
  visitas: integer().notNull().default(0),
});

// Mensagens (a primeira mensagem de um tópico também fica aqui)
export const postagensTable = pgTable("postagens", {
  postagemId: serial().primaryKey(),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletadoEm: timestamp({ withTimezone: true }),
  topicoId: integer().notNull().references(() => topicosTable.topicoId),
  usuarioId: integer().notNull().references(() => usuariosTable.usuarioId),
  conteudo: text().notNull(),
});
