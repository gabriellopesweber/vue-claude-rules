# Changelog

Semver: **patch** = texto/exemplo · **minor** = regra ou seção nova · **major** = muda convenção já adotada pelos consumidores.

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
