# Changelog

Semver: **patch** = texto/exemplo · **minor** = regra ou seção nova · **major** = muda convenção já adotada pelos consumidores.

## v1.9.0 — 2026-08-26

### Adicionado
- **`feedback.md` ganha *"O texto da mensagem de erro"*.** Três invariantes que faltavam: a mensagem
  técnica do servidor não vai para a tela; recusa distinguível chega com redação própria; e a
  resolução se faz **por convenção com guarda de existência**, não por mapa literal repetido em cada
  tela.

  A guarda é o ponto e por isso está escrita como tal: numa lib de i18n típica, pedir chave
  inexistente devolve o próprio caminho da chave, e o usuário lê `errors.foo_SOMETHING_NEW` na tela
  — pior que o texto genérico. Sem ela o código precisa de allow-list mantida à mão, cujo
  esquecimento não dá erro nenhum.

  Vem com o aviso de que **chave montada em tempo de execução some do `grep`**: ela parece órfã numa
  limpeza de locale, e apagá-la não quebra nada visível.

  **O mecanismo ficou de fora de propósito.** Qual campo do erro carrega o discriminador, o formato
  da chave e o nome do composable que resolve mudam com o backend e com a lib de i18n — a seção
  aponta para `project/` em vez de prescrever. É a mesma linha que a v1.7.0 traçou nos tokens do
  Vuetify, aplicada antes de doer.

### Alterado
- **Passada de voz: default sugerido deixou de ser escrito como fato sobre a ferramenta.** As regras
  misturavam três tipos de afirmação, e só duas pertencem a um pacote-base: *fato verificável sobre a
  ferramenta* (`theme.global.name.value` está deprecado), *princípio com a razão junto* (cor só por
  token, senão o dark quebra em silêncio) e *convenção de um projeto* (a ordem dos imports).

  O problema não era falsidade — os fatos foram reverificados contra o fonte e conferem. Era
  **autoridade emprestada**: a linha que diz a verdade sobre o framework empresta credibilidade à
  seguinte, que só diz o gosto de alguém. Agora as três se distinguem na leitura.

  - `vue.md`: os sete grupos de import viram *"a ordem padrão deste pacote"*, com a precedência
    explícita — projeto que já tem a sua mantém a dele. E quem decide passa a ser o lint, não o
    arquivo: ordem de import não deve consumir revisão de PR.
  - `composables.md`: *"regra obrigatória"* → *"obrigatório onde a camada existe"*. O título dizia
    obrigatório e o preâmbulo dizia "se não existe, não instale" — o título contradizia o escopo.
  - `i18n.md`: a estrutura JSON ganhou a **razão** de ser obrigatória (sem o invólucro, dois arquivos
    com a mesma chave de topo se sobrescrevem, e o que se perde depende da ordem do glob). Qual
    namespace usar continua sendo escolha do projeto.

### Corrigido
- **`tests.md` afirmava a config de um projeto como se fosse comportamento do Vitest.** *"O `include`
  do `vitest.config.js` é `src/**/test/**/*.{test,spec}.js`"* — não é; é o de quem escreveu. O
  default do Vitest varre a árvore inteira. Agora o obrigatório é o `include` **bater** com a
  convenção escolhida, com o modo de falha escrito: divergir não dá erro, só deixa o teste sem rodar
  — ou rodando de onde a convenção proibiria.

- **`vuetify.md` carregava ~40 de 154 linhas que não são sobre Vuetify.** O grid
  (`cols=12`/`md=6`/`lg=4`) saiu: é aritmética, não regra, e sob aquele título lia-se como prescrição
  de breakpoint. As actions de dialog perderam o `pa-4 ga-2` de um projeto e ficaram com o que era
  insight portável — `flex-column-reverse` põe o confirmar em cima **sem** mexer na ordem do DOM, que
  é a ordem de foco do teclado.

  `autocomplete` e a integração com biblioteca de gráfico foram para **"Fora do tema — integrações"**,
  seção que abre dizendo não ser regra do Vuetify. A primeira é do navegador e vale em qualquer lib;
  a segunda, de bibliotecas que recebem cor por valor. Separadas porque um arquivo que diz a verdade
  sobre o framework não pode emprestar essa autoridade ao resto.

- **Exemplos com nome de domínio de um projeto específico.** `composables.md` ilustrava o padrão
  Orquestrador + Filiações e o Concern Compartilhado com composables de um domínio específico, e
  `tests.md` fazia o mesmo no caminho de co-localização. Nenhum deles existe fora do projeto onde
  foram escritos.

  Não produziam código quebrado como os tokens da v1.7.0 — são exemplos, não prescrições —, mas um
  agente noutro projeto lendo *"o orquestrador instancia `useX()`"* vai procurar o arquivo. Agora
  são `useFeature*`/`useItems`/`useSharedConcern`, que se leem como o que sempre foram: marcadores
  de posição.

- **`i18n.md` ensinava o namespace de um projeto como se fosse o padrão.** A "estrutura JSON
  obrigatória" tinha `{ "workspace": { "invites": … } }` e a interpolação, `workspace.employees.remove_msg`.
  Pior que os exemplos de composable: é um bloco JSON feito para copiar, e quem copiasse levaria
  `workspace` como namespace raiz achando que a regra o exigia. Agora é `settings.members`, que
  qualquer app tem.

- **`composables.md` dava `{prefixo}_workspace_id` como exemplo de chave de `localStorage`.** Metade
  placeholder, metade domínio alheio. Virou `{prefixo}_{domínio}_id`.

  Os exemplos em **prosa** também saíram, e a linha é essa: o pacote é a **base** de outros
  projetos, então nada nele nomeia um deles — nem como ilustração, nem como procedência. Saíram
  também a atribuição no `scaffold/README.md` e o nome do projeto nas entradas antigas deste
  changelog.

  A varredura cobriu identificadores, caminhos, valores de config, env, endpoints, stores,
  vocabulário de domínio, `templates/` e `scaffold/`.

## v1.8.0 — 2026-07-27

### Corrigido
- **`rules:check` acusava os 10 arquivos como divergentes no Windows.** Com `core.autocrlf=true`, o checkout reescreve para CRLF; o sync grava LF; a comparação byte a byte quebrava após qualquer troca de branch. Mesmo modo de falha da v1.4.1 — um gate que acusa trabalho correto. A comparação agora normaliza a quebra de linha; edição real continua sendo detectada. O `sync` também deixou de reescrever arquivo que só difere no EOL, evitando churn de mtime.
- `sync` e `--check` avisam sobre `.gitattributes` **com evidência**: só quando os arquivos gerados estão de fato em CRLF na árvore e nada no `.gitattributes` cobre isso. Em Linux/macOS, ou onde já foi resolvido, o aviso não aparece. O pacote **informa, não escreve** — `.gitattributes` é política do projeto, e a mesma regra que impede o pacote de instalar dependência ou sobrescrever `project/` vale aqui. `ADOPTING.md` documenta as duas formas (escopo mínimo e repositório inteiro).

### Alterado
- **`list` deixou de dar aos presets o mesmo destaque das regras.** A ordem agora é: catálogo → como escolher (exemplo granular, com o custo de incluir regra que o projeto não pratica) → presets no rodapé, apresentados como atalho de protótipo. Escolher preset quase sempre é pegar demais; a saída anterior empurrava para isso e só desmentia na última linha.

## v1.7.0 — 2026-07-27

Revisão da regra do Vuetify contra o **fonte da 4.1.5** (`node_modules/vuetify/lib/composables/theme.js`), não contra a memória. A regra vinha de um projeto consumidor e carregava decisões dele como se fossem do framework.

### Corrigido
- **A lista de "tokens disponíveis" era em grande parte do projeto de origem, não do Vuetify.** `surface-container-low/lowest/high`, `outline-variant`, `secondary-container` e `on-secondary-container` são declarados no tema daquele projeto; `tertiary` não existe nem lá nem no Vuetify (zero ocorrências no pacote). Num projeto cru, seguir a lista produzia `rgb(var(--v-theme-surface-container-low))` — var inexistente, cor vazia, sem erro. Agora a regra separa **tokens do tema padrão** (lista verificada) de **tokens do projeto** (que precisam estar em `project/stack.md`), e diz que o que não está em nenhuma das duas listas não existe.
- **`text-on-*` não existe.** Para tokens `on-*` a classe gerada é o nome nu (`.on-surface`), não `.text-on-surface`. A regra listava classes utilitárias sem essa distinção.
- **`text-medium-emphasis` deriva de `on-background`**, não de `on-surface` — resultado errado dentro de container de fundo contrastante. Documentada a alternativa explícita.
- **`bg-*` já define a cor do texto** (`color: on-{token}`), então acrescentar classe de texto depois é redundante. Não estava dito.
- A tabela de "props descontinuadas" tratava `dense` como algo a evitar no dia a dia; `dense` só sobrevive no `VRow` e já emite deprecation apontando para `density`. Virou uma linha na seção de defaults, com os três valores válidos.

### Adicionado
- Bloco `variables` do tema (opacidades, `border-color`, `shadow-color`) — lidos como `var(--v-{nome})`, sem `theme-`. A regra dizia "adicione ao tema" sem dizer que token que não é cor mora noutro lugar.
- `border-{token}` na tabela de classes utilitárias, e `<v-defaults-provider>` como alternativa a repetir prop num escopo.
- `defaultTheme` do Vuetify é `'system'`: a app já segue o SO sem configuração. Antes de construir toggle, verificar se o que falta é só persistir a escolha.
- **`init` extrai os tokens de cor customizados** do plugin e os lista em `project/stack.md`, com a ressalva de confirmar que estão declarados em todos os temas. A regra manda conferir essa lista, então ela precisa existir. Verificado nos três projetos adotados (6 tokens num deles; `nav`/`nav-deep` noutro; `tertiary`/`surface-container-*`).

### Corrigido (detecção)
- A extração de nomes de tema pegava chaves aninhadas: `themes: { light: { colors: {…}, fonts: {…} } }` devolvia `light, colors, fonts, dark`. Agora só lê chaves de primeiro nível.

## v1.6.0 — 2026-07-27

Correções a partir de uma segunda adoção do zero, feita por outro agente.

### Corrigido
- **A auditoria de dependências só rodava no `init`.** O `init` roda uma vez; o `sync`/`--check` roda em todo PR e no CI — é lá que a configuração apodrece (alguém remove o axios e a regra segue carregada mandando usar `api.js`). Selecionar `services` num projeto sem axios saía com exit 0 e silêncio. Agora os dois auditam.
- **`--force` do `init` ressuscitava `rules:dist`.** `??=` protege o valor, não a ausência intencional: num projeto que usa `npx` sem ser distribuído, o script voltava a cada execução. Agora só entra com `--dist` explícito, nunca por inferência.
- `init` avisa que um `CLAUDE.md` existente não foi tocado **e** como regerar; o `sync` aponta o `list` também quando não há seleção configurada, não só em id inválido.
- `vuetify.md` era a única regra com pressuposto e sem bloco de escopo no topo. Ganhou um, marcando também as duas seções condicionais (Tema e ApexCharts).

### Alterado
- **`requires` respondia a duas perguntas diferentes** e produzia falso negativo. Separado em dois campos:
  - **`requires`** — sem isso a regra é inaplicável (`i18n` sem vue-i18n). Lista de alternativas: `tests` aceita vitest, jest, playwright ou cypress. Aviso forte.
  - **`assumes`** — a regra vale, mas **partes** dela pressupõem a ferramenta. `services` com axios: a divisão service/composable vale igual com `fetch`; só interceptor e 401 não. Aviso fraco, apontando o preâmbulo de escopo da própria regra.

  Reclassificados: `services`, `repositories` e `composables` saíram de `requires` para `assumes` — eram aplicáveis, e a declaração dizia o contrário.

## v1.5.0 — 2026-07-27

Os profiles eram 4 baldes, e projeto real não cabe em balde. Um one-page com i18n **e** testes não era `site` (sem testes) nem `spa-full` (traz axios e Pinia): só dava para pegar demais. A seleção agora é **granular por padrão**; os presets viraram atalho.

### Adicionado
- **Seleção granular por id** — `"claudeRules": { "rules": ["vue", "dry", "vuetify", "i18n", "tests"] }`. Ids curtos em vez de caminhos internos; caminho completo e basename continuam aceitos.
- **`vue-claude-rules list`** — imprime o catálogo: cada regra, o que cobre, o que pressupõe, mais os presets e um exemplo. Antes a lista custom existia mas era invisível, e exigia adivinhar `core/tests.md`.
- **Catálogos derivados das regras escolhidas** — `catalogs` deixou de ser lista manual. Cada regra declara de que catálogo precisa (`dry`→UI, `composables`→composables, `services`/`repositories`→data); `stack.md` entra sempre.
- **`rules/manifest.json`** — fonte única sobre as regras disponíveis, consumida por `list`, pelos presets, pela resolução de nomes e pela validação. Adicionar regra é adicionar entrada.
- **Validação com erro útil** — id inválido lista os válidos e aponta o `list`, em vez de falhar num caminho inexistente.
- **Aviso de dependência ausente** — selecionar `tests` sem vitest, ou `i18n` sem vue-i18n, avisa sem bloquear (pode ser um passo antes de instalar).
- `init` deriva a lista granular da stack e a grava; `--profile` continua gravando `profile`. Configuração existente não é convertida sem pedirem.

### Alterado
- Presets reescritos em termos de ids, e o `init` só usa preset quando pedido explicitamente.
- O aviso de "projeto parece distribuído" deixou de disparar só por "poucas views e nenhuma camada de API" — isso descreve qualquer landing legítima, e avisar demais treina o leitor a ignorar o aviso.

## v1.4.1 — 2026-07-27

### Corrigido
- **Detecção de placeholder do `rules:check` gerava falso positivo em catálogo preenchido.** A heurística por forma do token acusava conteúdo legítimo: `{ mobile }` (slot prop), `{ publicRequest: true }` (objeto JS), `{ data, loading, error }` (forma de retorno) e `src/views/{feature}/` (caminho). Um gate que acusa trabalho concluído é pior que gate nenhum. Agora compara com os placeholders reais extraídos dos templates do pacote, ignorando trechos de código dos dois lados — validado contra dois projetos adotados (zero falso positivo) e contra um boilerplate com `{Nome do Projeto}` por preencher (ainda pego).

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
- **`init` reintroduzia a devDependency num projeto distribuído.** Rodar `init` num projeto que a tinha removido de propósito — trazia de volta o `github:` que quebraria o `install` de todo comprador. Agora o `init` detecta scripts baseados em `npx` e preserva o modo; `--dist` força explicitamente.

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
- **Profiles refeitos** a partir da matriz real de dependências dos projetos adotados: `spa-full` (9), `spa` (8, sem tests), `site` (4), `minimal` (3). O antigo `site-static` incluía `i18n.md` e `feedback.md` em projetos que não têm vue-i18n nem stack de alertas; e `spa-full` era o único profile, apesar de o Velox não ter Vitest.
- `core/tests.md` — projeto **sem CI** pode legitimamente gatilhar a suíte no `build:*:secure`; onde o gate roda de fato é fato do projeto (`project/stack.md`), não violação da regra.
- `core/tests.md` — o corpo de `withSetup` saiu da regra e virou `scaffold/test-utils/withSetup.js`; a regra mostra só o uso.

## v1.0.1 — 2026-07-27

### Corrigido
- `core/tests.md` — o gate de teste mora no **CI**, não no script de build. A v1.0.0 afirmava `audit → test → build`; o desenho correto é o build seguro fazer `audit → build` e a suíte rodar isolada no PR (install limpo → lint → unit → E2E em job separado). `pnpm test` local é conveniência; quem barra o merge é o CI.

### Adicionado
- `core/tests.md` — preâmbulo de **escopo**: a regra vale só para projetos que já têm suíte. Onde não há, o agente não deve criar a primeira suíte, o config nem o job de CI por conta própria — adotar testes é decisão do dono do projeto. Esses projetos usam um profile sem este arquivo.
- `README.md` — regra do profile: só incluir regra que o projeto pratica de fato.

## v1.0.0 — 2026-07-27

Extração inicial a partir do `.claude/rules/` de um projeto em produção (9 arquivos, 1.043 linhas), separando princípio portável de inventário de projeto.

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
- Nomes de domínio do projeto de origem trocados por placeholders
- Defaults do `vuetify.js`, esquema de auth, locales e scripts de build passaram para `project/stack.md` — eram a maior fonte de divergência entre os projetos consumidores
- `alerts.md` virou `core/feedback.md` (agnóstico de lib de UI)
- Ordem de imports absorveu o grupo de stores de outro projeto adotado
