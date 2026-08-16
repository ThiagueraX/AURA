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
  initActiveNavHighlight();
  initTransparentWhiteLogos();
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
    { tx: -30, ty: -20, tz: -170, rx: 13, ry: -19, rz: -10, scale: 0.80, maxBlur: 7, baseOp: 0.55 }, // 0: topo-esq
    { tx: 32, ty: -22, tz: -190, rx: 15, ry: 21, rz: 12, scale: 0.79, maxBlur: 9, baseOp: 0.55 }, // 1: topo-dir
    { tx: 0, ty: -6, tz: 90, rx: 0, ry: 0, rz: 0, scale: 0.92, maxBlur: 0, baseOp: 0.85 }, // 2: LETREIRO — nítido, chega à frente
    { tx: -38, ty: 3, tz: -230, rx: 0, ry: -27, rz: -7, scale: 0.73, maxBlur: 15, baseOp: 0.45 }, // 3: meio-esq
    { tx: 40, ty: 5, tz: -250, rx: 0, ry: 29, rz: 9, scale: 0.71, maxBlur: 17, baseOp: 0.45 }, // 4: meio-dir
    { tx: -30, ty: 22, tz: -195, rx: -14, ry: -16, rz: 9, scale: 0.78, maxBlur: 10, baseOp: 0.50 }, // 5: baixo-esq
    { tx: 32, ty: 25, tz: -210, rx: -16, ry: 18, rz: -11, scale: 0.76, maxBlur: 12, baseOp: 0.50 }, // 6: baixo-dir
    { tx: 0, ty: 32, tz: -150, rx: -21, ry: 0, rz: 0, scale: 0.84, maxBlur: 8, baseOp: 0.55 }  // 7: chão
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
    // Montagem suave e dinâmica dos fragmentos
    const assembleProgress = Math.min(1, progress / 0.42);
    const easeAssemble = suavizarNosDoisLados(assembleProgress);
    const factor = 1 - easeAssemble;

    // Os fragmentos começam a surgir suavemente logo no início do scroll
    const shardFadeIn = limitar((progress - 0.03) / 0.25);

    // Os fragmentos se despedem quando a moldura começa a se abrir para as fotos
    const shardsFade = progress > 0.46 ? limitar(1 - (progress - 0.46) / 0.07) : 1;

    const isMobile = window.innerWidth <= 768;
    const mobileFilterMod = isMobile ? ' brightness(1.22) contrast(1.08) saturate(1.12)' : '';

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

      // Surge suavemente conforme o usuário começa a rolar
      const curOp = shardFadeIn * (cfg.baseOp + (1 - cfg.baseOp) * easeAssemble) * shardsFade;

      shard.style.transform = `translate3d(${curTx.toFixed(1)}vw, ${curTy.toFixed(1)}vh, ${curTz.toFixed(1)}px) rotateX(${curRx.toFixed(1)}deg) rotateY(${curRy.toFixed(1)}deg) rotateZ(${curRz.toFixed(1)}deg) scale(${curScale.toFixed(3)})`;
      shard.style.filter = `blur(${curBlur}px)${mobileFilterMod}`;
      shard.style.opacity = curOp.toFixed(2);
      shard.style.visibility = curOp > 0.005 ? 'visible' : 'hidden';
    });

    // ========================================================
    // 3. O ENCAIXE DO LETREIRO
    // ========================================================
    if (letreiro && moldura) {
      const alvo = medirEncaixe();

      if (alvo) {
        const t = limitar((progress - 0.01) / 0.42);
        const encaixe = 1 - Math.pow(1 - t, 1.5);
        const restante = 1 - encaixe; // 1 = tamanho de tela, 0 = pousado
        const escala = 1 + (alvo.escala - 1) * restante;

        letreiro.style.transform =
          `translate(${(alvo.dx * restante).toFixed(1)}px, ${(alvo.dy * restante).toFixed(1)}px) ` +
          `scale(${escala.toFixed(4)})`;

        letreiro.style.opacity = limitar((restante - 0.12) / 0.40).toFixed(3);
      }

      letreiro.classList.toggle('is-flutuando', progress < 0.04);
    }

    // ========================================================
    // 4. ABERTURA DA MOLDURA: FACHADA 9:16 -> FOTOS 2:3 -> VÍDEO 16:9
    // ========================================================
    if (palco) {
      palco.classList.toggle('palco-fotos', progress >= 0.46 && progress < 0.74);
      palco.classList.toggle('palco-video', progress >= 0.74);
    }

    // ========================================================
    // 5. TRANSIÇÃO AUTOMÁTICA DE FOTOS E VÍDEO NO CLÍMAX
    // ========================================================
    if (progress >= 0.44) {
      if (!autoSequenceStarted) {
        startAutoClimaxSequence();
      }

      if (progress >= 0.74) {
        if (photosLayer) photosLayer.style.opacity = '0';
        if (videoLayer) videoLayer.style.opacity = '1';
      } else {
        if (photosLayer) photosLayer.style.opacity = '1';
      }
    } else {
      autoSequenceStarted = false;
      if (autoSequenceTimer) clearInterval(autoSequenceTimer);
      if (photosLayer) photosLayer.style.opacity = '0';
      if (videoLayer) videoLayer.style.opacity = '0';
    }

    // ========================================================
    // 6. BOTÕES FLUTUANTES (WHATSAPP E PORTARIA)
    // Aparecem SOMENTE após passar o scroll da introdução (hero),
    // liberando a visualização da frase e indicador sem sobreposição.
    // ========================================================
    const btnZap = document.getElementById('btn-whatsapp-float');
    const btnPortaria = document.getElementById('btn-portaria-float');
    const deveMostrarFlutuantes = progress > 0.85 || rect.bottom <= windowH + 40;

    if (btnZap) btnZap.classList.toggle('is-visible', deveMostrarFlutuantes);
    if (btnPortaria) btnPortaria.classList.toggle('is-visible', deveMostrarFlutuantes);

  }

  /* Calcula a geometria para o letreiro preencher a tela */
  function medirEncaixe() {
    const r = moldura.getBoundingClientRect();
    if (!r.width || !r.height) return null;

    const largura = r.width * LETREIRO_NA_FOTO.largura;
    const altura = r.height * LETREIRO_NA_FOTO.altura;
    const centroX = r.left + r.width * LETREIRO_NA_FOTO.x + largura / 2;
    const centroY = r.top + r.height * LETREIRO_NA_FOTO.y + altura / 2;

    const isMobile = window.innerWidth <= 768;
    const margemTopo = isMobile ? 24 : 40;
    const vertLivre = window.innerHeight * (isMobile ? 0.58 : 0.65);

    // No celular o logotipo AURA fica bem amplo, nítido e centralizado
    const aberto = isMobile
      ? Math.min(window.innerWidth * 0.92, vertLivre * 1.55)
      : Math.min(window.innerWidth * 0.65, Math.max(120, vertLivre) * PROPORCAO_LOCKUP);

    const alturaAberta = aberto / PROPORCAO_LOCKUP;
    // Centro óptico elevado para deixar espaço livre e respiro abaixo
    const topoGrupo = Math.max(margemTopo, (window.innerHeight * (isMobile ? 0.35 : 0.40)) - (alturaAberta / 2));

    return {
      dx: window.innerWidth / 2 - centroX,
      dy: (topoGrupo + alturaAberta / 2) - centroY,
      escala: aberto / largura
    };
  }

  // Executa a transição automática e cinematográfica de fotos -> vídeo
  function startAutoClimaxSequence() {
    autoSequenceStarted = true;
    if (photosLayer) photosLayer.style.opacity = '1';

    let currentSlide = 0;
    const totalSlides = partySlides.length;

    // Duração equilibrada para apreciar as fotos da balada
    const slideDuration = window.innerWidth <= 768 ? 700 : 620;
    autoSequenceTimer = setInterval(() => {
      currentSlide++;
      if (currentSlide < totalSlides) {
        partySlides.forEach((slide, sIdx) => {
          slide.classList.toggle('active', sIdx === currentSlide);
        });
      } else {
        clearInterval(autoSequenceTimer);
        if (photosLayer) photosLayer.style.opacity = '0';
        if (videoLayer) videoLayer.style.opacity = '1';
      }
    }, slideDuration);
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

  if (!video) return;

  // Volume de ambientação: o som entra como fundo da cena, não por cima dela.
  const VOLUME_AMBIENTE = 0.3;
  video.volume = VOLUME_AMBIENTE;

  // O vídeo começa mudo (exigência de autoplay dos navegadores), então o
  // ícone precisa refletir isso já no carregamento.
  if (soundIcon) soundIcon.textContent = '🔈';

  video.play().catch(() => { });

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
      if (btnToggle) btnToggle.style.borderColor = '#10B981';
    } else {
      video.muted = true;
      if (soundIcon) soundIcon.textContent = '🔈';
      if (btnToggle) btnToggle.style.borderColor = 'var(--neon-ouro)';
    }
  }

  // Fora da tela o vídeo pausa: economiza bateria e evita o som continuar
  // tocando de uma cena que o visitante já deixou para trás.
  if ('IntersectionObserver' in window) {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          video.play().catch(() => { });
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
function initTrilhoHorizontal(secaoId, palcoId, trilhoId, esteiraId, barraId, modoClass) {
  const secao = document.getElementById(secaoId);
  const palco = document.getElementById(palcoId);
  const trilho = document.getElementById(trilhoId);
  const esteira = document.getElementById(esteiraId);
  const barra = document.getElementById(barraId);

  if (!secao || !palco || !trilho || !esteira) return;

  const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  let percurso = 0;
  let ativo = false;

  function medir() {
    ativo = !movimentoReduzido.matches;
    secao.classList.toggle(modoClass, ativo);

    if (!ativo) {
      palco.style.height = '';
      esteira.style.transform = '';
      return;
    }

    trilho.scrollLeft = 0;
    percurso = Math.max(0, esteira.scrollWidth - trilho.clientWidth);

    const isMobile = window.innerWidth <= 740;
    const rolagem = isMobile ? Math.max(window.innerHeight * 1.6, percurso * 0.92) : percurso;

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

  medir();
  window.addEventListener('load', medir);
}

function initGaleriaHorizontal() {
  initTrilhoHorizontal('galeria', 'galeria-palco', 'galeria-trilho', 'galeria-esteira', 'galeria-barra', 'modo-fixo');
  initTrilhoHorizontal('reviews', 'reviews-palco', 'reviews-trilho', 'reviews-esteira', 'reviews-barra', 'modo-fixo-reviews');
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

/* --------------------------------------------------------------------------
   7. DESTAQUE DE SEÇÃO ATIVA NA NAVBAR (SCROLL SPY)
   --------------------------------------------------------------------------
   Detecta qual seção está visível na tela e aplica a classe `is-active` no
   link correspondente da navbar. Usa as âncoras do menu para mapear as IDs.
   -------------------------------------------------------------------------- */
function initActiveNavHighlight() {
  const navItems = document.querySelectorAll('.navbar-nav .nav-item');
  if (!navItems.length) return;

  // Mapeia cada href para o item de navegação
  const sectionMap = [];
  navItems.forEach((item) => {
    const href = item.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (target) {
      sectionMap.push({ el: target, navItem: item, id: href });
    }
  });

  if (!sectionMap.length) return;

  let activeId = null;

  function updateActiveSection() {
    const scrollY = window.scrollY;
    const headerOffset = 120; // altura da navbar + margem
    let current = null;

    // Percorre de baixo para cima: a primeira seção cujo topo já passou
    // pela linha do header é a ativa
    for (let i = sectionMap.length - 1; i >= 0; i--) {
      const rect = sectionMap[i].el.getBoundingClientRect();
      if (rect.top <= headerOffset) {
        current = sectionMap[i].id;
        break;
      }
    }

    // Se está no topo absoluto da página, nenhuma seção está ativa
    if (scrollY < 200) current = null;

    if (current !== activeId) {
      activeId = current;
      navItems.forEach((item) => {
        const href = item.getAttribute('href');
        item.classList.toggle('is-active', href === activeId);
      });
    }
  }

  window.addEventListener('scroll', updateActiveSection, { passive: true });
  updateActiveSection();
}

/* --------------------------------------------------------------------------
   8. INTEGRAÇÃO ORGÂNICA DOS LOGOS (REMOÇÃO AUTOMÁTICA DE FUNDO BRANCO)
   -------------------------------------------------------------------------- */
function initTransparentWhiteLogos() {
  const images = document.querySelectorAll('.brand-logo-img');
  images.forEach((img) => {
    function process() {
      if (img.dataset.bgCleaned) return;
      img.dataset.bgCleaned = 'true';
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        if (!canvas.width || !canvas.height) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        // Detecta se a imagem tem cantos brancos/claros (fundo retangular sólido)
        const cantoTopoEsq = (d[0] > 200 && d[1] > 200 && d[2] > 200);
        const cantoTopoDir = (d[(canvas.width - 1) * 4] > 200 && d[(canvas.width - 1) * 4 + 1] > 200 && d[(canvas.width - 1) * 4 + 2] > 200);
        const temFundoBranco = cantoTopoEsq || cantoTopoDir || img.src.includes('absolut');

        if (temFundoBranco) {
          for (let i = 0; i < d.length; i += 4) {
            // Se o pixel for claro/branco (fundo), torna 100% transparente
            if (d[i] > 205 && d[i + 1] > 205 && d[i + 2] > 205) {
              d[i + 3] = 0;
            }
          }
          ctx.putImageData(imgData, 0, 0);
          img.src = canvas.toDataURL('image/png');
        }
      } catch (e) {
        console.warn('[Brands] Processamento de transparência de logo:', e);
      }
    }

    if (img.complete && img.naturalWidth > 0) {
      process();
    } else {
      img.addEventListener('load', process);
    }
  });
}

// Sincronização automática entre abas quando o Admin salva novos preços ou shows
window.addEventListener('storage', (e) => {
  if (e.key === 'aura_admin_config_v1' && typeof loadAdminConfig === 'function') {
    loadAdminConfig();
  }
});



