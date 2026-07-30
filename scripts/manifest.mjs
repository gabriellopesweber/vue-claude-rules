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

/**
 * Duas perguntas diferentes, que antes eu tratava como uma:
 *
 *   `requires` — "esta regra faz sentido aqui?" `i18n` sem vue-i18n é inútil, o
 *     texto todo trata de `t()` e de `locales/`. Lista de alternativas: basta uma
 *     presente. Aviso forte.
 *
 *   `assumes` — "partes desta regra pressupõem esta ferramenta?" `services` com
 *     axios: a divisão service/composable vale igual com `fetch`; só os detalhes
 *     de interceptor e 401 não. Marcar como `requires` produzia falso negativo —
 *     a regra era aplicável, a dependência declarada não. Aviso fraco.
 *
 * Nenhum dos dois bloqueia: quem escolheu pode estar um passo antes de instalar.
 */
export const auditDeps = (rules, deps) => {
  const has = (name) => deps.includes(name)
  const notes = []
  for (const rule of rules) {
    const requires = rule.requires ?? []
    const assumes = rule.assumes ?? []
    if (requires.length && !requires.some(has)) {
      notes.push({ rule, level: 'requires', missing: requires })
    } else if (assumes.length && !assumes.some(has)) {
      notes.push({ rule, level: 'assumes', missing: assumes })
    }
  }
  return notes
}

export const formatDepNote = ({ rule, level, missing }) =>
  level === 'requires'
    ? `regra "${rule.id}" pressupõe ${missing.join(' ou ')}, que não está no projeto — o conteúdo dela pode não se aplicar aqui`
    : `regra "${rule.id}": partes dela pressupõem ${missing.join(' ou ')}, ausente — ver o preâmbulo de escopo em .claude/rules/shared/${rule.path.split('/').pop()}`

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

  const width = Math.max(...manifest.map((r) => r.id.length))
  const dep = (rule) => {
    const requires = (rule.requires ?? []).length ? `exige ${rule.requires.join('|')}` : ''
    const assumes = (rule.assumes ?? []).length ? `partes pressupõem ${rule.assumes.join('|')}` : ''
    const both = [requires, assumes].filter(Boolean).join('; ')
    return both ? `  (${both})` : ''
  }

  console.log('Regras disponíveis:')
  console.log('')
  for (const rule of manifest) {
    console.log(`  ${rule.id.padEnd(width)}  ${rule.summary}${dep(rule)}`)
  }

  console.log('')
  console.log('── Como escolher ────────────────────────────────────────────────')
  console.log('')
  console.log('Liste no package.json só o que o projeto pratica de fato:')
  console.log('')
  console.log('  "claudeRules": { "rules": ["vue", "dry", "vuetify", "i18n", "tests"] }')
  console.log('')
  console.log('Regra que o projeto não pratica é pior que regra faltando: manda o agente')
  console.log('seguir um padrão que não existe aqui, ou instalar dependência que ninguém')
  console.log('pediu. Sem suíte de teste, `tests` fora; sem vue-i18n, `i18n` fora.')
  console.log('')
  console.log('Na dúvida, não escolha à mão: `init` monta a lista a partir das')
  console.log('dependências que encontrar, e aí você ajusta.')
  console.log('')
  console.log('Os catálogos de .claude/rules/project/ são derivados das regras escolhidas.')

  console.log('')
  console.log('── Presets ──────────────────────────────────────────────────────')
  console.log('')
  console.log('Atalho para protótipo, ou quando ainda não se quer decidir. Escolher preset')
  console.log('quase sempre é pegar demais — o `spa-full` num projeto sem backend carrega')
  console.log('regra de repository e de i18n que não se aplicam. A lista granular vence.')
  console.log('')
  for (const profile of profiles) {
    const ids = resolveRules(manifest, profile.rules).rules.map((r) => r.id)
    console.log(`  ${profile.name.padEnd(9)}  ${ids.join(', ')}`)
  }
}
