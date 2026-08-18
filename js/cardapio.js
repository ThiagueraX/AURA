/**
 * AURA MOCOCA • CARDÁPIO OFICIAL VIP DE COMBOS & BEBIDAS
 * Sistema Interativo de Consulta de Combos, Garrafas e Bebidas Premium com Filtro por Marcas e Pedido via WhatsApp
 */

const CARDAPIO_BEBIDAS = [
  // WHISKIES & BOURBONS
  {
    id: 'combo-black-label',
    categoria: 'whisky',
    marca: 'johnnie-walker',
    marcaNome: 'Johnnie Walker',
    badge: '★ MAIS PEDIDO VIP',
    badgeClass: 'badge-gold',
    titulo: 'Combo Johnnie Walker Black Label 12 Anos',
    subtitulo: 'Whisky Escocês 12 Anos Blended Scotch (1 Litro)',
    itens: [
      '1x Garrafa Johnnie Walker Black Label 1L',
      '5x Energéticos Red Bull (Sabores à escolha)',
      '1x Balde Térmico com Gelo Moído + 2x Gelo de Coco',
      '4x Copos Personalizados AURA'
    ],
    preco: 380.00,
    precoFormatado: 'R$ 380,00',
    destaque: true
  },
  {
    id: 'combo-red-label',
    categoria: 'whisky',
    marca: 'johnnie-walker',
    marcaNome: 'Johnnie Walker',
    badge: 'CLÁSSICO DA NOITE',
    badgeClass: 'badge-amber',
    titulo: 'Combo Johnnie Walker Red Label',
    subtitulo: 'Whisky Escocês Blended Scotch (1 Litro)',
    itens: [
      '1x Garrafa Johnnie Walker Red Label 1L',
      '5x Energéticos Red Bull Tradicional ou Tropical',
      '1x Balde Térmico de Gelo + Gelo de Coco',
      '4x Copos Personalizados AURA'
    ],
    preco: 290.00,
    precoFormatado: 'R$ 290,00',
    destaque: false
  },
  {
    id: 'combo-gold-label',
    categoria: 'whisky',
    marca: 'johnnie-walker',
    marcaNome: 'Johnnie Walker',
    badge: '👑 SUPER PREMIUM',
    badgeClass: 'badge-gold-shine',
    titulo: 'Combo Johnnie Walker Gold Label Reserve',
    subtitulo: 'Whisky Escocês Premium Celebration Blend (750ml)',
    itens: [
      '1x Garrafa Johnnie Walker Gold Label Reserve 750ml',
      '6x Energéticos Red Bull (Tradicional ou Sugarfree)',
      '1x Balde Acrílico Iluminado + Taças Exclusivas AURA',
      'Gelo Especial Cristalino'
    ],
    preco: 580.00,
    precoFormatado: 'R$ 580,00',
    destaque: true
  },
  {
    id: 'combo-jack-daniels',
    categoria: 'whisky',
    marca: 'jack-daniels',
    marcaNome: 'Jack Daniel\'s',
    badge: 'TENNESSEE ORIGINAL',
    badgeClass: 'badge-amber',
    titulo: 'Combo Jack Daniel\'s Old No. 7',
    subtitulo: 'Tennessee Whiskey Charcoal Mellowed (1 Litro)',
    itens: [
      '1x Garrafa Jack Daniel\'s No. 7 1L',
      '5x Energéticos Red Bull ou 5x Coca-Cola Original',
      '1x Balde Térmico com Gelo Moído',
      '4x Copos Personalizados AURA'
    ],
    preco: 360.00,
    precoFormatado: 'R$ 360,00',
    destaque: false
  },

  // VODKAS & GINS
  {
    id: 'combo-absolut',
    categoria: 'vodka',
    marca: 'absolut',
    marcaNome: 'Absolut Vodka',
    badge: '★ TOP CAMAROTE',
    badgeClass: 'badge-cyan',
    titulo: 'Combo Absolut Vodka Suéca',
    subtitulo: 'Vodka Importada Original ou Flavors (1 Litro)',
    itens: [
      '1x Garrafa Absolut Vodka 1L (Original ou Vanilla)',
      '5x Energéticos Red Bull Tropical / Melancia / Tradicional',
      '1x Balde de Gelo Moído + 2x Gelo de Coco',
      '4x Copos Personalizados AURA'
    ],
    preco: 310.00,
    precoFormatado: 'R$ 310,00',
    destaque: true
  },
  {
    id: 'combo-ciroc',
    categoria: 'vodka',
    marca: 'ciroc',
    marcaNome: 'Cîroc',
    badge: '💎 ULTRA PREMIUM',
    badgeClass: 'badge-cyan-glow',
    titulo: 'Combo Cîroc Ultra Premium Vodka',
    subtitulo: 'Vodka Francesa 5x Destilada a partir de Uvas Finas (750ml)',
    itens: [
      '1x Garrafa Cîroc Ultra Premium 750ml',
      '6x Energéticos Red Bull (Sabores à escolha)',
      '1x Balde Acrílico Iluminado AURA + Gelo Cristalino',
      '4x Taças de Acrílico Exclusivas'
    ],
    preco: 440.00,
    precoFormatado: 'R$ 440,00',
    destaque: true
  },
  {
    id: 'combo-tanqueray-gin',
    categoria: 'vodka',
    marca: 'tanqueray',
    marcaNome: 'Tanqueray',
    badge: 'GIN & TONIC EXPERIENCE',
    badgeClass: 'badge-green',
    titulo: 'Combo Gin Tanqueray London Dry',
    subtitulo: 'Gin Importado London Dry Especial (750ml)',
    itens: [
      '1x Garrafa Tanqueray London Dry 750ml',
      '5x Águas Tônicas Premium (Tradicional ou Citrus)',
      '1x Kit de Especiarias (Zimbro, Alecrim, Laranja Desidratada)',
      '4x Taças de Gin Personalizadas AURA'
    ],
    preco: 340.00,
    precoFormatado: 'R$ 340,00',
    destaque: false
  },

  // ESPUMANTES & CELEBRAÇÃO
  {
    id: 'combo-chandon-passion',
    categoria: 'espumante',
    marca: 'chandon',
    marcaNome: 'Chandon',
    badge: '★ ON THE ROCKS',
    badgeClass: 'badge-pink',
    titulo: 'Chandon Passion On The Rocks',
    subtitulo: 'Espumante Aromático Frutado Servido com Gelo (750ml)',
    itens: [
      '1x Garrafa Chandon Passion 750ml',
      '1x Champanheira de Acrílico com Gelo Especial',
      '4x Taças Grandes de Degustação AURA'
    ],
    preco: 210.00,
    precoFormatado: 'R$ 210,00',
    destaque: true
  },
  {
    id: 'combo-chandon-brut',
    categoria: 'espumante',
    marca: 'chandon',
    marcaNome: 'Chandon',
    badge: 'CELEBRAÇÃO CLÁSSICA',
    badgeClass: 'badge-gold',
    titulo: 'Chandon Réserve Brut',
    subtitulo: 'Espumante Nobre Método Tradicional Charmat (750ml)',
    itens: [
      '1x Garrafa Chandon Réserve Brut 750ml',
      '1x Balde Champanheira de Acrílico com Gelo',
      '4x Taças Flute Exclusivas'
    ],
    preco: 190.00,
    precoFormatado: 'R$ 190,00',
    destaque: false
  },
  {
    id: 'combo-chandon-rose',
    categoria: 'espumante',
    marca: 'chandon',
    marcaNome: 'Chandon',
    badge: 'BRUT ROSÉ CELEBRATION',
    badgeClass: 'badge-pink',
    titulo: 'Chandon Brut Rosé',
    subtitulo: 'Espumante Rosé Sofisticado Frutas Vermelhas (750ml)',
    itens: [
      '1x Garrafa Chandon Brut Rosé 750ml',
      '1x Balde Champanheira com Gelo',
      '4x Taças Flute Elegance'
    ],
    preco: 220.00,
    precoFormatado: 'R$ 220,00',
    destaque: false
  },

  // CERVEJAS & BALDES
  {
    id: 'balde-heineken',
    categoria: 'cerveja',
    marca: 'heineken',
    marcaNome: 'Heineken',
    badge: '★ BALDE 6 UNIDADES',
    badgeClass: 'badge-green',
    titulo: 'Balde Heineken Long Neck (6x 330ml)',
    subtitulo: 'Cerveja Puro Malte Premium Holandesa 330ml',
    itens: [
      '6x Garrafas Heineken Long Neck 330ml',
      '1x Balde Oficial com Gelo Moído',
      'Servidas trincando de geladas no ponto exato'
    ],
    preco: 84.00,
    precoFormatado: 'R$ 84,00 (R$ 14,00 / un)',
    destaque: true
  },
  {
    id: 'balde-corona',
    categoria: 'cerveja',
    marca: 'corona',
    marcaNome: 'Corona Extra',
    badge: 'COM LIMÃO TAHITI',
    badgeClass: 'badge-gold',
    titulo: 'Balde Corona Extra (6x 330ml)',
    subtitulo: 'Cerveja Mexicana Premium com Limão Tahiti 330ml',
    itens: [
      '6x Garrafas Corona Extra Long Neck 330ml',
      '1x Balde Oficial com Gelo Moído',
      'Acompanha fatias frescas de Limão Tahiti'
    ],
    preco: 90.00,
    precoFormatado: 'R$ 90,00 (R$ 15,00 / un)',
    destaque: true
  },
  {
    id: 'heineken-unidade',
    categoria: 'cerveja',
    marca: 'heineken',
    marcaNome: 'Heineken',
    badge: 'DOSE INDIVIDUAL',
    badgeClass: 'badge-muted',
    titulo: 'Heineken Long Neck 330ml (Avulsa)',
    subtitulo: 'Cerveja Puro Malte Premium 330ml',
    itens: [
      '1x Garrafa Long Neck 330ml Gelada'
    ],
    preco: 16.00,
    precoFormatado: 'R$ 16,00',
    destaque: false
  },
  {
    id: 'corona-unidade',
    categoria: 'cerveja',
    marca: 'corona',
    marcaNome: 'Corona Extra',
    badge: 'DOSE INDIVIDUAL',
    badgeClass: 'badge-muted',
    titulo: 'Corona Extra Long Neck 330ml (Avulsa)',
    subtitulo: 'Cerveja Premium com Limão Tahiti 330ml',
    itens: [
      '1x Garrafa Long Neck 330ml Gelada + Fatias de Limão'
    ],
    preco: 17.00,
    precoFormatado: 'R$ 17,00',
    destaque: false
  },

  // ENERGÉTICOS & NÃO ALCOÓLICOS
  {
    id: 'combo-redbull-5x',
    categoria: 'redbull',
    marca: 'redbull',
    marcaNome: 'Red Bull',
    badge: 'COMBO 5 LATAS',
    badgeClass: 'badge-cyan',
    titulo: 'Combo 5x Red Bull Energy Drink (250ml)',
    subtitulo: 'Energético Oficial das Melhores Noites',
    itens: [
      '5x Latas Red Bull 250ml',
      'Sabores à escolha: Tradicional, Sugarfree, Tropical, Melancia ou Pitaya',
      '1x Baldinho com Gelo'
    ],
    preco: 95.00,
    precoFormatado: 'R$ 95,00 (R$ 19,00 / un)',
    destaque: true
  },
  {
    id: 'redbull-unidade',
    categoria: 'redbull',
    marca: 'redbull',
    marcaNome: 'Red Bull',
    badge: 'LATA INDIVIDUAL',
    badgeClass: 'badge-cyan',
    titulo: 'Red Bull Energy Drink 250ml (Avulso)',
    subtitulo: 'Lata 250ml Gelada (Todos os Sabores Disponíveis)',
    itens: [
      '1x Lata Red Bull 250ml (Tradicional, Sugarfree, Tropical, Melancia, Pitaya)'
    ],
    preco: 22.00,
    precoFormatado: 'R$ 22,00',
    destaque: false
  },
  {
    id: 'gelo-coco-unidade',
    categoria: 'redbull',
    marca: 'aura-bar',
    marcaNome: 'AURA Bar',
    badge: 'ACOMPANHAMENTO',
    badgeClass: 'badge-muted',
    titulo: 'Gelo de Coco Especial (Saborizado ou Natural)',
    subtitulo: 'Copo 200ml de Gelo Saborizado Especial para Drinks',
    itens: [
      '1x Gelo de Coco 200ml (Natural, Maracujá ou Melancia)'
    ],
    preco: 12.00,
    precoFormatado: 'R$ 12,00',
    destaque: false
  },
  {
    id: 'refri-agua',
    categoria: 'redbull',
    marca: 'aura-bar',
    marcaNome: 'AURA Bar',
    badge: 'NÃO ALCOÓLICOS',
    badgeClass: 'badge-muted',
    titulo: 'Refrigerantes & Água Mineral',
    subtitulo: 'Bebidas Geladas Não Alcoólicas',
    itens: [
      'Refrigerante Lata 350ml (Coca-Cola, Guaraná, Sprite) — R$ 10,00',
      'Água Mineral Crystal 500ml (Com ou Sem Gás) — R$ 8,00',
      'Água Tônica Schweppes 350ml — R$ 10,00'
    ],
    preco: 10.00,
    precoFormatado: 'A partir de R$ 8,00',
    destaque: false
  }
];

let cardapioFiltroAtual = 'todos';
let cardapioTermoBusca = '';

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

  // Tecla Esc fecha modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCardapio();
    }
  });
}

function openCardapio(filtro = 'todos') {
  const modal = document.getElementById('cardapio-modal');
  if (!modal) return;

  // Normaliza o filtro (pode ser categoria ou marca)
  let f = (filtro || 'todos').toLowerCase().trim();
  if (f.includes('walker') || f.includes('whisky')) f = 'whisky';
  else if (f.includes('absolut') || f.includes('ciroc') || f.includes('vodka') || f.includes('gin') || f.includes('tanqueray')) f = 'vodka';
  else if (f.includes('chandon') || f.includes('espumante') || f.includes('champagne')) f = 'espumante';
  else if (f.includes('heineken') || f.includes('corona') || f.includes('cerveja')) f = 'cerveja';
  else if (f.includes('red_bul') || f.includes('redbull') || f.includes('energetico')) f = 'redbull';
  else if (f !== 'todos' && !['whisky', 'vodka', 'espumante', 'cerveja', 'redbull'].includes(f)) f = 'todos';

  cardapioFiltroAtual = f;
  cardapioTermoBusca = '';

  const searchInput = document.getElementById('cardapio-search-input');
  if (searchInput) searchInput.value = '';

  atualizarAbasCardapio(f);
  renderizarItensCardapio();

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
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
    if (f === categoriaAtiva) {
      tab.classList.add('is-active');
    } else {
      tab.classList.remove('is-active');
    }
  });
}

function renderizarItensCardapio() {
  const container = document.getElementById('cardapio-grid-container');
  if (!container) return;

  let itens = CARDAPIO_BEBIDAS.slice();

  // Aplica filtro de categoria se não for 'todos'
  if (cardapioFiltroAtual !== 'todos') {
    itens = itens.filter(item => item.categoria === cardapioFiltroAtual);
  }

  // Aplica termo de busca se houver
  if (cardapioTermoBusca.length > 0) {
    itens = itens.filter(item => {
      const matchTitulo = item.titulo.toLowerCase().includes(cardapioTermoBusca);
      const matchSub = item.subtitulo.toLowerCase().includes(cardapioTermoBusca);
      const matchMarca = item.marcaNome.toLowerCase().includes(cardapioTermoBusca);
      const matchItens = item.itens.some(i => i.toLowerCase().includes(cardapioTermoBusca));
      return matchTitulo || matchSub || matchMarca || matchItens;
    });
  }

  if (itens.length === 0) {
    container.innerHTML = `
      <div class="cardapio-empty-state font-mono">
        <div class="empty-icon">🍹</div>
        <p>Nenhuma bebida ou combo encontrado para "<strong>${cardapioTermoBusca}</strong>".</p>
        <button type="button" class="btn-cardapio-reset" onclick="filtrarCardapio('todos')">
          Ver Todos os Combos
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = itens.map(item => {
    const itensHtml = item.itens.map(it => `<li><span class="combo-item-check">✓</span> <span>${it}</span></li>`).join('');
    const zapText = encodeURIComponent(`Olá! Gostaria de reservar o *${item.titulo}* (${item.precoFormatado}) para meu Camarote / Mesa na AURA.`);
    const zapUrl = `https://wa.me/5519992971614?text=${zapText}`;

    return `
      <article class="combo-card ${item.destaque ? 'is-featured' : ''}" data-category="${item.categoria}">
        <div class="combo-card-header">
          <div class="combo-brand-tag font-mono">${item.marcaNome.toUpperCase()}</div>
          <div class="combo-badge font-mono ${item.badgeClass}">${item.badge}</div>
        </div>

        <h4 class="combo-title">${item.titulo}</h4>
        <p class="combo-subtitle font-mono">${item.subtitulo}</p>

        <div class="combo-items-box">
          <div class="combo-items-label font-mono">[ O QUE ESTÁ INCLUSO: ]</div>
          <ul class="combo-items-list">
            ${itensHtml}
          </ul>
        </div>

        <div class="combo-card-footer">
          <div class="combo-price-wrapper">
            <span class="combo-price-label font-mono">VALOR DO COMBO:</span>
            <span class="combo-price-val font-display">${item.precoFormatado}</span>
          </div>

          <button type="button" onclick="window.closeCardapio(); window.openCheckoutWithCombo('${item.id}')" class="btn-combo-order font-mono" data-cursor="PEDIR">
            <span>🛒 Comprar com Ingresso</span>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

// Exportações globais
window.openCardapio = openCardapio;
window.closeCardapio = closeCardapio;
window.filtrarCardapio = filtrarCardapio;
window.buscarNoCardapio = buscarNoCardapio;
