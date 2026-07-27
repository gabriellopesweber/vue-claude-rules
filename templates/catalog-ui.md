# Catálogo de UI do projeto

> Inventário local. Regras de *quando* extrair/reusar: `.claude/rules/shared/dry.md`.
> **Atualizar no mesmo PR** que cria/renomeia/muda a API pública de um componente de `src/components/ui/`.

## Componentes de feedback (ver `shared/feedback.md`)

| Papel | Implementação neste projeto |
|---|---|
| Toast transitório | `useSnackbar().showMessage(text, type)` |
| Stack global persistente | `useAlertManager` + `GlobalAlertStack` (montado em `App.vue`) |
| Alerta ancorado a campo/seção | `InlineAlert` (`src/components/ui/InlineAlert.vue`) |

## `src/components/ui/`

### `{NomeDoComponente}`
{Uma linha do que faz e quando usar.}
Props: `{prop}` (required), `{prop}` (default: `{valor}`)
Slots: `{slot}`
Emits: `{evento}`
v-model: `{tipo}`

<!-- Repetir o bloco acima por componente. Manter em ordem alfabética. -->

## `src/components/{domínio}/`

<!-- Componentes de domínio reutilizados por mais de uma view. -->
