# Catálogo do Vue — o que existe e quando usar

> **Escopo:** vale para qualquer projeto Vue 3. Verificado contra **Vue 3.5** (`vue@3.5.x`); onde
> uma API tem versão mínima, ela está escrita ao lado.
>
> **Isto é referência, não mais uma lista de proibições.** As regras de arquitetura estão em
> `vue.md` (estrutura do componente) e `composables.md` (onde a lógica mora). Aqui está o
> *inventário do framework*: o que o Vue já resolve, e qual das APIs parecidas é a certa. Ele é
> versionado junto das regras, e não junto do inventário do projeto, porque é igual em toda base da
> mesma major — não é inventário do seu código, é da ferramenta.
>
> **Quando ler:** antes de escrever reatividade à mão (um `watch` que copia valor, um observer, um
> id aleatório para um `label`), e sempre que duas APIs do Vue parecerem servir para a mesma coisa.

## Estado reativo — `ref` é o padrão

A documentação do Vue é explícita: *"we recommend using `ref()` as the primary API for declaring
reactive state"*. Não é preferência de estilo — é consequência das três limitações do `reactive()`:

1. **só objeto, array, `Map`/`Set`** — não guarda `string`, `number`, `boolean`;
2. **não pode ser reatribuído** — `state = reactive({…})` perde a conexão reativa, em silêncio;
3. **não sobrevive à desestruturação** — `const { count } = state` devolve um número solto.

As três falham **sem erro**: o valor muda e a tela não. É esse o motivo de o default ser `ref`.

| Precisa | Use | Observação |
|---|---|---|
| qualquer estado local ou de composable | `ref()` | default; `.value` no script, desempacotado no template |
| valor derivado de outro estado | `computed()` | tem cache; **sem efeito colateral e sem `async`** |
| estrutura grande que só é **substituída** (resposta de API, lista de milhares) | `shallowRef()` | reatividade só na raiz: `x.value = [...x.value, novo]`, nunca `x.value.push(novo)` |
| objeto de campos que andam juntos e nunca é reatribuído (model de formulário) | `reactive()` | legítimo, mas conhecendo as 3 limitações acima |
| expor estado sem deixar mutar | `readonly()` | o que o composable devolve para fora quando só ele deve escrever |
| instância de terceiro (mapa, chart, cliente de SDK) dentro de estado | `markRaw()` / `shallowRef` | proxy sobre instância de lib externa quebra em lugares difíceis de achar |
| ler o objeto original fora do proxy | `toRaw()` | para enviar ao backend/lib, não para escapar da reatividade |
| reatividade sobre fonte externa (storage, evento do navegador) | `customRef()` / `shallowRef` + listener | último recurso; quase sempre um composable com `ref` basta |
| criar efeitos fora de um componente e descartá-los juntos | `effectScope()` | singleton de módulo que precisa ser desmontado |

> ⚠️ **Desempacotamento no template só vale no topo.** `const obj = { id: ref(1) }` faz
> `{{ obj.id + 1 }}` renderizar `[object Object]1`. Não há erro nem aviso: o número aparece errado
> na tela. Devolver refs no **nível de topo** do objeto do composable — que é o que `vue.md` já
> manda — faz o problema não existir.

## Derivar antes de reagir

| Pergunta | Resposta |
|---|---|
| é um **valor** que vem de outros valores? | `computed` |
| é um **efeito** (rede, DOM, storage, navegação, timer) ao mudar algo específico? | `watch` |
| é um efeito que lê **várias** fontes e precisa rodar já na criação? | `watchEffect` |

`watch` que só atribui a um `ref` o resultado de uma conta **é um `computed` escrito errado**:
duplica o estado, roda depois do render e abre a janela em que os dois discordam.

`watchEffect` é mais curto, mas — nas palavras da doc — *"makes its reactive dependencies less
explicit"*: quem lê não sabe o que o dispara, e uma leitura acrescentada dentro do corpo passa a
dispará-lo sem ninguém perceber. Onde a lista de dependências importa, `watch` com fonte declarada.

```js
const obj = reactive({ count: 0 })

watch(obj.count, cb)          // ❌ passa um número; nunca dispara
watch(() => obj.count, cb)    // ✅ getter
```

| Opção | Para quê | Cuidado |
|---|---|---|
| `immediate: true` | rodar já na criação (carregar ao montar **e** ao trocar) | roda antes do `onMounted` |
| `once: true` (3.4) | dispara uma vez e se desfaz | — |
| `deep: true` | mutação aninhada | *"can be expensive"* — percorre a estrutura inteira |
| `deep: <número>` (3.5) | limita a profundidade percorrida | a saída barata quando `deep: true` pesa |
| `flush: 'post'` | ler o **DOM já atualizado** dentro do callback | substitui o `nextTick` de dentro do watcher |
| `flush: 'sync'` | raríssimo | sem batching: dispara a cada mutação — evite sobre array |
| `onWatcherCleanup(fn)` (3.5) | cancelar o que ficou obsoleto (`AbortController`) | precisa ser registrado **antes** do primeiro `await` |

> ⚠️ **Watcher criado dentro de callback assíncrono não é parado no unmount.** Só o que é criado
> **sincronicamente** no `setup`/`<script setup>` morre com o componente; o resto vaza e segue
> disparando sobre um componente que não existe mais. Guarde o handle e chame `stop()`, ou crie o
> watcher antes do `await`. O handle de 3.5 também tem `pause()`/`resume()`, para suspender sem
> perder a inscrição.

## Props, emits e model

- **Definição detalhada de props** é regra essencial do style guide do Vue (tipo, `required` ou
  `default`): documenta a API do componente e faz o Vue avisar em desenvolvimento.
- **O fluxo é de mão única.** Prop não se muta: emita e deixe o pai decidir. Para o caso de mão
  dupla existe `defineModel()` (3.4) — `v-model` sem a cerimônia de `prop` + `update:modelValue`,
  com suporte a múltiplos models nomeados e a modificadores.
- **Desestruturação reativa de props** (3.5): `const { count = 0 } = defineProps({…})` continua
  reativa — o compilador reescreve os acessos. ⚠️ **Mas a reatividade é do acesso, não da
  variável:** ao entregar a um `watch` ou a um composable, entregue um **getter**
  (`watch(() => count, …)`); o que chega direto é o valor de agora, congelado.
- `defineExpose` só onde o pai precisa **acionar** algo imperativo (focar um campo, pedir o payload
  de um editor). A API pública padrão é props + emits; expor estado interno fura o encapsulamento e
  transforma refator em quebra.
- `defineOptions` (3.3) para `name`/`inheritAttrs` sem abrir um segundo bloco `<script>`.
- Atributo que não é prop **cai no elemento raiz**. Quando o alvo é outro elemento,
  `defineOptions({ inheritAttrs: false })` + `v-bind="$attrs"` (ou `useAttrs()`) no lugar certo.

## Template

| Situação | Escolha |
|---|---|
| alterna com frequência (aba, painel, tooltip) | `v-show` — paga o render uma vez e só troca o `display` |
| pode nunca aparecer, ou é caro (diálogo, seção de admin) | `v-if` — não monta o que não é usado |
| alternar um **grupo** sem elemento extra | `v-if` em `<template>` — `v-show` não funciona em `<template>` |

- **`v-for` sempre com `key` estável** (regra essencial do style guide): a identidade do item, não o
  índice — com índice, remover um item do meio faz o Vue reaproveitar o nó errado, e estado interno
  (campo focado, checkbox, animação) gruda na linha errada.
- **Nunca `v-if` no mesmo elemento do `v-for`**: `v-if` tem precedência maior e não enxerga a
  variável da iteração. Filtre num `computed` — mais barato e mais legível — ou use `<template v-for>`
  com o `v-if` dentro.
- **`v-html` é XSS** com conteúdo vindo do usuário. Sem exceção "é só um negrito".
- `v-once` e `v-memo` são **otimização medida**, não estilo: `v-memo` com a lista de dependências
  errada congela a tela num estado antigo, e o sintoma não parece de cache.
- `<component :is>` no lugar de uma escada de `v-if` quando o que varia é *qual componente*.

## Refs de template, DOM e ids

- `useTemplateRef('nome')` (3.5) é a forma atual de alcançar um elemento ou componente filho — mais
  clara que a convenção antiga de declarar um `ref` com o mesmo nome do atributo.
- O valor só existe **depois de montado**. Leitura de medida ou foco vai em `onMounted` ou depois de
  `await nextTick()`.
- `useId()` (3.5) para id estável — o par `for`/`id` de um label, um `aria-describedby`.
  `Math.random()` ali quebra a hidratação no SSR e reescreve o atributo a cada render.

## Componentes embutidos

| Componente | Para quê | O que se erra com frequência |
|---|---|---|
| `<Transition>` | entrada/saída de **um** elemento ou componente | dois filhos no slot: não anima nada |
| `<TransitionGroup>` | lista que anima ao entrar, sair ou reordenar | exige `key` em cada item |
| `<KeepAlive>` | preservar o estado de aba/rota ao alternar | dado obsoleto — revalidar em `onActivated`; limitar com `max` |
| `<Teleport>` | mover um nó para fora da árvore (overlay, tooltip) | o alvo `to` precisa existir no mount; `defer` (3.5) resolve quando o alvo é renderizado pelo próprio Vue |
| `<Suspense>` | esperar filhos assíncronos | **experimental** — não desenhe arquitetura em cima |

## Fronteiras: props, provide/inject ou store

| Alcance | Ferramenta |
|---|---|
| pai → filho (um ou dois níveis) | props / emits — é o default, e não precisa de justificativa |
| contexto de uma **subárvore** (config de formulário, tema de uma seção) | `provide` / `inject`, com chave `Symbol` e valor default |
| estado de **aplicação** (sessão, workspace, preferências) | store — ver `composables.md` |

`provide` só funciona durante o `setup` de quem provê; chamado depois, não injeta nada e não avisa.
`inject` sem default vira `undefined` no primeiro componente montado fora da árvore — tipicamente
num teste.

Componente de rota ou bloco pesado entra por `defineAsyncComponent(() => import('…'))`, que é o que
transforma a divisão de código em chunk de verdade.

## Performance — nesta ordem

O guia oficial trata o assunto por camadas, e a ordem importa porque as primeiras são grátis e as
últimas custam legibilidade:

1. **arquitetura e bundle** — divisão por rota, dependência pesada avaliada antes de entrar;
2. **estabilidade de props** — passar `active` já computado em vez de `activeId` evita re-render de
   todos os irmãos que não mudaram;
3. **`shallowRef`/`shallowReactive`** para estrutura grande e imutável;
4. **virtualizar** lista longa — *"rendering a list with thousands of items **will** be slow"*;
5. **remover abstração de componente desnecessária dentro de listas** — *"component instances are
   much more expensive than plain DOM nodes"*: numa lista de 100 linhas, um componente a menos por
   linha são centenas de instâncias a menos;
6. **`v-once` / `v-memo`** — por último, e com medição.

> **Medir antes.** Fora de lista grande, quase todo "problema de performance do Vue" é um `watch`
> profundo sobre a resposta inteira de uma API, ou uma lista sem `key` — e nenhum dos dois se
> resolve com `v-memo`.

## Anti-padrões

| Escrito assim | Por que dói | No lugar |
|---|---|---|
| `watch` que só atribui um valor derivado | dois estados para a mesma verdade | `computed` |
| `reactive` para primitivo | não funciona, e não avisa | `ref` |
| mutar `props.x` no filho | o pai reescreve na próxima render e a mudança some | `emit` / `defineModel` |
| `:key="index"` em lista que reordena ou remove | estado interno gruda na linha errada | id do item |
| `v-html` com texto do usuário | XSS | interpolação, ou sanitizar na borda |
| `watch` criado depois de um `await` | não é parado no unmount: vaza | criar antes, ou guardar o `stop()` |
| `ref()` sobre payload grande de API | proxy profundo sobre dezenas de milhares de propriedades | `shallowRef` |
| `async` dentro de `computed` | devolve uma Promise, e o template a imprime | `watch` + estado, ou o wrapper de async do projeto |
| `nextTick` espalhado para "consertar" ordem | remendo sobre o sintoma | `flush: 'post'` no watcher |
