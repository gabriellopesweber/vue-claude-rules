# Regras de Skills

> **Escopo:** projetos cujo agente lê `.claude/skills/` (Claude Code e equivalentes). Não é sobre o
> produto — é sobre a ferramenta que trabalha nele. Num repositório sem skills, esta regra não se
> aplica: não crie o primeiro skill por causa dela.
>
> **O esqueleto pronto** está em `scaffold/skills/SKILL.template.md`, escrito no lugar certo por `npx vue-claude-rules skill "<o que se pede>"`.

## Skill, regra, script, catálogo — quatro coisas diferentes

| Se o que você tem é | Isso é | Mora em |
|---|---|---|
| *"ao escrever código assim, decida assado"* — política, sempre válida | **regra** | `.claude/rules/` |
| *"execute estes passos, nesta ordem, com verificação"* — procedimento repetível | **skill** | `.claude/skills/<nome>/SKILL.md` |
| a mesma sequência **sem nenhum julgamento** | **script** | `package.json`, `Makefile`, `.sh` |
| *"o que já existe neste projeto"* | **catálogo** | `.claude/rules/project/catalog-ui.md` e irmãos |

O corte é o **julgamento**. Procedimento que o computador executa inteiro não precisa de agente:
vira script, e o skill — se existir — chama o script. Política que não tem passos não vira skill:
não há o que executar, e transformá-la em skill faz com que ela só seja lida quando alguém a invoca
— justamente o contrário do que uma política precisa.

## Skill aponta para a regra — não copia a política

Este é o erro que custa caro, porque só aparece meses depois: o skill **repete** o que a regra diz,
as duas cópias divergem na primeira correção que só uma recebe, e quem lê o skill segue a versão
velha sem nenhum sinal de que existe outra.

```md
<!-- ❌ o skill reescrevendo a política -->
Antes de mesclar, rode o audit. Se acusar vulnerabilidade alta, abra issue com prioridade 1,
atualize o pacote direto, e só use override se…

<!-- ✅ o skill citando o passo e apontando -->
**Gate obrigatório antes do merge:** rode o build seguro; se acusar vulnerabilidade, **não mescle**.
O procedimento completo (prioridade, ordem da correção, por que override é dívida) está em
`.claude/rules/project/dependencies.md`.
```

O skill carrega **o fio e a ordem**; a regra carrega o **porquê e o critério**. Quando o critério
mudar, muda num lugar só.

## Anatomia do `SKILL.md`

```md
---
name: Nome curto e legível
description: Use quando o usuário pedir X, Y ou Z. É isto que decide se o skill é invocado.
---

# <título>

<uma frase: o que este procedimento entrega>

## Quando usar · Quando não usar
## Pré-condições
## Passos          ← numerados, com o comando completo
## Verificação     ← como saber que funcionou
## Referências     ← as regras que este skill obedece
```

**A `description` é o gatilho, e é a única parte que o agente lê antes de decidir.** Escreva-a em
termos do que **o usuário vai pedir** — as palavras dele —, não do que o skill faz por dentro:

- ✅ *"Use quando pedirem para criar issue, abrir branch, commitar ou empurrar depois de implementar algo."*
- ❌ *"Automatiza o fluxo de versionamento com integração ao rastreador."*

> ⚠️ **Sem frontmatter o skill não some, mas some da busca.** O que sobra é o título, e a escolha
> passa a depender de o nome do arquivo lembrar o que a pessoa pediu. É um defeito silencioso: o
> skill existe, está correto, e simplesmente não é invocado no dia em que serviria.

## Passos que dá para executar

- **Comando completo e copiável.** "Faça o commit de sempre" não é passo — quem lê é um agente que
  não estava na conversa anterior.
- **Um passo, uma ação verificável.** Se o passo tem "e então", são dois.
- **Texto longo (corpo de mensagem, descrição, JSON) vai por arquivo ou heredoc**, nunca montado com
  concatenação no shell — é ali que acento vira `?` e aspas quebram o comando.
- **Diga o que fazer quando o passo já está feito.** O agente reentra no meio do procedimento mais
  vezes do que começa do zero.

> ⚠️ **Nunca escreva "se falhar, tente de novo".** Comando que cria recurso (issue, branch, PR,
> release) frequentemente **cria e só depois falha** num passo acessório — o retry produz o segundo
> recurso, e agora há dois. O passo certo é: **procure se já existe** e siga dali.

## Parada obrigatória antes do irreversível

Todo skill que mescla, publica, apaga, implanta ou envia mensagem para fora **para e pergunta** —
com a pergunta escrita no próprio passo, para ela não depender de o agente ter bom senso naquele
momento. Junto dela vai o **gate**: o que precisa estar verde antes de seguir, e a instrução
explícita de não seguir se não estiver.

## Nome e lugar

- `.claude/skills/<kebab-case>/SKILL.md` — uma pasta por procedimento.
- O nome descreve **o que se pede**, não o que acontece por dentro:
  `release-para-producao`, não `orquestrador-de-tags`.
- **Um skill por procedimento.** O que serve a três fluxos vira três seções condicionais e um passo
  que metade das invocações pula — o mesmo problema do composable "por pasta".
- Arquivo de apoio (template, script, checklist) fica **na pasta do skill**, referenciado por
  caminho relativo.

## Quando não criar

| Situação | O que fazer |
|---|---|
| a sequência não tem julgamento nenhum | script no `package.json`; o skill, se existir, o chama |
| é política, sem passos | regra em `.claude/rules/` |
| foi feito uma vez e não vai repetir | nada — skill é para o que repete |
| depende de credencial ou segredo | o skill **referencia** de onde vem; segredo não entra em arquivo versionado |
| já existe um skill que faz 80% disso | acrescente o passo nele, se for o mesmo procedimento — senão é outro skill |

## Anti-padrões

| Escrito assim | Por que dói |
|---|---|
| política copiada da regra para dentro do skill | duas cópias, e a correção só chega a uma |
| `description` que descreve a implementação | o agente não a associa ao pedido, e o skill nunca é invocado |
| passo com comando incompleto ("ajuste conforme o caso") | quem executa não tem o contexto que você tinha |
| "se der erro, rode de novo" | duplica o recurso que o comando já tinha criado |
| merge/deploy/envio sem parada explícita | o irreversível acontece por inércia |
| um skill para três fluxos parecidos | ramos condicionais que ninguém mantém |
| skill sem seção de verificação | "terminou" vira opinião do agente, não fato observável |
