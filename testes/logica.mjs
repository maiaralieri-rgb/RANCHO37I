// Funções de lógica pura extraídas do app, para teste isolado.
export const DK = ['seg','ter','qua','qui','sex'];
export const DN = ['SEG','TER','QUA','QUI','SEX'];

export function cntD(dias){ if(!dias) return 0; return DK.reduce((a,d)=>a+(dias[d]?1:0),0); }

// Total de um inscrito
export function totalInscrito(ins, vlr){ return cntD(ins.dias)*vlr; }

// Total arrecadado (só pagos)
export function totalArrecadado(inscritos, vlr){
  return inscritos.filter(i=>i.pago).reduce((a,i)=>a+cntD(i.dias)*vlr,0);
}
// Total previsto (todos)
export function totalPrevisto(inscritos, vlr){
  return inscritos.reduce((a,i)=>a+cntD(i.dias)*vlr,0);
}
// Marmitas por dia
export function marmitasPorDia(inscritos){
  return DK.map(dk => inscritos.filter(i=>i.dias&&i.dias[dk]).length);
}
// Verifica duplicata (case-insensitive)
export function ehDuplicata(inscritos, qra){
  return inscritos.some(i=>i.qra.toLowerCase()===qra.toLowerCase());
}
// Saldo/crédito próxima semana
export function saldoProx(arrecadado, creditoAnt, gastos){
  return arrecadado + creditoAnt - gastos;
}
// Prazo encerrado?
export function prazoEncerrado(prazoData, prazoHora, agora){
  if(!prazoData) return false;
  const prazo = new Date(prazoData+'T'+(prazoHora||'23:59'));
  return agora > prazo;
}
