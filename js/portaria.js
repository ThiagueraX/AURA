/**
 * AURA MOCOCA • PORTARIA SCANNER & CHECK-IN CONTROLLER
 * Leitura de QR Code em tempo real com Câmera, Feedback Audiovisual e Baixa no Supabase
 */

let html5QrCode = null;
let currentCameraIndex = 0;
let availableCameras = [];
let isScanning = true;
let isFlashOn = false;
let modoOperacao = 'PORTARIA'; // 'PORTARIA' ou 'BAR'

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
          abrirSelecaoModo(r.email);
          return;
        }
      } catch (err) {
        console.warn('[Portaria] Erro na autenticacao:', err);
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

function abrirSelecaoModo(email) {
  const login = document.getElementById('portaria-login');
  const selecao = document.getElementById('portaria-modo-selecao');
  
  if (login) login.style.display = 'none';
  if (selecao) selecao.style.display = 'block';

  const btnPortaria = document.getElementById('btn-modo-portaria');
  const btnBar = document.getElementById('btn-modo-bar');

  if (btnPortaria) {
    btnPortaria.onclick = () => {
      modoOperacao = 'PORTARIA';
      abrirScanner(email);
    };
  }

  if (btnBar) {
    btnBar.onclick = () => {
      modoOperacao = 'BAR';
      abrirScanner(email);
    };
  }

  const btnAdmin = document.getElementById('btn-modo-admin');
  if (btnAdmin) {
    btnAdmin.onclick = () => {
      window.location.href = 'admin.html';
    };
  }
}

function abrirScanner(email) {
  const selecao = document.getElementById('portaria-modo-selecao');
  const scanner = document.getElementById('portaria-scanner');
  const quem = document.getElementById('port-sessao-email');
  const headerTitle = document.getElementById('header-modo-title');

  if (selecao) selecao.style.display = 'none';
  if (scanner) scanner.style.display = 'block';
  if (quem) quem.textContent = email || '';

  if (headerTitle) {
    headerTitle.textContent = modoOperacao === 'BAR' ? '• MODO BAR' : '• CHECK-IN PORTARIA';
    headerTitle.style.color = modoOperacao === 'BAR' ? '#00F0FF' : '#8A9099';
  }

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

  if (modoOperacao === 'PORTARIA') {
    const res = await window.AuraDB.validarIngressoPortaria(cleanCode, operadorAtual);

    if (res.sucesso) {
      playSound('success');
      showResultCard(
        'success',
        '✓',
        'ENTRADA AUTORIZADA',
        'Ingresso validado com sucesso.',
        res.ingresso
      );
    } else {
      playSound('error');
      if (res.motivo === 'JA_UTILIZADO') {
        showResultCard('error', '⛔', 'INGRESSO JÁ UTILIZADO', res.mensagem, res.ingresso);
      } else if (res.motivo === 'NAO_PAGO') {
        showResultCard('warning', '⏳', 'PAGAMENTO NÃO CONFIRMADO', res.mensagem, res.ingresso);
      } else if (res.motivo === 'SEM_PERMISSAO') {
        showResultCard('warning', '🔒', 'SESSÃO EXPIRADA', 'Faça login de novo para continuar validando.', null);
      } else {
        showResultCard('error', '⚠️', 'INGRESSO INVÁLIDO', res.mensagem, { codigo_validador: cleanCode, titular_nome: 'Não Identificado', setor: 'N/A' });
      }
    }
  } else if (modoOperacao === 'BAR') {
    const res = await window.AuraDB.validarComboBar(cleanCode, operadorAtual);

    if (res.sucesso) {
      playSound('success');
      showResultCard(
        'success',
        '🍾',
        'COMBO AUTORIZADO',
        'Entregue o combo ao cliente!',
        res.ingresso
      );
    } else {
      playSound('error');
      if (res.motivo === 'JA_RESGATADO') {
        showResultCard('error', '⛔', 'COMBO JÁ RESGATADO', res.mensagem, null);
      } else if (res.motivo === 'SEM_COMBO') {
        showResultCard('warning', '🤷‍♂️', 'SEM COMBO', res.mensagem, null);
      } else if (res.motivo === 'NAO_ENTROU') {
        showResultCard('error', '🛑', 'NÃO ENTROU NA CASA', res.mensagem, null);
      } else if (res.motivo === 'SEM_PERMISSAO') {
        showResultCard('warning', '🔒', 'SESSÃO EXPIRADA', 'Faça login de novo para continuar validando.', null);
      } else {
        showResultCard('error', '⚠️', 'ERRO AO RESGATAR', res.mensagem, null);
      }
    }
  }

  initPortariaStats();
}

/**
 * 4. DETECÇÃO DE COMBOS E CARDS FÍSICOS DE PORTARIA
 */
function extrairComboDoIngresso(ingresso) {
  if (!ingresso) return null;
  const setor = (ingresso.setor || '').toUpperCase();

  if (setor.includes('BLACK LABEL') || setor.includes('CARD DOURADO') || (setor.includes('WHISKY') && setor.includes('BLACK'))) {
    return {
      cardNome: 'CARD DOURADO',
      corCard: '#FFC24A',
      classe: 'alert-card-gold',
      produto: 'Combo Johnnie Walker Black Label 12 Anos',
      detalhes: '1L Black Label + 5 Red Bulls + Gelo Coco + Copos AURA'
    };
  }
  if (setor.includes('RED LABEL') || setor.includes('CARD ÂMBAR') || setor.includes('CARD AMBAR') || (setor.includes('WHISKY') && setor.includes('RED'))) {
    return {
      cardNome: 'CARD ÂMBAR',
      corCard: '#FF8A0F',
      classe: 'alert-card-amber',
      produto: 'Combo Johnnie Walker Red Label',
      detalhes: '1L Red Label + 5 Red Bulls + Gelo Coco + Copos'
    };
  }
  if (setor.includes('CIROC') || setor.includes('CÎROC') || setor.includes('AZUL ROYAL')) {
    return {
      cardNome: 'CARD AZUL ROYAL',
      corCard: '#3B82F6',
      classe: 'alert-card-royal-blue',
      produto: 'Combo Cîroc Ultra Premium Vodka',
      detalhes: '750ml Cîroc + 6 Red Bulls + Balde + Taças'
    };
  }
  if (setor.includes('ABSOLUT') || setor.includes('CARD AZUL') || setor.includes('VODKA')) {
    return {
      cardNome: 'CARD AZUL',
      corCard: '#00F0FF',
      classe: 'alert-card-blue',
      produto: 'Combo Absolut Vodka',
      detalhes: '1L Absolut + 5 Red Bulls + Gelo + Copos'
    };
  }
  if (setor.includes('TANQUERAY') || setor.includes('CARD VERMELHO') || setor.includes('GIN')) {
    return {
      cardNome: 'CARD VERMELHO',
      corCard: '#EF4444',
      classe: 'alert-card-red',
      produto: 'Combo Gin Tanqueray London Dry',
      detalhes: '750ml Tanqueray + 5 Tônicas + Especiarias + Taças'
    };
  }
  if (setor.includes('CHANDON') || setor.includes('PASSION') || setor.includes('CARD ROSA') || setor.includes('ESPUMANTE')) {
    return {
      cardNome: 'CARD ROSA',
      corCard: '#EC4899',
      classe: 'alert-card-pink',
      produto: 'Chandon Passion On The Rocks',
      detalhes: '750ml Chandon + Balde com Gelo Especial + Taças'
    };
  }
  if (setor.includes('CORONA') || setor.includes('VERDE LIMÃO') || setor.includes('VERDE LIMAO')) {
    return {
      cardNome: 'CARD VERDE LIMÃO',
      corCard: '#EAB308',
      classe: 'alert-card-lime',
      produto: 'Balde Corona Extra (6x com Limão)',
      detalhes: '6x Corona 330ml no Balde de Gelo + Limão Tahiti'
    };
  }
  if (setor.includes('HEINEKEN') || setor.includes('CARD VERDE') || setor.includes('BALDE')) {
    return {
      cardNome: 'CARD VERDE',
      corCard: '#10B981',
      classe: 'alert-card-green',
      produto: 'Balde Heineken (6x Long Neck)',
      detalhes: '6x Long Necks 330ml no Balde com Gelo Moído'
    };
  }
  if (setor.includes('RED BULL') || setor.includes('CARD CIANO')) {
    return {
      cardNome: 'CARD CIANO',
      corCard: '#06B6D4',
      classe: 'alert-card-cyan',
      produto: 'Combo 5x Red Bull Energy Drink',
      detalhes: '5x Latas 250ml no Baldinho de Gelo'
    };
  }

  return null;
}

/**
 * 5. EXIBIÇÃO DO CARD DE RESULTADO
 */
function showResultCard(tipo, icone, titulo, mensagem, ingresso = null) {
  const card = document.getElementById('result-card');
  const elIcon = document.getElementById('result-icon');
  const elTitle = document.getElementById('result-title');
  const elMsg = document.getElementById('result-msg');
  const elDetails = document.getElementById('result-details');
  const comboAlert = document.getElementById('portaria-combo-alert');

  const detNome = document.getElementById('det-nome');
  const detSetor = document.getElementById('det-setor');
  const detCodigo = document.getElementById('det-codigo');

  if (!card) return;

  card.className = `result-card status-${tipo}`;
  card.style.removeProperty('display');
  if (elIcon) elIcon.textContent = icone;
  if (elTitle) elTitle.textContent = titulo;
  if (elMsg) elMsg.textContent = mensagem;

  if (ingresso) {
    if (elDetails) elDetails.style.display = 'block';
    if (detNome) detNome.textContent = ingresso.titular_nome || '-';
    if (detSetor) detSetor.textContent = (ingresso.setor || '-').toUpperCase();
    if (detCodigo) detCodigo.textContent = ingresso.codigo_validador || '-';

    // Lógica de Alertas Visuais com base no Modo de Operação
    if (tipo === 'success' && comboAlert) {
      const comboInfo = extrairComboDoIngresso(ingresso);
      
      if (modoOperacao === 'PORTARIA') {
        if (comboInfo) {
          comboAlert.innerHTML = `
            <div class="portaria-no-combo-badge font-mono" style="border-color: #00F0FF; color: #00F0FF;">
              ✓ ENTRADA LIBERADA • CLIENTE POSSUI COMBO NO SISTEMA
            </div>
          `;
        } else {
          comboAlert.innerHTML = `
            <div class="portaria-no-combo-badge font-mono">
              ✓ ENTRADA SIMPLES • SEM COMBO
            </div>
          `;
        }
        comboAlert.style.display = 'block';
      } 
      else if (modoOperacao === 'BAR') {
        if (comboInfo) {
          comboAlert.innerHTML = `
            <div class="portaria-combo-alert-box ${comboInfo.classe}">
              <div class="portaria-alert-top font-mono">
                <span>🚨</span>
                <strong>ATENÇÃO BAR • ENTREGAR AGORA:</strong>
              </div>
              <div class="portaria-alert-card-title">
                ${comboInfo.produto.toUpperCase()}
              </div>
              <div class="portaria-alert-warn font-mono">
                ✓ Resgate confirmado no sistema. Pode entregar as bebidas ao cliente!
              </div>
            </div>
          `;
          comboAlert.style.display = 'block';
        }
      }
    } else if (comboAlert) {
      comboAlert.innerHTML = '';
      comboAlert.style.display = 'none';
    }
  } else {
    if (elDetails) elDetails.style.display = 'none';
    if (comboAlert) {
      comboAlert.innerHTML = '';
      comboAlert.style.display = 'none';
    }
  }

  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForNextScan() {
  const card = document.getElementById('result-card');
  const comboAlert = document.getElementById('portaria-combo-alert');

  if (card) {
    card.className = 'result-card';
    card.style.removeProperty('display');
  }
  if (comboAlert) {
    comboAlert.innerHTML = '';
    comboAlert.style.display = 'none';
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
