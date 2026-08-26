# Regras de Feedback ao Usuário (toast, alerta persistente, inline)

> **Escopo:** esta regra descreve como **escolher** entre mecanismos de feedback que o projeto já tem. Ela **não** obriga a construir os três. Um site institucional que só precisa de um toast não deve ganhar um `useAlertManager` + `GlobalAlertStack` para "ficar completo" — construa o segundo mecanismo quando aparecer a primeira mensagem que precisa persistir, não antes.
>
> O que vale em qualquer projeto é a última linha: nunca `alert()`/`confirm()` nativos como UI.
>
> **Código base das três peças** em `scaffold/` — `useSnackbar` + `GlobalSnackbar.vue`, `useAlertManager` + `GlobalAlertStack.vue`, `InlineAlert.vue`. Adote sob demanda, na ordem em que a necessidade aparecer (ver `.claude/rules/shared/scaffold.md`).

Há **três** mecanismos. Escolha pela natureza da mensagem — não misture.
Os nomes concretos dos componentes/composables deste projeto estão em `.claude/rules/project/catalog-ui.md`.

## 1. Toast (`useSnackbar`) → feedback transitório de ação
`showMessage(text, type)` — toast curto que some sozinho. Para o **resultado de uma ação pontual**: salvo, excluído, atualizado, erro pontual de uma operação.
- Ex.: "Cadastro salvo", "Erro ao excluir".
- Fire-and-forget; não exige ação do usuário. **Não** usar para avisos que precisam persistir.

## 2. Stack global (`useAlertManager` + `GlobalAlertStack`) → alerta persistente/reativo de atenção
Stack flutuante (posição configurável), montado **globalmente uma única vez** no shell da app. Use para mensagens que **devem permanecer** até serem resolvidas ou dispensadas, e tipicamente **reativas** a um estado.

- `showAlert({ type, title, text, closable?, timeout?, actionLabel?, onAction? })` → retorna `id`; `dismiss(id)`; `updateAlert(id, patch)` muta título/texto/tipo ao vivo (ex.: progresso de um cronômetro). Passe `actionLabel` + `onAction` para um botão de ação dentro do alerta.
- **Comportamento por tipo:** `error` fixo (não some), `warning` persiste (closable), `success`/`info` somem. Para um `info`/`success` persistente, passe `timeout: 0`.
- **Delimitador de tempo:** passe `timeout` (ms) para qualquer alerta sumir sozinho — use em casos **pontuais/informativos**. **Não** colocar timeout em alertas **críticos** (bloqueado/expirado) nem **reativos** (conflito, estado inválido, setup incompleto) — esses devem persistir até a condição mudar.
- **Padrão reativo:** guardar o `id` num `ref`, **dispensar o anterior** antes de mostrar outro, e dispensar quando a condição some. Em views, **dispensar no `onUnmounted`** para o alerta não vazar para outras telas.
- **Responsivo:** vira barra inferior full-width no mobile — não deve cobrir a barra de ações do topo.
- Bons casos: conflito entre o que se tenta salvar e o que já existe, estado fora das regras de negócio, período de teste ou assinatura expirando, configuração obrigatória faltando, pendências que exigem atenção.

## 3. `InlineAlert` → mensagem ancorada a uma seção
Para a mensagem que só faz sentido **ao lado do campo/seção** que a originou, use o componente padronizado `InlineAlert` — **não** o `<v-alert>` cru da lib. Props: `type` (success/error/warning/info), `title`, `icon`, `dense`; conteúdo via slot default.
- Ex.: "excede o saldo do plano" dentro do card, badge de estado no formulário, info contextual de um campo. Mover esses para o stack flutuante **piora** a leitura (descola do contexto) — manter inline.

## O texto da mensagem de erro

*Vale onde o projeto consome uma API e traduz a interface. Sem uma das duas coisas, só a primeira
regra se aplica.*

**A mensagem técnica do servidor não vai para a tela.** Ela é escrita para quem depura: em inglês
quase sempre, com vocabulário de implementação, e numa interface traduzida chega no idioma errado.
Exibi-la é tentador porque é a linha mais curta de escrever — `catch (e) { show(e.response?.data?.message) }`
— e por isso reincide.

**Recusa distinguível chega com redação própria.** Quando o servidor sabe *qual* dos motivos foi, a
tela não os colapsa num texto único: cada motivo pede uma ação diferente, e a genérica costuma ser
"tente de novo", que é conselho impossível de seguir quando nada muda com o tempo.

> Um `400` que significa "corrija o formulário" e outro que significa "encerre o que está em curso antes"
> não podem sair iguais. Se saem, o problema é do servidor, e a tela não tem como consertá-lo — ela
> só pode escolher entre um texto genérico honesto e um específico que mente.

**Resolva a mensagem por convenção, com guarda de existência.** Em vez de um mapa literal por tela
— que diverge do vizinho —, monte a chave a partir do discriminador que o erro carrega e **confirme
que ela existe** antes de usá-la, caindo num texto de reserva quando não existir.

A guarda é o ponto, não um detalhe: numa lib de i18n típica, pedir uma chave inexistente devolve o
próprio caminho da chave, e o usuário lê `errors.foo_SOMETHING_NEW` na tela — pior que o texto
genérico. Sem ela, o código precisa de uma allow-list mantida à mão, que ninguém lembra de atualizar
e cujo esquecimento não dá erro.

> **O que é inventário, e por isso não está aqui:** qual campo do erro carrega o discriminador
> (`code`, status, `extensions`…), o formato da chave, e o nome do composable que faz a resolução.
> Isso muda com o backend e com a lib de i18n — está em `.claude/rules/project/`.

> [!warning] Chave montada em tempo de execução some do `grep`
> `errors.foo_${code}` não é encontrada por busca textual. A chave parece órfã numa limpeza de
> locale, e apagá-la não quebra nada visível — só faz a mensagem específica virar a genérica, em
> silêncio. Onde essa resolução for adotada, **um teste que afirme a existência das variantes em uso
> é o que substitui o grep**.

## Resumo de decisão
| Mensagem | Mecanismo |
|---|---|
| Resultado de ação (salvou/excluiu/erro pontual) | toast (`useSnackbar`) |
| Aviso persistente/reativo de atenção (não ancorado a um campo) | stack global (`useAlertManager`) |
| Mensagem ancorada a um campo/seção do formulário | `InlineAlert` |

**Nunca** usar `alert()`, `confirm()` nativos ou `console.error` como UI.
