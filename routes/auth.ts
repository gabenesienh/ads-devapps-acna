import bcrypt from 'bcryptjs';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { usuariosTable } from '@/db/schema';
import { removerAcesso, rota } from '@/lib/auth';

let express = require('express');
let router = express.Router();

// Renderiza a página com os dois formulários (entrar e cadastrar)
function telaAuth(res, dados = {}) {
  res.render('auth', {
    titulo: 'Entrar ou cadastrar',
    erroLogin: null,
    erroCadastro: null,
    login: '',
    cadastro: { nome: '', email: '' },
    ...dados,
  });
}

// Salva o usuário na sessão e volta para a página em que ele estava
function logar(req, res, usuario) {
  const destino = req.session.voltarPara || '/';
  req.session.regenerate((erro) => {
    if (erro) return res.redirect('/login');
    req.session.usuario = {
      usuarioId: usuario.usuarioId,
      nome: usuario.nome,
      cargo: usuario.cargo,
    };
    req.session.save(() => res.redirect(destino));
  });
}

router.get('/login', (req, res) => telaAuth(res));
router.get('/cadastro', (req, res) => telaAuth(res));

/* POST login com e-mail ou nome de usuário. */
router.post('/login', rota(async function(req, res) {
  const login = String(req.body.login || '').trim();
  const senha = String(req.body.senha || '');

  const [usuario] = await db
    .select()
    .from(usuariosTable)
    .where(and(
      isNull(usuariosTable.deletadoEm),
      or(
        sql`lower(${usuariosTable.email}) = lower(${login})`,
        sql`lower(${usuariosTable.nome}) = lower(${login})`,
      ),
    ))
    .limit(1);

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    return telaAuth(res.status(401), { erroLogin: 'Usuário ou senha incorretos.', login });
  }
  if (usuario.status === 'banido') {
    return telaAuth(res.status(403), { erroLogin: 'Esta conta foi banida.', login });
  }

  logar(req, res, usuario);
}));

/* POST cadastro de novo usuário. */
router.post('/cadastro', rota(async function(req, res) {
  const nome = String(req.body.nome || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const senha = String(req.body.senha || '');
  const confirmacao = String(req.body.confirmacao || '');
  const cadastro = { nome, email };

  let erro = null;
  if (!/^[A-Za-z0-9_.-]{3,80}$/.test(nome)) {
    erro = 'O nome de usuário deve ter de 3 a 80 caracteres (letras, números, ponto, _ ou -).';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 256) {
    erro = 'Informe um e-mail válido.';
  } else if (senha.length < 6) {
    erro = 'A senha deve ter pelo menos 6 caracteres.';
  } else if (senha !== confirmacao) {
    erro = 'As senhas não conferem.';
  }

  if (!erro) {
    const [existente] = await db
      .select({ nome: usuariosTable.nome, email: usuariosTable.email })
      .from(usuariosTable)
      .where(or(
        sql`lower(${usuariosTable.nome}) = lower(${nome})`,
        sql`lower(${usuariosTable.email}) = lower(${email})`,
      ))
      .limit(1);
    if (existente) {
      erro = existente.email.toLowerCase() === email
        ? 'Este e-mail já está cadastrado.'
        : 'Este nome de usuário já está em uso.';
    }
  }

  if (erro) return telaAuth(res.status(400), { erroCadastro: erro, cadastro });

  const hash = await bcrypt.hash(senha, 10);
  const [novo] = await db.insert(usuariosTable)
    .values({ nome, email, senha: hash })
    .returning();

  logar(req, res, novo);
}));

/* POST sair. */
router.post('/logout', function(req, res) {
  if (req.session.usuario) removerAcesso(req.session.usuario.usuarioId);
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
