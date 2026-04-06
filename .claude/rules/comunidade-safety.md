# Comunidade Safety — Regra de Proteccao CRITICA

## Origem

Incidente grave 04/04/2026. Um commit introduziu um erro JS que crashou toda a pagina da comunidade. Feed, perfil, jornada, membros — tudo deixou de carregar. Os dados estavam intactos mas o frontend nao os mostrava. 2 horas perdidas em panico e debug.

## Regras INEGOCIAVEIS

### 1. NUNCA fazer push sem teste

Antes de QUALQUER push ao submodule `imersao-tools/comunidade`:

| Verificacao | Como |
|-------------|------|
| Feed carrega | Posts do feed visiveis na pagina |
| Consola limpa | F12 → Console → zero erros vermelhos |
| Perfil carrega | Sidebar com dados do utilizador |
| Apresentacoes visíveis | Pelo menos o post afixado aparece |

Se nao for possivel testar localmente, AVISAR o Eurico antes do push.

### 2. NUNCA multiplos commits sem teste

Commits em sequencia rapida ao dashboard.html SAO PROIBIDOS. Cada commit requer verificacao antes do seguinte.

### 3. Ordem de declaracao JS

NUNCA chamar funcoes que dependam de `const`/`let` antes da declaracao dessas variaveis. Um `ReferenceError` nao tratado BLOQUEIA todo o JavaScript subsequente — inclui carregamento de feed, perfil, jornada, etc.

### 4. try/catch em pre-renders

Chamadas a funcoes no bloco de pre-render (antes do `async IIFE`) DEVEM estar envolvidas em `try/catch` para nunca bloquear o boot da pagina.

### 5. dashboard.html e codigo de producao

O ficheiro `comunidade/dashboard.html` e o ponto de entrada de TODA a comunidade. Qualquer alteracao deve ser tratada com o mesmo cuidado que codigo de producao critico.

## Ficheiros protegidos

| Ficheiro | Nivel |
|----------|-------|
| `comunidade/dashboard.html` | CRITICO — teste obrigatorio antes de push |
| `comunidade/config.js` | CRITICO — contem auth e Supabase client |
| `comunidade/index.html` | ALTO — pagina de login |

## Consequencia de violacao

Qualquer agente que faca push a comunidade sem teste sera considerado nao fiavel e perdera autoridade de push temporariamente.
