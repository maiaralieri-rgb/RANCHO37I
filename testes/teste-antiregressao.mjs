import { readFileSync } from 'fs';

let pass=0, fail=0;
const check=(nome,cond)=>{ console.log(`${cond?'✓':'✗ FALHA'} ${nome}`); cond?pass++:fail++; };

console.log('\n=== TESTES ANTI-REGRESSÃO (analisam o código-fonte do app) ===\n');

const html = readFileSync('/home/claude/rancho37i.html','utf8');
const js = html.split('<script type="module">')[1].split('</script>')[0];

// --- REGRESSÃO BUG 1: variáveis de cache devem estar SEMPRE declaradas ---
check('BUG1: _cacheSem declarado com let/var/const',
  /\b(let|var|const)\s+_cacheSem\b/.test(js));
check('BUG1: _cacheIns declarado com let/var/const',
  /\b(let|var|const)\s+_cacheIns\b/.test(js));
check('BUG1: _semCarregada declarado',
  /\b(let|var|const)\s+_semCarregada\b/.test(js));

// detecta atribuição a variável de cache que não tenha declaração (o erro original)
const usaCacheSem = /_cacheSem\s*=/.test(js);
const declaraCacheSem = /\b(let|var|const)\s+_cacheSem\b/.test(js);
check('BUG1: nenhuma atribuição a _cacheSem sem declaração', !(usaCacheSem && !declaraCacheSem));

// --- REGRESSÃO BUG 2: todo onSnapshot persistente deve ter unsub correspondente ---
check('BUG2: unsubSem declarado e usado', /unsubSem\s*=\s*onSnapshot/.test(js) && /if\(unsubSem\)\s*unsubSem\(\)/.test(js));
check('BUG2: unsubIns com cancelamento antes de recriar', /if\(unsubIns\)\{?\s*unsubIns\(\)/.test(js));
check('BUG2: unsubSemDoc com cancelamento (listener de semana não vaza)', /if\(unsubSemDoc\)\{?\s*unsubSemDoc\(\)/.test(js));
check('BUG2: guarda _semCarregada evita recarga duplicada', /semAtiva\s*!==\s*_semCarregada/.test(js));

// --- REGRESSÃO BUG 3: listeners devem ter callback de erro ---
const snapshots = js.match(/onSnapshot\(/g) || [];
const errCallbacks = js.match(/\},\s*err=>/g) || js.match(/\},\s*e=>/g) || [];
check('BUG3: listeners principais têm tratamento de erro', (js.match(/err=>/g)||[]).length >= 3);

// --- Integridade de funções essenciais ---
check('função iniciarListeners existe', /async function iniciarListeners/.test(js));
check('função carregarSemanaAtiva existe', /async function carregarSemanaAtiva/.test(js));
check('função renderHero existe', /function renderHero/.test(js));
check('função inscrever existe', /async function inscrever/.test(js));
check('função fazerBackup existe', /async function fazerBackup/.test(js));
check('função restaurarBackup existe', /async function restaurarBackup/.test(js));

// --- Credenciais Firebase corretas (projeto atual) ---
check('credencial: projectId correto', js.includes('rancho-37i-948eb'));
check('credencial: apiKey presente', js.includes('AIzaSyC-TAsDQSQRLXqByhNjgtzerbOL0qEWzdQ'));

// --- Regra de negócio salada (memória do usuário) ---
// (verifica no app que o cardápio admin não força texto, mas o importador sim — então só garante consistência)

// --- onSnapshot deve disparar render mesmo com cache vazio (anti "Carregando...") ---
check('ANTI-TRAVA: renderHero chamado dentro do listener de inscritos', /unsubIns\s*=\s*onSnapshot[\s\S]{0,300}renderHero/.test(js));
check('ANTI-TRAVA: renderHero chamado dentro do listener de semana', /unsubSemDoc\s*=\s*onSnapshot[\s\S]{0,300}renderHero/.test(js));

// --- Sintaxe geral: contagem de chaves balanceada ---
const abre=(js.match(/\{/g)||[]).length, fecha=(js.match(/\}/g)||[]).length;
check(`sintaxe: chaves balanceadas (${abre} abre / ${fecha} fecha)`, abre===fecha);

console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
process.exit(fail>0?1:0);
