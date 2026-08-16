// Prova dos 5 bugs de front-end do checkout/portaria, com o AuraDB simulado.
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'file:///c:/Users/thiga/Desktop/Projetos%20Thiago/Aura/';
const PORT = 9455;

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files',
  '--force-device-scale-factor=1', '--incognito', 'about:blank'], { stdio: 'ignore' });

let alvo;
for (let i = 0; i < 60; i++) { await sleep(300);
  try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
        alvo = l.find(t => t.type === 'page'); if (alvo?.webSocketDebuggerUrl) break; } catch {} }
const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((ok, err) => { ws.onopen = ok; ws.onerror = err; });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const { ok, err } = pend.get(m.id); pend.delete(m.id);
    m.error ? err(new Error(JSON.stringify(m.error))) : ok(m.result); } };
const cmd = (me, p = {}) => new Promise((ok, err) => { const i = ++id; pend.set(i, { ok, err });
  ws.send(JSON.stringify({ id: i, method: me, params: p })); });
const ev = async (e) => {
  const r = await cmd('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'erro no script');
  return r.result.value;
};

await cmd('Page.enable'); await cmd('Runtime.enable');
await cmd('Network.enable'); await cmd('Network.setCacheDisabled', { cacheDisabled: true });

const resultados = [];
const checar = (nome, passou, detalhe) => {
  resultados.push({ nome, passou, detalhe });
  console.log(`${passou ? 'OK  ' : 'FALHA'} ${nome}${detalhe ? '  ->  ' + detalhe : ''}`);
};

// ────────────────────────────────────────────────────────────────
// PARTE 1 — CHECKOUT
// ────────────────────────────────────────────────────────────────
await cmd('Page.navigate', { url: BASE + 'index.html' });
await sleep(3500);

// Banco falso: conta chamadas, devolve o que o teste mandar.
// Espelha o contrato da funcao aura_criar_pedido do Supabase.
await ev(`
  window.__db = { pedidos: 0, ingressos: 0, modo: 'ok', ultimosIngressos: null };
  window.AuraDB = {
    criarPedido: async (p) => {
      window.__db.pedidos++;

      if (window.__db.modo === 'falha_pedido') {
        return { ok: false, motivo: 'ERRO_SERVIDOR',
                 mensagem: 'Nao conseguimos registrar seu pedido no sistema.' };
      }

      // Pedido gravou, mas os ingressos nao voltaram
      if (window.__db.modo === 'falha_ingressos') {
        return { ok: true, codigo_pedido: 'AURA-77777', codigos: [],
                 preco_unitario: 40, valor_total: 40 * p.quantidade,
                 status_pagamento: 'PENDENTE' };
      }

      window.__db.ingressos++;
      const sufixo = p.setor === 'Camarote' ? 'CAM' : 'PISTA';
      const codigos = Array.from({ length: p.quantidade },
                                 (_, i) => 'AURA-77777-' + sufixo + '-' + (i + 1));
      window.__db.ultimosIngressos = codigos;
      return { ok: true, codigo_pedido: 'AURA-77777', codigos: codigos,
               preco_unitario: 40, valor_total: 40 * p.quantidade,
               status_pagamento: 'PENDENTE' };
    },
    buscarVoucher: async () => ({ ok: false, motivo: 'NAO_ENCONTRADO' }),
    fetchShows: async () => null, fetchLotes: async () => null,
    updateShow: async () => true, updateLote: async () => true,
    updateLoteStatus: async () => true,
    fetchMetricas: async () => ({ totalIngressos: 0, totalFaturamento: 0 }),
    fetchPedidosPendentes: async () => [],
    fetchResumoPortaria: async () => ({ total: 0, validados: 0, restantes: 0 })
  };
  'pronto'
`);

// Helper: leva o fluxo até a etapa de pagamento com N ingressos
const irAtePagamento = async (qtd) => await ev(`(async () => {
  openCheckout();
  for (let i = 1; i < ${qtd}; i++) document.getElementById('btn-qty-plus').click();
  document.getElementById('cust-name').value = 'Cliente De Teste';
  document.getElementById('cust-cpf').value = '111.444.777-35';
  document.getElementById('cust-email').value = 'teste@aura.com';
  document.getElementById('cust-whatsapp').value = '(19) 99999-9999';
  document.getElementById('form-customer-info')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 120));
  return document.getElementById('step-payment').style.display;
})()`);

// ── Teste 1: um clique = um pedido ──────────────────────────────
await ev(`window.__db.pedidos = 0; window.__db.ingressos = 0; window.__db.modo = 'ok'; 'ok'`);
await irAtePagamento(1);
const t1 = await ev(`(async () => {
  document.getElementById('btn-confirm-payment').click();
  await new Promise(r => setTimeout(r, 700));
  return JSON.stringify({
    pedidos: window.__db.pedidos,
    ingressos: window.__db.ingressos,
    onclickInline: document.getElementById('btn-confirm-payment').getAttribute('onclick'),
    sucessoVisivel: document.getElementById('step-success').style.display
  });
})()`);
const r1 = JSON.parse(t1);
checar('1. Um clique gera exatamente UM pedido', r1.pedidos === 1 && r1.ingressos === 1,
  `pedidos=${r1.pedidos} ingressos=${r1.ingressos} onclick-inline=${r1.onclickInline}`);
checar('1b. Tela de sucesso aparece quando o banco responde', r1.sucessoVisivel === 'block',
  `display=${r1.sucessoVisivel}`);

// ── Teste 2: falha ao gravar o pedido NÃO mostra sucesso ────────
await ev(`window.__db.pedidos = 0; window.__db.modo = 'falha_pedido'; 'ok'`);
await irAtePagamento(1);
const t2 = JSON.parse(await ev(`(async () => {
  document.getElementById('btn-confirm-payment').click();
  await new Promise(r => setTimeout(r, 700));
  const erro = document.getElementById('checkout-erro');
  return JSON.stringify({
    sucesso: document.getElementById('step-success').style.display,
    pagamentoAindaVisivel: document.getElementById('step-payment').style.display,
    erroVisivel: erro.style.display,
    erroTexto: erro.textContent.slice(0, 60)
  });
})()`));
checar('2. Falha ao gravar o pedido NÃO leva à tela de sucesso',
  t2.sucesso === 'none' && t2.erroVisivel === 'block' && t2.erroTexto.length > 10,
  `sucesso=${t2.sucesso} erro="${t2.erroTexto}..."`);

// ── Teste 2b: pedido grava mas ingressos falham ─────────────────
await ev(`window.__db.modo = 'falha_ingressos'; 'ok'`);
await irAtePagamento(2);
const t2b = JSON.parse(await ev(`(async () => {
  document.getElementById('btn-confirm-payment').click();
  await new Promise(r => setTimeout(r, 700));
  const erro = document.getElementById('checkout-erro');
  return JSON.stringify({
    sucesso: document.getElementById('step-success').style.display,
    erroTexto: erro.textContent
  });
})()`));
checar('2b. Ingressos falharam: mostra o código do pedido, não sucesso',
  t2b.sucesso === 'none' && /AURA-\d+/.test(t2b.erroTexto),
  `"${t2b.erroTexto.slice(0, 90)}..."`);

// ── Teste 3: 3 ingressos = 3 QR Codes distintos ─────────────────
await ev(`window.__db.modo = 'ok'; 'ok'`);
await irAtePagamento(3);
const t3 = JSON.parse(await ev(`(async () => {
  document.getElementById('btn-confirm-payment').click();
  await new Promise(r => setTimeout(r, 900));
  const lista = document.getElementById('ticket-qr-lista');
  const imgs = [...lista.querySelectorAll('img')];
  const codigos = [...lista.querySelectorAll('.ticket-auth-code')].map(e => e.textContent);
  return JSON.stringify({
    qtdQr: imgs.length,
    codigos,
    unicos: new Set(codigos).size,
    gravadosNoBanco: window.__db.ultimosIngressos,
    rotulos: [...lista.querySelectorAll('.ticket-qr-index')].map(e => e.textContent),
    selo: document.getElementById('ticket-status-badge').textContent,
    tituloSucesso: document.getElementById('success-title').textContent
  });
})()`));
const batemComBanco = JSON.stringify(t3.codigos) === JSON.stringify(t3.gravadosNoBanco);
checar('3. 3 ingressos geram 3 QR Codes com códigos distintos',
  t3.qtdQr === 3 && t3.unicos === 3 && batemComBanco,
  `qr=${t3.qtdQr} unicos=${t3.unicos} iguais-ao-banco=${batemComBanco} ${t3.codigos.join(' | ')}`);
checar('3b. Cada QR é rotulado para o cliente saber qual é qual',
  t3.rotulos.length === 3, t3.rotulos.join(' '));

checar('3d. Pagamento pendente NÃO é anunciado como "entrada válida"',
  /AGUARDANDO/i.test(t3.selo) && !/VÁLIDA/i.test(t3.selo),
  `selo="${t3.selo}" titulo="${t3.tituloSucesso}"`);

// ── Teste 3c: o WhatsApp leva todos os links ────────────────────
const t3c = JSON.parse(await ev(`(() => {
  let capturado = null;
  const abrirOriginal = window.open;
  window.open = (url) => { capturado = url; return null; };
  sendTicketToWhatsApp();
  window.open = abrirOriginal;
  const texto = decodeURIComponent(capturado || '');
  return JSON.stringify({
    linksNoTexto: (texto.match(/ingresso\\.html\\?v=/g) || []).length,
    codigosNoTexto: (texto.match(/AURA-\\d+-[A-Z]+-\\d/g) || []).length
  });
})()`));
checar('3c. Mensagem do WhatsApp leva os 3 links, não só o primeiro',
  t3c.linksNoTexto === 3, `links=${t3c.linksNoTexto} codigos=${t3c.codigosNoTexto}`);

// ── Teste 4: compra nova não herda o código da anterior ─────────
const t4 = JSON.parse(await ev(`(async () => {
  const anterior = checkoutState.codigosValidadores.slice();
  openCheckout();
  const depoisDeAbrir = {
    codigos: checkoutState.codigosValidadores.length,
    listaVazia: document.getElementById('ticket-qr-lista').innerHTML === '',
    nomeLimpo: document.getElementById('cust-name').value === ''
  };
  // agora uma compra que falha: não pode reaproveitar o código antigo
  window.__db.modo = 'falha_pedido';
  document.getElementById('cust-name').value = 'Segundo Cliente';
  document.getElementById('cust-cpf').value = '111.444.777-35';
  document.getElementById('cust-email').value = 'dois@aura.com';
  document.getElementById('cust-whatsapp').value = '(19) 98888-8888';
  document.getElementById('form-customer-info')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 150));
  document.getElementById('btn-confirm-payment').click();
  await new Promise(r => setTimeout(r, 700));
  return JSON.stringify({
    anterior,
    ...depoisDeAbrir,
    codigoAtual: checkoutState.ticketCode,
    sucesso: document.getElementById('step-success').style.display
  });
})()`));
checar('4. Compra nova zera o código do comprador anterior',
  t4.codigos === 0 && t4.listaVazia && t4.nomeLimpo && t4.codigoAtual === '' && t4.sucesso === 'none',
  `codigos=${t4.codigos} lista-vazia=${t4.listaVazia} nome-limpo=${t4.nomeLimpo} codigo-atual="${t4.codigoAtual}" (anterior era ${t4.anterior[0]})`);

// ── Teste 5: chamada dupla direta é ignorada ────────────────────
await ev(`window.__db.pedidos = 0; window.__db.ingressos = 0; window.__db.modo = 'ok'; 'ok'`);
await irAtePagamento(1);
const t5 = JSON.parse(await ev(`(async () => {
  // dispara as duas ao mesmo tempo, como faziam o onclick e o listener
  const a = emitDigitalTicket();
  const b = emitDigitalTicket();
  await Promise.all([a, b]);
  await new Promise(r => setTimeout(r, 400));
  return JSON.stringify({ pedidos: window.__db.pedidos, ingressos: window.__db.ingressos });
})()`));
checar('5. Duas chamadas simultâneas gravam UM pedido só',
  t5.pedidos === 1 && t5.ingressos === 1,
  `pedidos=${t5.pedidos} ingressos=${t5.ingressos}`);

// ────────────────────────────────────────────────────────────────
// PARTE 2 — PORTARIA
// ────────────────────────────────────────────────────────────────
await cmd('Page.navigate', { url: BASE + 'portaria.html' });
await sleep(2500);

const tp = JSON.parse(await ev(`(() => {
  const vis = () => getComputedStyle(document.getElementById('result-card')).display;
  const nome = () => document.getElementById('det-nome').textContent;

  showResultCard('success', 'v', 'ENTRADA AUTORIZADA', 'ok', { titular_nome: 'Primeiro', setor: 'PISTA', codigo_validador: 'AURA-1-PISTA-1' });
  const passo1 = vis();
  resetForNextScan();
  const passo2 = vis();
  showResultCard('error', 'x', 'JA UTILIZADO', 'segundo', { titular_nome: 'Segundo', setor: 'CAMAROTE', codigo_validador: 'AURA-2-CAM-1' });
  const passo3 = vis();
  const nome3 = nome();
  resetForNextScan();
  showResultCard('warning', '!', 'TERCEIRO', 'terceiro');
  const passo4 = vis();

  return JSON.stringify({ passo1, passo2, passo3, passo4, nome3,
    audioResume: typeof playSound === 'function' });
})()`));
checar('6. Card da portaria continua visível da 2ª leitura em diante',
  tp.passo1 === 'block' && tp.passo2 === 'none' && tp.passo3 === 'block' && tp.passo4 === 'block',
  `1ª=${tp.passo1} reset=${tp.passo2} 2ª=${tp.passo3} 3ª=${tp.passo4}`);
checar('6b. Dados do ingresso são trocados a cada leitura', tp.nome3 === 'Segundo', tp.nome3);

// ── Resumo ──
const falhas = resultados.filter(r => !r.passou);
console.log('\n' + '='.repeat(60));
console.log(`${resultados.length - falhas.length}/${resultados.length} verificações passaram`);
if (falhas.length) console.log('FALHAS: ' + falhas.map(f => f.nome).join(' | '));
console.log('='.repeat(60));

ws.close(); chrome.kill();
process.exit(falhas.length ? 1 : 0);
