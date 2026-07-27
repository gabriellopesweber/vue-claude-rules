# vue-claude-rules

Regras de Claude Code compartilhadas entre projetos Vue 3 + Vuetify + Pinia.

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

| Profile | Para | Regras |
|---|---|---|
| `spa-full` | SPA com backend **e** suíte de teste | 9 |
| `spa` | SPA com backend, sem testes | 8 |
| `site` | Site/landing com i18n, sem backend nem estado global | 4 |
| `minimal` | Vue + Vuetify apenas | 3 |

Selecione via `claudeRules.profile` no `package.json` ou `--profile <nome>`.

**Regra do profile: só inclua regra que o projeto realmente pratica.** `core/tests.md` descreve como testar bem *onde já se testa* — num projeto sem suíte ela vira pressão para o agente criar testes que ninguém pediu. Mesmo raciocínio para `i18n.md` sem vue-i18n, `repositories.md`/`services.md` sem backend, `feedback.md` sem stack de alertas. Profile enxuto é feature, não falta.

Cada regra condicional carrega um **preâmbulo de escopo** dizendo o que pressupõe e o que fazer quando não existe — rede de segurança para quando o profile estiver errado.

### Lista custom

Projeto raramente cabe exatamente num bundle. `claudeRules.rules` vence o profile:

```jsonc
"claudeRules": {
  "rules": ["core/dry.md", "core/tests.md", "vue/vue.md", "vuetify/vuetify.md", "i18n/i18n.md"],
  "catalogs": ["catalog-ui.md", "stack.md"]
}
```

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
