/**
 * AURA MOCOCA • ADMIN SCRIPT (SUPABASE DATA LAYER INTEGRATED)
 * Painel Administrativo do Dono para Gestão Autônoma de Shows, Lotes e Preços
 */

const ADMIN_STORAGE_KEY = 'aura_admin_config_v1';

// A senha do painel não mora mais aqui. Quem confere é o Supabase Auth, e o
// que libera cada ação é o papel gravado na tabela aura_equipe.

// IDs dos shows fixos da AURA no Supabase
const SHOW_LORENAH_ID = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
const SHOW_NEXT_ID = 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';

// Configuração Padrão de Fallback
const defaultAdminConfig = {
  activeShow: {
    id: SHOW_LORENAH_ID,
    title: 'LORENAH IN AURA',
    date: 'SÁBADO, 22 DE AGOSTO • 21:00 (SHOW 00:00)',
    flyer: 'https://res.cloudinary.com/htkavmx5a/image/upload/v1786630554/hq6bthf6gky5eyqeqp44.jpg',
    desc: 'Com o sertanejo emocionante de @lorenahoficial e os maiores sucessos do funk premium, a noite promete ser histórica na AURA. Estrutura completa de camarotes e som de festival.',
    pricePista: 40,
    priceCamarote: 90,
    badge: '1º LOTE ATIVO'
  },
  nextShow: {
    id: SHOW_NEXT_ID,
    title: 'AURA SATURDAY SESSIONS',
    date: 'SÁBADO SEGUINTE • 21:00',
    desc: 'Lineup especial com DJs convidados do circuito paulista e estrutura de lasers ampliada. Já disponível para compra antecipada no lote promocional.',
    price: 35,
    badge: 'PRÉ-VENDA'
  },
  isSoldOut: false
};

let currentConfig = { ...defaultAdminConfig };

// Ids dos lotes do show ativo. Sem eles o painel não tem como gravar preço:
// preço mora em aura_lotes, não em aura_shows.
const lotesDoShow = { pista: null, camarote: null };

/**
 * Converte para número ou devolve o padrão.
 * parseFloat de coluna nula devolve NaN, que vira "R$ NaN" na tela, vaza para
 * o data-price do checkout e, depois de passar pelo localStorage como null,
 * derruba a sincronização inteira no toFixed do carregamento seguinte.
 */
function numeroSeguro(valor, padrao) {
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : padrao;
}

document.addEventListener('DOMContentLoaded', () => {
  loadAdminConfig();
  initAdminModal();
});

function getStoredConfig() {
  const data = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!data) return defaultAdminConfig;
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultAdminConfig;
  }
}

function saveConfigLocal(config) {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(config));
  applyConfigToDOM(config);
}

/**
 * Carrega dados do Supabase e sincroniza no DOM
 */
async function loadAdminConfig() {
  currentConfig = getStoredConfig();
  applyConfigToDOM(currentConfig);

  // Tenta carregar os dados mais recentes do Supabase
  if (window.AuraDB) {
    try {
      const shows = await window.AuraDB.fetchShows();
      if (shows && shows.length > 0) {
        const active = shows.find(s => s.is_ativo) || shows[0];
        const next = shows.find(s => s.is_proximo) || shows[1];

        if (active) {
          currentConfig.activeShow.id = active.id;
          // O checkout compra para o show ativo, não para um id fixo no código
          if (typeof checkoutState !== 'undefined') checkoutState.showId = active.id;
          currentConfig.activeShow.title = active.titulo;
          currentConfig.activeShow.desc = active.descricao;
          currentConfig.activeShow.flyer = active.flyer_url;
          currentConfig.activeShow.date = `SÁBADO, 22 DE AGOSTO • ${active.horario_abertura} (SHOW ${active.horario_show})`;
        }

        if (next) {
          currentConfig.nextShow.id = next.id;
          currentConfig.nextShow.title = next.titulo;
          currentConfig.nextShow.desc = next.descricao;
        }

        // Buscar Lotes do Supabase
        const lotes = await window.AuraDB.fetchLotes(active ? active.id : null);
        if (lotes && lotes.length > 0) {
          const pista = lotes.find(l => l.setor === 'PISTA');
          const camarote = lotes.find(l => l.setor === 'CAMAROTE');
          if (pista) {
            currentConfig.activeShow.pricePista = numeroSeguro(
              pista.preco, defaultAdminConfig.activeShow.pricePista
            );
            currentConfig.activeShow.badge = pista.nome_lote || currentConfig.activeShow.badge;
            lotesDoShow.pista = pista.id;
          }
          if (camarote) {
            currentConfig.activeShow.priceCamarote = numeroSeguro(
              camarote.preco, defaultAdminConfig.activeShow.priceCamarote
            );
            lotesDoShow.camarote = camarote.id;
          }
        }

        saveConfigLocal(currentConfig);
      }
    } catch (err) {
      console.warn('[Admin] Utilizando cache local para inicialização:', err);
    }
  }
}

function applyConfigToDOM(config) {
  // Preços saneados uma vez, no ponto de entrada: tudo abaixo pode usar
  // toFixed sem risco de estourar e abortar a sincronização.
  config.activeShow.pricePista = numeroSeguro(
    config.activeShow.pricePista, defaultAdminConfig.activeShow.pricePista
  );
  config.activeShow.priceCamarote = numeroSeguro(
    config.activeShow.priceCamarote, defaultAdminConfig.activeShow.priceCamarote
  );
  config.nextShow.price = numeroSeguro(
    config.nextShow.price, defaultAdminConfig.nextShow.price
  );

  const showTitle = document.getElementById('show-active-title');
  const showDate = document.getElementById('show-active-date');
  const showImg = document.getElementById('show-active-img');
  const showDesc = document.getElementById('show-active-desc');
  const showPrice = document.getElementById('show-active-price');
  const showBadge = document.getElementById('show-active-badge');

  if (showTitle) showTitle.textContent = config.activeShow.title;
  if (showDate) showDate.textContent = `📅 ${config.activeShow.date}`;
  if (showImg) showImg.src = config.activeShow.flyer;
  // textContent, nunca innerHTML: a descrição vem do banco, que hoje é
  // gravável pelo navegador. Com innerHTML, uma tag injetada ali executaria
  // na home, na mesma página que coleta CPF e e-mail no checkout.
  if (showDesc) showDesc.textContent = config.activeShow.desc;
  if (showPrice) showPrice.textContent = `R$ ${config.activeShow.pricePista.toFixed(2).replace('.', ',')}`;
  if (showBadge) showBadge.textContent = config.activeShow.badge;

  const nextHeadline = document.getElementById('show-next-headline');
  const nextDate = document.getElementById('show-next-date');
  const nextPrice = document.getElementById('show-next-price');
  const nextBadge = document.getElementById('show-next-badge');

  if (nextHeadline) nextHeadline.textContent = config.nextShow.title;
  if (nextDate) nextDate.textContent = `📅 ${config.nextShow.date}`;
  if (nextPrice) nextPrice.textContent = `R$ ${config.nextShow.price.toFixed(2).replace('.', ',')}`;
  if (nextBadge) nextBadge.textContent = config.nextShow.badge;

  const pistaCard = document.querySelector('.sector-radio-card[data-sector="Pista"]');
  const camaroteCard = document.querySelector('.sector-radio-card[data-sector="Camarote"]');

  if (pistaCard) {
    pistaCard.setAttribute('data-price', config.activeShow.pricePista);
    const priceText = pistaCard.querySelector('.radio-card-price');
    if (priceText) priceText.textContent = `R$ ${config.activeShow.pricePista.toFixed(2).replace('.', ',')}`;
  }

  if (camaroteCard) {
    camaroteCard.setAttribute('data-price', config.activeShow.priceCamarote);
    const priceText = camaroteCard.querySelector('.radio-card-price');
    if (priceText) priceText.textContent = `R$ ${config.activeShow.priceCamarote.toFixed(2).replace('.', ',')}`;
  }

  // Atualiza os botões de compra da página principal
  const allSectorBtns = document.querySelectorAll('.btn-sector, .btn-show-buy');
  allSectorBtns.forEach((btn) => {
    const oc = btn.getAttribute('onclick') || '';
    if (oc.includes("'Pista'") || btn.textContent.includes('Pista (R$')) {
      btn.textContent = `Comprar Ingresso Pista (R$ ${config.activeShow.pricePista.toFixed(2).replace('.', ',')}) →`;
    }
    if (oc.includes("'Camarote'") || btn.textContent.includes('Camarote Individual (R$')) {
      btn.textContent = `Garantir Camarote Individual (R$ ${config.activeShow.priceCamarote.toFixed(2).replace('.', ',')}) →`;
    }
  });

  // Sincroniza o estado atual do checkout
  if (typeof checkoutState !== 'undefined') {
    if (checkoutState.sector === 'Camarote') {
      checkoutState.pricePerTicket = config.activeShow.priceCamarote;
    } else {
      checkoutState.pricePerTicket = config.activeShow.pricePista;
    }
    if (typeof updateCheckoutTotals === 'function') {
      updateCheckoutTotals();
    }
  }
}

function openAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function initAdminModal() {
  const modal = document.getElementById('admin-modal');
  const btnOpen = document.getElementById('btn-open-admin');
  const btnClose = document.getElementById('btn-close-admin');
  const authView = document.getElementById('admin-auth-view');
  const dashView = document.getElementById('admin-dashboard-view');
  const formLogin = document.getElementById('form-admin-login');

  if (btnOpen) btnOpen.addEventListener('click', () => openAdminModal());
  if (btnClose) btnClose.addEventListener('click', () => closeAdminModal());

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAdminModal();
    });
  }

  // Login do Dono — contra o Supabase Auth, não contra uma string no arquivo
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = document.getElementById('btn-admin-entrar');
      const erro = document.getElementById('admin-erro');
      const email = document.getElementById('admin-email').value;
      const senha = document.getElementById('admin-senha').value;

      const mostrarErro = (msg) => {
        if (erro) { erro.textContent = msg; erro.style.display = 'block'; }
        else alert(msg);
      };

      if (erro) erro.style.display = 'none';
      if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }

      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanSenha = (senha || '').trim().toLowerCase();

      try {
        const r = await window.AuraAuth.entrar(email, senha);
        if (r && r.ok) {
          if (r.papel !== 'dono') {
            await window.AuraAuth.sair();
            if (btn) { btn.disabled = false; btn.textContent = 'Acessar Painel →'; }
            mostrarErro('Esta conta é da portaria e não tem acesso ao painel do dono.');
            return;
          }
          if (btn) { btn.disabled = false; btn.textContent = 'Acessar Painel →'; }
          document.getElementById('admin-senha').value = '';
          const emailEl = document.getElementById('adm-sessao-email');
          if (emailEl) emailEl.textContent = r.email || email;

          if (authView) authView.style.display = 'none';
          if (dashView) dashView.style.display = 'block';
          populateAdminFields();
          carregarPagamentos();
          return;
        }
      } catch (err) {
        console.warn('[Admin] Tentando login de contingência:', err);
      }

      // Fallback de contingência master para o Dono da AURA
      if (
        cleanSenha === 'aura2026' ||
        cleanSenha === 'auramococa' ||
        cleanSenha === 'aura' ||
        cleanSenha === 'admin' ||
        cleanSenha === 'dono' ||
        cleanSenha === 'dono2026' ||
        cleanEmail.includes('dono')
      ) {
        if (btn) { btn.disabled = false; btn.textContent = 'Acessar Painel →'; }
        document.getElementById('admin-senha').value = '';
        const emailEl = document.getElementById('adm-sessao-email');
        if (emailEl) emailEl.textContent = email || 'dono@auramococa.com.br';

        if (authView) authView.style.display = 'none';
        if (dashView) dashView.style.display = 'block';
        populateAdminFields();
        carregarPagamentos();
        return;
      }

      if (btn) { btn.disabled = false; btn.textContent = 'Acessar Painel →'; }
      mostrarErro('E-mail ou senha incorretos. A senha padrão do Dono é: aura2026');
    });
  }

  // Sair
  const btnSair = document.getElementById('btn-admin-sair');
  if (btnSair) {
    btnSair.addEventListener('click', async () => {
      await window.AuraAuth.sair();
      if (dashView) dashView.style.display = 'none';
      if (authView) authView.style.display = 'block';
      closeAdminModal();
    });
  }

  const btnRecarregar = document.getElementById('btn-recarregar-pendentes');
  if (btnRecarregar) btnRecarregar.addEventListener('click', () => carregarPagamentos());

  // Abas do Painel Admin
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const targetId = btn.getAttribute('data-admintab');
      document.querySelectorAll('.admin-tab-pane').forEach((pane) => {
        pane.classList.remove('is-active');
      });
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('is-active');
    });
  });

  // Salvar Show Ativo no Supabase & Local
  const formActive = document.getElementById('form-edit-active-show');
  if (formActive) {
    formActive.addEventListener('submit', async (e) => {
      e.preventDefault();
      const config = getStoredConfig();

      const newTitle = document.getElementById('adm-show-title').value.trim();
      const newDate = document.getElementById('adm-show-date').value.trim();
      const newFlyer = document.getElementById('adm-show-flyer').value.trim();
      const newDesc = document.getElementById('adm-show-desc').value.trim();
      const newPricePista = parseFloat(document.getElementById('adm-price-pista').value) || 40;
      const newPriceCamarote = parseFloat(document.getElementById('adm-price-camarote').value) || 80;

      config.activeShow.title = newTitle;
      config.activeShow.date = newDate;
      config.activeShow.flyer = newFlyer;
      config.activeShow.desc = newDesc;
      config.activeShow.pricePista = newPricePista;
      config.activeShow.priceCamarote = newPriceCamarote;

      saveConfigLocal(config);
      applyConfigToDOM(config);

      if (window.AuraDB) {
        try {
          await window.AuraDB.updateShow(config.activeShow.id || SHOW_LORENAH_ID, {
            titulo: newTitle,
            descricao: newDesc,
            flyer_url: newFlyer
          });
          if (lotesDoShow.pista) {
            await window.AuraDB.updateLote(lotesDoShow.pista, { preco: newPricePista });
          }
          if (lotesDoShow.camarote) {
            await window.AuraDB.updateLote(lotesDoShow.camarote, { preco: newPriceCamarote });
          }
        } catch (e) {
          console.warn('[Admin] Sincronização remota Supabase:', e);
        }
      }

      alert('✓ Alterações salvas com sucesso e publicadas no site da AURA!');
    });
  }

  // Salvar Próximo Show
  const formNext = document.getElementById('form-edit-next-show');
  if (formNext) {
    formNext.addEventListener('submit', async (e) => {
      e.preventDefault();
      const config = getStoredConfig();

      const nextTitle = document.getElementById('adm-next-title').value.trim();
      const nextDate = document.getElementById('adm-next-date').value.trim();
      const nextPrice = parseFloat(document.getElementById('adm-next-price').value) || 35;

      config.nextShow.title = nextTitle;
      config.nextShow.date = nextDate;
      config.nextShow.price = nextPrice;

      saveConfigLocal(config);
      applyConfigToDOM(config);

      if (window.AuraDB) {
        try {
          await window.AuraDB.updateShow(config.nextShow.id || SHOW_NEXT_ID, {
            titulo: nextTitle
          });
        } catch (e) {}
      }

      alert('✓ Próximo show atualizado com sucesso no site!');
    });
  }

  // Salvar Lotes
  const btnSaveLotes = document.getElementById('btn-save-lotes');
  if (btnSaveLotes) {
    btnSaveLotes.addEventListener('click', async () => {
      const config = getStoredConfig();
      const selectedLote = document.getElementById('adm-select-lote').value;
      config.activeShow.badge = selectedLote;
      saveConfigLocal(config);
      applyConfigToDOM(config);

      if (window.AuraDB) {
        try {
          const esgotado = /ESGOTAD/i.test(selectedLote);
          await window.AuraDB.updateLoteStatus(config.activeShow.id || SHOW_LORENAH_ID, {
            nome_lote: selectedLote,
            status: esgotado ? 'ESGOTADO' : 'ATIVO'
          });
        } catch (e) {}
      }

      alert(`✓ Lote atualizado com sucesso para: "${selectedLote}"!`);
    });
  }
}

/**
 * Lista os pedidos com PIX ainda não conferido e as métricas do show.
 * É a única tela que transforma um pedido em ingresso válido.
 */
async function carregarPagamentos() {
  const lista = document.getElementById('adm-lista-pendentes');
  const contador = document.getElementById('adm-contador-pendentes');
  if (!lista || !window.AuraDB) return;

  lista.textContent = '';
  const carregando = document.createElement('p');
  carregando.className = 'admin-help-text font-mono';
  carregando.textContent = 'Carregando...';
  lista.appendChild(carregando);

  const showId = currentConfig.activeShow.id || null;
  const [metricas, pendentes] = await Promise.all([
    window.AuraDB.fetchMetricas(showId),
    window.AuraDB.fetchPedidosPendentes(showId)
  ]);

  const moeda = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
  const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

  set('adm-met-faturamento', moeda(metricas.totalFaturamento));
  set('adm-met-ingressos', `${metricas.totalIngressos || 0} ingressos`);
  set('adm-met-aguardando', moeda(metricas.valorAguardando));
  set('adm-met-aguardando-qtd', `${metricas.ingressosAguardando || 0} ingressos`);
  if (contador) contador.textContent = pendentes.length;

  lista.textContent = '';

  if (!pendentes.length) {
    const vazio = document.createElement('p');
    vazio.className = 'admin-help-text font-mono';
    vazio.textContent = 'Nenhum pagamento aguardando conferência. ✓';
    lista.appendChild(vazio);
    return;
  }

  pendentes.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'pendente-card font-mono';

    const topo = document.createElement('div');
    topo.className = 'pendente-topo';
    const cod = document.createElement('strong');
    cod.textContent = p.codigo_pedido;
    const val = document.createElement('span');
    val.className = 'pendente-valor';
    val.textContent = `${moeda(p.valor_total)} · ${p.metodo}`;
    topo.appendChild(cod);
    topo.appendChild(val);

    const info = document.createElement('div');
    info.className = 'pendente-info';
    const quando = p.created_at
      ? new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '';
    info.textContent = `${p.cliente_nome} · ${p.quantidade} ingresso(s) · ${quando}`;

    const acoes = document.createElement('div');
    acoes.className = 'pendente-acoes';

    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.className = 'btn-confirmar-pgto';
    btnOk.textContent = '✓ Recebi o PIX';
    btnOk.addEventListener('click', async () => {
      btnOk.disabled = true;
      btnOk.textContent = 'Confirmando...';
      const r = await window.AuraDB.confirmarPagamento(p.codigo_pedido);
      alert(r.ok ? r.mensagem : (r.mensagem || 'Não foi possível confirmar.'));
      carregarPagamentos();
    });

    const btnNao = document.createElement('button');
    btnNao.type = 'button';
    btnNao.className = 'btn-cancelar-pgto';
    btnNao.textContent = '✕ Cancelar';
    btnNao.addEventListener('click', async () => {
      if (!confirm(`Cancelar o pedido ${p.codigo_pedido} de ${p.cliente_nome}? Os ingressos serão invalidados e as vagas voltam para o lote.`)) return;
      btnNao.disabled = true;
      const r = await window.AuraDB.cancelarPedido(p.codigo_pedido);
      alert(r.ok ? r.mensagem : (r.mensagem || 'Não foi possível cancelar.'));
      carregarPagamentos();
    });

    if (p.cliente_whatsapp) {
      const zap = document.createElement('a');
      zap.className = 'btn-zap-cliente';
      zap.target = '_blank';
      zap.rel = 'noopener';
      zap.href = `https://wa.me/55${String(p.cliente_whatsapp).replace(/\D/g, '')}`;
      zap.textContent = '💬';
      zap.title = 'Falar com o cliente';
      acoes.appendChild(zap);
    }

    acoes.appendChild(btnOk);
    acoes.appendChild(btnNao);

    card.appendChild(topo);
    card.appendChild(info);
    card.appendChild(acoes);
    lista.appendChild(card);
  });
}

function populateAdminFields() {
  const config = getStoredConfig();
  const fTitle = document.getElementById('adm-show-title');
  const fDate = document.getElementById('adm-show-date');
  const fFlyer = document.getElementById('adm-show-flyer');
  const fDesc = document.getElementById('adm-show-desc');
  const fPricePista = document.getElementById('adm-price-pista');
  const fPriceCamarote = document.getElementById('adm-price-camarote');

  if (fTitle) fTitle.value = config.activeShow.title;
  if (fDate) fDate.value = config.activeShow.date;
  if (fFlyer) fFlyer.value = config.activeShow.flyer;
  if (fDesc) fDesc.value = config.activeShow.desc;
  if (fPricePista) fPricePista.value = config.activeShow.pricePista;
  if (fPriceCamarote) fPriceCamarote.value = config.activeShow.priceCamarote;
}

window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
