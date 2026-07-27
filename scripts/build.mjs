import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Gera um `.claude/rules/` autocontido para DISTRIBUIÇÃO — um template vendido,
 * um boilerplate, um repo entregue a um cliente.
 *
 * A divisão shared/project só faz sentido para quem consome o upstream. Quem
 * recebe o produto não tem upstream: para ele, isso é uma pasta só, sem banner
 * de "não editar", sem menção ao repositório de origem, sem processo alheio.
 */

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

// Catálogos viram documentação do projeto, não "camada de inventário".
const CATALOG_RENAME = {
  'catalog-ui.md': 'components.md',
  'catalog-composables.md': 'state.md',
  'catalog-data.md': 'data.md',
  'stack.md': 'stack.md',
}

/** Termos que não podem sobrar no que vai para o cliente. */
const LEAK_PATTERNS = [
  [/vue-claude-rules/gi, 'nome do pacote upstream'],
  [/gabriellopesweber/gi, 'conta do autor'],
  [/rules:sync|rules:check/g, 'script de sincronização'],
  [/rules\/shared\/|rules\/project\//g, 'caminho da divisão shared/project'],
  [/node_modules\//g, 'caminho de node_modules'],
  [/\bTODO\b/g, 'TODO não preenchido'],
  [/Medispace/g, 'nome de projeto interno'],
]

const rewrite = (text) => {
  let out = text

  // Referências entre arquivos: a hierarquia some, tudo vira irmão.
  out = out.replace(/`?\.claude\/rules\/shared\/([\w.-]+)`?/g, '`.claude/rules/$1`')
  for (const [from, to] of Object.entries(CATALOG_RENAME)) {
    out = out.replace(
      new RegExp(`\`?\\.claude/rules/project/${from.replace('.', '\\.')}\`?`, 'g'),
      `\`.claude/rules/${to}\``,
    )
  }
  out = out.replace(/`?\.claude\/rules\/project\/([\w.-]+)`?/g, '`.claude/rules/$1`')

  // Referências curtas — `shared/tests.md`, `project/stack.md` — aparecem no texto
  // corrido com a mesma frequência que as completas.
  out = out.replace(/`shared\/([\w.-]+\.md)`/g, '`.claude/rules/$1`')
  for (const [from, to] of Object.entries(CATALOG_RENAME)) {
    out = out.replace(new RegExp(`\`project/${from.replace('.', '\\.')}\``, 'g'), `\`.claude/rules/${to}\``)
  }
  out = out.replace(/`project\/([\w.-]+\.md)`/g, '`.claude/rules/$1`')

  // Blockquotes de processo do upstream (sync, PR no repo de regras, banner).
  out = out
    .split('\n')
    .filter((line) => !/^>?\s*\*\*Atualizar no mesmo PR\*\*/.test(line))
    .filter((line) => !/PR (no|em) `?vue-claude-rules/i.test(line))
    .filter((line) => !/rascunho gerado a partir do código/i.test(line))
    .join('\n')

  // O scaffold não acompanha a distribuição — a referência viraria caminho morto.
  out = out.replace(
    /\s*\(ver `\.claude\/rules\/scaffold\.md`\)/g,
    '',
  )
  out = out.replace(
    /—?\s*ver `\.claude\/rules\/scaffold\.md`/g,
    '',
  )
  out = out.replace(
    /^.*`?\.claude\/rules\/scaffold\.md`?.*$/gm,
    '',
  )
  out = out.replace(/^.*node_modules\/vue-claude-rules\/scaffold.*$/gm, '')

  // Remover uma linha de dentro de um blockquote deixa `>` órfão. Só sobrevive
  // o `>` que de fato separa dois parágrafos da mesma citação.
  const lines = out.split('\n')
  const cleaned = []
  for (let i = 0; i < lines.length; i++) {
    if (!/^>\s*$/.test(lines[i])) {
      cleaned.push(lines[i])
      continue
    }
    const prev = cleaned[cleaned.length - 1]
    const next = lines[i + 1]
    const isQuoteText = (line) => line !== undefined && /^>/.test(line) && !/^>\s*$/.test(line)
    if (isQuoteText(prev) && isQuoteText(next)) cleaned.push('>')
  }

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trimStart()
}

const standaloneClaudeMd = (projectName, ruleFiles) => {
  const has = (name) => ruleFiles.includes(name)
  const rows = [
    ['Criar/editar componentes `.vue`, props, emits, template', 'vue.md'],
    ['Reutilização de UI, evitar duplicação, extrair componentes', 'dry.md'],
    ['Componentes já existentes — checar antes de criar', 'components.md'],
    ['Feedback ao usuário: toast, alerta, inline', 'feedback.md'],
    ['Cores, tokens de tema, layout mobile, componentes Vuetify', 'vuetify.md'],
    ['Composables, stores, lógica compartilhada', 'composables.md'],
    ['Composables e stores já existentes', 'state.md'],
    ['Services e camada HTTP', 'services.md'],
    ['Repositories e endpoints', 'repositories.md'],
    ['Repositories e services já existentes', 'data.md'],
    ['Texto visível ao usuário, traduções', 'i18n.md'],
    ['Testes', 'tests.md'],
    ['Configuração da stack: auth, tema, locales, scripts', 'stack.md'],
  ].filter(([, file]) => has(file))

  return [
    `# ${projectName}`,
    '',
    'Convenções de arquitetura deste projeto. Este arquivo é lido automaticamente por agentes de código (Claude Code e equivalentes) — mantenha-o atualizado e o agente seguirá a arquitetura em vez de inventar a própria.',
    '',
    '## Carregar regras conforme o contexto da tarefa',
    '',
    '| Tarefa envolve | Leia antes de agir |',
    '|---|---|',
    ...rows.map(([task, file]) => `| ${task} | \`.claude/rules/${file}\` |`),
    '',
    '## Regras universais (sempre aplicar)',
    '- Sempre `<script setup>` — sem Options API, sem `export default {}`',
    '- Nenhuma cor hardcoded — usar `rgb(var(--v-theme-*))` ou classes do tema',
    '- Nunca chamar axios diretamente em componentes ou views — sempre via repository',
    '- Verificar o que já existe antes de criar componente, composable ou chave de tradução',
    '',
    '## Mantendo isto vivo',
    '',
    'Os arquivos de catálogo (`components.md`, `state.md`, `data.md`) listam o que já existe no projeto. Ao criar ou renomear um componente, composable ou endpoint, atualize o catálogo correspondente no mesmo commit — catálogo desatualizado faz o agente duplicar código que já existe.',
    '',
  ].join('\n')
}

export const runBuild = async ({ cwd, out, projectName }) => {
  const sharedDir = join(cwd, '.claude', 'rules', 'shared')
  const projectDir = join(cwd, '.claude', 'rules', 'project')

  if (!existsSync(sharedDir)) {
    console.error('[build] .claude/rules/shared/ não existe. Rode o sync antes.')
    process.exit(1)
  }

  const outDir = resolve(cwd, out)
  const rulesOut = join(outDir, 'rules')
  await rm(rulesOut, { recursive: true, force: true })
  await mkdir(rulesOut, { recursive: true })

  const emitted = []
  const leaks = []

  const emit = async (name, source) => {
    const content = rewrite(source)
    for (const [pattern, label] of LEAK_PATTERNS) {
      const found = content.match(pattern)
      if (found) leaks.push({ file: name, label, sample: found[0], count: found.length })
    }
    await writeFile(join(rulesOut, name), content, 'utf8')
    emitted.push(name)
  }

  for (const file of await readdir(sharedDir)) {
    if (!file.endsWith('.md')) continue
    if (file === 'scaffold.md') continue // não acompanha a distribuição
    const raw = await readFile(join(sharedDir, file), 'utf8')
    // Tira o banner de "gerado — não editar": no destino não há gerador.
    await emit(file, raw.replace(/^<!--[\s\S]*?-->\n*/, ''))
  }

  if (existsSync(projectDir)) {
    for (const file of await readdir(projectDir)) {
      if (!file.endsWith('.md')) continue
      const raw = await readFile(join(projectDir, file), 'utf8')
      await emit(CATALOG_RENAME[file] ?? file, raw)
    }
  }

  const pkg = existsSync(join(cwd, 'package.json')) ? await readJson(join(cwd, 'package.json')) : {}
  const name = projectName ?? pkg.name ?? 'Projeto'
  await writeFile(join(outDir, '..', 'CLAUDE.md'), standaloneClaudeMd(name, emitted), 'utf8')

  console.log(`[build] standalone em ${out}`)
  console.log(`[build] ${emitted.length} regra(s): ${emitted.sort().join(', ')}`)
  console.log('[build] CLAUDE.md autocontido gerado ao lado')

  if (leaks.length) {
    console.log('')
    console.error('[build] ⚠️  vazamentos no material que vai ao cliente:')
    for (const leak of leaks) {
      console.error(`  ${leak.file}: ${leak.label} — "${leak.sample}"${leak.count > 1 ? ` (${leak.count}x)` : ''}`)
    }
    console.error('')
    console.error('[build] corrija na origem (.claude/rules/project/) e rode de novo.')
    process.exit(1)
  }

  console.log('[build] sem vazamentos ✓')
}
