import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Resolução de qual regra carregar.
 *
 * Um projeto raramente cabe num bucket pronto — um one-page com i18n e testes
 * não é `site` nem `spa-full`. Por isso a seleção é **granular por padrão**:
 * uma lista de ids. Os profiles continuam existindo como atalho para os casos
 * comuns, mas não são mais o mecanismo principal.
 */

export const loadManifest = async () => {
  const { rules } = JSON.parse(await readFile(join(PKG_ROOT, 'rules', 'manifest.json'), 'utf8'))
  return rules
}

/** `stack.md` sempre entra: é onde mora a configuração que as regras referenciam. */
const BASE_CATALOG = 'stack.md'

/** Aceita id curto (`tests`), caminho (`core/tests.md`) ou basename (`tests.md`). */
const findRule = (manifest, token) =>
  manifest.find((r) => r.id === token || r.path === token || r.path.split('/').pop() === token) ?? null

export const resolveRules = (manifest, tokens) => {
  const found = []
  const unknown = []
  for (const token of tokens) {
    const rule = findRule(manifest, token)
    if (rule) {
      if (!found.includes(rule)) found.push(rule)
    } else {
      unknown.push(token)
    }
  }
  return { rules: found, unknown }
}

/** Catálogos derivados das regras escolhidas — não é preciso listá-los à mão. */
export const catalogsFor = (rules) => {
  const set = new Set([BASE_CATALOG])
  for (const rule of rules) for (const catalog of rule.catalogs) set.add(catalog)
  const order = ['catalog-ui.md', 'catalog-composables.md', 'catalog-data.md', 'stack.md']
  return order.filter((c) => set.has(c))
}

/** Regras cuja dependência declarada não está no projeto — aviso, não erro. */
export const missingDeps = (rules, deps) =>
  rules
    .map((rule) => ({ rule, absent: rule.requires.filter((d) => !deps.includes(d)) }))
    .filter(({ absent }) => absent.length)

/**
 * Seleção derivada da stack — granular, sem passar por bucket. É o que o `init`
 * usa quando ninguém pediu um profile: cada regra entra porque o projeto tem a
 * dependência que ela pressupõe.
 */
export const rulesForStack = (manifest, stack) => {
  const wanted = ['vue', 'dry']
  if (stack.vuetify) wanted.push('vuetify')
  if (stack.pinia) wanted.push('composables')
  if (stack.axios) wanted.push('repositories', 'services')
  if (stack.i18n) wanted.push('i18n')
  if (stack.vitest) wanted.push('tests')
  // `feedback.md` só entra onde há stack de UI para escolher entre mecanismos.
  if (stack.vuetify && (stack.axios || stack.pinia)) wanted.push('feedback')
  return resolveRules(manifest, wanted).rules
}

export const listProfiles = async () => {
  const dir = join(PKG_ROOT, 'profiles')
  if (!existsSync(dir)) return []
  const out = []
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.json'))) {
    out.push(JSON.parse(await readFile(join(dir, file), 'utf8')))
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

export const printCatalog = async () => {
  const manifest = await loadManifest()
  const profiles = await listProfiles()

  console.log('Regras disponíveis — use o id na lista `claudeRules.rules` do package.json:')
  console.log('')
  const width = Math.max(...manifest.map((r) => r.id.length))
  for (const rule of manifest) {
    const requires = rule.requires.length ? `  (pressupõe ${rule.requires.join(', ')})` : ''
    console.log(`  ${rule.id.padEnd(width)}  ${rule.summary}${requires}`)
  }

  console.log('')
  console.log('Presets, para os casos comuns (`claudeRules.profile`):')
  console.log('')
  for (const profile of profiles) {
    const ids = resolveRules(manifest, profile.rules).rules.map((r) => r.id)
    console.log(`  ${profile.name.padEnd(9)}  ${ids.join(', ')}`)
  }

  console.log('')
  console.log('Granular vence o preset. Exemplo — one-page com i18n e testes:')
  console.log('')
  console.log('  "claudeRules": { "rules": ["vue", "dry", "vuetify", "i18n", "tests"] }')
  console.log('')
  console.log('Os catálogos de .claude/rules/project/ são derivados das regras escolhidas.')
}
