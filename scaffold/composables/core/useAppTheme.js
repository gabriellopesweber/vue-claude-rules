import { computed } from 'vue'
import { useTheme } from 'vuetify'

import { useUiStore } from '@/stores/ui'

const TRANSITION_DURATION = 600

export function useAppTheme() {
  const theme = useTheme()
  const uiStore = useUiStore()

  const isDark = computed(() => uiStore.theme === 'dark')

  const toggleTheme = () => {
    const next = isDark.value ? 'light' : 'dark'
    document.documentElement.classList.add('theme-transitioning')
    theme.change(next)
    uiStore.setTheme(next)
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
    }, TRANSITION_DURATION)
  }

  const initTheme = () => {
    const saved = uiStore.theme
    if (saved === 'light' || saved === 'dark') {
      theme.change(saved)
    }
  }

  return { isDark, toggleTheme, initTheme }
}
