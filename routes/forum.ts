import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { categoriasTable, forunsTable, postagensTable, topicosTable, usuariosTable } from '@/db/schema';
import { contarTopicos, listarForunsSimples, listarTopicos } from '@/lib/consultas';
import { ehModerador, exigirLogin, rota } from '@/lib/auth';
import { paginar } from '@/lib/helpers';

let express = require('express');
let createError = require('http-errors');
let router = express.Router();

const MENSAGENS_POR_PAGINA = 15;

// Busca um fórum (com o nome da categoria) ou retorna null
async function buscarForum(forumId: number) {
  if (!Number.isInteger(forumId)) return null;
  const [forum] = await db
    .select({
      forumId: forunsTable.forumId,
      nome: forunsTable.nome,
      descricao: forunsTable.descricao,
      categoriaNome: categoriasTable.nome,
    })
    .from(forunsTable)
    .innerJoin(categoriasTable, eq(categoriasTable.categoriaId, forunsTable.categoriaId))
    .where(and(eq(forunsTable.forumId, forumId), isNull(forunsTable.deletadoEm)));
  return forum || null;
}

// Busca um tópico (com fórum e categoria) ou retorna null
async function buscarTopico(topicoId: number) {
  if (!Number.isInteger(topicoId)) return null;
  const [topico] = await db
    .select({
      topicoId: topicosTable.topicoId,
      titulo: topicosTable.titulo,
      fixo: topicosTable.fixo,
      fechado: topicosTable.fechado,
      forumId: forunsTable.forumId,
      forumNome: forunsTable.nome,
      categoriaNome: categoriasTable.nome,
    })
    .from(topicosTable)
    .innerJoin(forunsTable, eq(forunsTable.forumId, topicosTable.forumId))
    .innerJoin(categoriasTable, eq(categoriasTable.categoriaId, forunsTable.categoriaId))
    .where(and(
      eq(topicosTable.topicoId, topicoId),
      isNull(topicosTable.deletadoEm),
      isNull(forunsTable.deletadoEm),
    ));
  return topico || null;
}

/* GET lista de tópicos de um fórum. */
router.get('/forum/:id', rota(async function(req, res, next) {
  const forum = await buscarForum(Number(req.params.id));
  if (!forum) return next(createError(404, 'Fórum não encontrado'));

  const filtro = eq(topicosTable.forumId, forum.forumId);
  const pag = paginar(req.query.pagina, await contarTopicos(filtro), 20);
  const topicos = await listarTopicos(filtro, {
    limite: pag.porPagina,
    offset: pag.offset,
    fixosPrimeiro: true,
  });

  res.render('lista-topicos', {
    titulo: forum.nome,
    menu: 'foruns',
    cabecalho: forum.nome,
    forum,
    topicos,
    pag,
    mostrarForum: false,
    url: `/forum/${forum.forumId}?`,
  });
}));

/* GET formulário de novo tópico. */
router.get('/forum/:id/novo', exigirLogin, rota(async function(req, res, next) {
  const forum = await buscarForum(Number(req.params.id));
  if (!forum) return next(createError(404, 'Fórum não encontrado'));

  res.render('novo-topico', {
    titulo: 'Novo tópico',
    menu: 'foruns',
    forum,
    foruns: await listarForunsSimples(),
    erro: null,
    valores: { forumId: forum.forumId, titulo: '', conteudo: '' },
  });
}));

/* POST cria o tópico e a primeira mensagem. */
router.post('/forum/:id/novo', exigirLogin, rota(async function(req, res, next) {
  const titulo = String(req.body.titulo || '').trim();
  const conteudo = String(req.body.conteudo || '').trim();
  const forum = await buscarForum(Number(req.body.forumId || req.params.id));
  if (!forum) return next(createError(404, 'Fórum não encontrado'));

  let erro = null;
  if (titulo.length < 3 || titulo.length > 150) erro = 'O título deve ter entre 3 e 150 caracteres.';
  else if (conteudo.length < 2) erro = 'Escreva uma mensagem.';
  else if (conteudo.length > 20000) erro = 'A mensagem é muito longa (máximo 20.000 caracteres).';

  if (erro) {
    return res.status(400).render('novo-topico', {
      titulo: 'Novo tópico',
      menu: 'foruns',
      forum,
      foruns: await listarForunsSimples(),
      erro,
      valores: { forumId: forum.forumId, titulo, conteudo },
    });
  }

  const usuarioId = req.session.usuario.usuarioId;
  const topicoId = await db.transaction(async (tx) => {
    const [topico] = await tx.insert(topicosTable)
      .values({ forumId: forum.forumId, usuarioId, titulo })
      .returning({ topicoId: topicosTable.topicoId });
    await tx.insert(postagensTable).values({ topicoId: topico.topicoId, usuarioId, conteudo });
    return topico.topicoId;
  });

  res.redirect(`/topico/${topicoId}`);
}));

/* GET um tópico com suas mensagens. */
router.get('/topico/:id', rota(async function(req, res, next) {
  const topico = await buscarTopico(Number(req.params.id));
  if (!topico) return next(createError(404, 'Tópico não encontrado'));

  // Conta mais uma visita
  await db.update(topicosTable)
    .set({ visitas: sql`${topicosTable.visitas} + 1` })
    .where(eq(topicosTable.topicoId, topico.topicoId));

  const filtro = and(eq(postagensTable.topicoId, topico.topicoId), isNull(postagensTable.deletadoEm));
  const [{ total }] = await db.select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(postagensTable)
    .where(filtro);
  const pag = paginar(req.query.pagina, total, MENSAGENS_POR_PAGINA);

  const postagens = await db
    .select({
      postagemId: postagensTable.postagemId,
      conteudo: postagensTable.conteudo,
      criadoEm: postagensTable.criadoEm,
      autorId: usuariosTable.usuarioId,
      autorNome: usuariosTable.nome,
      autorCargo: usuariosTable.cargo,
      autorDesde: usuariosTable.criadoEm,
      autorMensagens: sql<number>`(
        select count(*) from "postagens" p2
        where p2."usuarioId" = ${usuariosTable.usuarioId} and p2."deletadoEm" is null
      )`.mapWith(Number),
    })
    .from(postagensTable)
    .innerJoin(usuariosTable, eq(usuariosTable.usuarioId, postagensTable.usuarioId))
    .where(filtro)
    .orderBy(asc(postagensTable.criadoEm), asc(postagensTable.postagemId))
    .limit(pag.porPagina)
    .offset(pag.offset);

  res.render('topico', {
    titulo: topico.titulo,
    menu: 'foruns',
    topico,
    postagens,
    pag,
    podeResponder: !!req.session.usuario && (!topico.fechado || ehModerador(req.session.usuario)),
  });
}));

/* POST responde um tópico. */
router.post('/topico/:id/responder', exigirLogin, rota(async function(req, res, next) {
  const topico = await buscarTopico(Number(req.params.id));
  if (!topico) return next(createError(404, 'Tópico não encontrado'));
  if (topico.fechado && !ehModerador(req.session.usuario)) {
    return next(createError(403, 'Este tópico está fechado para respostas.'));
  }

  const conteudo = String(req.body.conteudo || '').trim();
  if (conteudo.length < 2 || conteudo.length > 20000) {
    return res.redirect(`/topico/${topico.topicoId}?pagina=9999#responder`);
  }

  const [nova] = await db.insert(postagensTable)
    .values({ topicoId: topico.topicoId, usuarioId: req.session.usuario.usuarioId, conteudo })
    .returning({ postagemId: postagensTable.postagemId });

  await db.update(topicosTable)
    .set({ atualizadoEm: new Date() })
    .where(eq(topicosTable.topicoId, topico.topicoId));

  // pagina=9999 é ajustada para a última página pela função paginar()
  res.redirect(`/topico/${topico.topicoId}?pagina=9999#p${nova.postagemId}`);
}));

/* POST fixar/desafixar ou fechar/abrir um tópico (moderadores). */
router.post('/topico/:id/:acao(fixar|fechar)', exigirLogin, rota(async function(req, res, next) {
  if (!ehModerador(req.session.usuario)) return next(createError(403, 'Apenas moderadores.'));
  const topico = await buscarTopico(Number(req.params.id));
  if (!topico) return next(createError(404, 'Tópico não encontrado'));

  const mudanca = req.params.acao === 'fixar' ? { fixo: !topico.fixo } : { fechado: !topico.fechado };
  await db.update(topicosTable).set(mudanca).where(eq(topicosTable.topicoId, topico.topicoId));
  res.redirect(`/topico/${topico.topicoId}`);
}));

module.exports = router;
