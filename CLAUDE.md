# CLAUDE.md - Contexto & Instruções de IA para AURA MOCOCA

Este arquivo serve como contexto mestre (System Prompt / Context Memory) para qualquer agente de IA ou desenvolvedor que atue no projeto da **AURA MOCOCA** (desenvolvimento do website oficial em HTML/CSS/JS, sistema de bilhetagem própria, painel administrativo, marketing e atendimento ao cliente).

---

## 🚀 Padrão de Design & UI/UX Oficial: PRODUX Design

> **Referência Oficial de Design:** [https://www.produx.design/](https://www.produx.design/)  
> **Filosofia Central:** *"Design that Speaks — You feel the brand before it speaks®"*

Todo o design digital, interfaces, interações e fluxos do website oficial da **AURA MOCOCA** seguem rigorosamente a arquitetura visual, tipográfica e de micro-interações do **PRODUX Design**.

---

## 📐 Arquitetura Completa da Página Oficial (Jornada do Usuário)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. CABEÇALHO FIXO COM MIX-BLEND-DIFFERENCE (PRODUX HEADER)               │
│    • Logo AURA à esquerda                                                │
│    • Links Monospace: [ HOME ] [ SHOWS ] [ INGRESSOS ] [ AVALIAÇÕES ] [ SUPORTE ]
├──────────────────────────────────────────────────────────────────────────┤
│ 2. HERO COM SPLIT TYPOGRAPHY & SCROLL MORPHING (PRODUX HERO)             │
│    • Título: "A experiência noturna definitiva em Mococa®"               │
│    • Descrição Monospace em DM Mono com tag [ ↓ scroll para entrar ]     │
│    • 4 letras neon [ A ] - [ U ] - [ R ] - [ A ] aproximam e se encaixam │
│      sobre a FOTO REAL 4K DA FACHADA NOTURNA ILUMINADA                   │
├──────────────────────────────────────────────────────────────────────────┤
│ 3. REVELAÇÃO DO VÍDEO SHOWREEL (AMBIENTE & PISTA)                        │
│    • Vídeo imersivo contínuo da atmosfera da casa, lasers, DJ e drinks   │
│    • Botão flutuante Produx: [ 🔊 Ativar Som / Play Reel ]               │
├──────────────────────────────────────────────────────────────────────────┤
│ 4. BARRA DE CONVERSÃO RÁPIDA (CHECKOUT DIRETO NO SITE)                   │
│    • [ 🎟️ GARANTIR INGRESSO OFICIAL • COMPRA SEGURA VIA PIX & CARTÃO ]   │
├──────────────────────────────────────────────────────────────────────────┤
│ 5. AGENDA DE SHOWS & NOVIDADES (LINEUP DINÂMICO)                         │
│    • Card Oficial: Show Lorenah (22/08) - Sertanejo + Funk Premium       │
│    • Próximos Sábados / Atrações Futuras Agendadas ("No Pente")          │
│    • Botão de compra direta e contagem regressiva por show               │
├──────────────────────────────────────────────────────────────────────────┤
│ 6. CARROSSEL DE BEBIDAS & MARCAS PREMIUM (ESTILO PRODUX MARCAS)          │
│    • Faixa minimalista em loop: Red Bull, Tanqueray, Absolut, Cîroc,     │
│      Black Label, Heineken, Corona.                                      │
├──────────────────────────────────────────────────────────────────────────┤
│ 7. SETORES & EXPERIÊNCIA VIP                                             │
│    • Comparativo: Pista Geral vs Camarotes Privativos & Mesas Bistrô     │
│    • Solicitação de reserva de camarotes via WhatsApp direto             │
├──────────────────────────────────────────────────────────────────────────┤
│ 8. SATISFAÇÃO DOS CLIENTES (PRODUX GOOGLE REVIEWS)                       │
│    • Badge [ 5.0 ★★★★★ ] no Google Maps • Depoimentos e Fotos de Clientes│
│    • Tags técnicas em DM Mono: [cliente verificado], [som e luzes]       │
├──────────────────────────────────────────────────────────────────────────┤
│ 9. FAQ RÁPIDO & REGRAS DA CASA (ACORDEÃO PRODUX)                         │
│    • Idade mínima (18+), Documentos aceitos (RG/CNH), Dress code, etc.   │
├──────────────────────────────────────────────────────────────────────────┤
│ 10. LOCALIZAÇÃO, MAPA & RODAPÉ EDITORIAL                                 │
│     • Av. João Batista Lima Figueiredo, 2707 - Jardim Santa Cecília      │
│     • Botão "Abrir no Google Maps" e dados da casa                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🖱️ Recursos Interativos de Destaque

1. **Cursor Magnético Produx:**
   - Cursor suave que segue o mouse e exibe dinamicamente etiquetas como `[ COMPRAR ]`, `[ VER ]`, `[ PLAY ]`.
2. **Botão Flutuante de WhatsApp:**
   - Botão minimalista escuro com borda neon para atendimento imediato e reservas de camarote.

---

## 🎟️ Sistema de Venda Direta de Ingressos (Checkout Integrado)

1. **Fluxo do Comprador:**
   - O visitante clica em *"Garantir Ingresso"*.
   - Abre um *drawer* / modal escuro com vidro fosco (*glassmorphism*).
   - O cliente seleciona o setor (**Pista**, **Camarote**, **Bistrô**) e a quantidade (1 a 10).
   - Informa dados básicos: Nome Completo, CPF, E-mail e WhatsApp.
   - Escolhe a forma de pagamento:
     - **PIX:** Geração instantânea do QR Code + Código Copia e Cola.
     - **Cartão de Crédito:** Parcelamento transparente em até 10x.
2. **Emissão e Envio Automático do Ingresso:**
   - **Na Tela:** Exibição imediata do ingresso oficial com **QR Code exclusivo** para leitura na portaria e botão *"Salvar no Celular"*.
   - **No E-mail:** Disparo automático do voucher com o QR Code e instruções de chegada.
   - **No WhatsApp:** Envio do link do ingresso via mensagem direta.

---

## ⚙️ Painel Administrativo do Dono (`/admin`)

- **Gestão do Show Ativo:** Trocar nome da atração, data e foto do flyer.
- **Fila de Shows ("No Pente"):** Cadastro antecipado do próximo sábado com ativação em 1 clique.
- **Gestão de Lotes & Preços:** 1º Lote, 2º Lote, Portaria e pausa rápida (*Sold Out*).
- **Métricas:** Contador em tempo real de ingressos emitidos e faturamento.

---

## 🎨 Diretrizes Tipográficas e Cromáticas (Produx Matrix)

- **LOGOTIPO "AURA": `Italiana` peso 400 — não trocar.** É a letra do letreiro
  da entrada, confirmada na foto 4K da fachada e na arte vetorial do flyer. Tem
  modulação de traço (diagonal esquerda do "A" fina, direita cheia); fontes
  geométricas uniformes erram o desenho. Só existe no peso 400 — nunca pedir
  200/300 nem aplicar `bold`. Fallback em tamanhos pequenos: `Tenor Sans`.
  O emblema é SVG vetorial: três anéis + "A" de duas lâminas + ponto central.
  Detalhes e coordenadas em `informações/identidade_visual.md`.
- **Tipografia Monospaçada:** `DM Mono` (UPPERCASE, `[ HOME ]`, `[ 01 // LINEUP ]`, `-rotate-2deg`, `backdrop-blur-md`).
- **Display & Títulos:** `Montserrat Black` (leading compacto `leading-[1.1]`, split-word animations).
- **Corpo de Texto:** `Inter` / `Plus Jakarta Sans`.
- **Cores Principais:** Outer Space Matte (`#08090C` e `#11141D`), White Smoke (`#F2F2F2`), Slate Grey (`#8A9099`), Aura Electric Cyan (`#00F0FF`), Sunset Orange (`#EA560D`).
- **Neon da fachada (amostrado da foto real):** núcleo `#FFF4D6`, corpo dourado
  `#FFC24A`, difusão âmbar `#FF8A0F`, LED azul cobalto `#1E4DFF`. São os tons do
  letreiro físico — usar estes no logotipo, não o `#FFB800` genérico.

## 🖼️ Regra da moldura do hero

Três mídias passam pela mesma moldura e **cada uma tem um formato diferente**:
fachada `9:16` (2340×4160) → fotos da casa `2:3` → vídeo `16:9` (1920×1080).
A moldura muda de proporção junto com o conteúdo (`.palco-fotos` / `.palco-video`),
para que nada seja esticado nem cortado. Ao trocar qualquer mídia, conferir se a
proporção do arquivo bate com o estado correspondente no CSS.

Fotos da casa ficam em `imagens/galeria/aura-01..07.jpg`, já recortadas em 2:3
sem as setas e os pontinhos da interface do Instagram. Os PNGs originais em
`imagens/Screenshot_*.png` foram mantidos como acervo.

### ⚠️ Regra dos fragmentos do quebra-cabeça

Os 8 `.puzzle-shard` carregam **a mesma foto** e só diferem pelo `clip-path`.
Por isso os recortes **não podem se sobrepor**: onde dois recortes cobrem o
mesmo pedaço da imagem, esse pedaço é desenhado duas vezes em posições
diferentes durante a montagem, e o letreiro sai duplicado ("AAURRAA"). No
repouso todos coincidem e o defeito desaparece — o que faz ele passar batido
em revisão estática. **Sempre conferir a montagem em movimento, não parada.**

O ladrilho atual é em faixas horizontais, e a faixa de 28%–46% (onde ficam
emblema, nome e filete) é uma peça única de largura total: o letreiro chega
inteiro, nunca partido ao meio.

Pela mesma razão, o logotipo vetorial do hero termina de se apagar (~scroll
0.26) **antes** de a fachada começar a acender (0.26 → 0.46). Vetor e foto do
mesmo letreiro nunca aparecem juntos.

## 🖼️ Galeria "A AURA por dentro"

Tem dois modos, escolhidos pelo JS em `initGaleriaHorizontal()`:

- **Desktop (> 768px, sem movimento reduzido):** a seção ganha a classe
  `modo-fixo`, gruda na tela via `position: sticky` e as fotos correm na
  horizontal conforme a página desce. A altura do palco é calculada para que
  1px de rolagem vertical = 1px de deslocamento lateral. Não há sequestro de
  rolagem — parar de rolar sai da seção normalmente.
- **Celular e movimento reduzido:** arraste lateral nativo. Prender a rolagem
  vertical no toque custaria mais de duas telas e meia só de fotos.

Dois detalhes que já quebraram e não são óbvios:

1. **Nada de `overflow` em ancestral da faixa fixa** — qualquer `overflow`
   (mesmo `hidden`) num pai quebra o `position: sticky`. O recorte fica só em
   `.galeria-trilho`, que é filho da faixa.
2. **`scroll-padding-left` tem de espelhar o `padding-left` da esteira.** Com
   `scroll-snap-type: x mandatory`, o encaixe rola o contêiner até grudar a
   primeira foto na borda e anula o recuo, desalinhando a foto do título.
   Também: `max()` dentro do atalho `padding` não é aplicado — usar longhand.

---

## 🖼️ Mídia Principal & Imagem 4K do Scroll:
- **Foto 4K da Fachada Noturna (Google CDN - 2340x4160):**
  `https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkZXZqrc0T8ZFoYeSekOSNtFShWifl80QMZGs9dNgdcvbxF_pRSiF8lkLHud2gzpC8YEO_f-kTqAHIyeWPar6njVh0Nzv5w2AOVsXwsCdW63bDB-znWMW04p5n1yxvI7-ZAC_4o-Funhn4=s0`
- **Flyer Oficial Lorenah in Aura (2048x2048):**
  `https://res.cloudinary.com/htkavmx5a/image/upload/v1786630554/hq6bthf6gky5eyqeqp44.jpg`
