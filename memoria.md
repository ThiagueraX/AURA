# MEMORIA.md - Base de Conhecimento & Memória Viva da AURA MOCOCA

Documento centralizador de inteligência de dados, registros cadastrais, acervo de mídia, planejamento do website oficial, sistema de bilhetagem própria e **padrão de design PRODUX** da **AURA MOCOCA**.

---

## 🎨 0. Referência Oficial de Design & UI/UX: PRODUX Design

> **Website de Referência:** [https://www.produx.design/](https://www.produx.design/)  
> **Conceito & Lema:** *"Design that Speaks — You feel the brand before it speaks®"*  
> **Definição:** Estúdio de design de alto padrão focado em identidade de marca liderada por estratégia, direção criativa, tipografia refinada e experiências digitais imersivas.

### Diretrizes do Design System Aplicadas à AURA:
1. **Tipografia Monospaçada & Editorial:**
   - **Monospace Técnico:** Uso de `DM Mono` para o cabeçalho (`[ HOME ]`, `[ SHOWS ]`, `[ INGRESSOS ]`, `[ AVALIAÇÕES ]`, `[ SUPORTE ]`), rótulos, tags de categorias, datas, colchetes estilizados `[lineup]`, `[01 // estrutura]` e botões técnicos.
   - **Display / Títulos:** Uso de `At Aero` / `Syne` / `Montserrat Black` com leading compacto (`leading-[1.1]`) e animações de revelação suave palavra por palavra (*split-word*).
   - **Tags Estilizadas:** Rotação sutil de `-2deg`, fundo translúcido `backdrop-blur-md bg-black/25` com borda fina `border border-white/10`.
2. **Paleta de Cores e Atmosfera:**
   - **Outer Space / Matte Dark:** Fundo principal `#08090C` e `#11141D` criando profundidade elegante.
   - **White Smoke:** `#F2F2F2` para títulos e leitura nítida.
   - **Slate / Muted Grey:** `#8A9099` para metadados e legendas técnicas.
   - **Aura Neon Glow:** `#00F0FF` / `#00D2FF` para iluminação cênica e pontos focais de luz.
   - **Sunset Orange:** `#EA560D` para ações de conversão e botões de ingressos.
3. **Efeitos Visuais e Interatividade:**
   - Efeitos `mix-blend-difference` e `mix-blend-exclusion` em barras de navegação fixas e cursores.
   - Cursor magnético dinâmico com rótulos contextuais.
   - Hover em cards de eventos com escala suave (`transform: scale(1.025)`).
   - Linhas horizontais dinâmicas com crescimento a partir da esquerda (`scale-x-100 origin-left`).
   - Grade assimétrica de 12 colunas com layout editorial espaçado.

---

## 🏗️ 1. Arquitetura Oficial do Website da AURA

```
┌──────────────────────────────────────────────────────────────┐
│ 1. CABEÇALHO FIXO MIX-BLEND (PRODUX NAVBAR)                  │
│    • AURA Logo                                               │
│    • [ HOME ] [ SHOWS ] [ INGRESSOS ] [ AVALIAÇÕES ] [ SUPORTE ]
├──────────────────────────────────────────────────────────────┤
│ 2. HERO COM SCROLL MORPHING (PRODUX SYSTEM)                  │
│    • Letras [ A ] - [ U ] - [ R ] - [ A ] em neon ciano      │
│    • Encaixe sobre a Foto 4K da Fachada Noturna Iluminada    │
├──────────────────────────────────────────────────────────────┤
│ 3. REVELAÇÃO DO VÍDEO SHOWREEL                               │
│    • Vídeo contínuo da atmosfera da casa, luzes e shows      │
│    • Botão flutuante Produx: [ 🔊 Ativar Som / Play Reel ]   │
├──────────────────────────────────────────────────────────────┤
│ 4. BARRA DE COMPRA DIRETA DE INGRESSOS                       │
│    • [ 🎟️ GARANTIR INGRESSO OFICIAL • PIX & CARTÃO NO SITE ] │
├──────────────────────────────────────────────────────────────┤
│ 5. AGENDA DE SHOWS & NOVIDADES (LINEUP DINÂMICO)             │
│    • Show Lorenah (22/08) - 1º Lote Disponível               │
│    • Próximos Sábados / Atrações Futuras Agendadas           │
├──────────────────────────────────────────────────────────────┤
│ 6. CARROSSEL DE BEBIDAS & MARCAS PREMIUM (PRODUX TICKER)     │
│    • Red Bull, Tanqueray, Absolut, Cîroc, Black Label...     │
├──────────────────────────────────────────────────────────────┤
│ 7. SETORES & EXPERIÊNCIA VIP                                 │
│    • Pista Geral vs. Camarotes Privativos & Mesas Bistrô     │
├──────────────────────────────────────────────────────────────┤
│ 8. SATISFAÇÃO DOS CLIENTES (PRODUX GOOGLE REVIEWS)           │
│    • [ 5.0 ★★★★★ ] no Google Maps • Fotos de clientes e tags │
├──────────────────────────────────────────────────────────────┤
│ 9. FAQ RÁPIDO & REGRAS DA CASA (ACORDEÃO PRODUX)             │
│    • Idade 18+, Documentos aceitos, Dress code, Horários     │
├──────────────────────────────────────────────────────────────┤
│ 10. LOCALIZAÇÃO, MAPA & RODAPÉ                               │
│     • Av. João Batista Lima Figueiredo, 2707 • Como Chegar   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎟️ 2. Sistema de Bilhetagem Própria & Checkout Integrado

1. **Venda Direta no Site:**
   - Modal/Gaveta de compra em tempo real sem redirecionamentos externos.
   - Seleção de setores (Pista, Camarote, Bistrô) e quantidade de ingressos (1 a 10).
   - Checkout com **PIX Instantâneo (QR Code + Copia e Cola)** e **Cartão de Crédito**.
2. **Envio Automático do Ingresso com QR Code:**
   - **Na Tela:** Exibição imediata com QR Code individual validável na portaria e opção de salvar no celular.
   - **No E-mail:** Envio do comprovante e ingresso oficial em PDF para o cliente.
   - **No WhatsApp:** Disparo de notificação e link de acesso rápido.

---

## ⚙️ 3. Painel Administrativo Autônomo para o Proprietário (`/admin`)

- **Edição do Show da Semana:** Troca rápida do nome da atração principal, data do evento e upload do flyer.
- **Fila de Shows ("No Pente"):** Cadastro antecipado dos shows das semanas seguintes para ativação com 1 clique.
- **Gestão de Lotes:** Controle de virada de lotes (1º Lote, 2º Lote, Portaria), valores e pausa de vendas (*Sold Out*).
- **Métricas:** Relatório de quantidade de ingressos vendidos por setor e faturamento total.

---

## 📸 4. Imagem 4K Oficial do Scroll Morphing
- **URL Direto (2340 × 4160 px):** `https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkZXZqrc0T8ZFoYeSekOSNtFShWifl80QMZGs9dNgdcvbxF_pRSiF8lkLHud2gzpC8YEO_f-kTqAHIyeWPar6njVh0Nzv5w2AOVsXwsCdW63bDB-znWMW04p5n1yxvI7-ZAC_4o-Funhn4=s0`

---

## 🍸 5. Sistema de Venda Casada de Combos & Identificação Física por Cards na Portaria

1. **Seleção Opcional no Checkout:**
   - Durante a compra de ingressos (Pista ou Camarote), o cliente pode adicionar opcionalmente combos e garrafas com desconto antecipado.
   - O subtotal do pedido soma os ingressos e o combo escolhido, gerando um PIX único com o valor integral.

2. **Tabela de Combos & Cores de Cards Físicos de Portaria:**
   - 🟡 **CARD DOURADO**: Combo Johnnie Walker Black Label 12 Anos (+ R$ 380,00)
   - 🟡 **CARD ÂMBAR**: Combo Johnnie Walker Red Label (+ R$ 290,00)
   - 🔵 **CARD AZUL**: Combo Absolut Vodka Suéca (+ R$ 310,00)
   - 🔵 **CARD AZUL ROYAL**: Combo Cîroc Ultra Premium Vodka (+ R$ 440,00)
   - 🔴 **CARD VERMELHO**: Combo Gin Tanqueray London Dry (+ R$ 340,00)
   - 🟣 **CARD ROSA**: Chandon Passion On The Rocks (+ R$ 210,00)
   - 🟢 **CARD VERDE**: Balde Heineken 6x Long Neck (+ R$ 84,00)
   - 🟢 **CARD VERDE LIMÃO**: Balde Corona Extra 6x com Limão (+ R$ 90,00)
   - ⚡ **CARD CIANO**: Combo 5x Red Bull Energy Drink (+ R$ 95,00)

3. **Operação e Fluxo de Entrega na Portaria (`portaria.html`):**
   - Ao ler o QR Code do cliente na entrada, o scanner valida o ingresso e exibe um alerta visual pulsante e colorido com a instrução exata:
     `🚨 ATENÇÃO PORTARIA • ENTREGAR AO CLIENTE: 💳 [CARD COR] - [NOME DO COMBO]`
   - O porteiro entrega o cartão/papel físico colorido correspondente para o cliente.
   - O cliente se dirige ao Bar da AURA e troca o Card Físico pelo seu Combo / Garrafas geladas.
   - Se for entrada simples sem combo, a portaria exibe: `✓ ENTRADA SIMPLES • SEM COMBO`.

4. **Voucher Digital & WhatsApp:**
   - O comprovante na tela, o link do voucher (`ingresso.html`) e o disparo do WhatsApp contêm o selo de identificação do combo e a instrução clara para retirar o card físico na portaria.

## 🍹 5. Cardápio Interativo VIP de Bebidas & Combos (`#cardapio`)

- **Integração no Carrossel de Marcas:** Cada marca do ticker possui micro-interação no hover com badge `[ VER COMBOS ↗ ]` e abre o modal/gaveta VIP filtrado na respectiva categoria.
- **Categorias e Filtros:**
  - 🥃 **Whiskies:** Black Label 12 Anos (R$ 380), Red Label (R$ 290), Gold Label Reserve (R$ 580), Jack Daniel's No. 7 (R$ 360).
  - 🍸 **Vodkas & Gins:** Absolut Vodka 1L (R$ 310), Cîroc Ultra Premium 750ml (R$ 440), Gin Tanqueray + Tônica & Especiarias (R$ 340).
  - 🍾 **Espumantes:** Chandon Passion On The Rocks (R$ 210), Chandon Réserve Brut (R$ 190), Chandon Brut Rosé (R$ 220).
  - 🍺 **Baldes de Cerveja:** Balde Heineken 6x 330ml (R$ 84), Balde Corona Extra 6x com Limão (R$ 90), Doses individuais (R$ 16 / R$ 17).
  - ⚡ **Energéticos & Não Alcoólicos:** Combo 5x Red Bull 250ml (R$ 95), Red Bull avulso (R$ 22), Gelo de Coco (R$ 12), Refrigerantes / Água (R$ 8 a R$ 10).
- **Ação Direta:** Botão de reserva instantânea no WhatsApp formatado especificamente para cada combo para camarotes e bistrôs.

