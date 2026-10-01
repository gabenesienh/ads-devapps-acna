import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { categoriasTable, forunsTable, postagensTable, topicosTable, usuariosTable } from '@/db/schema';
import { contarTopicos, estatisticas, listarTopicos } from '@/lib/consultas';
import { membrosOnline, rota } from '@/lib/auth';
import { paginar } from '@/lib/helpers';

let express = require('express');
let router = express.Router();

/* GET home page: categorias e fóruns. */
router.get('/', rota(async function(req, res) {
  const categorias = await db
    .select()
    .from(categoriasTable)
    .where(isNull(categoriasTable.deletadoEm))
    .orderBy(asc(categoriasTable.ordem), asc(categoriasTable.categoriaId));

  const foruns = await db
    .select({
      forumId: forunsTable.forumId,
      categoriaId: forunsTable.categoriaId,
      nome: forunsTable.nome,
      descricao: forunsTable.descricao,
      icone: forunsTable.icone,
      totalTopicos: sql<number>`(
        select count(*) from "topicos" t
        where t."forumId" = ${forunsTable.forumId} and t."deletadoEm" is null
      )`.mapWith(Number),
      totalPostagens: sql<number>`(
        select count(*) from "postagens" p
        join "topicos" t on t."topicoId" = p."topicoId"
        where t."forumId" = ${forunsTable.forumId}
          and t."deletadoEm" is null and p."deletadoEm" is null
      )`.mapWith(Number),
    })
    .from(forunsTable)
    .where(isNull(forunsTable.deletadoEm))
    .orderBy(asc(forunsTable.ordem), asc(forunsTable.forumId));

  // Última mensagem de cada fórum
  const ultimas = await db
    .selectDistinctOn([topicosTable.forumId], {
      forumId: topicosTable.forumId,
      topicoId: topicosTable.topicoId,
      titulo: topicosTable.titulo,
      criadoEm: postagensTable.criadoEm,
      autorId: usuariosTable.usuarioId,
      autorNome: usuariosTable.nome,
    })
    .from(postagensTable)
    .innerJoin(topicosTable, eq(topicosTable.topicoId, postagensTable.topicoId))
    .innerJoin(usuariosTable, eq(usuariosTable.usuarioId, postagensTable.usuarioId))
    .where(and(isNull(postagensTable.deletadoEm), isNull(topicosTable.deletadoEm)))
    .orderBy(topicosTable.forumId, desc(postagensTable.criadoEm), desc(postagensTable.postagemId));

  const ultimaPorForum = new Map(ultimas.map((u) => [u.forumId, u]));

  const blocos = categorias.map((categoria) => ({
    ...categoria,
    foruns: foruns
      .filter((f) => f.categoriaId === categoria.categoriaId)
      .map((f) => ({ ...f, ultima: ultimaPorForum.get(f.forumId) || null })),
  }));

  res.render('index', {
    titulo: 'Página Inicial',
    menu: 'foruns',
    categorias: blocos,
    stats: await estatisticas(),
    online: membrosOnline(),
  });
}));

/* GET tópicos recentes de todos os fóruns. */
router.get('/recentes', rota(async function(req, res) {
  const total = await contarTopicos();
  const pag = paginar(req.query.pagina, total, 20);
  const topicos = await listarTopicos(undefined, { limite: pag.porPagina, offset: pag.offset });

  res.render('lista-topicos', {
    titulo: 'Tópicos recentes',
    menu: 'recentes',
    cabecalho: 'Tópicos recentes',
    topicos,
    pag,
    mostrarForum: true,
    url: '/recentes?',
  });
}));

/* GET pesquisa por título ou conteúdo das mensagens. */
router.get('/pesquisa', rota(async function(req, res) {
  const q = String(req.query.q || '').trim().slice(0, 100);
  let topicos = [];
  let pag = paginar(1, 0, 20);

  if (q.length >= 2) {
    const termo = `%${q}%`;
    const filtro = or(
      ilike(topicosTable.titulo, termo),
      sql`exists (
        select 1 from "postagens" p
        where p."topicoId" = ${topicosTable.topicoId}
          and p."deletadoEm" is null and p."conteudo" ilike ${termo}
      )`,
    );
    const total = await contarTopicos(filtro);
    pag = paginar(req.query.pagina, total, 20);
    topicos = await listarTopicos(filtro, { limite: pag.porPagina, offset: pag.offset });
  }

  res.render('lista-topicos', {
    titulo: 'Pesquisar',
    menu: 'pesquisa',
    cabecalho: 'Pesquisar',
    pesquisa: q,
    topicos,
    pag,
    mostrarForum: true,
    url: `/pesquisa?q=${encodeURIComponent(q)}&`,
  });
}));

/* GET /register: link antigo da versão do colega, redireciona para o cadastro. */
router.get('/register', function(req, res) {
  res.redirect('/cadastro');
});

module.exports = router;
