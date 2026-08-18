/**
 * AURA MOCOCA • CARDÁPIO OFICIAL VIP DE COMBOS & BEBIDAS
 *
 * O catálogo NÃO mora mais aqui dentro.
 *
 * Por quê: quando a lista de combos era uma constante neste arquivo, ela
 * divergia da lista que o checkout conhecia. O cliente clicava em "Balde
 * Heineken", o checkout não achava o id, definia `combo = null` em silêncio,
 * e a pessoa pagava só o ingresso e chegava na casa esperando cerveja.
 * Doze dos dezoito itens estavam nessa situação.
 *
 * Agora cardápio e checkout leem a MESMA tabela (`aura_combos`, via
 * `AuraDB.fetchCombos()`). Os ids não podem mais divergir, e o preço exibido
 * é o mesmo que o banco vai cobrar — nunca um número desatualizado no JS.
 *
 * Como o conteúdo passa a vir do banco, todo card é montado com
 * `createElement` + `textContent`. Nada de `innerHTML` com dado de fora.
 */

// ═══════════════════════════════════════════════════════════════
// ESTADO
// ═══════════════════════════════════════════════════════════════

/** Catálogo vindo do banco. Vazio até a primeira carga concluir. */
let cardapioCombos = [];

/** 'vazio' | 'carregando' | 'pronto' | 'erro' | 'sem-itens' */
let cardapioEstado = 'vazio';

/** Promessa da carga em voo: dois cliques rápidos não disparam dois fetches. */
let cardapioCarregamentoEmVoo = null;

let cardapioFiltroAtual = 'todos';
let cardapioTermoBusca = '';

/** Categorias que as abas do modal conhecem (index.html). */
const CATEGORIAS_CONHECIDAS = ['whisky', 'vodka', 'espumante', 'cerveja', 'redbull'];

/**
 * Rótulo mostrado no topo do card. Categoria nova que o banco inventar
 * cai no `else` e aparece com o próprio nome em maiúsculas — some do filtro,
 * mas continua visível em "Todos".
 */
const ROTULOS_CATEGORIA = {
  whisky: 'WHISKY & BOURBON',
  vodka: 'VODKA & GIN',
  espumante: 'ESPUMANTE',
  cerveja: 'CERVEJA',
  redbull: 'ENERGÉTICO & DOSES'
};

/**
 * A cor do selo acompanha a cor do card físico entregue na portaria
 * (`card_classe`), para o cliente associar as duas coisas. Item sem card
 * físico é avulso e usa o selo discreto.
 * As classes abaixo existem em css/style.css (`.badge-*`).
 */
const CLASSE_SELO_POR_CARD = {
  'card-gold': 'badge-gold',
  'card-amber': 'badge-amber',
  'card-blue': 'badge-cyan',
  'card-royal-blue': 'badge-cyan-glow',
  'card-red': 'badge-amber',
  'card-pink': 'badge-pink',
  'card-green': 'badge-green',
  'card-lime': 'badge-gold',
  'card-cyan': 'badge-cyan'
};

const WHATSAPP_AURA = '5519992971614';

// ═══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initCardapioInteractions();
});

function initCardapioInteractions() {
  const modal = document.getElementById('cardapio-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCardapio();
    });
  }

  // Tecla Esc fecha o modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCardapio();
  });
}

// ═══════════════════════════════════════════════════════════════
// CARGA DO CATÁLOGO
// ═══════════════════════════════════════════════════════════════

function normalizarCombo(bruto) {
  if (!bruto || !bruto.id) return null;

  // PostgREST devolve `numeric` como string ("380.00"). Number() aqui,
  // uma vez, evita "R$ NaN" espalhado pela tela.
  const preco = Number(bruto.preco);

  return {
    id: String(bruto.id),
    titulo: String(bruto.titulo || 'Combo AURA'),
    descricao: String(bruto.descricao || ''),
    categoria: String(bruto.categoria || '').toLowerCase(),
    preco: Number.isFinite(preco) ? preco : null,
    cardNome: bruto.card_nome ? String(bruto.card_nome) : '',
    cardClasse: bruto.card_classe ? String(bruto.card_classe) : '',
    badge: bruto.badge ? String(bruto.badge) : '',
    ordem: Number.isFinite(Number(bruto.ordem)) ? Number(bruto.ordem) : 9999
  };
}

/**
 * Busca o catálogo uma vez e guarda em memória.
 * `forcar` refaz a busca (usado pelo botão "Tentar de novo").
 */
function carregarCatalogoCardapio({ forcar = false } = {}) {
  if (!forcar && cardapioEstado === 'pronto') return Promise.resolve();
  if (cardapioCarregamentoEmVoo) return cardapioCarregamentoEmVoo;

  cardapioEstado = 'carregando';
  renderizarItensCardapio();

  cardapioCarregamentoEmVoo = (async () => {
    try {
      if (!window.AuraDB || typeof window.AuraDB.fetchCombos !== 'function') {
        throw new Error('AuraDB.fetchCombos indisponível');
      }

      const bruto = await window.AuraDB.fetchCombos();

      // fetchCombos devolve null quando a requisição falha.
      if (!Array.isArray(bruto)) throw new Error('Resposta inválida do catálogo');

      const lista = bruto.map(normalizarCombo).filter(Boolean);
      // O banco já ordena por `ordem`, mas a ordem da tela não pode depender
      // disso: reordenamos aqui para o cardápio nunca sair embaralhado.
      lista.sort((a, b) => (a.ordem - b.ordem) || a.titulo.localeCompare(b.titulo, 'pt-BR'));

      cardapioCombos = lista;
      cardapioEstado = lista.length ? 'pronto' : 'sem-itens';
    } catch (err) {
      console.warn('[Cardápio] Falha ao carregar o catálogo:', err);
      cardapioCombos = [];
      cardapioEstado = 'erro';
    } finally {
      cardapioCarregamentoEmVoo = null;
      renderizarItensCardapio();
    }
  })();

  return cardapioCarregamentoEmVoo;
}

// ═══════════════════════════════════════════════════════════════
// ABERTURA / FECHAMENTO
// ═══════════════════════════════════════════════════════════════

function openCardapio(filtro = 'todos') {
  const modal = document.getElementById('cardapio-modal');
  if (!modal) return;

  // Normaliza o filtro (pode chegar como categoria ou como nome de marca)
  let f = (filtro || 'todos').toLowerCase().trim();
  if (f.includes('walker') || f.includes('whisky') || f.includes('jack')) f = 'whisky';
  else if (f.includes('absolut') || f.includes('ciroc') || f.includes('vodka') || f.includes('gin') || f.includes('tanqueray')) f = 'vodka';
  else if (f.includes('chandon') || f.includes('espumante') || f.includes('champagne')) f = 'espumante';
  else if (f.includes('heineken') || f.includes('corona') || f.includes('cerveja')) f = 'cerveja';
  else if (f.includes('red_bul') || f.includes('redbull') || f.includes('energetico')) f = 'redbull';
  else if (f !== 'todos' && !CATEGORIAS_CONHECIDAS.includes(f)) f = 'todos';

  cardapioFiltroAtual = f;
  cardapioTermoBusca = '';

  const searchInput = document.getElementById('cardapio-search-input');
  if (searchInput) searchInput.value = '';

  atualizarAbasCardapio(f);

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Abre já mostrando o estado de carregamento; a lista entra quando chegar.
  // Sem `await` de propósito: o modal não pode esperar a rede para aparecer.
  carregarCatalogoCardapio();
}

function closeCardapio() {
  const modal = document.getElementById('cardapio-modal');
  if (!modal) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function filtrarCardapio(categoria) {
  cardapioFiltroAtual = categoria;
  cardapioTermoBusca = '';
  const searchInput = document.getElementById('cardapio-search-input');
  if (searchInput) searchInput.value = '';

  atualizarAbasCardapio(categoria);
  renderizarItensCardapio();
}

function buscarNoCardapio(termo) {
  cardapioTermoBusca = (termo || '').toLowerCase().trim();
  renderizarItensCardapio();
}

function atualizarAbasCardapio(categoriaAtiva) {
  const tabs = document.querySelectorAll('.cardapio-tab-btn');
  tabs.forEach((tab) => {
    const f = tab.getAttribute('data-filter');
    tab.classList.toggle('is-active', f === categoriaAtiva);
  });
}

// ═══════════════════════════════════════════════════════════════
// APRESENTAÇÃO
// ═══════════════════════════════════════════════════════════════

const formatadorBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 2
});

function precoFormatado(valor) {
  return (valor === null || !Number.isFinite(valor))
    ? 'Consultar no bar'
    : formatadorBRL.format(valor);
}

function rotuloCategoria(categoria) {
  return ROTULOS_CATEGORIA[categoria] || (categoria ? categoria.toUpperCase() : 'BAR AURA');
}

function classeDoSelo(combo) {
  return CLASSE_SELO_POR_CARD[combo.cardClasse] || 'badge-muted';
}

/**
 * O banco guarda o combo numa linha só ("1L Black Label + 5 Red Bulls + ...").
 * A lista com um item por linha é o que dava riqueza visual ao card antigo,
 * então reconstruímos ela quebrando no "+".
 */
function itensDoCombo(combo) {
  return combo.descricao
    .split(/\s*\+\s*/)
    .map(t => t.trim())
    .filter(Boolean);
}

/** Card em destaque: o selo do banco marca os premium com ★, 👑 ou 💎. */
function ehDestaque(combo) {
  return /[★👑💎]/.test(combo.badge);
}

function criarElemento(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined && texto !== null) el.textContent = texto;
  return el;
}

function montarCardCombo(combo) {
  const article = criarElemento('article', 'combo-card' + (ehDestaque(combo) ? ' is-featured' : ''));
  article.setAttribute('data-category', combo.categoria);

  // ── Cabeçalho: categoria + selo
  const header = criarElemento('div', 'combo-card-header');
  header.appendChild(criarElemento('div', 'combo-brand-tag font-mono', rotuloCategoria(combo.categoria)));
  if (combo.badge) {
    header.appendChild(criarElemento('div', `combo-badge font-mono ${classeDoSelo(combo)}`, combo.badge));
  }
  article.appendChild(header);

  // ── Título e linha do card físico
  article.appendChild(criarElemento('h4', 'combo-title', combo.titulo));
  if (combo.cardNome) {
    article.appendChild(criarElemento(
      'p', 'combo-subtitle font-mono',
      `${combo.cardNome} • entregue na portaria para resgatar no bar`
    ));
  }

  // ── O que está incluso
  const itens = itensDoCombo(combo);
  if (itens.length) {
    const caixa = criarElemento('div', 'combo-items-box');
    caixa.appendChild(criarElemento('div', 'combo-items-label font-mono', '[ O QUE ESTÁ INCLUSO: ]'));

    const ul = criarElemento('ul', 'combo-items-list');
    itens.forEach((texto) => {
      const li = document.createElement('li');
      li.appendChild(criarElemento('span', 'combo-item-check', '✓'));
      li.appendChild(criarElemento('span', null, texto));
      ul.appendChild(li);
    });
    caixa.appendChild(ul);
    article.appendChild(caixa);
  }

  // ── Rodapé: preço + botão
  const footer = criarElemento('div', 'combo-card-footer');

  const precoWrap = criarElemento('div', 'combo-price-wrapper');
  precoWrap.appendChild(criarElemento('span', 'combo-price-label font-mono', 'VALOR DO COMBO:'));
  precoWrap.appendChild(criarElemento('span', 'combo-price-val font-display', precoFormatado(combo.preco)));
  footer.appendChild(precoWrap);

  // Um botão, um handler: só addEventListener, nunca `onclick=` no markup.
  const botao = criarElemento('button', 'btn-combo-order font-mono');
  botao.type = 'button';
  botao.setAttribute('data-cursor', 'PEDIR');
  botao.appendChild(criarElemento('span', null, '🛒 Comprar com Ingresso'));
  botao.addEventListener('click', () => {
    closeCardapio();
    if (typeof window.openCheckoutWithCombo === 'function') {
      window.openCheckoutWithCombo(combo.id);
    } else {
      console.warn('[Cardápio] Checkout indisponível para o combo', combo.id);
    }
  });
  footer.appendChild(botao);

  article.appendChild(footer);
  return article;
}

/** Bloco central (carregando / erro / vazio), sempre com explicação. */
function montarAviso({ icone, titulo, texto, rotuloBotao, aoClicar, comSpinner }) {
  const bloco = criarElemento('div', 'cardapio-empty-state font-mono');

  if (comSpinner) {
    const spinner = criarElemento('div', 'empty-icon', '⏳');
    bloco.appendChild(spinner);
  } else if (icone) {
    bloco.appendChild(criarElemento('div', 'empty-icon', icone));
  }

  if (titulo) {
    const h = criarElemento('p', null);
    h.appendChild(criarElemento('strong', null, titulo));
    bloco.appendChild(h);
  }
  if (texto) bloco.appendChild(criarElemento('p', null, texto));

  if (rotuloBotao && typeof aoClicar === 'function') {
    const btn = criarElemento('button', 'btn-cardapio-reset', rotuloBotao);
    btn.type = 'button';
    btn.addEventListener('click', aoClicar);
    bloco.appendChild(btn);
  }

  return bloco;
}

function renderizarItensCardapio() {
  const container = document.getElementById('cardapio-grid-container');
  if (!container) return;

  container.textContent = '';

  if (cardapioEstado === 'carregando' || cardapioEstado === 'vazio') {
    container.appendChild(montarAviso({
      comSpinner: true,
      titulo: 'Carregando o cardápio da casa...',
      texto: 'Buscando os combos e os preços atualizados da AURA.'
    }));
    return;
  }

  if (cardapioEstado === 'erro') {
    // Nunca mostrar lista vazia sem explicação, e nunca preço velho gravado
    // no JS: se o banco não respondeu, o cliente precisa saber disso.
    const bloco = montarAviso({
      icone: '📡',
      titulo: 'Não foi possível carregar o cardápio agora.',
      texto: 'Verifique sua conexão e tente de novo. Se continuar assim, chame a AURA no WhatsApp que passamos os combos por lá.',
      rotuloBotao: 'Tentar de novo',
      aoClicar: () => carregarCatalogoCardapio({ forcar: true })
    });

    const link = document.createElement('a');
    link.className = 'btn-cardapio-reset';
    link.href = `https://wa.me/${WHATSAPP_AURA}?text=` +
      encodeURIComponent('Olá! Gostaria de ver os combos e bebidas disponíveis na AURA.');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Falar no WhatsApp';
    bloco.appendChild(link);

    container.appendChild(bloco);
    return;
  }

  if (cardapioEstado === 'sem-itens') {
    container.appendChild(montarAviso({
      icone: '🍹',
      titulo: 'Nenhum combo disponível no momento.',
      texto: 'A casa está atualizando a carta de bebidas. Volte em instantes ou fale com a AURA no WhatsApp.'
    }));
    return;
  }

  // ── Filtro por categoria (categoria desconhecida continua visível em "Todos")
  let itens = cardapioCombos.slice();
  if (cardapioFiltroAtual !== 'todos') {
    itens = itens.filter(item => item.categoria === cardapioFiltroAtual);
  }

  // ── Busca livre
  if (cardapioTermoBusca.length > 0) {
    const termo = cardapioTermoBusca;
    itens = itens.filter((item) => {
      const alvos = [
        item.titulo,
        item.descricao,
        item.cardNome,
        item.badge,
        item.categoria,
        rotuloCategoria(item.categoria)
      ];
      return alvos.some(t => (t || '').toLowerCase().includes(termo));
    });
  }

  if (itens.length === 0) {
    const termoExibido = cardapioTermoBusca
      ? `Nenhuma bebida ou combo encontrado para "${cardapioTermoBusca}".`
      : 'Nenhuma bebida ou combo nesta categoria.';

    container.appendChild(montarAviso({
      icone: '🍹',
      texto: termoExibido,
      rotuloBotao: 'Ver Todos os Combos',
      aoClicar: () => filtrarCardapio('todos')
    }));
    return;
  }

  const fragmento = document.createDocumentFragment();
  itens.forEach(combo => fragmento.appendChild(montarCardCombo(combo)));
  container.appendChild(fragmento);
}

// Exportações globais
window.openCardapio = openCardapio;
window.closeCardapio = closeCardapio;
window.filtrarCardapio = filtrarCardapio;
window.buscarNoCardapio = buscarNoCardapio;
