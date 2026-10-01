import { asc, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { usuariosTable } from '@/db/schema';
import { rota } from '@/lib/auth';

let express = require('express');
let router = express.Router();

/* GET lista de membros. */
router.get('/', rota(async function(req, res) {
  const membros = await db
    .select({
      usuarioId: usuariosTable.usuarioId,
      nome: usuariosTable.nome,
      cargo: usuariosTable.cargo,
      status: usuariosTable.status,
      criadoEm: usuariosTable.criadoEm,
      mensagens: sql<number>`(
        select count(*) from "postagens" p
        where p."usuarioId" = ${usuariosTable.usuarioId} and p."deletadoEm" is null
      )`.mapWith(Number),
    })
    .from(usuariosTable)
    .where(isNull(usuariosTable.deletadoEm))
    .orderBy(asc(usuariosTable.nome));

  res.render('membros', { titulo: 'Membros', menu: 'membros', membros });
}));

module.exports = router;
