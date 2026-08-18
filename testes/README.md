# Testes da AURA

Cinco suítes. Quatro não precisam instalar nada — só Node 24+ (e o Chrome,
para as duas primeiras).

| Arquivo | O que cobre | Toca o banco? |
|---|---|---|
| `teste_paginas.mjs` | As 4 páginas abrem sem erro de JavaScript e com os elementos no lugar | não |
| `teste_checkout.mjs` | Front-end do checkout e da portaria, com o banco simulado | não |
| `teste_qr.mjs` | O QR gerado localmente é lido por um decodificador de verdade | não |
| `teste_permissoes.mjs` | Ataca o Supabase com a chave pública, como um visitante faria | sim (leitura + 3 pedidos) |
| `teste_fluxo_completo.mjs` | Compra → conferência do PIX → portaria → bar → cancelamento | sim (2 pedidos) |

## Como rodar

```bash
node testes/teste_paginas.mjs
```

```bash
node testes/teste_checkout.mjs
```

```bash
node testes/teste_permissoes.mjs
```

O teste de QR é o único com dependência. Sem ela ele avisa e sai sem reprovar:

```bash
npm install jsqr && node testes/teste_qr.mjs
```

O fluxo completo precisa de uma conta com papel `dono`:

```bash
AURA_DONO_EMAIL=voce@email.com AURA_DONO_SENHA=suasenha node testes/teste_fluxo_completo.mjs
```

As suítes 4 e 5 criam pedidos de verdade e os cancelam no fim. Se passar as
credenciais do dono também para a suíte 4, ela limpa sozinha; sem elas, os
códigos são impressos na saída. De todo modo, pedido pendente **expira sozinho
em 45 minutos** e devolve a vaga ao lote.

Todas saem com código 1 se algo falhar, então dão para usar em CI.

## Contas de teste

O papel de cada conta vive na tabela **`aura_papeis`** (`dono` ou `portaria`),
ligada a `auth.users` por `user_id`. Não existe mais a tabela `aura_equipe` —
ela estava vazia e a documentação antiga mandava cadastrar nela, o que criava
porteiro que não conseguia entrar.

Para testar a separação de papéis por completo, crie também uma conta de
portaria e passe `AURA_PORTARIA_EMAIL` / `AURA_PORTARIA_SENHA` — sem elas, os
testes 8 e 9 (o porteiro não pode confirmar pagamento nem ver faturamento) são
pulados, porque a mesma conta faria os dois papéis.

## O que cada teste prova

### `teste_paginas.mjs` — 12 verificações
Abre `index.html`, `admin.html`, `portaria.html` e `ingresso.html` no Chrome e
reprova se o console estourar, se faltar elemento essencial ou se um contrato
da página cair: o gerador de QR carregou, o painel de administração **não**
está mais embutido na home, a engrenagem leva para `admin.html`, a portaria
não tem mais adivinhação de combo por texto, e não sobrou senha escrita no
HTML.

### `teste_checkout.mjs` — 12 verificações
Um clique gera um pedido só; falha de gravação não vira tela de sucesso;
3 ingressos geram 3 QR Codes distintos; o WhatsApp leva todos os links;
compra nova zera o comprador anterior; duas chamadas simultâneas gravam uma
vez; o card da portaria continua visível da 2ª leitura em diante; pagamento
pendente não é anunciado como "entrada válida".

### `teste_qr.mjs` — 11 verificações
Gera o QR de códigos de ingresso, do link do voucher e de um payload PIX EMV
completo, pinta a matriz e manda o jsQR ler de volta. Também confere que o
mesmo texto gera sempre o mesmo QR e que texto grande demais é recusado com
erro em vez de gerar um símbolo truncado.

### `teste_permissoes.mjs` — 29 verificações
Com a chave pública, um visitante **não** consegue: listar pedidos (CPF,
e-mail, WhatsApp), listar ingressos, alterar status de ingresso, injetar HTML
na descrição do show, mudar preço de combo, validar entrada, resgatar combo,
confirmar o próprio pagamento, ver faturamento, nem alcançar as três funções
que decidem a cobrança no cartão. E **ainda** consegue: ler shows, lotes e
combos, criar pedido pelo checkout e abrir o voucher pelo link.

Prova também que o código do QR **não é adivinhável** (não deriva do número do
pedido, segue o formato aleatório, e o formato antigo não encontra nada) e que
o **preço do combo vem do banco** (a assinatura antiga com `p_combo_preco`
não existe mais; combo inventado é recusado).

### `teste_fluxo_completo.mjs` — 30 verificações
O ciclo inteiro: compra anônima com preço vindo do banco → a vaga já fica
reservada no lote → ingresso recusado na portaria enquanto o PIX não é
conferido → dono vê na fila e confirma → ingresso passa a liberar a entrada →
o mesmo QR não entra duas vezes → dois leitores simultâneos, só um passa →
o bar recusa combo de quem não passou na portaria e depois libera uma vez só →
cancelar devolve a vaga ao lote e a portaria passa a dizer CANCELADO.
