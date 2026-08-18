// Abre cada página no Chrome headless e reprova se algo estourar no console
// ou se um elemento essencial não estiver lá. É o teste que pega o erro
// bobo — id renomeado, script que não carrega, função que sumiu — antes que
// ele apareça com o cliente na tela.
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'file:///c:/Users/thiga/Desktop/Projetos%20Thiago/Aura/';
const PORT = 9457;

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files',
  '--incognito', 'about:blank'], { stdio: 'ignore' });

let alvo;
for (let i = 0; i < 60; i++) {
  await sleep(300);
  try {
    const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    alvo = l.find(t => t.type === 'page');
    if (alvo?.webSocketDebuggerUrl) break;
  } catch {}
}

const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((ok, err) => { ws.onopen = ok; ws.onerror = err; });

let id = 0;
const pend = new Map();
let errosConsole = [];

ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) {
    const { ok, err } = pend.get(m.id);
    pend.delete(m.id);
    m.error ? err(new Error(JSON.stringify(m.error))) : ok(m.result);
  }
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    errosConsole.push(d.exception?.description || d.text || 'exceção sem descrição');
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    errosConsole.push((m.params.args || []).map(a => a.value ?? a.description ?? '').join(' '));
  }
};

const cmd = (me, p = {}) => new Promise((ok, err) => {
  const i = ++id; pend.set(i, { ok, err });
  ws.send(JSON.stringify({ id: i, method: me, params: p }));
});
const ev = async (e) => {
  const r = await cmd('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'erro no script');
  return r.result.value;
};

await cmd('Page.enable');
await cmd('Runtime.enable');
await cmd('Network.setCacheDisabled', { cacheDisabled: true });

const res = [];
const checar = (nome, ok, det) => {
  res.push({ nome, ok });
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${nome}${det ? '  ->  ' + det : ''}`);
};

// Ruído esperado: as páginas tentam falar com o Supabase e o file:// bloqueia
// parte disso; falha de rede não é defeito de código.
const ruidoEsperado = /Failed to load resource|net::ERR|CORS|Access-Control|favicon|Supabase|Falha de conex/i;

const paginas = [
  {
    arquivo: 'index.html',
    espera: `(() => {
      const ids = ['checkout-modal','step-selection','step-payment','step-success',
                   'ticket-qr-lista','checkout-combo-selector-container','btn-confirm-payment'];
      const faltando = ids.filter(i => !document.getElementById(i));
      return JSON.stringify({
        faltando,
        temQR: typeof window.AuraQR === 'object',
        temCheckout: typeof window.openCheckout === 'function',
        temConfig: typeof window.AuraConfig === 'object',
        temDB: typeof window.AuraDB === 'object',
        semPainelAdmin: !document.getElementById('admin-modal') && !document.getElementById('form-admin-login'),
        engrenagemLeva: (document.getElementById('btn-open-admin')||{}).getAttribute
          ? document.getElementById('btn-open-admin').getAttribute('href') : null
      });
    })()`
  },
  {
    arquivo: 'admin.html',
    espera: `(() => {
      const ids = ['form-admin-login','main-admin-panel','pending-list-container',
                   'lotes-ativo','btn-toggle-vendas','admin-aviso'];
      const faltando = ids.filter(i => !document.getElementById(i));
      return JSON.stringify({
        faltando,
        temDB: typeof window.AuraDB === 'object',
        loginEscondido: document.getElementById('main-admin-panel').style.display === 'none',
        semSenhaNoCodigo: !document.documentElement.innerHTML.includes('aura2026')
      });
    })()`
  },
  {
    arquivo: 'portaria.html',
    espera: `(() => {
      const ids = ['form-portaria-login','result-card','reader','manual-code-input'];
      const faltando = ids.filter(i => !document.getElementById(i));
      return JSON.stringify({
        faltando,
        temValidacao: typeof processarValidacao === 'function',
        temCard: typeof showResultCard === 'function',
        semAdivinhacaoDeCombo: typeof window.extrairComboDoIngresso === 'undefined'
      });
    })()`
  },
  {
    arquivo: 'ingresso.html?v=AURA-TESTE-TESTE',
    espera: `(() => {
      return JSON.stringify({
        faltando: ['state-loading','state-error','state-voucher'].filter(i => !document.getElementById(i)),
        temQR: typeof window.AuraQR === 'object',
        temDB: typeof window.AuraDB === 'object'
      });
    })()`
  }
];

for (const pagina of paginas) {
  errosConsole = [];
  await cmd('Page.navigate', { url: BASE + pagina.arquivo });
  await sleep(2600);

  const nome = pagina.arquivo.split('?')[0];
  let dados = {};
  let erroAvaliacao = null;
  try {
    dados = JSON.parse(await ev(pagina.espera));
  } catch (e) {
    erroAvaliacao = e.message;
  }

  const graves = errosConsole.filter(t => t && !ruidoEsperado.test(t));

  checar(`${nome}: carrega sem erro de JavaScript`,
    !erroAvaliacao && graves.length === 0,
    erroAvaliacao ? 'avaliação falhou: ' + erroAvaliacao
                  : (graves.length ? graves.slice(0, 2).join(' | ') : 'console limpo'));

  if (!erroAvaliacao) {
    checar(`${nome}: elementos essenciais presentes`,
      Array.isArray(dados.faltando) && dados.faltando.length === 0,
      dados.faltando && dados.faltando.length ? 'faltam: ' + dados.faltando.join(', ') : 'todos');

    const extras = Object.entries(dados).filter(([k]) => k !== 'faltando');
    const ruins = extras.filter(([, v]) => v === false || v === null);
    checar(`${nome}: contratos da página`,
      ruins.length === 0,
      extras.map(([k, v]) => `${k}=${v}`).join(' '));
  }
}

const falhas = res.filter(r => !r.ok);
console.log('\n' + '='.repeat(62));
console.log(`${res.length - falhas.length}/${res.length} verificações passaram`);
if (falhas.length) console.log('FALHAS:\n  - ' + falhas.map(f => f.nome).join('\n  - '));
console.log('='.repeat(62));

ws.close();
chrome.kill();
process.exit(falhas.length ? 1 : 0);
