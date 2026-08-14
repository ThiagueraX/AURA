# 🎟️ Sistema de Ingressos, Checkout Próprio & Painel do Dono - AURA MOCOCA

Documento detalhando a arquitetura de bilhetagem própria, checkout no site com emissão de QR Code e o painel administrativo autônomo do proprietário da **AURA MOCOCA**.

---

## 1. Sistema de Venda Direta no Site (Sem Redirecionamentos)

O website oficial da AURA funciona como canal primário e oficial de venda de ingressos:

```
┌─────────────────────────────────────────────────────────────┐
│                 FLUXO DO COMPRADOR NO SITE                  │
│                                                             │
│  1. Clique em "Garantir Ingresso"                           │
│     └── Abre modal/drawer estilo Produx Dark Glass          │
│                                                             │
│  2. Escolha de Setor & Quantidade                           │
│     ├── Pista Geral                                         │
│     ├── Área VIP / Mesas Bistrô                             │
│     └── Camarotes Exclusivos                                │
│                                                             │
│  3. Identificação Rápida                                    │
│     └── Nome Completo, CPF, E-mail e WhatsApp               │
│                                                             │
│  4. Pagamento Instantâneo                                   │
│     ├── PIX (QR Code Dinâmico + Copia e Cola)               │
│     └── Cartão de Crédito (Parcelado em até 10x)            │
│                                                             │
│  5. Emissão e Envio Imediato                                │
│     ├── Na tela: Ingresso com QR Code oficial               │
│     ├── No E-mail: Voucher em PDF com QR Code               │
│     └── No WhatsApp: Link de acesso direto ao ingresso      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Painel Administrativo do Proprietário (`/admin`)

Área restrita e intuitiva para o dono da AURA gerenciar a casa sem precisar de programador:

1. **Gestão do Show Ativo:**
   - Troca de nome do artista (ex: *Lorenah*).
   - Upload de novo flyer ou foto da atração.
   - Atualização de data e horários de abertura/shows.
2. **Fila de Próximos Shows:**
   - Cadastro antecipado dos eventos seguintes.
   - Ativação imediata do próximo sábado assim que o evento atual termina.
3. **Gestão de Lotes & Preços:**
   - Definição de preços para **1º Lote**, **2º Lote**, **Portaria** e **Camarotes**.
   - Definição de quantidade de ingressos por lote.
   - Botão de pausa rápida para declarar ingressos esgotados (*Sold Out*).
4. **Relatório de Vendas em Tempo Real:**
   - Contador de ingressos vendidos por setor e receita arrecadada.

---

## 3. Histórico do Evento Atual Cadastrado: Lorenah in Aura

- **Atração Principal:** Lorenah (`@lorenahoficial`) - Sertanejo Universitário
- **Atrações de Apoio:** Funk Premium e DJs residentes Open Format
- **Data:** Sábado, 22 de Agosto de 2026
- **Horário:** Abertura da casa às 21:00 / Início do show à 00:00
- **Flyer Oficial (Alta Resolução):** `https://res.cloudinary.com/htkavmx5a/image/upload/v1786630554/hq6bthf6gky5eyqeqp44.jpg`
