#!/usr/bin/env node
import { runBuild } from './build.mjs'
import { runInit } from './init.mjs'
import { printCatalog } from './manifest.mjs'
import { runSkill } from './skill.mjs'

const [command, ...rest] = process.argv.slice(2)

const flag = (name) => {
  const index = rest.indexOf(`--${name}`)
  return index === -1 ? null : rest[index + 1]
}

const usage = () => {
  console.log(`vue-claude-rules

  list                                lista as regras disponíveis e os presets
  init [--profile <nome>] [--dist] [--force]
                                      detecta a stack, rascunha .claude/rules/project/ e prepara o package.json
  sync [--profile <nome>]             copia as regras para .claude/rules/shared/
  sync --check                        falha se shared/ divergir ou a adoção estiver incompleta
  build --standalone [--out <dir>]    gera um .claude/ autocontido para distribuição
                                      (template à venda, boilerplate, entrega a cliente)
  skill "<o que se pede>" [--force]   cria .claude/skills/<slug>/SKILL.md a partir do esqueleto
                                      (frontmatter, passos com verificação, parada e referências)

Adoção guiada por agente: veja ADOPTING.md no pacote.`)
}

switch (command) {
  case 'list':
    await printCatalog()
    break
  case 'init':
    await runInit({
      cwd: process.cwd(),
      force: rest.includes('--force'),
      profileOverride: flag('profile'),
      distMode: rest.includes('--dist'),
    })
    break
  case 'sync':
    process.argv = [process.argv[0], process.argv[1], ...rest]
    await import('./sync.mjs')
    break
  case 'build':
    if (!rest.includes('--standalone')) {
      console.error('[build] só existe o modo --standalone hoje.')
      process.exit(1)
    }
    await runBuild({
      cwd: process.cwd(),
      out: flag('out') ?? 'dist-claude/.claude',
      projectName: flag('name'),
    })
    break
  case 'skill':
    await runSkill({
      cwd: process.cwd(),
      name: rest.find((arg) => !arg.startsWith('--')) ?? null,
      force: rest.includes('--force'),
      out: flag('out') ?? '.claude/skills',
    })
    break
  default:
    usage()
    process.exit(command ? 1 : 0)
}
