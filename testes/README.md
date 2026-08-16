# Testes da AURA

Três suítes, sem dependência nenhuma para instalar. Precisam só de Node 24+
(e do Chrome, para a primeira).

| Arquivo | O que cobre | Toca o banco? |
|---|---|---|
| `teste_checkout.mjs` | Front-end do checkout e da portaria, com o banco simulado | não |
| `teste_permissoes.mjs` | Ataca o Supabase com a chave pública, como um visitante faria | sim (leitura + 1 pedido) |
| `teste_fluxo_completo.mjs` | Compra → conferência do PIX → entrada na portaria | sim (1 pedido) |

## Como rodar

```bash
# 1. Front-end (banco simulado, não toca em nada)
node testes/teste_checkout.mjs

# 2. Permissões — prova o que um visitante NÃO consegue fazer
node testes/teste_permissoes.mjs

# 3. Fluxo completo — precisa de uma conta com papel 'dono'
AURA_DONO_EMAIL=voce@email.com AURA_DONO_SENHA=suasenha \
  node testes/teste_fluxo_completo.mjs
```

As suítes 2 e 3 criam um pedido de verdade e o cancelam no fim. Se passar as
credenciais do dono também para a suíte 2, ela limpa sozinha; sem elas, o
código do pedido é impresso na saída para você remover à mão.

Todas saem com código 1 se algo falhar, então dão para usar em CI.

## Contas de teste

O papel de cada conta vive na tabela `aura_equipe` (`dono` ou `portaria`).
Para testar a separação de papéis por completo, crie também uma conta de
portaria e passe `AURA_PORTARIA_EMAIL` / `AURA_PORTARIA_SENHA` — sem elas, os
testes 6 e 7 (o porteiro não pode confirmar pagamento nem ver faturamento)
são pulados, porque a mesma conta faria os dois papéis.

## O que cada teste prova

### `teste_checkout.mjs` — 12 verificações
Um clique gera um pedido só; falha de gravação não vira tela de sucesso;
3 ingressos geram 3 QR Codes distintos; o WhatsApp leva todos os links;
compra nova zera o comprador anterior; duas chamadas simultâneas gravam uma
vez; o card da portaria continua visível da 2ª leitura em diante; pagamento
pendente não é anunciado como "entrada válida".

### `teste_permissoes.mjs` — 13 verificações
Com a chave pública, um visitante **não** consegue: listar pedidos (CPF,
e-mail, WhatsApp), listar ingressos, alterar status de ingresso, injetar HTML
na descrição do show, validar entrada, confirmar o próprio pagamento, ou ver
faturamento. E **ainda** consegue: ler shows e lotes, criar pedido pelo
checkout, abrir o voucher pelo link.

### `teste_fluxo_completo.mjs` — 17 verificações
O ciclo inteiro: compra anônima com preço vindo do banco → ingresso recusado
na portaria enquanto o PIX não é conferido → dono vê na fila e confirma →
ingresso passa a liberar a entrada → o mesmo QR não entra duas vezes → dois
leitores simultâneos no mesmo QR, só um passa.
