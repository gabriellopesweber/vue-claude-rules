# Regras de Componentes Vue

## Estrutura — a ordem padrão deste pacote

> **É default, não regra.** A ordem abaixo é a que este pacote adota quando o projeto não tem outra;
> ela agrupa por *distância do domínio*, o que faz a origem de cada import ser óbvia na leitura. Um
> projeto que já tenha uma convenção diferente formalizada no lint **mantém a dele** — em conflito,
> `project/` vence `shared/`. O que não é negociável é haver **uma** ordem, aplicada pela ferramenta
> e não pela memória.
```vue
<script setup>
// 1. Vue core + key ecosystem (vue, vue-router, vue-i18n, dayjs, pinia)
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// 2. Outros pacotes externos (node_modules)
import someLib from 'some-lib'

// 3. Composables da app (@/composables/*)
import { useSnackbar } from '@/composables/core/useSnackbar'

// 4. Services e repositories (@/services/*, @/repositories/*) — somente se não há composable wrapper
import { featureRepository } from '@/repositories/{domínio}/featureRepository'

// 5. Stores (@/stores/*)
import { useFeatureStore } from '@/stores/feature'

// 6. Imports relativos (./ ou ../)
import localHelper from './localHelper'

// 7. Componentes e todo o restante @/ (sempre por último)
import BaseDialog from '@/components/ui/BaseDialog.vue'

const { t } = useI18n() // sempre primeiro destructure
</script>

<template>…</template>
<style scoped>…</style> <!-- apenas se necessário -->
```

Uma linha em branco entre cada grupo; componentes `@/components/` vêm por último.

> **Quem decide é o lint, não este arquivo.** Onde houver `simple-import-sort` ou equivalente
> configurado, ele é a fonte de verdade — rode o autofix e deixe a ferramenta ordenar. Ordem de
> import é exatamente o tipo de convenção que não deve consumir atenção humana nem revisão de PR.

## Props, emits e v-model
```js
const props = defineProps({
  title:   { type: String, required: true },
  loading: { type: Boolean, default: false },
  items:   { type: Array, default: () => [] },
})
const emit = defineEmits(['confirm', 'cancel'])
const dialog = defineModel({ type: Boolean, default: false }) // para v-model
```

## Regras críticas
- **Sem Options API** — `<script setup>` apenas; nunca `export default {}`
- **Sem lógica no `<template>`** — usar `computed` para valores derivados
- Funções: `const handleAction = () => {}` no topo (sem bloco `methods`)
- Eventos: kebab-case (`update:modelValue`, `confirm`, `cancel`)
- **Sem comentários** salvo lógica genuinamente não óbvia
- Estilos scoped; preferir classes utilitárias da lib de UI antes de escrever CSS
- **Lint antes de commitar** — rodar `pnpm lint` (ou `pnpm lint:fix` para autofix) e deixar **sem erros**. Durante o trabalho dá pra mirar arquivos com `npx eslint <arquivos>`.

## Responsabilidades por camada
| Camada | Responsabilidade |
|---|---|
| `src/views/` | Orquestração: composables + repositories + template de página |
| `src/components/` | UI reutilizável ou blocos complexos extraídos de views |
| `src/composables/` | Lógica reativa compartilhável |
| `src/repositories/` | Chamadas HTTP |

Views devem ser finas: lógica de negócio → composables; HTTP → repositories.

## Nomenclatura de arquivos
- Componentes: `PascalCase.vue` em `src/components/{domínio}/`
- Views: `{Feature}View.vue` em `src/views/{domínio}/`
- Sub-componentes de view: `src/views/{domínio}/components/`
- Composables: `useFeatureName.js` em `src/composables/{escopo}/`
