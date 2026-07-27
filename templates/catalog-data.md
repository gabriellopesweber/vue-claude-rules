# Catálogo de dados do projeto (repositories + services)

> Inventário local. Regras de *como* estruturar: `.claude/rules/shared/repositories.md` e `.claude/rules/shared/services.md`.
> **Atualizar no mesmo PR** que adiciona/renomeia endpoint ou service.

## Estrutura de diretórios

```
src/repositories/
├── auth/
└── {domínio}/
```

## Repositories existentes

### `auth/`
| Arquivo | Principais métodos |
|---|---|
| `authRepository` | `login(email, pwd)` |
| `userRepository` | `register(data)`, `getMe()` |

### `{domínio}/`
| Arquivo | Principais métodos |
|---|---|
| | |

## Services existentes

### Globais (`src/services/{domínio}/`)
| Arquivo | Usado em |
|---|---|
| | |

### Locais (`src/views/{feature}/services/`)
| Arquivo | Usado em |
|---|---|
| | |
