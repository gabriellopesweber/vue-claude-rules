# {Nome do Projeto}

{Uma linha: stack + o que a app é.}

## Stack
- **Components**: Vue 3 `<script setup>` + {lib de UI}
- **State**: Pinia + composables para lógica de domínio
- **HTTP**: `src/services/api.js` → repositories → services (`useAsync`) → composables/views
- **i18n**: Todo texto via `t()` — `src/locales/**/*.json` (deep merged)
- **Router**: Vue Router, protegido por `authGuard`

## Carregar regras conforme o contexto da tarefa

`shared/` vem do [vue-claude-rules](https://github.com/gabriellopesweber/vue-claude-rules) (**não editar** — ver "Regras compartilhadas" abaixo).
`project/` é o inventário deste repositório.

| Tarefa envolve | Princípio (shared) | Inventário (project) |
|---|---|---|
| Componentes `.vue`, props, emits, template | `.claude/rules/shared/vue.md` | — |
| Texto visível, chaves de tradução, locales | `.claude/rules/shared/i18n.md` | `.claude/rules/project/stack.md` |
| Cores, tokens de tema, layout mobile, componentes da lib de UI | `.claude/rules/shared/vuetify.md` | `.claude/rules/project/stack.md` |
| Composables, Pinia stores, lógica compartilhada | `.claude/rules/shared/composables.md` | `.claude/rules/project/catalog-composables.md` |
| Services (`useAsync` wrappers) | `.claude/rules/shared/services.md` | `.claude/rules/project/catalog-data.md` |
| Chamadas HTTP, repositories, camada de API | `.claude/rules/shared/repositories.md` | `.claude/rules/project/catalog-data.md` |
| Reutilização de UI, evitar duplicação, extrair componentes | `.claude/rules/shared/dry.md` | `.claude/rules/project/catalog-ui.md` |
| Feedback ao usuário: toast, alerta global, inline | `.claude/rules/shared/feedback.md` | `.claude/rules/project/catalog-ui.md` |
| Escrever/editar testes (Vitest), mocks, E2E | `.claude/rules/shared/tests.md` | `.claude/rules/project/stack.md` |
| Adotar uma primitiva que a regra exige (`useAsync`, `useValidation`, toast…) | `.claude/rules/shared/scaffold.md` | `.claude/rules/project/catalog-composables.md` |

## Regras universais (sempre aplicar)
- Nenhuma string hardcoded em templates — usar `t('chave')`
- Nenhuma cor hardcoded — usar `rgb(var(--v-theme-*))` ou classes utilitárias do tema
- Nunca chamar axios diretamente em componentes ou views — sempre via repository
- Verificar composables, componentes e chaves i18n existentes antes de criar novos
- Sempre `<script setup>` — sem Options API, sem `export default {}`

## Regras compartilhadas — como funcionam

- `.claude/rules/shared/` é **gerado** por `pnpm rules:sync` a partir do pacote `vue-claude-rules`. Editar ali é perda garantida no próximo sync.
- Mudou um **princípio** (vale para todos os projetos) → PR no repositório `vue-claude-rules`, sobe a versão, `pnpm rules:sync` aqui.
- Mudou o **inventário** (componente novo, composable novo, endpoint novo) → editar `.claude/rules/project/` **no mesmo PR** da mudança de código.
- **Precedência:** em conflito, `project/` vence `shared/` — o projeto pode divergir do padrão, mas a divergência tem que estar escrita.
- Versão em vigor: `.claude/rules/.rules-version`.
