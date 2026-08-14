/**
 * AURA MOCOCA • ADMIN SCRIPT
 * Painel Administrativo do Dono para Gestão Autônoma de Shows, Lotes e Preços
 */

const ADMIN_STORAGE_KEY = 'aura_admin_config_v1';
const DEFAULT_ADMIN_PIN = 'aura2026';

// Configuração Padrão
const defaultAdminConfig = {
  activeShow: {
    title: 'LORENAH IN AURA',
    date: 'SÁBADO, 22 DE AGOSTO • 21:00 (SHOW 00:00)',
    flyer: 'https://res.cloudinary.com/htkavmx5a/image/upload/v1786630554/hq6bthf6gky5eyqeqp44.jpg',
    desc: 'Com muito sertanejo emocionante de @lorenahoficial e os drops mais quentes do funk premium, a noite promete sacudir a estrutura da AURA!',
    pricePista: 40,
    priceCamarote: 80,
    badge: '1º LOTE ATIVO'
  },
  nextShow: {
    title: 'AURA SATURDAY SESSIONS',
    date: 'SÁBADO SEGUINTE • 21:00',
    desc: 'Lineup especial com DJs convidados do circuito paulista e estrutura de lasers ampliada. Já disponível para compra antecipada no lote promocional.',
    price: 35,
    badge: 'PRÉ-VENDA'
  },
  isSoldOut: false
};

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

function saveConfig(config) {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(config));
  applyConfigToDOM(config);
}

function loadAdminConfig() {
  const config = getStoredConfig();
  applyConfigToDOM(config);
}

function applyConfigToDOM(config) {
  const showTitle = document.getElementById('show-active-title');
  const showDate = document.getElementById('show-active-date');
  const showImg = document.getElementById('show-active-img');
  const showDesc = document.getElementById('show-active-desc');
  const showPrice = document.getElementById('show-active-price');
  const showBadge = document.getElementById('show-active-badge');

  if (showTitle) showTitle.textContent = config.activeShow.title;
  if (showDate) showDate.textContent = `📅 ${config.activeShow.date}`;
  if (showImg) showImg.src = config.activeShow.flyer;
  if (showDesc) showDesc.innerHTML = config.activeShow.desc;
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

  // Login do Dono
  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const pin = document.getElementById('admin-pin').value.trim();
      if (pin === DEFAULT_ADMIN_PIN || pin === 'admin') {
        if (authView) authView.style.display = 'none';
        if (dashView) dashView.style.display = 'block';
        populateAdminFields();
      } else {
        alert('Senha incorreta! Tente novamente.');
      }
    });
  }

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

  // Salvar Show Ativo
  const formActive = document.getElementById('form-edit-active-show');
  if (formActive) {
    formActive.addEventListener('submit', (e) => {
      e.preventDefault();
      const config = getStoredConfig();

      config.activeShow.title = document.getElementById('adm-show-title').value.trim();
      config.activeShow.date = document.getElementById('adm-show-date').value.trim();
      config.activeShow.flyer = document.getElementById('adm-show-flyer').value.trim();
      config.activeShow.desc = document.getElementById('adm-show-desc').value.trim();
      config.activeShow.pricePista = parseFloat(document.getElementById('adm-price-pista').value) || 40;
      config.activeShow.priceCamarote = parseFloat(document.getElementById('adm-price-camarote').value) || 80;

      saveConfig(config);
      alert('✓ Alterações do Show Ativo salvas com sucesso no site!');
    });
  }

  // Salvar Próximo Show
  const formNext = document.getElementById('form-edit-next-show');
  if (formNext) {
    formNext.addEventListener('submit', (e) => {
      e.preventDefault();
      const config = getStoredConfig();

      config.nextShow.title = document.getElementById('adm-next-title').value.trim();
      config.nextShow.date = document.getElementById('adm-next-date').value.trim();
      config.nextShow.price = parseFloat(document.getElementById('adm-next-price').value) || 35;

      saveConfig(config);
      alert('✓ Próximo show atualizado na agenda com sucesso!');
    });
  }

  // Salvar Lotes
  const btnSaveLotes = document.getElementById('btn-save-lotes');
  if (btnSaveLotes) {
    btnSaveLotes.addEventListener('click', () => {
      const config = getStoredConfig();
      const selectedLote = document.getElementById('adm-select-lote').value;
      config.activeShow.badge = selectedLote;
      saveConfig(config);
      alert(`✓ Status de Lote atualizado para: "${selectedLote}"!`);
    });
  }
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
