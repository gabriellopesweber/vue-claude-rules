#!/usr/bin/env node
/**
 * Sincroniza as regras compartilhadas para o projeto consumidor.
 *
 *   node node_modules/vue-claude-rules/scripts/sync.mjs [--profile <nome>] [--check]
 *
 * - Copia rules/<profile> para .claude/rules/shared/ (achatado, com banner de origem)
 * - Remove de shared/ arquivos que saíram do profile
 * - Escreve .claude/rules/.rules-version
 * - Cria .claude/rules/project/ a partir de templates/ apenas se ainda não existir (nunca sobrescreve)
 * - --check: não escreve nada; sai com código 1 se shared/ estiver fora de sincronia
 */

import { existsSync } from 'node:fs'
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CWD = process.cwd()
const SHARED_DIR = join(CWD, '.claude', 'rules', 'shared')
const PROJECT_DIR = join(CWD, '.claude', 'rules', 'project')
const VERSION_FILE = join(CWD, '.claude', 'rules', '.rules-version')

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const flagIndex = args.indexOf('--profile')
const cliProfile = flagIndex !== -1 ? args[flagIndex + 1] : null

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

const resolveProfileName = async () => {
  if (cliProfile) return cliProfile
  const consumerPkg = join(CWD, 'package.json')
  if (existsSync(consumerPkg)) {
    const pkg = await readJson(consumerPkg)
    if (pkg.claudeRules?.profile) return pkg.claudeRules.profile
  }
  return 'spa-full'
}

const banner = (source, version) =>
  [
    '<!--',
    '  GERADO POR vue-claude-rules — NÃO EDITAR ESTE ARQUIVO.',
    `  Origem: ${source} @ ${version}`,
    '  Mudança de princípio → PR em github.com/gabriellopesweber/vue-claude-rules',
    '  Mudança específica do projeto → .claude/rules/project/',
    '-->',
    '',
  ].join('\n')

const main = async () => {
  const { version } = await readJson(join(PKG_ROOT, 'package.json'))
  const profileName = await resolveProfileName()
  const profilePath = join(PKG_ROOT, 'profiles', `${profileName}.json`)

  if (!existsSync(profilePath)) {
    console.error(`[rules] profile "${profileName}" não existe em profiles/`)
    process.exit(1)
  }

  const profile = await readJson(profilePath)
  const expected = new Map()

  for (const rulePath of profile.rules) {
    const basename = rulePath.split('/').pop()
    const body = await readFile(join(PKG_ROOT, 'rules', rulePath), 'utf8')
    expected.set(basename, banner(`rules/${rulePath}`, `v${version}`) + body)
  }

  if (checkOnly) {
    const problems = []
    for (const [name, content] of expected) {
      const target = join(SHARED_DIR, name)
      if (!existsSync(target)) problems.push(`faltando: ${name}`)
      else if ((await readFile(target, 'utf8')) !== content) problems.push(`divergente: ${name}`)
    }
    const current = existsSync(VERSION_FILE) ? (await readFile(VERSION_FILE, 'utf8')).trim() : '(ausente)'
    if (current !== `v${version}`) problems.push(`versão: ${current} ≠ v${version}`)

    if (problems.length) {
      console.error(`[rules] fora de sincronia (${profileName}):`)
      problems.forEach((p) => console.error(`  - ${p}`))
      console.error('[rules] rode: pnpm rules:sync')
      process.exit(1)
    }
    console.log(`[rules] ok — ${profileName} @ v${version}`)
    return
  }

  await mkdir(SHARED_DIR, { recursive: true })

  for (const [name, content] of expected) {
    await writeFile(join(SHARED_DIR, name), content, 'utf8')
  }

  const stale = (await readdir(SHARED_DIR)).filter((f) => f.endsWith('.md') && !expected.has(f))
  for (const file of stale) {
    await rm(join(SHARED_DIR, file))
  }

  await writeFile(VERSION_FILE, `v${version}\n`, 'utf8')

  await mkdir(PROJECT_DIR, { recursive: true })
  const seeded = []
  for (const catalog of profile.catalogs ?? []) {
    const target = join(PROJECT_DIR, catalog)
    if (existsSync(target)) continue
    await copyFile(join(PKG_ROOT, 'templates', catalog), target)
    seeded.push(catalog)
  }

  console.log(`[rules] ${profileName} @ v${version}`)
  console.log(`[rules] shared/: ${expected.size} arquivo(s)${stale.length ? `, ${stale.length} removido(s)` : ''}`)
  if (seeded.length) console.log(`[rules] project/ semeado: ${seeded.join(', ')}`)
  console.log('[rules] project/ preservado — inventário local não é tocado pelo sync')
}

main().catch((err) => {
  console.error('[rules] falhou:', err.message)
  process.exit(1)
})
