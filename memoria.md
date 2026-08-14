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
