// Prova que o QR Code gerado por `js/qr.js` é lido por um decodificador de
// verdade. Um QR ilegível só aparece na porta da casa, com o cliente já pago
// e a fila andando — por isso este teste existe.
//
// Único teste da suíte que precisa de dependência:
//     npm install jsqr
// Sem ela, o teste avisa e sai sem reprovar.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let jsQR;
try {
  jsQR = require('jsqr');
  if (jsQR.default) jsQR = jsQR.default;
} catch {
  console.log('PULADO — este teste precisa do decodificador jsQR.');
  console.log('        Instale com:  npm install jsqr');
  process.exit(0);
}

// `js/qr.js` é escrito para o navegador: fala com `window` e cria <canvas>.
// Aqui damos a ele um mundo mínimo para poder rodar no Node.
const fonte = readFileSync(new URL('../js/qr.js', import.meta.url), 'utf8');
const janela = {};
new Function('window', 'document', fonte)(janela, {
  createElement: () => { throw new Error('sem DOM: use matriz(), não desenhar()'); }
});

const AuraQR = janela.AuraQR;
if (!AuraQR || typeof AuraQR.matriz !== 'function') {
  console.error('FALHA — js/qr.js não expôs window.AuraQR.matriz');
  process.exit(1);
}

const ESCALA = 6;
const BORDA = 4;

/** Pinta a matriz num buffer RGBA, como um leitor de celular veria. */
function paraRGBA(modulos, tamanho) {
  const lado = (tamanho + BORDA * 2) * ESCALA;
  const dados = new Uint8ClampedArray(lado * lado * 4).fill(255);
  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      if (!modulos[y][x]) continue;
      for (let dy = 0; dy < ESCALA; dy++) {
        for (let dx = 0; dx < ESCALA; dx++) {
          const px = ((y + BORDA) * ESCALA + dy) * lado + ((x + BORDA) * ESCALA + dx);
          dados[px * 4] = 0; dados[px * 4 + 1] = 0; dados[px * 4 + 2] = 0;
        }
      }
    }
  }
  return { dados, lado };
}

// O payload do PIX é o caso mais longo que o checkout gera de verdade.
const PIX_REAL =
  '00020101021226580014br.gov.bcb.pix0136auramococa@gmail.com520400005303986' +
  '5404460.005802BR5911AURA MOCOCA6006MOCOCA62110507AURA100426304ABCD';

const casos = [
  ['código de ingresso',        'AURA-K2M9P-4TXWE'],
  ['código de ingresso (2)',    'AURA-2UE8N-2TYCJ'],
  ['código do pedido',          'AURA-10042'],
  ['link do voucher',           'https://auramococa.com.br/ingresso.html?v=AURA-K2M9P-4TXWE'],
  ['payload PIX completo',      PIX_REAL],
  ['texto com acento',          'Cîroc Ultra Premium • Camarote • R$ 440,00'],
  ['200 bytes',                 'X'.repeat(200)],
  ['400 bytes',                 'Y'.repeat(400)],
  ['1 caractere',               'A']
];

const res = [];
const checar = (nome, ok, det) => {
  res.push({ nome, ok });
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${nome}${det ? '  ->  ' + det : ''}`);
};

console.log('=== O QR GERADO LOCALMENTE É LIDO POR UM DECODIFICADOR? ===\n');

for (const [nome, texto] of casos) {
  try {
    const qr = AuraQR.matriz(texto);
    const { dados, lado } = paraRGBA(qr.modulos, qr.tamanho);
    const lido = jsQR(dados, lado, lado);
    const ok = !!lido && lido.data === texto;
    checar(nome, ok,
      ok ? `versão ${qr.versao} · ${qr.tamanho}×${qr.tamanho} · ${texto.length} bytes`
         : `esperado ${JSON.stringify(texto.slice(0, 40))}, lido ${JSON.stringify(lido ? lido.data.slice(0, 40) : null)}`);
  } catch (e) {
    checar(nome, false, 'exceção: ' + e.message);
  }
}

// Dois QR do mesmo texto têm de ser idênticos: o gerador não pode depender de
// sorteio, senão o ingresso impresso e o da tela divergem.
const a = AuraQR.matriz('AURA-K2M9P-4TXWE');
const b = AuraQR.matriz('AURA-K2M9P-4TXWE');
checar('mesmo texto gera sempre o mesmo QR',
  JSON.stringify(a.modulos) === JSON.stringify(b.modulos));

// Texto maior do que cabe tem de estourar com erro claro, não gerar um QR
// truncado que o leitor lê pela metade.
let estourou = false;
try { AuraQR.matriz('Z'.repeat(5000)); } catch { estourou = true; }
checar('texto grande demais é recusado com erro', estourou);

const falhas = res.filter(r => !r.ok);
console.log('\n' + '='.repeat(62));
console.log(`${res.length - falhas.length}/${res.length} verificações passaram`);
if (falhas.length) console.log('FALHAS:\n  - ' + falhas.map(f => f.nome).join('\n  - '));
console.log('='.repeat(62));
process.exit(falhas.length ? 1 : 0);
