/**
 * AURA MOCOCA • MAIN SCRIPT (PRODUX HERO PUZZLE & AUTO PLAYBACK ENGINE)
 * AURA Gigante -> Pedaços Desfocados Espalhados -> Foco & Montagem -> Transição Automática de Fotos e Vídeo
 */

document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initProduxHeroPuzzle();
  initShowreelVideo();
  initGaleriaHorizontal();
  initFaqAccordion();
  initSmoothScroll();
});

/* Proporções reais de cada mídia que passa pela moldura do hero.
   A moldura muda de formato para acompanhar — ver `.assembled-master-canvas`. */
const PROPORCAO_LOCKUP = 1.65; // 987 ÷ 598 — largura ÷ altura do logotipo

/* Caixa do letreiro real dentro da foto 4K da fachada (2340×4160), em fração
   da moldura. Medida por varredura de pixel na foto: da esquerda do primeiro
   "A" (639) à direita do último (1626), e do topo do emblema (1231) à base do
   filete (1829). É onde o logotipo vetorial precisa pousar.
   Estes números têm de bater com `.hero-sign-anchor` no CSS. */
const LETREIRO_NA_FOTO = { x: 0.2731, y: 0.2959, largura: 0.4218, altura: 0.1438 };

const limitar = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const suavizar = (t) => 1 - Math.pow(1 - t, 3); // cubic ease-out
/* Acelera e desacelera: os fragmentos ainda estão visivelmente convergindo na
   metade do caminho, em vez de chegarem quase prontos logo no início. */
const suavizarNosDoisLados = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* --------------------------------------------------------------------------
   1. CURSOR MAGNÉTICO PRODUX
   -------------------------------------------------------------------------- */
function initCustomCursor() {
  const cursor = document.getElementById('custom-cursor');
  const badge = document.getElementById('cursor-badge');
  if (!cursor) return;

  let mouseX = -100, mouseY = -100;
  let cursorX = -100, cursorY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function renderCursor() {
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  const hoverElements = document.querySelectorAll('[data-cursor], a, button, .show-card-media, .auto-party-video-layer');
  hoverElements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('is-hovering');
      const label = el.getAttribute('data-cursor') || 'AURA';
      if (badge) badge.textContent = label;
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-hovering');
    });
  });
}

/* --------------------------------------------------------------------------
   2. PRODUX HERO SCROLL PUZZLE & AUTO CLÍMAX ENGINE
   -------------------------------------------------------------------------- */
function initProduxHeroPuzzle() {
  const section = document.getElementById('hero-stage');
  const initialHeader = document.getElementById('hero-initial-header');
  const navbar = document.getElementById('navbar');
  const statusText = document.getElementById('status-text');

  const photosLayer = document.getElementById('auto-party-photos-layer');
  const videoLayer = document.getElementById('auto-party-video-layer');
  const partySlides = document.querySelectorAll('.party-slide');

  const palco = document.querySelector('.produx-sticky-viewport');
  const moldura = document.getElementById('assembled-master-canvas');
  const letreiro = document.getElementById('hero-sign');
  const textoApoio = document.getElementById('hero-bottom-grid');

  const shards = [
    document.getElementById('pshard-0'),
    document.getElementById('pshard-1'),
    document.getElementById('pshard-2'),
    document.getElementById('pshard-3'),
    document.getElementById('pshard-4'),
    document.getElementById('pshard-5'),
    document.getElementById('pshard-6'),
    document.getElementById('pshard-7')
  ];

  if (!section) return;

  // Dispersão inicial de cada peça: deslocamento, rotação, escala e desfoque.
  // A ordem acompanha o ladrilho definido no CSS (topo → chão).
  const shardConfigs = [
    { tx: -30, ty: -20, tz: -170, rx: 13,  ry: -19, rz: -10, scale: 0.80, maxBlur: 7,  baseOp: 0.55 }, // 0: topo-esq
    { tx: 32,  ty: -22, tz: -190, rx: 15,  ry: 21,  rz: 12,  scale: 0.79, maxBlur: 9,  baseOp: 0.55 }, // 1: topo-dir
    { tx: 0,   ty: -6,  tz: 90,   rx: 0,   ry: 0,   rz: 0,   scale: 0.92, maxBlur: 0,  baseOp: 0.85 }, // 2: LETREIRO — nítido, chega à frente
    { tx: -38, ty: 3,   tz: -230, rx: 0,   ry: -27, rz: -7,  scale: 0.73, maxBlur: 15, baseOp: 0.45 }, // 3: meio-esq
    { tx: 40,  ty: 5,   tz: -250, rx: 0,   ry: 29,  rz: 9,   scale: 0.71, maxBlur: 17, baseOp: 0.45 }, // 4: meio-dir
    { tx: -30, ty: 22,  tz: -195, rx: -14, ry: -16, rz: 9,   scale: 0.78, maxBlur: 10, baseOp: 0.50 }, // 5: baixo-esq
    { tx: 32,  ty: 25,  tz: -210, rx: -16, ry: 18,  rz: -11, scale: 0.76, maxBlur: 12, baseOp: 0.50 }, // 6: baixo-dir
    { tx: 0,   ty: 32,  tz: -150, rx: -21, ry: 0,   rz: 0,   scale: 0.84, maxBlur: 8,  baseOp: 0.55 }  // 7: chão
  ];

  let autoSequenceTimer = null;
  let autoSequenceStarted = false;

  function updateProduxScroll() {
    const rect = section.getBoundingClientRect();
    const windowH = window.innerHeight;
    const totalDistance = rect.height - windowH;

    if (totalDistance <= 0) return;

    const scrolled = -rect.top;
    let progress = scrolled / totalDistance;
    progress = Math.max(0, Math.min(1, progress));

    // ========================================================
    // 1. DESAPARECIMENTO DO CABEÇALHO GIGANTE & SURGIMENTO DA NAVBAR
    // ========================================================
    if (initialHeader) {
      const headerFade = Math.max(0, 1 - progress * 3.2);
      initialHeader.style.opacity = headerFade.toFixed(2);
      initialHeader.style.transform = `translateY(-${(progress * 80).toFixed(1)}px)`;
      initialHeader.style.pointerEvents = headerFade > 0.1 ? 'auto' : 'none';
    }

    if (navbar) {
      if (progress > 0.12) {
        navbar.classList.add('is-visible');
      } else {
        navbar.classList.remove('is-visible');
      }
    }

    // ========================================================
    // 2. MONTAGEM DO QUEBRA-CABEÇA & INTERPOLAÇÃO DE DESFOQUE (BLUR)
    // ========================================================
    // De 0.0 até 0.46: os pedaços focam e se unem perfeitamente.
    // De 0.46 a 0.52 a fachada fica parada e inteira — é o momento em que o
    // letreiro vetorial já pousou em cima do letreiro real.
    const assembleProgress = Math.min(1, progress / 0.46);
    const easeAssemble = suavizarNosDoisLados(assembleProgress);
    const factor = 1 - easeAssemble;

    // A fachada só ACENDE depois que o logotipo vetorial já se apagou (ele
    // some por volta de 0.26 — ver o cálculo de opacidade adiante). Enquanto
    // os dois apareciam juntos, o letreiro da foto e o vetor conviviam quase
    // do mesmo tamanho e o olho lia letra duplicada. Sem sobreposição, não há
    // como fantasmear: um entra quando o outro já saiu.
    const shardFadeIn = limitar((progress - 0.26) / 0.20);

    // Os fragmentos saem ANTES de a moldura começar a alargar (0.556), senão
    // a fachada 9:16 apareceria cortada dentro de uma moldura já em 2:3.
    const shardsFade = progress > 0.52 ? limitar(1 - (progress - 0.52) / 0.036) : 1;

    shards.forEach((shard, idx) => {
      if (!shard) return;
      const cfg = shardConfigs[idx];
      const curTx = cfg.tx * factor;
      const curTy = cfg.ty * factor;
      const curTz = cfg.tz * factor;
      const curRx = cfg.rx * factor;
      const curRy = cfg.ry * factor;
      const curRz = cfg.rz * factor;
      const curScale = cfg.scale + (1 - cfg.scale) * easeAssemble;
      const curBlur = (cfg.maxBlur * factor).toFixed(1);
      
      // Zero opacidade no scroll 0 -> surge suavemente conforme o usuário começa a rolar
      const curOp = shardFadeIn * (cfg.baseOp + (1 - cfg.baseOp) * easeAssemble) * shardsFade;

      shard.style.transform = `translate3d(${curTx.toFixed(1)}vw, ${curTy.toFixed(1)}vh, ${curTz.toFixed(1)}px) rotateX(${curRx.toFixed(1)}deg) rotateY(${curRy.toFixed(1)}deg) rotateZ(${curRz.toFixed(1)}deg) scale(${curScale.toFixed(3)})`;
      shard.style.filter = `blur(${curBlur}px)`;
      shard.style.opacity = curOp.toFixed(2);
      shard.style.visibility = curOp > 0.005 ? 'visible' : 'hidden';
    });

    // ========================================================
    // 3. O ENCAIXE DO LETREIRO
    // ========================================================
    // O logotipo começa grande no centro da tela e vai encolhendo até pousar
    // exatamente sobre o letreiro real da fachada, que os fragmentos acabaram
    // de montar. Depois ele se apaga e deixa o letreiro de verdade no lugar.
    if (letreiro && moldura) {
      const alvo = medirEncaixe();

      if (alvo) {
        // Aproximação com desaceleração suave (expoente 1.5). A cúbica de
        // antes levava o vetor para perto do tamanho final cedo demais e o
        // deixava ali por um bom trecho do scroll — justamente a situação que
        // produz o defeito descrito abaixo.
        const t = limitar((progress - 0.02) / 0.44);
        const encaixe = 1 - Math.pow(1 - t, 1.5);
        const restante = 1 - encaixe; // 1 = tamanho de tela, 0 = pousado
        const escala = 1 + (alvo.escala - 1) * restante;

        letreiro.style.transform =
          `translate(${(alvo.dx * restante).toFixed(1)}px, ${(alvo.dy * restante).toFixed(1)}px) ` +
          `scale(${escala.toFixed(4)})`;

        // A opacidade acompanha a ESCALA, não o scroll: o vetor chega a zero
        // ainda ~68% maior que o letreiro da foto (restante 0.22), e o último
        // trecho do encolhimento acontece já invisível. Combinado com a
        // fachada que só acende a partir de 0.26, os dois nunca aparecem
        // juntos — que é o que produzia a letra duplicada.
        letreiro.style.opacity = limitar((restante - 0.22) / 0.28).toFixed(3);
      }

      letreiro.classList.toggle('is-flutuando', progress < 0.04);
    }

    // ========================================================
    // 4. ABERTURA DA MOLDURA: FACHADA 9:16 -> FOTOS 2:3 -> VÍDEO 16:9
    // ========================================================
    // Cada mídia tem um formato diferente. Em vez de esticar ou cortar, a
    // moldura assume o formato de quem está entrando em cena.
    if (palco) {
      palco.classList.toggle('palco-fotos', progress >= 0.556 && progress < 0.74);
      palco.classList.toggle('palco-video', progress >= 0.74);
    }

    // ========================================================
    // 5. TRANSIÇÃO AUTOMÁTICA DE FOTOS E VÍDEO NO CLÍMAX
    // ========================================================
    if (progress >= 0.55) {
      if (!autoSequenceStarted) {
        startAutoClimaxSequence();
      }

      // Rolando além de 0.74, o vídeo entra direto
      if (progress >= 0.74) {
        if (photosLayer) photosLayer.style.opacity = '0';
        if (videoLayer) videoLayer.style.opacity = '1';
      }
    } else {
      // Se voltar o scroll para cima, reseta o clímax
      autoSequenceStarted = false;
      if (autoSequenceTimer) clearInterval(autoSequenceTimer);
      if (photosLayer) photosLayer.style.opacity = '0';
      if (videoLayer) videoLayer.style.opacity = '0';
    }

    // ========================================================
    // 6. INDICADOR DE STATUS MONOSPAÇADO
    // ========================================================
    if (statusText) {
      const percent = Math.round(progress * 100);
      if (percent >= 74) {
        statusText.textContent = `[ AMBIENTE AURA AO VIVO • SHOWREEL ON ]`;
        statusText.style.color = '#10B981';
      } else if (percent >= 55) {
        statusText.textContent = `[ POR DENTRO DA CASA • FOTOS REAIS ]`;
        statusText.style.color = '#FFC24A';
      } else if (percent >= 46) {
        statusText.textContent = `[ FACHADA COMPLETA • LETREIRO ENCAIXADO ]`;
        statusText.style.color = '#FFC24A';
      } else {
        statusText.textContent = `[ EXPERIÊNCIA AURA • FOCANDO FRAGMENTOS ${percent}% ]`;
        statusText.style.color = '#00F0FF';
      }
    }
  }

  /* Calcula, a partir da geometria real da moldura, o quanto o letreiro
     precisa crescer e se deslocar para preencher a tela no topo da página.
     A caixa do letreiro é derivada das porcentagens (não do getBoundingClientRect
     do próprio elemento), senão a transform já aplicada realimentaria a conta. */
  const RESPIRO_TEXTO = 28; // folga mínima entre o filete e a frase
  const MARGEM_TOPO = 24;   // margem do letreiro para o topo da tela

  function medirEncaixe() {
    const r = moldura.getBoundingClientRect();
    if (!r.width || !r.height) return null;

    const largura = r.width * LETREIRO_NA_FOTO.largura;
    const altura = r.height * LETREIRO_NA_FOTO.altura;
    const centroX = r.left + r.width * LETREIRO_NA_FOTO.x + largura / 2;
    const centroY = r.top + r.height * LETREIRO_NA_FOTO.y + altura / 2;

    // O letreiro é dimensionado pelo espaço que o texto de apoio DEIXA, e não
    // por uma fração fixa da altura da tela. O bloco de texto não encolhe — em
    // telas baixas ele come quase tudo, e uma fração fixa fazia o letreiro
    // passar por cima da frase (chegava a 221px de sobreposição num 320×568,
    // e também quebrava em desktop 1024×768).
    //
    // `offsetTop` em vez de getBoundingClientRect: o cabeçalho do hero recebe
    // um translateY durante a rolagem, e o retângulo medido acompanharia esse
    // deslocamento, fazendo o alvo do letreiro andar sozinho.
    const topoTexto = textoApoio ? textoApoio.offsetTop : window.innerHeight;
    const faixa = Math.max(90, topoTexto - RESPIRO_TEXTO - MARGEM_TOPO);

    const aberto = Math.min(
      window.innerWidth * (window.innerWidth < 768 ? 0.86 : 0.62),
      faixa * PROPORCAO_LOCKUP
    );

    return {
      dx: window.innerWidth / 2 - centroX,
      dy: (MARGEM_TOPO + faixa / 2) - centroY,
      escala: aberto / largura
    };
  }

  // Executa a transição automática e cinematográfica de fotos -> vídeo
  function startAutoClimaxSequence() {
    autoSequenceStarted = true;
    if (photosLayer) photosLayer.style.opacity = '1';

    let currentSlide = 0;
    const totalSlides = partySlides.length;

    // 620ms por foto: rápido o bastante para ter energia de festa, lento o
    // bastante para dar tempo de ver cada uma.
    autoSequenceTimer = setInterval(() => {
      currentSlide++;
      if (currentSlide < totalSlides) {
        partySlides.forEach((slide, sIdx) => {
          slide.classList.toggle('active', sIdx === currentSlide);
        });
      } else {
        // Ao fim das fotos, revela automaticamente o vídeo
        clearInterval(autoSequenceTimer);
        if (photosLayer) photosLayer.style.opacity = '0';
        if (videoLayer) videoLayer.style.opacity = '1';
      }
    }, 620);
  }

  window.addEventListener('scroll', updateProduxScroll, { passive: true });
  window.addEventListener('resize', updateProduxScroll);
  updateProduxScroll();
}

/* --------------------------------------------------------------------------
   3. SHOWREEL VÍDEO & CONTROLE DE ÁUDIO
   -------------------------------------------------------------------------- */
function initShowreelVideo() {
  const video = document.getElementById('ambient-video');
  const btnToggle = document.getElementById('btn-toggle-video');
  const soundIcon = document.getElementById('sound-icon');
  const soundText = document.getElementById('sound-text');

  if (!video) return;

  // Volume de ambientação: o som entra como fundo da cena, não por cima dela.
  const VOLUME_AMBIENTE = 0.3;
  video.volume = VOLUME_AMBIENTE;

  // O vídeo começa mudo (exigência de autoplay dos navegadores), então o
  // ícone precisa refletir isso já no carregamento.
  if (soundIcon) soundIcon.textContent = '🔈';

  video.play().catch(() => {});

  if (btnToggle) {
    btnToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });
  }

  video.addEventListener('click', () => {
    toggleAudio();
  });

  function toggleAudio() {
    if (video.muted) {
      video.muted = false;
      video.volume = VOLUME_AMBIENTE;
      if (soundIcon) soundIcon.textContent = '🔊';
      if (soundText) soundText.textContent = '[ DESATIVAR SOM DA FESTA ]';
      if (btnToggle) btnToggle.style.borderColor = '#10B981';
    } else {
      video.muted = true;
      if (soundIcon) soundIcon.textContent = '🔈';
      if (soundText) soundText.textContent = '[ ATIVAR SOM DA FESTA ]';
      if (btnToggle) btnToggle.style.borderColor = '#00F0FF';
    }
  }

  // Fora da tela o vídeo pausa: economiza bateria e evita o som continuar
  // tocando de uma cena que o visitante já deixou para trás.
  if ('IntersectionObserver' in window) {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.15 });

    observador.observe(video);
  }
}

/* --------------------------------------------------------------------------
   4. GALERIA HORIZONTAL COMANDADA PELA ROLAGEM
   --------------------------------------------------------------------------
   A seção gruda na tela e as fotos correm para o lado enquanto a página desce.
   Não há sequestro de rolagem: é a técnica do `position: sticky`, então parar
   de rolar para a galeria e continuar rolando sai dela normalmente.

   No toque isso é desligado. Arrastar o dedo para o lado já é o gesto natural
   para uma fila de fotos, e prender a rolagem vertical num celular custa mais
   do que entrega — no 390px de largura o percurso passaria de duas telas e
   meia só de fotos.
   -------------------------------------------------------------------------- */
function initGaleriaHorizontal() {
  const secao = document.getElementById('galeria');
  const palco = document.getElementById('galeria-palco');
  const trilho = document.getElementById('galeria-trilho');
  const esteira = document.getElementById('galeria-esteira');
  const barra = document.getElementById('galeria-barra');

  if (!secao || !palco || !trilho || !esteira) return;

  const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  let percurso = 0;
  let ativo = false;

  function medir() {
    // Vale em qualquer largura. Só quem pediu movimento reduzido no sistema
    // continua com o arraste lateral nativo.
    ativo = !movimentoReduzido.matches;
    secao.classList.toggle('modo-fixo', ativo);

    if (!ativo) {
      palco.style.height = '';
      esteira.style.transform = '';
      return;
    }

    // Zera qualquer rolagem lateral herdada do modo de arraste, senão ela se
    // soma ao deslocamento por transform e a primeira foto entra deslocada.
    trilho.scrollLeft = 0;

    // Quanto a fila de fotos excede a largura visível — é esse o trajeto.
    percurso = Math.max(0, esteira.scrollWidth - trilho.clientWidth);

    // Quanto de rolagem vertical o trajeto consome. No desktop é 1:1, que dá
    // a sensação de arrastar com a própria mão. No celular a fila é bem mais
    // longa que a tela, e 1:1 prenderia a rolagem por quase duas telas — aqui
    // o trajeto é comprimido para caber em pouco mais de uma.
    const teto = window.innerHeight * 1.2;
    const rolagem = Math.min(percurso, Math.max(teto, percurso * 0.55));

    palco.style.height = (window.innerHeight + rolagem) + 'px';
    posicionar();
  }

  function posicionar() {
    if (!ativo) return;

    const r = palco.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    if (total <= 0) return;

    const p = limitar(-r.top / total);
    esteira.style.transform = `translate3d(${(-percurso * p).toFixed(1)}px, 0, 0)`;
    if (barra) barra.style.transform = `scaleX(${Math.max(0.06, p).toFixed(3)})`;
  }

  window.addEventListener('scroll', posicionar, { passive: true });
  window.addEventListener('resize', medir);
  movimentoReduzido.addEventListener('change', medir);

  // As fotos têm largura fixa em CSS, então dá para medir antes delas
  // carregarem; ainda assim remedimos no load para cobrir mudança de fonte.
  medir();
  window.addEventListener('load', medir);
}

/* --------------------------------------------------------------------------
   5. ACORDEÃO DO FAQ PRODUX
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const triggers = document.querySelectorAll('.accordion-trigger');

  triggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      const isOpen = item.classList.contains('is-open');

      document.querySelectorAll('.accordion-item').forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.accordion-trigger')?.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   6. NAVEGAÇÃO SUAVE COM OFFSET DO HEADER
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 75;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}
