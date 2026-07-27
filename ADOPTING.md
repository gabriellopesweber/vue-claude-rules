# Adotar o vue-claude-rules neste repositório

**Este documento é escrito para um agente de código** (Claude Code ou equivalente) que recebeu a tarefa *"adote o vue-claude-rules neste projeto"*. Siga na ordem. Você não precisa de contexto prévio sobre a biblioteca — está tudo aqui.

## O que você vai produzir

```
.claude/rules/
├── shared/          gerado pelo sync — NUNCA editar
├── project/         inventário DESTE repositório — você preenche
└── .rules-version
CLAUDE.md            tabela apontando para os dois
```

A ideia central: **`shared/` é princípio** (como decidir, vale para todos os projetos Vue), **`project/` é inventário** (o que já existe aqui). "Reuse antes de criar" só funciona se a lista do que existe estiver escrita. Em conflito, `project/` vence `shared/`.

## Passo 1 — instalar e rascunhar

```bash
pnpm add -D github:gabriellopesweber/vue-claude-rules
pnpm exec vue-claude-rules init
pnpm install && pnpm rules:sync
```

O `init` detecta a stack (pinia/axios/vue-i18n/vitest/apexcharts), escolhe o profile, adiciona os scripts `rules:sync`/`rules:check` no `package.json` e **rascunha os catálogos de `project/` lendo o `src/`** — nomes de componentes, props, emits, composables por escopo, repositories e seus métodos, stores e chaves de persistência, defaults do Vuetify, árvore de locales, scripts.

O rascunho traz a estrutura correta e **`TODO` onde é preciso julgamento**. Sua tarefa é fechar esses `TODO`.

Se o profile sugerido estiver errado, force: `pnpm exec vue-claude-rules init --profile spa`.

| Profile | Quando |
|---|---|
| `spa-full` | backend próprio (axios+pinia) **e** suíte de teste |
| `spa` | backend próprio, sem testes |
| `site` | site/landing com i18n, sem backend nem estado global |
| `minimal` | Vue + Vuetify apenas |

Um projeto que não cabe em nenhum usa lista custom no `package.json`:
```jsonc
"claudeRules": { "rules": ["core/dry.md", "vue/vue.md", "vuetify/vuetify.md"], "catalogs": ["catalog-ui.md", "stack.md"] }
```

## Passo 2 — fechar os TODO de `project/`

Esta é a parte que exige você. Leia o código; não invente.

### `catalog-ui.md`
Para cada componente de `src/components/ui/`, escreva **uma linha do que faz e quando usar**. Props/emits já vieram do código — confira e corrija o que a heurística errou (defaults compostos, props documentadas por comentário). Componente de domínio reutilizado por 2+ views também entra.

O critério do texto: alguém que nunca viu o componente decide, só lendo a linha, se deve reusá-lo ou criar outro.

### `catalog-composables.md`
Preencha "Retorna" e "Usar para" de cada composable — abra o arquivo e leia o `return`. Nas stores, descreva o que guardam.

### `catalog-data.md`
Preencha "Usado em" de cada service. **Procure repository sem consumidor** (`grep -rl <nomeDoRepository> src/ | grep -v repositories/`): se existir, diga se é contrato preparado ou código morto — senão alguém vai "consertar" o que é intencional.

### `stack.md`
O mais importante e o que o gerador menos consegue inferir:

- **"O que este projeto é"** — produto, template à venda, interno? Isso justifica divergências.
- **Autenticação** — esquema completo e comportamento no 401.
- **Onde o gate de teste roda de fato** — CI ou script de build. Verifique `.github/workflows/`; não presuma.
- **Divergências conscientes** de alguma regra de `shared/`. Se o `init` marcou ⚠️ (ex.: token em `localStorage`), decida: corrigir ou documentar o porquê. Não deixe em silêncio.

## Passo 3 — `CLAUDE.md`

Se já existe, adapte-o ao modelo em `node_modules/vue-claude-rules/templates/CLAUDE.md`: a tabela "Carregar regras conforme o contexto" passa a ter **duas colunas** — princípio (`shared/`) e inventário (`project/`) — e ganha a seção "Regras compartilhadas — como funcionam". Preserve o que for específico do projeto.

Só liste linhas de regras que o profile realmente sincronizou (confira `ls .claude/rules/shared/`).

## Passo 4 — limpar e verificar

```bash
git rm .claude/rules/*.md        # regras antigas soltas, se houver
pnpm rules:check                 # deve sair 0
pnpm lint
pnpm test                        # se houver suíte
```

Commite `.claude/rules/shared/` — os arquivos precisam existir para o agente mesmo sem `node_modules`, e cada atualização vira diff revisável no PR.

## Regras da adoção

- **Nunca edite `.claude/rules/shared/`.** É sobrescrito no próximo sync. Princípio errado → PR no `vue-claude-rules`. Especificidade do projeto → `project/`.
- **Não instale nada para "cumprir" uma regra.** Cada regra condicional abre com um preâmbulo de escopo dizendo o que pressupõe. Sem vue-i18n, a proibição de string hardcoded não se aplica; sem suíte, não crie a primeira. Adotar i18n, Pinia ou testes é decisão do dono do projeto — proponha, não execute.
- **Primitiva que falta tem código pronto.** `useAsync`, `useValidation`, `useSnackbar`, `useAlertManager`, `withSetup` e os componentes de feedback estão em `.claude/rules/shared/scaffold.md`, com o gatilho de adoção de cada um. Copie sob demanda; não em bloco.
- **Catálogo desatualizado é o modo de falha caro** desta biblioteca: leva o agente a duplicar código que já existe. Atualizar `project/` faz parte do PR que muda o código, não é tarefa separada.

## Atualizar depois

```bash
pnpm up vue-claude-rules   # ou trocar a tag no package.json
pnpm rules:sync
```

`pnpm rules:check` sai com código 1 se `shared/` foi editado à mão ou está defasado — bom step de CI.
