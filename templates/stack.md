# Configuração da stack deste projeto

> Tudo que é decisão **deste** repositório e as regras compartilhadas referenciam.
> **Atualizar no mesmo PR** que muda `vuetify.js`, o esquema de auth, os locales ou os scripts de build/test.

## Prefixo de persistência

Chaves de `localStorage`: `{prefixo}_*` (ex.: `{prefixo}_ui`).

## Autenticação / `api.js`

- Esquema: {ex.: Access Token em memória (15min) + Refresh Token em cookie HttpOnly}
- Headers injetados pelo interceptor: {ex.: `Authorization: Bearer <accessToken>`, `X-Workspace-Id`}
- Comportamento no 401: {ex.: tenta refresh e reenvia; se falhar, limpa sessão e redireciona para `/login`}

## Defaults de componentes (`src/plugins/vuetify.js`)

| Componente | Defaults aplicados |
|---|---|
| `VCard` | |
| `VBtn` | |
| `VTextField` | |

**Temas:** {ex.: `light`, `dark`}

### Tokens de cor além do tema padrão do Vuetify

{Lista dos tokens declarados no `theme.themes.*.colors` deste projeto — nomes como
`surface-container-low` ou `tertiary` **não vêm do Vuetify**. Token fora desta lista e
da lista padrão não existe: usá-lo produz cor vazia, sem erro. Confirmar que todos
estão declarados em **todos** os temas.}

## i18n

- Idiomas: {ex.: `pt-BR` (único)}
- Árvore de arquivos:

```
src/locales/{locale}/
├── common.json
└── {namespace}/
```

## Scripts de build e teste

| Script | O que faz |
|---|---|
| `pnpm test` | run único (gate) |
| `pnpm test:watch` | modo watch |
| `pnpm lint` / `lint:fix` | eslint |
| `pnpm build:*:secure` | audit → test → build (barra deploy com teste vermelho) |
| `pnpm test:e2e` | E2E (job dedicado, fora do gate) |

## E2E

- Ferramenta: {Cypress | Playwright}
- Config: {caminho}
- Specs: {caminho}
- Cobertura atual: {o que já está coberto}
- Próximos fluxos: {o que falta}
