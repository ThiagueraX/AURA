/**
 * AURA MOCOCA • PORTARIA & BAR — LEITOR DE QR E BAIXA DE ENTRADA
 *
 * Esta tela fica na mão do porteiro, no escuro, com fila esperando.
 * Duas regras guiam tudo aqui:
 *   1. Nenhum resultado pode ser ambíguo — cada motivo de recusa devolvido
 *      pelo banco tem título, cor e instrução próprios. Nada cai em
 *      "erro genérico".
 *   2. Nenhuma decisão é tomada no navegador. Quem libera, recusa e arbitra
 *      corrida de leitura dupla é o banco (aura_validar_ingresso /
 *      aura_resgatar_combo). Aqui só se exibe a resposta.
 *
 * O combo NÃO é mais adivinhado a partir do texto do setor: ele chega pronto
 * em `ingresso.combo` ({ id, titulo, descricao, card_nome, card_cor,
 * card_classe }) com `ingresso.combo_status` ao lado.
 */

// ═══════════════════════════════════════════════════════════════
// ESTADO
// ═══════════════════════════════════════════════════════════════

let html5QrCode = null;
let availableCameras = [];
let currentCameraIndex = 0;
let cameraViva = false;

let isScanning = false;   // câmera lendo e aceitando leitura
let validando = false;    // uma validação em voo — trava leitura dupla
let isFlashOn = false;

let modoOperacao = 'PORTARIA';  // 'PORTARIA' ou 'BAR'
let modoPendente = null;        // modo a retomar depois de refazer o login
let operadorAtual = 'PORTARIA'; // vai para o log de auditoria de cada entrada
let emailSessao = '';

let placarTimer = null;
const INTERVALO_PLACAR = 30000; // 30s

// ═══════════════════════════════════════════════════════════════
// SOM
// O AudioContext do celular nasce suspenso e a leitura do QR não conta
// como gesto do usuário. Por isso ele é criado no clique que escolhe o
// modo (gesto de verdade) e todo bipe chama resume() antes de tocar —
// sem isso o porteiro fica sem retorno sonoro e não percebe.
// ═══════════════════════════════════════════════════════════════

const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function prepararAudio() {
  try {
    if (!AudioContextCtor) return;
    if (!audioCtx) audioCtx = new AudioContextCtor();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {
    console.warn('[Audio] Não foi possível preparar o som:', e);
  }
}

function playSound(type = 'success') {
  try {
    if (!AudioContextCtor) return;
    if (!audioCtx) audioCtx = new AudioContextCtor();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      // Bipe agudo duplo — libera
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);          // A5
      osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.1); // D6
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else {
      // Som grave descendente — recusa
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    }
  } catch (e) {
    console.warn('[Audio] Não foi possível reproduzir som:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// ARRANQUE
// Todo listener é registrado UMA vez aqui. As telas (login → modo →
// scanner) só trocam de visibilidade. Registrar listener dentro da
// função que abre o scanner duplicaria o handler quando o porteiro
// refizesse o login sem recarregar a página.
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initLoginPortaria();
  initSelecaoModo();
  initControlesScanner();
  initManualForm();
  initCicloDeVida();
});

// ═══════════════════════════════════════════════════════════════
// 1. LOGIN DA EQUIPE
// A câmera só liga depois do login: sem conta com papel 'portaria' ou
// 'dono' o próprio banco recusa a validação.
// ═══════════════════════════════════════════════════════════════

function mostrarErroLogin(msg) {
  const erroBox = document.getElementById('portaria-erro');
  if (erroBox) {
    erroBox.textContent = msg;
    erroBox.style.display = 'block';
  } else {
    alert(msg);
  }
}

function initLoginPortaria() {
  const form = document.getElementById('form-portaria-login');
  const btn = document.getElementById('btn-portaria-entrar');
  const erroBox = document.getElementById('portaria-erro');

  const soltarBotao = () => {
    if (btn) { btn.disabled = false; btn.textContent = 'Liberar Scanner →'; }
  };

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (erroBox) erroBox.style.display = 'none';
      if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }

      const email = document.getElementById('port-email').value;
      const senha = document.getElementById('port-senha').value;

      try {
        const r = await window.AuraAuth.entrar(email, senha);
        if (r && r.ok) {
          if (r.papel !== 'portaria' && r.papel !== 'dono') {
            await window.AuraAuth.sair();
            soltarBotao();
            mostrarErroLogin('Esta conta não tem acesso à portaria.');
            return;
          }
          soltarBotao();
          document.getElementById('port-senha').value = '';
          operadorAtual = r.email || 'PORTARIA';
          emailSessao = r.email || '';

          // Sessão caiu no meio da fila: volta direto para o scanner,
          // no mesmo modo que o porteiro já estava usando.
          if (modoPendente) {
            modoOperacao = modoPendente;
            modoPendente = null;
            prepararAudio();
            abrirScanner(emailSessao);
          } else {
            abrirSelecaoModo();
          }
          return;
        }
        soltarBotao();
        mostrarErroLogin((r && r.mensagem) || 'E-mail ou senha incorretos.');
        return;
      } catch (err) {
        console.warn('[Portaria] Erro na autenticação:', err);
      }

      soltarBotao();
      mostrarErroLogin('E-mail ou senha incorretos.');
    });
  }

  const btnSair = document.getElementById('btn-portaria-sair');
  if (btnSair) {
    btnSair.addEventListener('click', async () => {
      btnSair.disabled = true;
      // Para a câmera e mata os intervalos ANTES de sair: recarregar com
      // a câmera viva deixa a lanterna acesa e o timer batendo no banco.
      await pararScanner();
      try { await window.AuraAuth.sair(); } catch (e) {}
      window.location.reload();
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. SELEÇÃO DE MODO
// ═══════════════════════════════════════════════════════════════

function initSelecaoModo() {
  const btnPortaria = document.getElementById('btn-modo-portaria');
  const btnBar = document.getElementById('btn-modo-bar');
  const btnAdmin = document.getElementById('btn-modo-admin');

  if (btnPortaria) {
    btnPortaria.addEventListener('click', () => {
      modoOperacao = 'PORTARIA';
      prepararAudio(); // dentro do gesto do usuário
      abrirScanner(emailSessao);
    });
  }
  if (btnBar) {
    btnBar.addEventListener('click', () => {
      modoOperacao = 'BAR';
      prepararAudio();
      abrirScanner(emailSessao);
    });
  }
  if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
      window.location.href = 'admin.html';
    });
  }
}

function abrirSelecaoModo() {
  const login = document.getElementById('portaria-login');
  const selecao = document.getElementById('portaria-modo-selecao');
  const scanner = document.getElementById('portaria-scanner');

  if (login) login.style.display = 'none';
  if (scanner) scanner.style.display = 'none';
  if (selecao) selecao.style.display = 'flex';
}

function abrirScanner(email) {
  const login = document.getElementById('portaria-login');
  const selecao = document.getElementById('portaria-modo-selecao');
  const scanner = document.getElementById('portaria-scanner');
  const quem = document.getElementById('port-sessao-email');
  const headerTitle = document.getElementById('header-modo-title');

  if (login) login.style.display = 'none';
  if (selecao) selecao.style.display = 'none';
  if (scanner) scanner.style.display = 'flex';
  if (quem) quem.textContent = email || '';

  if (headerTitle) {
    headerTitle.textContent = modoOperacao === 'BAR' ? '• MODO BAR' : '• CHECK-IN PORTARIA';
    headerTitle.style.color = modoOperacao === 'BAR' ? '#00F0FF' : '#8A9099';
  }

  resetForNextScan();
  atualizarPlacar();
  iniciarPlacarPeriodico();
  iniciarCamera();
}

/**
 * Sessão expirada no meio da fila. Devolve para o login guardando o modo,
 * para o porteiro voltar direto ao scanner depois de reautenticar.
 */
async function voltarParaLogin(mensagem) {
  modoPendente = modoOperacao;
  await pararScanner();

  const login = document.getElementById('portaria-login');
  const selecao = document.getElementById('portaria-modo-selecao');
  const scanner = document.getElementById('portaria-scanner');

  if (scanner) scanner.style.display = 'none';
  if (selecao) selecao.style.display = 'none';
  if (login) login.style.display = 'flex';

  try { await window.AuraAuth.sair(); } catch (e) {}

  mostrarErroLogin(mensagem || 'Sua sessão expirou. Entre de novo para continuar validando.');

  const campoSenha = document.getElementById('port-senha');
  if (campoSenha) campoSenha.value = '';
  const campoEmail = document.getElementById('port-email');
  if (campoEmail && !campoEmail.value) { try { campoEmail.focus(); } catch (e) {} }
  else if (campoSenha) { try { campoSenha.focus(); } catch (e) {} }
}

// ═══════════════════════════════════════════════════════════════
// 3. PLACAR
// O banco resolve o show ativo sozinho quando não recebe id.
// ═══════════════════════════════════════════════════════════════

function marcarPlacarDesatualizado(ligado, texto) {
  const aviso = document.getElementById('stat-aviso');
  if (!aviso) return;
  if (ligado) {
    aviso.textContent = texto || 'Placar desatualizado — sem resposta do servidor.';
    aviso.style.display = 'block';
  } else {
    aviso.textContent = '';
    aviso.style.display = 'none';
  }
}

async function atualizarPlacar() {
  if (!window.AuraDB) return;

  let resumo = null;
  try {
    resumo = await window.AuraDB.fetchResumoPortaria();
  } catch (e) {
    console.warn('[Portaria] Falha ao atualizar placar:', e);
  }

  // Falha (sessão caiu, sem internet) devolve objeto SEM `ok`. Nesse caso
  // os números antigos ficam onde estão: zerar o placar na cara do porteiro
  // faria ele achar que o evento inteiro sumiu.
  if (!resumo || resumo.ok !== true) {
    marcarPlacarDesatualizado(true);
    return;
  }

  marcarPlacarDesatualizado(false);

  const elTotal = document.getElementById('stat-total');
  const elVal = document.getElementById('stat-validados');
  const elRest = document.getElementById('stat-restantes');
  const elAgu = document.getElementById('stat-aguardando');

  if (elTotal) elTotal.textContent = String(resumo.total ?? 0);
  if (elVal) elVal.textContent = String(resumo.validados ?? 0);
  if (elRest) elRest.textContent = String(resumo.restantes ?? 0);
  if (elAgu) elAgu.textContent = String(resumo.aguardando_pagamento ?? 0);
}

function iniciarPlacarPeriodico() {
  pararPlacarPeriodico();
  placarTimer = setInterval(() => {
    // Aba escondida = celular no bolso. Não gasta bateria nem chamada.
    if (document.hidden) return;
    atualizarPlacar();
  }, INTERVALO_PLACAR);
}

function pararPlacarPeriodico() {
  if (placarTimer) {
    clearInterval(placarTimer);
    placarTimer = null;
  }
}

function initCicloDeVida() {
  document.addEventListener('visibilitychange', () => {
    // Voltou para a tela: o placar pode estar minutos atrasado.
    if (!document.hidden && placarTimer) atualizarPlacar();
  });
  // Fechou a aba / trocou de página: nada de timer órfão.
  window.addEventListener('pagehide', () => { pararPlacarPeriodico(); });
}

// ═══════════════════════════════════════════════════════════════
// 4. CÂMERA
// ═══════════════════════════════════════════════════════════════

function destacarEntradaManual(motivo) {
  const card = document.getElementById('manual-entry-card');
  const aviso = document.getElementById('manual-aviso');
  if (card) card.classList.add('manual-destaque');
  if (aviso) {
    aviso.textContent = motivo || 'A câmera não abriu. Digite o código do ingresso aqui.';
    aviso.style.display = 'block';
  }
  const input = document.getElementById('manual-code-input');
  if (input) { try { input.focus(); } catch (e) {} }
}

function limparDestaqueEntradaManual() {
  const card = document.getElementById('manual-entry-card');
  const aviso = document.getElementById('manual-aviso');
  if (card) card.classList.remove('manual-destaque');
  if (aviso) { aviso.textContent = ''; aviso.style.display = 'none'; }
}

function iniciarCamera() {
  if (typeof Html5Qrcode === 'undefined') {
    destacarEntradaManual('A biblioteca do leitor de QR não carregou. Use a digitação manual.');
    showResultCard('warning', '📷', 'LEITOR INDISPONÍVEL',
      'O leitor de QR não carregou (sem internet?). Digite o código do ingresso no campo abaixo.');
    return;
  }

  if (!html5QrCode) {
    try {
      html5QrCode = new Html5Qrcode('reader');
    } catch (e) {
      console.warn('[Camera] Falha ao criar o leitor:', e);
      destacarEntradaManual('Não foi possível iniciar o leitor. Use a digitação manual.');
      return;
    }
  }

  Html5Qrcode.getCameras().then((cameras) => {
    if (cameras && cameras.length > 0) {
      availableCameras = cameras;
      // Câmera traseira por padrão
      const traseira = cameras.findIndex((c) => {
        const nome = (c.label || '').toLowerCase();
        return nome.includes('back') || nome.includes('traseira') || nome.includes('environment');
      });
      currentCameraIndex = traseira !== -1 ? traseira : 0;
      startScanner(availableCameras[currentCameraIndex].id);
    } else {
      destacarEntradaManual('Nenhuma câmera encontrada neste aparelho.');
      showResultCard('warning', '⚠️', 'CÂMERA NÃO DETECTADA',
        'Nenhuma câmera encontrada. Use a digitação manual em destaque abaixo.');
    }
  }).catch((err) => {
    console.warn('[Camera] Erro ao acessar a câmera:', err);
    destacarEntradaManual('Permissão de câmera negada. Digite o código aqui enquanto isso.');
    showResultCard('warning', '📷', 'PERMISSÃO DE CÂMERA',
      'Permita o acesso à câmera nas configurações do navegador, ou use a digitação manual abaixo.');
  });
}

function startScanner(cameraId) {
  if (!html5QrCode) return;

  const qrConfig = {
    fps: 15,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  };

  html5QrCode.start(
    cameraId,
    qrConfig,
    onQrCodeSuccess,
    () => {} // frame sem QR não é erro
  ).then(() => {
    cameraViva = true;
    isScanning = true;
    limparDestaqueEntradaManual();
  }).catch((err) => {
    console.warn('[Scanner] Falha ao iniciar:', err);
    cameraViva = false;
    isScanning = false;
    destacarEntradaManual('A câmera não abriu. Digite o código do ingresso aqui.');
    showResultCard('warning', '📷', 'CÂMERA NÃO ABRIU',
      'Não foi possível ligar a câmera. Use a digitação manual em destaque abaixo.');
  });
}

async function pausarScanner() {
  try {
    if (html5QrCode && html5QrCode.isScanning) await html5QrCode.pause(true);
  } catch (e) {}
}

/** Para de vez: câmera desligada, placar sem timer, leitor descartado. */
async function pararScanner() {
  pararPlacarPeriodico();
  isScanning = false;
  cameraViva = false;

  if (html5QrCode) {
    try {
      if (html5QrCode.isScanning) await html5QrCode.stop();
    } catch (e) {
      console.warn('[Scanner] Falha ao parar a câmera:', e);
    }
    try { html5QrCode.clear(); } catch (e) {}
    html5QrCode = null;
  }
  isFlashOn = false;
  const btnFlash = document.getElementById('btn-toggle-flash');
  if (btnFlash) {
    btnFlash.style.removeProperty('border-color');
    btnFlash.style.removeProperty('color');
  }
}

function initControlesScanner() {
  // Alternar câmera — stop() devolve Promise; sem .catch() o scanner
  // morria em silêncio quando a troca falhava.
  const btnToggleCam = document.getElementById('btn-toggle-camera');
  if (btnToggleCam) {
    btnToggleCam.addEventListener('click', () => {
      if (!html5QrCode || availableCameras.length < 2) {
        destacarEntradaManual('Este aparelho só tem uma câmera disponível.');
        return;
      }
      currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
      const proxima = availableCameras[currentCameraIndex].id;

      if (html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => startScanner(proxima))
          .catch((err) => {
            console.warn('[Camera] Falha ao trocar de câmera:', err);
            showResultCard('warning', '🔄', 'NÃO TROCOU DE CÂMERA',
              'A câmera atual não desligou. Use a digitação manual ou recarregue a página.');
            destacarEntradaManual('A troca de câmera falhou. Digite o código aqui.');
          });
      } else {
        startScanner(proxima);
      }
    });
  }

  // Lanterna — applyVideoConstraints é assíncrona: try/catch não pegava
  // a recusa do aparelho, e o botão acendia sem a luz acender.
  const btnFlash = document.getElementById('btn-toggle-flash');
  if (btnFlash) {
    btnFlash.addEventListener('click', () => {
      if (!html5QrCode || !html5QrCode.isScanning) {
        destacarEntradaManual('A lanterna só funciona com a câmera ligada.');
        return;
      }
      const alvo = !isFlashOn;
      let promessa = null;
      try {
        promessa = html5QrCode.applyVideoConstraints({ advanced: [{ torch: alvo }] });
      } catch (e) {
        promessa = Promise.reject(e);
      }
      Promise.resolve(promessa).then(() => {
        isFlashOn = alvo;
        btnFlash.style.borderColor = isFlashOn ? '#FFC24A' : '';
        btnFlash.style.color = isFlashOn ? '#FFC24A' : '';
      }).catch((err) => {
        console.warn('[Flash] Não suportado:', err);
        isFlashOn = false;
        btnFlash.style.removeProperty('border-color');
        btnFlash.style.removeProperty('color');
        showResultCard('warning', '🔦', 'SEM LANTERNA',
          'Este aparelho não deixa o navegador acender a lanterna. Aponte para um lugar mais claro.');
      });
    });
  }

  // Próximo ingresso
  const btnNext = document.getElementById('btn-next-scan');
  if (btnNext) {
    btnNext.addEventListener('click', () => { resetForNextScan(); });
  }

  // Refazer login (aparece só quando o banco devolve SEM_PERMISSAO)
  const btnRelogin = document.getElementById('btn-relogin');
  if (btnRelogin) {
    btnRelogin.addEventListener('click', () => {
      voltarParaLogin('Sua sessão expirou. Entre de novo para voltar ao scanner.');
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. CÓDIGO DO INGRESSO
// Formato AURA-XXXXX-XXXXX, alfabeto 23456789ABCDEFGHJKLMNPQRSTUVWXYZ
// (sem 0/O/1/I, justamente para não confundir na digitação).
// ═══════════════════════════════════════════════════════════════

/**
 * Deixa maiúsculo, tira espaço e pontuação solta e recoloca os hífens.
 * Aceita `k2m9p4txwe`, `K2M9P 4TXWE`, `aura-k2m9p-4txwe` e `AURAK2M9P4TXWE`.
 * O banco já compara em maiúsculas — normalizar aqui evita que a tela
 * diga "não encontrado" só por causa de uma minúscula.
 */
function normalizarCodigoIngresso(bruto) {
  const limpo = String(bruto == null ? '' : bruto)
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');

  const semHifen = limpo.replace(/-/g, '');
  const semPrefixo = semHifen.replace(/^AURA/, '');

  // Testa o texto cru antes de tirar o "AURA": o miolo pode legitimamente
  // começar com A-U-R-A, que são letras do alfabeto do código.
  const miolo = /^[A-Z0-9]{10}$/.test(semHifen)
    ? semHifen
    : (/^[A-Z0-9]{10}$/.test(semPrefixo) ? semPrefixo : null);

  if (miolo) return `AURA-${miolo.slice(0, 5)}-${miolo.slice(5)}`;
  return limpo;
}

// ═══════════════════════════════════════════════════════════════
// 6. LEITURA E VALIDAÇÃO
// ═══════════════════════════════════════════════════════════════

function onQrCodeSuccess(decodedText) {
  if (!isScanning) return;
  isScanning = false;
  validarCodigo(decodedText);
}

async function validarCodigo(bruto) {
  if (validando) return;
  validando = true;
  isScanning = false;

  await pausarScanner();
  try {
    await processarValidacao(bruto);
  } catch (e) {
    console.error('[Portaria] Erro inesperado na validação:', e);
    playSound('error');
    showResultCard('error', '⚠️', 'FALHA NA VALIDAÇÃO',
      'Algo deu errado ao falar com o servidor. Tente bipar de novo.');
  } finally {
    validando = false;
  }
}

async function processarValidacao(codigoBruto) {
  const codigo = normalizarCodigoIngresso(codigoBruto);

  if (!window.AuraDB) {
    playSound('error');
    showResultCard('error', '⚠️', 'SISTEMA OFFLINE',
      'A camada de dados não carregou. Recarregue a página.');
    return;
  }

  if (!codigo) {
    playSound('error');
    showResultCard('warning', '❓', 'CÓDIGO VAZIO',
      'O QR veio ilegível. Bipe de novo ou digite o código à mão.');
    return;
  }

  if (modoOperacao === 'BAR') {
    await processarBar(codigo);
  } else {
    await processarPortaria(codigo);
  }

  atualizarPlacar();
}

/** Motivos: LIBERADO, SEM_PERMISSAO, CODIGO_VAZIO, NAO_ENCONTRADO,
 *  CANCELADO, EXPIRADO, NAO_PAGO, JA_UTILIZADO. */
async function processarPortaria(codigo) {
  const res = await window.AuraDB.validarIngressoPortaria(codigo, operadorAtual) || {};

  if (res.sucesso === true) {
    playSound('success');
    showResultCard('success', '✓', 'ENTRADA AUTORIZADA',
      res.mensagem || 'Ingresso validado com sucesso.', res.ingresso);
    return;
  }

  playSound('error');
  const msg = res.mensagem || '';

  switch (res.motivo) {
    case 'SEM_PERMISSAO':
      showResultCard('warning', '🔒', 'SESSÃO EXPIRADA',
        'A portaria perdeu o acesso ao sistema. Entre de novo para continuar validando.',
        null, { relogin: true });
      break;

    case 'CODIGO_VAZIO':
      showResultCard('warning', '❓', 'CÓDIGO ILEGÍVEL',
        msg || 'O QR não foi lido. Bipe de novo ou digite o código à mão.');
      break;

    case 'NAO_ENCONTRADO':
      showResultCard('error', '🚫', 'INGRESSO NÃO EXISTE',
        (msg || 'Este código não está no sistema.') + ' Confira a digitação antes de recusar.',
        { codigo_validador: codigo, titular_nome: 'Não identificado', setor: '—' });
      break;

    case 'CANCELADO':
      // Antes caía em NAO_PAGO e o porteiro lia "pagamento ainda não
      // confirmado" — dava para achar que era PIX atrasado e liberar.
      showResultCard('error', '⛔', 'NÃO LIBERAR A ENTRADA',
        msg || 'Ingresso cancelado ou estornado. Não liberar a entrada.', res.ingresso);
      break;

    case 'EXPIRADO':
      // Diferente de NAO_PAGO: aqui a vaga já voltou para o lote.
      showResultCard('warning', '⏰', 'PRAZO VENCIDO — CHAMAR O RESPONSÁVEL',
        msg || 'O prazo de pagamento venceu e a reserva caiu. Chame o responsável antes de liberar.',
        res.ingresso);
      break;

    case 'NAO_PAGO':
      showResultCard('warning', '⏳', 'PAGAMENTO NÃO CONFIRMADO',
        msg || 'O pagamento deste pedido ainda não foi confirmado. Chame o responsável.',
        res.ingresso);
      break;

    case 'JA_UTILIZADO':
      showResultCard('error', '⛔', 'INGRESSO JÁ UTILIZADO',
        msg || 'Este ingresso já passou na portaria.', res.ingresso);
      break;

    case 'SEM_CONEXAO':
      showResultCard('warning', '📡', 'SEM CONEXÃO',
        msg || 'Sem internet. Não dá para validar agora — chame o responsável.');
      break;

    default:
      showResultCard('error', '⚠️', 'NÃO FOI POSSÍVEL VALIDAR',
        msg || 'O servidor recusou a validação. Chame o responsável.',
        res.ingresso || null);
  }
}

/** Motivos: LIBERADO, SEM_PERMISSAO, NAO_ENCONTRADO, SEM_COMBO,
 *  NAO_PAGO, NAO_ENTROU, JA_RESGATADO. */
async function processarBar(codigo) {
  const res = await window.AuraDB.validarComboBar(codigo, operadorAtual) || {};

  if (res.sucesso === true) {
    playSound('success');
    showResultCard('success', '🍾', 'COMBO LIBERADO',
      'Entregue exatamente o que está escrito abaixo.', res.ingresso);
    return;
  }

  playSound('error');
  const msg = res.mensagem || '';

  switch (res.motivo) {
    case 'SEM_PERMISSAO':
      showResultCard('warning', '🔒', 'SESSÃO EXPIRADA',
        'O bar perdeu o acesso ao sistema. Entre de novo para continuar resgatando.',
        null, { relogin: true });
      break;

    case 'NAO_ENCONTRADO':
      showResultCard('error', '🚫', 'INGRESSO NÃO EXISTE',
        (msg || 'Este código não está no sistema.') + ' Confira a digitação.',
        { codigo_validador: codigo, titular_nome: 'Não identificado', setor: '—' });
      break;

    case 'SEM_COMBO':
      showResultCard('warning', '🥤', 'SEM COMBO • ENTRADA SIMPLES',
        msg || 'Este ingresso é só entrada, não tem bebida inclusa.');
      break;

    case 'NAO_PAGO':
      // Pedido não aprovado — não entregar bebida.
      showResultCard('error', '⛔', 'NÃO ENTREGAR • PEDIDO NÃO APROVADO',
        msg || 'O pedido deste combo não está aprovado. Chame o responsável.');
      break;

    case 'NAO_ENTROU':
      showResultCard('error', '🛑', 'CLIENTE NÃO PASSOU NA PORTARIA',
        msg || 'O ingresso ainda não foi validado na entrada. Mande passar na portaria primeiro.');
      break;

    case 'JA_RESGATADO':
      showResultCard('error', '⛔', 'COMBO JÁ RESGATADO',
        msg || 'Este combo já foi entregue.');
      break;

    case 'SEM_CONEXAO':
      showResultCard('warning', '📡', 'SEM CONEXÃO',
        msg || 'Sem internet. Não dá para resgatar agora — chame o responsável.');
      break;

    default:
      showResultCard('error', '⚠️', 'NÃO FOI POSSÍVEL RESGATAR',
        msg || 'O servidor recusou o resgate. Chame o responsável.');
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. COMBO
// Chega pronto do banco em `ingresso.combo`. A cor vem em `card_cor`
// e é aplicada por variável CSS — nada de mapear classe fixa, senão
// combo novo cadastrado no admin aparece sem cor nenhuma.
// ═══════════════════════════════════════════════════════════════

const COR_COMBO_PADRAO = '#00F0FF';

/** Só aceita hexadecimal de 6 dígitos: `card_cor` é dado do banco e vai
 *  parar dentro de uma propriedade de estilo. */
function corDoCombo(combo) {
  const hex = (combo && typeof combo.card_cor === 'string') ? combo.card_cor.trim() : '';
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : COR_COMBO_PADRAO;
}

function hexParaRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function pintarComCor(el, cor) {
  el.style.setProperty('--combo-cor', cor);
  el.style.setProperty('--combo-fundo', hexParaRgba(cor, 0.22));
  el.style.setProperty('--combo-brilho', hexParaRgba(cor, 0.42));
}

/** Modo BAR: letra grande com o card e o produto, para o garçom entregar
 *  sem precisar perguntar nada ao cliente. */
function montarCaixaComboBar(ingresso) {
  const combo = ingresso && ingresso.combo;
  if (!combo) return null;

  const cor = corDoCombo(combo);
  const box = document.createElement('div');
  box.className = 'combo-box-bar';
  pintarComCor(box, cor);

  const topo = document.createElement('div');
  topo.className = 'combo-box-topo font-mono';
  topo.textContent = '🚨 ENTREGAR AGORA';
  box.appendChild(topo);

  if (combo.card_nome) {
    const card = document.createElement('div');
    card.className = 'combo-box-card font-mono';
    card.textContent = combo.card_nome;
    box.appendChild(card);
  }

  const titulo = document.createElement('div');
  titulo.className = 'combo-box-titulo';
  titulo.textContent = combo.titulo || 'Combo do cliente';
  box.appendChild(titulo);

  if (combo.descricao) {
    const desc = document.createElement('div');
    desc.className = 'combo-box-desc';
    desc.textContent = combo.descricao;
    box.appendChild(desc);
  }

  const rodape = document.createElement('div');
  rodape.className = 'combo-box-rodape font-mono';
  rodape.textContent = '✓ Resgate registrado. Pode entregar ao cliente.';
  box.appendChild(rodape);

  return box;
}

/** Modo PORTARIA: aviso curto para direcionar o cliente ao bar. */
function montarAvisoComboPortaria(ingresso) {
  const combo = ingresso && ingresso.combo;

  if (!combo) {
    const simples = document.createElement('div');
    simples.className = 'portaria-no-combo-badge font-mono';
    simples.textContent = '✓ ENTRADA SIMPLES • SEM COMBO';
    return simples;
  }

  const resgatado = ingresso.combo_status === 'RESGATADO';
  const cor = resgatado ? '#8A9099' : corDoCombo(combo);

  const box = document.createElement('div');
  box.className = resgatado
    ? 'combo-aviso-portaria combo-aviso-resgatado font-mono'
    : 'combo-aviso-portaria font-mono';
  pintarComCor(box, cor);

  const linha1 = document.createElement('div');
  linha1.className = 'combo-aviso-linha1';
  linha1.textContent = resgatado
    ? '✓ COMBO JÁ RETIRADO NO BAR'
    : '🍸 CLIENTE TEM COMBO — DIRECIONAR AO BAR';
  box.appendChild(linha1);

  const linha2 = document.createElement('div');
  linha2.className = 'combo-aviso-linha2';
  const partes = [];
  if (combo.card_nome) partes.push(combo.card_nome);
  if (combo.titulo) partes.push(combo.titulo);
  linha2.textContent = partes.length ? partes.join(' • ') : 'Combo incluso no ingresso';
  box.appendChild(linha2);

  return box;
}

// ═══════════════════════════════════════════════════════════════
// 8. CARD DE RESULTADO
// A visibilidade é controlada pela classe `status-*`, nunca por
// style.display inline: estilo inline vence a folha e travava o card
// invisível da segunda leitura em diante.
// ═══════════════════════════════════════════════════════════════

function limparFilho(el) {
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
}

function showResultCard(tipo, icone, titulo, mensagem, ingresso = null, opcoes = {}) {
  const card = document.getElementById('result-card');
  if (!card) return;

  const elIcon = document.getElementById('result-icon');
  const elTitle = document.getElementById('result-title');
  const elMsg = document.getElementById('result-msg');
  const elDetails = document.getElementById('result-details');
  const comboAlert = document.getElementById('portaria-combo-alert');
  const btnNext = document.getElementById('btn-next-scan');
  const btnRelogin = document.getElementById('btn-relogin');

  const detNome = document.getElementById('det-nome');
  const detSetor = document.getElementById('det-setor');
  const detCodigo = document.getElementById('det-codigo');

  card.className = `result-card status-${tipo}`;
  card.style.removeProperty('display');

  if (elIcon) elIcon.textContent = icone;
  if (elTitle) elTitle.textContent = titulo;
  if (elMsg) elMsg.textContent = mensagem || '';

  limparFilho(comboAlert);

  if (ingresso) {
    if (elDetails) elDetails.style.display = 'block';
    if (detNome) detNome.textContent = ingresso.titular_nome || '—';
    if (detSetor) detSetor.textContent = String(ingresso.setor || '—').toUpperCase();
    if (detCodigo) detCodigo.textContent = ingresso.codigo_validador || '—';

    if (comboAlert) {
      let aviso = null;
      if (modoOperacao === 'BAR') {
        // No bar o combo só aparece quando o resgate foi liberado —
        // mostrar bebida em tela de recusa faria o garçom entregar errado.
        if (tipo === 'success') aviso = montarCaixaComboBar(ingresso);
      } else if (tipo === 'success') {
        aviso = montarAvisoComboPortaria(ingresso);
      } else if (ingresso.combo) {
        // Recusa com combo: o porteiro precisa saber que tem bebida em jogo
        // antes de mandar o cliente para o responsável.
        aviso = montarAvisoComboPortaria(ingresso);
      }
      if (aviso) comboAlert.appendChild(aviso);
    }
  } else {
    if (elDetails) elDetails.style.display = 'none';
  }

  // O botão de refazer login substitui o "Próximo Ingresso": com a sessão
  // caída não adianta bipar de novo.
  const precisaRelogin = opcoes.relogin === true;
  if (btnRelogin) btnRelogin.hidden = !precisaRelogin;
  if (btnNext) btnNext.hidden = precisaRelogin;

  if (precisaRelogin) {
    // Para a câmera: sem sessão, cada leitura seria mais uma recusa.
    pararScanner();
  }

  try {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) {}
}

function resetForNextScan() {
  const card = document.getElementById('result-card');
  const comboAlert = document.getElementById('portaria-combo-alert');
  const btnRelogin = document.getElementById('btn-relogin');
  const btnNext = document.getElementById('btn-next-scan');

  if (card) {
    card.className = 'result-card';
    card.style.removeProperty('display');
  }
  limparFilho(comboAlert);
  if (btnRelogin) btnRelogin.hidden = true;
  if (btnNext) btnNext.hidden = false;

  isScanning = true;
  try {
    if (html5QrCode && html5QrCode.isScanning) html5QrCode.resume();
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════
// 9. ENTRADA MANUAL — o plano B com fila esperando
// ═══════════════════════════════════════════════════════════════

function initManualForm() {
  const form = document.getElementById('form-manual-val');
  const input = document.getElementById('manual-code-input');

  if (input) {
    // Normaliza enquanto digita: maiúsculas e hífens no lugar certo.
    input.addEventListener('blur', () => {
      const formatado = normalizarCodigoIngresso(input.value);
      if (formatado) input.value = formatado;
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!input) return;

      const codigo = normalizarCodigoIngresso(input.value);
      if (!codigo) {
        showResultCard('warning', '❓', 'DIGITE O CÓDIGO',
          'O campo está vazio. O código fica embaixo do QR do ingresso.');
        return;
      }

      input.value = '';
      try { input.blur(); } catch (err) {}
      await validarCodigo(codigo);
    });
  }
}
