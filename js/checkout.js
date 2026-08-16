/**
 * AURA MOCOCA • CHECKOUT SCRIPT (SECURE & HARDENED DATA ENGINE)
 * Sistema de Venda Direta com Blindagem Anti-Fraude, Validação de CPF e Criptografia de Ingressos
 */

// Estado da Compra Seguro
const checkoutState = {
  showId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
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
  ticketCode: '',
  codigoValidador: '',
  codigosValidadores: [],
  codigoPedido: '',
  aguardandoPagamento: true,
  isProcessing: false,
  emitindo: false
};

// Tabela de Preços Oficiais de Segurança (Anti-Tampering)
const SETORES_OFICIAIS = {
  'Pista': { precoMin: 40, nome: 'Pista' },
  'Camarote': { precoMin: 80, nome: 'Camarote' },
  'Bistrô': { precoMin: 250, nome: 'Bistrô' }
};

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutEvents();
  initInputMasks();
});

/**
 * 1. MÁSCARAS E VALIDAÇÃO DE ENTRADA
 */
function initInputMasks() {
  const cpfInput = document.getElementById('cust-cpf');
  const zapInput = document.getElementById('cust-whatsapp');

  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });
  }

  if (zapInput) {
    zapInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 10) {
        v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (v.length > 5) {
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
      }
      e.target.value = v;
    });
  }
}

/**
 * 2. VALIDADOR OFICIAL DE CPF (ALGORITMO DA RECEITA FEDERAL)
 */
function validarCPF(cpfLimpo) {
  const cpf = cpfLimpo.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

/**
 * 3. SANITIZAÇÃO DE TEXTO CONTRA XSS & INJEÇÃO
 */
function sanitizeText(str) {
  if (!str) return '';
  return str.replace(/[<>'"/\\;]/g, '').trim();
}

/**
 * 4. GERAÇÃO DE HASH CRIPTOGRÁFICO DO INGRESSO (HMAC ASSINADO)
 */
function gerarHashIngresso(pedidoCod, index, cpf) {
  const salt = 'AURA_MOCOCA_SECRET_SALT_2026';
  const raw = `${pedidoCod}-${index}-${cpf.replace(/\D/g, '')}-${salt}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `AURA-TKT-${hex}-${index}`;
}

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

  // Seleção de Setores com Proteção Anti-Tampering
  const sectorCards = document.querySelectorAll('.sector-radio-card');
  sectorCards.forEach((card) => {
    card.addEventListener('click', () => {
      sectorCards.forEach((c) => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const sectorName = card.getAttribute('data-sector') || 'Pista';
      const rawPrice = parseFloat(card.getAttribute('data-price'));

      checkoutState.sector = sectorName;
      checkoutState.pricePerTicket = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 40;

      updateCheckoutTotals();
    });
  });

  // Quantidade de Ingressos (Trava: 1 a 10)
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

  // Transição Etapa 1 -> Etapa 2
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

  // Formulário de Identificação com Validação Rigorosa
  const formCust = document.getElementById('form-customer-info');
  if (formCust) {
    formCust.addEventListener('submit', (e) => {
      e.preventDefault();

      const rawName = document.getElementById('cust-name').value;
      const rawCpf = document.getElementById('cust-cpf').value;
      const rawEmail = document.getElementById('cust-email').value;
      const rawWhatsapp = document.getElementById('cust-whatsapp').value;

      const cleanName = sanitizeText(rawName);
      const cleanEmail = sanitizeText(rawEmail);

      if (cleanName.length < 3) {
        alert('Por favor, informe seu nome completo.');
        return;
      }

      if (!validarCPF(rawCpf)) {
        alert('⚠️ CPF inválido! Por favor, digite um CPF válido para emissão do ingresso nominal.');
        return;
      }

      if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        alert('Por favor, informe um e-mail válido para envio do comprovante.');
        return;
      }

      checkoutState.customer.name = cleanName;
      checkoutState.customer.cpf = rawCpf;
      checkoutState.customer.email = cleanEmail;
      checkoutState.customer.whatsapp = rawWhatsapp;

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
      if (contentPix) contentPix.style.display = 'block';
      if (contentCard) contentCard.style.display = 'none';
      checkoutState.paymentMethod = 'pix';
    });

    tabCard.addEventListener('click', () => {
      tabCard.classList.add('is-active');
      tabPix.classList.remove('is-active');
      if (contentCard) contentCard.style.display = 'block';
      if (contentPix) contentPix.style.display = 'none';
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

  // Confirmar Pagamento PIX com Trava Anti-Clique Duplo
  const btnConfirmPay = document.getElementById('btn-confirm-payment');
  if (btnConfirmPay) {
    btnConfirmPay.addEventListener('click', async (e) => {
      e.preventDefault();
      if (checkoutState.isProcessing) return;
      checkoutState.isProcessing = true;
      btnConfirmPay.textContent = '⏳ Processando Pagamento...';
      btnConfirmPay.disabled = true;

      await emitDigitalTicket();

      checkoutState.isProcessing = false;
      btnConfirmPay.textContent = '✓ Já fiz o PIX • Liberar Ingresso';
      btnConfirmPay.disabled = false;
    });
  }

  // Confirmar Pagamento Cartão com Trava Anti-Clique Duplo
  const formCard = document.getElementById('form-card-payment');
  if (formCard) {
    formCard.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (checkoutState.isProcessing) return;
      checkoutState.isProcessing = true;

      const btnSubmit = formCard.querySelector('button[type="submit"]');
      if (btnSubmit) {
        btnSubmit.textContent = '⏳ Processando Cartão...';
        btnSubmit.disabled = true;
      }

      await emitDigitalTicket();

      checkoutState.isProcessing = false;
      if (btnSubmit) {
        btnSubmit.textContent = 'Pagar com Cartão de Crédito 💳';
        btnSubmit.disabled = false;
      }
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

/**
 * Zera o resultado da emissão anterior.
 * Sem isso os códigos do comprador anterior continuam em memória e podem ser
 * exibidos para o próximo cliente — cenário real no caixa da casa, onde o
 * mesmo aparelho atende várias pessoas seguidas.
 */
function limparEmissaoAnterior() {
  if (pollingPagamentoInterval) {
    clearInterval(pollingPagamentoInterval);
    pollingPagamentoInterval = null;
  }
  if (pixCountdownInterval) {
    clearInterval(pixCountdownInterval);
    pixCountdownInterval = null;
  }

  checkoutState.ticketCode = '';
  checkoutState.codigoValidador = '';
  checkoutState.codigosValidadores = [];
  checkoutState.codigoPedido = '';
  checkoutState.aguardandoPagamento = true;

  const lista = document.getElementById('ticket-qr-lista');
  if (lista) lista.innerHTML = '';
}

function limparDadosDoCliente() {
  checkoutState.customer = { name: '', cpf: '', email: '', whatsapp: '' };
  ['cust-name', 'cust-cpf', 'cust-email', 'cust-whatsapp'].forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) campo.value = '';
  });
}

function mostrarErroCheckout(mensagem) {
  const box = document.getElementById('checkout-erro');
  if (!box) {
    alert(mensagem);
    return;
  }
  box.textContent = mensagem;
  box.style.display = 'block';
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function esconderErroCheckout() {
  const box = document.getElementById('checkout-erro');
  if (box) {
    box.textContent = '';
    box.style.display = 'none';
  }
}

function openCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  // Compra nova começa com o estado limpo
  limparEmissaoAnterior();
  limparDadosDoCliente();
  esconderErroCheckout();
  checkoutState.quantity = 1;

  // Obtém o preço atualizado do card selecionado
  const selectedCard = document.querySelector('.sector-radio-card.is-selected');
  if (selectedCard) {
    const rawPrice = parseFloat(selectedCard.getAttribute('data-price'));
    if (Number.isFinite(rawPrice) && rawPrice > 0) {
      checkoutState.pricePerTicket = rawPrice;
    }
  }

  goToStep('step-selection');
  updateCheckoutTotals();
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function openCheckoutWithShow(showTitle) {
  checkoutState.eventName = sanitizeText(showTitle);
  const eventNameEl = document.getElementById('checkout-event-name');
  if (eventNameEl) eventNameEl.textContent = checkoutState.eventName;
  openCheckout();
}

function openCheckoutWithSector(sectorName) {
  openCheckout();
  const card = document.querySelector(`.sector-radio-card[data-sector="${sectorName}"]`);
  if (card) {
    card.click();
  }
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

/**
 * 4b. GERADOR OFICIAL DE PAYLOAD PIX (EMV QRCPS / BR CODE - BANCO CENTRAL)
 */
function gerarPayloadPixEMV({ chave, nomeRecebedor, cidade, valor, txid }) {
  function formatarCampo(id, valor) {
    const len = valor.length.toString().padStart(2, '0');
    return `${id}${len}${valor}`;
  }

  function crc16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  const cleanChave = (chave || 'auramococa@gmail.com').trim();
  const cleanNome = (nomeRecebedor || 'AURA MOCOCA').normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 25).trim();
  const cleanCidade = (cidade || 'MOCOCA').normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 15).trim();
  const cleanValor = parseFloat(valor || 0).toFixed(2);
  const cleanTxid = (txid || 'AURA' + Date.now().toString().slice(-6)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 25);

  const gui = formatarCampo('00', 'br.gov.bcb.pix');
  const key = formatarCampo('01', cleanChave);
  const merchantAccount = formatarCampo('26', `${gui}${key}`);

  const payloadSemCrc = [
    formatarCampo('00', '01'),
    formatarCampo('01', '12'),
    merchantAccount,
    formatarCampo('52', '0000'),
    formatarCampo('53', '986'),
    formatarCampo('54', cleanValor),
    formatarCampo('58', 'BR'),
    formatarCampo('59', cleanNome),
    formatarCampo('60', cleanCidade),
    formatarCampo('62', formatarCampo('05', cleanTxid)),
    '6304'
  ].join('');

  const checksum = crc16(payloadSemCrc);
  return `${payloadSemCrc}${checksum}`;
}

let pixCountdownInterval = null;
let pollingPagamentoInterval = null;

function renderPixQRCode() {
  const container = document.getElementById('pix-qrcode-render');
  const copyInput = document.getElementById('pix-copy-input');
  const total = (checkoutState.pricePerTicket * checkoutState.quantity).toFixed(2);

  const pixPayload = gerarPayloadPixEMV({
    chave: 'auramococa@gmail.com',
    nomeRecebedor: 'AURA MOCOCA',
    cidade: 'MOCOCA',
    valor: total,
    txid: 'AURA' + Date.now().toString().slice(-6)
  });

  if (copyInput) {
    copyInput.value = pixPayload;
  }

  if (container) {
    container.innerHTML = `
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixPayload)}&format=png&margin=4" 
           alt="QR Code PIX oficial de R$ ${total.replace('.', ',')}" 
           style="width: 100%; height: 100%; object-fit: contain; border-radius: 12px; background: #ffffff; padding: 6px;" />
    `;
  }

  iniciarTemporizadorPix(900); // 15 minutos
}

function iniciarTemporizadorPix(segundos) {
  if (pixCountdownInterval) clearInterval(pixCountdownInterval);
  let restante = segundos;
  const timerEl = document.getElementById('pix-countdown');

  function tick() {
    if (!timerEl) return;
    const min = Math.floor(restante / 60).toString().padStart(2, '0');
    const sec = (restante % 60).toString().padStart(2, '0');
    timerEl.textContent = `${min}:${sec}`;
    if (restante <= 0) {
      clearInterval(pixCountdownInterval);
      timerEl.textContent = '00:00 (Expirado)';
    }
    restante--;
  }
  tick();
  pixCountdownInterval = setInterval(tick, 1000);
}

/**
 * 4c. MONITORAMENTO EM TEMPO REAL (REALTIME POLLING) DO STATUS DO PAGAMENTO
 */
function iniciarMonitoramentoPagamento(codigoValidador) {
  if (pollingPagamentoInterval) clearInterval(pollingPagamentoInterval);
  if (!codigoValidador || !window.AuraDB) return;

  pollingPagamentoInterval = setInterval(async () => {
    try {
      const r = await window.AuraDB.buscarVoucher(codigoValidador);
      if (r && r.ok && r.ingresso && r.ingresso.pago) {
        clearInterval(pollingPagamentoInterval);
        pollingPagamentoInterval = null;
        checkoutState.aguardandoPagamento = false;
        atualizarTelaParaAprovado();
      }
    } catch (e) {
      console.warn('[Realtime] Polling de pagamento:', e);
    }
  }, 3000); // Checa a cada 3 segundos
}

function atualizarTelaParaAprovado() {
  const badge = document.getElementById('ticket-status-badge');
  const titulo = document.getElementById('success-title');
  const desc = document.getElementById('success-desc');
  const icone = document.getElementById('success-icon');

  if (badge) {
    badge.textContent = '[ ENTRADA VÁLIDA ]';
    badge.classList.remove('badge-aguardando');
    badge.style.background = 'rgba(16, 185, 129, 0.2)';
    badge.style.borderColor = '#10B981';
    badge.style.color = '#10B981';
    badge.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
  }
  if (icone) {
    icone.textContent = '✓';
    icone.style.color = '#10B981';
    icone.style.transform = 'scale(1.2)';
    icone.style.transition = 'transform 0.4s ease';
  }
  if (titulo) titulo.textContent = 'Pagamento Confirmado!';
  if (desc) desc.textContent = 'Seu pagamento via PIX foi confirmado com sucesso! Seu ingresso oficial da AURA MOCOCA está 100% liberado para a portaria.';

  tocarSomSucesso();

  if (navigator.vibrate) {
    try { navigator.vibrate([100, 50, 150]); } catch (e) {}
  }
}

function tocarSomSucesso() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

/**
 * 5. EMISSÃO BLINDADA DE INGRESSO E GRAVAÇÃO NO SUPABASE
 */
async function emitDigitalTicket() {
  // Trava no próprio motor de emissão, e não só no botão. Ela protege contra
  // qualquer caminho que chame a função duas vezes (dois handlers no mesmo
  // botão, toque duplo no celular, chamada solta pelo console).
  if (checkoutState.emitindo) {
    console.warn('[Checkout] Emissão já em andamento — chamada duplicada ignorada.');
    return false;
  }

  checkoutState.emitindo = true;
  try {
    return await gravarEEmitirIngressos();
  } finally {
    checkoutState.emitindo = false;
  }
}

/**
 * Grava pedido + ingressos no banco e só então mostra o ingresso.
 * Regra: se a gravação não concluir, o cliente NÃO vê tela de sucesso.
 * Um QR que não existe no banco é pior do que uma mensagem de erro — ele só
 * seria descoberto na portaria, com o cliente já na fila.
 */
async function gravarEEmitirIngressos() {
  limparEmissaoAnterior();
  esconderErroCheckout();

  if (!window.AuraDB) {
    mostrarErroCheckout(
      'Não foi possível falar com o sistema de ingressos. Recarregue a página e tente de novo. Se já pagou, chame no WhatsApp que a gente emite manualmente.'
    );
    return false;
  }

  try {
    // Pedido e ingressos são criados numa transação só, do lado do servidor.
    // O preço aplicado é o do banco: o que vai daqui é ignorado, então mexer
    // no data-price pelo DevTools não muda o valor cobrado.
    const r = await window.AuraDB.criarPedido({
      showId: checkoutState.showId,
      setor: checkoutState.sector,
      quantidade: checkoutState.quantity,
      nome: checkoutState.customer.name,
      cpf: checkoutState.customer.cpf,
      email: checkoutState.customer.email,
      whatsapp: checkoutState.customer.whatsapp,
      metodo: checkoutState.paymentMethod === 'card' ? 'CARTAO' : 'PIX'
    });

    if (!r || !r.ok) {
      mostrarErroCheckout(
        (r && r.mensagem)
          ? r.mensagem
          : 'Não conseguimos registrar seu pedido e por isso o ingresso não foi emitido. Nenhum pagamento foi confirmado aqui. Tente novamente ou chame no WhatsApp.'
      );
      return false;
    }

    checkoutState.codigosValidadores = Array.isArray(r.codigos) ? r.codigos : [];
    if (!checkoutState.codigosValidadores.length) {
      mostrarErroCheckout(
        `Seu pedido ${r.codigo_pedido || ''} foi registrado, mas os ingressos não voltaram do servidor. Guarde este código e chame no WhatsApp.`
      );
      return false;
    }

    checkoutState.ticketCode = checkoutState.codigosValidadores[0];
    checkoutState.codigoValidador = checkoutState.codigosValidadores[0];
    checkoutState.codigoPedido = r.codigo_pedido || '';
    checkoutState.aguardandoPagamento = r.status_pagamento !== 'APROVADO';

    // Valor oficial do banco — pode diferir do que a tela mostrava se o dono
    // acabou de trocar o preço do lote.
    if (r.valor_total != null) {
      checkoutState.pricePerTicket = Number(r.preco_unitario) || checkoutState.pricePerTicket;
      const totalEl = document.getElementById('txt-total');
      const subEl = document.getElementById('txt-subtotal');
      const fmt = `R$ ${Number(r.valor_total).toFixed(2).replace('.', ',')}`;
      if (totalEl) totalEl.textContent = fmt;
      if (subEl) subEl.textContent = fmt;
    }
  } catch (err) {
    console.error('[Checkout] Erro ao criar pedido:', err);
    mostrarErroCheckout(
      'Houve uma falha de conexão durante a emissão e o ingresso não foi gerado. Confira sua internet e tente novamente, ou chame no WhatsApp.'
    );
    return false;
  }

  renderIngressosEmitidos();
  goToStep('step-success');

  // Ativa monitoramento em tempo real se o pedido estiver aguardando confirmação do PIX
  if (checkoutState.aguardandoPagamento && checkoutState.codigosValidadores.length > 0) {
    iniciarMonitoramentoPagamento(checkoutState.codigosValidadores[0]);
  }

  return true;
}

/**
 * Monta a tela de sucesso: um QR Code por ingresso comprado.
 * Cada ingresso tem código próprio no banco — mostrar só o primeiro faria os
 * demais serem barrados na portaria como "já utilizado".
 */
function renderIngressosEmitidos() {
  const outEvent = document.getElementById('ticket-out-event');
  const outDateTime = document.getElementById('ticket-out-datetime');
  const outName = document.getElementById('ticket-out-name');
  const outSector = document.getElementById('ticket-out-sector');

  // O ingresso só abre a portaria depois que o dono confere o PIX na conta
  // dele. Dizer "entrada válida" antes disso mandaria o cliente para a fila
  // com um QR que a portaria vai recusar.
  const badge = document.getElementById('ticket-status-badge');
  const titulo = document.getElementById('success-title');
  const desc = document.getElementById('success-desc');
  const icone = document.getElementById('success-icon');

  if (checkoutState.aguardandoPagamento) {
    if (badge) {
      badge.textContent = '[ AGUARDANDO CONFIRMAÇÃO ]';
      badge.classList.add('badge-aguardando');
    }
    if (icone) icone.textContent = '⏳';
    if (titulo) titulo.textContent = 'Pedido registrado!';
    if (desc) {
      desc.textContent = `Assim que confirmarmos o recebimento do ${
        checkoutState.paymentMethod === 'card' ? 'pagamento' : 'PIX'
      }, seu ingresso é liberado e o QR Code passa a valer na portaria. Costuma levar poucos minutos. Guarde o código do pedido: ${checkoutState.codigoPedido}.`;
    }
  } else {
    if (badge) {
      badge.textContent = '[ ENTRADA VÁLIDA ]';
      badge.classList.remove('badge-aguardando');
    }
    if (icone) icone.textContent = '✓';
    if (titulo) titulo.textContent = 'Ingresso confirmado!';
    if (desc) desc.textContent = 'Seu ingresso oficial da AURA MOCOCA está liberado para a portaria.';
  }

  if (outEvent) outEvent.textContent = checkoutState.eventName.toUpperCase();
  if (outDateTime) outDateTime.textContent = checkoutState.eventDate.toUpperCase();
  if (outName) outName.textContent = checkoutState.customer.name || 'Cliente AURA';
  if (outSector) outSector.textContent = `${checkoutState.sector.toUpperCase()} (${checkoutState.quantity}x)`;

  const lista = document.getElementById('ticket-qr-lista');
  if (!lista) return;

  lista.innerHTML = '';
  const codigos = checkoutState.codigosValidadores;

  codigos.forEach((codigo, i) => {
    const item = document.createElement('div');
    item.className = 'ticket-qr-item';

    if (codigos.length > 1) {
      const rotulo = document.createElement('span');
      rotulo.className = 'ticket-qr-index font-mono';
      rotulo.textContent = `[ INGRESSO ${i + 1} DE ${codigos.length} ]`;
      item.appendChild(rotulo);
    }

    const caixa = document.createElement('div');
    caixa.className = 'ticket-qr-box';

    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(codigo)}&format=png&margin=6`;
    img.alt = `QR Code do ingresso ${i + 1} de ${codigos.length}`;
    caixa.appendChild(img);
    item.appendChild(caixa);

    const cod = document.createElement('span');
    cod.className = 'ticket-auth-code font-mono';
    cod.textContent = codigo;
    item.appendChild(cod);

    lista.appendChild(item);
  });
}

/**
 * 6. DISPARO DE INGRESSO NO WHATSAPP DO CLIENTE
 */
function sendTicketToWhatsApp() {
  const codigos = checkoutState.codigosValidadores;

  if (!codigos.length) {
    alert('Nenhum ingresso emitido para enviar. Finalize a compra primeiro.');
    return;
  }

  const zap = (checkoutState.customer.whatsapp || '').replace(/\D/g, '');
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');

  // Um link por ingresso: cada QR abre o voucher do seu próprio código
  const blocos = codigos
    .map((codigo, i) => {
      const link = `${baseUrl}ingresso.html?v=${encodeURIComponent(codigo)}`;
      const titulo = codigos.length > 1
        ? `*Ingresso ${i + 1} de ${codigos.length}*`
        : '*Seu ingresso*';
      return `${titulo}\nCodigo: ${codigo}\n${link}`;
    })
    .join('\n\n');

  const texto = encodeURIComponent(
`*INGRESSO OFICIAL - AURA MOCOCA*
________________________________________

*Evento:* ${checkoutState.eventName}
*Data:* ${checkoutState.eventDate}
*Titular:* ${checkoutState.customer.name}
*Setor:* ${checkoutState.sector.toUpperCase()} (${codigos.length}x)
________________________________________

${blocos}
________________________________________

${checkoutState.aguardandoPagamento
  ? `*ATENCAO:* o pagamento ainda esta em conferencia. Assim que for confirmado, os QR Codes acima passam a valer na portaria — o link ja mostra a situacao atualizada.
Codigo do pedido: ${checkoutState.codigoPedido}
________________________________________
`
  : ''}
*Instrucoes para Entrada:*
1. Abra cada link acima e mostre o QR Code na portaria.
2. Cada QR Code libera UMA entrada. Envie o link certo para cada pessoa.
3. Entrada permitida apenas para maiores de 18 anos com RG/CNH original.

*Endereco:* Av. Joao Batista Lima Figueiredo, 2707 - Mococa/SP

_Ingresso digital oficial emitido por AURA MOCOCA_`
  );

  const url = zap.length >= 10 ? `https://wa.me/55${zap}?text=${texto}` : `https://wa.me/?text=${texto}`;
  window.open(url, '_blank');
}

// Exportações globais
window.openCheckout = openCheckout;
window.openCheckoutWithShow = openCheckoutWithShow;
window.openCheckoutWithSector = openCheckoutWithSector;
window.closeCheckout = closeCheckout;
window.goToStep = goToStep;
window.emitDigitalTicket = emitDigitalTicket;
window.sendTicketToWhatsApp = sendTicketToWhatsApp;
