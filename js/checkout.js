/**
 * AURA MOCOCA • CHECKOUT SCRIPT
 * Sistema de Venda Direta de Ingressos, Geração de QR Code e Emissão de Voucher
 */

// Estado da Compra
const checkoutState = {
  eventName: 'Lorenah in Aura • Sertanejo & Funk',
  eventDate: 'Sábado, 22 de Agosto • 21:00',
  sector: 'Pista',
  pricePerTicket: 40,
  quantity: 1,
  customer: {
    name: '',
    cpf: '',
    email: '',
    whatsapp: ''
  },
  paymentMethod: 'pix',
  ticketCode: ''
};

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutEvents();
});

function initCheckoutEvents() {
  const modal = document.getElementById('checkout-modal');
  const btnClose = document.getElementById('btn-close-checkout');
  const btnHeaderBuy = document.getElementById('btn-header-buy');
  const btnMainBuy = document.getElementById('btn-open-checkout-main');

  // Abrir Checkout
  if (btnHeaderBuy) btnHeaderBuy.addEventListener('click', () => openCheckout());
  if (btnMainBuy) btnMainBuy.addEventListener('click', () => openCheckout());
  if (btnClose) btnClose.addEventListener('click', () => closeCheckout());

  // Fechar ao clicar no backdrop
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCheckout();
    });
  }

  // Seleção de Setores (Radio Cards)
  const sectorCards = document.querySelectorAll('.sector-radio-card');
  sectorCards.forEach((card) => {
    card.addEventListener('click', () => {
      sectorCards.forEach((c) => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      checkoutState.sector = card.getAttribute('data-sector') || 'Pista';
      checkoutState.pricePerTicket = parseFloat(card.getAttribute('data-price') || '40');
      updateCheckoutTotals();
    });
  });

  // Quantidade de Ingressos (+ e -)
  const btnMinus = document.getElementById('btn-qty-minus');
  const btnPlus = document.getElementById('btn-qty-plus');

  if (btnMinus) {
    btnMinus.addEventListener('click', () => {
      if (checkoutState.quantity > 1) {
        checkoutState.quantity--;
        updateCheckoutTotals();
      }
    });
  }

  if (btnPlus) {
    btnPlus.addEventListener('click', () => {
      if (checkoutState.quantity < 10) {
        checkoutState.quantity++;
        updateCheckoutTotals();
      }
    });
  }

  // Transição Etapa 1 -> Etapa 2 (Identificação)
  const btnGotoId = document.getElementById('btn-goto-identification');
  if (btnGotoId) {
    btnGotoId.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToStep('step-identification');
    });
  }

  // Voltar Etapa 2 -> Etapa 1
  const btnBackStep1 = document.getElementById('btn-back-to-step1');
  if (btnBackStep1) {
    btnBackStep1.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToStep('step-selection');
    });
  }

  // Formulário de Identificação -> Etapa 3 (Pagamento)
  const formCust = document.getElementById('form-customer-info');
  if (formCust) {
    formCust.addEventListener('submit', (e) => {
      e.preventDefault();
      checkoutState.customer.name = document.getElementById('cust-name').value.trim();
      checkoutState.customer.cpf = document.getElementById('cust-cpf').value.trim();
      checkoutState.customer.email = document.getElementById('cust-email').value.trim();
      checkoutState.customer.whatsapp = document.getElementById('cust-whatsapp').value.trim();

      renderPixQRCode();
      goToStep('step-payment');
    });
  }

  // Voltar Etapa 3 -> Etapa 2
  const btnBackStep2 = document.getElementById('btn-back-to-step2');
  if (btnBackStep2) {
    btnBackStep2.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToStep('step-identification');
    });
  }

  // Abas de Pagamento (PIX vs Cartão)
  const tabPix = document.getElementById('tab-btn-pix');
  const tabCard = document.getElementById('tab-btn-card');
  const contentPix = document.getElementById('pay-content-pix');
  const contentCard = document.getElementById('pay-content-card');

  if (tabPix && tabCard) {
    tabPix.addEventListener('click', () => {
      tabPix.classList.add('is-active');
      tabCard.classList.remove('is-active');
      contentPix.style.display = 'block';
      contentCard.style.display = 'none';
      checkoutState.paymentMethod = 'pix';
    });

    tabCard.addEventListener('click', () => {
      tabCard.classList.add('is-active');
      tabPix.classList.remove('is-active');
      contentCard.style.display = 'block';
      contentPix.style.display = 'none';
      checkoutState.paymentMethod = 'card';
    });
  }

  // Copiar Código PIX
  const btnCopyPix = document.getElementById('btn-copy-pix-code');
  if (btnCopyPix) {
    btnCopyPix.addEventListener('click', () => {
      const input = document.getElementById('pix-copy-input');
      if (input) {
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
          btnCopyPix.textContent = '✓ Código PIX Copiado!';
          setTimeout(() => {
            btnCopyPix.textContent = '📋 Copiar Código PIX';
          }, 3000);
        });
      }
    });
  }

  // Confirmar Pagamento PIX (Simulação / Emissão Real)
  const btnConfirmPay = document.getElementById('btn-confirm-payment');
  if (btnConfirmPay) {
    btnConfirmPay.addEventListener('click', (e) => {
      e.preventDefault();
      emitDigitalTicket();
    });
  }

  // Confirmar Pagamento Cartão
  const formCard = document.getElementById('form-card-payment');
  if (formCard) {
    formCard.addEventListener('submit', (e) => {
      e.preventDefault();
      emitDigitalTicket();
    });
  }

  // Concluir Checkout
  const btnFinish = document.getElementById('btn-finish-checkout');
  if (btnFinish) {
    btnFinish.addEventListener('click', () => {
      closeCheckout();
    });
  }
}

/* --------------------------------------------------------------------------
   FUNÇÕES DE CONTROLE DE FLUXO DO CHECKOUT
   -------------------------------------------------------------------------- */
function openCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  goToStep('step-selection');
  updateCheckoutTotals();
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function openCheckoutWithShow(showTitle) {
  checkoutState.eventName = showTitle;
  const eventNameEl = document.getElementById('checkout-event-name');
  if (eventNameEl) eventNameEl.textContent = showTitle;
  openCheckout();
}

function openCheckoutWithSector(sectorName) {
  openCheckout();
  const card = document.querySelector(`.sector-radio-card[data-sector="${sectorName}"]`);
  if (card) card.click();
}

function closeCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function goToStep(stepId) {
  const steps = document.querySelectorAll('.checkout-step');
  steps.forEach((s) => {
    s.style.display = 'none';
  });

  const target = document.getElementById(stepId);
  if (target) {
    target.style.display = 'block';
  }
}

function updateCheckoutTotals() {
  const qtyEl = document.getElementById('qty-val');
  const subtotalEl = document.getElementById('txt-subtotal');
  const totalEl = document.getElementById('txt-total');

  const total = checkoutState.pricePerTicket * checkoutState.quantity;

  if (qtyEl) qtyEl.textContent = checkoutState.quantity;
  if (subtotalEl) subtotalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

/* --------------------------------------------------------------------------
   GERAÇÃO DE QR CODE DINÂMICO (PIX & INGRESSO)
   -------------------------------------------------------------------------- */
function renderPixQRCode() {
  const container = document.getElementById('pix-qrcode-render');
  if (!container) return;

  container.innerHTML = `
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#ffffff" />
      <rect x="10" y="10" width="25" height="25" fill="#08090C" />
      <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
      <rect x="18" y="18" width="9" height="9" fill="#08090C" />

      <rect x="65" y="10" width="25" height="25" fill="#08090C" />
      <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
      <rect x="73" y="18" width="9" height="9" fill="#08090C" />

      <rect x="10" y="65" width="25" height="25" fill="#08090C" />
      <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
      <rect x="18" y="73" width="9" height="9" fill="#08090C" />

      <rect x="42" y="42" width="16" height="16" fill="#0084FF" />
      <rect x="45" y="45" width="10" height="10" fill="#ffffff" />
      
      <rect x="40" y="12" width="6" height="6" fill="#08090C" />
      <rect x="50" y="20" width="6" height="6" fill="#08090C" />
      <rect x="12" y="45" width="6" height="6" fill="#08090C" />
      <rect x="25" y="50" width="6" height="6" fill="#08090C" />
      <rect x="70" y="45" width="6" height="6" fill="#08090C" />
      <rect x="80" y="60" width="6" height="6" fill="#08090C" />
      <rect x="45" y="75" width="6" height="6" fill="#08090C" />
      <rect x="60" y="80" width="6" height="6" fill="#08090C" />
    </svg>
  `;
}

function emitDigitalTicket() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  checkoutState.ticketCode = `AUR-2026-${randomNum}-VIP`;

  const outEvent = document.getElementById('ticket-out-event');
  const outDateTime = document.getElementById('ticket-out-datetime');
  const outName = document.getElementById('ticket-out-name');
  const outSector = document.getElementById('ticket-out-sector');
  const outCode = document.getElementById('ticket-out-code');
  const qrDisplay = document.getElementById('ticket-qrcode-display');

  if (outEvent) outEvent.textContent = checkoutState.eventName.toUpperCase();
  if (outDateTime) outDateTime.textContent = checkoutState.eventDate.toUpperCase();
  if (outName) outName.textContent = checkoutState.customer.name || 'Cliente AURA';
  if (outSector) outSector.textContent = `${checkoutState.sector.toUpperCase()} (${checkoutState.quantity}x)`;
  if (outCode) outCode.textContent = checkoutState.ticketCode;

  if (qrDisplay) {
    qrDisplay.innerHTML = `
      <svg viewBox="0 0 120 120" width="110" height="110" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="120" fill="#ffffff" />
        <rect x="10" y="10" width="30" height="30" fill="#08090C" />
        <rect x="16" y="16" width="18" height="18" fill="#ffffff" />
        <rect x="20" y="20" width="10" height="10" fill="#08090C" />

        <rect x="80" y="10" width="30" height="30" fill="#08090C" />
        <rect x="86" y="16" width="18" height="18" fill="#ffffff" />
        <rect x="90" y="20" width="10" height="10" fill="#08090C" />

        <rect x="10" y="80" width="30" height="30" fill="#08090C" />
        <rect x="16" y="86" width="18" height="18" fill="#ffffff" />
        <rect x="20" y="90" width="10" height="10" fill="#08090C" />

        <rect x="48" y="48" width="24" height="24" fill="#00F0FF" />
        <text x="60" y="64" font-family="Montserrat" font-size="12" font-weight="900" text-anchor="middle" fill="#08090C">A</text>

        <rect x="50" y="15" width="8" height="8" fill="#08090C" />
        <rect x="62" y="25" width="8" height="8" fill="#08090C" />
        <rect x="15" y="55" width="8" height="8" fill="#08090C" />
        <rect x="30" y="65" width="8" height="8" fill="#08090C" />
        <rect x="85" y="55" width="8" height="8" fill="#08090C" />
        <rect x="100" y="70" width="8" height="8" fill="#08090C" />
        <rect x="55" y="85" width="8" height="8" fill="#08090C" />
        <rect x="70" y="95" width="8" height="8" fill="#08090C" />
      </svg>
    `;
  }

  goToStep('step-success');
}

// Exportações globais para HTML onclick
window.openCheckout = openCheckout;
window.openCheckoutWithShow = openCheckoutWithShow;
window.openCheckoutWithSector = openCheckoutWithSector;
window.closeCheckout = closeCheckout;
window.goToStep = goToStep;
window.emitDigitalTicket = emitDigitalTicket;
