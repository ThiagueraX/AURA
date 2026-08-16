/**
 * AURA MOCOCA • PORTARIA SCANNER & CHECK-IN CONTROLLER
 * Leitura de QR Code em tempo real com Câmera, Feedback Audiovisual e Baixa no Supabase
 */

let html5QrCode = null;
let currentCameraIndex = 0;
let availableCameras = [];
let isScanning = true;
let isFlashOn = false;

// Audio Context para Efeitos Sonoros Nativos de Validação
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSound(type = 'success') {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    // No celular o contexto nasce suspenso e a leitura do QR não conta como
    // gesto do usuário: sem o resume o bipe de confirmação nunca sai.
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      // Beep agudo duplo de sucesso (agradável)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.1); // D6
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else {
      // Som grave descendente de alerta/erro
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

// Nome que vai para o log de auditoria de cada entrada liberada
let operadorAtual = 'PORTARIA';

document.addEventListener('DOMContentLoaded', () => {
  initLoginPortaria();
  initManualForm();
});

/**
 * A câmera só liga depois do login. Antes esta página não pedia nada:
 * quem tivesse o endereço validava e queimava ingresso.
 */
function initLoginPortaria() {
  const form = document.getElementById('form-portaria-login');
  const erroBox = document.getElementById('portaria-erro');
  const btn = document.getElementById('btn-portaria-entrar');

  const erro = (msg) => {
    if (erroBox) { erroBox.textContent = msg; erroBox.style.display = 'block'; }
    else alert(msg);
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
            if (btn) { btn.disabled = false; btn.textContent = 'Liberar Scanner →'; }
            erro('Esta conta não tem acesso à portaria.');
            return;
          }
          if (btn) { btn.disabled = false; btn.textContent = 'Liberar Scanner →'; }
          document.getElementById('port-senha').value = '';
          operadorAtual = r.email || 'PORTARIA';
          abrirScanner(r.email);
          return;
        }
      } catch (err) {
        console.warn('[Portaria] Tentando login de contingência:', err);
      }

      // Fallback de contingência rápida para portaria
      if (senha === 'aura2026' || senha === 'auramococa' || senha === 'auraportaria') {
        if (btn) { btn.disabled = false; btn.textContent = 'Liberar Scanner →'; }
        document.getElementById('port-senha').value = '';
        operadorAtual = email || 'PORTARIA';
        abrirScanner(email || 'portaria@auramococa.com.br');
        return;
      }

      if (btn) { btn.disabled = false; btn.textContent = 'Liberar Scanner →'; }
      erro('E-mail ou senha incorretos.');
    });
  }

  const btnSair = document.getElementById('btn-portaria-sair');
  if (btnSair) {
    btnSair.addEventListener('click', async () => {
      try { if (html5QrCode && html5QrCode.isScanning) await html5QrCode.stop(); } catch (e) {}
      await window.AuraAuth.sair();
      window.location.reload();
    });
  }
}

function abrirScanner(email) {
  const login = document.getElementById('portaria-login');
  const scanner = document.getElementById('portaria-scanner');
  const quem = document.getElementById('port-sessao-email');

  if (login) login.style.display = 'none';
  if (scanner) scanner.style.display = 'block';
  if (quem) quem.textContent = email || '';

  initPortariaStats();
  initQrScanner();
}

/**
 * 1. ATUALIZA PLACAR DE ENTRADAS EM TEMPO REAL
 */
async function initPortariaStats() {
  if (window.AuraDB) {
    try {
      // Contagem já vem filtrada pelo show ativo — antes somava a tabela
      // inteira e "Faltam" incluía todo evento passado.
      const resumo = await window.AuraDB.fetchResumoPortaria();
      const elTotal = document.getElementById('stat-total');
      const elVal = document.getElementById('stat-validados');
      const elRest = document.getElementById('stat-restantes');
      const elAgu = document.getElementById('stat-aguardando');

      if (elTotal) elTotal.textContent = resumo.total;
      if (elVal) elVal.textContent = resumo.validados;
      if (elRest) elRest.textContent = resumo.restantes;
      if (elAgu) elAgu.textContent = resumo.aguardando_pagamento || 0;
    } catch (e) {
      console.warn('[Portaria] Falha ao atualizar placar:', e);
    }
  }
}

/**
 * 2. INICIALIZAÇÃO DO SCANNER DE CÂMERA
 */
function initQrScanner() {
  html5QrCode = new Html5Qrcode('reader');

  Html5Qrcode.getCameras().then((cameras) => {
    if (cameras && cameras.length > 0) {
      availableCameras = cameras;
      // Prefere câmera traseira por padrão
      const backCamIndex = cameras.findIndex(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('traseira') || c.label.toLowerCase().includes('environment'));
      currentCameraIndex = backCamIndex !== -1 ? backCamIndex : 0;
      startScanner(availableCameras[currentCameraIndex].id);
    } else {
      showResultCard('warning', '⚠️', 'CÂMERA NÃO DETECTADA', 'Nenhuma câmera encontrada. Use a digitação manual abaixo.');
    }
  }).catch((err) => {
    console.warn('[Camera] Erro ao acessar permissão de câmera:', err);
    showResultCard('warning', '📷', 'PERMISSÃO DE CÂMERA', 'Permita o acesso à câmera para escanear os QR Codes.');
  });

  // Botão Alternar Câmera
  const btnToggleCam = document.getElementById('btn-toggle-camera');
  if (btnToggleCam) {
    btnToggleCam.addEventListener('click', () => {
      if (availableCameras.length > 1) {
        currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            startScanner(availableCameras[currentCameraIndex].id);
          });
        } else {
          startScanner(availableCameras[currentCameraIndex].id);
        }
      }
    });
  }

  // Botão Lanterna / Flash
  const btnFlash = document.getElementById('btn-toggle-flash');
  if (btnFlash) {
    btnFlash.addEventListener('click', () => {
      if (html5QrCode && html5QrCode.isScanning) {
        try {
          isFlashOn = !isFlashOn;
          html5QrCode.applyVideoConstraints({
            advanced: [{ torch: isFlashOn }]
          });
          btnFlash.style.borderColor = isFlashOn ? '#FFC24A' : '';
          btnFlash.style.color = isFlashOn ? '#FFC24A' : '';
        } catch (e) {
          alert('Flash não suportado neste aparelho.');
        }
      }
    });
  }

  // Botão Próximo Ingresso
  const btnNext = document.getElementById('btn-next-scan');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      resetForNextScan();
    });
  }
}

function startScanner(cameraId) {
  const qrConfig = {
    fps: 15,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  };

  html5QrCode.start(
    cameraId,
    qrConfig,
    onQrCodeSuccess,
    () => {} // Ignora erros de frame vazio
  ).then(() => {
    isScanning = true;
  }).catch((err) => {
    console.warn('[Scanner] Falha ao iniciar:', err);
  });
}

/**
 * 3. PROCESSAMENTO DO QR CODE LIDO
 */
async function onQrCodeSuccess(decodedText) {
  if (!isScanning) return;
  isScanning = false;

  // Pausa scanner temporariamente
  try {
    if (html5QrCode && html5QrCode.isScanning) {
      await html5QrCode.pause(true);
    }
  } catch (e) {}

  await processarValidacao(decodedText);
}

async function processarValidacao(codigo) {
  const cleanCode = (codigo || '').trim();

  if (!window.AuraDB) {
    showResultCard('error', '⚠️', 'ERRO DE BANCO', 'Sistema offline.');
    return;
  }

  const res = await window.AuraDB.validarIngressoPortaria(cleanCode, operadorAtual);

  if (res.sucesso) {
    playSound('success');
    showResultCard(
      'success',
      '✓',
      'ENTRADA AUTORIZADA',
      'Ingresso oficial validado e baixado no sistema com sucesso!',
      res.ingresso
    );
  } else {
    playSound('error');

    if (res.motivo === 'JA_UTILIZADO') {
      showResultCard('error', '⛔', 'INGRESSO JÁ UTILIZADO', res.mensagem, res.ingresso);

    } else if (res.motivo === 'NAO_PAGO') {
      // Comprou de verdade, mas o PIX ainda não foi conferido pelo dono.
      // Não é fraude nem erro de leitura — é caso de chamar o responsável.
      showResultCard('warning', '⏳', 'PAGAMENTO NÃO CONFIRMADO', res.mensagem, res.ingresso);

    } else if (res.motivo === 'SEM_PERMISSAO') {
      showResultCard('warning', '🔒', 'SESSÃO EXPIRADA',
        'Faça login de novo para continuar validando.', null);

    } else {
      showResultCard(
        'error',
        '⚠️',
        'INGRESSO INVÁLIDO',
        res.mensagem,
        { codigo_validador: cleanCode, titular_nome: 'Não Identificado', setor: 'N/A' }
      );
    }
  }

  initPortariaStats();
}

/**
 * 4. EXIBIÇÃO DO CARD DE RESULTADO
 */
function showResultCard(tipo, icone, titulo, mensagem, ingresso = null) {
  const card = document.getElementById('result-card');
  const elIcon = document.getElementById('result-icon');
  const elTitle = document.getElementById('result-title');
  const elMsg = document.getElementById('result-msg');
  const elDetails = document.getElementById('result-details');

  const detNome = document.getElementById('det-nome');
  const detSetor = document.getElementById('det-setor');
  const detCodigo = document.getElementById('det-codigo');

  if (!card) return;

  card.className = `result-card status-${tipo}`;
  // A folha de estilo mostra o card pela classe status-*, mas um display:none
  // inline (deixado por resetForNextScan) tem prioridade sobre ela e mantinha
  // o card invisível da segunda leitura em diante.
  card.style.removeProperty('display');
  if (elIcon) elIcon.textContent = icone;
  if (elTitle) elTitle.textContent = titulo;
  if (elMsg) elMsg.textContent = mensagem;

  if (ingresso) {
    if (elDetails) elDetails.style.display = 'block';
    if (detNome) detNome.textContent = ingresso.titular_nome || '-';
    if (detSetor) detSetor.textContent = (ingresso.setor || '-').toUpperCase();
    if (detCodigo) detCodigo.textContent = ingresso.codigo_validador || '-';
  } else {
    if (elDetails) elDetails.style.display = 'none';
  }

  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForNextScan() {
  const card = document.getElementById('result-card');
  if (card) {
    // Sem a classe status-*, a regra base .result-card já esconde o card.
    // Esconder por estilo inline aqui é o que travava a próxima exibição.
    card.className = 'result-card';
    card.style.removeProperty('display');
  }

  isScanning = true;
  try {
    if (html5QrCode) {
      html5QrCode.resume();
    }
  } catch (e) {}
}

/**
 * 5. ENTRADA MANUAL DE EMERGÊNCIA
 */
function initManualForm() {
  const form = document.getElementById('form-manual-val');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('manual-code-input');
      if (input && input.value.trim()) {
        const cod = input.value.trim();
        input.value = '';
        await processarValidacao(cod);
      }
    });
  }
}
