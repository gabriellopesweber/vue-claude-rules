import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATE = join(PKG_ROOT, 'scaffold', 'skills', 'SKILL.template.md')

/**
 * Gera o esqueleto de um skill em `.claude/skills/<slug>/SKILL.md`.
 *
 * O que o gerador entrega não é o skill pronto — é a **forma**: frontmatter com
 * `description` (que é o gatilho de invocação, e o que mais se esquece), passos
 * com verificação, parada antes do irreversível, e a seção de referências que
 * existe para o skill **citar** a regra em vez de copiar a política.
 *
 * Nada aqui é específico de projeto: o conteúdo dos passos é TODO de propósito.
 */

const slugify = (name) =>
  name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const listExisting = async (dir) => {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

export const runSkill = async ({ cwd, name, force = false, out = '.claude/skills' }) => {
  const skillsDir = join(cwd, out)

  if (!name) {
    const existing = await listExisting(skillsDir)
    console.error('[skill] falta o nome: npx vue-claude-rules skill "<o que se pede>"')
    console.error('[skill] o nome descreve o PEDIDO, não a implementação —')
    console.error('[skill]   "release para produção", não "orquestrador de tags".')
    if (existing.length) {
      console.error('')
      console.error(`[skill] skills já existentes em ${out}/:`)
      existing.forEach((s) => console.error(`  - ${s}`))
      console.error('[skill] um skill por procedimento: se um destes já cobre o fluxo,')
      console.error('[skill] acrescente o passo nele em vez de abrir outro.')
    }
    process.exit(1)
  }

  const slug = slugify(name)
  if (!slug) {
    console.error(`[skill] "${name}" não produz um nome de pasta utilizável.`)
    process.exit(1)
  }

  const target = join(skillsDir, slug, 'SKILL.md')
  if (existsSync(target) && !force) {
    console.error(`[skill] ${out}/${slug}/SKILL.md já existe — não vou sobrescrever.`)
    console.error('[skill] edite o arquivo, ou use --force se a intenção é recomeçar do zero.')
    process.exit(1)
  }

  const body = (await readFile(TEMPLATE, 'utf8')).replaceAll('{NOME}', name)

  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, body, 'utf8')

  console.log(`[skill] criado: ${out}/${slug}/SKILL.md`)
  console.log('')
  console.log('[skill] antes de commitar, preencha nesta ordem:')
  console.log('  1. `description` no frontmatter — é o que decide se o skill é invocado,')
  console.log('     e a única parte lida antes disso. Use as palavras do pedido.')
  console.log('  2. os passos, com comando completo e o que olhar na saída.')
  console.log('  3. a parada antes do irreversível (merge, deploy, envio), se houver.')
  console.log('  4. as referências — cite a regra, não copie a política.')
  console.log('')
  console.log('[skill] o critério de quando um skill vale a pena está na regra `skills`:')
  console.log('[skill]   npx vue-claude-rules list   (para carregá-la, inclua "skills" em claudeRules.rules)')
}
