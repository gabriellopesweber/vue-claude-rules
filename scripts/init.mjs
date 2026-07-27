import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { detectStack, inventory, suggestProfile } from './detect.mjs'

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TODO = '<!-- TODO: revisar — rascunho gerado a partir do código -->'

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

const header = (title, sharedRefs) =>
  [
    `# ${title}`,
    '',
    `> Inventário local. Regras de *como/quando*: ${sharedRefs}.`,
    '> **Atualizar no mesmo PR** que muda o código correspondente.',
    '>',
    `> ${TODO}`,
    '',
  ].join('\n')

const buildCatalogUi = (inv, stack) => {
  const lines = [
    header('Catálogo de UI do projeto', '`.claude/rules/shared/dry.md` e `.claude/rules/shared/feedback.md`'),
    '## Componentes de feedback',
    '',
    '| Papel | Implementação neste projeto |',
    '|---|---|',
  ]

  const names = inv.components.map((c) => c.name)
  const composableNames = inv.composables.map((c) => c.name)
  const findComponent = (needle) => names.find((n) => n.toLowerCase().includes(needle))

  lines.push(
    `| Toast transitório | ${composableNames.includes('useSnackbar') ? '`useSnackbar().showMessage(text, type)`' : '**não existe** — ver `.claude/rules/shared/scaffold.md`'} |`,
  )
  lines.push(
    `| Stack global persistente | ${composableNames.includes('useAlertManager') ? '`useAlertManager` + `GlobalAlertStack`' : '**não existe** — ver `.claude/rules/shared/scaffold.md`'} |`,
  )
  lines.push(
    `| Alerta ancorado a campo/seção | ${findComponent('inlinealert') ? '`InlineAlert`' : '**não existe** — ver `.claude/rules/shared/scaffold.md`'} |`,
  )

  lines.push('', '## `src/components/ui/`', '')

  if (!inv.components.length) {
    lines.push('_Nenhum componente em `src/components/ui/`._', '')
  }

  for (const component of inv.components) {
    lines.push(`### \`${component.name}\``)
    lines.push('TODO: uma linha do que faz e quando usar.')
    for (const line of component.lines) lines.push(line)
    lines.push('')
  }

  if (stack.apex) {
    lines.push('> Este projeto usa `vue3-apexcharts` — ver a seção ApexCharts de `shared/vuetify.md`.', '')
  }

  return lines.join('\n')
}

const buildCatalogComposables = (inv) => {
  const lines = [
    header('Catálogo de composables e stores do projeto', '`.claude/rules/shared/composables.md`'),
    '## Composables — verificar antes de criar novos',
    '',
  ]

  const byScope = new Map()
  for (const composable of inv.composables) {
    if (!byScope.has(composable.scope)) byScope.set(composable.scope, [])
    byScope.get(composable.scope).push(composable.name)
  }

  if (!byScope.size) lines.push('_Nenhum composable em `src/composables/`._', '')

  for (const [scope, items] of byScope) {
    lines.push(`### \`${scope}/\``)
    lines.push('| Composable | Retorna | Usar para |')
    lines.push('|---|---|---|')
    for (const name of items) lines.push(`| \`${name}\` | TODO | TODO |`)
    lines.push('')
  }

  lines.push('## Composables view-scoped', '')
  if (inv.viewServices.length) {
    lines.push('| Composable | View | Papel |', '|---|---|---|')
    for (const path of inv.viewServices) lines.push(`| \`${path.split('/').pop()}\` | \`src/${path}\` | TODO |`)
  } else {
    lines.push('Nenhum.')
  }
  lines.push('')

  lines.push('## Pinia — stores existentes', '')
  if (inv.stores.length) {
    lines.push('| Store | Arquivo | O que guarda | Persistido |', '|---|---|---|---|')
    for (const store of inv.stores) {
      const persisted = store.key ? `\`${store.key}\`${store.pick.length ? ` (${store.pick.join(', ')})` : ''}` : 'não'
      lines.push(`| \`${store.name}\` | \`src/${store.path}\` | TODO | ${persisted} |`)
    }
  } else {
    lines.push('Nenhuma store — o projeto não usa Pinia.')
  }
  lines.push('')

  if (inv.validations.length) {
    lines.push('## Validações disponíveis', '')
    lines.push('`src/validations/rules/`: ' + inv.validations.map((v) => `\`${v}\``).join(', ') + '.', '')
  }

  return lines.join('\n')
}

const buildCatalogData = (inv) => {
  const lines = [
    header(
      'Catálogo de dados do projeto (repositories + services)',
      '`.claude/rules/shared/repositories.md` e `.claude/rules/shared/services.md`',
    ),
  ]

  lines.push('## Repositories existentes', '')
  if (inv.repositories.length) {
    lines.push('| Arquivo | Principais métodos | Consumido por |', '|---|---|---|')
    for (const repo of inv.repositories) {
      const methods = repo.methods.length ? repo.methods.map((m) => `\`${m}\``).join(', ') : 'TODO'
      lines.push(`| \`${repo.path}\` | ${methods} | ${repo.orphan ? '**ninguém**' : 'TODO'} |`)
    }
    const orphans = inv.repositories.filter((r) => r.orphan)
    if (orphans.length) {
      lines.push(
        '',
        `> ⚠️ Sem consumidor: ${orphans.map((r) => `\`${r.exported}\``).join(', ')}. TODO: dizer se é **contrato preparado** (dados de demo, backend ainda não ligado) ou **código morto**. Sem essa nota, alguém vai "consertar" o que é intencional.`,
      )
    }
  } else {
    lines.push('Nenhum — o projeto não consome API própria.')
  }
  lines.push('')

  lines.push('## Services existentes', '', '### Globais (`src/services/`)', '')
  if (inv.services.length) {
    lines.push('| Arquivo | Usado em |', '|---|---|')
    for (const path of inv.services) lines.push(`| \`${path}\` | TODO |`)
  } else {
    lines.push('Nenhum.')
  }
  lines.push('')

  lines.push('### Locais (`src/views/{feature}/services/`)', '')
  if (inv.viewServices.length) {
    lines.push('| Arquivo | Usado em |', '|---|---|')
    for (const path of inv.viewServices) lines.push(`| \`${path}\` | TODO |`)
  } else {
    lines.push('Nenhum.')
  }
  lines.push('')

  return lines.join('\n')
}

const buildStack = (inv, stack, pkg, profile) => {
  const lines = [
    header('Configuração da stack deste projeto', 'as regras de `.claude/rules/shared/`'),
    '## O que este projeto é',
    '',
    'TODO: uma linha. Se houver restrição que justifique divergir de uma regra compartilhada (produto vs template vs interno), escreva aqui — `project/` vence `shared/`, mas a divergência tem que estar escrita.',
    '',
    '## Prefixo de persistência',
    '',
  ]

  const keys = inv.stores.map((s) => s.key).filter(Boolean)
  const prefix = keys.length ? keys[0].split('_')[0] : null
  lines.push(
    keys.length
      ? `Chaves de \`localStorage\`: \`${prefix}_*\` (${keys.map((k) => `\`${k}\``).join(', ')}).`
      : 'TODO: nenhuma chave persistida detectada.',
  )
  lines.push('')

  lines.push('## Autenticação / `api.js`', '')
  if (inv.api) {
    lines.push(`- **Esquema:** ${inv.api.bearer ? 'Bearer token no header `Authorization`' : 'TODO'}`)
    if (inv.api.baseUrlEnv) lines.push(`- \`baseURL\` de \`import.meta.env.${inv.api.baseUrlEnv}\``)
    if (inv.api.withCredentials) lines.push('- `withCredentials: true` — usa cookie')
    if (inv.api.extraHeaders.length) {
      lines.push('- Headers extras do interceptor: ' + inv.api.extraHeaders.map((h) => `\`${h}\``).join(', '))
    }
    lines.push(`- **Refresh token:** ${inv.api.refresh ? 'sim — TODO descrever o fluxo' : 'não'}`)
    lines.push('- **401 global:** TODO')
    const persistsSession = inv.stores.some((s) => s.pick.some((p) => /token|user|session/i.test(p)))
    if (persistsSession) {
      lines.push(
        '',
        '> ⚠️ **Atenção:** há credencial de sessão persistida em `localStorage`. `shared/composables.md` diz que isso não deve acontecer (access token em memória + refresh em cookie HttpOnly). Ou corrija, ou documente aqui por que este projeto diverge de propósito.',
      )
    }
  } else {
    lines.push('Não há `src/services/api.js` — o projeto não consome API própria.')
  }
  lines.push('')

  if (inv.vuetifyDefaults.length) {
    lines.push('## Defaults de componentes (`src/plugins/vuetify.js`)', '')
    lines.push('| Componente | Defaults aplicados |', '|---|---|')
    for (const entry of inv.vuetifyDefaults) lines.push(`| \`${entry.name}\` | \`${entry.body}\` |`)
    lines.push('')
  }

  lines.push('## i18n', '')
  if (stack.i18n) {
    lines.push(`- **Idiomas:** ${inv.locales.map((l) => `\`${l}\``).join(', ') || 'TODO'}`)
    if (inv.locales.length > 1) {
      lines.push('- **Toda chave nova entra em todos os idiomas** — chave faltando num locale é bug de produção.')
    }
    if (inv.localeFiles.length) {
      lines.push('', '```', ...inv.localeFiles.map((f) => `src/${f}`), '```')
    }
  } else {
    lines.push('O projeto **não usa vue-i18n** — `shared/i18n.md` não se aplica (texto direto no template é o correto).')
  }
  lines.push('')

  lines.push('## Scripts', '', '| Script | O que faz |', '|---|---|')
  for (const [name, cmd] of Object.entries(pkg.scripts ?? {})) {
    lines.push(`| \`pnpm ${name}\` | \`${cmd}\` |`)
  }
  lines.push('')

  lines.push('## Testes', '')
  if (stack.vitest) {
    lines.push('- Vitest presente. **Onde o gate roda de fato** (CI ou script de build): TODO — ver `shared/tests.md`.')
    if (stack.cypress) lines.push('- Cypress presente. Config, specs e cobertura atual: TODO.')
    if (stack.playwright) lines.push('- Playwright presente. Config, specs e cobertura atual: TODO.')
  } else {
    lines.push(
      `**Não há suíte de teste** — por isso o profile é \`${profile}\` e \`shared/tests.md\` não é carregado.`,
      '',
      'Não crie a primeira suíte, o config nem job de CI por conta própria (ver o preâmbulo de escopo de `shared/tests.md`). Se fizer sentido, proponha antes.',
    )
  }
  lines.push('')

  return lines.join('\n')
}

const isPristineTemplate = async (path) => {
  if (!existsSync(path)) return true
  const content = await readFile(path, 'utf8')
  return content.includes('{NomeDoComponente}') || content.includes('{prefixo}') || content.includes('{domínio}')
}

export const runInit = async ({ cwd, force = false, profileOverride = null, distMode = false }) => {
  const pkgPath = join(cwd, 'package.json')
  if (!existsSync(pkgPath)) {
    console.error('[init] package.json não encontrado. Rode na raiz do projeto.')
    process.exit(1)
  }

  const pkg = await readJson(pkgPath)
  const own = await readJson(join(PKG_ROOT, 'package.json'))
  const stack = detectStack(pkg)
  const profile = profileOverride ?? suggestProfile(stack)

  const detected = Object.entries(stack)
    .filter(([, present]) => present)
    .map(([name]) => name)
  console.log(`[init] detectado: ${detected.join(', ') || 'nada além de vue'}`)
  console.log(`[init] profile: ${profile}${profileOverride ? ' (forçado)' : ' (sugerido)'}`)

  pkg.scripts ??= {}
  pkg.devDependencies ??= {}

  // Projeto distribuído (template à venda, boilerplate, entrega a cliente) não pode
  // ter este pacote como dependência: amarra o install de quem recebe à existência
  // de um repo alheio, e exige git na máquina dele. Como shared/ é commitado, o
  // agente funciona sem o pacote — só a atualização precisa dele, via npx avulso.
  const alreadyNpx = /npx/.test(pkg.scripts['rules:sync'] ?? '')
  const standalone = distMode || alreadyNpx

  if (standalone) {
    delete pkg.devDependencies['vue-claude-rules']
    const base = `npx -y github:gabriellopesweber/vue-claude-rules#v${own.version}`
    pkg.scripts['rules:sync'] = `${base} sync`
    pkg.scripts['rules:check'] = `${base} sync --check`
    pkg.scripts['rules:dist'] ??= `${base} build --standalone --out dist-claude/.claude`
  } else {
    pkg.scripts['rules:sync'] ??= 'node node_modules/vue-claude-rules/scripts/sync.mjs'
    pkg.scripts['rules:check'] ??= 'node node_modules/vue-claude-rules/scripts/sync.mjs --check'
    pkg.devDependencies['vue-claude-rules'] ??= `github:gabriellopesweber/vue-claude-rules#v${own.version}`
  }

  pkg.claudeRules = { ...pkg.claudeRules, profile }
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  console.log(
    standalone
      ? '[init] package.json: scripts via npx, sem devDependency (modo distribuição)'
      : '[init] package.json: scripts, devDependency e claudeRules.profile',
  )

  const inv = await inventory(cwd)
  const projectDir = join(cwd, '.claude', 'rules', 'project')
  await mkdir(projectDir, { recursive: true })

  const drafts = inv
    ? {
        'catalog-ui.md': buildCatalogUi(inv, stack),
        'catalog-composables.md': buildCatalogComposables(inv),
        'catalog-data.md': buildCatalogData(inv),
        'stack.md': buildStack(inv, stack, pkg, profile),
      }
    : {}

  const written = []
  const skipped = []
  for (const [name, content] of Object.entries(drafts)) {
    const target = join(projectDir, name)
    if (!force && !(await isPristineTemplate(target))) {
      skipped.push(name)
      continue
    }
    await writeFile(target, content, 'utf8')
    written.push(name)
  }

  if (written.length) console.log(`[init] project/ rascunhado do código: ${written.join(', ')}`)
  if (skipped.length) console.log(`[init] project/ preservado (já preenchido): ${skipped.join(', ')}`)
  if (!inv) console.log('[init] sem src/ — catálogos não rascunhados')

  const claudeMd = join(cwd, 'CLAUDE.md')
  const claudeMdExists = existsSync(claudeMd)
  if (!claudeMdExists) {
    const template = await readFile(join(PKG_ROOT, 'templates', 'CLAUDE.md'), 'utf8')
    await writeFile(claudeMd, template, 'utf8')
    console.log('[init] CLAUDE.md criado a partir do template')
  }

  console.log('')
  console.log('⚠️  A ADOÇÃO NÃO ESTÁ COMPLETA. O init faz só a parte mecânica.')
  console.log('   Agente: siga node_modules/vue-claude-rules/ADOPTING.md (passos 2 a 4)')
  console.log('   antes de reportar concluído — catálogo com TODO não serve para nada.')
  console.log('')
  console.log('Falta fazer (precisa de julgamento, não dá para gerar):')
  let step = 1
  console.log(`  ${step++}. pnpm install && pnpm rules:sync`)
  console.log(`  ${step++}. Preencher os TODO de .claude/rules/project/ — descrição de cada componente/composable/store`)
  if (claudeMdExists) {
    console.log(`  ${step++}. Atualizar CLAUDE.md com a tabela de duas colunas (modelo: node_modules/vue-claude-rules/templates/CLAUDE.md)`)
  }
  console.log(`  ${step++}. Apagar as regras antigas soltas em .claude/rules/*.md, se houver`)
  console.log(`  ${step++}. Verificar: pnpm rules:check && pnpm lint`)
}
