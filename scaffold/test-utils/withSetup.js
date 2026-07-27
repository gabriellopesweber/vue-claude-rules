import { createApp } from 'vue'

/**
 * Monta um composable dentro de um componente host para que watchers `pre`/`post`
 * e os hooks de ciclo de vida (`onMounted`/`onUnmounted`) funcionem nos testes.
 * Requer ambiente jsdom. `app.unmount()` dispara `onUnmounted`.
 *
 * @param {() => any} composable
 * @returns {[any, import('vue').App]} [retorno do composable, app]
 */
export function withSetup(composable) {
  let result
  const app = createApp({
    setup() {
      result = composable()
      return () => {}
    },
  })
  app.mount(document.createElement('div'))
  return [result, app]
}
