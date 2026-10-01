// Preenche o banco com dados de exemplo.
// Uso: npm run db:seed
import bcrypt from 'bcryptjs';
import { db } from '@/db/index';
import {
  categoriasTable, forunsTable, postagensTable, topicosTable, usuariosTable,
} from '@/db/schema';

async function main() {
  const jaTem = await db.select().from(categoriasTable).limit(1);
  if (jaTem.length > 0) {
    console.log('O banco já tem categorias. Nada foi alterado.');
    return;
  }

  const senha = await bcrypt.hash('123456', 10);
  const [admin, ana, lucas] = await db.insert(usuariosTable).values([
    { nome: 'admin', email: 'admin@acna.com', senha, cargo: 'admin' },
    { nome: 'ana.c', email: 'ana@acna.com', senha },
    { nome: 'lucas.m', email: 'lucas@acna.com', senha },
  ]).onConflictDoNothing().returning();

  if (!admin || !ana || !lucas) {
    console.log('Usuários de exemplo já existem. Apague-os ou ajuste o seed.');
    return;
  }

  const [geral, dev] = await db.insert(categoriasTable).values([
    { nome: 'Geral', descricao: 'Assuntos da comunidade', ordem: 1 },
    { nome: 'Desenvolvimento', descricao: 'Programação e projetos', ordem: 2 },
  ]).returning();

  const [avisos, apresentacoes, livre, duvidas] = await db.insert(forunsTable).values([
    { categoriaId: geral.categoriaId, nome: 'Avisos e Regras', descricao: 'Comunicados da equipe e regras do fórum. Leia antes de postar!', icone: '📢', ordem: 1 },
    { categoriaId: geral.categoriaId, nome: 'Apresentações', descricao: 'Chegou agora? Conte um pouco sobre você.', icone: '👋', ordem: 2 },
    { categoriaId: geral.categoriaId, nome: 'Conversa Livre', descricao: 'Qualquer assunto que não se encaixe nos outros fóruns.', icone: '💬', ordem: 3 },
    { categoriaId: dev.categoriaId, nome: 'Dúvidas e Ajuda', descricao: 'Travou em algo? Peça ajuda aqui.', icone: '❓', ordem: 1 },
    { categoriaId: dev.categoriaId, nome: 'Projetos da Comunidade', descricao: 'Mostre o que você está construindo.', icone: '🛠️', ordem: 2 },
    { categoriaId: dev.categoriaId, nome: 'Tutoriais', descricao: 'Guias e materiais de estudo.', icone: '📚', ordem: 3 },
  ]).returning();

  // Cria um tópico com a primeira mensagem e respostas
  async function criarTopico(forumId: number, autorId: number, titulo: string, mensagens: [number, string][], extra = {}) {
    const [topico] = await db.insert(topicosTable)
      .values({ forumId, usuarioId: autorId, titulo, ...extra })
      .returning();
    for (const [usuarioId, conteudo] of mensagens) {
      await db.insert(postagensTable).values({ topicoId: topico.topicoId, usuarioId, conteudo });
    }
  }

  await criarTopico(avisos.forumId, admin.usuarioId, 'Regras do fórum', [
    [admin.usuarioId, 'Bem-vindos!\n\n1. Respeite os outros membros.\n2. Poste no fórum certo.\n3. Nada de spam.'],
  ], { fixo: true, fechado: true });

  await criarTopico(apresentacoes.forumId, ana.usuarioId, 'Olá, sou a Ana!', [
    [ana.usuarioId, 'Oi pessoal! Estou estudando desenvolvimento web e cheguei agora por aqui.'],
    [lucas.usuarioId, 'Seja bem-vinda, Ana!'],
  ]);

  await criarTopico(livre.forumId, lucas.usuarioId, 'Qual jogo vocês estão jogando?', [
    [lucas.usuarioId, 'Contem aí o que estão jogando ultimamente.'],
  ]);

  await criarTopico(duvidas.forumId, ana.usuarioId, 'Diferença entre let e const?', [
    [ana.usuarioId, 'Quando devo usar let e quando devo usar const?'],
    [lucas.usuarioId, '[quote=ana.c]Quando devo usar let e quando devo usar const?[/quote]\nUse const quando a variável não vai receber outro valor, e let quando vai.'],
  ]);

  console.log('Dados de exemplo criados! Login: admin / senha: 123456');
}

main()
  .catch((erro) => { console.error(erro); process.exitCode = 1; })
  .finally(() => process.exit());
