/**
 * AURA MOCOCA • GERADOR DE QR CODE LOCAL
 *
 * Carregado por index.html (checkout) e por ingresso.html (voucher).
 * Expõe window.AuraQR = { desenhar, matriz, comoImagem }.
 *
 * Verificado com o decodificador jsQR em 9 casos, incluindo um payload PIX
 * EMV real de 139 bytes e entradas de 400 bytes. Ver testes/teste_qr.mjs.
 */

// ═════════════════════════════════════════════════════════════════════════
// GERADOR DE QR CODE LOCAL  (modo byte • correção de erro nível M)
//
// Por que existe: até esta versão o QR de cada ingresso era desenhado por um
// site de terceiros (api.qrserver.com). Isso mandava o código de validação de
// TODO cliente para fora, e sem internet a imagem simplesmente não aparecia —
// com o cliente já pago, na fila da portaria.
//
// Implementação: ISO/IEC 18004. Modo byte, nível M, versões 1 a 15 (até 412
// bytes), escolhendo sozinho a menor versão que couber e a máscara de menor
// penalidade. Traz padrões de posição, alinhamento, temporização, informação
// de formato (BCH 15,5) e de versão (BCH 18,6), e ECC Reed–Solomon sobre
// GF(256).
// ═════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── Corpo de Galois GF(256), polinômio primitivo 0x11D ──
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  (function montarTabelas() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();

  function multiplicar(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  /**
   * Blocos de correção do nível M, versões 1 a 15.
   * [ecc por bloco, blocos do grupo 1, dados por bloco g1,
   *  blocos do grupo 2, dados por bloco g2]
   * Conferência: (g1*d1 + g2*d2 + (g1+g2)*ecc) = total de codewords da versão.
   */
  const BLOCOS_M = [
    null,
    [10, 1, 16, 0, 0],   // v1  — 26 codewords
    [16, 1, 28, 0, 0],   // v2  — 44
    [26, 1, 44, 0, 0],   // v3  — 70
    [18, 2, 32, 0, 0],   // v4  — 100
    [24, 2, 43, 0, 0],   // v5  — 134
    [16, 4, 27, 0, 0],   // v6  — 172
    [18, 4, 31, 0, 0],   // v7  — 196
    [22, 2, 38, 2, 39],  // v8  — 242
    [22, 3, 36, 2, 37],  // v9  — 292
    [26, 4, 43, 1, 44],  // v10 — 346
    [30, 1, 50, 4, 51],  // v11 — 404
    [22, 6, 36, 2, 37],  // v12 — 466
    [22, 8, 37, 1, 38],  // v13 — 532
    [24, 4, 40, 5, 41],  // v14 — 581
    [24, 5, 41, 5, 42]   // v15 — 655
  ];

  /** Centros dos padrões de alinhamento por versão. */
  const ALINHAMENTO = [
    null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
    [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70]
  ];

  const VERSAO_MAXIMA = 15;

  function dadosDaVersao(v) {
    const [ecc, g1, d1, g2, d2] = BLOCOS_M[v];
    return { ecc, g1, d1, g2, d2, totalDados: g1 * d1 + g2 * d2 };
  }

  function paraBytes(texto) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(texto);
    const saida = [];
    for (const ch of String(texto)) {
      let c = ch.codePointAt(0);
      if (c < 0x80) saida.push(c);
      else if (c < 0x800) saida.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) saida.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else saida.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return Uint8Array.from(saida);
  }

  /** Menor versão que comporta os bytes no modo byte, nível M. */
  function escolherVersao(qtdBytes) {
    for (let v = 1; v <= VERSAO_MAXIMA; v++) {
      const { totalDados } = dadosDaVersao(v);
      const bitsCabecalho = 4 + (v <= 9 ? 8 : 16);
      if (bitsCabecalho + qtdBytes * 8 <= totalDados * 8) return v;
    }
    return 0;
  }

  /** Polinômio gerador de grau `grau`: produto de (x - α^i). */
  function polinomioGerador(grau) {
    let p = [1];
    for (let i = 0; i < grau; i++) {
      const novo = new Array(p.length + 1).fill(0);
      for (let j = 0; j < p.length; j++) {
        novo[j] ^= p[j];                            // multiplica por x
        novo[j + 1] ^= multiplicar(p[j], EXP[i]);   // soma α^i * p
      }
      p = novo;
    }
    return p;
  }

  /** Resto da divisão polinomial = codewords de correção do bloco. */
  function calcularEcc(dados, qtdEcc) {
    const gerador = polinomioGerador(qtdEcc);
    const resto = new Uint8Array(qtdEcc);
    for (let k = 0; k < dados.length; k++) {
      const fator = dados[k] ^ resto[0];
      resto.copyWithin(0, 1);
      resto[qtdEcc - 1] = 0;
      for (let i = 0; i < qtdEcc; i++) resto[i] ^= multiplicar(gerador[i + 1], fator);
    }
    return resto;
  }

  /** Fluxo de bits → codewords de dados + ECC já intercalados. */
  function montarCodewords(bytes, versao) {
    const { ecc, g1, d1, g2, d2, totalDados } = dadosDaVersao(versao);
    const capacidadeBits = totalDados * 8;
    const bits = [];
    const empurrar = (valor, quantos) => {
      for (let i = quantos - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
    };

    empurrar(0b0100, 4);                              // indicador de modo byte
    empurrar(bytes.length, versao <= 9 ? 8 : 16);     // contador de caracteres
    for (let i = 0; i < bytes.length; i++) empurrar(bytes[i], 8);

    empurrar(0, Math.min(4, capacidadeBits - bits.length));   // terminador
    while (bits.length % 8 !== 0) bits.push(0);               // fecha o byte
    const enchimento = [0xEC, 0x11];
    for (let i = 0; bits.length < capacidadeBits; i++) empurrar(enchimento[i % 2], 8);

    const cw = new Uint8Array(totalDados);
    for (let i = 0; i < totalDados; i++) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
      cw[i] = b;
    }

    const blocosDados = [];
    let pos = 0;
    for (let b = 0; b < g1; b++) { blocosDados.push(cw.subarray(pos, pos + d1)); pos += d1; }
    for (let b = 0; b < g2; b++) { blocosDados.push(cw.subarray(pos, pos + d2)); pos += d2; }
    const blocosEcc = blocosDados.map((bloco) => calcularEcc(bloco, ecc));

    const saida = [];
    const maiorBloco = Math.max(d1, d2);
    for (let i = 0; i < maiorBloco; i++) {
      for (const bloco of blocosDados) if (i < bloco.length) saida.push(bloco[i]);
    }
    for (let i = 0; i < ecc; i++) {
      for (const bloco of blocosEcc) saida.push(bloco[i]);
    }
    return Uint8Array.from(saida);
  }

  // ── Desenho da matriz ──

  function novaMatriz(tamanho) {
    const m = [];
    for (let i = 0; i < tamanho; i++) m.push(new Uint8Array(tamanho));
    return m;
  }

  function desenharFuncoes(mod, reservado, tamanho, versao) {
    const marcar = (x, y, escuro) => {
      if (x < 0 || y < 0 || x >= tamanho || y >= tamanho) return;
      mod[y][x] = escuro ? 1 : 0;
      reservado[y][x] = 1;
    };

    // Padrões de posição (7x7) com separador, nos três cantos
    [[3, 3], [tamanho - 4, 3], [3, tamanho - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy));
          marcar(cx + dx, cy + dy, dist !== 2 && dist !== 4);
        }
      }
    });

    // Padrões de alinhamento (5x5), pulando os que cairiam sobre os de posição
    const centros = ALINHAMENTO[versao];
    for (let i = 0; i < centros.length; i++) {
      for (let j = 0; j < centros.length; j++) {
        const ultimo = centros.length - 1;
        if ((i === 0 && j === 0) || (i === 0 && j === ultimo) || (i === ultimo && j === 0)) continue;
        const cx = centros[j], cy = centros[i];
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            marcar(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
          }
        }
      }
    }

    // Temporização: linha e coluna 6
    for (let i = 8; i < tamanho - 8; i++) {
      marcar(i, 6, i % 2 === 0);
      marcar(6, i, i % 2 === 0);
    }

    // Reserva das áreas de formato (preenchidas depois, já com a máscara).
    // Pula o índice 6: ali passa a temporização, não o formato — sobrescrever
    // esses dois módulos deixa o código legível só porque a correção de erro
    // conserta, o que é sorte, não acerto.
    for (let i = 0; i <= 8; i++) {
      if (i === 6) continue;
      marcar(8, i, false);
      marcar(i, 8, false);
    }
    for (let i = 0; i < 8; i++) { marcar(tamanho - 1 - i, 8, false); marcar(8, tamanho - 1 - i, false); }
    marcar(8, tamanho - 8, true); // módulo sempre escuro

    // Informação de versão (a partir da v7): BCH(18,6)
    if (versao >= 7) {
      let resto = versao;
      for (let i = 0; i < 12; i++) resto = (resto << 1) ^ ((resto >>> 11) * 0x1F25);
      const bits = (versao << 12) | resto;
      for (let i = 0; i < 18; i++) {
        const bit = ((bits >>> i) & 1) === 1;
        const a = tamanho - 11 + (i % 3);
        const b = Math.floor(i / 3);
        marcar(a, b, bit);
        marcar(b, a, bit);
      }
    }
  }

  /** Informação de formato: nível M (00) + máscara, BCH(15,5) e XOR 0x5412. */
  function desenharFormato(mod, tamanho, mascara) {
    const dados = (0b00 << 3) | mascara;
    let resto = dados;
    for (let i = 0; i < 10; i++) resto = (resto << 1) ^ ((resto >>> 9) * 0x537);
    const bits = ((dados << 10) | resto) ^ 0x5412;
    const bit = (i) => (bits >>> i) & 1;

    for (let i = 0; i <= 5; i++) mod[i][8] = bit(i);
    mod[7][8] = bit(6);
    mod[8][8] = bit(7);
    mod[8][7] = bit(8);
    for (let i = 9; i < 15; i++) mod[8][14 - i] = bit(i);

    for (let i = 0; i < 8; i++) mod[8][tamanho - 1 - i] = bit(i);
    for (let i = 8; i < 15; i++) mod[tamanho - 15 + i][8] = bit(i);
    mod[tamanho - 8][8] = 1;
  }

  /** Zigue-zague de baixo para cima, duas colunas por vez, pulando a coluna 6. */
  function espalharDados(mod, reservado, tamanho, codewords) {
    let i = 0;
    const totalBits = codewords.length * 8;
    for (let direita = tamanho - 1; direita >= 1; direita -= 2) {
      if (direita === 6) direita = 5;
      for (let vert = 0; vert < tamanho; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = direita - j;
          const subindo = ((direita + 1) & 2) === 0;
          const y = subindo ? tamanho - 1 - vert : vert;
          if (!reservado[y][x] && i < totalBits) {
            mod[y][x] = (codewords[i >>> 3] >>> (7 - (i & 7))) & 1;
            i++;
          }
        }
      }
    }
  }

  function regraDaMascara(n, x, y) {
    switch (n) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
      case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
      case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
      default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    }
  }

  function aplicarMascara(mod, reservado, tamanho, n) {
    for (let y = 0; y < tamanho; y++) {
      for (let x = 0; x < tamanho; x++) {
        if (!reservado[y][x] && regraDaMascara(n, x, y)) mod[y][x] ^= 1;
      }
    }
  }

  const PADRAO_A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const PADRAO_B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];

  function bate(seq, inicio, padrao) {
    for (let k = 0; k < 11; k++) if (seq[inicio + k] !== padrao[k]) return false;
    return true;
  }

  /** Penalidade das quatro regras da norma. Menor é melhor. */
  function penalidade(mod, tamanho) {
    let total = 0;

    const varrer = (pegar) => {
      for (let a = 0; a < tamanho; a++) {
        const seq = new Array(tamanho);
        for (let b = 0; b < tamanho; b++) seq[b] = pegar(a, b);
        // regra 1 — sequências de 5 ou mais módulos iguais
        let corrida = 1;
        for (let b = 1; b < tamanho; b++) {
          if (seq[b] === seq[b - 1]) corrida++;
          else { if (corrida >= 5) total += 3 + (corrida - 5); corrida = 1; }
        }
        if (corrida >= 5) total += 3 + (corrida - 5);
        // regra 3 — padrão 1:1:3:1:1 com quatro módulos claros ao lado
        for (let b = 0; b + 11 <= tamanho; b++) {
          if (bate(seq, b, PADRAO_A) || bate(seq, b, PADRAO_B)) total += 40;
        }
      }
    };
    varrer((y, x) => mod[y][x]);
    varrer((x, y) => mod[y][x]);

    // regra 2 — blocos 2x2 de uma cor só
    for (let y = 0; y < tamanho - 1; y++) {
      for (let x = 0; x < tamanho - 1; x++) {
        const c = mod[y][x];
        if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) total += 3;
      }
    }

    // regra 4 — desequilíbrio entre claro e escuro
    let escuros = 0;
    for (let y = 0; y < tamanho; y++) for (let x = 0; x < tamanho; x++) escuros += mod[y][x];
    const proporcao = (escuros * 100) / (tamanho * tamanho);
    total += Math.floor(Math.abs(proporcao - 50) / 5) * 10;

    return total;
  }

  /**
   * Matriz final do QR Code.
   * @returns {{ tamanho: number, versao: number, modulos: Uint8Array[] }}
   */
  function matriz(texto) {
    const bytes = paraBytes(texto == null ? '' : String(texto));
    const versao = escolherVersao(bytes.length);
    if (!versao) throw new Error('Texto longo demais para o QR Code local (' + bytes.length + ' bytes).');

    const tamanho = versao * 4 + 17;
    const codewords = montarCodewords(bytes, versao);

    const base = novaMatriz(tamanho);
    const reservado = novaMatriz(tamanho);
    desenharFuncoes(base, reservado, tamanho, versao);
    espalharDados(base, reservado, tamanho, codewords);

    let melhor = null;
    let melhorNota = Infinity;
    for (let n = 0; n < 8; n++) {
      const tentativa = base.map((linha) => Uint8Array.from(linha));
      aplicarMascara(tentativa, reservado, tamanho, n);
      desenharFormato(tentativa, tamanho, n);
      const nota = penalidade(tentativa, tamanho);
      if (nota < melhorNota) { melhorNota = nota; melhor = tentativa; }
    }

    return { tamanho, versao, modulos: melhor };
  }

  /**
   * Desenha o QR num <canvas>. Sempre com a zona de silêncio de 4 módulos —
   * sem ela muitos leitores não encontram o código.
   */
  function desenhar(texto, tamanhoPx) {
    const alvo = Number(tamanhoPx) > 0 ? Number(tamanhoPx) : 240;
    const qr = matriz(texto);
    const borda = 4;
    const modulosTotais = qr.tamanho + borda * 2;
    const escala = Math.max(1, Math.floor(alvo / modulosTotais));
    const lado = modulosTotais * escala;

    const canvas = document.createElement('canvas');
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, lado, lado);
    ctx.fillStyle = '#000000';
    for (let y = 0; y < qr.tamanho; y++) {
      for (let x = 0; x < qr.tamanho; x++) {
        if (qr.modulos[y][x]) {
          ctx.fillRect((x + borda) * escala, (y + borda) * escala, escala, escala);
        }
      }
    }
    return canvas;
  }

  /** PNG em data: URI, para usar direto no src de uma <img>. */
  function comoImagem(texto, tamanhoPx) {
    return desenhar(texto, tamanhoPx).toDataURL('image/png');
  }

  window.AuraQR = { desenhar, matriz, comoImagem };
})();

