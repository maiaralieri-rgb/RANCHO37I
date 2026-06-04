import { readFileSync } from 'fs';
let pass=0, fail=0;
const check=(nome,cond)=>{ console.log(`${cond?'✓':'✗ FALHA'} ${nome}`); cond?pass++:fail++; };

console.log('\n=== TESTE DE INTEGRIDADE DOM (todo getElementById tem elemento correspondente) ===\n');

const html = readFileSync('/home/claude/rancho37i.html','utf8');
const js = html.split('<script type="module">')[1].split('</script>')[0];

// Coletar todos os IDs definidos no HTML
const idsDefinidos = new Set();
for(const m of html.matchAll(/id="([^"]+)"/g)) idsDefinidos.add(m[1]);

// Coletar todos os getElementById('...') no JS
const idsUsados = new Set();
for(const m of js.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)) idsUsados.add(m[1]);

console.log(`IDs definidos no HTML: ${idsDefinidos.size}`);
console.log(`IDs referenciados no JS: ${idsUsados.size}\n`);

// IDs criados dinamicamente via JS (não precisam estar no HTML estático)
const dinamicos = new Set(['hc-arr-card','notas-pub']); // notas-pub removido de propósito, função tem guarda if(!el)return

let faltando = [];
for(const id of idsUsados){
  if(!idsDefinidos.has(id) && !dinamicos.has(id)) faltando.push(id);
}
check(`Todos os ${idsUsados.size} IDs usados existem no HTML`, faltando.length===0);
if(faltando.length) console.log('  IDs faltando:', faltando.join(', '));

// Funções essenciais expostas em window (chamadas via onclick no HTML)
const onclicks = new Set();
for(const m of html.matchAll(/onclick="(\w+)\(/g)) onclicks.add(m[1]);
for(const m of html.matchAll(/onchange="(\w+)\(/g)) onclicks.add(m[1]);
let semWindow=[];
for(const fn of onclicks){
  if(!new RegExp(`window\\.${fn}\\s*=`).test(js)) semWindow.push(fn);
}
check(`Todas as ${onclicks.size} funções de onclick/onchange expostas em window`, semWindow.length===0);
if(semWindow.length) console.log('  Faltando window.:', semWindow.join(', '));

console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
process.exit(fail>0?1:0);
