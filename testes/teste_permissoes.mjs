// Ataca o Supabase da AURA com a mesma chave anon que esta publicada no JS.
// Tudo que um visitante consegue fazer, este script consegue.
const URL = 'https://sgfyxmajpdgynsicmzdb.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZnl4bWFqcGRneW5zaWNtemRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDcyNzUsImV4cCI6MjEwMDcyMzI3NX0.auX5eGMcbyeGYZdfOOd4uSPwCWe35NnaQPzi27BrMQ0';
const H = { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
const SHOW = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

const res = [];
const checar = (nome, ok, det) => { res.push({ nome, ok }); console.log(`${ok ? 'OK   ' : 'FALHA'} ${nome}${det ? '  ->  ' + det : ''}`); };

const get = async (p) => { const r = await fetch(`${URL}/rest/v1/${p}`, { headers: H }); return { s: r.status, b: await r.text() }; };
const rpc = async (fn, body) => { const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(body) }); return { s: r.status, b: await r.text() }; };

console.log('=== O QUE UM VISITANTE ANONIMO CONSEGUE FAZER ===\n');

// 1. Ler os CPFs de todos os compradores
const pedidos = await get('aura_pedidos?select=*');
let corpo = []; try { corpo = JSON.parse(pedidos.b); } catch {}
checar('1. NAO consegue listar pedidos (CPF/email/WhatsApp)',
  pedidos.s === 401 || pedidos.s === 403 || (Array.isArray(corpo) && corpo.length === 0),
  `HTTP ${pedidos.s} — ${pedidos.b.slice(0, 90)}`);

// 2. Ler todos os ingressos
const ings = await get('aura_ingressos?select=*');
let ci = []; try { ci = JSON.parse(ings.b); } catch {}
checar('2. NAO consegue listar ingressos',
  ings.s === 401 || ings.s === 403 || (Array.isArray(ci) && ci.length === 0),
  `HTTP ${ings.s} — ${ings.b.slice(0, 90)}`);

// 3. Marcar todos os ingressos como usados (trancaria a festa inteira)
const sabota = await fetch(`${URL}/rest/v1/aura_ingressos?status=eq.DISPONIVEL`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ status: 'UTILIZADO' })
});
const sabotaB = await sabota.text();
let sc = []; try { sc = JSON.parse(sabotaB); } catch {}
checar('3. NAO consegue alterar status de ingresso',
  sabota.status === 401 || sabota.status === 403 || (Array.isArray(sc) && sc.length === 0),
  `HTTP ${sabota.status} — ${sabotaB.slice(0, 90)}`);

// 4. Mudar o preco / titulo do show
const mexeShow = await fetch(`${URL}/rest/v1/aura_shows?id=eq.${SHOW}`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ descricao: '<img src=x onerror=alert(1)>' })
});
const mexeB = await mexeShow.text();
let mc = []; try { mc = JSON.parse(mexeB); } catch {}
checar('4. NAO consegue injetar HTML na descricao do show',
  mexeShow.status === 401 || mexeShow.status === 403 || (Array.isArray(mc) && mc.length === 0),
  `HTTP ${mexeShow.status} — ${mexeB.slice(0, 90)}`);

// 5. Dar baixa em ingresso pela funcao da portaria, sem login
const valida = await rpc('aura_validar_ingresso', { p_codigo: 'QUALQUER', p_operador: 'invasor' });
// Negado no GRANT (401) ou negado por dentro da funcao: os dois servem
checar('5. NAO consegue validar ingresso sem login da portaria',
  valida.s === 401 || valida.s === 403 || valida.b.includes('SEM_PERMISSAO'),
  `HTTP ${valida.s} — ${valida.b.slice(0, 90)}`);

// 6. Confirmar pagamento sozinho (viraria ingresso gratis valido)
const conf = await rpc('aura_confirmar_pagamento', { p_codigo_pedido: 'AURA-10000' });
checar('6. NAO consegue confirmar o proprio pagamento',
  conf.b.includes('SEM_PERMISSAO') || conf.s === 401 || conf.s === 403,
  `HTTP ${conf.s} — ${conf.b.slice(0, 90)}`);

// 7. Ler metricas de faturamento
const met = await rpc('aura_metricas', {});
checar('7. NAO consegue ler faturamento',
  met.b.includes('SEM_PERMISSAO') || met.s === 401 || met.s === 403,
  `HTTP ${met.s} — ${met.b.slice(0, 90)}`);

console.log('\n=== O QUE O SITE PRECISA CONTINUAR FAZENDO ===\n');

// 8. Ler shows e lotes (a home depende disso)
const shows = await get('aura_shows?select=titulo,is_ativo');
const lotes = await get('aura_lotes?select=setor,preco,status');
checar('8. Site AINDA le shows e lotes', shows.s === 200 && lotes.s === 200 &&
  JSON.parse(shows.b).length > 0, `shows=${shows.s} lotes=${lotes.s}`);

// 9. Criar pedido pela RPC (o checkout precisa)
const novo = await rpc('aura_criar_pedido', {
  p_show_id: SHOW, p_setor: 'Pista', p_quantidade: 2,
  p_nome: 'TESTE AUTOMATIZADO', p_cpf: '111.444.777-35',
  p_email: 'teste@exemplo.com', p_whatsapp: '19999999999', p_metodo: 'PIX'
});
let nb = {}; try { nb = JSON.parse(novo.b); } catch {}
checar('9. Checkout AINDA cria pedido', nb.ok === true && nb.codigos?.length === 2,
  `${nb.codigo_pedido} codigos=${JSON.stringify(nb.codigos)} total=${nb.valor_total} status=${nb.status_pagamento}`);

// 10. Preco vem do banco, nao do navegador
checar('10. Preco veio do banco (R$40 x2 = R$80), ignorando o navegador',
  Number(nb.valor_total) === 80 && Number(nb.preco_unitario) === 40,
  `unitario=${nb.preco_unitario} total=${nb.valor_total}`);

// 11. Voucher continua abrindo pelo link, sem CPF junto
const vc = await rpc('aura_buscar_voucher', { p_codigo: nb.codigos?.[0] });
let vb = {}; try { vb = JSON.parse(vc.b); } catch {}
checar('11. Voucher abre pelo link e NAO devolve CPF',
  vb.ok === true && !!vb.ingresso?.titular_nome && !('titular_cpf' in (vb.ingresso || {})),
  `show="${vb.ingresso?.show_titulo}" pago=${vb.ingresso?.pago} campos=${Object.keys(vb.ingresso || {}).length}`);

// 12. Ingresso nao pago nao abre a portaria (mesmo com login, testado no proximo script)
checar('12. Pedido nasce PENDENTE, nao APROVADO', nb.status_pagamento === 'PENDENTE',
  `status=${nb.status_pagamento}`);

// 13. Nao da para furar a quantidade maxima
const abuso = await rpc('aura_criar_pedido', {
  p_show_id: SHOW, p_setor: 'Pista', p_quantidade: 999,
  p_nome: 'ABUSO', p_cpf: '111.444.777-35', p_email: 'a@b.com',
  p_whatsapp: '19999999999', p_metodo: 'PIX'
});
checar('13. Quantidade absurda e recusada', abuso.b.includes('QUANTIDADE_INVALIDA'), abuso.b.slice(0, 80));

// Limpeza do pedido criado no teste 9. Precisa da conta do dono; sem ela o
// pedido fica no banco e o codigo e impresso para remocao manual.
let limpeza = 'APAGUE NA MAO (defina AURA_DONO_EMAIL/AURA_DONO_SENHA para limpar sozinho)';
if (nb.codigo_pedido && process.env.AURA_DONO_EMAIL && process.env.AURA_DONO_SENHA) {
  try {
    const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.AURA_DONO_EMAIL, password: process.env.AURA_DONO_SENHA })
    });
    if (login.ok) {
      const { access_token } = await login.json();
      const r = await fetch(`${URL}/rest/v1/rpc/aura_cancelar_pedido`, {
        method: 'POST',
        headers: { apikey: ANON, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_codigo_pedido: nb.codigo_pedido })
      });
      const corpo = await r.json();
      limpeza = corpo.ok ? 'cancelado e vagas devolvidas ao lote' : 'falhou: ' + corpo.motivo;
    }
  } catch (e) { limpeza = 'falhou: ' + e.message; }
}

console.log('\n' + '='.repeat(62));
const falhas = res.filter(r => !r.ok);
console.log(`${res.length - falhas.length}/${res.length} verificacoes passaram`);
if (falhas.length) console.log('FALHAS: ' + falhas.map(f => f.nome).join(' | '));
console.log('='.repeat(62));
console.log('\nPEDIDO DE TESTE ' + nb.codigo_pedido + ' — ' + limpeza);
process.exit(falhas.length ? 1 : 0);
