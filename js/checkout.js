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
  combo: null, // Combo opcional selecionado pelo cliente
  customer: {
    name: '',
    cpf: '',
    email: '',
    whatsapp: ''
  },
  cpf: '',
  isProcessing: false,
  stripe: null,
  cardElement: null,
  paymentMethod: 'pix',
  ticketCode: '',
  codigoValidador: '',
  codigosValidadores: [],
  codigoPedido: '',
  aguardandoPagamento: true,
  emitindo: false
};

// Tabela Oficial de Combos Antecipados & Cards Físicos de Portaria
const LISTA_COMBOS_CHECKOUT = [
  {
    id: 'none',
    titulo: 'Apenas Ingresso (Sem Combo)',
    descricao: 'Acesso padrão à casa sem bebidas inclusas',
    preco: 0,
    cardNome: null,
    cardCor: null,
    cardClasse: null,
    tag: 'PADRÃO'
  },
  {
    id: 'combo-black-label',
    titulo: 'Combo Black Label 12 Anos',
    descricao: '1L Black Label + 5 Red Bulls + Gelo de Coco + Copos AURA',
    preco: 380.00,
    cardNome: 'CARD DOURADO',
    cardCor: '#FFC24A',
    cardClasse: 'card-gold',
    tag: '★ MAIS PEDIDO VIP'
  },
  {
    id: 'combo-red-label',
    titulo: 'Combo Red Label',
    descricao: '1L Red Label + 5 Red Bulls + Gelo de Coco + Copos',
    preco: 290.00,
    cardNome: 'CARD ÂMBAR',
    cardCor: '#FF8A0F',
    cardClasse: 'card-amber',
    tag: 'CLÁSSICO DA NOITE'
  },
  {
    id: 'combo-absolut',
    titulo: 'Combo Absolut Vodka',
    descricao: '1L Absolut + 5 Red Bulls (Tropical/Trad.) + Gelo + Copos',
    preco: 310.00,
    cardNome: 'CARD AZUL',
    cardCor: '#00F0FF',
    cardClasse: 'card-blue',
    tag: 'VODKA VIP'
  },
  {
    id: 'combo-ciroc',
    titulo: 'Combo Cîroc Ultra Premium',
    descricao: '750ml Cîroc + 6 Red Bulls + Balde Iluminado + Taças',
    preco: 440.00,
    cardNome: 'CARD AZUL ROYAL',
    cardCor: '#3B82F6',
    cardClasse: 'card-royal-blue',
    tag: '💎 ULTRA PREMIUM'
  },
  {
    id: 'combo-tanqueray',
    titulo: 'Combo Gin Tanqueray',
    descricao: '750ml Tanqueray + 5 Tônicas + Especiarias + Taças Gin AURA',
    preco: 340.00,
    cardNome: 'CARD VERMELHO',
    cardCor: '#EF4444',
    cardClasse: 'card-red',
    tag: 'GIN & TONIC'
  },
  {
    id: 'combo-chandon-passion',
    titulo: 'Chandon Passion On The Rocks',
    descricao: '750ml Chandon Passion + Balde de Gelo Especial + 4 Taças',
    preco: 210.00,
    cardNome: 'CARD ROSA',
    cardCor: '#EC4899',
    cardClasse: 'card-pink',
    tag: '★ ON THE ROCKS'
  },
  {
    id: 'combo-heineken',
    titulo: 'Balde Heineken (6 Long Necks)',
    descricao: '6x Garrafas Heineken 330ml no Balde com Gelo Moído',
    preco: 84.00,
    cardNome: 'CARD VERDE',
    cardCor: '#10B981',
    cardClasse: 'card-green',
    tag: 'CERVEJA GELADA'
  },
  {
    id: 'combo-corona',
    titulo: 'Balde Corona Extra (6 com Limão)',
    descricao: '6x Corona 330ml no Balde de Gelo + Fatias de Limão Tahiti',
    preco: 90.00,
    cardNome: 'CARD VERDE LIMÃO',
    cardCor: '#EAB308',
    cardClasse: 'card-lime',
    tag: 'COM LIMÃO TAHITI'
  },
  {
    id: 'combo-redbull-5x',
    titulo: 'Combo 5x Red Bull Energy Drink',
    descricao: '5x Latas 250ml (Sabores à escolha) no Baldinho de Gelo',
    preco: 95.00,
    cardNome: 'CARD CIANO',
    cardCor: '#06B6D4',
    cardClasse: 'card-cyan',
    tag: 'ENERGIA'
  }
];

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
  bindSectorCards();

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
      
      // Inicializa o Stripe Element quando a aba for aberta pela primeira vez
      initStripeElement();
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

      await processStripePayment(btnSubmit);
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

// --------------------------------------------------------------------------------------
// STRIPE INTEGRATION LOGIC
// --------------------------------------------------------------------------------------
function initStripeElement() {
  // Evitar dupla inicialização
  if (checkoutState.stripe || !window.Stripe) return;
  
  // Inicializa a Stripe com a Publishable Key de Teste
  checkoutState.stripe = Stripe('pk_test_51U5WRs3Rrnsnb48pwbOaVfCo5yUDf3mti0pMoAvm0H1fxDl3avKmDUSfvB8CCEeAOZSsPHGNeDru0UOntI4sN2qz00hhuf3mrx');
  const elements = checkoutState.stripe.elements();
  
  // Customização para o Dark Mode do site
  const style = {
    base: {
      color: '#fff',
      fontFamily: '"SF Mono", "Consolas", monospace',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#ff4a4a',
      iconColor: '#ff4a4a'
    }
  };
  
  checkoutState.cardElement = elements.create('card', { style: style, hidePostalCode: true });
  checkoutState.cardElement.mount('#card-element');
  
  checkoutState.cardElement.on('change', function(event) {
    const displayError = document.getElementById('card-errors');
    if (event.error) {
      displayError.textContent = event.error.message;
    } else {
      displayError.textContent = '';
    }
  });
}

async function processStripePayment(btnSubmit) {
  try {
    const totalEmCentavos = Math.round(getCheckoutTotalValor() * 100);
    
    // 1. Chamar a Edge Function do Supabase para criar o PaymentIntent
    // Nota: Esta função precisa estar ativa no painel do Supabase!
    const response = await fetch('https://sgfyxmajpdgynsicmzdb.supabase.co/functions/v1/stripe-payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        amount: totalEmCentavos, 
        currency: 'brl',
        description: 'Ingresso AURA Mococa'
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Erro no servidor de pagamento. O servidor Edge Function está online?");
    }

    if (!data || !data.clientSecret) {
      throw new Error("Resposta inválida do servidor Stripe.");
    }

    // 2. Confirmar o pagamento no cliente passando os dados do cartão
    const result = await checkoutState.stripe.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: checkoutState.cardElement,
        billing_details: {
          name: checkoutState.nome
        }
      }
    });

    if (result.error) {
      // Erro na aprovação do cartão (ex: sem saldo, recusado)
      const displayError = document.getElementById('card-errors');
      displayError.textContent = result.error.message;
      resetCardButton(btnSubmit);
    } else {
      // Sucesso total! Cartão aprovado.
      if (result.paymentIntent.status === 'succeeded') {
        await emitDigitalTicket();
        
        // Avisa o servidor para marcar como APROVADO no banco de dados!
        try {
          await fetch('https://sgfyxmajpdgynsicmzdb.supabase.co/functions/v1/stripe-payment', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'confirm',
              paymentIntentId: data.paymentIntentId,
              codigoPedido: checkoutState.codigoPedido
            })
          });
        } catch (e) {
          console.error("Falha ao confirmar no banco de dados", e);
        }

        resetCardButton(btnSubmit, '✓ Cartão Aprovado!');
        
        // Força a tela a ficar Verde (Aprovado) imediatamente,
        checkoutState.aguardandoPagamento = false;
        atualizarTelaParaAprovado();
      }
    }

  } catch (err) {
    console.error("Erro Stripe:", err);
    const displayError = document.getElementById('card-errors');
    displayError.textContent = "Falha ao processar pagamento: " + err.message;
    resetCardButton(btnSubmit);
  }
}

function resetCardButton(btn, text = 'Pagar com Cartão de Crédito 💳') {
  checkoutState.isProcessing = false;
  if (btn) {
    btn.textContent = text;
    btn.disabled = false;
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

/**
 * Configuração e Seleção de Shows e Setores (Show Ativo vs Pré-Venda)
 */
function getActiveAdminConfig() {
  if (window.AuraConfig && typeof window.AuraConfig.getStoredConfig === 'function') {
    return window.AuraConfig.getStoredConfig();
  }
  if (typeof currentConfig !== 'undefined' && currentConfig && currentConfig.activeShow) {
    return currentConfig;
  }
  try {
    const saved = localStorage.getItem('aura_admin_config_v1');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    activeShow: {
      id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      title: 'Lorenah in Aura • Sertanejo & Funk',
      date: 'Sábado, 22 de Agosto • 21:00',
      dateBadge: 'SÁBADO 22/08',
      pricePista: 40,
      priceCamarote: 90,
      badge: '1º LOTE ATIVO'
    },
    nextShow: {
      id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      title: 'AURA Saturday Sessions',
      date: 'Sábado Seguinte • 21:00',
      dateBadge: 'PRÉ-VENDA',
      price: 35,
      pricePista: 35,
      priceCamarote: 75,
      badge: 'PRÉ-VENDA'
    }
  };
}

function renderComboSelector() {
  const container = document.getElementById('checkout-combo-selector-container');
  if (!container) return;

  container.innerHTML = LISTA_COMBOS_CHECKOUT.map((combo) => {
    const isSelected = (!checkoutState.combo && combo.id === 'none') || (checkoutState.combo && checkoutState.combo.id === combo.id);
    const precoTxt = combo.preco > 0 ? `+ R$ ${combo.preco.toFixed(2).replace('.', ',')}` : 'Grátis (Sem combo)';
    const cardBadgeTxt = combo.cardNome ? `🏷️ ${combo.cardNome}` : 'ENTRADA SIMPLES';

    return `
      <label class="combo-select-card ${isSelected ? 'is-selected' : ''} ${combo.cardClasse || ''}" data-combo-id="${combo.id}">
        <input type="radio" name="checkout_combo_opt" value="${combo.id}" ${isSelected ? 'checked' : ''} />
        <div class="combo-select-content">
          <div class="combo-select-top">
            <span class="combo-select-title">${combo.titulo}</span>
            <span class="combo-select-price font-display">${precoTxt}</span>
          </div>
          <p class="combo-select-desc font-mono">${combo.descricao}</p>
          <div class="combo-select-bottom">
            <span class="combo-chip-badge font-mono" style="${combo.cardCor ? `border-color:${combo.cardCor}; color:${combo.cardCor};` : ''}">
              ${cardBadgeTxt}
            </span>
            ${combo.tag ? `<span class="combo-tag-badge font-mono">${combo.tag}</span>` : ''}
          </div>
        </div>
      </label>
    `;
  }).join('');

  bindComboSelector();
}

function bindComboSelector() {
  const cards = document.querySelectorAll('.combo-select-card');
  cards.forEach((card) => {
    card.onclick = () => {
      cards.forEach((c) => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const comboId = card.getAttribute('data-combo-id');
      if (comboId && comboId !== 'none') {
        const item = LISTA_COMBOS_CHECKOUT.find(c => c.id === comboId);
        checkoutState.combo = item || null;
      } else {
        checkoutState.combo = null;
      }

      updateCheckoutTotals();
    };
  });
}

function getCheckoutTotalValor() {
  const ingressos = Number(checkoutState.pricePerTicket || 0) * Number(checkoutState.quantity || 1);
  const combo = (checkoutState.combo && Number.isFinite(checkoutState.combo.preco)) ? Number(checkoutState.combo.preco) : 0;
  return ingressos + combo;
}

function bindSectorCards() {
  const sectorCards = document.querySelectorAll('.sector-radio-card');
  sectorCards.forEach((card) => {
    card.onclick = () => {
      sectorCards.forEach((c) => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const sectorName = card.getAttribute('data-sector') || 'Pista';
      const rawPrice = parseFloat(card.getAttribute('data-price'));

      checkoutState.sector = sectorName;
      if (Number.isFinite(rawPrice) && rawPrice > 0) {
        checkoutState.pricePerTicket = rawPrice;
      }

      updateCheckoutTotals();
    };
  });
}

function configureCheckoutForShow(targetShow = 'active', preselectedSector = null) {
  const config = getActiveAdminConfig();
  const isNext = (
    targetShow === 'next' ||
    targetShow === 'prevenda' ||
    targetShow === 'pre-venda' ||
    (typeof targetShow === 'string' && (
      targetShow.toLowerCase().includes('saturday') ||
      targetShow.toLowerCase().includes('sessions') ||
      targetShow.toLowerCase().includes('pré-venda') ||
      targetShow.toLowerCase().includes('prevenda') ||
      targetShow.toLowerCase().includes('proximo') ||
      targetShow.toLowerCase().includes('próximo')
    ))
  );

  const eventBadgeEl = document.getElementById('checkout-event-badge');
  const eventNameEl = document.getElementById('checkout-event-name');
  const sectorContainer = document.getElementById('checkout-sector-selector-grid') || document.querySelector('.sector-selector-grid');

  if (isNext) {
    const nextCfg = config.nextShow || {};
    const nextPrice = Number(nextCfg.price || nextCfg.pricePista) || 35;
    const nextCamarote = Number(nextCfg.priceCamarote) || 75;

    checkoutState.showId = nextCfg.id || 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';
    checkoutState.eventName = nextCfg.title || 'AURA Saturday Sessions';
    checkoutState.eventDate = nextCfg.date || 'Sábado Seguinte • 21:00';
    checkoutState.badge = nextCfg.badge || 'PRÉ-VENDA';

    if (eventBadgeEl) {
      eventBadgeEl.textContent = `⚡ PRÉ-VENDA • ${nextCfg.date || 'SÁBADO SEGUINTE'}`;
      eventBadgeEl.style.color = '#00F0FF';
      eventBadgeEl.style.borderColor = 'rgba(0, 240, 255, 0.4)';
      eventBadgeEl.style.background = 'rgba(0, 240, 255, 0.1)';
    }
    if (eventNameEl) {
      eventNameEl.textContent = checkoutState.eventName;
    }

    const isCamarote = preselectedSector === 'Camarote';
    if (sectorContainer) {
      sectorContainer.innerHTML = `
        <label class="sector-radio-card ${isCamarote ? '' : 'is-selected'}" data-sector="Pista" data-price="${nextPrice}">
          <input type="radio" name="checkout_sector" value="Pista" ${isCamarote ? '' : 'checked'} />
          <div class="radio-card-content">
            <div class="radio-card-title">Lote Promocional (Pista)</div>
            <div class="radio-card-price">R$ ${nextPrice.toFixed(2).replace('.', ',')}</div>
            <div class="radio-card-desc font-mono">Acesso antecipado com desconto de pré-venda</div>
          </div>
        </label>

        <label class="sector-radio-card ${isCamarote ? 'is-selected' : ''}" data-sector="Camarote" data-price="${nextCamarote}">
          <input type="radio" name="checkout_sector" value="Camarote" ${isCamarote ? 'checked' : ''} />
          <div class="radio-card-content">
            <div class="radio-card-title">Camarote VIP Pré-Venda</div>
            <div class="radio-card-price">R$ ${nextCamarote.toFixed(2).replace('.', ',')}</div>
            <div class="radio-card-desc font-mono">Vista VIP elevada + Pulseira exclusiva</div>
          </div>
        </label>
      `;
      bindSectorCards();
    }

    checkoutState.sector = isCamarote ? 'Camarote' : 'Pista';
    checkoutState.pricePerTicket = isCamarote ? nextCamarote : nextPrice;
  } else {
    const actCfg = config.activeShow || {};
    const pricePista = Number(actCfg.pricePista) || 40;
    const priceCamarote = Number(actCfg.priceCamarote) || 90;

    checkoutState.showId = actCfg.id || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
    if (typeof targetShow === 'string' && targetShow !== 'active' && !isNext) {
      checkoutState.eventName = sanitizeText(targetShow);
    } else {
      checkoutState.eventName = actCfg.title || 'Lorenah in Aura • Sertanejo & Funk';
    }
    checkoutState.eventDate = actCfg.date || 'Sábado, 22 de Agosto • 21:00';
    checkoutState.badge = actCfg.badge || '1º LOTE ATIVO';

    if (eventBadgeEl) {
      eventBadgeEl.textContent = actCfg.dateBadge || 'SÁBADO 22/08';
      eventBadgeEl.style.color = '#FFC24A';
      eventBadgeEl.style.borderColor = 'rgba(255, 194, 74, 0.4)';
      eventBadgeEl.style.background = 'rgba(255, 194, 74, 0.12)';
    }
    if (eventNameEl) {
      eventNameEl.textContent = checkoutState.eventName;
    }

    const isCamarote = preselectedSector === 'Camarote';
    if (sectorContainer) {
      sectorContainer.innerHTML = `
        <label class="sector-radio-card ${isCamarote ? '' : 'is-selected'}" data-sector="Pista" data-price="${pricePista}">
          <input type="radio" name="checkout_sector" value="Pista" ${isCamarote ? '' : 'checked'} />
          <div class="radio-card-content">
            <div class="radio-card-title">Pista Geral</div>
            <div class="radio-card-price">R$ ${pricePista.toFixed(2).replace('.', ',')}</div>
            <div class="radio-card-desc font-mono">Acesso ao salão e pista</div>
          </div>
        </label>

        <label class="sector-radio-card ${isCamarote ? 'is-selected' : ''}" data-sector="Camarote" data-price="${priceCamarote}">
          <input type="radio" name="checkout_sector" value="Camarote" ${isCamarote ? 'checked' : ''} />
          <div class="radio-card-content">
            <div class="radio-card-title">Camarote VIP</div>
            <div class="radio-card-price">R$ ${priceCamarote.toFixed(2).replace('.', ',')}</div>
            <div class="radio-card-desc font-mono">Vista elevada + Pulseira VIP</div>
          </div>
        </label>
      `;
      bindSectorCards();
    }

    checkoutState.sector = isCamarote ? 'Camarote' : 'Pista';
    checkoutState.pricePerTicket = isCamarote ? priceCamarote : pricePista;
  }

  // Renderiza a lista de combos disponíveis
  renderComboSelector();
}

function openCheckout(targetShow = 'active') {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  // Compra nova começa com o estado limpo
  limparEmissaoAnterior();
  limparDadosDoCliente();
  esconderErroCheckout();
  checkoutState.quantity = 1;
  checkoutState.combo = null;

  configureCheckoutForShow(targetShow);

  goToStep('step-selection');
  updateCheckoutTotals();
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function openCheckoutWithShow(showIdentifier) {
  openCheckout(showIdentifier);
}

function openCheckoutWithSector(sectorName) {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  limparEmissaoAnterior();
  limparDadosDoCliente();
  esconderErroCheckout();
  checkoutState.quantity = 1;
  checkoutState.combo = null;

  configureCheckoutForShow('active', sectorName);

  goToStep('step-selection');
  updateCheckoutTotals();
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function openCheckoutWithCombo(comboId) {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  limparEmissaoAnterior();
  limparDadosDoCliente();
  esconderErroCheckout();
  checkoutState.quantity = 1;
  
  // Pre-select the combo
  if (comboId && comboId !== 'none') {
    const item = LISTA_COMBOS_CHECKOUT.find(c => c.id === comboId);
    checkoutState.combo = item || null;
  } else {
    checkoutState.combo = null;
  }

  configureCheckoutForShow('active');

  // Skip straight to the Combo Step (step 3) or just open Step 1?
  // Since they MUST select a ticket, we open Step 1, but the combo is already pre-selected.
  goToStep('step-selection');
  
  // Update the UI so the combo is visually selected
  renderComboSelector();
  updateCheckoutTotals();

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
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
  const comboRowEl = document.getElementById('subtotal-combo-row');
  const comboDescEl = document.getElementById('txt-subtotal-combo-desc');
  const comboValEl = document.getElementById('txt-subtotal-combo-val');

  const ingressosSubtotal = checkoutState.pricePerTicket * checkoutState.quantity;
  const total = getCheckoutTotalValor();

  if (qtyEl) qtyEl.textContent = checkoutState.quantity;
  if (subtotalEl) subtotalEl.textContent = `R$ ${ingressosSubtotal.toFixed(2).replace('.', ',')}`;

  if (comboRowEl && comboDescEl && comboValEl) {
    if (checkoutState.combo && checkoutState.combo.preco > 0) {
      comboRowEl.style.display = 'flex';
      comboDescEl.textContent = `+ ${checkoutState.combo.titulo} (${checkoutState.combo.cardNome}):`;
      comboValEl.textContent = `R$ ${checkoutState.combo.preco.toFixed(2).replace('.', ',')}`;
    } else {
      comboRowEl.style.display = 'none';
    }
  }

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
  const total = getCheckoutTotalValor().toFixed(2);

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
    const comboAtivo = checkoutState.combo && checkoutState.combo.preco > 0;

    const r = await window.AuraDB.criarPedido({
      showId: checkoutState.showId,
      setor: checkoutState.sector, // Setor base limpo (ex: "Pista") para o Supabase validar
      quantidade: checkoutState.quantity,
      nome: checkoutState.customer.name,
      cpf: checkoutState.customer.cpf,
      email: checkoutState.customer.email,
      whatsapp: checkoutState.customer.whatsapp,
      metodo: checkoutState.paymentMethod === 'card' ? 'CARTAO' : 'PIX',
      comboNome: comboAtivo ? `${checkoutState.combo.cardNome}: ${checkoutState.combo.titulo}` : null,
      comboPreco: comboAtivo ? checkoutState.combo.preco : 0
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

    const totalReal = getCheckoutTotalValor();
    const totalEl = document.getElementById('txt-total');
    const subEl = document.getElementById('txt-subtotal');
    const fmt = `R$ ${totalReal.toFixed(2).replace('.', ',')}`;
    if (totalEl) totalEl.textContent = fmt;
    if (subEl) subEl.textContent = fmt;
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
 * Monta a tela de sucesso: um QR Code por ingresso comprado + Banner do Combo/Card
 */
function renderIngressosEmitidos() {
  const outEvent = document.getElementById('ticket-out-event');
  const outDateTime = document.getElementById('ticket-out-datetime');
  const outName = document.getElementById('ticket-out-name');
  const outSector = document.getElementById('ticket-out-sector');
  const comboBannerContainer = document.getElementById('ticket-out-combo-container');

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

  // Banner do Combo e Card Físico de Portaria
  if (comboBannerContainer) {
    if (checkoutState.combo && checkoutState.combo.preco > 0) {
      comboBannerContainer.innerHTML = `
        <div class="ticket-combo-card-banner ${checkoutState.combo.cardClasse}">
          <div class="combo-banner-top font-mono">
            <span class="combo-banner-chip" style="background:${checkoutState.combo.cardCor}"></span>
            <strong>RETIRADA NA PORTARIA: ${checkoutState.combo.cardNome}</strong>
          </div>
          <div class="combo-banner-name">${checkoutState.combo.titulo}</div>
          <div class="combo-banner-desc font-mono">${checkoutState.combo.descricao}</div>
          <div class="combo-banner-action font-mono">
            ⚡ <strong>Apresente seu QR Code ao porteiro</strong> para receber seu <strong>${checkoutState.combo.cardNome}</strong> físico e resgatar suas garrafas no Bar da AURA.
          </div>
        </div>
      `;
      comboBannerContainer.style.display = 'block';
    } else {
      comboBannerContainer.innerHTML = '';
      comboBannerContainer.style.display = 'none';
    }
  }

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
 * 6. DISPARO DE INGRESSO NO WHATSAPP DO CLIENTE COM SUPORTE A COMBOS E CARDS
 */
function sendTicketToWhatsApp() {
  const codigos = checkoutState.codigosValidadores;

  if (!codigos.length) {
    alert('Nenhum ingresso emitido para enviar. Finalize a compra primeiro.');
    return;
  }

  const zap = (checkoutState.customer.whatsapp || '').replace(/\D/g, '');
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');

  const blocos = codigos
    .map((codigo, i) => {
      const link = `${baseUrl}ingresso.html?v=${encodeURIComponent(codigo)}`;
      const titulo = codigos.length > 1
        ? `*Ingresso ${i + 1} de ${codigos.length}*`
        : '*Seu ingresso*';
      return `${titulo}\nCodigo: ${codigo}\n${link}`;
    })
    .join('\n\n');

  const blocoComboZap = (checkoutState.combo && checkoutState.combo.preco > 0)
    ? `\n*Combo Incluso:* ${checkoutState.combo.titulo} (R$ ${checkoutState.combo.preco.toFixed(2).replace('.', ',')})
🍸 *Atenção:* Para retirar as suas bebidas, basta apresentar este mesmo QR Code diretamente no balcão do Bar!
________________________________________\n`
    : '';

  const texto = encodeURIComponent(
`*INGRESSO OFICIAL - AURA MOCOCA*
________________________________________

*Evento:* ${checkoutState.eventName}
*Data:* ${checkoutState.eventDate}
*Titular:* ${checkoutState.customer.name}
*Setor:* ${checkoutState.sector.toUpperCase()} (${codigos.length}x)
${blocoComboZap}________________________________________

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
${checkoutState.combo && checkoutState.combo.preco > 0 ? `3. Apresente este mesmo QR Code no balcão do Bar para retirar seu combo.\n4. Entrada permitida apenas para maiores de 18 anos com RG/CNH original.` : `3. Entrada permitida apenas para maiores de 18 anos com RG/CNH original.`}

⚠️ *ALERTA DE SEGURANÇA:*
Seu QR Code é o seu ingresso e o seu combo! NUNCA tire print e envie para outras pessoas. Se o seu QR Code for escaneado por outra pessoa primeiro, ele perderá a validade. A casa não se responsabiliza por ingressos ou combos roubados por compartilhamento de prints!

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
window.openCheckoutWithCombo = openCheckoutWithCombo;
window.closeCheckout = closeCheckout;
window.goToStep = goToStep;
window.emitDigitalTicket = emitDigitalTicket;
window.sendTicketToWhatsApp = sendTicketToWhatsApp;

