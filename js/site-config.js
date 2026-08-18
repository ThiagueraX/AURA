/**
 * AURA MOCOCA • CONFIGURAÇÃO DO SITE PÚBLICO
 * ============================================================
 *
 * O QUE ESTE ARQUIVO FAZ
 *   Lê do banco o show ativo, o próximo show e os lotes, e aplica isso na
 *   home: título, data, descrição, flyer, preços de Pista / Camarote / Bistrô
 *   e disponibilidade de cada setor. É só leitura e pintura de tela.
 *
 * O QUE ELE DELIBERADAMENTE **NÃO** FAZ
 *   • Não autentica ninguém. Não existe senha, e-mail de dono nem "fallback
 *     de contingência" aqui. O painel do proprietário é a página `admin.html`,
 *     que entra pelo Supabase Auth.
 *   • Não grava nada no banco. Nenhum preço, nenhum status, nenhum show.
 *   • Não decide preço de cobrança. O que aparece na tela é vitrine; quem
 *     cobra é `aura_criar_pedido`, que lê o preço de `aura_lotes` no servidor.
 *
 * SOBRE O localStorage
 *   `aura_admin_config_v1` é **cache de exibição** — serve para a página já
 *   nascer com o conteúdo da última visita enquanto o banco responde, e para
 *   o checkout ter um texto de apoio. Nunca é fonte de preço para cobrança.
 *   E, principalmente: **estado de venda pausada não sai daqui**. Vinha do
 *   localStorage antes, e era por navegador — o dono via "pausado" na tela
 *   dele enquanto o site seguia vendendo para todo mundo. Agora quem diz se
 *   um setor vende é `aura_lotes.status`.
 */

const CACHE_EXIBICAO = 'aura_admin_config_v1';

// Ids dos shows semeados no banco. Servem só de âncora para o primeiro
// desenho da página; o id de verdade vem sempre de `fetchShows()`.
const SHOW_ATIVO_PADRAO = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
const SHOW_PROXIMO_PADRAO = 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';

const SETORES = ['PISTA', 'CAMAROTE', 'BISTRO'];

const configPadrao = {
  activeShow: {
    id: SHOW_ATIVO_PADRAO,
    title: 'LORENAH IN AURA',
    date: 'SÁBADO, 22 DE AGOSTO • 21:00 (SHOW 00:00)',
    dateBadge: 'SÁBADO 22/08',
    flyer: 'https://res.cloudinary.com/htkavmx5a/image/upload/v1786630554/hq6bthf6gky5eyqeqp44.jpg',
    desc: 'Com o sertanejo emocionante de @lorenahoficial e os maiores sucessos do funk premium, a noite promete ser histórica na AURA. Estrutura completa de camarotes e som de festival.',
    pricePista: 40,
    priceCamarote: 90,
    priceBistro: 250,
    badge: '1º LOTE ATIVO'
  },
  nextShow: {
    id: SHOW_PROXIMO_PADRAO,
    title: 'AURA SATURDAY SESSIONS',
    date: 'SÁBADO SEGUINTE • 21:00',
    dateBadge: 'PRÉ-VENDA',
    desc: 'Lineup especial com DJs convidados do circuito paulista e estrutura de lasers ampliada. Já disponível para compra antecipada no lote promocional.',
    price: 35,
    pricePista: 35,
    priceCamarote: 75,
    badge: 'PRÉ-VENDA'
  }
};

let currentConfig = clonarConfig(configPadrao);

function clonarConfig(base) {
  return {
    activeShow: { ...base.activeShow },
    nextShow: { ...base.nextShow }
  };
}

/**
 * Converte para número ou devolve o padrão.
 * `parseFloat` de coluna nula devolve NaN, que vira "R$ NaN" na tela, vaza
 * para o `data-price` do checkout e, depois de passar pelo localStorage como
 * null, derruba a sincronização inteira no `toFixed` do carregamento seguinte.
 */
function numeroSeguro(valor, padrao) {
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : padrao;
}

function moeda(valor) {
  return `R$ ${numeroSeguro(valor, 0).toFixed(2).replace('.', ',')}`;
}

/** 'Bistrô' / 'bistro' / 'BISTRÔ' → 'BISTRO'. */
function normalizarSetor(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .trim()
    .toUpperCase();
}

// ═══════════════════════════════════════════════════════════════
// CACHE DE EXIBIÇÃO
// ═══════════════════════════════════════════════════════════════

/**
 * Devolve o cache já saneado. Nunca devolve objeto pela metade nem NaN:
 * quem lê (o checkout, entre outros) espera sempre os mesmos campos.
 */
function getStoredConfig() {
  let bruto = null;
  try {
    const dados = localStorage.getItem(CACHE_EXIBICAO);
    bruto = dados ? JSON.parse(dados) : null;
  } catch (e) {
    bruto = null;
  }

  const cfg = clonarConfig(configPadrao);
  if (!bruto || typeof bruto !== 'object') return cfg;

  const ativo = bruto.activeShow || {};
  const proximo = bruto.nextShow || {};

  ['id', 'title', 'date', 'dateBadge', 'flyer', 'desc', 'badge'].forEach((campo) => {
    if (typeof ativo[campo] === 'string' && ativo[campo]) cfg.activeShow[campo] = ativo[campo];
    if (typeof proximo[campo] === 'string' && proximo[campo]) cfg.nextShow[campo] = proximo[campo];
  });

  cfg.activeShow.pricePista = numeroSeguro(ativo.pricePista, configPadrao.activeShow.pricePista);
  cfg.activeShow.priceCamarote = numeroSeguro(ativo.priceCamarote, configPadrao.activeShow.priceCamarote);
  cfg.activeShow.priceBistro = numeroSeguro(ativo.priceBistro, configPadrao.activeShow.priceBistro);
  cfg.nextShow.price = numeroSeguro(proximo.price, configPadrao.nextShow.price);
  cfg.nextShow.pricePista = numeroSeguro(proximo.pricePista, cfg.nextShow.price);
  cfg.nextShow.priceCamarote = numeroSeguro(proximo.priceCamarote, configPadrao.nextShow.priceCamarote);

  return cfg;
}

function gravarCache(config) {
  try {
    localStorage.setItem(CACHE_EXIBICAO, JSON.stringify(config));
  } catch (e) {
    // Aba anônima ou armazenamento cheio: a página funciona igual, só perde
    // o desenho antecipado no próximo carregamento.
    console.warn('[Site] Não foi possível guardar o cache de exibição:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// LEITURA DO BANCO
// ═══════════════════════════════════════════════════════════════

/**
 * `2026-08-23T00:00:00+00` (= sábado 22/08 21:00 em Mococa) vira
 * "SÁBADO, 22 DE AGOSTO • 21:00 (SHOW 00:00)".
 * O fuso é fixado em São Paulo de propósito: a festa acontece lá, não no
 * fuso de quem está olhando o site.
 */
function formatarDataShow(show) {
  if (!show || !show.data_evento) return null;
  const d = new Date(show.data_evento);
  if (Number.isNaN(d.getTime())) return null;

  let texto;
  try {
    texto = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo'
    }).format(d).toUpperCase();
  } catch (e) {
    return null;
  }

  const abertura = show.horario_abertura || '';
  const inicio = show.horario_show || '';
  if (abertura && inicio) return `${texto} • ${abertura} (SHOW ${inicio})`;
  if (abertura) return `${texto} • ${abertura}`;
  return texto;
}

/** "SÁBADO 22/08" para a etiqueta curta do checkout. */
function formatarBadgeData(show) {
  if (!show || !show.data_evento) return null;
  const d = new Date(show.data_evento);
  if (Number.isNaN(d.getTime())) return null;

  try {
    const partes = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo'
    }).formatToParts(d);
    const pega = (tipo) => (partes.find((p) => p.type === tipo) || {}).value || '';
    const dia = pega('weekday').toUpperCase();
    return `${dia} ${pega('day')}/${pega('month')}`;
  } catch (e) {
    return null;
  }
}

/**
 * Um setor está à venda quando o lote existe, está ATIVO e ainda tem vaga.
 * `PAUSADO` e `ESGOTADO` são os dois status de recusa previstos no banco;
 * qualquer outra coisa é tratada como indisponível, por segurança.
 */
function lerDisponibilidade(lotes) {
  const mapa = {};
  SETORES.forEach((setor) => { mapa[setor] = null; });
  if (!Array.isArray(lotes)) return mapa;

  lotes.forEach((lote) => {
    const setor = normalizarSetor(lote.setor);
    if (!SETORES.includes(setor)) return;

    const total = numeroSeguro(lote.quantidade_total, 0);
    const vendida = numeroSeguro(lote.quantidade_vendida, 0);
    const semVaga = total > 0 && vendida >= total;
    const status = String(lote.status || '').toUpperCase();

    mapa[setor] = {
      preco: numeroSeguro(lote.preco, null),
      nomeLote: lote.nome_lote || '',
      disponivel: status === 'ATIVO' && !semVaga,
      esgotado: status === 'ESGOTADO' || semVaga
    };
  });

  return mapa;
}

/**
 * Ponto de entrada. Mantém o nome `loadAdminConfig` porque o listener de
 * `storage` no fim de `js/main.js` chama exatamente essa função quando o
 * painel salva algo em outra aba.
 */
async function loadAdminConfig() {
  currentConfig = getStoredConfig();
  aplicarConteudo(currentConfig);
  await carregarDoBanco();
}

async function carregarDoBanco() {
  if (!window.AuraDB || typeof window.AuraDB.fetchShows !== 'function') return;

  let shows;
  try {
    shows = await window.AuraDB.fetchShows();
  } catch (err) {
    console.warn('[Site] Falha ao buscar os shows; seguindo com o cache:', err);
    return;
  }
  if (!Array.isArray(shows) || shows.length === 0) return;

  const ativo = shows.find((s) => s.is_ativo) || shows[0];
  const proximo = shows.find((s) => s.is_proximo && s !== ativo) || shows[1] || null;

  if (ativo) {
    currentConfig.activeShow.id = ativo.id || currentConfig.activeShow.id;
    if (ativo.titulo) currentConfig.activeShow.title = ativo.titulo;
    if (ativo.descricao) currentConfig.activeShow.desc = ativo.descricao;
    if (ativo.flyer_url) currentConfig.activeShow.flyer = ativo.flyer_url;
    const data = formatarDataShow(ativo);
    if (data) currentConfig.activeShow.date = data;
    const badge = formatarBadgeData(ativo);
    if (badge) currentConfig.activeShow.dateBadge = badge;
  }

  if (proximo) {
    currentConfig.nextShow.id = proximo.id || currentConfig.nextShow.id;
    if (proximo.titulo) currentConfig.nextShow.title = proximo.titulo;
    if (proximo.descricao) currentConfig.nextShow.desc = proximo.descricao;
    const data = formatarDataShow(proximo);
    if (data) currentConfig.nextShow.date = data;
  }

  let lotesAtivo = null;
  let lotesProximo = null;
  try {
    lotesAtivo = await window.AuraDB.fetchLotes(ativo ? ativo.id : null);
    if (proximo && proximo.id) lotesProximo = await window.AuraDB.fetchLotes(proximo.id);
  } catch (err) {
    console.warn('[Site] Falha ao buscar os lotes; preços seguem do cache:', err);
  }

  const dispAtivo = lerDisponibilidade(lotesAtivo);
  const dispProximo = lerDisponibilidade(lotesProximo);

  if (dispAtivo.PISTA) {
    currentConfig.activeShow.pricePista = numeroSeguro(dispAtivo.PISTA.preco, currentConfig.activeShow.pricePista);
    if (dispAtivo.PISTA.nomeLote) currentConfig.activeShow.badge = dispAtivo.PISTA.nomeLote;
  }
  if (dispAtivo.CAMAROTE) {
    currentConfig.activeShow.priceCamarote = numeroSeguro(dispAtivo.CAMAROTE.preco, currentConfig.activeShow.priceCamarote);
  }
  if (dispAtivo.BISTRO) {
    currentConfig.activeShow.priceBistro = numeroSeguro(dispAtivo.BISTRO.preco, currentConfig.activeShow.priceBistro);
  }

  if (dispProximo.PISTA) {
    currentConfig.nextShow.price = numeroSeguro(dispProximo.PISTA.preco, currentConfig.nextShow.price);
    currentConfig.nextShow.pricePista = currentConfig.nextShow.price;
    if (dispProximo.PISTA.nomeLote) currentConfig.nextShow.badge = dispProximo.PISTA.nomeLote;
  }
  if (dispProximo.CAMAROTE) {
    currentConfig.nextShow.priceCamarote = numeroSeguro(dispProximo.CAMAROTE.preco, currentConfig.nextShow.priceCamarote);
  }

  gravarCache(currentConfig);
  aplicarConteudo(currentConfig);

  // Disponibilidade só é aplicada com resposta do banco na mão. Se a leitura
  // falhar, os botões continuam clicáveis e quem recusa a compra é o servidor
  // (`LOTE_PAUSADO` / `ESGOTADO`) — melhor do que travar a venda por causa de
  // um dado velho guardado neste navegador.
  if (Array.isArray(lotesAtivo)) aplicarDisponibilidade(dispAtivo, dispProximo);
}

// ═══════════════════════════════════════════════════════════════
// PINTURA DA PÁGINA
// ═══════════════════════════════════════════════════════════════

function definirTexto(id, texto) {
  const el = document.getElementById(id);
  // textContent, nunca innerHTML: título e descrição vêm do banco, e qualquer
  // pessoa consegue gravar texto lá. Uma tag injetada rodaria na mesma página
  // que coleta CPF e e-mail no checkout.
  if (el) el.textContent = texto;
}

/** Aplica o rótulo respeitando o `<span class="btn-rotulo">`, se houver. */
function definirRotulo(botao, texto) {
  const alvo = botao.querySelector('.btn-rotulo');
  if (alvo) alvo.textContent = texto;
  else botao.textContent = texto;
}

function precoDoSetor(config, setor) {
  if (setor === 'CAMAROTE') return config.activeShow.priceCamarote;
  if (setor === 'BISTRO') return config.activeShow.priceBistro;
  return config.activeShow.pricePista;
}

function aplicarConteudo(config) {
  // Show ativo
  definirTexto('show-active-title', config.activeShow.title);
  definirTexto('show-active-date', `📅 ${config.activeShow.date}`);
  definirTexto('show-active-desc', config.activeShow.desc);
  definirTexto('show-active-price', moeda(config.activeShow.pricePista));
  definirTexto('show-active-badge', config.activeShow.badge);

  const flyer = document.getElementById('show-active-img');
  if (flyer && config.activeShow.flyer) {
    flyer.src = config.activeShow.flyer;
    flyer.alt = `Flyer oficial do show ${config.activeShow.title} na AURA Mococa`;
  }

  // Próximo show
  definirTexto('show-next-headline', config.nextShow.title);
  definirTexto('show-next-title', config.nextShow.title);
  definirTexto('show-next-date', `📅 ${config.nextShow.date}`);
  definirTexto('show-next-desc', config.nextShow.desc);
  definirTexto('show-next-price', moeda(config.nextShow.price));
  definirTexto('show-next-badge', config.nextShow.badge);

  // Preços avulsos espalhados pela página (ex.: a linha do Bistrô)
  document.querySelectorAll('[data-preco-setor]').forEach((el) => {
    const setor = normalizarSetor(el.getAttribute('data-preco-setor'));
    el.textContent = moeda(precoDoSetor(config, setor));
  });

  // Cartões de setor do checkout. O `data-price` é lido pelo js/checkout.js,
  // que também redesenha esses cartões quando o modal abre.
  document.querySelectorAll('.sector-radio-card[data-sector]').forEach((card) => {
    const setor = normalizarSetor(card.getAttribute('data-sector'));
    const preco = precoDoSetor(config, setor);
    card.setAttribute('data-price', preco);
    const txt = card.querySelector('.radio-card-price');
    if (txt) txt.textContent = moeda(preco);
  });

  // Botões de compra com rótulo que carrega preço
  document.querySelectorAll('[data-rotulo]').forEach((btn) => {
    if (btn.disabled) return; // pausado: quem manda no texto é aplicarDisponibilidade
    definirRotulo(btn, rotuloDoBotao(btn, config));
  });
}

function rotuloDoBotao(btn, config) {
  const modelo = btn.getAttribute('data-rotulo') || '';
  const ehProximo = btn.getAttribute('data-show') === 'next';
  const setor = normalizarSetor(btn.getAttribute('data-setor') || 'PISTA');
  const preco = ehProximo ? config.nextShow.price : precoDoSetor(config, setor);
  return modelo.replace('{preco}', moeda(preco));
}

/**
 * Habilita ou desabilita os botões de compra conforme o banco.
 * `disabled` num `<button>` também impede o `onclick` do HTML de disparar,
 * então a trava vale para os dois tipos de botão da página.
 */
function aplicarDisponibilidade(dispAtivo, dispProximo) {
  const setorVende = (mapa, setor) => {
    const lote = mapa[setor];
    // Setor que não existe no show não é setor pausado: continua clicável e o
    // servidor responde `SETOR_INDISPONIVEL` se alguém insistir.
    return !lote || lote.disponivel;
  };

  const tudoParado = SETORES.every((setor) => {
    const lote = dispAtivo[setor];
    return lote && !lote.disponivel;
  }) && SETORES.some((setor) => dispAtivo[setor]);

  document.querySelectorAll('[data-rotulo]').forEach((btn) => {
    const ehProximo = btn.getAttribute('data-show') === 'next';
    const mapa = ehProximo ? dispProximo : dispAtivo;
    const setor = normalizarSetor(btn.getAttribute('data-setor') || 'PISTA');
    const lote = mapa[setor];
    const vende = setorVende(mapa, setor);

    btn.disabled = !vende;
    btn.setAttribute('aria-disabled', String(!vende));

    if (vende) {
      btn.title = '';
      definirRotulo(btn, rotuloDoBotao(btn, currentConfig));
    } else {
      const texto = lote && lote.esgotado
        ? 'Ingressos esgotados neste setor'
        : 'Vendas pausadas neste setor';
      btn.title = texto;
      definirRotulo(btn, `🔒 ${texto}`);
    }
  });

  // Botões genéricos de compra: só travam quando nenhum setor está vendendo.
  ['btn-header-buy', 'btn-open-checkout-main'].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = tudoParado;
    btn.setAttribute('aria-disabled', String(tudoParado));
    btn.title = tudoParado ? 'Vendas encerradas no momento' : '';
  });

  const selo = document.querySelector('.tag-status-live');
  if (selo) {
    selo.textContent = tudoParado ? '● VENDAS ENCERRADAS NO MOMENTO' : '● VENDAS OFICIAIS ABERTAS';
    selo.classList.toggle('is-parado', tudoParado);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAdminConfig();
});

// `js/main.js` chama `loadAdminConfig()` no listener de `storage`; sem o
// nome exposto no window aquele listener quebra.
window.loadAdminConfig = loadAdminConfig;

window.AuraConfig = {
  getStoredConfig,
  getCurrentConfig: () => currentConfig,
  recarregar: loadAdminConfig,
  defaultAdminConfig: configPadrao
};
