# Regras Vuetify

> **Escopo:** vale para projetos que usam **Vuetify** (verificado contra a 4.1.5). Noutra lib de UI o princípio ("cor só por token do tema, nunca hex no componente") continua valendo, mas os nomes de token e as props desta página não. Não instale Vuetify para "seguir a regra".
>
> Três seções são condicionais mesmo dentro do Vuetify: **Tema** (só onde há mais de um tema), **ApexCharts** (só onde `vue3-apexcharts` já é dependência) e **Autocomplete** (só onde há formulário).
>
> **Defaults de componente, paleta e tokens extras deste projeto:** `.claude/rules/project/stack.md`.

## Cores — sempre via token de tema

```css
/* ✅ */
color: rgb(var(--v-theme-primary));
background: rgba(var(--v-theme-surface), 0.9);
```
```css
/* ❌ */
color: #5C6BC0;                    /* hex no componente */
background: rgba(255, 255, 255, 0.8); /* branco literal: quebra no dark */
color: var(--minha-cor);           /* var fora do sistema de tema */
```

**Nenhuma cor hardcoded** em template, `<style>` ou JS. Cor que não existe como token é **adicionada ao tema**, não escrita no componente — senão ela não existe no outro tema, e o dark mode nasce quebrado.

O padrão é `rgb(var(--v-theme-{token}))` — a var guarda os canais (`0, 71, 141`), não uma cor pronta. É isso que permite `rgba(var(--v-theme-primary), 0.5)` para opacidade.

## Tokens

**Do tema padrão do Vuetify** — existem sem você declarar nada:

`background` · `surface` · `surface-bright` · `surface-light` · `surface-variant` · `on-surface-variant`
`primary` · `primary-darken-1` · `secondary` · `secondary-darken-1`
`error` · `info` · `success` · `warning`

**Gerados automaticamente:** para cada cor, o `on-{cor}` correspondente (`on-primary`, `on-surface`…) é calculado por contraste, se você não declarar. Não precisa definir à mão.

**Qualquer outro token é do seu projeto** e precisa estar declarado em `theme.themes.{light,dark}.colors` — **em todos os temas**. Nomes da paleta Material 3 (`surface-container-low`, `outline-variant`, `tertiary`, `secondary-container`) **não vêm no Vuetify**: se o projeto os usa, alguém os declarou. Ver `.claude/rules/project/stack.md` antes de usar um token que não está na lista acima; se não estiver lá, ele não existe.

**Tokens que não são cor** (opacidades, borda, sombra) ficam em `theme.themes.{tema}.variables` e são lidos como `var(--v-{nome})`, sem `theme-`:

`border-color` · `border-opacity` · `shadow-color` · `high-emphasis-opacity` · `medium-emphasis-opacity` · `disabled-opacity` · `hover-opacity` · `focus-opacity` · `selected-opacity` · `activated-opacity` · `pressed-opacity` · `dragged-opacity`

## Classes utilitárias de cor

Para cada token de cor o Vuetify gera três classes:

| Classe | Efeito |
|---|---|
| `bg-{token}` | `background-color` **e** `color` com o `on-{token}` correspondente |
| `text-{token}` | só `color` |
| `border-{token}` | cor da borda |

**`bg-*` já resolve o texto.** Depois de `bg-primary`, não acrescente classe de cor de texto: o contraste vem junto.

**Não existe `text-on-*`.** Para tokens `on-*` a classe gerada é o nome nu — `on-surface`, `on-primary` —, não `text-on-surface`. Escrever `text-on-surface` não faz nada e não avisa.

**`text-medium-emphasis` e `text-high-emphasis` derivam de `on-background`**, não de `on-surface`, via `color-mix` com a opacidade correspondente. Dentro de um container escuro sobre fundo claro (ou vice-versa) o resultado sai errado — nesse caso use `rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity))`.

## Defaults de componentes

Configurados **uma vez** no `defaults` do `createVuetify`. Se uma prop se repete em vários templates, ela pertence ao `defaults` — não ao template.

```js
createVuetify({
  defaults: {
    VCard: { rounded: 'lg', elevation: 0 },
    VTextField: { density: 'comfortable', variant: 'outlined' },
  },
})
```

**Não redeclarar** o que já é default sem motivo explícito: além do ruído, mascara a mudança quando o default muda. Para variar num escopo específico, use `<v-defaults-provider>` em volta do trecho, em vez de repetir prop a prop.

`density` aceita `'default'`, `'comfortable'` ou `'compact'` — a prop `dense` não existe mais (sobrevive só no `VRow`, já deprecada, apontando para `density`).

## Responsividade

```js
import { useDisplay } from 'vuetify'
const { mobile, smAndDown } = useDisplay()
```

Ocultar por breakpoint tem duas famílias, ambas válidas: `hidden-md-and-up` / `hidden-sm-and-down`, ou as de display (`d-none d-md-flex`). Prefira uma e mantenha.

**Empilhar as actions de um dialog em mobile: use `flex-column-reverse`, não reordene o markup.** O
botão de confirmação é o último no DOM, que é onde ele deve estar para a ordem de foco do teclado —
e no mobile ele precisa aparecer em cima. A classe resolve a apresentação sem tocar na ordem que o
teclado e o leitor de tela seguem; trocar os botões de lugar no template resolveria o visual e
quebraria os dois.

**Regra:** responsividade mora no componente base compartilhado, não em cada consumidor. Se o
dialog/header base já trata mobile, **não** repita `:block="mobile"` nem `:size="mobile ? … : …"`
nos filhos — é o mesmo raciocínio de `dry.md`.

## Tema

*Só onde há mais de um tema.*

O `defaultTheme` do Vuetify é `'system'`: sem configurar nada, a app já segue o modo do sistema operacional. Antes de construir toggle, veja se o que falta é só persistir a escolha do usuário.

- **Trocar de tema:** `theme.change('dark')`. Atribuir `theme.global.name.value` está **deprecado** — o próprio Vuetify emite aviso apontando para `change()`.
- Encapsule a troca num composable (`useAppTheme` ou equivalente) e chame-o das views, em vez de espalhar `useTheme()`. É lá que mora a persistência e a transição.
- Toda cor nova precisa entrar nos **dois** temas. Token declarado só no light desaparece no dark, sem erro.

## Fora do tema — integrações

> **Isto não é regra do Vuetify.** São duas coisas que esbarram no tema e por isso vivem aqui: uma
> é do navegador, a outra é de bibliotecas que recebem cor por valor. Ficam separadas porque um
> arquivo que diz a verdade sobre o framework não pode emprestar essa autoridade ao que é escolha
> de projeto.

### `autocomplete` nos campos

*Só onde há formulário. Vale igual fora do Vuetify — o que é da lib é só o `defaults`.*

Em formulários internos de CRUD, `autocomplete: 'off'` como default global evita que o navegador ofereça o e-mail de quem está logado num campo que pede o nome de outra pessoa.

**Exceção obrigatória — autenticação e dados pessoais do próprio usuário** precisam do valor semântico, senão gerenciadores de senha e autofill param de funcionar:

```html
<v-text-field autocomplete="email" … />
<v-text-field autocomplete="current-password" … />   <!-- login -->
<v-text-field autocomplete="new-password" … />       <!-- registro / troca -->
<v-text-field autocomplete="given-name" … />
<v-text-field autocomplete="family-name" … />
```

Nunca `autocomplete="on"` — sempre o valor semântico. O navegador ignora `off` em vários casos de propósito; `off` é redução de ruído, não garantia.

### Biblioteca de gráfico que não lê CSS var

*Escrito contra `vue3-apexcharts`, que é o caso já exercitado. Não é recomendação de biblioteca — o problema aparece em qualquer uma que receba cor por valor.*

O ApexCharts não lê CSS var: precisa de cor resolvida. Daí o padrão:

```js
const { isDark } = useAppTheme()

const themeColor = (token) =>
  `rgb(${getComputedStyle(document.documentElement).getPropertyValue(`--v-theme-${token}`).trim()})`

const options = computed(() => ({
  chart: { background: 'transparent', foreColor: isDark.value ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', fontFamily: 'inherit' },
  colors: [themeColor('primary')],
  grid: { borderColor: isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
  tooltip: { theme: isDark.value ? 'dark' : 'light' },
}))
```

```html
<ApexChart :key="isDark ? 'dark' : 'light'" type="bar" :options="options" :series="series" />
```

- **Nunca** `chart.theme.mode` — ele sobrescreve o array `colors`.
- `themeColor()` **dentro** do `computed`, para que `isDark` seja rastreado e as cores sejam relidas depois da troca de tema.
- O `:key` força remount na troca: sem ele o Apex mantém as cores antigas.
- Registrar o componente globalmente num plugin, não importar em cada view.
