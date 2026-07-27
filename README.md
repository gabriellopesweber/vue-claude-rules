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

```jsonc
// package.json
{
  "devDependencies": {
    "vue-claude-rules": "github:gabriellopesweber/vue-claude-rules#v1.0.0"
  },
  "scripts": {
    "rules:sync": "node node_modules/vue-claude-rules/scripts/sync.mjs",
    "rules:check": "node node_modules/vue-claude-rules/scripts/sync.mjs --check"
  },
  "claudeRules": { "profile": "spa-full" }
}
```

```bash
pnpm install
pnpm rules:sync
```

Resultado:

```
.claude/rules/
├── shared/            # gerado — NÃO EDITAR (banner em cada arquivo)
├── project/           # inventário local — semeado só na 1ª vez, nunca sobrescrito
└── .rules-version     # v1.0.0
```

Depois copie `templates/CLAUDE.md` para a raiz do projeto e preencha a tabela de carregamento.

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

| Profile | Para | Inclui |
|---|---|---|
| `spa-full` | SPA com backend: Pinia, axios, camadas repository/service/composable, suíte de teste | 9 regras |
| `site-static` | Site/landing sem backend próprio e **sem suíte de teste** | 5 regras (sem repositories/services/composables de estado/tests) |

Selecione via `claudeRules.profile` no `package.json` ou `--profile <nome>`.

**Regra do profile:** só inclua uma regra que o projeto realmente pratica. `core/tests.md` descreve como testar bem onde já se testa — num projeto sem suíte ela vira pressão para o agente criar testes que ninguém pediu. Mesma lógica para `vue/repositories.md` e `vue/services.md` num site sem backend. Profile enxuto é feature, não falta.

## Regras

```
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
