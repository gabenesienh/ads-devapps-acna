// Funções auxiliares usadas nas views (EJS)

// Formata uma data como "hoje, 14:31", "ontem, 22:40" ou "29/09/2026"
export function formatarData(data: Date | string | null | undefined): string {
  if (!data) return '';
  const d = new Date(data);
  const fuso = 'America/Sao_Paulo';
  const dia = (x: Date) => x.toLocaleDateString('pt-BR', { timeZone: fuso });
  const hora = d.toLocaleTimeString('pt-BR', { timeZone: fuso, hour: '2-digit', minute: '2-digit' });

  const hoje = new Date();
  const ontem = new Date(hoje.getTime() - 24 * 60 * 60 * 1000);
  if (dia(d) === dia(hoje)) return `hoje, ${hora}`;
  if (dia(d) === dia(ontem)) return `ontem, ${hora}`;
  return dia(d);
}

// Formata "set/2026"
export function formatarMesAno(data: Date | string): string {
  const d = new Date(data);
  const mes = d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' }).replace('.', '');
  return `${mes}/${d.getFullYear()}`;
}

// Cor fixa do avatar de cada usuário (baseada no id)
const cores = ['#c0392b', '#16a085', '#8e44ad', '#2980b9', '#d35400', '#27ae60', '#2c3e50', '#b03a76'];
export function corAvatar(id: number): string {
  return cores[(id || 0) % cores.length];
}

// Primeira letra do nome, em maiúscula
export function inicial(nome: string): string {
  return (nome || '?').charAt(0).toUpperCase();
}

// Formata números: 2341 -> "2.341"
export function numero(n: number): string {
  return Number(n || 0).toLocaleString('pt-BR');
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Transforma o texto da mensagem em HTML seguro.
// Suporta citações no formato [quote=nome]texto[/quote] e quebras de linha.
export function renderizarConteudo(texto: string): string {
  let html = escaparHtml(texto || '');
  const citacao = /\[quote=([^\]]{1,80})\]([\s\S]*?)\[\/quote\]\n?/;
  // Repete para suportar citações dentro de citações
  while (citacao.test(html)) {
    html = html.replace(citacao, '<blockquote><b>$1 disse:</b><br>$2</blockquote>');
  }
  return html.replace(/\n/g, '<br>');
}

// Nome do cargo para exibir
export function nomeCargo(cargo: string): string {
  return { membro: 'Membro', moderador: 'Moderador', admin: 'Administrador' }[cargo] || 'Membro';
}

// Calcula a paginação a partir do número da página (?pagina=2)
export function paginar(paginaQuery: any, total: number, porPagina: number) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  let pagina = parseInt(paginaQuery, 10) || 1;
  pagina = Math.min(Math.max(pagina, 1), totalPaginas);
  return { pagina, totalPaginas, offset: (pagina - 1) * porPagina, porPagina, total };
}
