# Regras de Composables e Estado

> **Escopo por seção:** a parte de **composables** vale para qualquer projeto Vue. As seções de **Pinia/persistência** e de **validação** pressupõem infraestrutura que pode não existir:
>
> | Seção | Pressupõe | Se não existe |
> |---|---|---|
> | Persistência via Pinia | `pinia` + `pinia-plugin-persistedstate` | Não instale Pinia para guardar uma preferência — `ref` no módulo ou `localStorage` encapsulado num composable resolve. A regra existe para impedir `localStorage` **espalhado**, não para exigir Pinia. |
> | Validação via `useValidation` | `src/validations/` + `validation.json` | Adote o código base de `scaffold/` (`useValidation.js` + `validations/` + `locales/validation.json`) quando as regras começarem a repetir entre formulários; até lá, as regras da lib de UI bastam. |
> | Orquestrador + Filiações | uma view genuinamente pesada | Padrão para views que já doem. Aplicar numa view simples é overhead — o que vale para toda view é a seção *"O que pode ficar no `<script setup>`"*, um degrau abaixo. |
>
> **Antes de criar qualquer composable, consulte o catálogo do projeto** (`.claude/rules/project/catalog-composables.md`) — a lista do que já existe é verdade local, não vive aqui.

## Validação de formulários — obrigatório onde a camada existe

*Se `src/validations/` não existe neste projeto, esta seção inteira não se aplica: as regras da lib
de UI bastam até as validações começarem a repetir entre formulários. Ver o escopo no topo.*

Todo `:rules` **deve** vir de `useValidation().validate(labelKey, 'regra1|regra2')` — nunca regra inline anônima. Se a regra não existir, **criar o handler** em `src/validations/rules/<nome>.js`, exportar em `src/validations/index.js` e adicionar a mensagem em `validation.json` (`validation.<nome>`).

Handlers recebem `(value, args)` → boolean e tratam vazio como válido (deixa `required` cuidar disso). Atenção: `min`/`max` são **comprimento de string** (caracteres); para valor numérico use `minValue`/`maxValue` (ex.: `validate('...label', 'minValue:0|maxValue:100')`).

## Persistência via Pinia — obrigatório onde Pinia existe

*Sem Pinia no projeto, não o instale por causa desta seção: um `ref` no módulo ou um `localStorage`
encapsulado num composable resolve. O que a seção impede é `localStorage` **espalhado**, não a
ausência de Pinia.*

**Nunca usar `localStorage` diretamente** em composables, views, componentes, `api.js` ou guards.
Toda persistência passa por `pinia-plugin-persistedstate`. Configure na store:

```js
// src/stores/featureStore.js
import { defineStore } from 'pinia'

export const useFeatureStore = defineStore('feature', () => {
  const preference = ref('default')
  // ...
  return { preference }
}, {
  persist: {
    key: '{prefixo}_feature',   // chave no localStorage
    pick: ['preference'],       // campos a persistir (omitir para persistir tudo)
  },
})
```

Para consumir em composables mantendo compatibilidade de interface, use `storeToRefs`:
```js
import { storeToRefs } from 'pinia'
import { useFeatureStore } from '@/stores/featureStore'

export function useFeature() {
  const store = useFeatureStore()
  const { preference } = storeToRefs(store)   // ref reativa, sincronizada com a store
  return { preference, setPreference: store.setPreference }
}
```

**Convenção de chaves localStorage:** prefixo do projeto + nome do domínio (ex.: `{prefixo}_ui`, `{prefixo}_{domínio}_id`). O prefixo em uso está em `.claude/rules/project/stack.md`.

**Segurança:** credencial de sessão (access token, dados do usuário) **nunca** entra em localStorage/sessionStorage — vive em memória (access token) ou em cookie HttpOnly (refresh token), inacessível a JS.

## Quando usar cada opção
| Situação | Usar |
|---|---|
| Estado global que precisa persistir entre sessões | Pinia store + `persist` |
| Estado global em memória (sem persistência) | Pinia store sem `persist` |
| Lógica reativa compartilhada entre componentes | Composable |
| Estado local de um único componente | `ref` / `reactive` local |
| Async com loading/error repetido | `useAsync(fn)` |

## Criando um novo composable
```js
// src/composables/{escopo}/useFeatureName.js
import { ref } from 'vue'
import { useSnackbar } from '@/composables/core/useSnackbar'

export function useFeatureName() {
  const { showMessage } = useSnackbar()
  const data = ref(null)
  const isLoading = ref(false)

  const fetchData = async () => {
    isLoading.value = true
    try {
      // ...
    } catch (e) {
      showMessage(t('...errors.key'), 'error')
    } finally {
      isLoading.value = false
    }
  }

  return { data, isLoading, fetchData }
}
```
- Nome: `use{FeatureName}`, arquivo: `useFeatureName.js` em `src/composables/{escopo}/`
- Retornar objeto plano (não reactive wrapper)
- Usar o composable de toast para feedback — nunca `alert()` ou `console.error` como UI
- Nunca importar componentes dentro de composables

## Onde mora o composable: global vs. view-scoped

| Situação | Local |
|---|---|
| Lógica de domínio reutilizável (state global, usada por várias views) | `src/composables/{escopo}/` (singleton no nível de módulo) |
| Orquestração específica de **uma** view (não reutilizável) | **co-localizado**: `src/views/{feature}/composables/` |

Composables **view-scoped** seguem a mesma co-localização que os services locais (`src/views/{feature}/services/`): ficam junto da única view que os usa. São **factory composables** — criam o estado **dentro** da função (`ref` local, não no nível do módulo), pois há uma instância por montagem da view, não um singleton global.

## O que pode ficar no `<script setup>`

*Vale para **todo** componente, e não só para as views pesadas da seção seguinte.*

O `<script setup>` guarda o **fio** entre o composable e o template. Se uma linha responde
"como isto funciona" em vez de "o que esta tela usa", ela pertence a um composable.

| Fica no `.vue` | Vai para um composable |
|---|---|
| `import` de componentes filhos | qualquer `ref`/`reactive` que o template não leia diretamente |
| `defineProps` / `defineEmits` / `defineModel` | `computed` derivado de rota, store ou resposta de API |
| `const { t } = useI18n()` | handler de submit, de clique, de retentativa |
| **uma** desestruturação de `use{Feature}()` | `onMounted` / `watch` / `onUnmounted` |
| ref de template (`useTemplateRef`) que o composable recebe | `try/catch`, sequência de chamadas, mapeamento de erro |

```vue
<script setup>
import { useI18n } from 'vue-i18n'

import { useLoginForm } from '@/views/auth/composables/useLoginForm'

const { t } = useI18n()
const {
  email,
  password,
  isBusy,
  errorMessage,
  submit,
} = useLoginForm()
</script>
```

**O ganho não é estética, e o formulário simples é o caso que prova.** Um `submit` de seis
linhas dentro do `.vue` só é testável montando o componente: para afirmar que a falha **não**
navega, o teste precisa de jsdom, de Vuetify, de um router dublê e de um clique. O mesmo
`submit` num composable é uma função — entrada, saída, uma asserção. A regra existe para que
a decisão de negócio seja testável sem DOM, e é por isso que ela não espera a view ficar
pesada.

**Um `computed` de uma linha que só formata para o template pode ficar.** O corte é
"depende de rota, store, rede ou tempo?" — não a contagem de linhas.

> ⚠️ **Composable view-scoped por tela, e não um por pasta.** `useAuthForm` servindo entrar,
> cadastrar e recuperar acaba com três ramos de `if` e um retorno com campos que metade dos
> consumidores ignora. A co-localização já dá a proximidade; o que se ganha juntando é uma
> abstração que ninguém pediu.

> **Isto não contradiz "não crie camada por antecipação".** Não se está criando uma camada —
> ela já existe no projeto assim que houver um composable. Extrair um a mais é mover código
> para onde a camada já está, não abrir uma nova.

## Padrão Orquestrador + Filiações (views pesadas)

Quando uma view acumula muitas responsabilidades (estado de diálogos, filtros, navegação, ações async, timers…), **não** deixe tudo no `<script setup>`. Extraia para composables view-scoped e componha-os num **orquestrador**:

- **Filiações** — um composable por cargo (ex.: `use{Feature}Calendar`, `use{Feature}Filters`, `use{Feature}Dialogs`, `use{Feature}Operations`). Cada um cria seu estado local e expõe só o que é seu. Os que precisam de estado de outro recebem por **injeção de dependência** (refs/fns passados como argumento), não importam uns aos outros diretamente.
- **Orquestrador** — `use{Feature}View()`: instancia os seams de domínio (composables globais), instancia as filiações, fia o estado compartilhado entre elas, registra watchers/lifecycle e **retorna uma API plana** (spread das filiações).
- **A view fica fina**: `<script setup>` só faz `const { ...tudo } = use{Feature}View()` + os imports de componentes. Sem lógica de negócio no componente.

```js
// orquestrador (resumo)
export function useFeatureView() {
  const { items, fetchItems, updateItem, ... } = useItems()
  const calendar = useFeatureCalendar({ mobile, hours })
  const fetchRange = () => fetchItems(calendar.buildRange())
  const filters = useFeatureFilters({ items, viewMode: calendar.viewMode })
  const dialogs = useFeatureDialogs()
  const operations = useFeatureOperations({ dialogs, fetchRange, updateItem, ... })
  // watchers + onMounted aqui
  return { ...calendar, ...filters, ...dialogs, ...operations, /* + state de domínio */ }
}
```

**Regras do padrão:**
- Estado de UI (visibilidade/seleção de diálogos) e abertura **síncrona** (`open*`) ficam num composable de "dialogs"; **ações assíncronas** (CRUD) num de "operations" que consome o de dialogs por injeção.
- Filiação que tem timer/alerta com ciclo de vida (`onMounted`/`onUnmounted`) registra **sua própria** limpeza — não vaza para o orquestrador.
- O orquestrador não deve conter regra de negócio própria além do fio (wiring); cada cargo é de uma filiação.

## Padrão Concern Compartilhado (persistência injetada)

Quando **dois componentes repetem a mesma lógica** mas diferem só na **fonte de dados/persistência**, extraia um composable de concern e **injete as primitivas** que variam, em vez de duplicar.

```js
const records = useSharedConcern({
  evolutions,                                  // ref/computed com a lista
  onCreate: (payload) => createEvolution(id.value, payload),
  onUpdate: (id, data) => updateEvolution(...),
  onDelete: (id) => deleteEvolution(...),
})
```

**Regra:** a lógica e o estado moram no composable; o que muda entre consumidores (como persistir, de onde vêm os dados) entra **por parâmetro** (refs/callbacks). Preserve contratos existentes (ex.: a forma dos `emit` do consumidor) ao injetar.

Desenhe o contrato por injeção pensando em **múltiplos consumidores desde o início** — ao adicionar o segundo, injete o que ele precisa em vez de duplicar o composable.
