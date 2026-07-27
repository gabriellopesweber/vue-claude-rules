# Changelog

Semver: **patch** = texto/exemplo · **minor** = regra ou seção nova · **major** = muda convenção já adotada pelos consumidores.

## v1.4.0 — 2026-07-27

Correções a partir de uma adoção real feita por outro agente, num boilerplate Vuetify puro (profile `minimal`). Quase tudo tinha a mesma raiz: **o gerador escrevia sem consultar o profile ativo**, produzindo link morto e — pior — orientação ativamente errada.

### Corrigido
- **`CLAUDE.md` era copiado byte a byte do template**, com `{Nome do Projeto}` literal e 6 das 10 linhas da tabela apontando para regras que o profile `minimal` nunca sincroniza. As "regras universais" mandavam usar `t()` e "nunca chamar axios diretamente" num projeto sem i18n e sem axios. Agora é **gerado**: tabela filtrada pelas regras que existem em `shared/`, regras universais filtradas pela stack detectada, nome vindo do `package.json`.
- **Os catálogos gerados referenciavam regras ausentes do profile** — `catalog-ui.md` linkava `feedback.md`, `catalog-data.md` linkava `repositories.md`/`services.md`. Toda referência agora passa por um filtro que só deixa passar o que o profile sincroniza; sem referência viva, o cabeçalho sai sem link.
- **`rules:check` saía 0 com a adoção pela metade** — catálogos cheios de `TODO` e `CLAUDE.md` com placeholder satisfaziam o critério de sucesso do próprio `ADOPTING.md`. Agora falha listando o que falta (`--allow-incomplete` para checar só a sincronia, em CI de projeto já adotado).
- **`init` dizia "project/ preservado (já preenchido)"** sobre arquivos que só existiam. Agora diz "não sobrescrito" e acusa separadamente os que ainda têm `TODO`.
- **Defaults do Vuetify não eram extraídos** — o regex dependia de indentação exata, quebrando a promessa de `shared/vuetify.md` de que a tabela está em `project/stack.md`. Agora usa balanceamento de chaves, procura o plugin em mais caminhos, e pede a tabela à mão quando não acha o bloco. Extrai também os temas (tema único vira "não construir toggle por conta própria").
- **Seção vazia virava linha morta.** `_Nenhum X_` num boilerplate desperdiça o caso mais provável do público-alvo. Agora emite orientação prospectiva: o critério para o primeiro componente, o primeiro composable, e por que não instalar Pinia/axios/i18n só para "seguir o padrão".
- **`init` gerava 4 catálogos** mesmo em profiles que declaram 2, deixando arquivo órfão que o `CLAUDE.md` não referencia.

### Adicionado
- **Detecção de projeto distribuído** — nome com kit/template/starter, README de ponto de partida, poucas views sem camada de API. O `init` avisa para considerar `--dist` antes de a `devDependency` entrar.
- `--dist` promovido ao bloco de comandos do passo 1 do `ADOPTING.md`, com `npx` no lugar de `pnpm exec` (que valida `node_modules` antes de rodar e pode abortar por problema alheio ao pacote, com stack trace do próprio pnpm).
- `ADOPTING.md`: `pnpm lint` ganhou "se houver script"; o `git rm` das regras antigas virou comando guardado, que não erra numa adoção nova; e ficou explícito que o marcador `TODO: revisar` do cabeçalho é o visto de revisão a ser apagado.

## v1.3.1 — 2026-07-27

### Corrigido
- **`init` reintroduzia a devDependency num projeto distribuído.** Rodar `init` no Velox — que a tinha removido de propósito — trazia de volta o `github:` que quebraria o `install` de todo comprador. Agora o `init` detecta scripts baseados em `npx` e preserva o modo; `--dist` força explicitamente.

### Adicionado
- **`init --dist`** — modo distribuição: scripts via `npx`, sem devDependency, e `rules:dist` já configurado.
- **Aviso de conclusão para agentes.** "Instalar" este pacote não é `pnpm add`: o valor está nos catálogos preenchidos, e um agente que pare no passo 1 não entregou nada. O README abre com um bloco endereçado ao agente, o `init` termina avisando que a adoção **não** está completa, e o `ADOPTING.md` pede que o que ficou em aberto seja relatado em vez de dado por encerrado.

## v1.3.0 — 2026-07-27

Um projeto **distribuído** (template à venda, boilerplate, entrega a cliente) não pode carregar a divisão `shared/`/`project/`: ela pressupõe um upstream que quem recebe não tem. Pior, virar `devDependency` amarra o `pnpm install` de todo comprador à existência de um repo pessoal, e exige git e rede na máquina dele.

### Adicionado
- **`build --standalone`** — gera um `.claude/` autocontido para distribuição: hierarquia achatada (`shared/x.md` → `x.md`, `project/catalog-ui.md` → `components.md`), banners de "gerado — não editar" removidos, referências cruzadas reescritas (inclusive as curtas, `` `shared/tests.md` ``), menções ao scaffold retiradas (ele não acompanha a distribuição) e `CLAUDE.md` escrito para quem recebe.
- **Trava de vazamento** — o build sai com código 1 se sobrar menção ao pacote, à conta do autor, aos scripts `rules:*`, a `node_modules`, a nome de projeto interno, ou um `TODO` não preenchido. Validada no Velox: pegou três vazamentos reais na primeira execução (comparação com um projeto interno, o script de sync listado como script do produto, e a referência à divisão de camadas).
- README ganhou a seção de distribuição, incluindo por que **não** usar este pacote como dependência de projeto distribuído — e o `npx` avulso como alternativa.

## v1.2.0 — 2026-07-27

Até aqui a adoção só funcionava com quem já conhecia a biblioteca: o `README` cobria instalar e sincronizar, mas os 4 catálogos de `project/` — a parte cara — eram trabalho manual não documentado. Numa sessão nova, ou com outra pessoa, não se sustentava.

### Adicionado
- **`vue-claude-rules init`** — detecta a stack (pinia/axios/vue-i18n/vitest/apexcharts), escolhe o profile, adiciona os scripts no `package.json` e **rascunha `.claude/rules/project/` lendo o `src/`**: componentes com props/emits/v-model (parse com balanceamento de chaves — `default: () => ({})` inclusive), composables por escopo, repositories com métodos, stores com chaves e campos persistidos, defaults do Vuetify, árvore de locales, scripts. Marca `TODO` em tudo que exige julgamento e nunca sobrescreve catálogo já preenchido (`--force` para regerar).
- **Achados automáticos** no rascunho: repository **sem consumidor** (contrato preparado vs código morto) e **credencial de sessão em `localStorage`** — a divergência de `shared/composables.md`.
- **`ADOPTING.md`** — passo a passo **escrito para um agente de código**, sem pressupor contexto da biblioteca: o que produzir, como fechar cada TODO, o que nunca fazer (editar `shared/`, instalar dependência para "cumprir" regra).
- CLI unificada (`bin` → `scripts/cli.mjs`) com `init` e `sync`. `node scripts/sync.mjs` direto continua funcionando.

## v1.1.1 — 2026-07-27

### Corrigido
- **Referências ao scaffold não resolviam no consumidor.** A v1.1.0 apontava para `scaffold/composables/core/useAsync.js` — caminho relativo ao pacote, que da raiz do projeto não é nada. Só o sync sabe onde o pacote foi instalado, então é ele que agora reescreve para `node_modules/vue-claude-rules/scaffold/…`.

### Adicionado
- `rules:sync` gera `.claude/rules/shared/scaffold.md`, o índice das primitivas dentro de `.claude/rules/` — onde o agente já procura. O código continua só no pacote: fonte única, sem cópia para manter em sincronia.
- `templates/CLAUDE.md` ganhou linha para "adotar uma primitiva que a regra exige".

## v1.1.0 — 2026-07-27

### Adicionado
- **`scaffold/`** — código base das primitivas que as regras pressupõem, extraído de um projeto base: `useAsync`, `useSnackbar`, `useAlertManager`, `useValidation` (+ `validations/` e `locales/validation.json`), `useAppTheme` (+ store `ui`), `withSetup`, `GlobalSnackbar.vue`, `GlobalAlertStack.vue`, `InlineAlert.vue`. Uma regra que diz "use `useAsync`" agora entrega o `useAsync`. `scaffold/README.md` documenta dependências e o **gatilho de adoção** de cada peça — adotar sob demanda, não em bloco.
- **Preâmbulo de escopo** em toda regra condicional: `i18n.md` (sem vue-i18n a proibição de string hardcoded não se aplica), `repositories.md` e `services.md` (sem backend), `composables.md` (tabela por seção: Pinia, validação, Orquestrador), `feedback.md` (não construir os três mecanismos por completude), e nas seções Tema e ApexCharts de `vuetify.md`. Rede de segurança para quando o profile estiver errado.
- **`claudeRules.rules`** — lista custom no `package.json` do consumidor, vence o profile. Projeto raramente cabe exatamente num bundle.
- Erro de profile inexistente agora lista os disponíveis; regra inexistente na lista custom falha cedo.

### Alterado
- **Profiles refeitos** a partir da matriz real de dependências dos projetos: `spa-full` (9), `spa` (8, sem tests), `site` (4), `minimal` (3). O antigo `site-static` incluía `i18n.md` e `feedback.md` em projetos que não têm vue-i18n nem stack de alertas; e `spa-full` era o único profile, apesar de o Velox não ter Vitest.
- `core/tests.md` — projeto **sem CI** pode legitimamente gatilhar a suíte no `build:*:secure`; onde o gate roda de fato é fato do projeto (`project/stack.md`), não violação da regra.
- `core/tests.md` — o corpo de `withSetup` saiu da regra e virou `scaffold/test-utils/withSetup.js`; a regra mostra só o uso.

## v1.0.1 — 2026-07-27

### Corrigido
- `core/tests.md` — o gate de teste mora no **CI**, não no script de build. A v1.0.0 afirmava `audit → test → build`; o desenho correto é o build seguro fazer `audit → build` e a suíte rodar isolada no PR (install limpo → lint → unit → E2E em job separado). `pnpm test` local é conveniência; quem barra o merge é o CI.

### Adicionado
- `core/tests.md` — preâmbulo de **escopo**: a regra vale só para projetos que já têm suíte. Onde não há, o agente não deve criar a primeira suíte, o config nem o job de CI por conta própria — adotar testes é decisão do dono do projeto. Esses projetos usam um profile sem este arquivo.
- `README.md` — regra do profile: só incluir regra que o projeto pratica de fato.

## v1.0.0 — 2026-07-27

Extração inicial a partir do `.claude/rules/` do Medispace-ui (9 arquivos, 1.043 linhas), separando princípio portável de inventário de projeto.

### Adicionado
- `core/dry.md` — princípio de reuso, quando extrair, checklist, anti-padrões, regra de manter o catálogo vivo
- `core/feedback.md` — os 3 mecanismos de feedback (toast / stack global / inline) como decisão de arquitetura
- `core/tests.md` — FIRST, pirâmide, 4 pilares, test doubles, co-localização em `test/`, determinismo, jsdom, E2E
- `vue/vue.md` — `<script setup>`, ordem de imports, props/emits/v-model, camadas, nomenclatura
- `vue/composables.md` — validação via `useValidation`, persistência via Pinia, global vs view-scoped, Orquestrador+Filiações, Concern Compartilhado
- `vue/services.md` — service vs composable, padrão `useAsync`, nomenclatura
- `vue/repositories.md` — toda HTTP via repository, estrutura, tratamento de erros
- `vuetify/vuetify.md` — tokens de tema, deprecações, defaults, autocomplete, mobile, ApexCharts dark mode
- `i18n/i18n.md` — estrutura JSON, nomenclatura de chaves, interpolação, proibições
- `templates/` — `CLAUDE.md`, `catalog-ui.md`, `catalog-composables.md`, `catalog-data.md`, `stack.md`
- `profiles/` — `spa-full`, `site-static`
- `scripts/sync.mjs` — sync com banner de origem, prune de arquivos fora do profile, seed de `project/` sem sobrescrever, modo `--check` para CI

### Notas de generalização
- Catálogos de componentes/composables/repositories saíram das regras e viraram templates de `project/`
- Nomes de domínio do Medispace (workspace, paciente, clínica) trocados por placeholders
- Defaults do `vuetify.js`, esquema de auth, locales e scripts de build passaram para `project/stack.md` — eram a maior fonte de divergência entre Medispace-ui e Velox
- `alerts.md` virou `core/feedback.md` (agnóstico de lib de UI)
- Ordem de imports absorveu o grupo de stores do Velox
