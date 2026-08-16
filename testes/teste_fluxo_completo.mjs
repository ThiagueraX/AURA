// Fluxo completo: compra anonima -> conferencia do dono -> entrada na portaria.
const URL = 'https://sgfyxmajpdgynsicmzdb.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZnl4bWFqcGRneW5zaWNtemRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDcyNzUsImV4cCI6MjEwMDcyMzI3NX0.auX5eGMcbyeGYZdfOOd4uSPwCWe35NnaQPzi27BrMQ0';
const SHOW = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

// Contas de teste vem do ambiente — nenhuma credencial fica no arquivo.
//   AURA_DONO_EMAIL / AURA_DONO_SENHA
//   AURA_PORTARIA_EMAIL / AURA_PORTARIA_SENHA  (opcional: cai na conta do dono)
const CONTA_DONO = {
  email: process.env.AURA_DONO_EMAIL,
  senha: process.env.AURA_DONO_SENHA
};
const CONTA_PORTARIA = {
  email: process.env.AURA_PORTARIA_EMAIL || CONTA_DONO.email,
  senha: process.env.AURA_PORTARIA_SENHA || CONTA_DONO.senha
};

if (!CONTA_DONO.email || !CONTA_DONO.senha) {
  console.error('Defina AURA_DONO_EMAIL e AURA_DONO_SENHA antes de rodar.');
  console.error('Ex.: AURA_DONO_EMAIL=voce@email.com AURA_DONO_SENHA=... node testes/teste_fluxo_completo.mjs');
  process.exit(2);
}

// Este teste cria um pedido de verdade no banco. Ele o cancela no fim, mas
// se cair no meio pode deixar rastro — apague o pedido informado na saida.
const res = [];
const checar = (n, ok, d) => { res.push({ n, ok }); console.log(`${ok ? 'OK   ' : 'FALHA'} ${n}${d ? '  ->  ' + d : ''}`); };

async function entrar(conta) {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: conta.email, password: conta.senha })
  });
  if (!r.ok) throw new Error('login falhou para ' + conta.email + ': ' + await r.text());
  return (await r.json()).access_token;
}

const rpc = async (fn, body, token) => {
  const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${token || ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const t = await r.text();
  let v; try { v = JSON.parse(t); } catch { return { s: r.status, bruto: t }; }
  // aura_papel devolve uma string JSON pura, nao um objeto
  return (v && typeof v === 'object') ? { s: r.status, ...v } : { s: r.status, valor: v, bruto: t };
};

console.log('=== LOGIN DA EQUIPE ===\n');
const tokenPortaria = await entrar(CONTA_PORTARIA);
const tokenDono = await entrar(CONTA_DONO);
checar('1. Login com conta da equipe funciona', !!tokenPortaria && !!tokenDono);

const papelP = await rpc('aura_papel', {}, tokenPortaria);
const papelD = await rpc('aura_papel', {}, tokenDono);
const mesmaConta = CONTA_PORTARIA.email === CONTA_DONO.email;
checar('2. Papel vem do banco, nao do navegador',
  ['portaria', 'dono'].includes(papelP.valor) && papelD.valor === 'dono',
  `conta-portaria=${papelP.valor} conta-dono=${papelD.valor}`);

// Linha de base: o teste mede variacao, para poder rodar quantas vezes quiser
const base = await rpc('aura_metricas', { p_show_id: SHOW }, tokenDono);
const baseResumo = await rpc('aura_resumo_portaria', { p_show_id: SHOW }, tokenPortaria);

console.log('\n=== COMPRA (VISITANTE ANONIMO) ===\n');
const compra = await rpc('aura_criar_pedido', {
  p_show_id: SHOW, p_setor: 'Camarote', p_quantidade: 3,
  p_nome: 'FLUXO DE TESTE', p_cpf: '111.444.777-35', p_email: 'fluxo@teste.com',
  p_whatsapp: '19999999999', p_metodo: 'PIX'
});
checar('3. Compra criada com 3 codigos distintos',
  compra.ok && compra.codigos.length === 3 && new Set(compra.codigos).size === 3,
  `${compra.codigo_pedido} · ${compra.codigos?.join(' ')}`);
checar('4. Preco do CAMAROTE veio do banco (R$90, nao os R$80 do HTML)',
  Number(compra.preco_unitario) === 90 && Number(compra.valor_total) === 270,
  `unitario=${compra.preco_unitario} total=${compra.valor_total}`);

console.log('\n=== PORTARIA ANTES DA CONFIRMACAO ===\n');
const antes = await rpc('aura_validar_ingresso', { p_codigo: compra.codigos[0], p_operador: 'qa' }, tokenPortaria);
checar('5. Ingresso NAO PAGO nao abre a portaria',
  antes.sucesso === false && antes.motivo === 'NAO_PAGO', antes.mensagem);

// Estas duas so fazem sentido com uma conta de portaria separada da do dono
if (mesmaConta) {
  console.log('PULA 6 e 7 (separacao de papeis) — defina AURA_PORTARIA_EMAIL/SENHA para testar');
} else {
  const tentaConfirmar = await rpc('aura_confirmar_pagamento', { p_codigo_pedido: compra.codigo_pedido }, tokenPortaria);
  checar('6. Porteiro NAO consegue confirmar pagamento',
    tentaConfirmar.ok === false && tentaConfirmar.motivo === 'SEM_PERMISSAO', tentaConfirmar.motivo);

  const metricaPorteiro = await rpc('aura_metricas', {}, tokenPortaria);
  checar('7. Porteiro NAO ve faturamento',
    metricaPorteiro.s === 401 || metricaPorteiro.ok === false,
    `HTTP ${metricaPorteiro.s} motivo=${metricaPorteiro.motivo}`);
}

console.log('\n=== DONO CONFERE O PIX ===\n');
const pendentes = await rpc('aura_pedidos_pendentes', { p_show_id: SHOW }, tokenDono);
const achou = (pendentes.pedidos || []).find(p => p.codigo_pedido === compra.codigo_pedido);
checar('8. Pedido aparece na lista de conferencia do dono',
  !!achou, achou ? `${achou.cliente_nome} · R$ ${achou.valor_total} · ${achou.quantidade}x` : 'nao apareceu');

const met = await rpc('aura_metricas', { p_show_id: SHOW }, tokenDono);
const deltaAguardando = Number(met.valorAguardando) - Number(base.valorAguardando);
const deltaConfirmado = Number(met.totalFaturamento) - Number(base.totalFaturamento);
checar('9. Antes de confirmar, os R$270 contam como AGUARDANDO, nao faturamento',
  met.ok && deltaAguardando === 270 && deltaConfirmado === 0,
  `+aguardando=${deltaAguardando} +confirmado=${deltaConfirmado}`);

const conf = await rpc('aura_confirmar_pagamento', { p_codigo_pedido: compra.codigo_pedido }, tokenDono);
checar('10. Dono confirma o pagamento', conf.ok === true, conf.mensagem);

const reconf = await rpc('aura_confirmar_pagamento', { p_codigo_pedido: compra.codigo_pedido }, tokenDono);
checar('11. Confirmar duas vezes nao duplica nada',
  reconf.ok === false && reconf.motivo === 'NAO_APLICAVEL', reconf.mensagem);

console.log('\n=== PORTARIA DEPOIS DA CONFIRMACAO ===\n');
const entra = await rpc('aura_validar_ingresso', { p_codigo: compra.codigos[0], p_operador: 'qa' }, tokenPortaria);
checar('12. Agora o ingresso 1 libera a entrada',
  entra.sucesso === true && entra.motivo === 'LIBERADO', entra.mensagem);

const denovo = await rpc('aura_validar_ingresso', { p_codigo: compra.codigos[0], p_operador: 'qa' }, tokenPortaria);
checar('13. O mesmo QR nao entra duas vezes',
  denovo.sucesso === false && denovo.motivo === 'JA_UTILIZADO', denovo.mensagem);

const segundo = await rpc('aura_validar_ingresso', { p_codigo: compra.codigos[1], p_operador: 'qa' }, tokenPortaria);
checar('14. O ingresso 2 do mesmo pedido entra normalmente',
  segundo.sucesso === true, segundo.mensagem);

// Corrida: dois leitores no mesmo QR ao mesmo tempo
const [a, b] = await Promise.all([
  rpc('aura_validar_ingresso', { p_codigo: compra.codigos[2], p_operador: 'leitor-A' }, tokenPortaria),
  rpc('aura_validar_ingresso', { p_codigo: compra.codigos[2], p_operador: 'leitor-B' }, tokenPortaria)
]);
const quantosPassaram = [a, b].filter(x => x.sucesso === true).length;
checar('15. Dois leitores simultaneos: so UM entra',
  quantosPassaram === 1, `A=${a.motivo} B=${b.motivo}`);

console.log('\n=== VOUCHER DO CLIENTE ===\n');
const vc = await rpc('aura_buscar_voucher', { p_codigo: compra.codigos[0] });
checar('16. Voucher mostra pago e utilizado, sem CPF',
  vc.ok && vc.ingresso.pago === true && vc.ingresso.status === 'UTILIZADO'
    && !('titular_cpf' in vc.ingresso),
  `pago=${vc.ingresso?.pago} status=${vc.ingresso?.status} show=${vc.ingresso?.show_titulo}`);

const resumo = await rpc('aura_resumo_portaria', { p_show_id: SHOW }, tokenPortaria);
checar('17. Placar conta so o show ativo e so o que foi pago',
  resumo.ok && (resumo.total - baseResumo.total) === 3
            && (resumo.validados - baseResumo.validados) === 3,
  `+emitidos=${resumo.total - baseResumo.total} +entraram=${resumo.validados - baseResumo.validados} · totais: ${resumo.total}/${resumo.validados}, aguardando=${resumo.aguardando_pagamento}`);

// Limpeza: cancela o pedido de teste e devolve as vagas ao lote
const limpou = await rpc('aura_cancelar_pedido', { p_codigo_pedido: compra.codigo_pedido }, tokenDono);

console.log('\n' + '='.repeat(62));
const falhas = res.filter(r => !r.ok);
console.log(`${res.length - falhas.length}/${res.length} verificacoes passaram`);
if (falhas.length) console.log('FALHAS: ' + falhas.map(f => f.n).join(' | '));
console.log('='.repeat(62));
console.log('PEDIDO DE TESTE ' + compra.codigo_pedido +
            (limpou.ok ? ' — cancelado e vagas devolvidas' : ' — APAGUE NA MAO: ' + limpou.motivo));
process.exit(falhas.length ? 1 : 0);
