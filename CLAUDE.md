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

- **Qualquer largura, sem movimento reduzido:** a seção ganha a classe
  `modo-fixo`, gruda na tela via `position: sticky` e as fotos correm na
  horizontal conforme a página desce. Não há sequestro de rolagem — parar de
  rolar sai da seção normalmente. No celular o percurso é comprimido
  (`Math.max(teto, percurso * 0.55)`, fotos em 56vw) para que a seção prenda
  a rolagem por pouco mais de uma tela, e não pelas duas e meia que o
  percurso cheio custaria.
- **Movimento reduzido:** arraste lateral nativo, sem `modo-fixo`.

Dois detalhes que já quebraram e não são óbvios:

1. **Nada de `overflow` em ancestral da faixa fixa** — qualquer `overflow`
   (mesmo `hidden`) num pai quebra o `position: sticky`. O recorte fica só em
   `.galeria-trilho`, que é filho da faixa.
2. **`scroll-padding-left` tem de espelhar o `padding-left` da esteira.** Com
   `scroll-snap-type: x mandatory`, o encaixe rola o contêiner até grudar a
   primeira foto na borda e anula o recuo, desalinhando a foto do título.
   Também: `max()` dentro do atalho `padding` não é aplicado — usar longhand.

---

---

## 🔐 Arquitetura de dados & permissões (Supabase)

Projeto `sgfyxmajpdgynsicmzdb`. **O navegador não escreve mais direto nas
tabelas.** Tudo que envolve dinheiro, dado de cliente ou validação de entrada
passa por função no banco (`SECURITY DEFINER`), que confere permissão no
servidor.

### Papéis
`aura_equipe` liga `auth.users` a um papel: `dono` ou `portaria`.
`aura_papel()` devolve o papel do usuário logado. Não existe mais senha
escrita no JS — quem confere é o Supabase Auth.

### Funções expostas

| Função | Quem chama | Faz |
|---|---|---|
| `aura_criar_pedido` | qualquer visitante | Cria pedido + ingressos numa transação. **Preço vem de `aura_lotes`**, não do navegador. Nasce `PENDENTE`. |
| `aura_buscar_voucher` | qualquer visitante | Devolve **um** ingresso pelo código, sem CPF. |
| `aura_validar_ingresso` | `dono`/`portaria` | UPDATE condicional (`and status = 'DISPONIVEL'`): o banco arbitra a corrida. Recusa se o pedido não estiver `APROVADO`. |
| `aura_confirmar_pagamento` | `dono` | Único caminho que torna um ingresso válido. |
| `aura_cancelar_pedido` | `dono` | Cancela e devolve as vagas ao lote. |
| `aura_pedidos_pendentes`, `aura_metricas`, `aura_resumo_portaria` | `dono` (as duas primeiras) / equipe | Sempre filtradas por show. |

### Três armadilhas que já morderam aqui

1. **`coalesce` na guarda de permissão.** `aura_papel() <> 'dono'` é **NULL**
   para visitante anônimo, e `if NULL` não dispara — a guarda passava batido.
   Sempre `coalesce(aura_papel(), '') <> 'dono'`.

2. **`revoke from public` ≠ `revoke from anon`.** O Supabase concede EXECUTE a
   `anon` automaticamente em toda função nova (default privileges). Revogar de
   `PUBLIC` não desfaz uma concessão explícita ao papel `anon`. Toda função de
   equipe precisa de `revoke all on function ... from anon`.

3. **Política RLS que filtra por `coluna IS NOT NULL`** numa coluna
   obrigatória é `USING (true)` disfarçado. Era assim que as políticas
   chamadas "Blindagem" liberavam a tabela inteira.

E uma consequência prática: **RLS não dá erro quando bloqueia um UPDATE — ela
devolve zero linhas com HTTP 200.** Todo `PATCH` precisa conferir se o array
retornado tem tamanho > 0, senão o painel exibe "salvo com sucesso" sem ter
salvado nada (foi o que aconteceu com preços durante semanas).

### O que ainda depende do dono, não do sistema

O pagamento não tem gateway: o PIX cai direto na conta da casa. Por isso o
pedido nasce `PENDENTE` e o QR **não abre a portaria** até o dono conferir o
valor no app do banco e clicar em "Recebi o PIX" na aba Pagamentos. É esse
clique — e não o checkout — que emite entrada válida.

---

## 🎟️ Regras do checkout que não podem regredir

Estas quatro invariantes vieram de defeitos reais que chegaram a estar no ar.
Cada uma tem teste em `teste_checkout.mjs` (Chrome headless com o `AuraDB`
simulado).

0. **Um scanner só.** A portaria vive em `portaria.html`. Existiu uma cópia
   embutida no `index.html` que divergiu da original; ela foi removida junto
   com a biblioteca de leitura de QR (100KB+) da página pública. Não
   reintroduzir.

1. **Um botão, um handler.** Nenhum botão do checkout pode ter `onclick` no
   HTML *e* `addEventListener` no JS ao mesmo tempo — o `onclick` roda primeiro,
   não passa pelas travas, e o clique vira duas compras. Todos os botões com
   listener em `initCheckoutEvents()` tiveram o `onclick` removido. A trava de
   verdade mora dentro de `emitDigitalTicket()` (`checkoutState.emitindo`), não
   no botão, para valer também em toque duplo e chamada solta.

2. **Emissão falha fechada.** Se `savePedido` ou `saveIngressos` não concluir,
   o cliente **não** vê a tela de sucesso — fica no pagamento com o motivo em
   `#checkout-erro`. Não existe mais código de ingresso gerado localmente: um
   QR que não está no banco só é descoberto na portaria, com o cliente na fila.
   Quando o pedido grava mas os ingressos não, a mensagem entrega o
   `codigo_pedido` para emissão manual.

3. **Um QR por ingresso.** `checkoutState.codigosValidadores` é uma lista.
   A tela e o WhatsApp renderizam todos. Mostrar só o primeiro fazia o segundo
   a entrar ser barrado como "já utilizado" enquanto o ingresso dele estava
   intacto no banco.

4. **Compra nova começa zerada.** `openCheckout()` chama
   `limparEmissaoAnterior()` e `limparDadosDoCliente()`. Sem isso, num caixa
   compartilhado, o código do comprador anterior sobrevive em memória e é
   entregue ao próximo cliente se a gravação dele falhar.

**Portaria:** o card de resultado é mostrado/escondido pela classe
`status-*`, nunca por `style.display` inline — estilo inline vence a folha e
travava o card invisível da segunda leitura em diante. E todo `AudioContext`
precisa de `resume()` antes do bipe: no celular ele nasce suspenso e a leitura
do QR não conta como gesto do usuário.

---

## 🖼️ Mídia Principal & Imagem 4K do Scroll:
- **Foto 4K da Fachada Noturna (Google CDN - 2340x4160):**
  `https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkZXZqrc0T8ZFoYeSekOSNtFShWifl80QMZGs9dNgdcvbxF_pRSiF8lkLHud2gzpC8YEO_f-kTqAHIyeWPar6njVh0Nzv5w2AOVsXwsCdW63bDB-znWMW04p5n1yxvI7-ZAC_4o-Funhn4=s0`
- **Flyer Oficial Lorenah in Aura (2048x2048):**
  `https://res.cloudinary.com/htkavmx5a/image/upload/v1786630554/hq6bthf6gky5eyqeqp44.jpg`
