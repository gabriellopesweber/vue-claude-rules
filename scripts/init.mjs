import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { detectStack, inventory, looksDistributed, suggestProfile } from './detect.mjs'
import { auditDeps, catalogsFor, formatDepNote, loadManifest, resolveRules, rulesForStack } from './manifest.mjs'

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TODO = '<!-- TODO: revisar — rascunho gerado a partir do código -->'

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

/**
 * Referenciar uma regra que o profile não sincroniza produz link morto e, pior,
 * orientação errada — mandar usar `t()` num projeto sem i18n. Tudo que o gerador
 * escreve passa por aqui: só sobrevive o que existe de fato em shared/.
 */
const makeRefs = (syncedRules, catalogs = []) => {
  const files = new Set(syncedRules.map((r) => r.split('/').pop()))
  return {
    catalogs,
    has: (file) => files.has(file),
    link: (file) => (files.has(file) ? `\`.claude/rules/shared/${file}\`` : null),
    /** Junta só as referências vivas; devolve null se nenhuma sobrou. */
    join: (...candidates) => {
      const live = candidates.map((f) => (files.has(f) ? `\`.claude/rules/shared/${f}\`` : null)).filter(Boolean)
      if (!live.length) return null
      return live.length === 1 ? live[0] : live.slice(0, -1).join(', ') + ' e ' + live.at(-1)
    },
  }
}

const header = (title, sharedRefs) =>
  [
    `# ${title}`,
    '',
    sharedRefs ? `> Inventário local. Regras de *como/quando*: ${sharedRefs}.` : '> Inventário local deste projeto.',
    '> **Atualizar no mesmo PR** que muda o código correspondente.',
    '>',
    `> ${TODO}`,
    '',
  ].join('\n')

const buildCatalogUi = (inv, stack, refs) => {
  const lines = [header('Catálogo de UI do projeto', refs.join('dry.md', 'feedback.md'))]

  if (refs.has('feedback.md')) {
    const names = inv.components.map((c) => c.name)
    const composableNames = inv.composables.map((c) => c.name)
    const findComponent = (needle) => names.find((n) => n.toLowerCase().includes(needle))
    const missing = refs.has('scaffold.md') ? '**não existe** — ver `.claude/rules/shared/scaffold.md`' : '**não existe**'

    lines.push(
      '## Componentes de feedback',
      '',
      '| Papel | Implementação neste projeto |',
      '|---|---|',
      `| Toast transitório | ${composableNames.includes('useSnackbar') ? '`useSnackbar().showMessage(text, type)`' : missing} |`,
      `| Stack global persistente | ${composableNames.includes('useAlertManager') ? '`useAlertManager` + `GlobalAlertStack`' : missing} |`,
      `| Alerta ancorado a campo/seção | ${findComponent('inlinealert') ? '`InlineAlert`' : missing} |`,
      '',
    )
  }

  lines.push('## `src/components/ui/`', '')

  if (!inv.components.length) {
    // Num boilerplate o catálogo vale pelo que orienta, não pelo que lista.
    lines.push(
      'Ainda não há componentes em `src/components/ui/`. Esta seção existe para ser preenchida **no mesmo commit** que criar o primeiro.',
      '',
      'O critério para um componente morar aqui: o padrão de UI aparece em 2+ lugares, ou o bloco é complexo o bastante para poluir a view. Uso único e simples fica na própria view.',
      '',
      'Para cada componente, registre uma linha do que faz e quando usar, mais props/emits/v-model. Quem lê precisa decidir, só por essa linha, se reusa ou cria outro.',
      '',
    )
  }

  for (const component of inv.components) {
    lines.push(`### \`${component.name}\``)
    lines.push('TODO: uma linha do que faz e quando usar.')
    for (const line of component.lines) lines.push(line)
    lines.push('')
  }

  if (stack.apex && refs.has('vuetify.md')) {
    lines.push('> Este projeto usa `vue3-apexcharts` — ver a seção ApexCharts de `.claude/rules/shared/vuetify.md`.', '')
  }

  return lines.join('\n')
}

const buildCatalogComposables = (inv, stack, refs) => {
  const lines = [
    header('Catálogo de composables e stores do projeto', refs.link('composables.md')),
    '## Composables — verificar antes de criar novos',
    '',
  ]

  const byScope = new Map()
  for (const composable of inv.composables) {
    if (!byScope.has(composable.scope)) byScope.set(composable.scope, [])
    byScope.get(composable.scope).push(composable.name)
  }

  if (!byScope.size) {
    lines.push(
      'Ainda não há composables em `src/composables/`. Preencher **no mesmo commit** que criar o primeiro.',
      '',
      'O critério: lógica reativa usada por 2+ componentes vira composable; estado de um componente só continua `ref` local. Convenção de nome `use{Feature}.js`, agrupado por escopo (`core/`, `auth/`, `{domínio}/`), retornando objeto plano.',
      '',
    )
  }

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
  } else if (stack.pinia) {
    lines.push('Pinia está instalado, mas não há store em `src/stores/`. Registrar aqui a primeira que criar, com o que guarda e se é persistida.')
  } else {
    lines.push(
      '**O projeto não usa Pinia** — e adotá-lo é decisão do dono, não algo a fazer para "seguir o padrão".',
      '',
      'Estado global sem Pinia: um `ref` no nível do módulo dentro de um composable resolve a maioria dos casos. Se surgir necessidade de persistir entre sessões, proponha `pinia` + `pinia-plugin-persistedstate` antes de instalar.',
    )
  }
  lines.push('')

  if (inv.validations.length) {
    lines.push('## Validações disponíveis', '')
    lines.push('`src/validations/rules/`: ' + inv.validations.map((v) => `\`${v}\``).join(', ') + '.', '')
  }

  return lines.join('\n')
}

const buildCatalogData = (inv, stack, refs) => {
  const lines = [
    header('Catálogo de dados do projeto (repositories + services)', refs.join('repositories.md', 'services.md')),
  ]

  if (!stack.axios && !inv.repositories.length) {
    lines.push(
      '**O projeto não consome API própria** — não há axios nem camada de repositories, e as regras correspondentes não estão carregadas.',
      '',
      'Se um backend entrar em cena, o caminho é `src/services/api.js` (única instância axios, com os interceptors) → `src/repositories/{domínio}/` (só o mapa de endpoints, sem try/catch) → composables. Registrar aqui cada endpoint no mesmo commit que o criar.',
      '',
    )
    return lines.join('\n')
  }

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

const buildStack = (inv, stack, pkg, profile, refs) => {
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
        `> ⚠️ **Atenção:** há credencial de sessão persistida em \`localStorage\`.${refs.has('composables.md') ? ' `.claude/rules/shared/composables.md` diz que isso não deve acontecer' : ' O padrão é isso não acontecer'} (access token em memória + refresh em cookie HttpOnly). Ou corrija, ou documente aqui por que este projeto diverge de propósito. Confira se não é falso positivo — um campo como \`pendingInviteToken\` casa a heurística sem ser credencial de sessão.`,
      )
    }
  } else {
    lines.push('Não há `src/services/api.js` — o projeto não consome API própria.')
  }
  lines.push('')

  // `shared/vuetify.md` promete que a tabela de defaults está aqui — se o bloco
  // não for encontrado, a promessa vira link morto. Melhor pedir explicitamente.
  if (stack.vuetify) {
    lines.push('## Defaults de componentes (`src/plugins/vuetify.js`)', '')
    if (inv.vuetifyDefaults.length) {
      lines.push('| Componente | Defaults aplicados |', '|---|---|')
      for (const entry of inv.vuetifyDefaults) lines.push(`| \`${entry.name}\` | \`${entry.body}\` |`)
    } else {
      lines.push(
        'TODO: nenhum bloco `defaults` foi encontrado no plugin do Vuetify. Ou não existe (e então nada a documentar — apague esta seção), ou está num caminho fora do padrão: copie a tabela à mão.',
      )
    }
    lines.push('')

    if (inv.vuetifyThemes.length) {
      lines.push(
        `**Temas:** ${inv.vuetifyThemes.map((t) => `\`${t}\``).join(', ')}.` +
          (inv.vuetifyThemes.length === 1 ? ' Tema único — não construir toggle dark/light por conta própria.' : ''),
        '',
      )
    }
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
    lines.push(
      `O projeto **não usa vue-i18n**${refs.has('i18n.md') ? ' — `.claude/rules/shared/i18n.md` não se aplica' : ''}: texto direto no template é o correto aqui.`,
      '',
      'Internacionalizar é decisão de produto, com custo de manutenção permanente. Não instalar vue-i18n nem criar `src/locales/` por conta própria — proponha, se fizer sentido.',
    )
  }
  lines.push('')

  lines.push('## Scripts', '', '| Script | O que faz |', '|---|---|')
  for (const [name, cmd] of Object.entries(pkg.scripts ?? {})) {
    lines.push(`| \`pnpm ${name}\` | \`${cmd}\` |`)
  }
  lines.push('')

  lines.push('## Testes', '')
  if (stack.vitest) {
    lines.push(
      `- Vitest presente. **Onde o gate roda de fato** (CI ou script de build): TODO${refs.has('tests.md') ? ' — ver `.claude/rules/shared/tests.md`' : ''}.`,
    )
    if (stack.cypress) lines.push('- Cypress presente. Config, specs e cobertura atual: TODO.')
    if (stack.playwright) lines.push('- Playwright presente. Config, specs e cobertura atual: TODO.')
  } else {
    lines.push(
      `**Não há suíte de teste** — por isso o profile é \`${profile}\` e a regra de testes não é carregada.`,
      '',
      'Não crie a primeira suíte, o config nem job de CI por conta própria. Adotar testes é decisão do dono do projeto, com custo de manutenção real — proponha antes.',
    )
  }
  lines.push('')

  return lines.join('\n')
}

/**
 * O CLAUDE.md é a porta de entrada: copiá-lo do template entrega placeholders e,
 * pior, linhas apontando para regras que o profile não sincroniza — mandando usar
 * `t()` num projeto sem i18n. Tudo aqui sai do profile + da stack detectada.
 */
const buildClaudeMd = (pkg, stack, refs, selection, distMode) => {
  const name = pkg.name ?? 'Projeto'
  const uiLib = stack.vuetify ? 'Vuetify' : 'a lib de UI'

  const stackLines = ['- **Components**: Vue 3 `<script setup>`' + (stack.vuetify ? ' + Vuetify' : '')]
  if (stack.pinia) stackLines.push('- **State**: Pinia + composables para lógica de domínio')
  if (stack.axios) stackLines.push('- **HTTP**: `src/services/api.js` → repositories → services → composables/views')
  if (stack.i18n) stackLines.push('- **i18n**: Todo texto via `t()` — `src/locales/**/*.json`')
  if (stack.vitest) stackLines.push('- **Testes**: Vitest')

  const rows = [
    ['Criar/editar componentes `.vue`, props, emits, template', 'vue.md', 'catalog-ui.md'],
    ['Reutilização de UI, evitar duplicação, extrair componentes', 'dry.md', 'catalog-ui.md'],
    ['Feedback ao usuário: toast, alerta persistente, inline', 'feedback.md', 'catalog-ui.md'],
    [`Cores, tokens de tema, layout mobile, componentes ${uiLib}`, 'vuetify.md', 'stack.md'],
    ['Composables, stores, lógica compartilhada', 'composables.md', 'catalog-composables.md'],
    ['Services (`useAsync` wrappers), service vs composable', 'services.md', 'catalog-data.md'],
    ['Chamadas HTTP, repositories, camada de API', 'repositories.md', 'catalog-data.md'],
    ['Texto visível ao usuário, chaves de tradução, locales', 'i18n.md', 'stack.md'],
    ['Escrever/editar testes, localização dos `.test`, mocks', 'tests.md', 'stack.md'],
    ['Adotar uma primitiva que a regra exige (`useAsync`, toast…)', 'scaffold.md', 'catalog-composables.md'],
  ]
    .filter(([, rule]) => refs.has(rule))
    .map(([task, rule, catalog]) => [task, rule, refs.catalogs.includes(catalog) ? catalog : 'stack.md'])

  // Só entra a regra universal que o projeto pode de fato cumprir.
  const universal = ['- Sempre `<script setup>` — sem Options API, sem `export default {}`']
  if (stack.i18n) universal.push("- Nenhuma string hardcoded em templates — usar `t('chave')`")
  if (stack.vuetify) universal.push('- Nenhuma cor hardcoded — usar `rgb(var(--v-theme-*))` ou classes do tema')
  if (stack.axios) universal.push('- Nunca chamar axios diretamente em componentes ou views — sempre via repository')
  universal.push(
    `- Verificar o que já existe antes de criar componente, composable${stack.i18n ? ' ou chave de tradução' : ''}`,
  )

  const syncCmd = distMode ? 'pnpm rules:sync' : 'pnpm rules:sync'

  return [
    `# ${name}`,
    '',
    'TODO: uma linha sobre o que este projeto é.',
    '',
    '## Stack',
    ...stackLines,
    '',
    '## Carregar regras conforme o contexto da tarefa',
    '',
    '`shared/` é sincronizado do upstream (**não editar**). `project/` é o inventário deste repositório.',
    '',
    '| Tarefa envolve | Princípio (shared) | Inventário (project) |',
    '|---|---|---|',
    ...rows.map(([task, rule, catalog]) => `| ${task} | \`.claude/rules/shared/${rule}\` | \`.claude/rules/project/${catalog}\` |`),
    '',
    `> Regras em uso: ${selection.map((r) => `\`${r.id}\``).join(', ')}. As demais **não** são carregadas de propósito — este projeto não pratica o que elas exigem. Para ver o catálogo completo e mudar a seleção (\`claudeRules.rules\` no \`package.json\`): \`npx vue-claude-rules list\`.`,
    '',
    '## Regras universais (sempre aplicar)',
    ...universal,
    '',
    '## Regras compartilhadas — como funcionam',
    '',
    `- \`.claude/rules/shared/\` é **gerado** por \`${syncCmd}\`. Editar ali é perda garantida no próximo sync.`,
    '- Mudou um **princípio** (vale para todos os projetos) → PR no upstream, sobe a versão, sincroniza aqui.',
    '- Mudou o **inventário** (componente novo, composable novo, endpoint novo) → editar `.claude/rules/project/` **no mesmo PR** da mudança de código. Catálogo desatualizado faz o agente duplicar código que já existe.',
    '- **Precedência:** em conflito, `project/` vence `shared/` — divergir é permitido, mas a divergência tem que estar escrita.',
    '- Versão em vigor: `.claude/rules/.rules-version` · `pnpm rules:check` acusa edição manual, versão defasada ou adoção incompleta.',
    '',
  ].join('\n')
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
  const profile = profileOverride ?? pkg.claudeRules?.profile ?? suggestProfile(stack)

  const manifest = await loadManifest()
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })

  // Sem `--profile`, a seleção é granular: cada regra entra porque o projeto tem
  // a dependência que ela pressupõe. Bucket pronto raramente casa — um one-page
  // com i18n e testes não é `site` nem `spa-full`.
  let selection
  let selectionLabel
  if (profileOverride) {
    const profilePath = join(PKG_ROOT, 'profiles', `${profileOverride}.json`)
    if (!existsSync(profilePath)) {
      const available = (await readdir(join(PKG_ROOT, 'profiles'))).map((f) => f.replace('.json', ''))
      console.error(`[init] preset "${profileOverride}" não existe. Disponíveis: ${available.join(', ')}`)
      process.exit(1)
    }
    const profileDef = await readJson(profilePath)
    const resolved = resolveRules(manifest, profileDef.rules)
    selection = resolved.rules
    selectionLabel = `preset ${profileOverride}`
  } else if (Array.isArray(pkg.claudeRules?.rules) && pkg.claudeRules.rules.length) {
    const resolved = resolveRules(manifest, pkg.claudeRules.rules)
    if (resolved.unknown.length) {
      console.error(`[init] regra desconhecida no package.json: ${resolved.unknown.join(', ')}`)
      console.error('[init] veja o catálogo: npx vue-claude-rules list')
      process.exit(1)
    }
    selection = resolved.rules
    selectionLabel = 'claudeRules.rules do package.json'
  } else if (pkg.claudeRules?.profile) {
    const profilePath = join(PKG_ROOT, 'profiles', `${pkg.claudeRules.profile}.json`)
    const profileDef = await readJson(profilePath)
    selection = resolveRules(manifest, profileDef.rules).rules
    selectionLabel = `preset ${pkg.claudeRules.profile} (já no package.json)`
  } else {
    selection = rulesForStack(manifest, stack)
    selectionLabel = 'derivado da stack'
  }

  const catalogs = catalogsFor(selection)
  const refs = makeRefs([...selection.map((r) => r.path), 'scaffold.md'], catalogs)

  const detected = Object.entries(stack)
    .filter(([, present]) => present)
    .map(([name]) => name)
  console.log(`[init] detectado: ${detected.join(', ') || 'nada além de vue'}`)
  console.log(`[init] regras (${selectionLabel}): ${selection.map((r) => r.id).join(', ')}`)

  for (const note of auditDeps(selection, deps)) {
    console.log(`[init] ${note.level === 'requires' ? '⚠️ ' : 'nota:'} ${formatDepNote(note)}`)
  }

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
    // `??=` protege o valor, mas não a ausência intencional: num projeto que usa
    // npx sem ser distribuído, o script voltava a cada `init`. Só entra quando
    // `--dist` foi pedido de fato, nunca por inferência.
    if (distMode) pkg.scripts['rules:dist'] ??= `${base} build --standalone --out dist-claude/.claude`
  } else {
    pkg.scripts['rules:sync'] ??= 'node node_modules/vue-claude-rules/scripts/sync.mjs'
    pkg.scripts['rules:check'] ??= 'node node_modules/vue-claude-rules/scripts/sync.mjs --check'
    pkg.devDependencies['vue-claude-rules'] ??= `github:gabriellopesweber/vue-claude-rules#v${own.version}`
  }

  // Grava a lista granular, que é editável à mão depois (`npx vue-claude-rules
  // list` mostra os ids). Preset explícito continua gravado como `profile`, e
  // uma configuração que já existe não é convertida sem pedirem.
  if (profileOverride) {
    pkg.claudeRules = { profile: profileOverride }
  } else if (!pkg.claudeRules?.rules && !pkg.claudeRules?.profile) {
    pkg.claudeRules = { rules: selection.map((r) => r.id) }
  }

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  console.log(
    standalone
      ? '[init] package.json: scripts via npx, sem devDependency (modo distribuição)'
      : '[init] package.json: scripts, devDependency e claudeRules',
  )

  const inv = await inventory(cwd)
  const projectDir = join(cwd, '.claude', 'rules', 'project')
  await mkdir(projectDir, { recursive: true })

  // Só os catálogos que o profile declara — o sync semeia exatamente esses, e
  // gerar a mais deixa arquivo órfão que o CLAUDE.md não referencia.
  const allDrafts = inv
    ? {
        'catalog-ui.md': () => buildCatalogUi(inv, stack, refs),
        'catalog-composables.md': () => buildCatalogComposables(inv, stack, refs),
        'catalog-data.md': () => buildCatalogData(inv, stack, refs),
        'stack.md': () => buildStack(inv, stack, pkg, profile, refs),
      }
    : {}
  const drafts = Object.fromEntries(
    Object.entries(allDrafts)
      .filter(([name]) => refs.catalogs.includes(name))
      .map(([name, make]) => [name, make()]),
  )

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
  if (skipped.length) {
    // "Preservado" já significou só "o arquivo existe" — dizer "já preenchido"
    // sobre um arquivo cheio de TODO é sinal de conclusão falso.
    const withTodo = []
    for (const name of skipped) {
      const content = await readFile(join(projectDir, name), 'utf8')
      if (/\bTODO\b/.test(content)) withTodo.push(name)
    }
    console.log(`[init] project/ preservado (não sobrescrito): ${skipped.join(', ')}`)
    if (withTodo.length) console.log(`[init] ⚠️  ainda com TODO pendente: ${withTodo.join(', ')}`)
  }
  if (!inv) console.log('[init] sem src/ — catálogos não rascunhados')

  const claudeMd = join(cwd, 'CLAUDE.md')
  const claudeMdExists = existsSync(claudeMd)
  if (!claudeMdExists) {
    await writeFile(claudeMd, buildClaudeMd(pkg, stack, refs, selection, standalone), 'utf8')
    console.log('[init] CLAUDE.md gerado — tabela e regras universais filtradas pelas regras em uso')
  } else {
    console.log('[init] CLAUDE.md já existe — não tocado. Apague-o e rode de novo para gerar')
    console.log('       um novo a partir das regras em uso (guarde o atual antes, para comparar)')
  }

  if (!distMode && !alreadyNpx) {
    const signals = await looksDistributed(cwd, pkg, inv)
    if (signals.length) {
      console.log('')
      console.log(`[init] ⚠️  este projeto parece distribuído (${signals.join('; ')}).`)
      console.log('   Se for template/boilerplate entregue a terceiros, rode `init --dist`:')
      console.log('   a devDependency `github:` amarra o install de quem recebe ao seu repo.')
    }
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
