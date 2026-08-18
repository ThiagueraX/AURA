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

> **Painel do dono:** ver a seção `⚙️ Painel do Dono — admin.html, e só ele`,
> mais abaixo. Resumo: gestão do show ativo e do próximo, preço e capacidade
> por setor gravados em `aura_lotes`, pausa de vendas no banco, fila de PIX
> pendentes e métricas em tempo real.

---

## 🎨 Diretrizes Tipográficas e Cromáticas (Produx Matrix)

- **LOGOTIPO "AURA": `Italiana` peso 400 — não trocar.** É a letra do letreiro
  da entrada, confirmada na foto 4K da fachada e na arte vetorial do flyer. Tem
  modulação de traço (diagonal esquerda do "A" fina, direita cheia); fontes
  geométricas uniformes erram o desenho. Só existe no peso 400 — nunca pedir
  200/300 nem aplicar `bold`. Fallback em tamanhos pequenos: `Tenor Sans`.
  O emblema é SVG vetorial: três anéis + "A" de duas lâminas + ponto central.
  Detalhes e coordenadas em `informacoes/identidade_visual.md`.
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
  rolar sai da seção normalmente. No celular (≤740px) o percurso é comprimido
  para `Math.max(innerHeight * 1.6, percurso * 0.92)`, para a seção não prender
  a rolagem pelas duas telas e meia que o percurso cheio custaria. Os números
  estão em `initTrilhoHorizontal()`, em `js/main.js` — conferir lá antes de
  citar valores.
- **Movimento reduzido:** arraste lateral nativo, sem `modo-fixo`.

Os dois manipuladores de rolagem da home passam por `porQuadro()`, um
empacotador de `requestAnimationFrame`: cada passada do hero lê a posição de 8
fragmentos e escreve estilo em todos, e rodar isso direto no evento `scroll`
forçava vários recálculos de layout no mesmo quadro — era o que fazia a página
engasgar no celular.

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

Projeto `sgfyxmajpdgynsicmzdb`. **O navegador não escreve direto nas tabelas.**
Tudo que envolve dinheiro, dado de cliente ou validação de entrada passa por
função no banco (`SECURITY DEFINER`), que confere permissão no servidor.

### Três coisas que o navegador NÃO decide

| Decisão | Onde mora |
|---|---|
| Preço do ingresso | `aura_lotes.preco` |
| Preço do combo | `aura_combos.preco` — do navegador viaja **só o id** |
| Valor cobrado no cartão | o servidor lê do pedido já gravado |

Cada uma dessas linhas veio de um buraco real: o navegador mandava o preço do
combo (`p_combo_preco`) e o valor em centavos do cartão (`amount`). Bastava
mudar uma linha no console para comprar um combo de R$ 440 por R$ 1.

### Papéis

`aura_papeis` liga `auth.users` a um papel: `dono` ou `portaria`.
`aura_papel()` devolve o papel do usuário logado.

> Existiu uma tabela `aura_equipe`, que a documentação mandava usar e que
> `aura_papel()` **nunca leu**. Ficou vazia o tempo todo; quem seguisse o doc
> cadastrava um porteiro que não entrava. Foi removida.

Não existe senha escrita no JS. Existiu: `js/admin.js` tinha um "fallback de
contingência" que abria o painel do dono com `aura2026`, `admin`, `dono` — ou
com qualquer e-mail contendo "dono" — e a mensagem de erro **ensinava a senha
na tela**. Foi apagado junto com o painel embutido no `index.html`.

### Funções expostas

| Função | Quem chama | Faz |
|---|---|---|
| `aura_criar_pedido` | visitante | Cria pedido + ingressos numa transação. Preço de `aura_lotes` + `aura_combos`. Trava o lote com `FOR UPDATE`. Nasce `PENDENTE` com prazo. |
| `aura_buscar_voucher` | visitante | Devolve **um** ingresso pelo código, sem CPF. |
| `aura_validar_ingresso` | `dono`/`portaria` | UPDATE condicional (`and status = 'DISPONIVEL'`): o banco arbitra a corrida. |
| `aura_resgatar_combo` | `dono`/`portaria` | Baixa do combo no bar, pelo `combo_id`. Exige que a pessoa já tenha entrado. |
| `aura_confirmar_pagamento` | `dono` | Único caminho manual que torna um ingresso válido. |
| `aura_cancelar_pedido` | `dono` | Cancela, invalida os ingressos **e devolve as vagas ao lote**. |
| `aura_liberar_pendentes_expirados` | interno | Devolve ao lote as vagas de pedidos que passaram do prazo. |
| `aura_iniciar_pagamento_cartao`, `aura_vincular_payment_intent`, `aura_aprovar_pedido_cartao` | **só `service_role`** | O trio que decide a cobrança no cartão. Inacessível ao navegador. |
| `aura_pedidos_pendentes`, `aura_metricas`, `aura_resumo_portaria` | `dono` / equipe | Sempre filtradas por show. |

### Código do ingresso: aleatório, nunca sequencial

`codigo_validador` é `AURA-XXXXX-XXXXX`, sorteado do alfabeto
`23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (sem 0/O/1/I, porque o porteiro digita à
mão quando a câmera falha).

Era `AURA-00042-PISTA-1` — o número do pedido. Quem comprava o 42 sabia que
existia o 41: dava para varrer a base inteira pelo voucher público (nome,
setor, situação de cada cliente) e para **forjar o QR de outra pessoa e entrar
no lugar dela**. O aviso que o próprio sistema mandava no WhatsApp descrevia
exatamente esse ataque.

### Pedido tem prazo

Nasce `PENDENTE` com `expira_em = agora + 45 min`, e a vaga já sai do lote.
Vencido o prazo vira `EXPIRADO` e a vaga volta. Sem isso, um laço anônimo
esgotava a casa de graça — `aura_criar_pedido` é público e reservava estoque
sem nunca soltar.

`EXPIRADO` continua aparecendo na fila do dono: o cliente pode ter pago
atrasado, e confirmar retoma a vaga (recusando com `ESGOTADO` se o setor
lotou nesse meio tempo).

Estados de `status_pagamento`: `PENDENTE`, `APROVADO`, `EXPIRADO`,
`CANCELADO`, `RECUSADO`.

### Combo é linha de tabela, não texto

`aura_combos` (18 itens) é a fonte única: cardápio, checkout, voucher e bar
leem de lá. O ingresso guarda `combo_id`; `setor` voltou a ser só
`PISTA`/`CAMAROTE`/`BISTRO`.

Antes o combo era concatenado dentro do `setor`
(`'Pista • [CARD DOURADO: Combo Black Label]'`) e três telas o adivinhavam com
pilhas de `includes('BLACK LABEL')`. Como o nome vinha do navegador, mandar
`p_combo_nome = 'CARD DOURADO'` com preço zero rendia um combo de R$ 380 de
graça.

**`BISTRO` é só o nome de coluna — o setor de verdade é "VIP".** Não existe
"Mesa Bistrô" na casa; o setor real é Pista / Camarote / VIP. Renomear a
coluna do banco (`aura_lotes.setor`, `aura_ingressos.setor`, o `CHECK`
constraint) trocaria uma migração real por um problema cosmético, então o
código interno continua `BISTRO` — só o texto que o cliente vê virou "VIP",
em `ROTULOS_SETOR` (`js/checkout.js`) e no `index.html`. O Camarote também
perdeu "VIP" do título por não haver mais dois setores disputando o mesmo
nome. **A descrição do VIP em `ROTULOS_SETOR` (`'Área VIP com atendimento
exclusivo'`) é um texto provisório meu — o dono ainda não passou o texto e o
preço de verdade desse setor.**

### Quatro armadilhas que já morderam aqui

1. **`coalesce` na guarda de permissão.** `aura_papel() <> 'dono'` é **NULL**
   para visitante anônimo, e `if NULL` não dispara — a guarda passava batido.
   Sempre `coalesce(aura_papel(), '') <> 'dono'`.

2. **`revoke from public` ≠ `revoke from anon`.** O Supabase concede EXECUTE a
   `anon` automaticamente em toda função nova. Revogar de `PUBLIC` não desfaz a
   concessão explícita ao papel `anon`. Toda função de equipe precisa de
   `revoke all on function ... from anon`.

3. **Política RLS que filtra por `coluna IS NOT NULL`** numa coluna
   obrigatória é `USING (true)` disfarçado.

4. **`SECURITY DEFINER` sem `SET search_path`** é sequestrável. Todas as
   funções `aura_*` fixam `search_path = public, pg_temp`.

E uma consequência prática: **RLS não dá erro quando bloqueia um UPDATE — ela
devolve zero linhas com HTTP 200.** Por isso `updateShow`, `updateLote`,
`updateLoteStatus` e `updateCombo` devolvem `{ ok, mensagem }`, nunca
`true`/`false`, e **nenhuma tela pode dizer "salvo" sem checar `.ok`**.

### O que ainda depende do dono, não do sistema

O PIX não tem gateway: cai direto na conta da casa. O pedido nasce `PENDENTE`
e o QR **não abre a portaria** até o dono conferir o valor no app do banco e
clicar em "Confirmar PIX". É esse clique — e não o checkout — que emite
entrada válida.

---

## 💳 Pagamento com cartão (Stripe)

Ordem obrigatória, e ela não é estética:

```
criarPedido  →  iniciarPagamentoCartao  →  confirmCardPayment  →  confirmarPagamentoCartao
 (grava)         (servidor diz o valor)      (Stripe, no cliente)    (servidor confere e aprova)
```

Três defeitos que essa ordem impede, todos já estiveram no ar juntos:

1. **Cobrava antes de gravar.** Quando a gravação falhava, o cliente saía
   cobrado e sem ingresso, com o botão escrito "✓ Cartão Aprovado!".
2. **O valor vinha do navegador.** `amount` em centavos, calculado no cliente.
3. **O `confirm` não amarrava nada.** Aprovava qualquer `codigoPedido` com
   qualquer PaymentIntent `succeeded` — usando a chave de serviço, por cima da
   RLS. Com códigos de pedido sequenciais, um laço aprovava a casa inteira.

Hoje `aura_aprovar_pedido_cartao` só aprova se o PaymentIntent for **o que
aquele pedido reservou** e se o valor pago bater com `valor_total`.

**A chave secreta da Stripe vem do ambiente** (`STRIPE_SECRET_KEY` nas Edge
Functions), nunca do código. Sem ela, a função recusa o pagamento em vez de
cair num modo de teste silencioso.

⚠️ Enquanto `STRIPE_CHAVE_PUBLICAVEL` em `js/checkout.js` começar com
`pk_test`, a casa está em **modo de teste**: cartão real é recusado e cartão de
teste passa liberando ingresso sem dinheiro entrar. O checkout escreve isso na
tela, mas o certo é trocar pelas chaves `pk_live`/`sk_live`.

---

## ⚙️ Painel do Dono — `admin.html`, e só ele

- **Um painel só.** Existiu um segundo, embutido no `index.html`. Eles
  divergiram: um tinha a porta dos fundos de senha, o outro tinha injeção de
  HTML; um gravava preço no banco, o outro só no `localStorage`. O do
  `index.html` foi removido; a engrenagem do cabeçalho agora é um link.
- **Preço e capacidade gravam em `aura_lotes`**, por setor, com conferência do
  retorno. O painel antigo lia os preços da tela, guardava no `localStorage` e
  anunciava *"já está ativo no site"* — o dono via R$ 60 no celular dele e o
  cliente pagava R$ 40.
- **Pausar vendas mora no banco** (`aura_lotes.status = 'ESGOTADO'`). Ficava no
  `localStorage`: pausava só no navegador do dono, e o site seguia vendendo.
- **A fila de pagamentos é montada com `createElement`/`textContent`.** Nome,
  CPF e WhatsApp ali foram digitados por um desconhecido na internet, e
  `aura_criar_pedido` é público — `innerHTML` naquela lista era XSS armazenado
  executando na sessão que confirma pagamentos.
- **Nenhum `alert()` de sucesso sem checar `.ok`.**

---

## 🎟️ Regras do checkout que não podem regredir

Cada uma veio de um defeito real que chegou a estar no ar. Todas têm teste em
`testes/` (ver `testes/README.md`).

0. **Um scanner só.** A portaria vive em `portaria.html`. Existiu uma cópia
   embutida no `index.html` que divergiu da original; foi removida junto com a
   biblioteca de leitura de QR da página pública. Não reintroduzir.

1. **Um botão, um handler.** Nenhum botão pode ter `onclick` no HTML *e*
   `addEventListener` no JS — o `onclick` roda primeiro, não passa pelas
   travas, e o clique vira duas compras. A trava de verdade mora dentro de
   `emitDigitalTicket()` (`checkoutState.emitindo`), não no botão, para valer
   também em toque duplo e chamada solta.

2. **Emissão falha fechada.** Se `criarPedido` não concluir, o cliente **não**
   vê a tela de sucesso — fica no pagamento com o motivo em `#checkout-erro`.
   No cartão isso vem antes de qualquer cobrança. Quando o pedido grava mas os
   ingressos não, a mensagem entrega o `codigo_pedido` para emissão manual.

3. **Um QR por ingresso.** `checkoutState.codigosValidadores` é uma lista.
   A tela e o WhatsApp renderizam todos.

4. **Compra nova começa zerada.** `openCheckout()` chama
   `limparEmissaoAnterior()` e `limparDadosDoCliente()` — num caixa
   compartilhado, o código do comprador anterior não pode sobreviver em
   memória.

5. **Nada de `innerHTML` com dado do banco.** Combos, nomes e descrições vêm de
   tabela que o navegador não controla.

6. **Todo `setInterval` tem um `clearInterval` no caminho de saída.** Fechar o
   modal desliga o acompanhamento do pagamento; ele também tem teto de 20
   minutos. Antes seguia consultando o banco a cada 3 segundos para sempre.

7. **O QR é gerado localmente** (`js/qr.js`, verificado em `teste_qr.mjs`).
   Era desenhado por `api.qrserver.com`: o código de validação de todo cliente
   viajava na URL para um terceiro, e sem internet a imagem não aparecia — com
   o cliente já pago, na fila da portaria. O serviço externo ficou só como
   plano B.

**Portaria:** o card de resultado é mostrado/escondido pela classe `status-*`,
nunca por `style.display` inline — estilo inline vence a folha e travava o card
invisível da segunda leitura em diante. E todo `AudioContext` precisa de
`resume()` antes do bipe: no celular ele nasce suspenso e a leitura do QR não
conta como gesto do usuário.

8. **Nome de função de nível superior é global entre todos os `<script src>`
   da página** — não é isolado por arquivo. `js/cardapio.js` e `js/checkout.js`
   chegaram a declarar cada um sua própria `function carregarCatalogo(...)`;
   como `checkout.js` carrega depois no `index.html`, a dele sobrescrevia a do
   cardápio, e toda chamada interna de `cardapio.js` a `carregarCatalogo()`
   passava a executar a função ERRADA (a do checkout, que nem toca
   `cardapioEstado`). Resultado: o modal de combos ficava preso em
   "Carregando o cardápio da casa..." para sempre, sem nenhum erro no
   console — o `await` da função errada resolvia normalmente. Foi renomeada
   para `carregarCatalogoCardapio`. Ao criar função de nível superior em
   qualquer `js/*.js` novo, checar se o nome já existe em outro arquivo
   carregado na mesma página antes de assumir que está isolada.

## 🖼️ Mídia Principal & Imagem 4K do Scroll:
- **Foto 4K da Fachada Noturna (Google CDN - 2340x4160):**
  `https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkZXZqrc0T8ZFoYeSekOSNtFShWifl80QMZGs9dNgdcvbxF_pRSiF8lkLHud2gzpC8YEO_f-kTqAHIyeWPar6njVh0Nzv5w2AOVsXwsCdW63bDB-znWMW04p5n1yxvI7-ZAC_4o-Funhn4=s0`
- **Flyer Oficial Lorenah in Aura (2048x2048):**
  `https://res.cloudinary.com/htkavmx5a/image/upload/v1786630554/hq6bthf6gky5eyqeqp44.jpg`
