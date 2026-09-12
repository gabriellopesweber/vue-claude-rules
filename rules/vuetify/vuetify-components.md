# Catálogo do Vuetify — qual peça já existe

> **Escopo:** projetos que usam **Vuetify**. Extraído do próprio pacote na **4.2.1** (a lista de
> componentes é idêntica na 4.1.x; o que mudou de lá para cá não foi o inventário). Noutra lib de UI
> nada aqui se aplica — o princípio de escolha continua, os nomes não.
>
> **Isto é referência, não regra.** As regras do Vuetify (cor por token, defaults, mobile) estão em
> `vuetify.md`. Aqui está o *inventário do framework*, versionado junto das regras pelo mesmo motivo
> que o catálogo do Vue: é igual em toda base da mesma major.
>
> **Quando ler:** antes de escrever um componente novo, e antes de instalar uma dependência para
> algo que parece faltar. O modo de falha que ele existe para evitar é escrever cem linhas de
> `IntersectionObserver`, de máscara de moeda ou de "nenhum resultado encontrado" que já vinham no
> pacote instalado.

## A ordem de consulta

1. **`.claude/rules/project/catalog-ui.md`** — o que **este projeto** já construiu por cima do Vuetify. Vence sempre: o componente do projeto já carrega a decisão de tema, i18n e responsividade.
2. **Este arquivo** — o que o Vuetify traz de fábrica.
3. Só então escrever algo novo — e, se for reusável, ele nasce em `src/components/ui/` e entra no catálogo do projeto (`dry.md`).

## Layout e estrutura da aplicação

| Peça | Papel |
|---|---|
| `VApp` | raiz obrigatória: resolve tema e cor de fundo |
| `VLayout` / `VLayoutItem` | escopo de layout fora do `VApp` (dentro de um card, de um diálogo) |
| `VMain` | a área de conteúdo que se ajusta sozinha às barras registradas |
| `VAppBar` (+ `VAppBarNavIcon`, `VAppBarTitle`) | barra superior da aplicação |
| `VToolbar` (+ `VToolbarTitle`, `VToolbarItems`) | barra **dentro** de um bloco (card, diálogo) — não é layout-aware |
| `VNavigationDrawer` | menu lateral, permanente ou temporário |
| `VBottomNavigation` | navegação principal em mobile |
| `VFooter` · `VSystemBar` | rodapé · barra de status (mock de app) |
| `VContainer` / `VRow` / `VCol` / `VSpacer` | grade responsiva e preenchimento de espaço em flex |
| `VSheet` · `VDivider` · `VResponsive` | superfície nua · separador · caixa com proporção fixa |

## Superfícies e conteúdo

| Peça | Papel |
|---|---|
| `VCard` (+ `VCardItem`, `VCardTitle`, `VCardSubtitle`, `VCardText`, `VCardActions`) | o bloco de conteúdo padrão, com semântica de título/corpo/ações |
| `VList` (+ `VListItem`, `VListGroup`, `VListSubheader`, `VListItemAction`, `VListItemMedia`) | listas, inclusive aninhadas; é a base de menus e drawers |
| `VTable` | `<table>` estilizado, sem lógica — alternativa leve à `VDataTable` |
| `VExpansionPanels` (+ `VExpansionPanel*`) | reduzir espaço vertical com muita informação |
| `VTimeline` (+ `VTimelineItem`) | informação cronológica |
| `VWindow` / `VTabs` (+ `VTab`, `VTabsWindow`) / `VCarousel` / `VStepper` / `VStepperVertical` | os quatro sabores de "um painel por vez": livre, abas, slides, passo a passo |
| `VBanner` · `VEmptyState` | aviso fixo acima do conteúdo · estado vazio ou busca sem resultado |
| `VImg` · `VParallax` · `VAvatar` · `VBadge` | imagem com lazy e placeholder · efeito de rolagem · avatar · contador/indicador |
| `VChip` / `VChipGroup` · `VIcon` · `VCode` / `VKbd` / `VHotkey` | rótulo curto e seleção em grupo · ícone · código, tecla e combinação de teclas |

## Campos e formulários

| Preciso de | Componente |
|---|---|
| texto de uma linha / várias linhas | `VTextField` / `VTextarea` |
| escolher de uma lista fechada | `VSelect` |
| escolher de uma lista longa, com busca | `VAutocomplete` |
| escolher **ou digitar um valor novo** | `VCombobox` |
| número com incremento, precisão e separador | `VNumberInput` |
| data (campo) / data (calendário) / hora | `VDateInput` / `VDatePicker` / `VTimePicker` |
| cor (campo) / cor (paleta) | `VColorInput` / `VColorPicker` |
| arquivo (campo simples) / arquivo (arrastar e soltar, com lista) | `VFileInput` / `VFileUpload` |
| código de uso único | `VOtpInput` |
| sim/não | `VCheckbox` (ou `VCheckboxBtn`, leve, para dentro de tabela/lista) · `VSwitch` |
| uma opção entre poucas | `VRadioGroup` + `VRadio`, ou `VBtnToggle` |
| valor ou faixa numa escala | `VSlider` / `VRangeSlider` |
| nota por ícones | `VRating` |
| agrupar e validar tudo | `VForm` (`v-model` diz se está válido; `fastFail` para na primeira regra) |
| construir um campo próprio | `VInput` / `VField` / `VValidation` (baixo nível, já plugados no `VForm`) |
| rótulo, contador e mensagens avulsos | `VLabel` · `VCounter` · `VMessages` |

## Ações

| Peça | Papel |
|---|---|
| `VBtn` | o botão, com `variant`/`size`/`density`; `to`/`href` fazem dele link sem perder o estilo |
| `VIconBtn` | botão que só tem ícone — mais leve que `VBtn icon`, e com `iconSize`, `rotate`, `activeIcon` |
| `VBtnGroup` / `VBtnToggle` | botões emendados · seleção exclusiva ou múltipla entre botões |
| `VFab` + `VSpeedDial` | botão flutuante ciente do layout + o leque de ações que ele revela |
| `VItemGroup` / `VSlideGroup` | dar comportamento de seleção a qualquer coisa · trilha rolável horizontal |
| `VConfirmEdit` | confirmar/cancelar uma edição antes de commitar (emite `save`/`cancel`) |

## Sobreposições

| Peça | Quando |
|---|---|
| `VDialog` | conteúdo que **bloqueia** a página: formulário, confirmação |
| `VBottomSheet` | o mesmo, subindo do rodapé — padrão de mobile |
| `VMenu` | lista de opções ancorada a um gatilho, sem bloquear |
| `VTooltip` | texto curto ao passar o mouse ou focar |
| `VOverlay` | a base dos quatro acima; usar direto só para caso fora do padrão |
| `VSnackbar` / `VSnackbarQueue` | mensagem transitória · **fila** de mensagens, com `timer` e `totalVisible` |

> Os cinco primeiros compartilham as mesmas props de posicionamento e ativação (`activator`,
> `location`, `offset`, `open-on-hover`, `close-on-content-click`, `scrim`, `persistent`, `eager`).
> Aprender num vale para os outros.

## Dados em lista

| Peça | Quando |
|---|---|
| `VTable` | a tabela é só apresentação: sem ordenar, sem paginar |
| `VDataTable` | os dados **inteiros** estão em memória: ela ordena, filtra e pagina sozinha |
| `VDataTableServer` | o servidor pagina/ordena: exige `items-length` e a reação aos `update:options` |
| `VDataTableVirtual` | milhares de linhas de uma vez, sem paginação |
| `VDataIterator` | mesma lógica da data table sem a tabela — para grade de cards |
| `VVirtualScroll` | virtualizar uma lista qualquer (`items` + `item-height`; `renderless` para markup próprio) |
| `VInfiniteScroll` | carregar mais ao chegar na borda (`mode="intersect"` ou `"manual"`, evento `load`) |
| `VPagination` | a barra de páginas, avulsa |
| `VTreeview` | dados aninhados, com seleção, ativação e `load-children` sob demanda |

## Estado, progresso e feedback

| Peça | Papel |
|---|---|
| `VProgressLinear` / `VProgressCircular` | progresso determinado ou indeterminado |
| `VSkeletonLoader` | placeholder com a **forma** do conteúdo (`type`) enquanto carrega |
| `VAlert` | mensagem ancorada ao conteúdo, com `type` |
| `VEmptyState` | "não há nada aqui" / "a busca não achou nada", com ação |
| `VSparkline` | gráfico mínimo embutido num card |

## Utilitários sem UI própria

| Peça | Papel |
|---|---|
| `VDefaultsProvider` | trocar defaults de componente **num trecho** da árvore, sem repetir prop |
| `VThemeProvider` / `VLocaleProvider` | forçar tema / idioma numa parte da aplicação |
| `VLazy` | adiar a montagem do conteúdo até ele entrar na viewport (`options` vai ao IntersectionObserver) |
| `VHover` | estado de hover exposto por slot, sem CSS nem listener |
| `VNoSsr` | não renderizar no servidor |
| `VPullToRefresh` | puxar para atualizar, em mobile (evento `load`) |

## Labs — o que ainda não é estável

`VAvatarGroup` · `VCommandPalette` · `VDateRangePicker` · `VHeatmap` · `VHighlight` · `VMaskInput` ·
`VMonthPicker` · `VPie` · `VProgress` · `VVideo`

```js
import { VPie } from 'vuetify/labs/VPie'
```

**O contrato do labs é que a API pode mudar em release menor.** Vale usar — muita coisa estável hoje
passou por ali (`VDateInput`, `VFileUpload`, `VIconBtn`, `VColorInput`, `VPullToRefresh`,
`VStepperVertical` e `VPicker` graduaram na 4) —, mas **atrás de um componente seu**: importado num
único arquivo de `src/components/`, o dia da mudança de API é um arquivo, não trinta telas.

## Diretivas

`v-ripple` · `v-intersect` · `v-resize` · `v-mutate` · `v-scroll` · `v-click-outside` · `v-tooltip` · `v-touch`

São o caminho curto para o que normalmente vira um `onMounted` com listener e um `onUnmounted` que
alguém esquece. `v-intersect` em especial: a paginação por rolagem infinita e o "carregar quando
aparecer" saem de uma linha no template.

## Composables públicos (`import { … } from 'vuetify'`)

| Composable | Para quê |
|---|---|
| `useDisplay()` | breakpoints reativos (`mobile`, `smAndDown`, `width`) — no lugar de `matchMedia` à mão |
| `useTheme()` | tema atual e `change()` — mas encapsulado num composable do projeto (ver `vuetify.md`) |
| `useDefaults()` | ler/compor os defaults dentro de um componente próprio |
| `useLayout()` | medidas do layout (altura da barra, largura do drawer) para posicionar algo colado a ele |
| `useDate()` | o adapter de data configurado — evita cravar a lib de data dentro do componente |
| `useLocale()` / `useRtl()` | tradução dos textos internos do Vuetify e direção do texto |
| `useGoTo()` | rolagem programática com easing, no lugar de `scrollIntoView` |
| `useHotkey()` | atalho de teclado com combinação e sequência, já com limpeza no unmount |
| `useMask()` | máscara de entrada reaproveitável fora do `VMaskInput` |
| `useRules()` / `createRulesPlugin()` | os aliases de validação — ver a seção de validação em `vuetify.md` |

## Pares que se confundem

| Dúvida | Corte |
|---|---|
| `VSelect` × `VAutocomplete` × `VCombobox` | fechada · fechada **com busca** · **aceita valor novo digitado** |
| `VDataTable` × `VDataTableServer` | a paginação é de quem tem a lista inteira. Com servidor paginando, a `VDataTable` filtra de novo **em cima da página** e esconde linha que o servidor mandou de propósito |
| `VDataTable` × `VTable` | lógica × só apresentação. Tabela de cinco linhas fixas não precisa da primeira |
| `VVirtualScroll` × `VInfiniteScroll` × `VPagination` | tudo já em memória × buscar mais ao rolar × navegar por página |
| `VDialog` × `VMenu` × `VBottomSheet` | bloqueia × ancorado ao gatilho × sobe do rodapé (mobile) |
| `VSnackbar` × `VAlert` × `VBanner` | some sozinho × ancorado ao conteúdo × fixo acima do conteúdo. O critério está em `feedback.md` |
| `VBtn icon` × `VIconBtn` | o segundo nasceu para isto e é mais leve |
| `VCheckbox` × `VCheckboxBtn` | com rótulo e mensagens × só o controle, para dentro de tabela ou lista |
| `VCard` × `VSheet` | semântica de título/corpo/ações × superfície nua |
| `VDatePicker` × `VDateInput` | o calendário × o campo que abre o calendário |
| `VTooltip` componente × diretiva `v-tooltip` | conteúdo com markup × texto curto sem estrutura |
| `VProgressCircular` × `VSkeletonLoader` | "algo está acontecendo" × "o conteúdo tem esta forma" — o segundo não faz a página saltar quando os dados chegam |

## O que já vem pronto e costuma ser reescrito à mão

| Escrito à mão | Já existe |
|---|---|
| `IntersectionObserver` para carregar ao aparecer | `v-intersect` · `VLazy` · `VInfiniteScroll` |
| `ResizeObserver` / listener de `resize` | `v-resize` · `useDisplay()` |
| `matchMedia` e constantes de breakpoint | `useDisplay()` |
| máscara de moeda/telefone/documento | `VNumberInput` · `VMaskInput` (labs) · `useMask()` |
| bloco de "nenhum resultado" repetido em cada tela | `VEmptyState` |
| spinner centralizado enquanto a tela carrega | `VSkeletonLoader` com o `type` da tela |
| listener de `keydown` global para atalho | `useHotkey()` · `VHotkey` para exibir a combinação |
| `scrollIntoView` com cálculo de offset | `useGoTo()` |
| "confirmar/cancelar" reescrito dentro de cada picker | `VConfirmEdit` |
| fila caseira de toasts | `VSnackbarQueue` |
| árvore com expandir/selecionar | `VTreeview` |
| repetir a mesma prop em dezenas de tags | `defaults` do `createVuetify` · `VDefaultsProvider` num trecho |
