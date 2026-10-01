// Consultas ao banco reaproveitadas por várias rotas
import { and, count, desc, eq, isNull, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/index';
import { forunsTable, postagensTable, topicosTable, usuariosTable } from '@/db/schema';

// Número de respostas do tópico (todas as mensagens menos a primeira)
const respostas = sql<number>`(
  select count(*) from "postagens" p
  where p."topicoId" = ${topicosTable.topicoId} and p."deletadoEm" is null
) - 1`.mapWith(Number);

// Nome e id de quem mandou a última mensagem do tópico
const ultimoAutorNome = sql<string>`(
  select u."nome" from "postagens" p
  join "usuarios" u on u."usuarioId" = p."usuarioId"
  where p."topicoId" = ${topicosTable.topicoId} and p."deletadoEm" is null
  order by p."criadoEm" desc, p."postagemId" desc limit 1
)`;
const ultimoAutorId = sql<number>`(
  select p."usuarioId" from "postagens" p
  where p."topicoId" = ${topicosTable.topicoId} and p."deletadoEm" is null
  order by p."criadoEm" desc, p."postagemId" desc limit 1
)`.mapWith(Number);

// Condição base: tópicos não apagados, em fóruns não apagados
function filtroBase(filtro?: SQL) {
  return and(isNull(topicosTable.deletadoEm), isNull(forunsTable.deletadoEm), filtro);
}

// Lista tópicos com autor, fórum, nº de respostas e última mensagem
export async function listarTopicos(
  filtro: SQL | undefined,
  opcoes: { limite: number; offset?: number; fixosPrimeiro?: boolean },
) {
  const ordem = opcoes.fixosPrimeiro
    ? [desc(topicosTable.fixo), desc(topicosTable.atualizadoEm)]
    : [desc(topicosTable.atualizadoEm)];

  return db
    .select({
      topicoId: topicosTable.topicoId,
      titulo: topicosTable.titulo,
      fixo: topicosTable.fixo,
      fechado: topicosTable.fechado,
      visitas: topicosTable.visitas,
      criadoEm: topicosTable.criadoEm,
      atualizadoEm: topicosTable.atualizadoEm,
      forumId: forunsTable.forumId,
      forumNome: forunsTable.nome,
      autorId: usuariosTable.usuarioId,
      autorNome: usuariosTable.nome,
      respostas,
      ultimoAutorNome,
      ultimoAutorId,
    })
    .from(topicosTable)
    .innerJoin(forunsTable, eq(forunsTable.forumId, topicosTable.forumId))
    .innerJoin(usuariosTable, eq(usuariosTable.usuarioId, topicosTable.usuarioId))
    .where(filtroBase(filtro))
    .orderBy(...ordem)
    .limit(opcoes.limite)
    .offset(opcoes.offset ?? 0);
}

// Conta quantos tópicos atendem ao filtro (para a paginação)
export async function contarTopicos(filtro?: SQL) {
  const [linha] = await db
    .select({ total: count() })
    .from(topicosTable)
    .innerJoin(forunsTable, eq(forunsTable.forumId, topicosTable.forumId))
    .where(filtroBase(filtro));
  return Number(linha?.total ?? 0);
}

// Lista de fóruns para o <select> de "novo tópico"
export async function listarForunsSimples() {
  return db
    .select({ forumId: forunsTable.forumId, nome: forunsTable.nome })
    .from(forunsTable)
    .where(isNull(forunsTable.deletadoEm))
    .orderBy(forunsTable.categoriaId, forunsTable.ordem);
}

// Totais exibidos na barra lateral
export async function estatisticas() {
  const [[topicos], [postagens], [usuarios], [novo]] = await Promise.all([
    db.select({ total: count() }).from(topicosTable).where(isNull(topicosTable.deletadoEm)),
    db.select({ total: count() }).from(postagensTable).where(isNull(postagensTable.deletadoEm)),
    db.select({ total: count() }).from(usuariosTable).where(isNull(usuariosTable.deletadoEm)),
    db.select({ usuarioId: usuariosTable.usuarioId, nome: usuariosTable.nome })
      .from(usuariosTable)
      .where(isNull(usuariosTable.deletadoEm))
      .orderBy(desc(usuariosTable.usuarioId))
      .limit(1),
  ]);
  return {
    topicos: Number(topicos?.total ?? 0),
    postagens: Number(postagens?.total ?? 0),
    usuarios: Number(usuarios?.total ?? 0),
    novoMembro: novo ?? null,
  };
}
