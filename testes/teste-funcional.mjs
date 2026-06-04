import { MockDB, makeApi } from './mock-firebase.mjs';
import * as L from './logica.mjs';

let pass=0, fail=0;
const eq=(nome,got,exp)=>{
  const ok=JSON.stringify(got)===JSON.stringify(exp);
  console.log(`${ok?'✓':'✗'} ${nome}${ok?'':`  → esperado ${JSON.stringify(exp)}, obtido ${JSON.stringify(got)}`}`);
  ok?pass++:fail++;
};

console.log('\n=== TESTES FUNCIONAIS — LÓGICA DE NEGÓCIO ===\n');

// Dados reais do batalhão (relatório 08JUN a 12JUN, R$15)
const VLR=15;
const inscritos=[
  {qra:'Sd PM Yeda',     dias:{seg:1,ter:1,qua:1,qui:1,sex:0}, pago:true},
  {qra:'Christianini',   dias:{seg:1,ter:1,qua:1,qui:0,sex:0}, pago:true},
  {qra:'Cb PM Carlinhos',dias:{seg:1,ter:0,qua:0,qui:0,sex:0}, pago:true},
  {qra:'Cb PM Formenton',dias:{seg:1,ter:0,qua:0,qui:0,sex:0}, pago:true},
  {qra:'Sgt Arley',      dias:{seg:1,ter:1,qua:1,qui:1,sex:0}, pago:true},
  {qra:'Lieri',          dias:{seg:1,ter:1,qua:1,qui:0,sex:0}, pago:true},
  {qra:'Cb Correia',     dias:{seg:1,ter:1,qua:0,qui:0,sex:1}, pago:true},
  {qra:'Ten Cel Nucci',  dias:{seg:1,ter:1,qua:0,qui:1,sex:1}, pago:true},
];

eq('contagem dias Yeda (4)', L.cntD(inscritos[0].dias), 4);
eq('contagem dias Carlinhos (1)', L.cntD(inscritos[2].dias), 1);
eq('total Yeda R$60', L.totalInscrito(inscritos[0],VLR), 60);
eq('total Correia R$45', L.totalInscrito(inscritos[6],VLR), 45);
eq('total arrecadado R$345', L.totalArrecadado(inscritos,VLR), 345);
eq('total previsto R$345 (todos pagos)', L.totalPrevisto(inscritos,VLR), 345);
eq('marmitas por dia [8,6,4,3,2]', L.marmitasPorDia(inscritos), [8,6,4,3,2]);

// Cenário com não-pagos
const comDevedor=[...inscritos, {qra:'Novato',dias:{seg:1,ter:1,qua:0,qui:0,sex:0},pago:false}];
eq('arrecadado ignora não-pago (345)', L.totalArrecadado(comDevedor,VLR), 345);
eq('previsto inclui não-pago (375)', L.totalPrevisto(comDevedor,VLR), 375);

// Duplicatas
eq('duplicata exata', L.ehDuplicata(inscritos,'Lieri'), true);
eq('duplicata case-insensitive', L.ehDuplicata(inscritos,'lieri'), true);
eq('duplicata com espaço/caixa', L.ehDuplicata(inscritos,'SD PM YEDA'), true);
eq('não-duplicata', L.ehDuplicata(inscritos,'Tenente Novo'), false);

// Saldo
eq('saldo sem gastos = arrecadado', L.saldoProx(345,0,0), 345);
eq('saldo com gastos', L.saldoProx(345,0,200), 145);
eq('saldo com crédito anterior', L.saldoProx(345,50,200), 195);
eq('saldo negativo (déficit)', L.saldoProx(100,0,200), -100);

// Prazo
eq('prazo encerrado (passado)', L.prazoEncerrado('2026-06-01','12:00',new Date('2026-06-02T10:00')), true);
eq('prazo aberto (futuro)', L.prazoEncerrado('2026-06-30','12:00',new Date('2026-06-02T10:00')), false);
eq('sem prazo = sempre aberto', L.prazoEncerrado('','',new Date()), false);

// Contagem com dias undefined/vazios
eq('cntD null = 0', L.cntD(null), 0);
eq('cntD vazio = 0', L.cntD({}), 0);

console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
process.exit(fail>0?1:0);
