# RANCHO 37I — Protocolo de Desenvolvimento

## Contexto do projeto
- Aplicação web single-file Firebase (`index.html`)
- Hospedagem: Netlify, auto-deploy do branch `main`
- URL: `https://previsaoderancho37bpmi-bymlr.netlify.app`
- Firebase project: `rancho-37i-948eb`
- Repositório: `maiaralieri-rgb/RANCHO37I`

## Regras permanentes (toda sessão, toda entrega)

### Versionamento obrigatório
- Cada commit DEVE incrementar a versão no rodapé: `desenvolvedor: Maiara Lieri Ribeiro · vN`
- Cada commit DEVE atualizar a tag de deploy: `<!-- deploy:YYYYMMDD-vN-descricao -->`
- Nunca pular versão, nunca regredir versão

### Regra de commit
- Toda alteração vai para `main` com `git push -u origin main`
- Nunca commitar sem testar a integridade do HTML (divs fechados, funções exportadas)
- Mensagem de commit sempre em português, descritiva

### Firestore — coleções autorizadas
As regras em `firestore.rules` cobrem:
- `semanas/{semId}` — leitura/escrita livre
- `semanas/{semId}/inscritos/{inscId}` — leitura/escrita livre
- `config/{docId}` — leitura/escrita livre (avisos, configurações globais)
- Qualquer outra coleção está **bloqueada** — ao adicionar nova coleção, atualizar `firestore.rules` no mesmo commit

### Funções JS em atributos onclick
- Toda função usada em `onclick="fn()"` no HTML **DEVE** ser exportada via `window.fn = fn`
- Antes de qualquer entrega, verificar que todos os `onclick` têm correspondente `window.*`

### Verificação anti-regressão (antes de todo commit)
Checar mentalmente (ou com grep) os seguintes itens:
1. `onclick` sem `window.*` correspondente → erro silencioso
2. Nova coleção Firestore sem regra em `firestore.rules` → "missing or insufficient permissions"
3. Div aberto sem fechar dentro de `.asec` → quebra layout de todos os modais
4. `version` no rodapé igual à versão anterior → não incrementado
5. Funções que dependem de `_cacheSem` ou `_cacheIns` sem verificar null → crash silencioso
6. Toggle/checkbox sem sincronização com `preencherAdmin()` → estado incorreto ao reabrir painel

### Protocolo de nova funcionalidade
1. Identificar se usa Firestore → verificar/atualizar `firestore.rules`
2. Identificar se usa `onclick` no HTML → exportar via `window.*`
3. Identificar se renderiza listas → preservar scroll em `sec-modal-body`
4. Identificar se abre modal → travar `document.body.style.overflow='hidden'` e liberar ao fechar
5. Testar fluxo: abrir → interagir → fechar → reabrir (estado deve ser consistente)

### UX padrão do sistema
- Modais de seção admin: `.sec-modal` com `.open` — nunca renderizar dentro de `.ash`
- Feedbacks: sempre usar `toast()` para confirmações
- Botões: sempre ter `type="button"` para evitar submit acidental em forms
- Animação de clique: todos os botões já têm `button:active{transform:scale(.93)}`
- Sem comentários de código desnecessários — apenas WHY quando não óbvio
