---
name: {NOME}
description: TODO — use quando o usuário pedir "{…}", "{…}" ou "{…}". Escreva com as palavras do pedido, não com as da implementação: esta linha é o que decide se o skill é invocado.
---

# {NOME}

TODO — uma frase dizendo o que este procedimento entrega quando termina.

## Quando usar

- TODO — o pedido típico, na forma em que ele chega.
- TODO — a variação que também cai aqui.

## Quando **não** usar

- TODO — o caso vizinho que pertence a outro skill (nomeie-o).
- TODO — o caso que não tem julgamento nenhum e deveria ser um script.

## Pré-condições

- TODO — o que precisa estar verdadeiro antes do primeiro passo (branch limpo, sessão ativa,
  dependência instalada). Cada item com o comando que **verifica**, não só a afirmação.

## Passos

### 1. TODO — o que este passo consegue

```bash
TODO comando completo e copiável
```

TODO — o que olhar na saída para saber que deu certo. Se o passo já estava feito, o que fazer em vez
de repetir — comando que cria recurso costuma criar **e depois** falhar num passo acessório, e
repetir produz o segundo recurso.

### 2. TODO — o próximo passo

```bash
TODO comando
```

### 3. TODO — parada antes do irreversível

> Se este skill mescla, publica, apaga, implanta ou envia algo para fora: **pare aqui e pergunte**,
> com a pergunta escrita neste passo. E declare o gate — o que precisa estar verde para seguir, e a
> instrução explícita de **não seguir** se não estiver.

## Verificação

- TODO — o fato observável que prova que o procedimento terminou (um comando, uma URL, um estado).

## Referências

- TODO — as regras que este skill obedece, por caminho
  (ex.: `.claude/rules/project/{arquivo}.md`).

> **Cite, não copie.** O skill carrega o fio e a ordem; a política e o critério ficam na regra. Duas
> cópias divergem na primeira correção que só uma recebe — e quem lê o skill segue a versão velha
> sem nenhum sinal de que existe outra.
