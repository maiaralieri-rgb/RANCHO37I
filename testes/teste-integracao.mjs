import { MockDB, makeApi } from './mock-firebase.mjs';

let pass=0, fail=0;
const eq=(nome,got,exp)=>{
  const ok=JSON.stringify(got)===JSON.stringify(exp);
  console.log(`${ok?'✓':'✗'} ${nome}${ok?'':`  → esperado ${JSON.stringify(exp)}, obtido ${JSON.stringify(got)}`}`);
  ok?pass++:fail++;
};

console.log('\n=== TESTES DE INTEGRAÇÃO — FLUXO DE CARREGAMENTO (anti-bug "Carregando...") ===\n');

// ---- Reproduz a lógica REAL dos listeners do app ----
function criarApp(api, db){
  const DK=['seg','ter','qua','qui','sex'];
  const { doc, collection, query, orderBy, getDoc, getDocs, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc } = api;

  // Estado (igual ao app)
  let semAtiva=null, _cacheSem=null, _cacheIns=[], _semCarregada=null;
  let unsubSem=null, unsubIns=null, unsubSemDoc=null;

  // "DOM" simulado — o que está renderizado na tela
  const tela = { cardapio:'(inicial)', inscritos:'(inicial)', valor:null, arrecadado:null, semanaLabel:null };

  function cntD(dias){ return DK.reduce((a,d)=>a+(dias&&dias[d]?1:0),0); }

  function renderHero(sem, ins){
    if(!sem){ tela.semanaLabel=null; tela.cardapio='Cardápio não definido.'; tela.inscritos='Nenhum inscrito ainda.'; tela.valor=null; tela.arrecadado=0; return; }
    tela.semanaLabel=sem.label;
    const vlr=parseFloat(sem.valor)||0;
    tela.valor=vlr;
    tela.arrecadado=ins.filter(i=>i.pago).reduce((a,i)=>a+cntD(i.dias)*vlr,0);
    const cdp=sem.cardapio||[];
    tela.cardapio = cdp.some(r=>r&&r.principal) ? cdp.map(r=>r&&r.principal?r.principal:'—').join(' | ') : 'Cardápio não definido.';
    tela.inscritos = ins.length ? ins.map(i=>i.qra).join(', ') : 'Nenhum inscrito ainda.';
  }

  async function carregarSemanaAtiva(){
    if(!semAtiva){ renderHero(null,[]); return; }
    if(unsubIns){ unsubIns(); unsubIns=null; }
    if(unsubSemDoc){ unsubSemDoc(); unsubSemDoc=null; }
    _semCarregada=semAtiva;
    const semIdLocal=semAtiva;
    const semRef=doc(db,'semanas',semAtiva);
    const insRef=collection(db,'semanas',semAtiva,'inscritos');
    unsubSemDoc=onSnapshot(semRef, s=>{
      if(semAtiva!==semIdLocal) return;
      if(!s.exists()){ _cacheSem=null; renderHero(null,_cacheIns); return; }
      _cacheSem={id:s.id,...s.data()};
      renderHero(_cacheSem,_cacheIns);
    }, e=>{ tela.cardapio='ERRO'; });
    unsubIns=onSnapshot(insRef, s=>{
      if(semAtiva!==semIdLocal) return;
      _cacheIns=s.docs.map(d=>({id:d.id,...d.data()}));
      renderHero(_cacheSem,_cacheIns);
    }, e=>{});
  }

  function iniciarListeners(){
    const semanasRef=collection(db,'semanas');
    if(unsubSem) unsubSem();
    unsubSem=onSnapshot(query(semanasRef,orderBy('criadoEm','asc')), snap=>{
      const semanas=snap.docs.map(d=>({id:d.id,...d.data()}));
      if(!semAtiva && semanas.length) semAtiva=semanas[semanas.length-1].id;
      if(semAtiva && semAtiva!==_semCarregada){ carregarSemanaAtiva(); }
      else if(!semAtiva){ renderHero(null,[]); }
    }, e=>{});
  }

  async function trocarSemana(id){
    if(id===semAtiva) return;
    semAtiva=id; _semCarregada=null;
    await carregarSemanaAtiva();
  }

  return {
    tela, iniciarListeners, trocarSemana,
    contarListeners:()=>db.listeners.length,
    getSemAtiva:()=>semAtiva
  };
}

// ===== CENÁRIO 1: dados JÁ EXISTEM no Firebase ao abrir (o caso que estava quebrado) =====
{
  const db=new MockDB();
  const api=makeApi(db);
  // popular ANTES de abrir o app
  db.data['semanas/sem1']={label:'08JUN a 12JUN', valor:15, criadoEm:1, cardapio:[{principal:'BIFE ACEBOLADO',acomp:'SALADA (FOLHAS, TOMATE OU BETERRABA)'},{principal:'CARNE MOÍDA',acomp:''},{principal:'',acomp:''},{principal:'',acomp:''},{principal:'',acomp:''}]};
  db.data['semanas/sem1/inscritos/i1']={qra:'Sd PM Yeda',dias:{seg:1,ter:1,qua:1,qui:1,sex:0},pago:true};
  db.data['semanas/sem1/inscritos/i2']={qra:'Lieri',dias:{seg:1,ter:1,qua:1,qui:0,sex:0},pago:true};

  const app=criarApp(api,db);
  app.iniciarListeners();

  eq('C1: semana ativa detectada', app.getSemAtiva(), 'sem1');
  eq('C1: label renderizado', app.tela.semanaLabel, '08JUN a 12JUN');
  eq('C1: valor R$15', app.tela.valor, 15);
  eq('C1: cardápio carregado (NÃO travou em Carregando)', app.tela.cardapio.includes('BIFE ACEBOLADO'), true);
  eq('C1: inscritos carregados', app.tela.inscritos, 'Sd PM Yeda, Lieri');
  eq('C1: arrecadado R$105 (4+3 dias x15)', app.tela.arrecadado, 105);
}

// ===== CENÁRIO 2: app abre vazio e dados chegam depois (tempo real) =====
{
  const db=new MockDB();
  const api=makeApi(db);
  const app=criarApp(api,db);
  app.iniciarListeners();
  eq('C2: tela vazia inicial', app.tela.semanaLabel, null);

  // admin cria semana
  api.setDoc(api.doc(db,'semanas','semX'), {label:'Nova',valor:20,criadoEm:5,cardapio:[{principal:'FRANGO',acomp:''}]});
  eq('C2: semana aparece em tempo real', app.tela.semanaLabel, 'Nova');
  eq('C2: cardápio em tempo real', app.tela.cardapio.includes('FRANGO'), true);

  // alguém se inscreve
  api.addDoc(api.collection(db,'semanas','semX','inscritos'), {qra:'Teste',dias:{seg:1,ter:0,qua:0,qui:0,sex:0},pago:true});
  eq('C2: inscrito aparece em tempo real', app.tela.inscritos, 'Teste');
  eq('C2: arrecadado atualiza (R$20)', app.tela.arrecadado, 20);
}

console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
process.exit(fail>0?1:0);
