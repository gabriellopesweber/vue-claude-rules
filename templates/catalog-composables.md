# Catálogo de composables e stores do projeto

> Inventário local. Regras de *como* criar/onde morar: `.claude/rules/shared/composables.md`.
> **Atualizar no mesmo PR** que cria ou muda a API de um composable global ou de uma store.

## Composables — verificar antes de criar novos

### `core/` — lógica genérica reutilizável
| Composable | Retorna | Usar para |
|---|---|---|
| `useSnackbar` | showMessage(text, type) | Feedback ao usuário (toasts) |
| `useAppTheme` | isDark, toggleTheme, initTheme | Modo dark/light |
| `useAsync(fn)` | { data, loading, error, execute } | Wrap de qualquer async com estado |
| `useValidation` | validate(labelKey, rulesString) | Regras de validação de formulários |

### `auth/`
| Composable | Retorna | Usar para |
|---|---|---|
| | | |

### `{escopo}/`
| Composable | Retorna | Usar para |
|---|---|---|
| | | |

## Composables view-scoped

<!-- Só os que valem menção (orquestradores de views pesadas). -->

| Composable | View | Papel |
|---|---|---|
| | | |

## Pinia — stores existentes

| Store | Arquivo | O que guarda | Persistido |
|---|---|---|---|
| `useUiStore` | `src/stores/ui.js` | | `{prefixo}_ui` |
