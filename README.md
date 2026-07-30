# vue-claude-rules

Regras de Claude Code compartilhadas entre projetos Vue 3 + Vuetify + Pinia.

> ## 🤖 Agente de código lendo isto
>
> **Instalar este pacote não é `pnpm add`.** Ele adiciona um processo de adoção ao repositório: sincronizar as regras, inventariar o `src/` em catálogos e reescrever o `CLAUDE.md`. Um `pnpm add` sozinho não entrega nada — os catálogos ficam vazios e o agente seguinte não ganha nada.
>
> **Siga [`ADOPTING.md`](ADOPTING.md) do início ao fim** antes de reportar a tarefa como concluída. São 4 passos; o `init` automatiza o primeiro e marca com `TODO` o que depende de você ler o código.

## O problema que resolve

Regras copiadas entre repositórios divergem em silêncio: uma melhoria de padrão fica presa num projeto, enquanto o inventário de componentes de um vaza para o outro e faz o agente sugerir código que não existe ali.

A separação aqui é essa:

| Camada | Onde vive | Muda quando |
|---|---|---|
| **Princípio** — como decidir, qual padrão seguir | este repositório, versionado | o padrão de trabalho evolui (raro) |
| **Inventário** — o que já existe neste projeto | `.claude/rules/project/` do consumidor | a cada PR que cria componente/composable/endpoint |

Nenhuma das duas serve sozinha: "reuse antes de criar" só funciona com a lista do que existe.

## Instalação num projeto

```bash
pnpm add -D github:gabriellopesweber/vue-claude-rules
pnpm exec vue-claude-rules init
pnpm install && pnpm rules:sync
```

O `init` detecta a stack (pinia/axios/vue-i18n/vitest/apexcharts), escolhe o profile, adiciona os scripts no `package.json` e **rascunha `.claude/rules/project/` lendo o seu `src/`**: componentes com props/emits/v-model, composables por escopo, repositories com seus métodos, stores com chaves de persistência, defaults do Vuetify, árvore de locales, scripts.

Resultado:

```
.claude/rules/
├── shared/            # gerado — NÃO EDITAR (banner em cada arquivo)
├── project/           # rascunho do seu código, com TODO onde precisa de julgamento
└── .rules-version
```

O rascunho não é o catálogo pronto — falta o que só quem conhece o projeto sabe: o que cada componente faz, o que cada store guarda, onde o gate de teste roda. O `init` marca esses pontos com `TODO` e ainda **acusa achados**: repository sem consumidor, credencial de sessão em `localStorage`.

**Vai pedir para um agente adotar?** Aponte-o para [`ADOPTING.md`](ADOPTING.md) — é o passo a passo escrito para ele, sem pressupor contexto.

**Commite `.claude/rules/shared/`.** Os arquivos ficam disponíveis para o agente mesmo sem `node_modules`, e cada atualização vira um diff revisável no PR em vez de mudança invisível.

## Atualizar

```bash
pnpm up vue-claude-rules   # ou trocar a tag no package.json
pnpm rules:sync
git add .claude/rules && git commit -m "chore: rules v1.1.0"
```

`pnpm rules:check` falha (exit 1) se `shared/` foi editado à mão ou está numa versão diferente — bom como step de CI.

## Profiles

Definem qual subconjunto de regras cada tipo de projeto carrega.

A seleção é **granular**: você escolhe as regras, uma por uma. Nenhum projeto cabe exatamente num bundle pronto — um one-page com i18n e testes não é "site" nem "SPA completa".

```jsonc
"claudeRules": { "rules": ["vue", "dry", "vuetify", "i18n", "tests"] }
```

```bash
npx vue-claude-rules list   # o catálogo, a qualquer momento
```

| id | Cobre | Exige | Partes pressupõem |
|---|---|---|---|
| `vue` | `<script setup>`, ordem de imports, props/emits/v-model, camadas, nomenclatura | — | — |
| `dry` | reuso primeiro, quando extrair componente, checklist, anti-padrões | — | — |
| `vuetify` | tokens de tema, props descontinuadas, defaults, mobile, ApexCharts | `vuetify` | `vue3-apexcharts` |
| `feedback` | toast, alerta persistente e inline — qual usar em cada caso | — | — |
| `i18n` | estrutura JSON, nomenclatura de chaves, interpolação, proibições | `vue-i18n` | — |
| `composables` | global vs view-scoped, Orquestrador + Filiações; seções de estado e validação | — | `pinia` |
| `services` | service vs composable, padrão `useAsync`, onde cada um mora | — | `axios` |
| `repositories` | toda chamada HTTP via repository, estrutura, tratamento de erros | — | `axios` |
| `tests` | FIRST, pirâmide, 4 pilares, test doubles, co-localização, E2E | um runner | `vitest` |

**"Exige" e "partes pressupõem" são coisas diferentes.** Sem `vue-i18n`, a regra `i18n` é inútil — o texto todo trata de `t()` e de `locales/`. Já `services` continua valendo inteira com `fetch`: a divisão service/composable não é sobre axios; só os detalhes de interceptor e 401 são. `sync` e `init` avisam nos dois casos, com peso diferente, e nenhum deles bloqueia — quem escolheu pode estar um passo antes de instalar.

Os **catálogos** de `.claude/rules/project/` são derivados das regras escolhidas — não precisa listá-los.

**Só inclua regra que o projeto realmente pratica.** `tests` descreve como testar bem *onde já se testa*; num projeto sem suíte, vira pressão para o agente criar testes que ninguém pediu. Mesmo raciocínio para `i18n` sem vue-i18n e `repositories`/`services` sem backend. Seleção enxuta é feature, não falta. Cada regra condicional carrega um **preâmbulo de escopo** dizendo o que pressupõe — rede de segurança para quando a seleção estiver errada.

O `init` monta essa lista sozinho, a partir das dependências que encontrar. Depois é só editar.

### Presets

Atalho para os casos comuns, via `claudeRules.profile` ou `--profile <nome>`:

| Preset | Regras |
|---|---|
| `minimal` | vue, dry, vuetify |
| `site` | + i18n |
| `spa` | + feedback, composables, services, repositories |
| `spa-full` | + tests |

Lista granular vence o preset.

## scaffold — o código das primitivas

As regras pressupõem primitivas (`useAsync`, `useValidation`, `useSnackbar`, `useAlertManager`, `withSetup`…). [`scaffold/`](scaffold/) traz a implementação de cada uma.

```bash
cp node_modules/vue-claude-rules/scaffold/composables/core/useAsync.js src/composables/core/
```

É código seu a partir da cópia; o `rules:sync` nunca toca em `src/`. **Adote sob demanda**, não em bloco — cada peça tem um gatilho documentado em [`scaffold/README.md`](scaffold/README.md).

O `rules:sync` gera `.claude/rules/shared/scaffold.md` — o índice das primitivas, dentro de `.claude/rules/` onde o agente já olha — e reescreve os caminhos das regras para `node_modules/vue-claude-rules/scaffold/…`, que é onde o código realmente está no consumidor. O código não é copiado para o projeto: fonte única, sem duplicata para manter em sincronia.

## Distribuir o projeto (template à venda, boilerplate, entrega a cliente)

A divisão `shared/`/`project/` só faz sentido para quem consome este pacote. Quem **recebe o produto** não tem upstream: banner de "não editar", referência ao repositório de origem e processo alheio viram ruído — ou pior, dependência de um repo que não é dele.

```bash
vue-claude-rules build --standalone --out release/.claude --name "Meu Template"
```

Gera um `.claude/rules/` autocontido: hierarquia achatada (`shared/x.md` e `project/catalog-ui.md` viram `x.md` e `components.md` irmãos), banners removidos, referências reescritas, menções ao scaffold retiradas, mais um `CLAUDE.md` escrito para quem recebe.

**Trava de vazamento:** o build falha (exit 1) se sobrar no material qualquer menção ao pacote, à conta do autor, aos scripts `rules:*`, a caminhos de `node_modules` — ou um `TODO` não preenchido. Corrija na origem e rode de novo; não há como enviar rascunho ao cliente por acidente.

**Não coloque este pacote como dependência de um projeto distribuído.** Especificador `github:` exige git e rede na máquina de quem instala, e amarra o `install` dele à existência do seu repo — para sempre. Como `.claude/rules/shared/` é commitado, o agente funciona sem o pacote; para atualizar, use `npx` avulso:

```jsonc
"scripts": {
  "rules:sync": "npx -y github:gabriellopesweber/vue-claude-rules sync"
}
```

## Regras

```
scaffold/          código base das primitivas (copiar sob demanda)
rules/
├── core/           agnóstico de stack
│   ├── dry.md          princípio de reuso, quando extrair, anti-padrões
│   ├── feedback.md     os 3 mecanismos: toast / stack global / inline
│   └── tests.md        FIRST, pirâmide, 4 pilares, test doubles, co-localização
├── vue/
│   ├── vue.md          script setup, ordem de imports, camadas, nomenclatura
│   ├── composables.md  Pinia+persist, global vs view-scoped, Orquestrador+Filiações
│   ├── services.md     service vs composable, padrão useAsync
│   └── repositories.md toda HTTP via repository
├── vuetify/
│   └── vuetify.md      tokens de tema, deprecações, mobile, ApexCharts
└── i18n/
    └── i18n.md         estrutura JSON, nomenclatura, proibições
```

## Contribuir

1. A mudança vale para **todos** os projetos? Se depende de um componente/endpoint específico, ela pertence ao `project/` do consumidor, não aqui.
2. PR neste repositório, com `CHANGELOG.md` atualizado.
3. Tag semver:
   - **patch** — correção de texto, exemplo melhor
   - **minor** — regra nova, seção nova, novo profile
   - **major** — mudança que invalida código existente nos consumidores (convenção de nomes, layout de diretórios)
4. Nos consumidores: bump da tag + `pnpm rules:sync`.

## Precedência

Em conflito, `project/` vence `shared/`. Um projeto pode divergir do padrão — mas a divergência tem que estar escrita no `project/`, não implícita numa edição do `shared/`.
