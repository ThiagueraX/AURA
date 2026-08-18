/**
 * AURA MOCOCA • CHECKOUT
 *
 * Três coisas que este arquivo NÃO decide:
 *   • o preço do ingresso — vem de `aura_lotes`, lido pelo servidor
 *   • o preço do combo    — vem de `aura_combos`; daqui só viaja o id
 *   • o valor cobrado no cartão — o servidor lê do pedido já gravado
 *
 * O que aparece na tela é vitrine. Quem cobra é o banco.
 */

// ═══════════════════════════════════════════════════════════════
// ESTADO DA COMPRA
// ═══════════════════════════════════════════════════════════════
const checkoutState = {
  showId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  eventName: 'Lorenah in Aura • Sertanejo & Funk',
  eventDate: 'Sábado, 22 de Agosto • 21:00',
  sector: 'Pista',
  pricePerTicket: 40,
  quantity: 1,
  combo: null,              // objeto vindo de aura_combos, ou null
  customer: { name: '', cpf: '', email: '', whatsapp: '' },
  isProcessing: false,
  stripe: null,
  cardElement: null,
  paymentMethod: 'pix',
  ticketCode: '',
  codigoValidador: '',
  codigosValidadores: [],
  codigoPedido: '',
  aguardandoPagamento: true,
  emitindo: false,
  combosDisponiveis: [],
  lotesDoShow: {}           // { PISTA: {preco, status}, ... }
};

/** Chave PUBLICÁVEL da Stripe — feita para ficar exposta no navegador.
 *  Enquanto começar com `pk_test`, a casa está em modo de teste: cartão real
 *  é recusado e cartão de teste passa. Trocar por `pk_live_...` quando a conta
 *  estiver verificada. A chave SECRETA vive só na Edge Function. */
const STRIPE_CHAVE_PUBLICAVEL = 'pk_test_51U5WRs3Rrnsnb48pwbOaVfCo5yUDf3mti0pMoAvm0H1fxDl3avKmDUSfvB8CCEeAOZSsPHGNeDru0UOntI4sN2qz00hhuf3mrx';
const STRIPE_EM_TESTE = STRIPE_CHAVE_PUBLICAVEL.startsWith('pk_test');

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO — combos e lotes vêm do banco, não de uma tabela escrita aqui
//
// A lista de combos morava neste arquivo com preço e tudo. Além de
// desencontrar do cardápio (12 dos 18 itens tinham id que o checkout não
// conhecia, e o cliente comprava sem o combo), era uma segunda fonte de
// verdade para preço. Agora só existe `aura_combos`.
// ═══════════════════════════════════════════════════════════════

const COMBO_NENHUM = {
  id: 'none',
  titulo: 'Apenas Ingresso (Sem Combo)',
  descricao: 'Acesso padrão à casa, sem bebidas inclusas',
  preco: 0,
  card_nome: null,
  card_cor: null,
  card_classe: null,
  badge: 'PADRÃO'
};

let carregandoCatalogo = null;

/** Carrega combos + lotes uma vez. Falha aqui nunca impede a venda. */
async function carregarCatalogo(showId) {
  if (carregandoCatalogo) return carregandoCatalogo;

  carregandoCatalogo = (async () => {
    if (!window.AuraDB) return;

    try {
      const combos = await window.AuraDB.fetchCombos();
      if (Array.isArray(combos)) checkoutState.combosDisponiveis = combos;
    } catch (e) {
      console.warn('[Checkout] Catálogo de combos indisponível:', e);
    }

    try {
      const lotes = await window.AuraDB.fetchLotes(showId || checkoutState.showId);
      if (Array.isArray(lotes)) {
        const mapa = {};
        lotes.forEach((l) => {
          mapa[String(l.setor || '').toUpperCase()] = {
            preco: Number(l.preco),
            status: l.status,
            disponivel: l.status === 'ATIVO' &&
                        Number(l.quantidade_vendida) < Number(l.quantidade_total)
          };
        });
        checkoutState.lotesDoShow = mapa;
      }
    } catch (e) {
      console.warn('[Checkout] Lotes indisponíveis:', e);
    }
  })();

  const p = carregandoCatalogo;
  p.finally(() => { carregandoCatalogo = null; });
  return p;
}

/** Setor do site ("VIP") para o código do banco ("BISTRO", herdado — ver ROTULOS_SETOR). */
function normalizarSetor(nome) {
  return String(nome || 'PISTA').toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

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
/**
 * Limpa o texto digitado sem mutilar o nome de ninguém.
 *
 * A versão anterior apagava `'` e `/`, e "D'Angelo" virava "DAngelo" no
 * ingresso nominal. Proteção contra HTML é `textContent` na hora de exibir —
 * e é assim que este arquivo escreve tudo. Aqui só tiram-se caracteres de
 * controle e o excesso de tamanho.
 */
function sanitizeText(str, limite = 120) {
  if (!str) return '';
  return String(str)
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limite);
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

  checkoutState.stripe = Stripe(STRIPE_CHAVE_PUBLICAVEL);
  const elements = checkoutState.stripe.elements();

  // Modo de teste é um estado perigoso de ficar em silêncio: cartão de verdade
  // é recusado e cartão de teste passa liberando ingresso sem dinheiro entrar.
  // Enquanto a chave for `pk_test`, isso fica escrito na tela.
  if (STRIPE_EM_TESTE) {
    const aviso = document.getElementById('card-errors');
    if (aviso) {
      aviso.textContent = 'Pagamento com cartão em MODO DE TESTE — cartões reais serão recusados. Use PIX.';
      aviso.style.color = '#FFC24A';
    }
  }
  
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

/**
 * PAGAMENTO COM CARTÃO
 *
 * A ordem aqui não é estética, é o que impede três defeitos que já estiveram
 * no ar ao mesmo tempo:
 *
 *   1. GRAVAR O PEDIDO ANTES DE COBRAR. A versão anterior cobrava o cartão e
 *      só depois tentava gravar; quando a gravação falhava, o cliente saía
 *      cobrado e sem ingresso, com o botão escrito "✓ Cartão Aprovado!".
 *   2. O VALOR VEM DO SERVIDOR. O navegador mandava `amount` em centavos.
 *      Bastava mudar uma linha no console para pagar R$ 1 num combo de R$ 440.
 *   3. O PAGAMENTO É AMARRADO AO PEDIDO. O `confirm` antigo aprovava qualquer
 *      codigoPedido com qualquer PaymentIntent que estivesse "succeeded" —
 *      e os códigos de pedido eram sequenciais.
 *
 * Agora: emite → pede a cobrança ao servidor → confirma o cartão → manda o
 * servidor conferir com a Stripe e aprovar. Em qualquer tropeço a tela NÃO
 * fica verde.
 */
async function processStripePayment(btnSubmit) {
  const erroCartao = document.getElementById('card-errors');
  const mostrarErroCartao = (msg) => {
    if (erroCartao) erroCartao.textContent = msg;
    mostrarErroCheckout(msg);
  };

  try {
    // ── 1. O pedido existe antes de qualquer cobrança ──────────────
    const emitiu = await emitDigitalTicket();
    if (!emitiu) {
      // `emitDigitalTicket` já escreveu o motivo em #checkout-erro.
      if (erroCartao) {
        erroCartao.textContent = 'Não foi possível registrar seu pedido, então nada foi cobrado. Veja o aviso acima.';
      }
      resetCardButton(btnSubmit);
      return;
    }

    if (!checkoutState.stripe || !checkoutState.cardElement) {
      mostrarErroCartao('O formulário de cartão não carregou. Recarregue a página ou pague via PIX.');
      resetCardButton(btnSubmit);
      return;
    }

    // ── 2. Quanto cobrar quem decide é o servidor ──────────────────
    const inicio = await window.AuraDB.iniciarPagamentoCartao(checkoutState.codigoPedido);

    if (!inicio.ok || !inicio.clientSecret) {
      mostrarErroCartao(
        (inicio.mensagem || 'Não foi possível abrir a cobrança no cartão.') +
        ` Seu pedido ${checkoutState.codigoPedido} está guardado — você pode pagar via PIX ou chamar no WhatsApp.`
      );
      resetCardButton(btnSubmit);
      return;
    }

    // ── 3. O cartão é confirmado no navegador, com a Stripe ────────
    const resultado = await checkoutState.stripe.confirmCardPayment(inicio.clientSecret, {
      payment_method: {
        card: checkoutState.cardElement,
        billing_details: {
          name: checkoutState.customer.name || undefined,
          email: checkoutState.customer.email || undefined
        }
      }
    });

    if (resultado.error) {
      // Cartão recusado, saldo insuficiente, 3DS cancelado. O pedido continua
      // PENDENTE e o cliente pode tentar de novo ou pagar por PIX.
      mostrarErroCartao(
        `${resultado.error.message} Seu pedido ${checkoutState.codigoPedido} continua reservado.`
      );
      resetCardButton(btnSubmit);
      return;
    }

    if (!resultado.paymentIntent || resultado.paymentIntent.status !== 'succeeded') {
      mostrarErroCartao(
        `O banco não concluiu o pagamento (${resultado.paymentIntent?.status || 'sem status'}). ` +
        `Seu pedido ${checkoutState.codigoPedido} continua reservado.`
      );
      resetCardButton(btnSubmit);
      return;
    }

    // ── 4. O servidor confere com a Stripe e aprova ────────────────
    const confirmacao = await window.AuraDB.confirmarPagamentoCartao(
      checkoutState.codigoPedido, inicio.paymentIntentId
    );

    if (!confirmacao.ok) {
      // Situação delicada: o cartão passou mas o sistema não registrou.
      // Nunca pintar de verde. O cliente precisa sair daqui com o código.
      mostrarErroCartao(
        `O pagamento foi aprovado no cartão, mas a confirmação no nosso sistema falhou ` +
        `(${confirmacao.mensagem || confirmacao.motivo || 'motivo não informado'}). ` +
        `GUARDE O CÓDIGO DO PEDIDO ${checkoutState.codigoPedido} e chame no WhatsApp: ` +
        `seu ingresso será liberado manualmente, sem cobrança nova.`
      );
      if (btnSubmit) {
        btnSubmit.textContent = 'Pagamento em conferência';
        btnSubmit.disabled = true;
      }
      checkoutState.isProcessing = false;
      return;
    }

    // ── 5. Só agora a tela pode ficar verde ────────────────────────
    checkoutState.aguardandoPagamento = false;
    pararMonitoramentoPagamento();
    atualizarTelaParaAprovado();

    if (btnSubmit) {
      btnSubmit.textContent = '✓ Cartão aprovado';
      btnSubmit.disabled = true;   // aprovado não se clica de novo
    }
    checkoutState.isProcessing = false;

  } catch (err) {
    console.error('[Cartão] Erro inesperado:', err);
    mostrarErroCartao(
      'Falha ao processar o pagamento: ' + (err && err.message ? err.message : 'erro desconhecido') +
      (checkoutState.codigoPedido ? ` Seu pedido ${checkoutState.codigoPedido} está guardado.` : '')
    );
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
  pararMonitoramentoPagamento();
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

/** R$ 1.234,50 */
function moedaBR(valor) {
  return 'R$ ' + Number(valor || 0).toFixed(2).replace('.', ',');
}

/**
 * Monta a lista de combos a partir do catálogo do banco.
 *
 * Tudo aqui é createElement + textContent: título e descrição vêm de
 * `aura_combos`, e dado de banco montado por template string é injeção de
 * HTML esperando acontecer.
 */
function renderComboSelector() {
  const container = document.getElementById('checkout-combo-selector-container');
  if (!container) return;

  const lista = [COMBO_NENHUM].concat(checkoutState.combosDisponiveis || []);

  container.textContent = '';

  if (lista.length === 1) {
    const aviso = document.createElement('p');
    aviso.className = 'combo-select-desc font-mono';
    aviso.textContent = 'Combos indisponíveis no momento — você ainda pode comprar seu ingresso normalmente.';
    container.appendChild(aviso);
    return;
  }

  lista.forEach((combo) => {
    const selecionado = (!checkoutState.combo && combo.id === 'none') ||
                        (checkoutState.combo && checkoutState.combo.id === combo.id);
    const preco = Number(combo.preco) || 0;

    const card = document.createElement('label');
    card.className = 'combo-select-card' + (selecionado ? ' is-selected' : '') +
                     (combo.card_classe ? ' ' + combo.card_classe : '');
    card.setAttribute('data-combo-id', combo.id);

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'checkout_combo_opt';
    radio.value = combo.id;
    radio.checked = !!selecionado;
    card.appendChild(radio);

    const conteudo = document.createElement('div');
    conteudo.className = 'combo-select-content';

    const topo = document.createElement('div');
    topo.className = 'combo-select-top';
    const titulo = document.createElement('span');
    titulo.className = 'combo-select-title';
    titulo.textContent = combo.titulo;
    const valor = document.createElement('span');
    valor.className = 'combo-select-price font-display';
    valor.textContent = preco > 0 ? '+ ' + moedaBR(preco) : 'Grátis (sem combo)';
    topo.appendChild(titulo);
    topo.appendChild(valor);

    const desc = document.createElement('p');
    desc.className = 'combo-select-desc font-mono';
    desc.textContent = combo.descricao || '';

    const rodape = document.createElement('div');
    rodape.className = 'combo-select-bottom';
    const chip = document.createElement('span');
    chip.className = 'combo-chip-badge font-mono';
    chip.textContent = combo.card_nome ? '🏷️ ' + combo.card_nome : 'ENTRADA SIMPLES';
    if (combo.card_cor) {
      chip.style.borderColor = combo.card_cor;
      chip.style.color = combo.card_cor;
    }
    rodape.appendChild(chip);
    if (combo.badge) {
      const tag = document.createElement('span');
      tag.className = 'combo-tag-badge font-mono';
      tag.textContent = combo.badge;
      rodape.appendChild(tag);
    }

    conteudo.appendChild(topo);
    conteudo.appendChild(desc);
    conteudo.appendChild(rodape);
    card.appendChild(conteudo);

    // Um handler só, no elemento criado — nada de onclick em string.
    card.addEventListener('click', () => selecionarCombo(combo.id));

    container.appendChild(card);
  });
}

/** Marca visualmente e guarda o combo escolhido. */
function selecionarCombo(comboId) {
  const cards = document.querySelectorAll('.combo-select-card');
  cards.forEach((c) => {
    const meu = c.getAttribute('data-combo-id') === comboId;
    c.classList.toggle('is-selected', meu);
    const r = c.querySelector('input[type="radio"]');
    if (r) r.checked = meu;
  });

  checkoutState.combo = (comboId && comboId !== 'none')
    ? (checkoutState.combosDisponiveis || []).find((c) => c.id === comboId) || null
    : null;

  updateCheckoutTotals();
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
            <div class="radio-card-title">Camarote Pré-Venda</div>
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
            <div class="radio-card-title">Camarote</div>
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

/**
 * Repinta os cartões de setor com o que está no banco.
 *
 * `configureCheckoutForShow` desenha a partir do cache local para a tela não
 * nascer vazia. Assim que os lotes chegam, esta função reescreve tudo com o
 * preço de verdade, inclui o VIP — código de banco `BISTRO`, nome trocado
 * porque a "mesa reservada" nunca existiu na casa — (que o checkout nunca
 * mostrou, embora o lote exista) e desabilita o setor pausado ou esgotado.
 *
 * O preço mostrado aqui é vitrine: quem cobra é `aura_criar_pedido`, que lê
 * `aura_lotes` no servidor. Se alguém editar o `data-price` no inspetor, o
 * pedido continua saindo pelo valor certo.
 */
const ROTULOS_SETOR = {
  PISTA:    { nome: 'Pista',    titulo: 'Pista Geral',   desc: 'Acesso ao salão e pista' },
  CAMAROTE: { nome: 'Camarote', titulo: 'Camarote',      desc: 'Vista elevada + Pulseira VIP' },
  BISTRO:   { nome: 'VIP',      titulo: 'VIP',           desc: 'Área VIP com atendimento exclusivo' }
};

function repintarSetoresDoBanco(setorPreferido) {
  const container = document.getElementById('checkout-sector-selector-grid') ||
                    document.querySelector('.sector-selector-grid');
  if (!container) return;

  const lotes = checkoutState.lotesDoShow || {};
  const chaves = Object.keys(ROTULOS_SETOR).filter((k) => lotes[k]);
  if (!chaves.length) return;   // sem resposta do banco, mantém o que já está na tela

  const preferido = normalizarSetor(setorPreferido || checkoutState.sector);
  const primeiroDisponivel = chaves.find((k) => lotes[k].disponivel);
  const escolhido = (lotes[preferido] && lotes[preferido].disponivel)
    ? preferido
    : (primeiroDisponivel || chaves[0]);

  container.textContent = '';

  chaves.forEach((chave) => {
    const lote = lotes[chave];
    const rotulo = ROTULOS_SETOR[chave];
    const selecionado = chave === escolhido && lote.disponivel;

    const card = document.createElement('label');
    card.className = 'sector-radio-card' +
                     (selecionado ? ' is-selected' : '') +
                     (lote.disponivel ? '' : ' is-indisponivel');
    card.setAttribute('data-sector', rotulo.nome);
    card.setAttribute('data-price', String(lote.preco));
    if (!lote.disponivel) {
      card.setAttribute('aria-disabled', 'true');
      card.style.opacity = '0.45';
      card.style.cursor = 'not-allowed';
    }

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'checkout_sector';
    radio.value = rotulo.nome;
    radio.checked = selecionado;
    radio.disabled = !lote.disponivel;
    card.appendChild(radio);

    const conteudo = document.createElement('div');
    conteudo.className = 'radio-card-content';

    const titulo = document.createElement('div');
    titulo.className = 'radio-card-title';
    titulo.textContent = rotulo.titulo;

    const preco = document.createElement('div');
    preco.className = 'radio-card-price';
    preco.textContent = moedaBR(lote.preco);

    const desc = document.createElement('div');
    desc.className = 'radio-card-desc font-mono';
    desc.textContent = lote.disponivel
      ? rotulo.desc
      : (lote.status === 'ESGOTADO' ? 'Vendas pausadas neste setor' : 'Ingressos esgotados neste setor');

    conteudo.appendChild(titulo);
    conteudo.appendChild(preco);
    conteudo.appendChild(desc);
    card.appendChild(conteudo);
    container.appendChild(card);
  });

  bindSectorCards();

  const loteEscolhido = lotes[escolhido];
  if (loteEscolhido) {
    checkoutState.sector = ROTULOS_SETOR[escolhido].nome;
    checkoutState.pricePerTicket = loteEscolhido.preco;
  }

  // Nenhum setor vendendo: o cliente precisa saber antes de digitar o CPF.
  const nadaDisponivel = chaves.every((k) => !lotes[k].disponivel);
  const btnAvancar = document.getElementById('btn-goto-identification');
  if (btnAvancar) {
    btnAvancar.disabled = nadaDisponivel;
    btnAvancar.title = nadaDisponivel ? 'Vendas encerradas no momento' : '';
  }
  if (nadaDisponivel) {
    mostrarErroCheckout('As vendas deste show estão pausadas no momento. Fale com a AURA no WhatsApp para saber da próxima data.');
  }

  updateCheckoutTotals();
}

/** Carrega o catálogo e repinta setores e combos com os dados do banco. */
function sincronizarComBanco(setorPreferido, comboPreSelecionado) {
  return carregarCatalogo(checkoutState.showId).then(() => {
    repintarSetoresDoBanco(setorPreferido);
    renderComboSelector();
    if (comboPreSelecionado && comboPreSelecionado !== 'none') {
      selecionarCombo(comboPreSelecionado);
    }
    updateCheckoutTotals();
  }).catch((e) => {
    console.warn('[Checkout] Não foi possível sincronizar com o banco:', e);
  });
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

  // A tela abre na hora com o cache e se corrige quando o banco responde.
  sincronizarComBanco();
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

  sincronizarComBanco(sectorName);
}

function openCheckoutWithCombo(comboId) {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  limparEmissaoAnterior();
  limparDadosDoCliente();
  esconderErroCheckout();
  checkoutState.quantity = 1;
  checkoutState.combo = null;

  configureCheckoutForShow('active');

  // O cliente ainda precisa escolher o setor, então a compra começa na etapa 1
  // com o combo já marcado. A marcação só acontece depois que o catálogo chega
  // do banco — antes disso o id vindo do cardápio não tem com o que casar.
  goToStep('step-selection');
  updateCheckoutTotals();

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  sincronizarComBanco(null, comboId);
}

function closeCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  // Fechar o modal precisa desligar os relógios. Sem isto o acompanhamento do
  // pagamento seguia consultando o banco a cada poucos segundos até a aba ser
  // fechada — no celular do cliente, a noite inteira.
  pararMonitoramentoPagamento();
  if (pixCountdownInterval) {
    clearInterval(pixCountdownInterval);
    pixCountdownInterval = null;
  }

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
      comboDescEl.textContent = checkoutState.combo.card_nome
        ? `+ ${checkoutState.combo.titulo} (${checkoutState.combo.card_nome}):`
        : `+ ${checkoutState.combo.titulo}:`;
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

/**
 * Desenha um QR Code dentro de `container`.
 *
 * Usa o gerador local (`js/qr.js`). Antes cada QR era desenhado por um site de
 * terceiros: o código de validação de todo cliente viajava na URL para fora —
 * e ficava no log de lá —, e sem internet a imagem não aparecia, com o cliente
 * já pago na fila da portaria. O serviço externo continua como plano B, para o
 * caso de `js/qr.js` não ter carregado.
 */
function criarImagemQR(texto, tamanhoPx, textoAlternativo) {
  const img = document.createElement('img');
  img.alt = textoAlternativo || 'QR Code';
  img.width = tamanhoPx;
  img.height = tamanhoPx;

  let pronto = false;
  if (window.AuraQR && typeof window.AuraQR.comoImagem === 'function') {
    try {
      img.src = window.AuraQR.comoImagem(texto, tamanhoPx);
      pronto = true;
    } catch (e) {
      console.warn('[QR] Gerador local falhou, usando serviço externo:', e);
    }
  }

  if (!pronto) {
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=' + tamanhoPx + 'x' + tamanhoPx +
              '&data=' + encodeURIComponent(texto) + '&format=png&margin=4';
    img.referrerPolicy = 'no-referrer';
  }

  img.style.width = '100%';
  img.style.height = 'auto';
  img.style.objectFit = 'contain';
  img.style.borderRadius = '12px';
  img.style.background = '#ffffff';
  img.style.padding = '6px';
  img.style.imageRendering = 'pixelated';
  return img;
}

function desenharQR(container, texto, tamanhoPx, textoAlternativo) {
  if (!container) return;
  container.textContent = '';
  container.appendChild(criarImagemQR(texto, tamanhoPx, textoAlternativo));
}

function renderPixQRCode() {
  const container = document.getElementById('pix-qrcode-render');
  const copyInput = document.getElementById('pix-copy-input');
  const total = getCheckoutTotalValor().toFixed(2);

  // O txid identifica a transferência no extrato. Quando o pedido já existe,
  // ele carrega o código do pedido — é o que permite ao dono casar o PIX
  // recebido com a fila de conferência. Antes da emissão só dá para usar um
  // provisório: a tela do PIX aparece antes de o pedido ser criado.
  const txid = checkoutState.codigoPedido
    ? checkoutState.codigoPedido.replace(/[^a-zA-Z0-9]/g, '')
    : 'AURA' + Date.now().toString().slice(-6);

  const pixPayload = gerarPayloadPixEMV({
    chave: 'auramococa@gmail.com',
    nomeRecebedor: 'AURA MOCOCA',
    cidade: 'MOCOCA',
    valor: total,
    txid: txid
  });

  if (copyInput) {
    copyInput.value = pixPayload;
  }

  desenharQR(container, pixPayload, 220,
    `QR Code PIX oficial de R$ ${total.replace('.', ',')}`);

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
 * ACOMPANHAMENTO DO PAGAMENTO EM TEMPO REAL
 *
 * Consulta o voucher de tempos em tempos até o dono dar baixa no PIX.
 *
 * Duas travas que faltavam: o intervalo continuava rodando depois de fechar o
 * modal (para sempre, a cada 3 segundos, no celular do cliente), e não havia
 * teto — um pedido nunca pago consultava o banco a noite inteira.
 */
const MONITORAMENTO_INTERVALO_MS = 5000;
const MONITORAMENTO_TETO_MS = 20 * 60 * 1000;   // 20 minutos

let monitoramentoIniciadoEm = 0;

function pararMonitoramentoPagamento() {
  if (pollingPagamentoInterval) {
    clearInterval(pollingPagamentoInterval);
    pollingPagamentoInterval = null;
  }
}

function iniciarMonitoramentoPagamento(codigoValidador) {
  pararMonitoramentoPagamento();
  if (!codigoValidador || !window.AuraDB) return;

  monitoramentoIniciadoEm = Date.now();

  pollingPagamentoInterval = setInterval(async () => {
    // Aba escondida não precisa consultar: a tela é reconferida ao voltar.
    if (document.hidden) return;

    if (Date.now() - monitoramentoIniciadoEm > MONITORAMENTO_TETO_MS) {
      pararMonitoramentoPagamento();
      const desc = document.getElementById('success-desc');
      if (desc && checkoutState.aguardandoPagamento) {
        desc.textContent =
          'Ainda não recebemos a confirmação do seu pagamento. Abra o link do seu ' +
          'ingresso a qualquer momento para ver a situação atualizada, ou chame no ' +
          `WhatsApp com o código do pedido ${checkoutState.codigoPedido}.`;
      }
      return;
    }

    try {
      const r = await window.AuraDB.buscarVoucher(codigoValidador);
      if (!r || !r.ok || !r.ingresso) return;

      const situacao = r.ingresso.status_pagamento;

      if (r.ingresso.pago) {
        pararMonitoramentoPagamento();
        checkoutState.aguardandoPagamento = false;
        atualizarTelaParaAprovado();
        return;
      }

      // O pedido pode ter sido cancelado pelo dono ou ter perdido o prazo
      // enquanto esta tela estava aberta. Melhor o cliente saber aqui do que
      // descobrir na porta da casa.
      if (situacao === 'CANCELADO' || situacao === 'EXPIRADO') {
        pararMonitoramentoPagamento();
        atualizarTelaParaPendenciaGrave(situacao);
      }
    } catch (e) {
      console.warn('[Pagamento] Falha ao consultar situação:', e);
    }
  }, MONITORAMENTO_INTERVALO_MS);
}

/** Pedido cancelado ou com prazo vencido: a tela não pode seguir otimista. */
function atualizarTelaParaPendenciaGrave(situacao) {
  const badge = document.getElementById('ticket-status-badge');
  const titulo = document.getElementById('success-title');
  const desc = document.getElementById('success-desc');
  const icone = document.getElementById('success-icon');

  const cancelado = situacao === 'CANCELADO';

  if (badge) {
    badge.textContent = cancelado ? '[ PEDIDO CANCELADO ]' : '[ PRAZO VENCIDO ]';
    badge.classList.add('badge-aguardando');
    badge.style.background = 'rgba(239, 68, 68, 0.15)';
    badge.style.borderColor = '#EF4444';
    badge.style.color = '#EF4444';
  }
  if (icone) icone.textContent = cancelado ? '✕' : '⏰';
  if (titulo) titulo.textContent = cancelado ? 'Pedido cancelado' : 'O prazo deste pedido venceu';
  if (desc) {
    desc.textContent = cancelado
      ? `O pedido ${checkoutState.codigoPedido} foi cancelado e os QR Codes não valem mais. ` +
        'Se você pagou, fale com a AURA no WhatsApp com esse código em mãos.'
      : `A reserva do pedido ${checkoutState.codigoPedido} foi liberada porque o pagamento ` +
        'não foi confirmado a tempo. Se você já pagou, chame no WhatsApp: a casa consegue reativar.';
  }
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
  if (titulo) titulo.textContent = 'Pagamento confirmado!';
  if (desc) {
    const meio = checkoutState.paymentMethod === 'card' ? 'no cartão' : 'via PIX';
    desc.textContent =
      `Seu pagamento ${meio} foi confirmado. O ingresso oficial da AURA MOCOCA está ` +
      'liberado para a portaria.';
  }

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
    // Só o id do combo viaja. Preço e nome são lidos de `aura_combos` no
    // servidor: antes o navegador mandava o preço junto e um combo de R$ 380
    // saía por R$ 0 mudando uma linha no console.
    const r = await window.AuraDB.criarPedido({
      showId: checkoutState.showId,
      setor: checkoutState.sector, // Setor base (ex.: "Pista"); o banco normaliza
      quantidade: checkoutState.quantity,
      nome: checkoutState.customer.name,
      cpf: checkoutState.customer.cpf,
      email: checkoutState.customer.email,
      whatsapp: checkoutState.customer.whatsapp,
      metodo: checkoutState.paymentMethod === 'card' ? 'CARTAO' : 'PIX',
      comboId: checkoutState.combo ? checkoutState.combo.id : null
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

  // Banner do combo e do card físico de retirada.
  // Montado com createElement: título e descrição vêm de `aura_combos`.
  if (comboBannerContainer) {
    comboBannerContainer.textContent = '';
    const combo = checkoutState.combo;

    if (combo && Number(combo.preco) > 0) {
      const banner = document.createElement('div');
      banner.className = 'ticket-combo-card-banner' + (combo.card_classe ? ' ' + combo.card_classe : '');

      if (combo.card_nome) {
        const topo = document.createElement('div');
        topo.className = 'combo-banner-top font-mono';
        const chip = document.createElement('span');
        chip.className = 'combo-banner-chip';
        if (combo.card_cor) chip.style.background = combo.card_cor;
        const rotulo = document.createElement('strong');
        rotulo.textContent = `RETIRADA NA PORTARIA: ${combo.card_nome}`;
        topo.appendChild(chip);
        topo.appendChild(rotulo);
        banner.appendChild(topo);
      }

      const nome = document.createElement('div');
      nome.className = 'combo-banner-name';
      nome.textContent = combo.titulo;
      banner.appendChild(nome);

      if (combo.descricao) {
        const desc = document.createElement('div');
        desc.className = 'combo-banner-desc font-mono';
        desc.textContent = combo.descricao;
        banner.appendChild(desc);
      }

      const acao = document.createElement('div');
      acao.className = 'combo-banner-action font-mono';
      acao.textContent = combo.card_nome
        ? `⚡ Apresente seu QR Code ao porteiro para receber seu ${combo.card_nome} físico e resgatar suas bebidas no Bar da AURA.`
        : '⚡ Apresente seu QR Code no Bar da AURA para retirar o seu pedido.';
      banner.appendChild(acao);

      comboBannerContainer.appendChild(banner);
      comboBannerContainer.style.display = 'block';
    } else {
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

    caixa.appendChild(
      criarImagemQR(codigo, 220, `QR Code do ingresso ${i + 1} de ${codigos.length}`)
    );
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

