# Changelog

Semver: **patch** = texto/exemplo · **minor** = regra ou seção nova · **major** = muda convenção já adotada pelos consumidores.

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
