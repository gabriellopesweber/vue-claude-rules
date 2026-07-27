import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Inventaria o projeto do consumidor para gerar o rascunho dos catálogos.
 *
 * Tudo aqui é heurístico e best-effort: o objetivo é dar ao humano (ou ao agente)
 * um ponto de partida com os nomes e assinaturas certos, não um catálogo pronto.
 * Todo campo que exige julgamento sai marcado com TODO.
 */

const read = async (path) => {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

const listFiles = async (dir, filter = () => true) => {
  const out = []
  const walk = async (current) => {
    let entries
    try {
      entries = await readdir(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'test' || entry.name === 'node_modules') continue
        await walk(full)
      } else if (filter(entry.name)) {
        out.push(full)
      }
    }
  }
  await walk(dir)
  return out
}

const rel = (root, path) => path.slice(root.length + 1).replace(/\\/g, '/')

/** Lê do índice de uma `{` até a `}` que a fecha, respeitando aninhamento. */
const readBalanced = (text, openIndex) => {
  let depth = 0
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') {
      depth--
      if (depth === 0) return text.slice(openIndex + 1, i)
    }
  }
  return null
}

/**
 * Extrai o bloco `defineProps({...})` e devolve os nomes + defaults declarados.
 * O corpo de cada prop é lido com balanceamento de chaves — `default: () => ({})`
 * quebrava um regex ingênuo.
 */
const parseProps = (source) => {
  const start = source.search(/defineProps\(\s*\{/)
  if (start === -1) return []
  const block = readBalanced(source, source.indexOf('{', start))
  if (!block) return []

  const props = []
  const namePattern = /(?:^|\n)\s*(\w+)\s*:\s*\{/g
  let match
  while ((match = namePattern.exec(block)) !== null) {
    const bodyStart = block.indexOf('{', match.index + match[0].length - 1)
    const body = readBalanced(block, bodyStart)
    if (body === null) continue
    const def = body.match(/default:\s*([\s\S]+?)\s*,?\s*$/)
    props.push({
      name: match[1],
      required: /required:\s*true/.test(body),
      default: def ? def[1].replace(/\s+/g, ' ').trim() : null,
    })
    namePattern.lastIndex = bodyStart + body.length
  }
  return props
}

const parseEmits = (source) => {
  const match = source.match(/defineEmits\(\s*\[([^\]]*)\]/)
  if (!match) return []
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(([, e]) => e)
}

const hasModel = (source) => /defineModel\(/.test(source)

const componentDoc = (source) => {
  const props = parseProps(source)
  const emits = parseEmits(source)
  const parts = []
  if (props.length) {
    parts.push(
      'Props: ' +
        props
          .map((p) => {
            if (p.required) return `\`${p.name}\` (required)`
            if (p.default && p.default !== 'null' && p.default !== "''" && p.default !== 'false') {
              return `\`${p.name}\` (default: ${p.default})`
            }
            return `\`${p.name}\``
          })
          .join(', '),
    )
  }
  if (emits.length) parts.push('Emits: ' + emits.map((e) => `\`${e}\``).join(', '))
  if (hasModel(source)) parts.push('v-model: sim')
  return parts
}

export const detectStack = (pkg) => {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const has = (name) => Object.keys(deps).some((d) => d === name)
  return {
    pinia: has('pinia'),
    axios: has('axios'),
    i18n: has('vue-i18n'),
    vitest: has('vitest'),
    vuetify: has('vuetify'),
    apex: has('vue3-apexcharts'),
    cypress: has('cypress'),
    playwright: has('@playwright/test'),
    persisted: has('pinia-plugin-persistedstate'),
  }
}

export const suggestProfile = (stack) => {
  if (stack.axios && stack.pinia) return stack.vitest ? 'spa-full' : 'spa'
  if (stack.i18n) return 'site'
  return 'minimal'
}

export const inventory = async (cwd) => {
  const src = join(cwd, 'src')
  if (!existsSync(src)) return null

  const uiDir = join(src, 'components', 'ui')
  const components = []
  for (const file of await listFiles(uiDir, (n) => n.endsWith('.vue'))) {
    const source = await read(file)
    if (!source) continue
    components.push({
      name: file.split(/[\\/]/).pop().replace('.vue', ''),
      lines: componentDoc(source),
    })
  }
  components.sort((a, b) => a.name.localeCompare(b.name))

  const composables = []
  for (const file of await listFiles(join(src, 'composables'), (n) => n.startsWith('use'))) {
    const path = rel(src, file)
    composables.push({
      name: file.split(/[\\/]/).pop().replace('.js', ''),
      scope: path.split('/').slice(1, -1).join('/') || '(raiz)',
    })
  }
  composables.sort((a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name))

  // Corpo de todo arquivo fora de repositories/, para achar repository órfão —
  // contrato pronto sem consumidor é intencional com frequência, e sem essa nota
  // alguém "conserta" achando que é código morto.
  const consumerSources = []
  for (const file of await listFiles(src, (n) => n.endsWith('.js') || n.endsWith('.vue'))) {
    if (rel(src, file).startsWith('repositories/')) continue
    consumerSources.push((await read(file)) ?? '')
  }
  const allConsumers = consumerSources.join('\n')

  const repositories = []
  for (const file of await listFiles(join(src, 'repositories'), (n) => n.endsWith('.js'))) {
    const source = (await read(file)) ?? ''
    const methods = [...source.matchAll(/^\s{2}(\w+)\s*:/gm)].map(([, m]) => m)
    const exported = source.match(/export const (\w+)/)?.[1]
    repositories.push({
      path: rel(src, file),
      methods,
      exported: exported ?? null,
      orphan: exported ? !allConsumers.includes(exported) : false,
    })
  }
  repositories.sort((a, b) => a.path.localeCompare(b.path))

  const services = (await listFiles(join(src, 'services'), (n) => n.startsWith('use'))).map((f) => rel(src, f)).sort()

  const viewServices = (await listFiles(join(src, 'views'), (n) => n.startsWith('use'))).map((f) => rel(src, f)).sort()

  const stores = []
  for (const file of await listFiles(join(src, 'stores'), (n) => n.endsWith('.js'))) {
    const source = (await read(file)) ?? ''
    const name = source.match(/export const (\w+) = defineStore/)?.[1]
    if (!name) continue
    const key = source.match(/key:\s*['"]([^'"]+)['"]/)?.[1]
    const pick = source.match(/pick:\s*\[([^\]]*)\]/)?.[1]
    stores.push({
      name,
      path: rel(src, file),
      key: key ?? null,
      pick: pick ? [...pick.matchAll(/['"]([^'"]+)['"]/g)].map(([, p]) => p) : [],
    })
  }
  stores.sort((a, b) => a.name.localeCompare(b.name))

  const validations = (await listFiles(join(src, 'validations', 'rules'), (n) => n.endsWith('.js')))
    .map((f) => f.split(/[\\/]/).pop().replace('.js', ''))
    .sort()

  let locales = []
  const localesDir = join(src, 'locales')
  if (existsSync(localesDir)) {
    try {
      const entries = await readdir(localesDir, { withFileTypes: true })
      locales = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort()
      if (!locales.length) locales = ['(arquivos na raiz de src/locales)']
    } catch {
      /* ignore */
    }
  }

  const localeFiles = (await listFiles(localesDir, (n) => n.endsWith('.json')))
    .map((f) => rel(src, f))
    .sort()

  // O plugin pode estar em vários lugares e com indentação qualquer — por isso
  // o bloco `defaults` é lido com balanceamento, não por regex de indentação.
  const vuetifyPlugin =
    (await read(join(src, 'plugins', 'vuetify.js'))) ??
    (await read(join(src, 'plugins', 'vuetify', 'index.js'))) ??
    (await read(join(src, 'plugins', 'vuetify.ts'))) ??
    null

  let vuetifyDefaults = []
  let vuetifyThemes = []
  if (vuetifyPlugin) {
    const start = vuetifyPlugin.search(/defaults\s*:\s*\{/)
    if (start !== -1) {
      const block = readBalanced(vuetifyPlugin, vuetifyPlugin.indexOf('{', start))
      if (block) {
        const namePattern = /(?:^|\n)\s*(V\w+)\s*:\s*\{/g
        let match
        while ((match = namePattern.exec(block)) !== null) {
          const bodyStart = block.indexOf('{', match.index + match[0].length - 1)
          const body = readBalanced(block, bodyStart)
          if (body === null) continue
          vuetifyDefaults.push({
            name: match[1],
            body: body
              .replace(/\/\*[\s\S]*?\*\//g, '')
              .replace(/\s*\/\/[^\n]*/g, '')
              .replace(/\s+/g, ' ')
              .replace(/,\s*$/, '')
              .trim(),
          })
          namePattern.lastIndex = bodyStart + body.length
        }
      }
    }

    const themeStart = vuetifyPlugin.search(/themes\s*:\s*\{/)
    if (themeStart !== -1) {
      const block = readBalanced(vuetifyPlugin, vuetifyPlugin.indexOf('{', themeStart))
      if (block) vuetifyThemes = [...block.matchAll(/(?:^|\n)\s*(\w+)\s*:\s*\{/g)].map(([, n]) => n)
    }
    const defaultTheme = vuetifyPlugin.match(/defaultTheme\s*:\s*['"](\w+)['"]/)?.[1] ?? null
    if (defaultTheme) vuetifyThemes = [...new Set([defaultTheme, ...vuetifyThemes])]
  }

  const apiSource = await read(join(src, 'services', 'api.js'))
  const api = apiSource
    ? {
        withCredentials: /withCredentials:\s*true/.test(apiSource),
        bearer: /Bearer/.test(apiSource),
        refresh: /refresh/i.test(apiSource),
        baseUrlEnv: apiSource.match(/import\.meta\.env\.(\w+)/)?.[1] ?? null,
        extraHeaders: [...apiSource.matchAll(/headers\[['"]([\w-]+)['"]\]/g)].map(([, h]) => h),
      }
    : null

  return {
    components,
    composables,
    repositories,
    services,
    viewServices,
    stores,
    validations,
    locales,
    localeFiles,
    vuetifyDefaults,
    vuetifyThemes,
    api,
    views: (await listFiles(join(src, 'views'), (n) => n.endsWith('.vue'))).length,
  }
}

/**
 * Sinais de que o repositório é distribuído (boilerplate, template à venda,
 * starter). Errar isso custa caro: a devDependency `github:` amarra o install
 * de quem recebe a um repo alheio — melhor avisar do que deixar descobrir.
 */
export const looksDistributed = async (cwd, pkg, inv) => {
  const reasons = []
  const name = `${pkg.name ?? ''}`
  if (/\b(kit|template|starter|boilerplate|skeleton|scaffold)\b/i.test(name)) {
    reasons.push(`nome do pacote ("${pkg.name}")`)
  }
  const readme = (await read(join(cwd, 'README.md'))) ?? ''
  if (/\b(template|boilerplate|starter|projeto base|ponto de partida|para iniciar)\b/i.test(readme)) {
    reasons.push('README descreve um ponto de partida')
  }
  if (inv && inv.views <= 2 && !inv.repositories.length) {
    reasons.push('poucas views e nenhuma camada de API')
  }
  return reasons
}
