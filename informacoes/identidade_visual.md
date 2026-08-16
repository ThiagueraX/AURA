# 🎨 Manual de Identidade Visual & Design System - AURA MOCOCA
### Padrão Oficial Baseado em: [PRODUX Design](https://www.produx.design/)

Guia oficial e completo de elementos visuais, paleta de cores, tipografia editorial/monospaçada, micro-interações e linguagem estética da **AURA MOCOCA**.

---

## 1. Conceito & Universo Visual da Marca

Inspirado na filosofia do **PRODUX Design** (*"You feel the brand before it speaks®"*), o design da **AURA MOCOCA** une elegância editorial, estética noturna de alto padrão, precisão tipográfica e tecnologia visual contemporânea.

- **Atmosfera:** Volcânica escura (Outer Space), elegante, geométrica, de alta fidelidade e imersiva.
- **Sensação:** Exclusividade, celebração refinada, impacto visual instantâneo e sofisticação.
- **Diferenciais de Design:** Tipografia monospaçada técnica (`DM Mono`), títulos com leading ultra-compacto, tags inclinadas (`-rotate-2deg`), efeitos `mix-blend-difference` e iluminação em neon ciano/azul com difusão suave.

---

## 2. Paleta de Cores Oficial (Produx x Aura)

| Nome da Cor | Código HEX | RGB | Uso e Função |
| :--- | :--- | :--- | :--- |
| **Outer Space Dark** | `#08090C` | `rgb(8, 9, 12)` | Fundo primário com acabamento fosco profundo e elegante. |
| **Deep Slate Surface** | `#11141D` | `rgb(17, 20, 29)` | Fundo de cards, painéis com glassmorphism e seções. |
| **White Smoke** | `#F2F2F2` | `rgb(242, 242, 242)` | Tipografia de títulos principais com máximo contraste e nitidez. |
| **Technical Slate Grey**| `#8A9099` | `rgb(138, 144, 153)` | Rótulos monospaçados, metadados e textos de apoio. |
| **Aura Electric Cyan** | `#00F0FF` | `rgb(0, 240, 255)` | Iluminação neon da fachada, glow de palco e acentos luminosos. |
| **Aura Cobalt Blue**   | `#0084FF` | `rgb(0, 132, 255)` | Gradientes cênicos e ambientação. |
| **Sunset Orange**       | `#EA560D` | `rgb(234, 86, 13)` | Destaque e conversão de ingressos (Byma CTA). |

---

## 3. Sistema Tipográfico Oficial (Produx Matrix)

### A. LOGOTIPO — `Italiana` 400 ⚠️ NÃO SUBSTITUIR

A palavra **AURA** do site tem de ser a mesma letra do letreiro da entrada.
Verificado em duas fontes independentes: a foto 4K da fachada noturna e a arte
vetorial oficial impressa no flyer "Lorenah in Aura".

- **Fonte:** `Italiana`, Google Fonts, **peso 400 — é o único que existe**.
  Nunca pedir 200/300 (não são gerados) nem `bold` (o navegador engorda a
  letra artificialmente e destrói o desenho).
- **Por que ela:** o logotipo **não é monolinear**. Tem modulação de traço
  clara e assimétrica — a diagonal **esquerda** do "A" é fio de cabelo e a
  **direita** é cheia; a haste **esquerda** do "U" é cheia e a **direita** é
  fina. É um sans de estrutura Didone. Fontes geométricas de traço uniforme
  (Poppins/Jost/Montserrat ExtraLight) erram o desenho de forma visível.
- **Espaçamento:** tracking largo, ~0.36em a 0.42em conforme o tamanho.
- **Atenção:** os fios de cabelo somem abaixo de ~28px em tela comum. Nesses
  tamanhos, usar `Tenor Sans` 400, que é a irmã robusta e já está declarada
  como fallback em `--font-logo`.
- **Métricas medidas no navegador** (por 1em): caixa alta `0.7031` ·
  ascendente `0.928` · descendente `0.250` · largura de "AURA" sem tracking
  `2.464`. São elas que sustentam as contas de posicionamento no CSS.

### B. Tipografia Técnica / Monospaçada (`DM Mono`)
- **Aplicações:** Rótulos em caixa alta, categorias, datas de eventos, indicadores de navegação entre colchetes como `[scroll down]`, `[view project]`, `[01 // atrações]`, `[ingressos byma]`.
- **Estilo:** Tags com leve rotação (`-rotate-2deg`), fundo translúcido `backdrop-blur-md bg-black/25` e borda sutil `border border-white/10`.

### C. Display / Títulos de Impacto (`Montserrat Black`)
- **Aplicações:** Nomes de eventos, chamadas principais da casa e headliners.
- **Estilo:** Espaçamento compacto de linha (`leading-[1.1]`), tamanhos fluidos responsivos e animação de texto palavra por palavra (*split-word stagger*).
- **Pendência de design:** o Montserrat Black é um grotesco pesado e hoje
  convive mal com a elegância do logotipo. `Tenor Sans` (já carregada) traria
  os títulos para a mesma família visual da porta. Decisão do cliente.

### D. Corpo de Texto & Suporte (`Inter` / `Plus Jakarta Sans`)
- **Aplicações:** Parágrafos explicativos, termos de compra, regras de entrada e suporte.

---

## 3b. O EMBLEMA — construção exata

Reproduzido em SVG (`viewBox 0 0 100 100`, tudo em `currentColor`), não em
imagem. A construção é:

1. **Três anéis finos concêntricos** — raios `45.5`, `41.5` e `33.5`. O par
   externo é justo e o interno fica separado: é isso que dá a sensação de
   "aura"/órbita. Um emblema com dois anéis igualmente espaçados está errado.
2. **Um "A" de duas lâminas** — duas retas saindo do ápice (`50 25.5`) até as
   pontas inferiores (`29.4 66.6` e `70.6 66.6`), mais um **travessão em arco**
   que sobe ao centro e desce até as mesmas pontas. As duas linhas convergindo
   formam as lâminas afiadas em baixo. O travessão **não é uma barra reta**.
3. **Um ponto sólido** logo abaixo do arco (`50 51.6`).

A espessura do tubo é variável por contexto (`--emb-traco`): `1.9` no tamanho
grande, `3.4` no header, senão o desenho desaparece em 34px.

### Coordenadas do letreiro na foto da fachada (2340 × 4160)

Medidas por varredura de pixel, usadas para o logotipo vetorial pousar em cima
do letreiro real durante o scroll do hero:

| Peça | x | y |
| :--- | :--- | :--- |
| Emblema | 990 – 1313 | 1231 – 1543 |
| Nome AURA | 639 – 1626 | 1570 – 1766 |
| Filete | 799 – 1475 | 1792 – 1829 |

Caixa de referência: **987 × 598 px** (proporção **1.65**). Se a foto da
fachada for trocada, estes números e os de `.hero-sign-anchor` precisam ser
medidos de novo.

---

## 4. Padrões de Layout e Micro-interações

1. **Grid Editorial Assimétrico de 12 Colunas:** Variação dinâmica de largura nos cards de eventos e fotos para conferir ritmo e elegância.
2. **Hover com Parallax Suave:** Imagens com escala controlada (`scale(1.025)`) e transição fluida.
3. **Divisores Animados:** Linhas horizontais com crescimento a partir da esquerda (`scale-x-100 origin-left`).
4. **Modo de Mistura Dinâmico:** Uso de `mix-blend-difference` no cursor e no logotipo fixo ao rolar a página.
