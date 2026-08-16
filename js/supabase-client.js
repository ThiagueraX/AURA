/**
 * AURA MOCOCA • CAMADA DE DADOS
 *
 * O navegador não escreve mais direto nas tabelas. Tudo que envolve dinheiro,
 * dado de cliente ou validação de entrada passa por uma função no banco
 * (RPC, SECURITY DEFINER), que checa permissão do lado do servidor.
 *
 * A chave abaixo é a chave PÚBLICA (anon) — ela é feita para ficar exposta.
 * Quem protege as tabelas são as políticas RLS e os GRANTs, não o segredo
 * da chave.
 */

const SUPABASE_CONFIG = {
  url: 'https://sgfyxmajpdgynsicmzdb.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZnl4bWFqcGRneW5zaWNtemRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDcyNzUsImV4cCI6MjEwMDcyMzI3NX0.auX5eGMcbyeGYZdfOOd4uSPwCWe35NnaQPzi27BrMQ0'
};

const REST_HEADERS = {
  'apikey': SUPABASE_CONFIG.anonKey,
  'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// ═══════════════════════════════════════════════════════════════
// SESSÃO DA EQUIPE
// Guardada em sessionStorage de propósito: acaba quando a aba fecha.
// O tablet da portaria é compartilhado — sessão que sobrevive ao fechamento
// é sessão que o próximo a pegar o aparelho herda.
// ═══════════════════════════════════════════════════════════════

const CHAVE_SESSAO = 'aura_sessao_v1';
let papelEmCache = null;

function lerSessao() {
  try {
    const bruto = sessionStorage.getItem(CHAVE_SESSAO);
    return bruto ? JSON.parse(bruto) : null;
  } catch (e) {
    return null;
  }
}

function gravarSessao(dados) {
  try {
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({
      access_token: dados.access_token,
      refresh_token: dados.refresh_token,
      expira_em: Date.now() + ((dados.expires_in || 3600) * 1000)
    }));
  } catch (e) {
    console.warn('[Auth] Não foi possível guardar a sessão:', e);
  }
}

function limparSessao() {
  try { sessionStorage.removeItem(CHAVE_SESSAO); } catch (e) {}
  papelEmCache = null;
}

/** Renova o token quando faltam menos de 60s para expirar. */
async function tokenValido() {
  const s = lerSessao();
  if (!s || !s.access_token) return null;
  if (Date.now() < s.expira_em - 60000) return s.access_token;

  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (!res.ok) { limparSessao(); return null; }
    const novo = await res.json();
    gravarSessao(novo);
    return novo.access_token;
  } catch (e) {
    limparSessao();
    return null;
  }
}

async function cabecalhos({ autenticado = false } = {}) {
  const base = {
    'apikey': SUPABASE_CONFIG.anonKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  if (autenticado) {
    const token = await tokenValido();
    base.Authorization = `Bearer ${token || SUPABASE_CONFIG.anonKey}`;
  } else {
    base.Authorization = `Bearer ${SUPABASE_CONFIG.anonKey}`;
  }
  return base;
}

/** Chamada padrão de função do banco. Devolve sempre um objeto. */
async function chamarRpc(nome, params = {}, { autenticado = false } = {}) {
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/${nome}`, {
      method: 'POST',
      headers: await cabecalhos({ autenticado }),
      body: JSON.stringify(params)
    });

    const texto = await res.text();
    let corpo = null;
    try { corpo = texto ? JSON.parse(texto) : null; } catch (e) {}

    if (!res.ok) {
      // 401/403 aqui quase sempre significa sessão expirada, não bug
      const semPermissao = res.status === 401 || res.status === 403;
      console.warn(`[Supabase] ${nome} → HTTP ${res.status}`, texto.slice(0, 200));
      return {
        ok: false,
        sucesso: false,
        motivo: semPermissao ? 'SEM_PERMISSAO' : 'ERRO_SERVIDOR',
        mensagem: semPermissao
          ? 'Sua sessão expirou ou você não tem permissão. Faça login de novo.'
          : 'Erro de comunicação com o servidor.'
      };
    }
    return corpo || { ok: false, motivo: 'RESPOSTA_VAZIA' };
  } catch (err) {
    console.error(`[Supabase] Falha de conexão em ${nome}:`, err);
    return { ok: false, sucesso: false, motivo: 'SEM_CONEXAO',
             mensagem: 'Falha de conexão. Verifique a internet.' };
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTENTICAÇÃO DA EQUIPE (substitui a senha escrita no JS)
// ═══════════════════════════════════════════════════════════════

async function entrarEquipe(email, senha) {
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: (email || '').trim().toLowerCase(), password: senha || '' })
    });

    if (!res.ok) {
      return { ok: false, mensagem: 'E-mail ou senha incorretos.' };
    }

    const dados = await res.json();
    gravarSessao(dados);
    papelEmCache = null;

    const papel = await papelDoUsuario();
    if (!papel) {
      limparSessao();
      return { ok: false, mensagem: 'Esta conta não tem acesso ao sistema da AURA.' };
    }

    return { ok: true, papel, email: dados.user?.email || email };
  } catch (err) {
    return { ok: false, mensagem: 'Falha de conexão. Verifique a internet.' };
  }
}

async function sairEquipe() {
  const token = await tokenValido();
  if (token) {
    try {
      await fetch(`${SUPABASE_CONFIG.url}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_CONFIG.anonKey, 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
  }
  limparSessao();
}

/** 'dono', 'portaria' ou null. */
async function papelDoUsuario() {
  if (papelEmCache) return papelEmCache;
  if (!lerSessao()) return null;

  const r = await chamarRpc('aura_papel', {}, { autenticado: true });
  papelEmCache = (typeof r === 'string' && r) ? r : null;
  return papelEmCache;
}

function temSessao() {
  return !!lerSessao();
}

// ═══════════════════════════════════════════════════════════════
// LEITURA PÚBLICA (o site precisa exibir shows e preços)
// ═══════════════════════════════════════════════════════════════

async function fetchAuraShows() {
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/aura_shows?select=*&order=data_evento.asc`,
      { headers: await cabecalhos() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Supabase] Falha ao buscar shows:', err);
    return null;
  }
}

async function fetchAuraLotes(showId) {
  try {
    let url = `${SUPABASE_CONFIG.url}/rest/v1/aura_lotes?select=*`;
    if (showId) url += `&show_id=eq.${showId}`;
    const res = await fetch(url, { headers: await cabecalhos() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Supabase] Falha ao buscar lotes:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// CHECKOUT — cria pedido e ingressos numa transação só.
// O preço é decidido pelo banco; o que o navegador manda é ignorado.
// ═══════════════════════════════════════════════════════════════

async function criarPedidoAura({ showId, setor, quantidade, nome, cpf, email, whatsapp, metodo }) {
  return await chamarRpc('aura_criar_pedido', {
    p_show_id: showId,
    p_setor: setor,
    p_quantidade: quantidade,
    p_nome: nome,
    p_cpf: cpf,
    p_email: email,
    p_whatsapp: whatsapp,
    p_metodo: metodo
  });
}

/** Voucher individual: devolve só o ingresso do código pedido, sem CPF. */
async function buscarVoucher(codigo) {
  return await chamarRpc('aura_buscar_voucher', { p_codigo: codigo });
}

// ═══════════════════════════════════════════════════════════════
// PAINEL DO DONO (exige login com papel 'dono')
// ═══════════════════════════════════════════════════════════════

async function updateAuraShow(showId, showData) {
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/aura_shows?id=eq.${showId}`, {
      method: 'PATCH',
      headers: await cabecalhos({ autenticado: true }),
      body: JSON.stringify({ ...showData, updated_at: new Date().toISOString() })
    });
    if (!res.ok) return false;
    const linhas = await res.json();
    // RLS não dá erro quando bloqueia: devolve zero linhas. Sem esta conferência
    // o painel exibia "salvo com sucesso" sem ter salvado nada.
    return Array.isArray(linhas) && linhas.length > 0;
  } catch (err) {
    console.error('[Supabase] Erro ao atualizar show:', err);
    return false;
  }
}

async function updateAuraLote(loteId, dados) {
  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/aura_lotes?id=eq.${loteId}`, {
      method: 'PATCH',
      headers: await cabecalhos({ autenticado: true }),
      body: JSON.stringify(dados)
    });
    if (!res.ok) return false;
    const linhas = await res.json();
    return Array.isArray(linhas) && linhas.length > 0;
  } catch (err) {
    console.error('[Supabase] Erro ao atualizar lote:', err);
    return false;
  }
}

/** `campos` é o objeto de colunas a gravar, ex.: { nome_lote, status }. */
async function updateAuraLoteStatus(showId, campos) {
  try {
    const corpo = (typeof campos === 'string') ? { status: campos } : campos;
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/aura_lotes?show_id=eq.${showId}`, {
      method: 'PATCH',
      headers: await cabecalhos({ autenticado: true }),
      body: JSON.stringify(corpo)
    });
    if (!res.ok) return false;
    const linhas = await res.json();
    return Array.isArray(linhas) && linhas.length > 0;
  } catch (err) {
    return false;
  }
}

async function fetchAuraMetricas(showId) {
  const r = await chamarRpc('aura_metricas', { p_show_id: showId || null }, { autenticado: true });
  if (!r.ok) return { totalIngressos: 0, totalFaturamento: 0, ingressosAguardando: 0, valorAguardando: 0 };
  return r;
}

async function fetchPedidosPendentes(showId) {
  const r = await chamarRpc('aura_pedidos_pendentes', { p_show_id: showId || null }, { autenticado: true });
  return r.ok ? (r.pedidos || []) : [];
}

async function confirmarPagamento(codigoPedido) {
  return await chamarRpc('aura_confirmar_pagamento', { p_codigo_pedido: codigoPedido }, { autenticado: true });
}

async function cancelarPedido(codigoPedido) {
  return await chamarRpc('aura_cancelar_pedido', { p_codigo_pedido: codigoPedido }, { autenticado: true });
}

// ═══════════════════════════════════════════════════════════════
// PORTARIA (exige login com papel 'dono' ou 'portaria')
// ═══════════════════════════════════════════════════════════════

async function validarIngressoPortaria(codigoValidador, operador = 'PORTARIA') {
  return await chamarRpc('aura_validar_ingresso', {
    p_codigo: codigoValidador,
    p_operador: operador
  }, { autenticado: true });
}

async function fetchResumoPortaria(showId) {
  const r = await chamarRpc('aura_resumo_portaria', { p_show_id: showId || null }, { autenticado: true });
  if (!r.ok) return { total: 0, validados: 0, restantes: 0, aguardando_pagamento: 0 };
  return r;
}

window.AuraDB = {
  // leitura pública
  fetchShows: fetchAuraShows,
  fetchLotes: fetchAuraLotes,
  // checkout
  criarPedido: criarPedidoAura,
  buscarVoucher: buscarVoucher,
  // painel do dono
  updateShow: updateAuraShow,
  updateLote: updateAuraLote,
  updateLoteStatus: updateAuraLoteStatus,
  fetchMetricas: fetchAuraMetricas,
  fetchPedidosPendentes: fetchPedidosPendentes,
  confirmarPagamento: confirmarPagamento,
  cancelarPedido: cancelarPedido,
  // portaria
  validarIngressoPortaria: validarIngressoPortaria,
  fetchResumoPortaria: fetchResumoPortaria
};

window.AuraAuth = {
  entrar: entrarEquipe,
  sair: sairEquipe,
  papel: papelDoUsuario,
  temSessao: temSessao
};
