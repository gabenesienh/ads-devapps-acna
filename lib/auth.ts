// Middlewares e utilidades de autenticação

// Guarda quem acessou o site nos últimos minutos ("Membros online")
const vistos = new Map<number, { nome: string; em: number }>();
const CINCO_MINUTOS = 5 * 60 * 1000;

export function registrarAcesso(usuario: { usuarioId: number; nome: string }) {
  vistos.set(usuario.usuarioId, { nome: usuario.nome, em: Date.now() });
}

export function removerAcesso(usuarioId: number) {
  vistos.delete(usuarioId);
}

export function membrosOnline() {
  const limite = Date.now() - CINCO_MINUTOS;
  const lista: { usuarioId: number; nome: string }[] = [];
  for (const [usuarioId, info] of vistos) {
    if (info.em >= limite) lista.push({ usuarioId, nome: info.nome });
    else vistos.delete(usuarioId);
  }
  return lista;
}

// Bloqueia a rota para quem não está logado
export function exigirLogin(req, res, next) {
  if (req.session.usuario) return next();
  if (req.method === 'GET') req.session.voltarPara = req.originalUrl;
  res.redirect('/login');
}

// Moderadores e administradores podem fixar/fechar tópicos
export function ehModerador(usuario): boolean {
  return !!usuario && (usuario.cargo === 'moderador' || usuario.cargo === 'admin');
}

// Express 4 não captura erros de funções async: este wrapper repassa o erro
export function rota(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
