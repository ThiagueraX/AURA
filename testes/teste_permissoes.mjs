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
const negado = (r) => r.s === 401 || r.s === 403 || r.s === 404 || r.b.includes('SEM_PERMISSAO');

const criados = [];

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

// 4b. Mudar o preco de um combo
const mexeCombo = await fetch(`${URL}/rest/v1/aura_combos?id=eq.combo-black-label`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ preco: 1 })
});
const mexeComboB = await mexeCombo.text();
let mcc = []; try { mcc = JSON.parse(mexeComboB); } catch {}
checar('4b. NAO consegue mudar o preco de um combo',
  mexeCombo.status === 401 || mexeCombo.status === 403 || (Array.isArray(mcc) && mcc.length === 0),
  `HTTP ${mexeCombo.status} — ${mexeComboB.slice(0, 90)}`);

// 5. Dar baixa em ingresso pela funcao da portaria, sem login
const valida = await rpc('aura_validar_ingresso', { p_codigo: 'QUALQUER', p_operador: 'invasor' });
checar('5. NAO consegue validar ingresso sem login da portaria', negado(valida),
  `HTTP ${valida.s} — ${valida.b.slice(0, 90)}`);

// 5b. Resgatar combo no bar sem login
const bar = await rpc('aura_resgatar_combo', { p_codigo: 'QUALQUER', p_operador: 'invasor' });
checar('5b. NAO consegue resgatar combo sem login', negado(bar),
  `HTTP ${bar.s} — ${bar.b.slice(0, 90)}`);

// 6. Confirmar pagamento sozinho (viraria ingresso gratis valido)
const conf = await rpc('aura_confirmar_pagamento', { p_codigo_pedido: 'AURA-10000' });
checar('6. NAO consegue confirmar o proprio pagamento', negado(conf),
  `HTTP ${conf.s} — ${conf.b.slice(0, 90)}`);

// 7. Ler metricas de faturamento
const met = await rpc('aura_metricas', {});
checar('7. NAO consegue ler faturamento', negado(met),
  `HTTP ${met.s} — ${met.b.slice(0, 90)}`);

// 7b. Descobrir o proprio papel (so faz sentido para quem tem login)
const papel = await rpc('aura_papel', {});
checar('7b. NAO consegue chamar aura_papel sem login', negado(papel),
  `HTTP ${papel.s} — ${papel.b.slice(0, 90)}`);

console.log('\n=== AS FUNCOES DE PAGAMENTO SAO SO DO SERVIDOR ===\n');

// Estas tres funcoes decidem quanto cobrar e quando aprovar. Se o navegador
// alcancar qualquer uma delas, o cartao vira ingresso gratis.
for (const [fn, params] of [
  ['aura_iniciar_pagamento_cartao', { p_codigo_pedido: 'AURA-10000' }],
  ['aura_vincular_payment_intent', { p_codigo_pedido: 'AURA-10000', p_payment_intent_id: 'pi_falso' }],
  ['aura_aprovar_pedido_cartao', { p_codigo_pedido: 'AURA-10000', p_payment_intent_id: 'pi_falso', p_valor_centavos: 1 }],
  ['aura_liberar_pendentes_expirados', {}],
  ['aura_gerar_codigo', {}]
]) {
  const r = await rpc(fn, params);
  checar(`  ${fn} inacessivel para o visitante`, negado(r), `HTTP ${r.s} — ${r.b.slice(0, 70)}`);
}

console.log('\n=== O QUE O SITE PRECISA CONTINUAR FAZENDO ===\n');

// 8. Ler shows, lotes e combos (a home e o cardapio dependem disso)
const shows = await get('aura_shows?select=titulo,is_ativo');
const lotes = await get('aura_lotes?select=setor,preco,status');
const combos = await get('aura_combos?select=id,titulo,preco&ativo=eq.true');
let cb = []; try { cb = JSON.parse(combos.b); } catch {}
checar('8. Site AINDA le shows, lotes e combos',
  shows.s === 200 && lotes.s === 200 && combos.s === 200 &&
  JSON.parse(shows.b).length > 0 && cb.length > 0,
  `shows=${shows.s} lotes=${lotes.s} combos=${combos.s} (${cb.length} itens)`);

// 9. Criar pedido pela RPC (o checkout precisa)
const novo = await rpc('aura_criar_pedido', {
  p_show_id: SHOW, p_setor: 'Pista', p_quantidade: 2,
  p_nome: 'TESTE AUTOMATIZADO', p_cpf: '111.444.777-35',
  p_email: 'teste@exemplo.com', p_whatsapp: '19999999999', p_metodo: 'PIX'
});
let nb = {}; try { nb = JSON.parse(novo.b); } catch {}
if (nb.codigo_pedido) criados.push(nb.codigo_pedido);
checar('9. Checkout AINDA cria pedido', nb.ok === true && nb.codigos?.length === 2,
  `${nb.codigo_pedido} codigos=${JSON.stringify(nb.codigos)} total=${nb.valor_total} status=${nb.status_pagamento}`);

// 10. Preco do ingresso vem do banco
checar('10. Preco do ingresso veio do banco (R$40 x2 = R$80)',
  Number(nb.valor_total) === 80 && Number(nb.preco_unitario) === 40,
  `unitario=${nb.preco_unitario} total=${nb.valor_total}`);

// 11. Voucher continua abrindo pelo link, sem CPF junto
const vc = await rpc('aura_buscar_voucher', { p_codigo: nb.codigos?.[0] });
let vb = {}; try { vb = JSON.parse(vc.b); } catch {}
checar('11. Voucher abre pelo link e NAO devolve CPF',
  vb.ok === true && !!vb.ingresso?.titular_nome && !('titular_cpf' in (vb.ingresso || {})),
  `show="${vb.ingresso?.show_titulo}" pago=${vb.ingresso?.pago} campos=${Object.keys(vb.ingresso || {}).length}`);

// 12. Pedido nasce pendente e com prazo
checar('12. Pedido nasce PENDENTE e com prazo de validade',
  nb.status_pagamento === 'PENDENTE' && !!nb.expira_em,
  `status=${nb.status_pagamento} expira_em=${nb.expira_em}`);

// 13. Nao da para furar a quantidade maxima
const abuso = await rpc('aura_criar_pedido', {
  p_show_id: SHOW, p_setor: 'Pista', p_quantidade: 999,
  p_nome: 'ABUSO', p_cpf: '111.444.777-35', p_email: 'a@b.com',
  p_whatsapp: '19999999999', p_metodo: 'PIX'
});
checar('13. Quantidade absurda e recusada', abuso.b.includes('QUANTIDADE_INVALIDA'), abuso.b.slice(0, 80));

console.log('\n=== O CODIGO DO QR NAO PODE SER ADIVINHAVEL ===\n');

// 14. O codigo do ingresso nao pode derivar do numero do pedido.
// Antes era AURA-00042-PISTA-1: quem comprou o 42 sabia que existia o 41,
// abria o voucher de outra pessoa e podia entrar no lugar dela.
const numeroPedido = (nb.codigo_pedido || '').replace('AURA-', '');
const codigo0 = nb.codigos?.[0] || '';
checar('14. Codigo do ingresso NAO contem o numero do pedido',
  !!codigo0 && !codigo0.includes(numeroPedido),
  `pedido=${nb.codigo_pedido} codigo=${codigo0}`);

// 15. Formato aleatorio esperado, com alfabeto sem 0/O/1/I
checar('15. Codigo segue o formato aleatorio AURA-XXXXX-XXXXX',
  /^AURA-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/.test(codigo0),
  codigo0);

// 16. Dois ingressos do mesmo pedido tem codigos diferentes e sem sequencia
const [c1, c2] = nb.codigos || [];
checar('16. Ingressos do mesmo pedido nao formam sequencia', !!c1 && !!c2 && c1 !== c2,
  `${c1} vs ${c2}`);

// 17. Um codigo vizinho inventado nao existe (nao da para varrer a base)
const vizinho = await rpc('aura_buscar_voucher', { p_codigo: 'AURA-00001-PISTA-1' });
checar('17. Codigo no formato antigo nao encontra nada',
  vizinho.b.includes('NAO_ENCONTRADO'), vizinho.b.slice(0, 70));

console.log('\n=== O PRECO DO COMBO NAO PODE VIR DO NAVEGADOR ===\n');

// 18. A assinatura antiga aceitava p_combo_preco: combo de R$380 saia por R$0.
const tampering = await rpc('aura_criar_pedido', {
  p_show_id: SHOW, p_setor: 'Pista', p_quantidade: 1,
  p_nome: 'TENTATIVA DE FRAUDE', p_cpf: '111.444.777-35', p_email: 'a@b.com',
  p_whatsapp: '19999999999', p_metodo: 'PIX',
  p_combo_nome: 'CARD DOURADO: Combo Black Label', p_combo_preco: 0
});
let tb = {}; try { tb = JSON.parse(tampering.b); } catch {}
if (tb.codigo_pedido) criados.push(tb.codigo_pedido);
checar('18. A assinatura antiga (com p_combo_preco) nao existe mais',
  tampering.s === 404 || tampering.b.includes('PGRST202') || tb.ok !== true,
  `HTTP ${tampering.s} — ${tampering.b.slice(0, 110)}`);

// 19. Com o id certo, o preco do combo vem da tabela
const comCombo = await rpc('aura_criar_pedido', {
  p_show_id: SHOW, p_setor: 'Pista', p_quantidade: 1,
  p_nome: 'TESTE COMBO', p_cpf: '111.444.777-35', p_email: 'a@b.com',
  p_whatsapp: '19999999999', p_metodo: 'PIX', p_combo_id: 'combo-black-label'
});
let cc = {}; try { cc = JSON.parse(comCombo.b); } catch {}
if (cc.codigo_pedido) criados.push(cc.codigo_pedido);
checar('19. Preco do combo veio do banco (40 + 380 = 420)',
  cc.ok === true && Number(cc.valor_total) === 420 && cc.combo?.id === 'combo-black-label',
  `total=${cc.valor_total} combo=${cc.combo?.titulo}`);

// 20. Combo inventado e recusado (antes qualquer texto virava combo)
const comboFalso = await rpc('aura_criar_pedido', {
  p_show_id: SHOW, p_setor: 'Pista', p_quantidade: 1,
  p_nome: 'COMBO FALSO', p_cpf: '111.444.777-35', p_email: 'a@b.com',
  p_whatsapp: '19999999999', p_metodo: 'PIX', p_combo_id: 'CARD DOURADO DE GRACA'
});
let cf = {}; try { cf = JSON.parse(comboFalso.b); } catch {}
if (cf.codigo_pedido) criados.push(cf.codigo_pedido);
checar('20. Combo inexistente e recusado', cf.ok !== true && comboFalso.b.includes('COMBO_INVALIDO'),
  comboFalso.b.slice(0, 90));

// 21. Nome gigante nao passa (protege a tela do dono e o banco)
const gigante = await rpc('aura_criar_pedido', {
  p_show_id: SHOW, p_setor: 'Pista', p_quantidade: 1,
  p_nome: 'X'.repeat(5000), p_cpf: '111.444.777-35', p_email: 'a@b.com',
  p_whatsapp: '19999999999', p_metodo: 'PIX'
});
let gb = {}; try { gb = JSON.parse(gigante.b); } catch {}
if (gb.codigo_pedido) criados.push(gb.codigo_pedido);
checar('21. Nome absurdamente longo e recusado', gigante.b.includes('DADOS_INVALIDOS'),
  gigante.b.slice(0, 80));

// ---------------------------------------------------------------------
// Limpeza. Precisa da conta do dono; sem ela os pedidos ficam no banco e
// os codigos sao impressos para remocao manual. (Eles tambem expiram
// sozinhos em 45 minutos e devolvem a vaga ao lote.)
// ---------------------------------------------------------------------
let limpeza = 'APAGUE NA MAO (defina AURA_DONO_EMAIL/AURA_DONO_SENHA para limpar sozinho)';
if (criados.length && process.env.AURA_DONO_EMAIL && process.env.AURA_DONO_SENHA) {
  try {
    const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.AURA_DONO_EMAIL, password: process.env.AURA_DONO_SENHA })
    });
    if (login.ok) {
      const { access_token } = await login.json();
      const resultados = [];
      for (const cod of criados) {
        const r = await fetch(`${URL}/rest/v1/rpc/aura_cancelar_pedido`, {
          method: 'POST',
          headers: { apikey: ANON, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_codigo_pedido: cod })
        });
        const c = await r.json();
        resultados.push(`${cod}:${c.ok ? 'cancelado' : (c.motivo || 'falhou')}`);
      }
      limpeza = resultados.join(' ');
    }
  } catch (e) { limpeza = 'falhou: ' + e.message; }
}

console.log('\n' + '='.repeat(62));
const falhas = res.filter(r => !r.ok);
console.log(`${res.length - falhas.length}/${res.length} verificacoes passaram`);
if (falhas.length) console.log('FALHAS:\n  - ' + falhas.map(f => f.nome).join('\n  - '));
console.log('='.repeat(62));
console.log('\nPEDIDOS DE TESTE: ' + (criados.join(', ') || 'nenhum') + '\n  -> ' + limpeza);
process.exit(falhas.length ? 1 : 0);
